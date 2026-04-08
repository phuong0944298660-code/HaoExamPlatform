# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中进行代码开发时提供指导。

## 项目概述

**接力教育智慧云平台** (Jieli Education Smart Cloud Platform) — 广西北部湾人工智能大赛（湾赛）在线考试平台。平台覆盖考试全生命周期：账号生成、题库管理、可视化组卷、考试场次实时监控、自动评分及成绩导出。

- **项目标识**: `jieli-edu-cloud-platform`
- **架构模式**: 单体架构（MVP阶段），后续可拆分为微服务
- **界面语言**: 中文（UI、错误提示、业务数据）；代码注释中英文混合
- **当前状态**: ✅ **后端开发完成** | ✅ **权限系统升级完成** (RBAC 2.0) | 🔄 **审计中** (13阶段测试)
- **后端架构**: Java 17 + Spring Boot 3.2.x

## 🚀 快速部署指南（分发用）

### 环境要求

| 要求项 | 版本 | 说明 |
|--------|------|------|
| Docker | 20.10+ | 容器化部署必需 |
| Docker Compose | 2.0+ | 多容器编排必需 |
| Git | 2.0+ | 克隆代码仓库 |
| 端口 | - | 80, 8080, 3306, 6379 必须可用 |

### 一键部署

```bash
# 1. 克隆代码仓库
git clone <repository-url>
cd Jieli\ Education\ Smart\ Cloud\ Platform

# 2. 启动所有服务
docker-compose up -d

# 3. 等待服务初始化完成（约60秒）
sleep 60

# 4. 验证部署状态
curl http://localhost/api/v1/health
docker-compose ps
```

### 访问地址

| 服务 | 地址 | 默认账号 |
|------|------|----------|
| 前端页面 | http://localhost | - |
| 后端API | http://localhost/api/v1 | - |
| API文档 | http://localhost:8080/swagger-ui.html | - |
| MySQL | localhost:3306 | jieli/jieli123 |
| Redis | localhost:6379 | - |

### 默认管理员账号

```
用户名: admin
密码: admin123
```

### 项目分发包结构

分发给其他开发者时，请包含以下内容：

```
Jieli Education Smart Cloud Platform/
├── backend-java/           # 后端Java源代码
├── frontend/               # 前端源代码
├── docker-compose.yml      # Docker编排配置
├── Dockerfile              # 后端容器镜像
├── nginx.conf              # Nginx反向代理配置
├── .env.example            # 环境变量模板
├── README.md               # 项目说明文档
├── CLAUDE.md               # 开发者指南（英文）
├── CLAUDE_CN.md            # 开发者指南（中文）
└── USER_GUIDE_AND_TEST_FLOW.md  # 完整用户手册
```

### 环境配置说明

`.env` 文件已预配置本地开发环境：

```bash
# 数据库配置
MYSQL_ROOT_PASSWORD=root123
MYSQL_DATABASE=jieli_education
MYSQL_USER=jieli
MYSQL_PASSWORD=jieli123

# JWT配置
JWT_SECRET_KEY=your-secret-key-here
JWT_EXPIRATION=86400000  # 24小时，单位毫秒

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
```

### 首次部署故障排除

**问题：端口已被占用**
```bash
# 查看占用80端口的进程
sudo lsof -i :80

# 停止冲突服务或在 docker-compose.yml 中修改端口
```

**问题：数据库连接失败**
```bash
# 重置并重新启动
docker-compose down -v  # 删除数据卷
docker-compose up -d    # 全新启动
```

**问题：前端显示空白页面**
```bash
# 检查容器是否运行
docker-compose ps

# 查看前端日志
docker-compose logs frontend

# 重新构建前端
docker-compose up -d --build frontend
```

---

## 技术栈

| 层级 | 技术选型 |
|------|---------|
| 后端框架 | Java 17 + Spring Boot 3.2.x |
| 数据库 | MySQL 8.0（通过 Spring Data JPA） |
| 缓存 / 会话 / 分布式锁 | Redis 7（通过 Spring Data Redis） |
| 任务队列 | Spring Scheduler（内置定时任务） |
| 前端框架 | Vue 3 + TypeScript + Vite（SPA 单页应用） |
| UI 组件库 | Ant Design Vue 4（图表用 ECharts，拖拽排序用 @dnd-kit） |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| 认证方式 | JWT（HS256，24小时过期）+ BCrypt 密码加密 |
| 部署方式 | Docker + Docker Compose + Nginx |

