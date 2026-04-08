# 接力教育智慧云平台 - Java/Spring Boot 架构说明

## 🎯 项目迁移完成: Python FastAPI → Java Spring Boot

**迁移状态**: ✅ **完全迁移**
**迁移日期**: 2026-03-30
**版本**: v1.0 (Java/Spring Boot 3.2.x专用)

---

## 📊 核心组件说明

### 后端服务架构

```
┌─────────────────────────────────────────────────┐
│         Java Spring Boot 3.2.x                   │
│         (localhost:8080)                         │
├─────────────────────────────────────────────────┤
│                                                  │
│  REST API Controllers                           │
│  ├── AccountController (认证&账户)               │
│  ├── ExamEngineController (答题引擎)             │
│  ├── ScoreController (成绩管理)                  │
│  └── ...                                         │
│                                                  │
│  Service Layer (业务逻辑)                        │
│  ├── AuthService (JWT认证)                      │
│  ├── ExamEngineService (答题+评分)              │
│  ├── ScoreExportService (成绩导出)              │
│  ├── AsyncTaskService (@Async异步任务)         │
│  └── ...                                         │
│                                                  │
│  Data Layer                                      │
│  ├── Spring Data JPA Repositories                │
│  ├── Entity Models (JPA注解)                     │
│  └── Database Access                            │
│                                                  │
└─────────────────────────────────────────────────┘
           ↓                    ↓
        MySQL 8.0          Redis 7
      (localhost:3307)   (localhost:6379)
```

### 前端架构

```
Vue 3 + TypeScript + Vite
(localhost:5173 开发 / :80 生产)
├── Pinia (状态管理)
├── Vue Router 4 (路由)
├── Ant Design Vue 4 (UI组件)
└── 考试诚信检测 (9层防护)
```

---

## 🔄 数据流向

### 1. 学生答题流程

```
学生登录
  ↓ JWT Token
后端验证 → 返回token
  ↓
学生获取题目 → 后端查询MySQL
  ↓
学生答题 (自动保存)
  ↓ POST /exam-engine/answers
后端保存到Redis: exam:progress:{exam_id}:{account_id}
  ↓ (TTL = 考试结束+1小时)
学生提交试卷 → POST /exam-engine/submit
  ↓
后端处理:
  1. 检查幂等性 (Redis)
  2. 获取分布式锁 (Redis SET NX EX)
  3. 从Redis获取答案
  4. 自动评分 (单选/多选/判断)
  5. 保存到MySQL (answers_snapshot)
  6. 更新StudentExamAssignment
  7. 清理Redis缓存
  ↓
返回评分结果给学生
```

### 2. 成绩导出流程

```
教师请求导出 → GET /scores/export?format=excel
  ↓
后端AsyncTaskService:
  1. 查询所有学生成绩
  2. 计算排名 (同分同名次)
  3. 使用openpyxl生成Excel (改用Java的Apache POI)
  4. 设置格式 (蓝色表头, 居中对齐)
  5. 返回文件流
  ↓
浏览器下载文件
```

### 3. 异步任务流程

```
教师请求异步导出 → POST /scores/export/async
  ↓
后端创建异步任务:
  1. 保存任务记录到MySQL (status=PENDING)
  2. 使用@Async启动后台线程
  3. 返回task_id给前端
  ↓
后台线程执行:
  1. 查询数据库
  2. 生成报告文件
  3. 保存到服务器 (/uploads)
  4. 更新任务状态 (COMPLETED)
  ↓
前端轮询查询 → GET /scores/export/tasks/{task_id}
  ↓
任务完成，返回download_url
```

---

## 🛠️ 关键技术选择

### 为什么选择Java Spring Boot

