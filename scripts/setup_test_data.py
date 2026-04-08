#!/usr/bin/env python3
"""
接力教育智慧云平台 - 测试数据准备脚本
Jieli Education Smart Cloud Platform - Test Data Setup Script

功能：
1. 创建测试数据库
2. 导入测试数据
3. 创建测试账号
"""

import argparse
import asyncio
import os
import sys
from datetime import datetime, timedelta
from typing import Optional

# 添加项目根目录到路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# SQLAlchemy 相关导入
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# 尝试导入项目模块
try:
    from app.core.config import get_settings
    from app.core.database import Base, get_db
    from app.models.account import Account, AccountType
    from app.models.exam import Exam, ExamStatus, ExamType
    from app.models.paper import Paper, PaperStatus
    from app.models.question import Question, QuestionType, QuestionDifficulty
    from app.core.auth import get_password_hash
    IMPORTS_OK = True
except ImportError as e:
    print(f"警告: 无法导入项目模块: {e}")
    IMPORTS_OK = False


# 测试数据库配置
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "mysql+aiomysql://root:rootpass@localhost:3307/jieli_edu_test"
)

# 测试账号数据
TEST_ACCOUNTS = [
    {
        "username": "admin",
        "password": "admin123",
        "name": "系统管理员",
        "account_type": "admin",
        "school": "接力教育",
    },
    {
        "username": "teacher1",
        "password": "teacher123",
        "name": "测试教师",
        "account_type": "teacher",
        "school": "南宁市第一中学",
    },
    {
        "username": "student1",
        "password": "student123",
        "name": "测试学生",
        "account_type": "student",
        "school": "南宁市第一中学",
        "student_id": "2024001001",
    },
    {
        "username": "student2",
        "password": "student123",
        "name": "李同学",
        "account_type": "student",
        "school": "南宁市第一中学",
        "student_id": "2024001002",
    },
]

# 测试试卷数据
TEST_PAPERS = [
    {
        "name": "2024年春季数学测试",
        "subject": "数学",
        "grade": "高一",
        "duration": 120,
        "total_score": 150,
        "status": "published",
    },
    {
        "name": "2024年春季英语测试",
        "subject": "英语",
        "grade": "高一",
        "duration": 120,
        "total_score": 150,
        "status": "published",
    },
]

# 测试题目数据
TEST_QUESTIONS = [
    {
        "content": "1 + 1 = ?",
        "question_type": "single_choice",
        "difficulty": "easy",
        "score": 5,
        "options": '["A. 1", "B. 2", "C. 3", "D. 4"]',
        "correct_answer": "B",
        "subject": "数学",
    },
    {
        "content": "下列哪个是质数？",
        "question_type": "single_choice",
        "difficulty": "medium",
        "score": 5,
        "options": '["A. 4", "B. 6", "C. 7", "D. 9"]',
        "correct_answer": "C",
        "subject": "数学",
    },
]

# 测试考试数据
TEST_EXAMS = [
    {
        "name": "2024年春季期中考试",
        "exam_type": "regular",
        "status": "not_started",
        "start_time": "2024-06-01 09:00:00",
        "end_time": "2024-06-01 11:00:00",
    },
]


