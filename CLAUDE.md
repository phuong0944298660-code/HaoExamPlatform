# CLAUDE.md - 接力教育智慧云平台开发指南

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

**Jieli Education Smart Cloud Platform** (接力教育智慧云平台) — 广西北部湾人工智能竞赛（湾赛）在线考试平台。平台管理完整的考试生命周期：账户生成、题库管理、试卷组装、考试会话、实时监考、自动评分和成绩导出。

- **项目ID**: `jieli-edu-cloud-platform`
- **架构**: 单体应用 (MVP阶段)，设计用于未来微服务分解
- **主语言**: 中文 (UI、错误提示、数据)；代码注释混合中英文
- **状态**: ✅ **后端开发完成** | ✅ **权限系统升级完成** (RBAC 2.0) | 🔄 **审计中**
- **后端框架**: Java 17 + Spring Boot 3.2.x

---

## 🚀 快速部署指南

### 系统要求

| 要求 | 版本 | 说明 |
|------|------|------|
| Docker | 20.10+ | 容器化部署必需 |
| Docker Compose | 2.0+ | 多容器编排必需 |
| Git | 2.0+ | 版本控制 |
| 端口 | - | 80, 8080, 3306, 6379 必须可用 |

### 一键部署

```bash
# 1. 克隆仓库
git clone <repository-url>
cd Jieli\ Education\ Smart\ Cloud\ Platform

# 2. 启动所有服务
docker-compose up -d

# 3. 等待初始化 (约60秒)
sleep 60

# 4. 验证部署
curl http://localhost:8080/api/v1/health
docker-compose ps
```

### 访问入口

| 服务 | URL | 凭证 |
|------|-----|------|
| 前端 | http://localhost | - |
| 后端API | http://localhost:8080/api/v1 | - |
| API文档 | http://localhost:8080/swagger-ui.html | - |
| MySQL | localhost:3307 | root/rootpass |
| Redis | localhost:6379 | - |

### 默认管理员账户

```
用户名: admin
密码: admin123
```

---

## 📊 技术栈

| 层级 | 技术 | 备注 |
|------|------|------|
| 后端 | Java 17 + Spring Boot 3.2.x | 完全迁移，替代Python FastAPI |
| 数据库 | MySQL 8.0 | Spring Data JPA ORM |
| 缓存/会话/锁 | Redis 7 | Spring Data Redis |
| 异步任务 | Spring @Async, @Scheduled | 替代Celery |
| 前端 | Vue 3 + TypeScript + Vite | SPA应用 |
| UI组件库 | Ant Design Vue 4 | 图表(ECharts)、拖拽(@dnd-kit) |
| 状态管理 | Pinia | Vue状态管理 |
| 路由 | Vue Router 4 | 前端路由 |
| 认证 | JWT (HS256) + BCrypt | 24小时过期，密码加密 |
| 部署 | Docker + Nginx | 容器化部署 |

---

## 🏗️ 项目结构

### 后端结构 (Java/Spring Boot)