## 构建与运行命令

```bash
# 首次设置 - 前端依赖
cd frontend && npm install

# 后端开发（使用 Maven Wrapper）
cd backend-java
./mvnw clean compile              # 编译项目
./mvnw spring-boot:run            # 运行开发服务器（端口8080）

# 或使用系统 Maven
mvn clean compile
mvn spring-boot:run

# 打包部署
mvn clean package -DskipTests     # 在 target/ 目录生成 JAR

# 运行打包后的 JAR
java -jar target/jieli-platform-1.0.0.jar

# 前端开发服务器
cd frontend && npm run dev

# 运行后端测试
./mvnw test                       # 运行所有测试
./mvnw test -Dtest=UserServiceTest  # 运行指定测试类

# 运行前端测试
cd frontend && npm run test:run                         # 一次性运行测试
cd frontend && npm run test:coverage                    # 生成覆盖率报告

# 使用 Makefile 运行测试
make test           # 运行所有测试
make test-backend   # 仅后端测试
make test-frontend  # 仅前端测试
make test-e2e       # 仅 E2E 测试
make coverage       # 生成覆盖率报告

# 代码格式化
cd backend-java
./mvnw spotless:apply             # 格式化代码
./mvnw spotless:check             # 检查代码格式

cd frontend && npm run lint
```

## 环境变量

```
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/jieli_education
SPRING_DATASOURCE_USERNAME=jieli
SPRING_DATASOURCE_PASSWORD=jieli123
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379
JWT_SECRET_KEY=<密钥>
JWT_EXPIRATION=86400000
FILE_STORAGE_TYPE=local          # 或 "s3"
FILE_STORAGE_PATH=./uploads
```

## 系统架构

### 后端模块结构（Java/Spring Boot）

```
backend-java/src/main/java/com/jieliedu/platform/
├── JieliPlatformApplication.java    # Spring Boot 入口类
├── config/                          # 配置类
│   ├── SecurityConfig.java          # Spring Security + JWT 配置
│   ├── RedisConfig.java             # Redis 连接配置
│   ├── WebSocketConfig.java         # WebSocket 配置
│   ├── SwaggerConfig.java           # API 文档配置
│   └── JacksonConfig.java           # JSON 序列化配置
├── controller/                      # REST API 控制器
│   ├── AuthController.java          # 认证接口
│   ├── AccountController.java       # 账号管理
│   ├── QuestionController.java      # 题库与题目管理
│   ├── PaperController.java         # 组卷管理
│   ├── ExamController.java          # 考试管理
│   ├── ExamEngineController.java    # 答题提交与评分
│   ├── ScoreController.java         # 成绩查询与导出
│   ├── ResourceController.java      # 文件上传与预览
│   ├── FeedbackController.java      # 赛事反馈管理
│   └── SystemController.java        # 系统管理（RBAC）
├── service/                         # 业务逻辑层
│   ├── AuthService.java             # 认证与 JWT
│   ├── AccountService.java          # 账号管理
│   ├── QuestionService.java         # 题库业务逻辑
│   ├── PaperService.java            # 组卷与发布
│   ├── ExamService.java             # 考试生命周期管理
│   ├── ExamEngineService.java       # 答题提交与自动评分
│   ├── ScoreService.java            # 成绩计算与统计
│   ├── ScoreExportService.java      # 成绩导出 Excel/CSV/PDF
│   ├── ResourceService.java         # 文件上传管理
│   ├── FeedbackService.java         # 赛事反馈管理
│   └── SystemService.java           # 系统管理（用户/角色/菜单）
├── repository/                      # 数据访问层（JPA Repository）
│   ├── AccountRepository.java
│   ├── QuestionRepository.java
│   ├── ExamRepository.java
│   ├── StudentExamAssignmentRepository.java
│   └── ...
├── entity/                          # JPA 实体类
│   ├── Account.java                 # 账号实体
│   ├── Question.java                # 题目实体
│   ├── QuestionBank.java            # 题库实体
│   ├── ExamPaper.java               # 套卷模板
│   ├── PaperQuestion.java           # 套卷-题目关联
│   ├── Exam.java                    # 考试实体
│   ├── SysClass.java                # 班级实体 (新)
│   ├── StudentExamAssignment.java   # 学生考试关联
│   ├── EventFeedback.java           # 赛事反馈实体
│   └── system/                      # 系统管理实体
│       ├── SysUser.java
│       ├── SysRole.java             # 角色 (支持menuIds原子更新)
│       ├── SysMenu.java             # 菜单 (支持perms属性)
│       └── ...
├── dto/                             # 数据传输对象
│   ├── request/                     # 请求 DTO
│   └── response/                    # 响应 DTO
├── enums/                           # Java 枚举定义
│   ├── AccountType.java
│   ├── UserRole.java
│   ├── QuestionType.java
│   ├── DifficultyLevel.java
│   ├── ExamStatus.java
│   └── AssignmentStatus.java
├── security/                        # 安全组件
│   ├── JwtTokenProvider.java        # JWT 生成与验证
│   ├── JwtAuthenticationFilter.java # JWT 请求过滤器
│   ├── UserDetailsServiceImpl.java  # UserDetails 服务
│   └── CustomUserDetails.java       # 自定义 UserDetails
├── websocket/                       # WebSocket 处理器
│   └── ExamWebSocketHandler.java    # 考试实时同步
├── exception/                       # 自定义异常与处理器
│   ├── GlobalExceptionHandler.java
│   ├── BusinessException.java
│   └── ErrorCode.java
├── mapper/                          # MapStruct 映射器（实体 <-> DTO）
└── util/                            # 工具类
    ├── JsonUtils.java
    ├── DateUtils.java
    └── FileUtils.java

backend-java/src/main/resources/
├── application.yml                  # 主配置
├── application-dev.yml              # 开发环境配置
├── application-prod.yml             # 生产环境配置
└── db/migration/                    # Flyway 迁移脚本（可选）
```