class TestDataSetup:
    """测试数据设置类"""

    def __init__(self, database_url: str = TEST_DATABASE_URL):
        self.database_url = database_url
        self.sync_database_url = database_url.replace("+aiomysql", "+pymysql")
        self.engine = None
        self.SessionLocal = None

    async def init_async(self):
        """初始化异步引擎"""
        self.engine = create_async_engine(
            self.database_url,
            echo=False,
            pool_pre_ping=True,
        )
        self.SessionLocal = sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )

    def init_sync(self):
        """初始化同步引擎（用于创建数据库）"""
        self.engine = create_engine(
            self.sync_database_url,
            echo=False,
            pool_pre_ping=True,
        )

    async def create_database(self) -> bool:
        """创建测试数据库"""
        try:
            # 使用同步连接创建数据库
            db_name = self.database_url.split("/")[-1]
            base_url = self.sync_database_url.rsplit("/", 1)[0] + "/"
            
            engine = create_engine(base_url, echo=False)
            with engine.connect() as conn:
                conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
                conn.commit()
            engine.dispose()
            
            print(f"✅ 数据库创建成功: {db_name}")
            return True
        except Exception as e:
            print(f"❌ 数据库创建失败: {e}")
            return False

    async def drop_database(self) -> bool:
        """删除测试数据库"""
        try:
            db_name = self.database_url.split("/")[-1]
            base_url = self.sync_database_url.rsplit("/", 1)[0] + "/"
            
            engine = create_engine(base_url, echo=False)
            with engine.connect() as conn:
                conn.execute(text(f"DROP DATABASE IF EXISTS {db_name}"))
                conn.commit()
            engine.dispose()
            
            print(f"✅ 数据库删除成功: {db_name}")
            return True
        except Exception as e:
            print(f"❌ 数据库删除失败: {e}")
            return False

    async def create_tables(self) -> bool:
        """创建数据库表"""
        if not IMPORTS_OK:
            print("⚠️ 无法导入项目模块，跳过表创建")
            return False

        try:
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("✅ 数据表创建成功")
            return True
        except Exception as e:
            print(f"❌ 数据表创建失败: {e}")
            return False

    async def drop_tables(self) -> bool:
        """删除数据库表"""
        if not IMPORTS_OK:
            print("⚠️ 无法导入项目模块，跳过表删除")
            return False

        try:
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.drop_all)
            print("✅ 数据表删除成功")
            return True
        except Exception as e:
            print(f"❌ 数据表删除失败: {e}")
            return False

    async def create_test_accounts(self) -> bool:
        """创建测试账号"""
        if not IMPORTS_OK:
            print("⚠️ 无法导入项目模块，跳过账号创建")
            return False

        try:
            async with self.SessionLocal() as session:
                for account_data in TEST_ACCOUNTS:
                    # 检查账号是否已存在
                    existing = await session.get(Account, account_data["username"])
                    if existing:
                        print(f"⚠️ 账号已存在: {account_data['username']}")
                        continue

                    # 创建账号
                    account = Account(
                        username=account_data["username"],
                        hashed_password=get_password_hash(account_data["password"]),
                        name=account_data["name"],
                        account_type=account_data["account_type"],
                        school=account_data.get("school"),
                        student_id=account_data.get("student_id"),
                        is_active=True,
                    )
                    session.add(account)
                    print(f"✅ 创建账号: {account_data['username']} ({account_data['name']})")

                await session.commit()
            return True
        except Exception as e:
            print(f"❌ 创建测试账号失败: {e}")
            return False

    async def create_test_papers(self) -> bool:
        """创建测试试卷"""
        if not IMPORTS_OK:
            print("⚠️ 无法导入项目模块，跳过试卷创建")
            return False

        try:
            async with self.SessionLocal() as session:
                for paper_data in TEST_PAPERS:
                    paper = Paper(
                        name=paper_data["name"],
                        subject=paper_data["subject"],
                        grade=paper_data["grade"],
                        duration=paper_data["duration"],
                        total_score=paper_data["total_score"],
                        status=paper_data["status"],
                        created_by="admin",
                    )
                    session.add(paper)
                    print(f"✅ 创建试卷: {paper_data['name']}")

                await session.commit()
            return True
        except Exception as e:
            print(f"❌ 创建测试试卷失败: {e}")
            return False

    async def create_test_questions(self) -> bool:
        """创建测试题目"""
        if not IMPORTS_OK:
            print("⚠️ 无法导入项目模块，跳过题目创建")
            return False

        try:
            async with self.SessionLocal() as session:
                # 获取第一张试卷
                from sqlalchemy import select
                result = await session.execute(select(Paper).limit(1))
                paper = result.scalar_one_or_none()

                for question_data in TEST_QUESTIONS:
                    question = Question(
                        content=question_data["content"],
                        question_type=question_data["question_type"],
                        difficulty=question_data["difficulty"],
                        score=question_data["score"],
                        options=question_data["options"],
                        correct_answer=question_data["correct_answer"],
                        subject=question_data["subject"],
                        paper_id=paper.id if paper else None,
                        created_by="admin",
                    )
                    session.add(question)
                    print(f"✅ 创建题目: {question_data['content'][:30]}...")

                await session.commit()
            return True
        except Exception as e:
            print(f"❌ 创建测试题目失败: {e}")
            return False

    async def create_test_exams(self) -> bool:
        """创建测试考试"""
        if not IMPORTS_OK:
            print("⚠️ 无法导入项目模块，跳过考试创建")
            return False

        try:
            async with self.SessionLocal() as session:
                from sqlalchemy import select
                
                # 获取第一张试卷
                result = await session.execute(select(Paper).limit(1))
                paper = result.scalar_one_or_none()

                for exam_data in TEST_EXAMS:
                    exam = Exam(
                        name=exam_data["name"],
                        exam_type=exam_data["exam_type"],
                        status=exam_data["status"],
                        start_time=datetime.strptime(exam_data["start_time"], "%Y-%m-%d %H:%M:%S"),
                        end_time=datetime.strptime(exam_data["end_time"], "%Y-%m-%d %H:%M:%S"),
                        paper_id=paper.id if paper else None,
                        created_by="admin",
                    )
                    session.add(exam)
                    print(f"✅ 创建考试: {exam_data['name']}")

                await session.commit()
            return True
        except Exception as e:
            print(f"❌ 创建测试考试失败: {e}")
            return False

    async def setup_all(self) -> bool:
        """设置所有测试数据"""
        print("\n" + "=" * 60)
        print("开始设置测试数据...")
        print("=" * 60 + "\n")

        # 创建数据库
        if not await self.create_database():
            return False

        # 初始化异步引擎
        await self.init_async()

        # 创建表
        if not await self.create_tables():
            return False

        # 创建测试数据
        await self.create_test_accounts()
        await self.create_test_papers()
        await self.create_test_questions()
        await self.create_test_exams()

        print("\n" + "=" * 60)
        print("测试数据设置完成！")
        print("=" * 60)
        print("\n测试账号:")
        for account in TEST_ACCOUNTS:
            print(f"  用户名: {account['username']:<15} 密码: {account['password']:<15} 角色: {account['account_type']}")

        return True

    async def cleanup(self) -> bool:
        """清理测试数据"""
        print("\n" + "=" * 60)
        print("开始清理测试数据...")
        print("=" * 60 + "\n")

        await self.drop_database()

        print("\n测试数据清理完成！")
        return True

    async def close(self):
        """关闭连接"""
        if self.engine:
            await self.engine.dispose()