```
backend-java/src/main/java/com/jieliedu/platform/
├── JieliPlatformApplication.java        # Spring Boot 入口点
├── config/                              # 配置类
│   ├── SecurityConfig.java              # Spring Security + JWT
│   ├── RedisConfig.java                 # Redis配置
│   ├── WebSocketConfig.java             # WebSocket配置
│   ├── SwaggerConfig.java               # API文档配置
│   └── JacksonConfig.java               # JSON序列化配置
├── controller/                          # REST API控制器
│   ├── AuthController.java              # 认证端点
│   ├── AccountController.java           # 账户管理
│   ├── QuestionController.java          # 题库管理
│   ├── PaperController.java             # 试卷管理
│   ├── ExamController.java              # 考试管理
│   ├── ExamEngineController.java        # 答题引擎
│   ├── ScoreController.java             # 成绩管理
│   ├── ResourceController.java          # 资源文件
│   └── SystemController.java            # 系统管理 (RBAC)
├── service/                             # 业务逻辑层
│   ├── AuthService.java                 # 认证
│   ├── AccountService.java              # 账户管理
│   ├── QuestionService.java             # 题库操作
│   ├── PaperService.java                # 试卷组装
│   ├── ExamService.java                 # 考试管理
│   ├── ExamEngineService.java           # 答题和评分
│   ├── ScoreService.java                # 成绩计算
│   ├── ScoreExportService.java          # 成绩导出 (Excel/CSV/PDF)
│   └── AsyncTaskService.java            # 异步任务 (@Async)
├── repository/                          # 数据访问层 (JPA)
│   ├── AccountRepository.java
│   ├── QuestionRepository.java
│   ├── ExamRepository.java
│   └── ...
├── entity/                              # JPA实体
│   ├── Account.java                     # 账户
│   ├── Question.java                    # 题目
│   ├── Exam.java                        # 考试
│   ├── SysClass.java                    # 班级 (新)
│   ├── SysRole.java                     # 角色 (支持menuIds原子更新)
│   ├── StudentExamAssignment.java       # 学生考试分配
│   ├── ExamPaper.java                   # 试卷
│   └── ...
├── dto/                                 # DTO (数据传输对象)
│   ├── request/                         # 请求DTO
│   └── response/                        # 响应DTO
├── enums/                               # 枚举类型
│   ├── AccountType.java
│   ├── UserRole.java
│   ├── QuestionType.java
│   ├── ExamStatus.java
│   └── AssignmentStatus.java
├── security/                            # 安全组件
│   ├── JwtTokenProvider.java            # JWT生成/验证
│   ├── JwtAuthenticationFilter.java     # JWT请求过滤器
│   └── UserDetailsServiceImpl.java       # UserDetails服务
├── websocket/                           # WebSocket处理
│   └── ExamWebSocketHandler.java        # 实时考试同步
├── exception/                           # 异常处理
│   ├── GlobalExceptionHandler.java      # 全局异常处理
│   └── BusinessException.java           # 业务异常
├── mapper/                              # MapStruct映射器
│   └── ...
└── util/                                # 工具类
    ├── JsonUtils.java
    └── DateUtils.java

backend-java/src/main/resources/
├── application.yml                      # 主配置
├── application-dev.yml                  # 开发配置
├── application-prod.yml                 # 生产配置
└── db/migration/                        # Flyway数据库迁移
```

### 前端结构

```
frontend/src/
├── api/                                 # API客户端
│   ├── auth.ts
│   ├── accounts.ts
│   ├── questions.ts
│   ├── papers.ts
│   ├── exams.ts
│   ├── scores.ts
│   └── resources.ts
├── router/
│   └── index.ts                         # 路由配置 (角色守卫)
├── store/
│   └── user.ts                          # Pinia用户状态
├── views/
│   ├── Login.vue                        # 登录页
│   ├── student/                         # 学生页面
│   │   ├── Home.vue                     # 学生首页
│   │   ├── ExamPage.vue                 # 答题页面
│   │   └── ExamResult.vue               # 成绩查看
│   ├── teacher/                         # 教师页面
│   │   ├── Dashboard.vue                # 教师工作台
│   │   ├── Classes.vue                  # 班级管理 (新: 支持学校隔离)
│   │   ├── ClassStudents.vue            # 班级学生管理
│   │   ├── QuestionBanks.vue            # 题库管理
│   │   ├── Papers.vue                   # 试卷管理
│   │   ├── Exams.vue                    # 考试管理
│   │   ├── ExamDashboard.vue            # 实时监考
│   │   ├── Scores.vue                   # 成绩管理
│   │   ├── GradingPage.vue              # 主观题评分
│   │   └── Resources.vue                # 资源中心
│   └── admin/                           # 管理员页面
│       ├── Dashboard.vue                # 管理控制台
│       ├── Accounts.vue                 # 账户管理
│       ├── PaperManager.vue             # 试卷管理
│       ├── ExamManager.vue              # 考试管理
│       └── ScoreManager.vue             # 成绩管理
├── components/
│   ├── exam/                            # 考试组件
│   │   ├── SingleChoice.vue             # 单选题
│   │   ├── MultiChoice.vue              # 多选题
│   │   ├── Judgment.vue                 # 判断题
│   │   ├── Subjective.vue               # 主观题 (文字答题)
│   │   ├── AnswerSheet.vue              # 答题卡
│   │   └── ExamCountdown.vue            # 倒计时
│   └── common/                          # 通用组件
├── layouts/
│   ├── ExamLayout.vue                   # 考试布局 (诚信检测功能)
│   ├── StudentLayout.vue
│   ├── TeacherLayout.vue
│   └── AdminLayout.vue
├── types/
│   └── api.ts                           # TypeScript类型定义
└── utils/
    └── request.ts                       # Axios HTTP客户端
```

---

## 🗄️ 数据库架构

