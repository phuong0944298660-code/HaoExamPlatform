# 接力教育智慧云平台 - Java 后端部署指南

## 目录结构

```
backend-java/
├── Dockerfile                    # Java 后端 Dockerfile（多阶段构建）
├── docker-compose.java.yml       # Java 后端独立编排文件
├── scripts/
│   └── init.sql                 # 数据库初始化脚本
├── src/main/resources/
│   ├── application.yml          # 主配置文件
│   ├── application-dev.yml      # 开发环境配置
│   ├── application-prod.yml     # 生产环境配置
│   └── db/migration/            # 数据库迁移脚本目录
```

## 快速开始

### 方式一：使用独立脚本（推荐）

```bash
# 1. 启动 Java 后端（包含 MySQL、Redis、Nginx）
./scripts/start-java.sh

# 2. 停止服务
./scripts/stop-java.sh

# 3. 重新构建
./scripts/build-java.sh -a

# 4. 数据库迁移
./scripts/migrate-db.sh migrate
```

### 方式二：使用 Docker Compose Profile

```bash
# 启动 Java 后端（使用 --profile java）
docker-compose --profile java up -d

# 停止服务
docker-compose --profile java down
```

### 方式三：使用独立的 docker-compose.java.yml

```bash
# 进入后端目录
cd backend-java

# 启动服务
docker-compose -f docker-compose.java.yml up -d

# 停止服务
docker-compose -f docker-compose.java.yml down
```

## 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端应用 | http://localhost | Nginx 托管 |
| Java API | http://localhost:8080/api/v1 | 后端 API |
| API 文档 | http://localhost:8080/swagger-ui.html (dev) | Swagger UI |
| 健康检查 | http://localhost/api/v1/health | 服务健康状态 |

## 环境变量

### 数据库配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `SPRING_DATASOURCE_URL` | jdbc:mysql://mysql:3306/jieli_edu | 数据库连接 URL |
| `SPRING_DATASOURCE_USERNAME` | root | 数据库用户名 |
| `SPRING_DATASOURCE_PASSWORD` | rootpass | 数据库密码 |

### Redis 配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `SPRING_REDIS_HOST` | redis | Redis 主机 |
| `SPRING_REDIS_PORT` | 6379 | Redis 端口 |
| `SPRING_REDIS_PASSWORD` | - | Redis 密码 |

### 应用配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `SPRING_PROFILES_ACTIVE` | prod | 激活的配置文件 |
| `SERVER_PORT` | 8080 | 服务端口 |
| `JWT_SECRET` | - | JWT 密钥 |
| `JWT_EXPIRATION` | 86400000 | JWT 过期时间（毫秒） |
| `FILE_UPLOAD_PATH` | /app/uploads | 文件上传路径 |
| `FILE_MAX_SIZE` | 104857600 | 最大文件大小（字节） |

## 脚本说明

### start-java.sh

启动 Java 后端服务的完整脚本，支持以下选项：

```bash
./scripts/start-java.sh [选项]

选项:
  -e, --env       指定环境 (prod/dev/test, 默认: prod)
  -b, --build     启动前重新构建镜像
  -h, --help      显示帮助信息
```

### stop-java.sh

停止 Java 后端服务：

```bash
./scripts/stop-java.sh [选项]

选项:
  -v, --volumes   同时删除数据卷（清理所有数据）
  -h, --help      显示帮助信息
```

### build-java.sh

构建 Java 项目：

```bash
./scripts/build-java.sh [选项]

选项:
  -s, --skip-tests    跳过单元测试
  -d, --docker        构建 Docker 镜像
  -c, --clean         清理并重新构建
  -a, --all           执行完整构建（清理+构建+Docker镜像）
```

### migrate-db.sh

数据库迁移脚本：

```bash
./scripts/migrate-db.sh [命令] [选项]

命令:
  migrate         执行数据库迁移（默认）
  validate        验证迁移脚本
  info            显示迁移信息
  baseline        设置基线版本
  repair          修复迁移元数据
  clean           清理数据库（危险操作！）
  reset           重置数据库（清理+重新迁移）
  export          导出数据库结构
  import          导入初始数据

选项:
  -h, --host      数据库主机（默认: localhost）
  -P, --port      数据库端口（默认: 3306）
  -d, --database  数据库名称（默认: jieli_edu）
  -u, --user      数据库用户（默认: root）
  -p, --password  数据库密码（默认: rootpass）
```

## 与 Python 后端切换

项目支持在 Python 和 Java 后端之间切换：

### 使用 Python 后端（默认）

```bash
docker-compose up -d
```

### 使用 Java 后端

```bash
docker-compose --profile java up -d
# 或使用脚本
./scripts/start-java.sh
```

**注意**：Python 和 Java 后端不能同时运行，因为都会占用端口 80（Nginx）。

## API 兼容性

Java 后端保持与 Python 后端相同的 API 路径：

- 所有 API 以 `/api/v1/` 开头
- 响应格式保持一致
- 状态码保持一致

## 生产环境部署

### 1. 修改配置

编辑 `backend-java/src/main/resources/application-prod.yml`：

```yaml
app:
  jwt:
    secret: your-secure-secret-key-here  # 修改 JWT 密钥
```

### 2. 设置环境变量

创建 `.env` 文件：

```bash
SPRING_DATASOURCE_PASSWORD=your-secure-db-password
JWT_SECRET=your-secure-jwt-secret
```

### 3. 启动服务

```bash
./scripts/start-java.sh -e prod
```

## 日志查看

```bash
# 查看 Java 后端日志
docker logs -f jieli-backend-java

# 查看 Nginx 日志
docker logs -f jieli-nginx

# 查看 MySQL 日志
docker logs -f jieli-mysql
```

## 故障排查

### 服务无法启动

1. 检查端口占用：
   ```bash
   netstat -tuln | grep -E '8080|3306|6379|80'
   ```

2. 查看详细日志：
   ```bash
   docker logs jieli-backend-java
   ```

3. 检查配置文件：
   ```bash
   cat backend-java/src/main/resources/application-prod.yml
   ```

### 数据库连接失败

1. 确认 MySQL 容器运行状态：
   ```bash
   docker ps | grep mysql
   ```

2. 手动测试连接：
   ```bash
   ./scripts/migrate-db.sh info
   ```

### 文件上传失败

1. 检查上传目录权限：
   ```bash
   ls -la uploads/
   ```

2. 检查 Nginx 配置中的 `client_max_body_size`