def print_usage():
    """打印使用说明"""
    print("""
接力教育智慧云平台 - 测试数据设置工具

用法:
    python setup_test_data.py [命令] [选项]

命令:
    setup       设置测试数据（默认）
    cleanup     清理测试数据
    reset       重置测试数据（清理后重新设置）

选项:
    --database-url  指定数据库 URL
    --test-env      使用测试环境配置
    --help          显示帮助信息

示例:
    python setup_test_data.py setup
    python setup_test_data.py cleanup
    python setup_test_data.py reset
    python setup_test_data.py setup --database-url "mysql+aiomysql://user:pass@localhost:3306/test_db"
""")


async def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="接力教育智慧云平台 - 测试数据设置工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    python setup_test_data.py setup       # 设置测试数据
    python setup_test_data.py cleanup     # 清理测试数据
    python setup_test_data.py reset       # 重置测试数据
        """
    )

    parser.add_argument(
        "command",
        nargs="?",
        default="setup",
        choices=["setup", "cleanup", "reset"],
        help="要执行的命令 (默认: setup)"
    )

    parser.add_argument(
        "--database-url",
        default=TEST_DATABASE_URL,
        help=f"数据库 URL (默认: {TEST_DATABASE_URL})"
    )

    parser.add_argument(
        "--test-env",
        action="store_true",
        help="使用测试环境配置"
    )

    args = parser.parse_args()

    # 如果使用测试环境，修改配置
    if args.test_env:
        os.environ["APP_ENV"] = "testing"
        os.environ["APP_DEBUG"] = "false"

    # 创建设置实例
    setup = TestDataSetup(args.database_url)

    try:
        if args.command == "setup":
            success = await setup.setup_all()
        elif args.command == "cleanup":
            success = await setup.cleanup()
        elif args.command == "reset":
            await setup.cleanup()
            success = await setup.setup_all()
        else:
            parser.print_help()
            return 1

        return 0 if success else 1

    except KeyboardInterrupt:
        print("\n\n操作已取消")
        return 1
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        await setup.close()


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