### 前端结构

```
frontend/
├── src/
│   ├── api/              # API 客户端模块
│   │   ├── auth.ts       # 认证相关接口
│   │   ├── accounts.ts   # 账号管理接口
│   │   ├── questions.ts  # 题库管理接口
│   │   ├── papers.ts     # 套卷管理接口
│   │   ├── exams.ts      # 考试管理接口
│   │   ├── scores.ts     # 成绩管理接口
│   │   ├── resources.ts  # 资源中心接口
│   │   └── feedbacks.ts  # 赛事反馈接口
│   ├── router/
│   │   └── index.ts      # Vue Router 配置（含角色权限守卫）
│   ├── store/
│   │   └── user.ts       # Pinia 用户状态管理
│   ├── views/
│   │   ├── Login.vue                     # 登录页面
│   │   ├── Activate.vue                  # 账号激活页面
│   │   ├── student/                      # 学生端考试答题页面
│   │   │   ├── Home.vue                  # 学生首页
│   │   │   ├── ExamPage.vue              # 考试答题页面
│   │   │   └── ExamResult.vue            # 考试结果页面
│   │   ├── teacher/                      # 教师端管理页面
│   │   │   ├── Dashboard.vue             # 教师工作台
│   │   │   ├── Classes.vue               # 班级管理（新增）
│   │   │   ├── ClassStudents.vue         # 班级学生管理（新增）
│   │   │   ├── StudentDetail.vue         # 学生档案与成绩（新增）
│   │   │   ├── QuestionBanks.vue         # 题库管理
│   │   │   ├── QuestionBankDetail.vue    # 题库详情
│   │   │   ├── Papers.vue                # 套卷列表
│   │   │   ├── PaperDetail.vue           # 套卷编辑（拖拽组卷）
│   │   │   ├── Exams.vue                 # 考试列表
│   │   │   ├── ExamDetail.vue            # 考试详情/编辑
│   │   │   ├── ExamDashboard.vue         # 考试实时监控
│   │   │   ├── Scores.vue                # 成绩管理
│   │   │   ├── Resources.vue             # 资源中心
│   │   │   └── GradingPage.vue           # 主观题批阅
│   │   └── admin/                        # 管理后台页面
│   │       ├── Dashboard.vue             # 管理控制台
│   │       ├── Accounts.vue              # 账号管理
│   │       ├── AccountManager.vue        # 账号列表与操作
│   │       ├── ActivationCodes.vue       # 激活码管理
│   │       ├── PaperManager.vue          # 试卷管理
│   │       ├── ExamManager.vue           # 考试管理
│   │       ├── ScoreManager.vue          # 成绩管理
│   │       ├── ResourceManager.vue       # 资源管理
│   │       └── FeedbackManager.vue       # 赛事反馈管理
│   ├── components/
│   │   ├── exam/                 # 考试组件（新增）
│   │   │   ├── SingleChoice.vue      # 单选题组件
│   │   │   ├── MultiChoice.vue       # 多选题组件
│   │   │   ├── Judgment.vue          # 判断题组件
│   │   │   ├── Subjective.vue        # 主观题组件（含上传）
│   │   │   ├── AnswerSheet.vue       # 答题导航面板
│   │   │   ├── SubmitConfirmModal.vue # 提交确认弹窗
│   │   │   └── StudentSelectorModal.vue # 考试学生选择器
│   │   ├── accounts/             # 账号管理组件（新增）
│   │   │   ├── BatchGeneratePracticeModal.vue
│   │   │   ├── BatchGenerateExamModal.vue
│   │   │   └── GenerateActivationCodeModal.vue
│   │   ├── questions/            # 题库管理组件（新增）
│   │   │   ├── QuestionForm.vue
│   │   │   ├── QuestionImportModal.vue
│   │   │   └── QuestionPreview.vue
│   │   ├── PaperBuilder.vue      # 拖拽式组卷组件
│   │   ├── AnswerCard.vue        # 考试答题卡导航
│   │   ├── QuestionDisplay.vue   # 题目渲染（支持4种题型）
│   │   ├── ExamCountdown.vue     # 倒计时组件（含警告提醒）
│   │   ├── DashboardCard.vue     # 考试实时监控看板卡片
│   │   └── common/               # 共享通用组件
│   ├── layouts/
│   │   ├── StudentLayout.vue     # 学生端布局
│   │   ├── TeacherLayout.vue     # 教师端布局
│   │   └── AdminLayout.vue       # 管理端布局
│   ├── types/
│   │   └── api.ts                # TypeScript 类型定义
│   └── utils/
│       └── request.ts            # Axios HTTP 客户端配置
├── package.json            # NPM 依赖
├── vite.config.ts          # Vite 配置
└── tsconfig.json           # TypeScript 配置
```

