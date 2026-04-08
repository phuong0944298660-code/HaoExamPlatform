"""
E2E测试配置 - pytest fixtures

提供测试环境配置、数据库连接、客户端等共享资源
"""

import asyncio
import os
import sys
import uuid
from datetime import datetime, timedelta
from typing import AsyncGenerator, Dict, List, Optional

import httpx
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

# 确保app模块可导入
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.core.database import Base


# ============================================================================
# 测试配置
# ============================================================================

class TestConfig:
    """E2E测试配置"""
    
    # API基础URL
    BASE_URL = os.getenv("E2E_TEST_BASE_URL", "http://localhost:8000")
    API_PREFIX = "/api/v1"
    
    # 测试数据库（使用独立测试数据库）
    TEST_DATABASE_URL = os.getenv(
        "E2E_TEST_DATABASE_URL",
        "mysql+aiomysql://root:rootpass@localhost:3306/jieli_edu_test"
    )
    
    # Redis配置
    TEST_REDIS_URL = os.getenv(
        "E2E_TEST_REDIS_URL",
        "redis://localhost:6379/15"  # 使用数据库15进行测试
    )
    
    # 测试超时
    DEFAULT_TIMEOUT = 30
    
    # 并发测试配置
    CONCURRENT_USERS = int(os.getenv("E2E_CONCURRENT_USERS", "50"))
    MAX_CONCURRENT_USERS = int(os.getenv("E2E_MAX_CONCURRENT_USERS", "1000"))
    
    # 测试数据清理
    CLEANUP_AFTER_TEST = os.getenv("E2E_CLEANUP", "true").lower() == "true"


# ============================================================================
# pytest配置
# ============================================================================

def pytest_configure(config):
    """pytest全局配置"""
    config.addinivalue_line("markers", "e2e: 标记为端到端测试")
    config.addinivalue_line("markers", "slow: 标记为慢速测试（需要较长时间）")
    config.addinivalue_line("markers", "concurrent: 标记为并发测试")
    config.addinivalue_line("markers", "performance: 标记为性能测试")
    config.addinivalue_line("markers", "activation: 标记为激活码相关测试")
    config.addinivalue_line("markers", "exam: 标记为考试相关测试")


