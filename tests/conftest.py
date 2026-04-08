"""
pytest配置文件 - 测试数据库配置和Fixtures

测试数据库使用SQLite内存模式，避免依赖外部MySQL服务。
通过monkeypatch替换数据库引擎和Redis客户端。
"""

# =============================================================================
# 测试环境补丁 - 必须在任何app模块导入之前执行
# =============================================================================
import os
os.environ["APP_ENV"] = "testing"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["REDIS_URL"] = "redis://localhost:6379/15"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["JWT_EXPIRE_DAYS"] = "1"

# 在导入任何app模块之前，先补丁SQLAlchemy配置
import sqlalchemy.ext.asyncio
from sqlalchemy import NullPool

_original_create_async_engine = sqlalchemy.ext.asyncio.create_async_engine

def _patched_create_async_engine(url, **kwargs):
    """测试环境下移除不兼容的参数"""
    url_str = str(url)
    if "sqlite" in url_str:
        kwargs.pop("pool_size", None)
        kwargs.pop("max_overflow", None)
        kwargs["poolclass"] = NullPool
        kwargs.pop("pool_recycle", None)
    return _original_create_async_engine(url, **kwargs)

sqlalchemy.ext.asyncio.create_async_engine = _patched_create_async_engine

import asyncio
import uuid
from datetime import datetime, timedelta
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import NullPool, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# 导入应用组件
from app.core.database import Base, get_db
from app.core.auth import create_access_token, hash_password
from app.core.redis import redis_helper
from app.main import app as fastapi_app
from app.models.account import Account, AccountType, ActivationCode, GradeGroup, UserRole
from app.models.question import Question, QuestionBank, QuestionType, DifficultyLevel, QuestionBankStats
from app.models.exam import Exam, ExamStatus, StudentExamAssignment, AssignmentStatus, ExamRealtimeStats


# =============================================================================
# 数据库配置
# =============================================================================

# 测试用异步SQLite引擎
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# 创建测试引擎
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    poolclass=NullPool,
)

# 测试会话工厂
TestingSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_test_db():
    """初始化测试数据库表结构"""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_test_db():
    """删除测试数据库表"""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# =============================================================================
# Fixtures
# =============================================================================

@pytest_asyncio.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """创建会话级别的事件循环"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def db_engine():
    """创建测试数据库引擎（会话级别）"""
    await init_test_db()
    yield test_engine
    await drop_test_db()
    await test_engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """
    创建测试数据库会话
    
    每个测试函数使用独立的事务，测试结束后回滚，保持数据库干净。
    """
    async with TestingSessionLocal() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    创建HTTP测试客户端
    
    使用依赖注入覆盖，将数据库会话替换为测试会话。
    """
    # 覆盖get_db依赖
    async def override_get_db():
        yield db_session

    fastapi_app.dependency_overrides[get_db] = override_get_db

    # 创建异步HTTP客户端
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    # 清理依赖覆盖
    fastapi_app.dependency_overrides.clear()


# =============================================================================
# 测试数据 Fixtures
# =============================================================================