### 数据表

**数据表**: activation_plans（激活计划）、activation_codes（激活码）、user_activations（用户激活记录）、accounts（账号）、classes（班级）、class_students（班级学生）、question_banks（题库）、questions（题目）、exam_papers（套卷）、paper_questions（套卷-题目关联）、exams（考试）、student_exam_assignments（学生考试关联）、exam_realtime_stats（考试实时统计）、exam_auto_submit_logs（自动提交日志）、audit_logs（审计日志）、resources（教学资源）、question_bank_stats（题库统计）、async_tasks（异步任务）、sys_configs（系统配置）、sys_depts（部门）、sys_dict_data（字典数据）、sys_dict_types（字典类型）、sys_login_logs（登录日志）、sys_menus（菜单）、sys_notices（通知公告）、sys_operation_logs（操作日志）、sys_roles（角色）、sys_users（系统用户）

**枚举类型**: account_type（账号类型）、grade_group（学段）、user_role（用户角色）、question_type（题型）、difficulty_level（难度）、exam_status（考试状态）、assignment_status（考试分配状态）、task_status（任务状态）

### 核心架构设计模式

**考试快照隔离机制**: 考试发布时，将套卷的完整内容（题目、选项、答案、评分规则）深拷贝到 `Exam.paperSnapshot` JSON 字段中。确保后续对套卷/题目的修改不会影响进行中的考试。快照包含版本号和 SHA-256 哈希值用于完整性校验。

**模板与实例模型**: `ExamPaper`（套卷）是可复用的模板（与考试为一对多关系）。`Exam`（考试）是一次性实例，拥有独立的快照。套卷状态流转：`draft（草稿）→ published（已发布）→ archived（已归档）`；考试状态流转：`draft（草稿）→ pending（待开放）→ open（进行中）→ closed（已关闭）/ finished（已完成）`。

