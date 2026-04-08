# 接力教育智慧云平台 - 生产环境部署指南

> **版本**: v1.0.0  
> **更新日期**: 2026-03-23  
> **适用环境**: Linux (Ubuntu 20.04+/CentOS 8+)  
> **部署方式**: Docker Compose

---

## 📋 部署前准备

### 1. 系统要求

| 组件 | 最低配置 | 推荐配置 |
|-----|---------|---------|
| CPU | 4核 | 8核+ |
| 内存 | 8GB | 16GB+ |
| 磁盘 | 100GB SSD | 500GB SSD+ |
| 带宽 | 10Mbps | 100Mbps+ |
| 操作系统 | Ubuntu 20.04 | Ubuntu 22.04 LTS |

### 2. 软件依赖

```bash
# 检查是否已安装
$ docker --version       # 需要 24.0+
$ docker-compose --version  # 需要 2.20+
$ git --version          # 需要 2.30+
```

### 3. 安装 Docker（如未安装）

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker-compose --version
```

---

## 🚀 快速部署（推荐）

### 步骤1: 克隆代码

```bash
# 创建应用目录
mkdir -p /opt/jieli-edu
cd /opt/jieli-edu

# 克隆代码（实际部署时替换为实际仓库地址）
git clone <repository-url> .

# 或使用上传的代码包
tar -xzf jieli-edu-v1.0.0.tar.gz -C /opt/jieli-edu
```

### 步骤2: 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env
```

**必须修改的配置项**:

```bash
# ==================== 数据库配置 ====================
# 生产环境务必修改密码！
MYSQL_ROOT_PASSWORD=YourStrongPassword123!
MYSQL_DATABASE=jieli_edu
MYSQL_USER=jieli_user
MYSQL_PASSWORD=YourDBPassword456!

# 数据库连接URL（会自动使用上面的配置生成）
DATABASE_URL=mysql+aiomysql://jieli_user:YourDBPassword456!@db:3306/jieli_edu

# ==================== Redis配置 ====================
REDIS_URL=redis://redis:6379/0

# ==================== JWT密钥 ====================
# 生成强密钥: openssl rand -hex 32
JWT_SECRET_KEY=your-generated-32-byte-hex-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7

# ==================== 文件存储 ====================
STORAGE_TYPE=local
STORAGE_PATH=/app/uploads

# ==================== Celery配置 ====================
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# ==================== 环境设置 ====================
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# ==================== 邮件配置（可选） ====================
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your-email-password
```

### 步骤3: 创建必要目录

```bash
# 创建数据持久化目录
mkdir -p data/mysql
mkdir -p data/redis
mkdir -p uploads/resources
mkdir -p uploads/exports
mkdir -p logs

# 设置权限
chmod 755 data uploads logs
```

### 步骤4: 启动服务

```bash
# 拉取镜像并启动
docker-compose pull
docker-compose up -d

# 查看服务状态
docker-compose ps

# 等待数据库初始化完成（约30秒）
sleep 30
```

### 步骤5: 执行数据库迁移

```bash
# 执行迁移
docker-compose exec backend alembic upgrade head

# 验证迁移成功
docker-compose exec backend alembic current
```

### 步骤6: 初始化数据

```bash
# 创建管理员账号
docker-compose exec backend python -c "
import asyncio
from app.core.database import AsyncSessionLocal
from app.models.account import Account, UserRole, GradeGroup
from app.core.auth import get_password_hash

async def create_admin():
    async with AsyncSessionLocal() as db:
        admin = Account(
            username='admin',
            hashed_password=get_password_hash('Admin@123'),
            role=UserRole.ADMIN,
            grade_group=GradeGroup.PRIMARY,
            is_activated=True,
            is_active=True
        )
        db.add(admin)
        await db.commit()
        print('管理员账号创建成功: admin / Admin@123')

asyncio.run(create_admin())
"
```

### 步骤7: 验证部署

```bash
# 检查所有服务状态
docker-compose ps

# 检查后端API
curl http://localhost:8000/api/v1/health

# 检查前端
curl http://localhost/

# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🔧 详细配置说明

### Docker Compose 服务说明

```yaml
# docker-compose.yml 服务架构

services:
  # Nginx 反向代理 + 静态文件服务
  nginx:
    - 端口: 80/443
    - 功能: 负载均衡、SSL终止、静态资源缓存
    
  # FastAPI 后端服务
  backend:
    - 端口: 8000 (内部)
    - 工作进程: 4个Uvicorn worker
    - 自动重启: 始终
    
  # Celery Worker (异步任务)
  celery-worker:
    - 并发: 4个worker进程
    - 队列: default, export, import
    
  # Celery Beat (定时任务)
  celery-beat:
    - 任务: 每分钟检查考试状态
    
  # MySQL 数据库
  db:
    - 端口: 3306 (内部)
    - 数据持久化: ./data/mysql
    - 字符集: utf8mb4_unicode_ci
    
  # Redis 缓存
  redis:
    - 端口: 6379 (内部)
    - 数据持久化: ./data/redis
    - 内存限制: 2GB
```

### Nginx 配置优化

```nginx
# nginx.conf 生产优化配置

# 上游服务器配置
upstream backend {
    server backend:8000 max_fails=3 fail_timeout=30s;
}

