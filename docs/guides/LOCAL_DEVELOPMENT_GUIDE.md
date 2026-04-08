# 接力教育智慧云平台 - 本地开发环境运行指南

> **适用平台**: macOS / Linux / Windows(WSL2)  
> **准备时间**: 约15分钟  
> **难度**: ⭐⭐ 简单

---

## 📋 环境要求

### 必需软件

| 软件 | 版本要求 | 用途 | 下载地址 |
|-----|---------|------|---------|
| Python | 3.11+ | 后端运行 | https://www.python.org/downloads/ |
| Node.js | 18+ | 前端运行 | https://nodejs.org/ |
| MySQL | 8.0+ | 数据库 | https://dev.mysql.com/downloads/ |
| Redis | 7+ | 缓存 | https://redis.io/download/ |
| Git | 任意 | 代码管理 | https://git-scm.com/ |

### 验证安装

```bash
# 检查各软件是否已安装
python3 --version        # Python 3.11.0+
node --version          # v18.0.0+
npm --version           # 9.0.0+
mysql --version         # 8.0.0+
redis-server --version  # 7.0.0+
```

---

## 🚀 快速开始（5分钟启动）

### 方式一：使用 Docker Compose（推荐）

如果已安装 Docker，这是最简单的方式：

```bash
# 1. 进入项目目录
cd /Users/chockg/Documents/trae_projects/Jieli Education Smart Cloud Platform

# 2. 创建环境文件
cp .env.example .env

# 3. 修改 .env 中的数据库密码（可选，本地开发可保持默认）
# 主要修改以下配置：
# MYSQL_ROOT_PASSWORD=rootpass
# MYSQL_PASSWORD=dbpass
# JWT_SECRET_KEY=your-secret-key

# 4. 启动所有服务（MySQL + Redis + 后端 + 前端）
docker-compose up -d

# 5. 执行数据库迁移
docker-compose exec backend alembic upgrade head

# 6. 创建管理员账号
docker-compose exec backend python -c "
import asyncio
from app.core.database import AsyncSessionLocal
from app.models.account import Account, UserRole, GradeGroup
from app.core.auth import get_password_hash
from sqlalchemy import select

async def init():
    async with AsyncSessionLocal() as db:
        # 检查是否已有管理员
        result = await db.execute(select(Account).where(Account.username == 'admin'))
        if result.scalar_one_or_none():
            print('管理员账号已存在')
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
        print('   用户名: admin')
        print('   密码: admin123')

asyncio.run(init())
"

# 7. 访问系统
open http://localhost          # macOS
# 或 http://localhost 在浏览器中打开
```

### 方式二：本地原生运行（开发调试推荐）

#### 第一步：启动数据库服务

**macOS (使用 Homebrew)**:

```bash
# 安装（如未安装）
brew install mysql@8.0 redis

# 启动服务
brew services start mysql@8.0
brew services start redis

# 创建数据库
mysql -u root -p -e "CREATE DATABASE jieli_edu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "CREATE USER 'jieli_user'@'localhost' IDENTIFIED BY 'dbpass';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON jieli_edu.* TO 'jieli_user'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

**Ubuntu/Linux**:

```bash
# 安装
sudo apt-get update
sudo apt-get install mysql-server-8.0 redis-server

# 启动
sudo systemctl start mysql
sudo systemctl start redis

# 创建数据库
sudo mysql -e "CREATE DATABASE jieli_edu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'jieli_user'@'localhost' IDENTIFIED BY 'dbpass';"
sudo mysql -e "GRANT ALL PRIVILEGES ON jieli_edu.* TO 'jieli_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

**Windows (WSL2)**:

```bash
# 在 WSL2 Ubuntu 中执行
sudo apt-get update
sudo apt-get install mysql-server-8.0 redis-server
sudo service mysql start
sudo service redis-server start
```

#### 第二步：配置后端

```bash
# 1. 进入后端目录（项目根目录）
cd /Users/chockg/Documents/trae_projects/Jieli Education Smart Cloud Platform

# 2. 创建 Python 虚拟环境
python3 -m venv venv

# 3. 激活虚拟环境
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# 4. 安装依赖
pip install -r requirements.txt

# 5. 创建本地环境文件
cat > .env << 'ENVFILE'
# 数据库配置
DATABASE_URL=mysql+aiomysql://jieli_user:dbpass@localhost:3306/jieli_edu

# Redis配置
REDIS_URL=redis://localhost:6379/0

# JWT配置
JWT_SECRET_KEY=local-development-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7

# 存储配置
STORAGE_TYPE=local
STORAGE_PATH=./uploads

# Celery配置
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# 环境设置
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=DEBUG
ENVFILE

# 6. 执行数据库迁移
alembic upgrade head

# 7. 创建测试数据（可选）
python scripts/init_test_data.py  # 如不存在，见下方快速创建
```

**快速创建管理员账号脚本**（如果不存在）:

```bash
# 创建脚本目录
mkdir -p scripts

# 创建初始化脚本
cat > scripts/init_test_data.py << 'SCRIPT'
import asyncio
import sys
sys.path.insert(0, '.')

from app.core.database import AsyncSessionLocal
from app.models.account import Account, UserRole, GradeGroup, AccountType
from app.core.auth import get_password_hash
from sqlalchemy import select

async def create_admin():
    async with AsyncSessionLocal() as db:
        # 检查是否已有管理员
        result = await db.execute(select(Account).where(Account.username == 'admin'))
        if result.scalar_one_or_none():
            print('✅ 管理员账号已存在')
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
        print('✅ 管理员账号创建成功: admin / admin123')

async def create_test_teacher():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Account).where(Account.username == 'teacher1'))
        if result.scalar_one_or_none():
            return
            
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
        print('✅ 教师账号创建成功: teacher1 / teacher123')

async def create_test_student():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Account).where(Account.username == 'student1'))
        if result.scalar_one_or_none():
            return
            
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
        print('✅ 学生账号创建成功: student1 / student123')

async def main():
    print('🚀 初始化测试数据...')
    await create_admin()
    await create_test_teacher()
    await create_test_student()
    print('\n📋 测试账号清单:')
    print('   管理员: admin / admin123')
    print('   教师:   teacher1 / teacher123')
    print('   学生:   student1 / student123')

if __name__ == '__main__':
    asyncio.run(main())
SCRIPT

# 执行脚本
python scripts/init_test_data.py
```