### 核心表

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `accounts` | 用户账户 | id, username, identity_no, grade_group, role, school, class_id, is_activated |
| `questions` | 题目库 | id, question_bank_id, type, content, correct_answer, score |
| `question_banks` | 题库分类 | id, name, grade_group, owner_id |
| `classes` | 班级管理 | id, name, school, grade_group, teacher_id |
| `exam_papers` | 试卷模板 | id, name, grade_group, paper_questions(JSON), status |
| `exams` | 考试实例 | id, name, paper_ids(JSON), paper_snapshot(JSON), status |
| `student_exam_assignments` | 学生考试分配 | id, exam_id, account_id, status, answers_snapshot(JSON), objective_score, subjective_score |
| `redis` | 缓存 | exam:progress, exam:submit_lock, session tokens |

### 关键枚举

```sql
-- 账户类型
ENUM('PRACTICE', 'EXAM')

-- 学段分组
ENUM('PRIMARY', 'JUNIOR', 'OTHER', 'SENIOR', 'UNIVERSITY')

-- 考试状态
ENUM('DRAFT', 'PENDING', 'OPEN', 'CLOSED', 'FINISHED')

-- 学生分配状态
ENUM('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'TIMEOUT')
```

---

## 🔄 核心设计模式

### 1. 试卷快照隔离
发布考试时，将试卷内容深层复制到 `Exam.paperSnapshot` JSON字段。防止后续编辑影响进行中的考试。

### 2. 模板 vs 实例模型
- `ExamPaper`: 可重用的试卷模板 (一对多关系)
- `Exam`: 一次性考试实例 (包含快照)

### 3. 分布式锁防重复提交
```java
// Redis SET NX EX 防止并发提交冲突
String lockKey = "exam:submit_lock:" + examId + ":" + accountId;
boolean acquired = redisTemplate.opsForValue()
    .setIfAbsent(lockKey, "1", Duration.ofSeconds(30));
```

### 4. 答题进度自动保存到Redis
```
Key: exam:progress:{exam_id}:{account_id}
Value: {
  "answers": {
    "1": {"answer": "A", ...},
    "2": {"answer": "B,D", ...}
  },
  "last_saved_at": "2026-03-30T10:15:30"
}
TTL: 考试结束时间 + 1小时
```

### 5. 异步任务处理
```java
// 替代Celery的Spring异步任务
@Service
public class AsyncTaskService {
    @Async
    public void exportScoresToExcel(Long examId, String format) {
        // 异步处理，不阻塞HTTP响应
    }

    @Scheduled(cron = "0 * * * * *")  // 每分钟执行一次
    public void autoSubmitExams() {
        // 定时任务：自动提交超时的考试
    }
}
```

### 6. 乐观锁优化
使用 `@Version` 注解实现乐观锁，防止并发修改。

### 7. RBAC 2.0 细粒度权限 (新)
- **按钮级控制**: 支持 `F` 类型权限（如 `system:user:add`），通过 `SysMenu.perms` 字段定义。
- **一体化配置**: 角色新增/编辑弹窗内置权限树，支持 `menu_ids` 原子化提交与学校/班级管理打通。
- **学校隔离**: 账号属性包含 `school`，教师仅能管理本校学生和班级。教师可以通过“班级管理”入口，为属于同一学校的学生分配班级。
- **搜索化关联**: 账号管理的“所属学校”采用搜索选择+动态新增模式，确保数据一致性。

### 8. UI/UX 规范

#### 侧边栏菜单图标规范

菜单图标通过后端 `sys_menu` 表的 `icon` 字段配置，前端通过 `iconMap` 映射到 Ant Design Vue 图标组件。

**一级菜单推荐图标映射**:

| 菜单名称 | 推荐图标 | icon 字段值 | 说明 |
|---------|---------|------------|------|
| 管理控制台 | 📊 DashboardOutlined | `dashboard` | 首页仪表盘 |
| 账号管理 | 👥 TeamOutlined | `team` | 用户/账号管理 |
| 激活授权 | 🔐 SafetyOutlined | `safety` | 授权/激活码管理 |
| 题库系统 | 📚 BookOutlined | `book` | 题库/题目管理 |
| 考试系统 | 📝 CalendarOutlined | `calendar` | 考试/试卷管理 |
| 赛事反馈 | 🏆 FlagOutlined | `flag` | 竞赛/反馈管理 |
| 系统管理 | ⚙️ SettingOutlined | `setting` | 系统配置 |
| 班级管理 | 🏫 ClusterOutlined | `cluster` | 班级/学校管理 |
| 成绩管理 | 📈 BarChartOutlined | `bar-chart` | 成绩统计 |
| 资源中心 | 📁 FolderOutlined | `folder` | 文件资源管理 |