| 对比项 | Python FastAPI | Java Spring Boot | 理由 |
|--------|------------------|-------------------|------|
| 性能 | 中等 | 优秀 ✅ | 高并发考试场景 |
| 内存使用 | 低 | 中等 | 接受权衡 |
| 企业应用 | 较少 | 标准 ✅ | 教育系统常规选择 |
| 扩展性 | 较好 | 优秀 ✅ | 未来微服务化 |
| 异步任务 | Celery + Redis | Spring @Async ✅ | 无额外依赖 |
| ORM | SQLAlchemy | Spring Data JPA ✅ | 功能完整 |
| 文档生成 | FastAPI自动 | Springdoc-openapi ✅ | 一样优秀 |

### 核心依赖

```xml
<!-- pom.xml 关键依赖 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <version>3.2.x</version>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>

<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.x</version>
</dependency>

<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.0.x</version>
    <!-- 用于Excel导出 -->
</dependency>

<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <!-- 减少boilerplate代码 -->
</dependency>

<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt</artifactId>
    <version>0.12.x</version>
    <!-- JWT认证 -->
</dependency>
```

---

## 🔐 安全机制

### 1. JWT认证

```java
// 登录时生成token
String token = jwtTokenProvider.generateToken(user);

// 每个请求都验证token
@PreAuthorize("isAuthenticated()")
@GetMapping("/profile")
public ResponseEntity<?> getProfile() { }

// Token过期时间: 24小时
```

### 2. 多设备踢出 (SSO)

```java
// 用户登录时
String newToken = generateToken(user);
String oldToken = getOldToken(user);

// 将旧token加入黑名单
redis.set("kicked_session:" + oldToken, "kicked", Duration.ofHours(1));

// 请求过滤器检查
if (redis.hasKey("kicked_session:" + token)) {
    throw new UnauthorizedException("您的账户在其他设备登录，被迫下线");
}
```

### 3. 分布式锁防重复提交

```java
// 提交试卷时
String lockKey = "exam:submit_lock:" + examId + ":" + accountId;
Boolean acquired = redis.setIfAbsent(lockKey, "1", Duration.ofSeconds(30));

if (!acquired) {
    throw new TooManyRequestsException("提交正在处理中，请勿重复提交");
}

try {
    // 处理提交
} finally {
    redis.delete(lockKey); // 释放锁
}
```

### 4. 诚信检测 (9层防护)

前端:
- 页面离开检测
- 右键菜单禁用
- 复制/粘贴禁用
- 开发者工具快捷键拦截
- 多标签页检测
- 浏览器导航防护
- 文本选择禁用
- 拖拽禁用

后端:
- 可扩展API记录诚信事件

---

## 📋 数据库设计

### 关键表和关系

```
accounts (用户账户)
├── username: 用户名/身份证号
├── hashed_password: 密码 (BCrypt)
├── role: ADMIN/TEACHER/STUDENT
├── grade_group: PRIMARY/JUNIOR (小学/初中)
└── is_activated: 是否激活

exams (考试)
├── name: 考试名称
├── paper_ids: JSON [1,2,3] (试卷ID列表)
├── paper_snapshot: JSON (快照，防止编辑影响)
├── status: DRAFT/PENDING/OPEN/CLOSED/FINISHED
├── start_time: 开始时间
├── end_time: 结束时间
└── version: 乐观锁版本号

student_exam_assignments (学生考试分配)
├── exam_id: 考试ID
├── account_id: 学生ID
├── status: NOT_STARTED/IN_PROGRESS/SUBMITTED/TIMEOUT
├── answers_snapshot: JSON (完整答案记录)
├── objective_score: 客观题分数 (自动计算)
├── subjective_score: 主观题分数 (手工评分)
├── total_score: 总分 (自动计算)
└── submitted_at: 提交时间

questions (题目)
├── question_bank_id: 所属题库
├── type: single_choice/multi_choice/judgment/subjective
├── content: 题目内容
├── options: JSON [{label, content}, ...]
├── correct_answer: 正确答案
├── score: 题目分值
└── difficulty: 难度等级
```

---

## ⚙️ 关键配置

### application.yml