**多端互踢机制（单点登录）**: 登录时，前一个会话的 JWT 存入 Redis 的 `kicked_session:{token}` 键中。Spring Security 过滤器在每次请求时检查被踢状态。通过 WebSocket 向旧会话推送 `force_logout` 事件后断开连接。

**考试提交分布式锁**: 使用 Redis `SET NX EX` 防止重复提交竞态条件。幂等性 Key 缓存提交结果5分钟。数据库层使用 `SELECT FOR UPDATE` 锁定考试分配记录行。

**答题自动保存至 Redis**: 学生答案保存到 `exam:{exam_id}:{account_id}:progress`，TTL 动态计算（考试结束时间 + 1小时）。提交或超时后，答案迁移至 MySQL 持久化。

**Spring 定时任务**: 每60秒执行 `ExamStatusTransitionTask`，自动流转考试状态（到达开始时间时 PENDING→OPEN，到达结束时间时 OPEN→FINISHED 并批量自动提交未完成学生的试卷）。

### 数据库设计要点

- 分数字段使用 `DECIMAL(5,2)` — 禁止使用 `FLOAT` 存储分数
- 身份证号使用 `CHAR(18)`（固定18位）
- 所有实体支持软删除（`isDeleted`、`deletedAt`、`deletedBy`）
- 通过 `@Version` 注解实现乐观锁，应用于 `exam_papers`、`exams`、`questions` 表
- 外键使用 `ON DELETE RESTRICT`（防止误级联删除）或 `ON DELETE SET NULL`
- 激活码使用 `SELECT FOR UPDATE` 配合 `SKIP LOCKED` 防止并发激活竞态条件

### RBAC 2.0 细粒度权限 (新)
- **按钮级控制**: 支持 `F` 类型权限（如 `system:user:add`），通过 `SysMenu.perms` 字段定义。
- **一体化配置**: 角色新增/编辑弹窗内置权限树，支持 `menu_ids` 原子化提交与学校/班级管理打通。
- **学校隔离**: 账号属性包含 `school`，教师仅能管理本校学生和班级。教师可以通过“班级管理”入口，为属于同一学校的学生分配班级。
- **搜索化关联**: 账号管理的“所属学校”采用搜索选择+动态新增模式，确保数据一致性。

## 激活码管理系统（新增）

平台实现了灵活的激活码权限控制系统，通过"激活计划"（权限模板）和"激活码"（实例）来精细化控制功能访问。

### 核心概念

```
┌─────────────────────────────────────────────────────────────┐
│                      激活计划                                │
│                   （权限模板）                               │
├─────────────────────────────────────────────────────────────┤
│  - 名称：小学教师年卡                                         │
│  - 目标角色：teacher / student                              │
│  - 适用学段：primary / middle / high                        │
│  - 有效期：365天（-1表示永久）                               │
│  - 权限配置：                                                │
│    {                                                        │
│      questionBanks: [{id: 1, canPractice: true}, ...],      │
│      resourcePackages: [1, 2, 3],                           │
│      features: {                                            │
│        canCreateExam: true,      # 能否创建考试             │
│        canUseAiGrader: false,    # 能否使用AI阅卷           │
│        canExportData: true       # 能否导出数据             │
│      }                                                      │
│    }                                                        │
│  - 价格：299.00元                                           │
│  - 线上销售：是/否                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ 生成实例
┌─────────────────────────────────────────────────────────────┐
│                      激活码                                  │
│                     （实例）                                 │
├─────────────────────────────────────────────────────────────┤
│  - 码值：XXXX-XXXX-XXXX-XXXX                                │
│  - 关联计划：→ 激活计划                                      │
│  - 状态：未使用 / 已使用 / 已过期                           │
│  - 来源：线上销售 / 线下分发                                │
│  - 批次号：2024春季培训（用于跟踪）                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ 用户激活
┌─────────────────────────────────────────────────────────────┐
│                    用户激活记录                              │
│              （记录用户的有效权限）                          │
├─────────────────────────────────────────────────────────────┤
│  - 用户ID                                                   │
│  - 激活码ID                                                 │
│  - 计划ID                                                   │
│  - 权限快照（保留激活时的计划配置，防止后续修改影响）        │
│  - 激活时间 / 到期时间                                      │
└─────────────────────────────────────────────────────────────┘
```