**可用图标列表** (前端已注册):
```typescript
// 基础图标
dashboard, team, key, database, file, calendar, chart, setting
message, safety, tool, user, barcode, snippets, form, inbox

// 扩展图标 (推荐用于一级菜单)
book, read, edit, trophy, flag, solution, audit, container
folder, profile, experiment, area-chart, bar-chart
cloud-server, api, cluster, menu, copy, reconciliation
contacts
```

**配置示例** (SQL):
```sql
-- 更新一级菜单图标
UPDATE sys_menu SET icon = 'book' WHERE menu_name = '题库系统' AND menu_type = 'M';
UPDATE sys_menu SET icon = 'flag' WHERE menu_name = '赛事反馈' AND menu_type = 'M';
UPDATE sys_menu SET icon = 'safety' WHERE menu_name = '激活授权' AND menu_type = 'M';
```

#### 表格操作列设计规范

**原则**: 操作列应始终固定，按钮横向排列，间距紧凑。

```vue
<!-- 模板示例 -->
<template v-if="column.key === 'action'">
  <a-space size="small">
    <a @click="handleEdit(record)">编辑</a>
    <a-divider type="vertical" />
    <a-popconfirm title="确认禁用？" @confirm="handleToggle(record)">
      <a :style="{ color: record.is_active ? '#ff4d4f' : '#52c41a' }">禁用</a>
    </a-popconfirm>
    <a-divider type="vertical" />
    <a-popconfirm title="确认删除？" @confirm="handleDelete(record)">
      <a class="text-danger">删除</a>
    </a-popconfirm>
  </a-space>
</template>
```

**样式规范** (添加到 `<style scoped>`):
```css
/* 操作按钮横向排列 */
:deep(.ant-space) {
  display: inline-flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center;
  gap: 4px !important;  /* 紧凑间距 */
}

:deep(.ant-space-item) {
  display: inline-flex;
  align-items: center;
}

/* 操作列固定样式 */
:deep(.ant-table-cell-fix-right) {
  white-space: nowrap !important;
  background: #fff;
}

/* 文字按钮间距 */
:deep(.ant-table-cell) a {
  padding: 0 4px;
}

:deep(.ant-divider-vertical) {
  margin: 0 2px;
}
```

**列定义**:
```typescript
const columns = [
  // ... 其他列
  { 
    title: '操作', 
    key: 'action', 
    width: 150, 
    fixed: 'right'  // 固定右侧
  },
]
```

**要点**:
1. 操作列必须设置 `fixed: 'right'` 固定
2. 按钮使用 `<a-space size="small">` 包裹，文字横向排列
3. 分隔线使用 `<a-divider type="vertical" />`
4. 通过 CSS 覆盖确保 `flex-direction: row` 和紧凑间距

---

## 📌 重要API端点

### 核心考试流程

```
POST   /api/v1/accounts/login                    # 登录
GET    /api/v1/exam-engine/exams/{id}/questions # 获取题目
POST   /api/v1/exam-engine/exams/{id}/answers   # 保存答案
POST   /api/v1/exam-engine/exams/{id}/submit    # 提交试卷
GET    /api/v1/scores                           # 查询成绩
GET    /api/v1/scores/export                    # 导出成绩
```

---

## 🏗️ 构建和运行

### Maven命令

```bash
# 进入后端目录
cd backend-java

# 编译
./mvnw clean compile

# 运行开发服务器
./mvnw spring-boot:run

# 打包为JAR
./mvnw clean package -DskipTests

# 运行JAR
java -jar target/jieli-platform-1.0.0.jar

# 运行测试
./mvnw test

# 代码格式检查
./mvnw spotless:check
./mvnw spotless:apply
```

### Docker快速启动

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs backend -f

# 停止服务
docker-compose down
```

---

## 🔐 安全性

### JWT认证流程
1. 用户登录 → 获取JWT token
2. 后续请求在 `Authorization: Bearer {token}` 中附带token
3. `JwtAuthenticationFilter` 验证token有效性
4. `@PreAuthorize` 注解验证用户角色和权限

### 多设备登录踢出
1. 登录时生成新token，旧token存入Redis的"踢出"列表
2. 请求过滤器检查token是否被踢出
3. WebSocket推送 `force_logout` 事件
4. 前端自动断开连接

### 诚信检测 (前端)
- 页面离开检测 (visibilitychange)
- 窗口失焦检测 (blur)
- 禁用右键菜单、复制、粘贴
- 禁用开发者工具快捷键 (F12, Ctrl+Shift+I等)
- 多标签页检测 (localStorage)

---

## 📋 开发工作流

### 1. 新建功能
```bash
# 创建特性分支
git checkout -b feature/new-feature