@pytest.fixture(scope="session")
def event_loop():
    """提供session级别的事件循环"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ============================================================================
# HTTP客户端 fixtures
# ============================================================================

@pytest_asyncio.fixture(scope="function")
async def async_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """创建异步HTTP客户端"""
    async with httpx.AsyncClient(
        base_url=f"{TestConfig.BASE_URL}{TestConfig.API_PREFIX}",
        timeout=TestConfig.DEFAULT_TIMEOUT,
        headers={"Content-Type": "application/json"}
    ) as client:
        yield client


@pytest_asyncio.fixture(scope="function")
async def authenticated_client() -> AsyncGenerator[Dict, None]:
    """创建已认证的HTTP客户端上下文"""
    async with httpx.AsyncClient(
        base_url=f"{TestConfig.BASE_URL}{TestConfig.API_PREFIX}",
        timeout=TestConfig.DEFAULT_TIMEOUT,
        headers={"Content-Type": "application/json"}
    ) as client:
        yield {
            "client": client,
            "token": None,
            "user_id": None,
            "user_info": None
        }


# ============================================================================
# 数据库 fixtures
# ============================================================================

@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """创建测试数据库引擎"""
    engine = create_async_engine(
        TestConfig.TEST_DATABASE_URL,
        echo=False,
        pool_size=10,
        max_overflow=20
    )
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def test_db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """创建测试数据库会话"""
    async_session = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )
    
    async with async_session() as session:
        async with session.begin():
            yield session
            await session.rollback()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_database(test_engine):
    """设置测试数据库"""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    if TestConfig.CLEANUP_AFTER_TEST:
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)


# ============================================================================
# 测试数据 fixtures
# ============================================================================

@pytest.fixture(scope="function")
def test_admin_credentials() -> Dict:
    """测试管理员账号凭证"""
    return {
        "account": "admin_test",
        "password": "Admin123!",
        "role": "admin"
    }


@pytest.fixture(scope="function")
def test_teacher_credentials() -> Dict:
    """测试教师账号凭证"""
    return {
        "account": "teacher_test",
        "password": "Teacher123!",
        "role": "teacher"
    }


@pytest.fixture(scope="function")
def test_student_credentials() -> Dict:
    """测试学生账号凭证"""
    return {
        "account": "450000200001011234",
        "password": "Student123!",
        "role": "student"
    }


@pytest.fixture(scope="function")
def test_question_bank_data() -> Dict:
    """测试题库数据"""
    return {
        "name": f"测试题库_{uuid.uuid4().hex[:8]}",
        "description": "用于E2E测试的题库",
        "grade_group": "primary"
    }


@pytest.fixture(scope="function")
def test_single_choice_question() -> Dict:
    """测试单选题数据"""
    return {
        "content": "下列哪个选项是正确的？",
        "images": [],
        "question_type": "single_choice",
        "options": [
            {"label": "A", "content": "选项A"},
            {"label": "B", "content": "选项B"},
            {"label": "C", "content": "选项C"},
            {"label": "D", "content": "选项D"}
        ],
        "correct_answer": "A",
        "default_score": 2.0,
        "answer_analysis": "这是解析",
        "difficulty": "easy",
        "tags": ["基础", "测试"]
    }


@pytest.fixture(scope="function")
def test_multi_choice_question() -> Dict:
    """测试多选题数据"""
    return {
        "content": "下列哪些选项是正确的？（多选）",
        "images": [],
        "question_type": "multi_choice",
        "options": [
            {"label": "A", "content": "选项A"},
            {"label": "B", "content": "选项B"},
            {"label": "C", "content": "选项C"},
            {"label": "D", "content": "选项D"}
        ],
        "correct_answer": "A,B",
        "scoring_rules": {
            "full_score": 3.0,
            "partial_score": 1.5,
            "wrong_score": 0,
            "partial_mode": "fixed"
        },
        "default_score": 3.0,
        "answer_analysis": "选择A和B都是正确的",
        "difficulty": "medium",
        "tags": ["多选", "测试"]
    }


@pytest.fixture(scope="function")
def test_judgment_question() -> Dict:
    """测试判断题数据"""
    return {
        "content": "地球是圆的。",
        "images": [],
        "question_type": "judgment",
        "correct_answer": "T",
        "default_score": 1.0,
        "answer_analysis": "地球确实是近似球形的",
        "difficulty": "easy",
        "tags": ["常识", "测试"]
    }


@pytest.fixture(scope="function")
def test_subjective_question() -> Dict:
    """测试主观题数据"""
    return {
        "content": "请简述你对人工智能的理解。",
        "images": [],
        "question_type": "subjective",
        "default_score": 10.0,
        "answer_analysis": "这是一道开放性问题",
        "difficulty": "medium",
        "tags": ["主观题", "AI"]
    }


@pytest.fixture(scope="function")
def test_paper_data() -> Dict:
    """测试套卷数据"""
    return {
        "name": f"测试套卷_{uuid.uuid4().hex[:8]}",
        "description": "用于E2E测试的套卷",
        "grade_group": "primary"
    }


@pytest.fixture(scope="function")
def test_exam_data() -> Dict:
    """测试考试数据"""
    start_time = datetime.now() + timedelta(minutes=5)
    end_time = start_time + timedelta(hours=2)
    
    return {
        "name": f"E2E测试考试_{uuid.uuid4().hex[:8]}",
        "description": "用于E2E测试的考试",
        "grade_group": "primary",
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "duration": 90,
        "student_list": [
            {
                "identity_no": "450000200001011234",
                "name": "测试学生1",
                "school": "测试学校"
            },
            {
                "identity_no": "450000200001021235",
                "name": "测试学生2",
                "school": "测试学校"
            }
        ],
        "allow_ip_check": False,
        "max_login_devices": 1
    }


# ============================================================================
# 辅助函数 fixtures
# ============================================================================

@pytest.fixture(scope="function")
def generate_idempotency_key() -> str:
    """生成幂等性Key"""
    return f"test_{uuid.uuid4().hex}"


@pytest.fixture(scope="function")
def get_auth_headers():
    """获取认证请求头"""
    def _get_headers(token: str) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    return _get_headers


# ============================================================================
# 测试上下文管理
# ============================================================================

class TestContext:
    """测试上下文管理器"""
    
    def __init__(self):
        self.data: Dict = {}
        self.tokens: Dict[str, str] = {}
        self.ids: Dict[str, int] = {}
        self.timestamps: Dict[str, datetime] = {}
    
    def set(self, key: str, value):
        self.data[key] = value
    
    def get(self, key: str, default=None):
        return self.data.get(key, default)
    
    def set_token(self, role: str, token: str):
        self.tokens[role] = token
    
    def get_token(self, role: str) -> Optional[str]:
        return self.tokens.get(role)
    
    def set_id(self, entity: str, id_value: int):
        self.ids[entity] = id_value
    
    def get_id(self, entity: str) -> Optional[int]:
        return self.ids.get(entity)
    
    def clear(self):
        self.data.clear()
        self.tokens.clear()
        self.ids.clear()
        self.timestamps.clear()


@pytest.fixture(scope="function")
def test_context() -> TestContext:
    """提供测试上下文"""
    context = TestContext()
    yield context
    context.clear()


# ============================================================================
# 性能测试 fixtures
# ============================================================================

@pytest.fixture(scope="session")
def performance_thresholds() -> Dict:
    """性能测试阈值配置"""
    return {
        "api_response_time": {
            "p50": 0.1,
            "p95": 0.5,
            "p99": 1.0,
        },
        "concurrent_users": {
            "low": 100,
            "medium": 500,
            "high": 1000,
        },
        "throughput": {
            "min_rps": 100,
        },
        "error_rate": {
            "max": 0.01,
        }
    }


@pytest.fixture(scope="function")
def response_time_collector():
    """响应时间收集器"""
    times: List[float] = []
    
    def add_time(duration: float):
        times.append(duration)
    
    def get_stats() -> Dict:
        if not times:
            return {}
        
        sorted_times = sorted(times)
        n = len(sorted_times)
        
        return {
            "count": n,
            "min": min(times),
            "max": max(times),
            "avg": sum(times) / n,
            "p50": sorted_times[int(n * 0.5)],
            "p95": sorted_times[int(n * 0.95)] if n > 20 else sorted_times[-1],
            "p99": sorted_times[int(n * 0.99)] if n > 100 else sorted_times[-1],
        }
    
    yield {"add": add_time, "get_stats": get_stats, "times": times}


# ============================================================================
# 测试清理 fixtures
# ============================================================================

@pytest.fixture(scope="function", autouse=True)
async def cleanup_test_data(async_client):
    """测试数据清理"""
    created_items = []
    
    yield created_items
    
    if TestConfig.CLEANUP_AFTER_TEST and created_items:
        for item in reversed(created_items):
            try:
                if item.get("type") == "exam":
                    await async_client.delete(f"/exams/{item['id']}")
                elif item.get("type") == "paper":
                    await async_client.delete(f"/papers/{item['id']}")
                elif item.get("type") == "question":
                    await async_client.delete(f"/questions/{item['id']}")
                elif item.get("type") == "bank":
                    await async_client.delete(f"/questions/banks/{item['id']}")
            except Exception:
                pass