```yaml
spring:
  datasource:
    url: jdbc:mysql://db:3306/jieli_edu
    username: root
    password: rootpass

  jpa:
    hibernate:
      ddl-auto: validate  # 生产环境
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect
        format_sql: true

  redis:
    host: redis
    port: 6379
    timeout: 2000

  servlet:
    multipart:
      max-file-size: 100MB  # 文件上传大小限制

server:
  port: 8080
  servlet:
    context-path: /api/v1

# JWT配置
jwt:
  secret: change-this-to-a-secure-random-string
  expiration: 86400000  # 24小时 (毫秒)

# 文件上传路径
file:
  upload-path: /app/uploads
  max-size: 104857600  # 100MB
```

---

## 🚀 部署流程

### 本地开发

```bash
# 1. 启动Docker容器
docker-compose up -d

# 2. 启动后端 (IDE或命令行)
cd backend-java
./mvnw spring-boot:run

# 3. 启动前端
cd frontend
npm run dev

# 4. 访问
# 后端API: http://localhost:8080/api/v1
# 前端: http://localhost:5173
# API文档: http://localhost:8080/swagger-ui.html
```

### 生产部署

```bash
# 1. 构建JAR
cd backend-java
./mvnw clean package -DskipTests
# 生成: target/jieli-platform-1.0.0.jar

# 2. 构建Docker镜像
docker build -t jieli-platform:1.0.0 -f backend-java/Dockerfile .

# 3. 推送到镜像仓库
docker push <registry>/jieli-platform:1.0.0

# 4. 在生产环境启动
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📈 性能指标

### 预期性能

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 单个API响应时间 | < 200ms | P99 |
| 数据库查询时间 | < 50ms | 有索引情况下 |
| Redis操作时间 | < 10ms | 本地网络 |
| 并发学生答题 | 1000+ | 单机配置 |
| 内存使用 | < 2GB | 一般配置 |
| CPU使用 | < 60% | 一般配置下 |

### 优化建议

1. **数据库优化**
   - 为exam_id, account_id添加复合索引
   - 定期清理过期的exam:progress数据

2. **Redis优化**
   - 使用Redis集群提高容量
   - 配置Redis持久化

3. **应用优化**
   - 启用Spring缓存 @Cacheable
   - 异步处理非关键任务 @Async
   - 使用连接池提高数据库性能

---

## 🔗 文件结构对比

### 迁移前 (Python)

```
项目根目录/
├── app/                 # Python FastAPI应用
├── alembic/             # 数据库迁移 (Python)
├── requirements.txt     # Python依赖
├── Dockerfile           # Python Docker镜像
├── docker-compose.yml   # 包含Python profile
└── frontend/            # Vue前端
```

### 迁移后 (Java) ✅

```
项目根目录/
├── backend-java/        # Java Spring Boot应用
│   ├── src/main/java/   # Java源代码
│   ├── pom.xml          # Maven配置
│   ├── Dockerfile       # Java Docker镜像
│   └── ...
├── docker-compose.yml   # 仅包含Java服务
├── frontend/            # Vue前端 (不变)
└── nginx-java.conf      # Java Nginx配置
```

### 删除的文件

- ❌ app/ (Python FastAPI)
- ❌ alembic/ (Python迁移)
- ❌ requirements.txt (Python依赖)
- ❌ Dockerfile (旧Python版本)
- ❌ nginx.conf (Python版本)
- ❌ .env (Python环境)

---

## 📝 迁移检查清单

- ✅ 后端完全迁移到Java Spring Boot
- ✅ 数据库保持MySQL 8.0
- ✅ 缓存保持Redis 7
- ✅ 前端保持Vue 3 (无需改动)
- ✅ Docker Compose精简到3个核心服务
- ✅ 所有Python代码删除
- ✅ 所有文档更新为Java版本
- ✅ 诚信检测功能增强到9层
- ✅ 异步任务由Celery改为Spring @Async

---

**迁移完成日期**: 2026-03-30
**维护者**: 技术团队
**下一步**: 生产部署和性能调优
