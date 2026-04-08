"""创建测试账号数据用于E2E测试"""

import asyncio
import sys
sys.path.insert(0, '/Users/chockg/Documents/trae_projects/Jieli Education Smart Cloud Platform')

from sqlalchemy import select
from app.core.database import async_session_factory, init_db
from app.models.account import Account, AccountType, GradeGroup, UserRole
from app.core.auth import hash_password


async def create_test_accounts():
    """创建测试账号"""
    async with async_session_factory() as session:
        # 检查是否已存在
        result = await session.execute(
            select(Account).where(Account.username == 'admin')
        )
        if result.scalar_one_or_none():
            print("✅ 测试账号已存在")
            return
        
        # 创建管理员账号
        admin = Account(
            account_type=AccountType.PRACTICE,
            grade_group=GradeGroup.PRIMARY,
            username='admin',
            hashed_password=hash_password('admin123'),
            name='系统管理员',
            is_activated=True,
            is_active=True
        )
        admin.role = 'admin'  # 通过属性设置角色
        
        # 创建教师账号
        teacher = Account(
            account_type=AccountType.PRACTICE,
            grade_group=GradeGroup.PRIMARY,
            username='teacher',
            hashed_password=hash_password('teacher123'),
            name='测试教师',
            is_activated=True,
            is_active=True
        )
        teacher.role = 'teacher'
        
        # 创建学生账号
        student = Account(
            account_type=AccountType.EXAM,
            grade_group=GradeGroup.PRIMARY,
            identity_no='450102201501011234',
            hashed_password=get_password_hash('123456'),
            name='测试学生',
            school='测试小学',
            is_activated=True,
            is_active=True
        )
        student.role = 'student'
        
        session.add_all([admin, teacher, student])
        await session.commit()
        
        print("✅ 测试账号创建成功:")
        print("  - 管理员: admin / admin123")
        print("  - 教师: teacher / teacher123")
        print("  - 学生: 450102201501011234 / 123456")


if __name__ == '__main__':
    asyncio.run(create_test_accounts())
