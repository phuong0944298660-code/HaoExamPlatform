# 接力教育智慧云平台 - 部署检查清单

**版本**: Java Spring Boot v1.0
**最后更新**: 2026-03-30
**用途**: 在部署前验证系统就绪度

---

## ✅ 预部署检查 (30秒)

### 1. 系统环境验证

- [ ] **Docker已安装**
  ```bash
  docker --version    # 应显示 20.10+
  ```

- [ ] **Docker Compose已安装**
  ```bash
  docker-compose --version    # 应显示 2.0+
  ```

- [ ] **必要端口可用**
  ```bash
  sudo lsof -i :80     # 应无占用进程
  sudo lsof -i :8080   # 应无占用进程
  sudo lsof -i :3307   # 应无占用进程
  sudo lsof -i :6379   # 应无占用进程
  sudo lsof -i :5173   # 应无占用进程
  ```

### 2. 项目文件检查

- [ ] **后端Java代码存在**
  ```bash
  test -d backend-java && echo "✅ 存在" || echo "❌ 缺失"
  test -f backend-java/pom.xml && echo "✅ 存在" || echo "❌ 缺失"
  ```

- [ ] **前端代码存在**
  ```bash
  test -d frontend && echo "✅ 存在" || echo "❌ 缺失"
  test -f frontend/package.json && echo "✅ 存在" || echo "❌ 缺失"
  ```

- [ ] **Docker配置存在**
  ```bash
  test -f docker-compose.yml && echo "✅ 存在" || echo "❌ 缺失"
  test -f nginx-java.conf && echo "✅ 存在" || echo "❌ 缺失"
  ```

- [ ] **Python文件已删除** (确认迁移完成)
  ```bash
  test ! -d app && echo "✅ 已删除" || echo "❌ 仍存在"
  test ! -d alembic && echo "✅ 已删除" || echo "❌ 仍存在"
  test ! -f requirements.txt && echo "✅ 已删除" || echo "❌ 仍存在"
  test ! -f main.py && echo "✅ 已删除" || echo "❌ 仍存在"
  ```

---

## 🚀 启动步骤

### 第1步: 启动所有Docker服务

```bash
cd "/Users/chockg/Documents/trae_projects/Jieli Education Smart Cloud Platform"

# 启动5个核心服务
docker-compose up -d

# 预期输出:
# Creating jieli-db ... done
# Creating jieli-redis ... done
# Creating jieli-backend ... done
# Creating jieli-nginx ... done
# Creating jieli-frontend ... done
```

- [ ] **命令执行成功** (无错误信息)
- [ ] **所有5个容器已启动**

### 第2步: 等待服务初始化

```bash
# 等待60秒让MySQL和应用完全启动
sleep 60

# 查看服务状态
docker-compose ps
```

**预期输出** (所有容器状态应为 "Up"):
```
NAME              STATUS
jieli-backend     Up (healthy)
jieli-db          Up (healthy)
jieli-redis       Up (healthy)
jieli-nginx       Up
jieli-frontend    Up
```

- [ ] **所有5个容器状态为 "Up"**
- [ ] **backend 和 db 显示 "healthy"**

### 第3步: 后端健康检查

```bash
# 验证后端API可用
curl http://localhost:8080/api/v1/health

# 预期返回:
# {"status":"UP"}
# HTTP 200
```

- [ ] **返回HTTP 200**
- [ ] **返回体包含 "status": "UP"**

---

## 🔍 详细验证 (5分钟)

### 1. MySQL数据库连接

```bash
# 使用MySQL客户端连接
mysql -h 127.0.0.1 -P 3307 -u root -p

# 输入密码: rootpass

# 验证数据库存在:
mysql> SHOW DATABASES;
# 应显示: jieli_edu

# 验证关键表:
mysql> USE jieli_edu;
mysql> SHOW TABLES;
# 应显示: accounts, exams, questions, student_exam_assignments 等

# 验证有初始数据:
mysql> SELECT COUNT(*) FROM accounts;
# 应返回至少1行 (admin账户)
```

- [ ] **MySQL成功连接**
- [ ] **数据库 jieli_edu 存在**
- [ ] **关键表已创建**
- [ ] **账户表有初始数据**

### 2. Redis连接验证

