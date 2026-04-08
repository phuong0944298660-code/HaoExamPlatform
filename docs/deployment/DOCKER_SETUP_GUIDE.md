# Docker环境配置指南

## 当前配置状态

### 后端配置 (.env)
- 数据库: mysql+aiomysql://root:rootpass@db:3306/jieli_edu
- Redis: redis://redis:6379/0
- 端口: 8000

### 前端配置 (vite.config.ts)
- 代理: http://localhost:8000
- 端口: 5173

## 启动步骤

### 1. 启动Docker容器
```bash
cd "/Users/chockg/Documents/trae_projects/Jieli Education Smart Cloud Platform"
docker-compose up -d
```

### 2. 运行数据库迁移
```bash
docker-compose exec backend alembic upgrade head
```

### 3. 启动前端开发服务器
```bash
cd frontend
npm run dev
```

## 访问地址

| 服务 | 地址 | 说明 |
|-----|-----|-----|
| 前端 | http://localhost:5173 | Vue3开发服务器 |
| 后端API | http://localhost:8000/api/v1 | FastAPI服务 |
| API文档 | http://localhost:8000/docs | Swagger文档 |
| MySQL | localhost:3306 | 数据库 |
| Redis | localhost:6379 | 缓存服务 |

## 系统管理API测试

Docker启动后，系统管理API可通过以下地址访问：
```
GET  http://localhost:8000/api/v1/system/users
POST http://localhost:8000/api/v1/system/users
GET  http://localhost:8000/api/v1/system/roles
...
```

## 常见问题

### 1. 数据库连接失败
检查数据库是否就绪：
```bash
docker-compose logs db
```

### 2. 前端无法访问API
确认后端服务已启动：
```bash
docker-compose ps
```

### 3. 数据库迁移失败
手动执行迁移：
```bash
docker-compose exec backend alembic upgrade head
```