### API接口

**管理端接口：**
```
POST   /api/v1/activations/admin/plans          # 创建激活计划
GET    /api/v1/activations/admin/plans          # 激活计划列表
PUT    /api/v1/activations/admin/plans/{id}     # 更新计划
DELETE /api/v1/activations/admin/plans/{id}     # 删除计划

POST   /api/v1/activations/admin/codes/batch    # 批量生成激活码
GET    /api/v1/activations/admin/codes          # 激活码列表
DELETE /api/v1/activations/admin/codes/{id}     # 作废未使用激活码
```

**用户端接口：**
```
POST   /api/v1/activations/use                  # 使用激活码
GET    /api/v1/activations/my-activations      # 我的激活记录
GET    /api/v1/activations/my-permissions      # 我的当前权限
GET    /api/v1/activations/plans                # 可购买的计划列表
```

### 权限检查

```java
// 获取用户的合并权限
PermissionDTO permissions = permissionService.getUserPermissions(userId);
// 返回：
// {
//   "questionBanks": [1, 2, 3],           // 可访问的题库ID列表
//   "resourcePackages": [1, 2],           // 可访问的资源包ID列表
//   "features": {
//     "canCreateExam": true,              // 能否创建考试
//     "canPractice": true                 // 能否自主练习
//   },
//   "isActivated": true,                  // 是否有有效激活
//   "expireAt": "2025-12-31T23:59:59"    // 最早到期时间
// }
```

### Redis 键名规范

```
exam:{exam_id}:{account_id}:progress   # 答题进度（动态TTL）
session:{token}                         # 用户会话（24小时）
kicked_session:{token}                  # 被踢会话信息（1小时）
lock:{resource_type}:{resource_id}      # 分布式锁（10秒）
exam:{exam_id}:snapshot                 # 考试快照缓存（1小时）
exam:{exam_id}:dashboard               # 看板统计数据（30秒）
submit_lock:{exam_id}:{account_id}     # 防重复提交锁（10秒）
```

### API 响应规范

所有列表接口使用统一分页格式：
```json
{
  "code": 200,
  "data": [...],
  "meta": {
    "page": 1, "size": 20, "total": 100,
    "totalPages": 5, "hasNext": true, "hasPrev": false
  }
}
```

异步批量操作（批量导入、批量生成、导出）返回 `202` 状态码及 `jobId`，通过 `GET /api/v1/jobs/{jobId}` 轮询任务进度。

### 多选题评分规则

三种部分得分计算模式：
- `fixed`（固定分值）: 全对但少选，得固定的部分分
- `per_option`（按选项计分）: 得分 =（正确选中数 / 正确选项总数）× 满分
- `proportional`（按比例计分）: 得分 = 选中比例 × 满分

错选或多选一律得0分。

### 账号体系

两种完全隔离的账号类型：
- **练习账号** (`AccountType.PRACTICE`): 系统自动生成用户名，用于赛前练习
- **考试账号** (`AccountType.EXAM`): 以身份证号作为账号，用于正式比赛

四类激活码控制访问权限：小学老师、小学学生、初中老师、初中学生。老师激活码可解锁题库+教学资源；学生激活码仅可解锁题库。禁止跨学段访问。

---

## Java 开发规范

### Lombok 使用

所有实体类和 DTO 使用 Lombok 注解减少样板代码：

```java
@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "username", nullable = false, length = 50)
    private String username;
    
    // Lombok 自动生成 getter、setter、构造器、builder
}
```

常用 Lombok 注解：
- `@Getter` / `@Setter`: 生成 getter/setter
- `@NoArgsConstructor`: 生成无参构造器
- `@AllArgsConstructor`: 生成全参构造器
- `@Builder`: 生成建造者模式
- `@Data`: 组合注解（包含 @Getter、@Setter、@ToString、@EqualsAndHashCode）
- `@Slf4j`: 注入日志对象（`log.info()`、`log.error()`）

### JPA 注解

实体映射遵循 JPA 3.1（Jakarta EE 命名空间）：