```bash
# 连接到Redis
redis-cli -h 127.0.0.1 -p 6379

# 验证连接:
redis> PING
# 应返回: PONG

# 测试设置和获取:
redis> SET test_key "test_value"
# 应返回: OK
redis> GET test_key
# 应返回: "test_value"
redis> DEL test_key
# 应返回: (integer) 1

# 退出:
redis> QUIT
```

- [ ] **Redis成功连接**
- [ ] **PING命令返回 PONG**
- [ ] **能正常读写数据**

### 3. 后端API验证

```bash
# 获取健康状态 (已做过)
curl http://localhost:8080/api/v1/health

# 获取API文档
curl http://localhost:8080/swagger-ui.html

# 测试管理员登录
curl -X POST http://localhost:8080/api/v1/accounts/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"admin123"}'

# 预期响应:
# {
#   "code": 200,
#   "data": {
#     "token": "eyJhbGc...",
#     "user": { "id": 1, "role": "ADMIN" }
#   }
# }
```

- [ ] **健康检查通过 (HTTP 200)**
- [ ] **Swagger文档可访问**
- [ ] **管理员登录成功返回token**

### 4. 前端验证

```bash
# 在浏览器打开前端
# 开发模式: http://localhost:5173
# 或通过Nginx: http://localhost

# 验证能加载页面:
# - 登录页应正常显示
# - 无红色错误提示
# - 网络请求应指向 8080

# 检查浏览器控制台:
# - 无JavaScript错误
# - API_BASE_URL应为 http://localhost:8080/api/v1
```

- [ ] **前端页面正常加载**
- [ ] **登录页面可显示**
- [ ] **浏览器控制台无错误**

### 5. 功能集成测试

```bash
# 1. 管理员登录
curl -X POST http://localhost:8080/api/v1/accounts/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"admin123"}' \
  -s | jq '.data.token' > /tmp/token.txt

TOKEN=$(cat /tmp/token.txt | tr -d '"')

# 2. 获取当前用户信息
curl http://localhost:8080/api/v1/accounts/me \
  -H "Authorization: Bearer $TOKEN"

# 3. 查询考试列表
curl http://localhost:8080/api/v1/exams \
  -H "Authorization: Bearer $TOKEN"

# 4. 查询考试成绩
curl http://localhost:8080/api/v1/scores \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] **管理员登录返回有效token**
- [ ] **认证请求返回HTTP 200**
- [ ] **数据查询正常返回**

---

## 🎬 场景测试 (可选，10分钟)

### 场景1: 学生登录和作答

```bash
# 学生账号: 000000000000000001 / 123456

# 1. 学生登录
curl -X POST http://localhost:8080/api/v1/accounts/login \
  -H "Content-Type: application/json" \
  -d '{"account":"000000000000000001","password":"123456"}' \
  -s | jq '.data.token'

# 2. 获取考试列表
curl http://localhost:8080/api/v1/exams?status=open \
  -H "Authorization: Bearer <token>"

# 3. 获取试题
curl http://localhost:8080/api/v1/exam-engine/exams/1/questions \
  -H "Authorization: Bearer <token>"

# 4. 提交答案
curl -X POST http://localhost:8080/api/v1/exam-engine/exams/1/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"force":false,"answers":[]}'
```

- [ ] **学生成功登录**
- [ ] **能查看开放的考试**
- [ ] **能获取试题内容**
- [ ] **能提交试卷**

### 场景2: 教师评分

```bash
# 1. 教师登录 (需预先创建教师账号或用admin)
# ...

# 2. 查询学生成绩
curl http://localhost:8080/api/v1/scores?exam_id=1 \
  -H "Authorization: Bearer <teacher_token>"

# 3. 给主观题评分
curl -X POST http://localhost:8080/api/v1/scores/subjective \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher_token>" \
  -d '{
    "assignment_id": 1,
    "question_id": 8,
    "score": 8.5,
    "comment": "思路清晰"
  }'

# 4. 导出成绩
curl "http://localhost:8080/api/v1/scores/export?exam_id=1&format=excel" \
  -H "Authorization: Bearer <teacher_token>" \
  -o scores.xlsx
```

- [ ] **教师成功登录**
- [ ] **能查看考试成绩**
- [ ] **能评分并保存**
- [ ] **能导出Excel文件**

---

## 🛠️ 常见问题排查

### 问题1: 容器启动失败

**症状**: `docker-compose up` 返回错误

**排查步骤**:
```bash
# 1. 查看容器日志
docker-compose logs backend
docker-compose logs db
docker-compose logs redis