@pytest_asyncio.fixture
async def test_admin_user(db_session: AsyncSession) -> Account:
    """创建测试管理员账号"""
    user = Account(
        account_type=AccountType.PRACTICE,
        grade_group=GradeGroup.PRIMARY,
        role=UserRole.ADMIN,
        username="admin_test",
        hashed_password=hash_password("admin123"),
        name="测试管理员",
        is_activated=True,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_teacher_user(db_session: AsyncSession) -> Account:
    """创建测试教师账号"""
    user = Account(
        account_type=AccountType.PRACTICE,
        grade_group=GradeGroup.JUNIOR,
        role=UserRole.TEACHER,
        username="teacher_test",
        hashed_password=hash_password("teacher123"),
        name="测试教师",
        school="测试中学",
        contact_phone="13800138000",
        is_activated=True,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_student_user(db_session: AsyncSession) -> Account:
    """创建测试学生账号（练习账号）"""
    user = Account(
        account_type=AccountType.PRACTICE,
        grade_group=GradeGroup.PRIMARY,
        role=UserRole.STUDENT,
        username="student_test",
        hashed_password=hash_password("student123"),
        name="测试学生",
        school="测试小学",
        is_activated=True,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_exam_student(db_session: AsyncSession) -> Account:
    """创建测试考试学生账号（使用身份证号）"""
    user = Account(
        account_type=AccountType.EXAM,
        grade_group=GradeGroup.PRIMARY,
        role=UserRole.STUDENT,
        identity_no="450101201001011234",
        username="450101201001011234",  # 考试账号用身份证号作为用户名
        hashed_password=hash_password("exam123"),
        name="考试学生",
        school="考试小学",
        is_activated=True,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_unactivated_user(db_session: AsyncSession) -> Account:
    """创建未激活的测试账号"""
    user = Account(
        account_type=AccountType.PRACTICE,
        grade_group=GradeGroup.PRIMARY,
        role=UserRole.STUDENT,
        username="unactivated_test",
        hashed_password=hash_password("test123"),
        name="未激活用户",
        is_activated=False,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_disabled_user(db_session: AsyncSession) -> Account:
    """创建已禁用的测试账号"""
    user = Account(
        account_type=AccountType.PRACTICE,
        grade_group=GradeGroup.PRIMARY,
        role=UserRole.STUDENT,
        username="disabled_test",
        hashed_password=hash_password("test123"),
        name="已禁用用户",
        is_activated=True,
        is_active=False,  # 禁用状态
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_activation_code_primary(db_session: AsyncSession) -> ActivationCode:
    """创建小学学段测试激活码"""
    code = ActivationCode(
        code="ACT-PRI-A1B2C3D4",
        grade_group=GradeGroup.PRIMARY,
        user_role=UserRole.STUDENT,
        distribution_type="offline",
        is_used=False,
    )
    db_session.add(code)
    await db_session.commit()
    await db_session.refresh(code)
    return code


@pytest_asyncio.fixture
async def test_activation_code_junior(db_session: AsyncSession) -> ActivationCode:
    """创建初中学段测试激活码"""
    code = ActivationCode(
        code="ACT-JUN-E5F6G7H8",
        grade_group=GradeGroup.JUNIOR,
        user_role=UserRole.STUDENT,
        distribution_type="offline",
        is_used=False,
    )
    db_session.add(code)
    await db_session.commit()
    await db_session.refresh(code)
    return code


@pytest_asyncio.fixture
async def test_question_bank(db_session: AsyncSession, test_teacher_user: Account) -> QuestionBank:
    """创建测试题库"""
    bank = QuestionBank(
        name="测试题库",
        description="这是一个测试题库",
        grade_group=GradeGroup.PRIMARY,
        status="published",
        created_by=test_teacher_user.id,
    )
    db_session.add(bank)
    await db_session.commit()
    await db_session.refresh(bank)
    
    # 创建统计记录
    stats = QuestionBankStats(bank_id=bank.id)
    db_session.add(stats)
    await db_session.commit()
    
    return bank


@pytest_asyncio.fixture
async def test_question_bank_junior(db_session: AsyncSession, test_teacher_user: Account) -> QuestionBank:
    """创建初中测试题库"""
    bank = QuestionBank(
        name="初中测试题库",
        description="这是一个初中测试题库",
        grade_group=GradeGroup.JUNIOR,
        status="published",
        created_by=test_teacher_user.id,
    )
    db_session.add(bank)
    await db_session.commit()
    await db_session.refresh(bank)
    
    # 创建统计记录
    stats = QuestionBankStats(bank_id=bank.id)
    db_session.add(stats)
    await db_session.commit()
    
    return bank


@pytest_asyncio.fixture
async def test_question_single(db_session: AsyncSession, test_question_bank: QuestionBank, test_teacher_user: Account) -> Question:
    """创建单选题测试题目"""
    question = Question(
        content="2 + 2 等于多少？",
        question_type=QuestionType.SINGLE_CHOICE,
        options=[
            {"label": "A", "content": "3"},
            {"label": "B", "content": "4"},
            {"label": "C", "content": "5"},
            {"label": "D", "content": "6"},
        ],
        correct_answer="B",
        default_score=2.0,
        difficulty=DifficultyLevel.EASY,
        tags=["数学", "基础运算"],
        question_bank_id=test_question_bank.id,
        created_by=test_teacher_user.id,
    )
    db_session.add(question)
    await db_session.commit()
    await db_session.refresh(question)
    return question


@pytest_asyncio.fixture
async def test_question_multi(db_session: AsyncSession, test_question_bank: QuestionBank, test_teacher_user: Account) -> Question:
    """创建多选题测试题目"""
    question = Question(
        content="以下哪些是编程语言？",
        question_type=QuestionType.MULTI_CHOICE,
        options=[
            {"label": "A", "content": "Python"},
            {"label": "B", "content": "Java"},
            {"label": "C", "content": "HTML"},
            {"label": "D", "content": "C++"},
        ],
        correct_answer="ABD",
        scoring_rules={
            "full_score": 3.0,
            "partial_score": 1.0,
            "wrong_score": 0,
            "partial_mode": "fixed",
        },
        default_score=3.0,
        difficulty=DifficultyLevel.MEDIUM,
        tags=["计算机", "编程"],
        question_bank_id=test_question_bank.id,
        created_by=test_teacher_user.id,
    )
    db_session.add(question)
    await db_session.commit()
    await db_session.refresh(question)
    return question


@pytest_asyncio.fixture
async def test_question_judgment(db_session: AsyncSession, test_question_bank: QuestionBank, test_teacher_user: Account) -> Question:
    """创建判断题测试题目"""
    question = Question(
        content="地球是太阳系中的第三颗行星。",
        question_type=QuestionType.JUDGMENT,
        correct_answer="T",
        default_score=1.0,
        difficulty=DifficultyLevel.EASY,
        tags=["地理", "天文"],
        question_bank_id=test_question_bank.id,
        created_by=test_teacher_user.id,
    )
    db_session.add(question)
    await db_session.commit()
    await db_session.refresh(question)
    return question


@pytest_asyncio.fixture
async def test_question_subjective(db_session: AsyncSession, test_question_bank: QuestionBank, test_teacher_user: Account) -> Question:
    """创建主观题测试题目"""
    question = Question(
        content="请简述光合作用的过程。",
        question_type=QuestionType.SUBJECTIVE,
        default_score=10.0,
        difficulty=DifficultyLevel.MEDIUM,
        tags=["生物", "植物"],
        question_bank_id=test_question_bank.id,
        created_by=test_teacher_user.id,
    )
    db_session.add(question)
    await db_session.commit()
    await db_session.refresh(question)
    return question


@pytest_asyncio.fixture
async def test_exam(
    db_session: AsyncSession, 
    test_teacher_user: Account,
    test_student_user: Account,
    test_exam_student: Account,
) -> Exam:
    """创建测试考试"""
    start_time = datetime.utcnow() - timedelta(hours=1)  # 已经开始
    end_time = datetime.utcnow() + timedelta(hours=2)    # 还未结束
    
    exam = Exam(
        name="测试期末考试",
        description="这是一个测试考试",
        paper_ids=[1, 2],  # A卷和B卷
        paper_snapshot={
            "papers": {
                "1": {
                    "id": 1,
                    "name": "A卷",
                    "total_questions": 3,
                    "total_score": 6.0,
                    "questions": [
                        {
                            "question_id": 1,
                            "order": 1,
                            "score": 2.0,
                            "content": "2 + 2 等于多少？",
                            "question_type": "single_choice",
                            "options": [
                                {"label": "A", "content": "3"},
                                {"label": "B", "content": "4"},
                            ],
                            "correct_answer": "B",
                        },
                        {
                            "question_id": 2,
                            "order": 2,
                            "score": 3.0,
                            "content": "以下哪些是编程语言？",
                            "question_type": "multi_choice",
                            "options": [
                                {"label": "A", "content": "Python"},
                                {"label": "B", "content": "Java"},
                                {"label": "D", "content": "C++"},
                            ],
                            "correct_answer": "ABD",
                            "scoring_rules": {"partial_mode": "fixed", "partial_score": 1.0, "wrong_score": 0},
                        },
                        {
                            "question_id": 3,
                            "order": 3,
                            "score": 1.0,
                            "content": "地球是太阳系中的第三颗行星。",
                            "question_type": "judgment",
                            "correct_answer": "T",
                        },
                    ],
                },
                "2": {
                    "id": 2,
                    "name": "B卷",
                    "total_questions": 3,
                    "total_score": 6.0,
                    "questions": [
                        {
                            "question_id": 4,
                            "order": 1,
                            "score": 2.0,
                            "content": "3 + 3 等于多少？",
                            "question_type": "single_choice",
                            "options": [
                                {"label": "A", "content": "5"},
                                {"label": "B", "content": "6"},
                            ],
                            "correct_answer": "B",
                        },
                        {
                            "question_id": 5,
                            "order": 2,
                            "score": 3.0,
                            "content": "以下哪些是数据库？",
                            "question_type": "multi_choice",
                            "options": [
                                {"label": "A", "content": "MySQL"},
                                {"label": "B", "content": "Redis"},
                                {"label": "C", "content": "MongoDB"},
                            ],
                            "correct_answer": "AC",
                            "scoring_rules": {"partial_mode": "fixed", "partial_score": 1.0, "wrong_score": 0},
                        },
                        {
                            "question_id": 6,
                            "order": 3,
                            "score": 1.0,
                            "content": "水在标准大气压下沸点是100度。",
                            "question_type": "judgment",
                            "correct_answer": "T",
                        },
                    ],
                },
            }
        },
        grade_group=GradeGroup.PRIMARY,
        start_time=start_time,
        end_time=end_time,
        duration=120,  # 2小时
        student_list=[
            {"identity_no": test_student_user.username, "name": test_student_user.name, "school": test_student_user.school},
            {"identity_no": test_exam_student.identity_no, "name": test_exam_student.name, "school": test_exam_student.school},
        ],
        max_students=100,
        enrolled_count=2,
        status=ExamStatus.OPEN,
        created_by=test_teacher_user.id,
        published_at=datetime.utcnow(),
    )
    db_session.add(exam)
    await db_session.commit()
    await db_session.refresh(exam)
    
    # 创建学生考试分配记录
    for account, paper_id in [(test_student_user, 1), (test_exam_student, 2)]:
        assignment = StudentExamAssignment(
            exam_id=exam.id,
            account_id=account.id,
            assigned_paper_id=paper_id,
            status=AssignmentStatus.NOT_STARTED,
        )
        db_session.add(assignment)
    
    # 创建考试实时统计
    stats = ExamRealtimeStats(
        exam_id=exam.id,
        total_students=2,
    )
    db_session.add(stats)
    await db_session.commit()
    
    return exam


@pytest_asyncio.fixture
async def test_draft_exam(db_session: AsyncSession, test_teacher_user: Account) -> Exam:
    """创建草稿状态测试考试"""
    start_time = datetime.utcnow() + timedelta(days=1)
    end_time = datetime.utcnow() + timedelta(days=1, hours=2)
    
    exam = Exam(
        name="草稿测试考试",
        description="这是一个草稿状态的测试考试",
        paper_ids=[1],
        paper_snapshot={"papers": {}},
        grade_group=GradeGroup.PRIMARY,
        start_time=start_time,
        end_time=end_time,
        duration=60,
        status=ExamStatus.DRAFT,
        created_by=test_teacher_user.id,
    )
    db_session.add(exam)
    await db_session.commit()
    await db_session.refresh(exam)
    return exam


# =============================================================================
# 认证辅助 Fixtures
# =============================================================================

@pytest_asyncio.fixture
def admin_token(test_admin_user: Account) -> str:
    """生成管理员JWT Token"""
    return create_access_token({
        "sub": str(test_admin_user.id),
        "role": test_admin_user.role.value,
        "type": test_admin_user.account_type.value,
    })


@pytest_asyncio.fixture
def teacher_token(test_teacher_user: Account) -> str:
    """生成教师JWT Token"""
    return create_access_token({
        "sub": str(test_teacher_user.id),
        "role": test_teacher_user.role.value,
        "type": test_teacher_user.account_type.value,
    })


@pytest_asyncio.fixture
def student_token(test_student_user: Account) -> str:
    """生成学生JWT Token"""
    return create_access_token({
        "sub": str(test_student_user.id),
        "role": test_student_user.role.value,
        "type": test_student_user.account_type.value,
    })


@pytest_asyncio.fixture
def exam_student_token(test_exam_student: Account) -> str:
    """生成考试学生JWT Token"""
    return create_access_token({
        "sub": str(test_exam_student.id),
        "role": test_exam_student.role.value,
        "type": test_exam_student.account_type.value,
    })


@pytest_asyncio.fixture
def auth_headers_admin(admin_token: str) -> dict:
    """管理员认证请求头"""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest_asyncio.fixture
def auth_headers_teacher(teacher_token: str) -> dict:
    """教师认证请求头"""
    return {"Authorization": f"Bearer {teacher_token}"}


@pytest_asyncio.fixture
def auth_headers_student(student_token: str) -> dict:
    """学生认证请求头"""
    return {"Authorization": f"Bearer {student_token}"}


@pytest_asyncio.fixture
def auth_headers_exam_student(exam_student_token: str) -> dict:
    """考试学生认证请求头"""
    return {"Authorization": f"Bearer {exam_student_token}"}


# =============================================================================
# Redis 清理 Fixture
# =============================================================================

@pytest_asyncio.fixture(autouse=True)
async def clean_redis():
    """每个测试前清理Redis测试数据库"""
    try:
        # 清理测试数据库中的所有键
        keys = await redis_helper.client.keys("*")
        if keys:
            await redis_helper.client.delete(*keys)
    except Exception:
        pass  # Redis可能未启动，忽略错误
    yield
    try:
        # 测试后再次清理
        keys = await redis_helper.client.keys("*")
        if keys:
            await redis_helper.client.delete(*keys)
    except Exception:
        pass