```java
@Entity
@Table(name = "exams", indexes = {
    @Index(name = "idx_exam_status", columnList = "status"),
    @Index(name = "idx_exam_time", columnList = "start_time,end_time")
})
public class Exam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "title", nullable = false, length = 200)
    private String title;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ExamStatus status;
    
    @Column(name = "paper_snapshot", columnDefinition = "json")
    @Convert(converter = JsonConverter.class)
    private PaperSnapshot paperSnapshot;
    
    @Version
    @Column(name = "version")
    private Integer version;  // 乐观锁
    
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
}
```

### Spring Security 配置

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/teacher/**").hasAnyRole("ADMIN", "TEACHER")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), 
                UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

### 枚举类定义

```java
public enum ExamStatus {
    DRAFT("草稿"),
    PENDING("待开放"),
    OPEN("进行中"),
    CLOSED("已关闭"),
    FINISHED("已完成");
    
    private final String description;
    
    ExamStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}
```

### Repository 模式

```java
@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    
    @Query("SELECT e FROM Exam e WHERE e.status = :status AND e.isDeleted = false")
    List<Exam> findByStatus(@Param("status") ExamStatus status);
    
    @Modifying
    @Query("UPDATE Exam e SET e.status = :newStatus WHERE e.id = :id")
    int updateStatus(@Param("id") Long id, @Param("newStatus") ExamStatus newStatus);
    
    // 方法名查询
    List<Exam> findByStatusAndStartTimeBefore(ExamStatus status, LocalDateTime time);
}
```

### Service 层模式

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExamService {
    
    private final ExamRepository examRepository;
    private final ExamMapper examMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    
    public ExamDTO getExamById(Long id) {
        Exam exam = examRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.EXAM_NOT_FOUND));
        return examMapper.toDTO(exam);
    }
    
    @Transactional
    public ExamDTO createExam(ExamCreateRequest request) {
        Exam exam = examMapper.toEntity(request);
        exam.setStatus(ExamStatus.DRAFT);
        exam = examRepository.save(exam);
        return examMapper.toDTO(exam);
    }
}
```

### Controller 模式

```java
@RestController
@RequestMapping("/api/v1/exams")
@RequiredArgsConstructor
@Tag(name = "考试管理", description = "Exam Management API")
public class ExamController {
    
    private final ExamService examService;
    
    @GetMapping("/{id}")
    @Operation(summary = "根据ID获取考试")
    public Result<ExamDTO> getExam(@PathVariable Long id) {
        return Result.success(examService.getExamById(id));
    }
    
    @PostMapping
    @Operation(summary = "创建新考试")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public Result<ExamDTO> createExam(@Valid @RequestBody ExamCreateRequest request) {
        return Result.success(examService.createExam(request));
    }
}
```

---

## 🚀 审计任务 (Audit Task List)

请严格参照 `docs/guides/DETAILED_TEST_TODO_AND_PROCEDURES.md` 执行以下 13 阶段审计：

| 阶段 | 描述 | 状态 |
|------|------|------|
| 1-3 | 基础设施、认证与题库 | ✅ 完成 |
| 4 | 激活码与学校关联 | ✅ 完成 (后端联动就绪) |
| 5 | RBAC 2.0 细粒度审计 | ✅ 完成 (支持按钮级控制) |
| 6-7 | 练习交互与错题本 | ⏳ 待执行 |
| 8-10 | 考试全流程、阅卷与防作弊 | ⏳ 待执行 |
| 11-13 | 管理看板、健壮性与切屏监测 | ⏳ 待执行 |

---

## 参考文档

项目根目录下的 `Functional Requirements Markdown File` 包含完整的功能规格说明：数据模型、API 接口契约、评分算法、状态机、UI 线框图，以及所有已修复的缺陷（按 P0/P1/P2/P3 优先级标注并附修复说明）。

---

## 开发踩坑记录与经验教训

### 数据库字段缺失问题

**发现时间**: 2026-03-24  
**严重程度**: 中  
**影响范围**: 考试创建接口

#### 问题描述
`exams` 表缺少 `is_score_query_open` 等字段，导致创建考试时 500 错误。

#### 修复命令
```sql
ALTER TABLE exams 
ADD COLUMN is_score_query_open TINYINT(1) DEFAULT 0, 
ADD COLUMN score_query_start_time DATETIME NULL, 
ADD COLUMN score_query_end_time DATETIME NULL;
```

#### 长期解决方案
将字段添加到 Flyway 迁移脚本，确保新环境自动创建。

---

### API 接口字段命名规范

**题目创建接口** (`POST /api/v1/questions/`)

| 字段 | 错误用法 | 正确用法 |
|-----|---------|---------|
| 题库ID | `bankId` | `questionBankId` |
| 题型 | `multiple_choice` | `multi_choice` |
| 选项格式 | `["1", "2"]` | `[{"label": "A", "content": "1"}]` |
| 正确答案 | `["2"]` | `"B"` 或 `"B,D"` |
| 判断题答案 | `true/false` | `T/F` |

**套卷发布接口**
- HTTP 方法: `POST` (不是 PUT)
- 路径: `/api/v1/papers/{id}/publish`

---

### Docker 开发常见问题

#### 代码修改未生效
修改代码后重启容器，发现修改未生效：
```bash
# 强制重新构建（开发环境推荐）
docker-compose down
docker-compose up -d --build
```

#### 查看服务状态
```bash
# 所有服务状态
docker-compose ps

# 查看后端日志
docker-compose logs --tail=50 backend

# 查看MySQL日志
docker-compose logs db
```

---

## 项目分发打包指南

### 分发给其他开发团队

当需要将本项目分发给其他开发团队时，请包含以下文件：

**必需文件清单:**
```
Jieli Education Smart Cloud Platform/
├── backend-java/           # 后端Java源代码
├── frontend/               # 前端源代码  
├── tests/                  # 测试套件
├── scripts/                # 工具脚本
├── docker-compose.yml      # Docker编排配置
├── Dockerfile              # 后端容器配置
├── nginx.conf              # Nginx配置
├── pom.xml                 # Maven配置
├── .env.example            # 环境变量模板
├── .env                    # 预配置环境变量
├── README.md               # 主项目指南
├── CLAUDE.md               # 英文版开发指南
├── CLAUDE_CN.md            # 中文版开发指南（本文件）
├── USER_GUIDE_AND_TEST_FLOW.md  # 用户手册
├── USER_MANUAL.md          # 详细用户指南
├── DEPLOYMENT_GUIDE.md     # 生产环境部署指南
└── LOCAL_DEVELOPMENT_GUIDE.md   # 本地开发指南
```

**打包命令:**
```bash
# 创建分发压缩包
tar -czvf jieli-edu-platform-v3.0.0.tar.gz \
  backend-java/ frontend/ tests/ scripts/ \
  docker-compose.yml Dockerfile nginx.conf \
  pom.xml .env.example .env README.md \
  CLAUDE.md CLAUDE_CN.md \
  USER_GUIDE_AND_TEST_FLOW.md USER_MANUAL.md \
  DEPLOYMENT_GUIDE.md LOCAL_DEVELOPMENT_GUIDE.md

# 或使用 zip
zip -r jieli-edu-platform-v3.0.0.zip \
  backend-java/ frontend/ tests/ scripts/ \
  docker-compose.yml Dockerfile nginx.conf \
  pom.xml .env.example .env README.md \
  CLAUDE.md CLAUDE_CN.md \
  USER_GUIDE_AND_TEST_FLOW.md USER_MANUAL.md \
  DEPLOYMENT_GUIDE.md LOCAL_DEVELOPMENT_GUIDE.md
```

**接收者部署步骤:**
```bash
# 1. 解压压缩包
tar -xzvf jieli-edu-platform-v3.0.0.tar.gz
cd jieli-edu-platform

# 2. 验证环境要求
docker --version
docker-compose --version

# 3. 检查端口占用
sudo lsof -i :80
sudo lsof -i :3306
sudo lsof -i :6379

# 4. 启动服务
docker-compose up -d

# 5. 等待初始化完成（约60秒）
sleep 60

# 6. 验证部署
curl http://localhost/api/v1/health
docker-compose ps

# 7. 访问系统
open http://localhost
```

---

**文档版本**: v4.0  
**最后更新**: 2026-03-25  
**迁移说明**: 从 Python/FastAPI 迁移至 Java/Spring Boot