#### 第三步：启动后端服务

```bash
# 确保在虚拟环境中
source venv/bin/activate

# 方式1: 使用 Uvicorn（推荐用于开发）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 方式2: 使用 Python 直接运行
python -m app.main
```

**后端启动成功标志**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**API 文档地址**: http://localhost:8000/api/v1/docs

#### 第四步：配置并启动前端

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖（首次需要）
npm install

# 3. 创建本地环境配置
cat > .env.local << 'FRONTENDENV'
VITE_API_BASE_URL=http://localhost:8000/api/v1
FRONTENDENV

# 4. 启动开发服务器
npm run dev
```

**前端启动成功标志**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

#### 第五步：（可选）启动 Celery 任务队列

如果需要测试异步任务（如成绩导出）：

```bash
# 新开一个终端，进入项目目录
cd /Users/chockg/Documents/trae_projects/Jieli Education Smart Cloud Platform
source venv/bin/activate

# 启动 Celery Worker
celery -A app.core.celery_app worker --loglevel=info

# 如需定时任务，再开一个终端启动 Beat
celery -A app.core.celery_app beat --loglevel=info
```

---

## 🌐 访问系统

启动完成后，在浏览器中访问：

| 服务 | 地址 | 说明 |
|-----|------|------|
| 前端页面 | http://localhost:5173 | 主要入口 |
| 后端 API | http://localhost:8000 | API 服务 |
| API 文档 | http://localhost:8000/api/v1/docs | Swagger UI |
| 数据库 | localhost:3306 | MySQL |
| 缓存 | localhost:6379 | Redis |

**测试账号**:
```
管理员: admin / admin123
教师:   teacher1 / teacher123
学生:   student1 / student123
```

---

## 🛠️ 开发常用命令

### 后端开发

```bash
# 进入虚拟环境
source venv/bin/activate

# 安装新依赖
pip install <package-name>
pip freeze > requirements.txt

# 数据库迁移
alembic revision --autogenerate -m "描述"
alembic upgrade head
alembic downgrade -1

# 运行测试
pytest
pytest tests/test_exam_engine.py -v

# 代码格式化
ruff check app/
ruff format app/

# 启动后端
uvicorn app.main:app --reload
```

### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 类型检查
npx vue-tsc --noEmit
```

---

## 🔧 常见问题排查

### 问题1: MySQL 连接失败

**症状**: `Can't connect to MySQL server`

**解决**:
```bash
# 检查 MySQL 是否运行
# macOS
brew services list | grep mysql

# Linux
sudo systemctl status mysql

# 启动 MySQL
brew services start mysql@8.0  # macOS
sudo systemctl start mysql      # Linux

# 检查端口
lsof -i :3306
```

### 问题2: Redis 连接失败

**症状**: `Error connecting to Redis`

**解决**:
```bash
# 检查 Redis
redis-cli ping

# 启动 Redis
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

### 问题3: 前端无法连接后端

**症状**: `Network Error` 或 CORS 错误

**解决**:
1. 确认后端已启动（端口8000）
2. 检查 `.env.local` 中的 `VITE_API_BASE_URL`
3. 确认防火墙未阻止

```bash
# 测试后端是否可访问
curl http://localhost:8000/api/v1/health
```

### 问题4: 数据库迁移失败

**症状**: `alembic upgrade head` 报错

**解决**:
```bash
# 删除并重新创建数据库
mysql -u root -p -e "DROP DATABASE jieli_edu;"
mysql -u root -p -e "CREATE DATABASE jieli_edu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 重新执行迁移
alembic upgrade head
```

### 问题5: 端口被占用

**症状**: `Address already in use`

**解决**:
```bash
# 查找占用端口的进程
lsof -i :8000  # 后端端口
lsof -i :5173  # 前端端口

# 结束进程
kill -9 <PID>

# 或使用其他端口
uvicorn app.main:app --port 8001
npm run dev -- --port 5174
```

---

## 📝 项目结构速览

```
Jieli Education Smart Cloud Platform/
├── app/                      # 后端代码
│   ├── api/v1/              # API 路由
│   ├── core/                # 核心配置
│   ├── models/              # 数据模型
│   ├── services/            # 业务逻辑
│   └── main.py              # 应用入口
├── frontend/                 # 前端代码
│   ├── src/
│   │   ├── api/            # API 接口
│   │   ├── views/          # 页面组件
│   │   ├── components/     # 公共组件
│   │   └── router/         # 路由配置
│   └── package.json
├── alembic/                  # 数据库迁移
├── uploads/                  # 上传文件存储
├── venv/                     # Python 虚拟环境
├── docker-compose.yml        # Docker 配置
├── requirements.txt          # Python 依赖
└── .env                      # 环境变量
```

---

## 🎉 恭喜！

现在您已经成功在本地运行了接力教育智慧云平台！

**下一步建议**:
1. 使用测试账号登录系统体验功能
2. 阅读 USER_MANUAL.md 了解详细功能
3. 阅读 CLAUDE.md 了解技术架构
4. 开始开发或测试您需要的功能

**需要帮助？** 查看项目文档或联系技术支持。