# 静态文件缓存
location /static/ {
    alias /app/static/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# 上传文件
location /uploads/ {
    alias /app/uploads/;
    expires 7d;
    add_header Cache-Control "public";
}

# API代理
location /api/ {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
}

# WebSocket支持
location /ws/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### 数据库配置优化

```ini
# MySQL my.cnf 生产优化

[mysqld]
# 性能优化
innodb_buffer_pool_size = 4G
innodb_log_file_size = 1G
innodb_flush_log_at_trx_commit = 2
query_cache_size = 256M
query_cache_type = 1

# 连接优化
max_connections = 500
wait_timeout = 28800
interactive_timeout = 28800

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

---

## 📝 上线前检查清单

### 配置检查

- [ ] `.env` 文件已正确配置
- [ ] 数据库密码已修改为强密码
- [ ] JWT密钥已重新生成
- [ ] 邮件配置已测试（如使用）
- [ ] 域名和SSL证书已配置（生产环境）

### 安全检查

- [ ] 防火墙已配置，仅开放必要端口
- [ ] 数据库未暴露到公网
- [ ] Redis未暴露到公网
- [ ] 管理员密码已修改为强密码
- [ ] 测试数据已清理

### 数据备份

- [ ] 数据库自动备份已配置
- [ ] 文件存储自动备份已配置
- [ ] 备份恢复流程已测试
- [ ] 备份存储位置已验证

### 监控告警

- [ ] 服务器资源监控已配置
- [ ] 应用性能监控已配置
- [ ] 错误日志告警已配置
- [ ] 告警通知渠道已测试

### 应急预案

- [ ] 回滚方案已准备
- [ ] 故障处理流程已文档化
- [ ] 运维人员已培训
- [ ] 紧急联系人列表已更新

---

## 🔄 版本升级

### 升级步骤

```bash
# 1. 备份数据
docker-compose exec db mysqldump -u root -p jieli_edu > backup_$(date +%Y%m%d).sql
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# 2. 拉取新版本
git pull origin main

# 3. 更新配置文件（如有变化）
cp .env .env.backup
# 手动合并新配置项

# 4. 重新构建
docker-compose down
docker-compose pull
docker-compose up -d --build

# 5. 执行迁移
docker-compose exec backend alembic upgrade head

# 6. 验证
curl http://localhost/api/v1/health
```

### 回滚方案

```bash
# 如果升级失败，执行回滚

# 1. 停止服务
docker-compose down

# 2. 恢复代码
git reset --hard <previous-commit>

# 3. 恢复数据库（如有必要）
docker-compose up -d db
sleep 10
docker-compose exec -T db mysql -u root -p jieli_edu < backup_YYYYMMDD.sql

# 4. 重新启动
docker-compose up -d

# 5. 验证
curl http://localhost/api/v1/health
```

---

## 🐛 故障排查

### 常见问题

#### 1. 服务无法启动

```bash
# 检查日志
docker-compose logs backend
docker-compose logs db

# 检查端口占用
netstat -tlnp | grep :80
netstat -tlnp | grep :3306

# 重启服务
docker-compose restart
```

#### 2. 数据库连接失败

```bash
# 检查数据库状态
docker-compose ps db
docker-compose logs db

# 检查网络连接
docker-compose exec backend ping db

# 重置数据库（会丢失数据，谨慎使用）
docker-compose down -v
docker-compose up -d db
```

#### 3. 前端无法访问

```bash
# 检查Nginx
docker-compose logs nginx

# 检查前端构建
docker-compose exec frontend ls -la /usr/share/nginx/html

# 重新构建前端
docker-compose up -d --build frontend
```

#### 4. 性能问题

```bash
# 监控资源使用
docker stats

# 查看慢查询
docker-compose exec db tail -f /var/log/mysql/slow.log

# 重启 worker
docker-compose restart celery-worker
```

---

## 📞 技术支持

### 联系信息

- **技术负责人**: [姓名] / [电话] / [邮箱]
- **运维团队**: [电话] / [邮箱]
- **紧急联系**: [24小时值班电话]

### 文档资源

- **API文档**: http://your-domain/api/v1/docs
- **监控面板**: http://your-domain:3000 (Grafana)
- **日志查询**: http://your-domain:5601 (Kibana)

---

## 📄 附录

### 环境变量完整列表

```bash
# 核心配置
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# 数据库
MYSQL_ROOT_PASSWORD=
MYSQL_DATABASE=jieli_edu
MYSQL_USER=
MYSQL_PASSWORD=
DATABASE_URL=

# Redis
REDIS_URL=

# JWT
JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7

# 存储
STORAGE_TYPE=local
STORAGE_PATH=/app/uploads

# Celery
CELERY_BROKER_URL=
CELERY_RESULT_BACKEND=

# 邮件
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
```

### 常用命令速查

```bash
# 启动/停止/重启
docker-compose up -d
docker-compose down
docker-compose restart

# 查看日志
docker-compose logs -f [service]
docker-compose logs --tail=100 backend

# 执行命令
docker-compose exec backend [command]
docker-compose exec db mysql -u root -p

# 数据库操作
docker-compose exec backend alembic upgrade head
docker-compose exec backend alembic downgrade -1

# 备份/恢复
docker-compose exec db mysqldump -u root -p jieli_edu > backup.sql
docker-compose exec -T db mysql -u root -p jieli_edu < backup.sql

# 清理
docker system prune -a
docker volume prune
```

---

**部署负责人**: 运维团队  
**审核**: 技术负责人  
**生效日期**: 2026-03-23