# 在后端添加
backend-java/src/main/java/...

# 在前端添加
frontend/src/...

# 提交代码
git add .
git commit -m "feat: add new feature"

# 推送
git push origin feature/new-feature
```

### 2. 测试流程
```bash
# 后端单元测试
cd backend-java
./mvnw test

# 前端单元测试
cd frontend
npm run test:run

# 集成测试 (E2E)
cd e2e
npm run test
```

### 3. 部署流程
```bash
# 本地验证
docker-compose up -d
curl http://localhost:8080/api/v1/health

# 生产打包
cd backend-java
./mvnw clean package -DskipTests

# 生产部署
docker build -t jieli-platform:1.0.0 .
docker push <registry>/jieli-platform:1.0.0
```

---

## 🐛 常见问题

### Q1: 后端启动失败 "连接拒绝"
**A**: 确保MySQL和Redis已启动
```bash
docker-compose ps
# 如果db和redis没有运行，执行:
docker-compose up -d db redis
```

### Q2: 前端无法连接后端
**A**: 检查API基础URL配置
```typescript
// frontend/src/utils/request.ts
const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
```

### Q3: 数据库迁移失败
**A**: 检查Flyway迁移脚本
```bash
cd backend-java
ls src/main/resources/db/migration/
```

---

## 🌐 Docker 容器网络配置

### 开发环境网络架构

前端(Vite) ←→ 后端(Spring Boot) 通过 Docker 网络通信，需要注意以下配置：

```
浏览器 → localhost:5173 (Vite Dev Server)
              ↓
         Vite 代理 (/api/*)
              ↓
    host.docker.internal:8083 (后端)
```

### 配置文件关联

**修改前后端访问 URL 时，必须同步更新以下配置：**

| 文件 | 配置项 | 说明 |
|------|--------|------|
| `docker-compose.yml` | `frontend.environment.VITE_API_BASE_URL` | 前端 API 基础路径，**必须使用相对路径 `/api/v1`** |
| `frontend/vite.config.ts` | `server.proxy['/api'].target` | Vite 代理目标，**使用 `http://host.docker.internal:8083`** |

### 配置示例

**docker-compose.yml (前端服务)**
```yaml
frontend:
  environment:
    # 使用相对路径，让请求通过 Vite 代理
    - VITE_API_BASE_URL=/api/v1
```

**frontend/vite.config.ts (代理配置)**
```typescript
server: {
  proxy: {
    '/api': {
      // Windows Docker 访问宿主机的特殊域名
      target: 'http://host.docker.internal:8083',
      changeOrigin: true,
      secure: false
    }
  }
}
```

### 常见问题

**Q: 前端显示 "Network Error"**
**A**: 检查以下几点：
1. `VITE_API_BASE_URL` 必须是相对路径 `/api/v1`，不能是 `http://localhost:8083`
2. Vite 代理配置必须使用 `host.docker.internal` 而非 `localhost`
3. 修改配置后必须执行 `docker-compose up -d --force-recreate frontend` 重建容器

**Q: 如何修改后端端口？**
**A**: 修改以下三处：
1. `docker-compose.yml` 中 `backend.ports` 的映射（如 `"8083:8080"`）
2. `docker-compose.yml` 中 `frontend` 的 `VITE_API_BASE_URL`（保持 `/api/v1` 不变）
3. `frontend/vite.config.ts` 中的代理 `target`（更新端口号）

**Q: Linux/Mac 系统配置**
**A**: Linux/Mac 系统上 Docker 可能需要额外配置才能使用 `host.docker.internal`：
```yaml
# docker-compose.yml 添加 extra_hosts
frontend:
  extra_hosts:
    - "host.docker.internal:host-gateway"
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
| 8-10 | 考试流程、阅卷与防作弊 | ⏳ 待执行 |
| 11-13 | 管理看板、健壮性与切屏监测 | ⏳ 待执行 |

---

## 📚 相关文档

- `USER_GUIDE_AND_TEST_FLOW.md` - 用户使用指南和测试流程
- `TESTING_GUIDE.md` - 完整测试指南
- `SESSION_SUMMARY.md` - 改进总结
- `QUICK_REFERENCE.md` - 快速参考

---

**最后更新**: 2026-04-08
**版本**: Java/Spring Boot RBAC 2.0 优化版
**迁移状态**: ✅ 从Python FastAPI完全迁移到Java Spring Boot
