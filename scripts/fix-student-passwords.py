#!/usr/bin/env python3
"""修复学生账号密码"""
import asyncio
import bcrypt
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update

DATABASE_URL = "mysql+aiomysql://root:rootpass@localhost:3307/jieli_edu"

async def fix_passwords():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        from app.models import Account
        
        # 获取所有学生账号
        result = await session.execute(
            select(Account).where(Account.role == 'student', Account.account_type == 'exam')
        )
        students = result.scalars().all()
        
        print(f"Found {len(students)} student accounts")
        
        for student in students:
            # 密码为身份证后8位
            password = student.username[-8:]
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
            
            student.hashed_password = hashed
            student.is_activated = True
            print(f"Updated: {student.username} -> {password}")
        
        await session.commit()
        print(f"\nUpdated {len(students)} accounts successfully!")

if __name__ == "__main__":
    asyncio.run(fix_passwords())
