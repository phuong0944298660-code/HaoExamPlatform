#!/bin/bash
# 接力教育智慧云平台 - 本地快速启动脚本

set -e

echo "🚀 启动接力教育智慧云平台（本地开发环境）..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Docker
echo "📦 检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装，请先安装 Docker Compose${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker 环境正常${NC}"
echo ""

# 停止之前的服务
echo "🛑 停止之前的服务..."
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✅ 已清理${NC}"
echo ""

# 启动服务
echo "🚀 启动服务（MySQL + Redis + Backend + Frontend）..."
docker-compose -f docker-compose.simple.yml up -d

echo ""
echo -e "${YELLOW}⏳ 等待数据库就绪...${NC}"
sleep 15

# 检查服务状态
echo ""
echo "📊 检查服务状态..."
docker-compose -f docker-compose.simple.yml ps

echo ""
echo "🔄 执行数据库迁移..."
if docker-compose -f docker-compose.simple.yml exec -T backend alembic upgrade head; then
    echo -e "${GREEN}✅ 数据库迁移成功${NC}"
else
    echo -e "${YELLOW}⚠️  数据库迁移可能需要重试，等待 5 秒后再次尝试...${NC}"
    sleep 5
    docker-compose -f docker-compose.simple.yml exec -T backend alembic upgrade head
fi

echo ""
echo "👤 创建管理员账号..."
docker-compose -f docker-compose.simple.yml exec -T backend python -c "
import asyncio
import sys
sys.path.insert(0, '.')

from app.core.database import AsyncSessionLocal
from app.models.account import Account, UserRole, GradeGroup
from app.core.auth import get_password_hash
from sqlalchemy import select

async def init():
    async with AsyncSessionLocal() as db:
        # 检查是否已有管理员
        result = await db.execute(select(Account).where(Account.username == 'admin'))
        if result.scalar_one_or_none():
            print('管理员账号已存在，跳过创建')
            return
        
        admin = Account(
            username='admin',
            hashed_password=get_password_hash('admin123'),
            role=UserRole.ADMIN,
            grade_group=GradeGroup.PRIMARY,
            is_activated=True,
            is_active=True
        )
        db.add(admin)
        await db.commit()
        print('✅ 管理员账号创建成功')

async def create_teacher():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Account).where(Account.username == 'teacher1'))
        if result.scalar_one_or_none():
            return
            
        from app.models.account import AccountType
        teacher = Account(
            username='teacher1',
            hashed_password=get_password_hash('teacher123'),
            role=UserRole.TEACHER,
            grade_group=GradeGroup.PRIMARY,
            is_activated=True,
            is_active=True,
            name='测试老师'
        )
        db.add(teacher)
        await db.commit()
        print('✅ 教师账号创建成功')

async def create_student():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Account).where(Account.username == 'student1'))
        if result.scalar_one_or_none():
            return
            
        from app.models.account import AccountType
        student = Account(
            username='student1',
            hashed_password=get_password_hash('student123'),
            role=UserRole.STUDENT,
            grade_group=GradeGroup.PRIMARY,
            account_type=AccountType.PRACTICE,
            is_activated=True,
            is_active=True,
            name='测试学生'
        )
        db.add(student)
        await db.commit()
        print('✅ 学生账号创建成功')

async def main():
    await init()
    await create_teacher()
    await create_student()

asyncio.run(main())
" 2>/dev/null || echo -e "${YELLOW}⚠️  账号创建可能需要手动执行${NC}"

echo ""
echo -e "${GREEN}🎉 系统启动成功！${NC}"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  📱 访问地址:"
echo "     前端页面: http://localhost:5173"
echo "     后端API:  http://localhost:8000"
echo "     API文档:  http://localhost:8000/api/v1/docs"
echo ""
echo "  👤 测试账号:"
echo "     管理员: admin / admin123"
echo "     教师:   teacher1 / teacher123"
echo "     学生:   student1 / student123"
echo ""
echo "  🛠️  常用命令:"
echo "     查看日志: docker-compose -f docker-compose.simple.yml logs -f"
echo "     停止服务: docker-compose -f docker-compose.simple.yml down"
echo "     重启服务: docker-compose -f docker-compose.simple.yml restart"
echo "═══════════════════════════════════════════════════════"
echo ""

# 尝试打开浏览器（macOS）
if command -v open &> /dev/null; then
    echo "正在打开浏览器..."
    sleep 2
    open http://localhost:5173 || true
fi

echo "✅ 完成！"