# 2. 检查端口占用
sudo lsof -i :8080
sudo lsof -i :3307

# 3. 清理并重启
docker-compose down -v     # 删除所有容器和卷
docker-compose up -d       # 重新启动
```

- [ ] **已检查端口占用**
- [ ] **已查看错误日志**
- [ ] **已尝试重启**

### 问题2: 后端无法连接MySQL

**症状**: 后端日志显示 "Connection refused"

**排查步骤**:
```bash
# 1. 检查MySQL容器状态
docker-compose ps db

# 2. 查看MySQL日志
docker-compose logs db

# 3. 等待更长时间再测试
sleep 120
curl http://localhost:8080/api/v1/health

# 4. 检查网络连接
docker network ls
```

- [ ] **MySQL容器状态为 "Up (healthy)"**
- [ ] **已等待足够长的初始化时间**
- [ ] **后端能成功连接数据库**

### 问题3: 前端无法连接后端API

**症状**: 浏览器控制台显示 CORS 或连接错误

**排查步骤**:
```bash
# 1. 检查前端配置
grep -r "VITE_API_BASE_URL" frontend/

# 2. 检查docker-compose中的环境变量
grep "VITE_API_BASE_URL" docker-compose.yml

# 3. 验证后端API可访问
curl http://localhost:8080/api/v1/health

# 4. 查看前端日志
docker-compose logs frontend
```

- [ ] **VITE_API_BASE_URL 指向 8080**
- [ ] **后端API可正常访问**
- [ ] **前端和后端在同一网络**

### 问题4: 数据库未初始化

**症状**: MySQL中无 jieli_edu 数据库或表

**排查步骤**:
```bash
# 1. 检查初始化脚本
test -f docker-entrypoint.sql && echo "存在" || echo "不存在"

# 2. 重新初始化数据库
docker-compose down -v
docker-compose up -d db
sleep 30
docker-compose exec db mysql -uroot -prootpass -e "SHOW DATABASES;"

# 3. 如需恢复备份
# mysql -h 127.0.0.1 -P 3307 -u root -p jieli_edu < backup.sql
```

- [ ] **数据库 jieli_edu 存在**
- [ ] **关键表已创建**
- [ ] **初始数据可查询**

---

## 📊 性能基准 (可选)

### API响应时间基准

```bash
# 测试简单查询的响应时间
time curl -s http://localhost:8080/api/v1/accounts/me \
  -H "Authorization: Bearer $TOKEN" > /dev/null

# 预期: real 0m0.1-0.2s (100-200ms)
```

- [ ] **简单查询 < 200ms**
- [ ] **复杂查询 < 500ms**
- [ ] **文件导出 < 5s**

### 并发能力测试

```bash
# 安装ab (Apache Bench)
# macOS: brew install httpd

ab -n 100 -c 10 http://localhost:8080/api/v1/health

# 预期:
# Requests per second: 100+
# Failed requests: 0
```

- [ ] **能承受100+并发请求**
- [ ] **无失败请求**

---

## ✨ 部署成功确认

当所有以下条件都满足时，部署即为成功:

### 必要条件 (5个)
- [ ] ✅ 所有5个容器均 "Up (healthy)"
- [ ] ✅ 后端API健康检查通过
- [ ] ✅ MySQL数据库可连接
- [ ] ✅ 前端页面可访问
- [ ] ✅ 管理员登录成功

### 可选验证 (5个)
- [ ] ✅ 学生登录和作答流程通过
- [ ] ✅ 教师评分和导出功能正常
- [ ] ✅ Redis缓存工作正常
- [ ] ✅ API响应时间< 200ms
- [ ] ✅ 并发测试通过 (100+req/s)

---

## 📞 快速联系清单

如遇到问题，按以下顺序排查:

1. **容器问题**: `docker-compose logs <service>`
2. **网络问题**: `docker network inspect` + 端口检查
3. **数据库问题**: MySQL日志 + SQL查询
4. **应用问题**: Spring Boot日志 + 业务逻辑
5. **前端问题**: 浏览器控制台 + Network选项卡

---

**检查清单版本**: v1.0
**最后更新**: 2026-03-30
**下一步**: 根据结果执行 TESTING_GUIDE.md 中的完整测试

✅ **系统已准备好部署！**
