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

### 8. 动态路由系统 (Dynamic Routing)

前端采用企业级动态路由架构，支持管理员在后台菜单管理图形化配置后，无需修改前端代码即可上线新页面。

#### 8.1 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端工程                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ views/       │  │ router/      │  │ layouts/             │  │
│  │ - admin/     │  │ - index.ts   │  │ - AdminLayout.vue    │  │
│  │ - teacher/   │  │ - dynamic.ts │  │ - TeacherLayout.vue  │  │
│  │ - student/   │  │ - scanner.ts │  │ - StudentLayout.vue  │  │
│  │ - system/    │  │              │  │ - BlankLayout.vue    │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────────┘  │
│         │                                                       │
│         │ 构建时自动扫描                                         │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   组件注册中心 (componentScanner.ts)      │  │
│  │  扫描规则：                                                │  │
│  │  - @/views/admin/*.vue    →  Admin{文件名}                │  │
│  │  - @/views/teacher/*.vue  →  Teacher{文件名}              │  │
│  │  - @/views/student/*.vue  →  Student{文件名}              │  │
│  │  - @/views/system/*.vue   →  System{文件名}               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 运行时动态加载
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        后端服务                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  sys_menu 表（已有）                                      │  │
│  │  - menu_name: 菜单名称                                    │  │
│  │  - path: 路由路径                                         │  │
│  │  - component: 组件名（如：AdminDataScreen）               │  │
│  │  - menu_type: M(目录)/C(菜单)/F(按钮)                     │  │
│  │  - perms: 权限标识                                        │  │
│  │  - is_cache: 是否缓存                                     │  │
│  │  - is_frame: 是否外链                                     │  │
│  │  - query: 路由参数/iframe URL                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              │ GET /api/v1/system/menus/nav     │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  菜单管理后台（图形化配置）                                │  │
│  │  - 新增菜单时，输入组件名称                                │  │
│  │  - 自动校验路径格式                                        │  │
│  │  - 实时预览路由效果                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### 8.2 组件命名规范（重要）

为避免不同目录下同名文件冲突，采用**目录前缀 + PascalCase文件名**的命名规则：

| 文件路径 | 注册名称 | 说明 |
|---------|---------|------|
| `@/views/admin/DataScreen.vue` | `AdminDataScreen` | 管理员数据大屏 |
| `@/views/teacher/DataScreen.vue` | `TeacherDataScreen` | 教师数据大屏 |
| `@/views/student/ExamPage.vue` | `StudentExamPage` | 学生考试页面 |
| `@/views/system/users/index.vue` | `SystemUsers` | 系统用户管理 |
| `@/views/common/Iframe.vue` | `Iframe` | 内嵌页面通用组件 |
| `@/views/common/ExternalLink.vue` | `ExternalLink` | 外链跳转组件 |

**命名规则**：
1. 提取目录名首字母大写作为前缀
2. 文件名转为 PascalCase（`data-screen.vue` → `DataScreen`）
3. 子目录文件使用下划线连接（`system/users/roles.vue` → `SystemUsers_Roles`）

#### 8.3 路由配置字段

后端 `sys_menu` 表字段与前端路由的映射：

| 字段 | 类型 | 说明 | 路由映射 |
|------|------|------|---------|
| `menu_name` | string | 菜单显示名称 | `meta.title` |
| `path` | string | 路由路径，如 `/dashboard/data-screen` | `path` |
| `component` | string | 组件名，如 `AdminDataScreen` | 动态加载组件 |
| `menu_type` | enum | M=目录, C=菜单, F=按钮 | 类型判断 |
| `parent_id` | number | 父菜单ID | 层级结构 |
| `icon` | string | Ant Design 图标名 | `meta.icon` |
| `perms` | string | 权限标识，如 `system:dashboard:view` | `meta.perms` |
| `is_cache` | boolean | 是否缓存 | `meta.keepAlive` |
| `is_frame` | boolean | 是否外链 | 外链处理 |
| `query` | string | 查询参数或 iframe URL | `meta.iframeUrl` |

#### 8.4 特殊页面类型

**1. 外链页面 (is_frame = true)**
- 在新标签页打开外部链接
- 使用 `ExternalLink` 组件处理

**2. Iframe 内嵌页面 (component = 'Iframe')**
- 在系统内嵌第三方页面
- 使用 `Iframe` 组件，URL 配置在 `query` 字段

**3. 权限控制页面 (perms)**
- 路由守卫检查用户权限
- 无权限时跳转 `/403` 页面

#### 8.5 动态路由加载流程

```typescript
// 1. 登录成功后触发
router.beforeEach(async (to, from, next) => {
  // 2. 管理员角色加载动态路由
  if (userRole === 'admin' && !hasLoadedDynamicRoutes) {
    const success = await loadDynamicRoutes()
    // 3. 重新导航确保新路由生效
    if (success) next({ ...to, replace: true })
  }
})

// loadDynamicRoutes 内部流程：
async function loadDynamicRoutes() {
  // 1. 获取后端菜单
  const menus = await fetch('/api/v1/system/menus/nav')
  // 2. 扫描可用组件
  const componentMap = generateComponentMap()
  // 3. 生成路由配置
  const routes = generateRoutesFromMenus(menus, componentMap)
  // 4. 动态添加路由
  routes.forEach(route => router.addRoute(route))
}
```

#### 8.6 开发新页面流程

**步骤1：开发页面组件**
```bash
# 在对应目录创建 Vue 文件
frontend/src/views/admin/NewFeature.vue
```

**步骤2：遵循命名规范**
- 组件文件名使用 PascalCase
- 多单词使用驼峰（`DataScreen.vue`）

**步骤3：管理员配置菜单**
1. 进入后台【系统管理】→【菜单管理】
2. 点击【新增】按钮
3. 填写配置：
   - 菜单名称：新功能
   - 路由路径：`/admin/new-feature`
   - 组件名称：`AdminNewFeature`（必须匹配扫描规则）
   - 菜单类型：C（菜单）
   - 权限标识：`admin:newfeature:view`（可选）
   - 是否缓存：是/否
4. 保存并刷新页面

**无需修改前端路由配置！**

#### 8.7 静态路由保留

以下路由保持静态配置，不参与动态加载：

| 路由 | 用途 | 说明 |
|------|------|------|
| `/login` | 登录页 | 公开访问 |
| `/activate` | 激活账号 | 公开访问 |
| `/student/*` | 学生端 | 结构稳定 |
| `/teacher/*` | 教师端 | 结构稳定 |
| `/403` | 无权限页 | 错误页面 |
| `/*` | 404 页面 | 通配符路由 |

#### 8.8 权限与角色检查

```typescript
// 路由守卫中的权限检查
if (to.meta.perms) {
  const userPerms = userStore.permissions || []
  const hasPerm = userPerms.includes(to.meta.perms as string)
  
  if (!hasPerm) {
    message.error('无权限访问该页面')
    next('/403')
    return
  }
}

// 角色检查
if (to.meta.role && userRole !== to.meta.role) {
  // 角色不匹配，重定向到对应首页
  next(redirectPath)
  return
}
```

### 9. UI/UX 规范

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

## 🎨 UI/UX 设计开发规范（必读）

在实现任何前端 UI 需求之前，必须首先阅读以下文档：

1. **UI 设计与开发规范**：`docs/specs/UI_DESIGN_AND_DEVELOPMENT_GUIDELINES.md`
2. **组件展示参考**：`docs/specs/ui-component-showcase.html`（可直接在浏览器打开）

### 必须遵守的规则

- **搜索表单统一高度**：所有管理后台搜索表单统一使用 `.search-form` 类。控件高度修正规则已全局定义在 `frontend/src/styles/layout-override.css`。禁止在单个 Vue 文件中重复写 `:deep(.ant-select), :deep(.ant-input) { height: 32px; }` 等覆盖。
- **禁止样式重复**：如果多个页面需要相同的 Ant Design Vue 样式覆盖，优先提取到 `layout-override.css`，而不是复制粘贴 scoped 样式。
- **颜色与间距**：优先使用 `frontend/src/styles/design-system.css` 中的 CSS 变量，避免硬编码颜色值。
- **表格操作列**：必须固定右侧 `fixed: 'right'`，按钮使用 `<a-space>` 横向紧凑排列。

### 变更流程

若需求与现有规范不一致，必须先提醒用户，再统一修改规范文档，并同步更新所有涉及该组件的地方，确保一致性。

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

## 📦 Git 仓库与版本控制

### 仓库信息

| 项目 | 地址 |
|------|------|
| **远程仓库** | https://github.com/phuong0944298660-code/HaoExamPlatform.git |
| **本地路径** | `Jieli Education Smart Cloud Platform/` |

### 分支策略

采用 **Git Flow 简化版** 分支模型：

```
Develop (开发) → UAT (预上线) → Main (生产)
     ↑
  feature/* (功能分支)
```

| 分支 | 用途 | 部署环境 | 保护级别 |
|------|------|----------|----------|
| `Main` | 生产代码 | 生产环境 | 🔒 禁止直接推送，仅允许 PR 合并 |
| `UAT` | 预发布测试 | 预上线环境 | 🔒 禁止直接推送，仅允许从 Develop 合并 |
| `Develop` | 开发集成 | 开发环境 | ⚠️ 需要审查后可推送 |
| `feature/*` | 功能开发 | 本地 | ✅ 可自由推送 |

---

## ⚠️ 代码推送规范（重要）

### 必须遵守的规则

**推送到远程仓库前，必须获得用户明确许可。**

以下操作需要用户授权：

| 操作 | 授权要求 | 备注 |
|------|----------|------|
| `git push` | ✅ 必须显式批准 | 每次推送前询问用户 |
| `git push --force` | ⚠️ 双重确认 | 强制推送风险极高，需特别授权 |
| 推送到 `Main` | 🔒 严格禁止自动推送 | 仅通过 PR + 审查合并 |
| 推送到 `UAT` | 🔒 禁止自动推送 | 仅通过 PR 从 Develop 合并 |
| 创建/删除远程分支 | ✅ 需用户确认 | 告知用户分支变更影响 |

### 推送内容说明要求（必须）

**每次推送前，必须向用户详细说明以下内容，并确保这些内容写入 git commit message：**

| 说明项 | 内容要求 | 写入位置 |
|--------|----------|----------|
| **修改背景** | 为什么要做这个修改？（问题来源、需求背景、Bug 报告等） | Commit message body |
| **修改目的** | 期望达到什么效果？（解决什么问题、新增什么功能） | Commit message body |
| **修改内容** | 具体改了哪些文件？哪些功能？（文件清单 + 功能说明） | Commit message body |
| **影响范围** | 是否影响其他模块？是否有破坏性变更？ | Commit message body |
| **测试情况** | 是否已本地测试？测试结果如何？ | Commit message body |

**Commit Message 标准模板：**

```
<type>(<scope>): <简洁标题>

【背景】
xxx（例如：用户反馈激活计划页面加载缓慢 / 需要新增批量导入功能）

【目的】
xxx（例如：优化查询性能，将加载时间从 3s 降低到 500ms）

【修改内容】
- 文件1：修改说明（例如：ActivationPlans.vue - 优化表格渲染逻辑）
- 文件2：修改说明（例如：activation.ts - 新增批量导入 API）

【影响范围】
xxx（例如：仅影响激活计划模块，不影响其他功能）

【测试情况】
xxx（例如：已本地测试，功能正常，性能提升明显）

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**示例：**

```
feat(activation): 优化激活计划列表加载性能

【背景】
用户反馈激活计划页面在数据量大时加载缓慢，影响使用体验。

【目的】
优化查询性能，将加载时间从 3s 降低到 500ms 以内。

【修改内容】
- ActivationPlans.vue：优化表格渲染逻辑，添加虚拟滚动
- activation.ts：新增分页查询参数，减少单次请求数据量

【影响范围】
仅影响激活计划列表页面，不影响编辑、创建等其他功能。

【测试情况】
已本地测试，1000 条数据下加载时间从 3.2s 降至 450ms。

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### 推送前检查清单

执行推送前必须确认：

- [ ] 用户已明确同意推送
- [ ] 代码已提交并包含清晰的 commit message
- [ ] 本地测试通过（如有测试命令）
- [ ] 目标分支正确（避免误推送到 Main/UAT）
- [ ] 未包含敏感信息（密码、密钥等）

### Commit Message 规范

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**类型 (type)：**
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 格式（不影响代码运行）
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建过程或辅助工具变动

---

## 🔧 Git 工作流指南

### 功能开发流程

```bash
# 1. 从 Develop 创建功能分支
git checkout Develop
git pull origin Develop
git checkout -b feature/new-feature

# 2. 开发并提交
git add .
git commit -m "feat(activation): add plan validation"

# 3. 推送到远程（需用户授权）
git push -u origin feature/new-feature

# 4. 创建 PR 合并到 Develop（用户操作）
```

### 环境晋升流程

```
feature/new-feature → Develop → UAT → Main
        ↓                ↓        ↓       ↓
     功能完成         开发完成   测试通过  生产发布
```

**各阶段检查点：**

| 阶段 | 检查项 | 负责人 |
|------|--------|--------|
| Develop → UAT | 代码审查、单元测试通过 | 技术负责人 |
| UAT → Main | UAT 验收通过、无阻塞 Bug | 产品经理 |
| Main 发布 | 生产验证、回滚方案就绪 | 运维团队 |

---

## 💡 技术专家建议

### 分支保护配置（推荐）

在 GitHub 仓库设置中启用以下保护：

1. **Main 分支保护**
   - ✅ 需要 PR 才能合并
   - ✅ 需要至少 1 人审查批准
   - ✅ 需要通过 CI 检查
   - ✅ 禁止强制推送
   - ✅ 禁止直接删除

2. **UAT 分支保护**
   - ✅ 需要 PR 才能合并
   - ✅ 仅允许从 Develop 分支合并
   - ✅ 禁止强制推送

3. **Develop 分支保护**
   - ⚠️ 建议启用 PR 审查（可选）
   - ⚠️ 允许维护者直接推送（方便紧急修复）

### CI/CD 建议

配置 GitHub Actions 实现自动化：

```yaml
# 建议的 CI 流程
1. PR 创建时：运行单元测试、代码检查
2. 合并到 Develop：部署到开发环境
3. 合并到 UAT：部署到预上线环境
4. 合并到 Main：自动打标签、部署到生产
```

### 版本发布流程

采用 [语义化版本](https://semver.org/)（Semantic Versioning）：

```
版本号格式：MAJOR.MINOR.PATCH

MAJOR：不兼容的 API 修改
MINOR：向下兼容的功能新增
PATCH：向下兼容的问题修复
```

**发布步骤：**
1. 从 Main 创建 `release/v1.2.0` 分支
2. 更新版本号、CHANGELOG
3. 合并到 Main 并打标签 `v1.2.0`
4. 合并回 Develop

### 安全建议

- 🔐 不要将 `.env` 文件提交到仓库
- 🔐 不要将敏感配置（密码、密钥）硬编码
- 🔐 定期审查 `.gitignore` 确保敏感文件被排除
- 🔐 启用 GitHub 的 Dependabot 自动检测依赖漏洞

---

## ⚠️ 开发原则与约束

### 数据库使用规范（重要）

**本项目强制使用 MySQL 8.0 作为唯一数据库，不允许切换到其他数据库。**

#### 原则
- **必须使用 MySQL 8.0**：生产环境、开发环境、测试环境统一使用 MySQL 8.0
- **禁止使用 H2**：已从项目中完全移除 H2 内存数据库支持
- **禁止临时切换**：遇到数据库连接问题时，必须解决 MySQL 连接问题，而不是切换到其他数据库

#### 配置要求
- **开发环境**：本地安装 MySQL 8.0，端口 3306
- **连接配置**：`application-dev.yml` 已配置为 MySQL 连接
- **初始化**：使用 `scripts/init.sql` 初始化数据库结构和基础数据

#### 故障处理
当 MySQL 连接失败时：
1. ✅ 检查 MySQL 服务是否启动：`sc query MySQL80`
2. ✅ 检查连接配置（用户名、密码、端口）
3. ✅ 检查数据库 `jieli_edu` 是否存在
4. ❌ **禁止切换到 H2 或其他内存数据库**
5. ❌ **禁止修改 `application-dev.yml` 使用其他数据库驱动**

#### 历史记录
- 2026-04-09：已从项目中完全移除 H2 支持，删除 `data-h2.sql`，统一使用 MySQL

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

**最后更新**: 2026-04-09
**Git 仓库**: https://github.com/phuong0944298660-code/HaoExamPlatform
**版本**: Java/Spring Boot RBAC 2.0 优化版
**迁移状态**: ✅ 从Python FastAPI完全迁移到Java Spring Boot
