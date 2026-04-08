"""创建测试账号数据用于E2E测试"""

import asyncio
import sys
sys.path.insert(0, '/Users/chockg/Documents/trae_projects/Jieli Education Smart Cloud Platform')

from sqlalchemy import select, text
from app.core.database import async_session_factory, init_db
from app.models.account import Account
from app.core.auth import hash_password


async def create_test_accounts():
    """创建测试账号"""
    async with async_session_factory() as session:
        # 检查是否已存在
        result = await session.execute(
            select(Account).where(Account.username == 'teacher')
        )
        if result.scalar_one_or_none():
            print("✅ 测试账号已存在")
            return
        
        # 创建教师账号 - 密码截断到72字节
        teacher = Account(
            account_type='PRACTICE',
            grade_group='PRIMARY',
            username='teacher',
            hashed_password=hash_password('tea123'),  # 短密码
            name='测试教师',
            is_activated=True,
            is_active=True
        )
        teacher.role = 'TEACHER'
        
        # 创建学生账号
        student = Account(
            account_type='PRACTICE',
            grade_group='PRIMARY',
            username='student',
            hashed_password=hash_password('stu123'),  # 短密码
            name='测试学生',
            is_activated=True,
            is_active=True
        )
        student.role = 'STUDENT'
        
        session.add(teacher)
        session.add(student)
        await session.commit()
        
        print("✅ 测试账号创建成功")
        print("  教师: teacher / tea123")
        print("  学生: student / stu123")


if __name__ == '__main__':
    asyncio.run(create_test_accounts())
