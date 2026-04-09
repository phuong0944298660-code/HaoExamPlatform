# 前端动态路由系统需求文档

> 本文档详细描述接力教育智慧云平台前端动态路由系统的功能需求、技术规范和配置指南。

---

## 一、需求概述

### 1.1 业务背景

传统前端路由配置需要修改代码后重新打包部署，无法满足快速迭代的业务需求。动态路由系统允许管理员在后台菜单管理图形化配置后，无需修改前端代码即可上线新页面。

### 1.2 目标

- **零代码配置**：前端开发完成后，管理员仅需后台配置即可上线
- **自动组件发现**：构建时自动扫描，无需手动注册
- **权限集成**：路由级权限控制，与 RBAC 无缝集成
- **多类型支持**：普通页面、外链、Iframe 内嵌等

### 1.3 非功能需求

| 指标 | 要求 |
|------|------|
| 路由加载时间 | < 500ms（登录时一次性加载） |
| 页面切换时间 | < 200ms（组件已预加载） |
| 缓存命中率 | 支持 keep-alive，提升用户体验 |
| 兼容性 | 支持 Chrome、Edge、Firefox 等主流浏览器 |

---

## 二、功能需求

### 2.1 组件自动扫描

#### 2.1.1 扫描范围

```
frontend/src/views/
├── admin/          # 管理端页面
├── teacher/        # 教师端页面
├── student/        # 学生端页面
├── system/         # 系统管理页面
└── common/         # 通用组件（Iframe、ExternalLink）
```

#### 2.1.2 命名规则

组件注册名称遵循 **`{目录前缀}{文件名}`** 的 PascalCase 格式：

| 文件路径 | 注册名称 | 说明 |
|---------|---------|------|
| `@/views/admin/AccountManager.vue` | `AdminAccountManager` | 账号管理 |
| `@/views/admin/ActivationCodes.vue` | `AdminActivationCodes` | 激活码管理 |
| `@/views/system/users/index.vue` | `SystemUsers` | 系统用户 |
| `@/views/common/Iframe.vue` | `Iframe` | Iframe 内嵌 |

**命名算法**：
```typescript
// 1. 提取目录名首字母大写作为前缀
const folderPrefix = folder.charAt(0).toUpperCase() + folder.slice(1);

// 2. 文件名转为 PascalCase
const fileName = filePath === 'index' 
  ? folder 
  : filePath.replace(/[-_](.)/g, (_, char) => char.toUpperCase());

// 3. 组合成组件名
const componentName = folderPrefix + fileName.charAt(0).toUpperCase() + fileName.slice(1);
```

### 2.2 菜单配置管理

#### 2.2.1 菜单表字段定义

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `id` | int | 是 | 主键ID | 100 |
| `menu_name` | varchar(50) | 是 | 菜单显示名称 | 账号管理 |
| `path` | varchar(200) | 是 | 路由路径 | /accounts/list |
| `component` | varchar(255) | 否 | 组件名（前端扫描结果） | AdminAccountManager |
| `menu_type` | char(1) | 是 | M=目录, C=菜单, F=按钮 | C |
| `parent_id` | int | 是 | 父菜单ID（0为顶级） | 0 |
| `icon` | varchar(100) | 否 | Ant Design 图标名 | team |
| `perms` | varchar(100) | 否 | 权限标识 | system:account:list |
| `is_cache` | tinyint | 否 | 是否缓存（0/1） | 1 |
| `is_frame` | tinyint | 否 | 是否外链（0/1） | 0 |
| `query` | varchar(500) | 否 | 查询参数/iframe URL | - |
| `order_num` | int | 否 | 排序号 | 1 |
| `status` | tinyint | 否 | 状态（0禁用/1启用） | 1 |

#### 2.2.2 菜单类型说明

**M - 目录（Menu）**
- 仅用于分组，不对应具体页面
- 有子菜单时作为父级容器
- `component` 字段为空

**C - 菜单（Component）**
- 对应具体页面
- 必须配置 `component` 字段
- 会显示在侧边栏

**F - 按钮（Function）**
- 页面内的操作权限
- 不显示在侧边栏
- 用于按钮级权限控制

### 2.3 页面类型支持

#### 2.3.1 普通页面

```sql
-- 普通菜单页面
INSERT INTO sys_menu (menu_name, path, component, menu_type, parent_id, icon, perms, is_cache) 
VALUES ('账号管理', '/accounts/list', 'AdminAccountManager', 'C', 0, 'team', 'system:account:list', 1);
```

#### 2.3.2 外链页面

```sql
-- 外链页面（点击后在新标签页打开）
INSERT INTO sys_menu (menu_name, path, menu_type, parent_id, icon, is_frame, query) 
VALUES ('帮助文档', '/help', 'C', 0, 'question-circle', 1, 'https://docs.example.com');
```

#### 2.3.3 Iframe 内嵌页面

```sql
-- Iframe 内嵌页面（在系统内嵌第三方页面）
INSERT INTO sys_menu (menu_name, path, component, menu_type, parent_id, icon, perms, query) 
VALUES ('监控中心', '/monitor', 'Iframe', 'C', 0, 'eye', 'system:monitor:view', 'https://grafana.example.com/d/monitor');
```

#### 2.3.4 目录（仅分组）

```sql
-- 目录（作为父级分组）
INSERT INTO sys_menu (menu_name, path, menu_type, parent_id, icon) 
VALUES ('系统管理', '/system', 'M', 0, 'setting');

-- 子菜单
INSERT INTO sys_menu (menu_name, path, component, menu_type, parent_id, icon, perms) 
VALUES ('用户管理', '/system/users', 'SystemUsers', 'C', @parent_id, 'user', 'system:user:list');
```

---

## 三、技术规范

### 3.1 组件命名规范

#### 3.1.1 命名规则

1. **PascalCase**：每个单词首字母大写，无分隔符
2. **目录前缀**：使用目录名首字母大写
3. **文件名处理**：
   - `index.vue` → 使用目录名
   - `kebab-case.vue` → 转为 `PascalCase`
   - `snake_case.vue` → 转为 `PascalCase`

#### 3.1.2 命名示例

| 文件路径 | 组件名 | 说明 |
|---------|-------|------|
| `admin/DataScreen.vue` | `AdminDataScreen` | 数据大屏 |
| `admin/account/index.vue` | `AdminAccount` | 账号管理首页 |
| `system/users/roles.vue` | `SystemUsers_Roles` | 用户角色管理 |
| `common/Iframe.vue` | `Iframe` | Iframe 组件 |

#### 3.1.3 名称冲突处理

当不同目录存在同名文件时，通过目录前缀区分：

```
admin/Dashboard.vue    → AdminDashboard
teacher/Dashboard.vue  → TeacherDashboard
student/Dashboard.vue  → StudentDashboard
```

### 3.2 API 接口规范

#### 3.2.1 获取菜单导航

```http
GET /api/v1/system/menus/nav
Authorization: Bearer {token}
```

**响应格式**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "menu_name": "管理控制台",
      "path": "/dashboard",
      "component": "AdminDashboard",
      "menu_type": "C",
      "parent_id": 0,
      "icon": "dashboard",
      "perms": "system:dashboard:view",
      "is_cache": 1,
      "is_frame": 0,
      "order_num": 1,
      "children": []
    },
    {
      "id": 2,
      "menu_name": "账号管理",
      "path": "/accounts",
      "component": null,
      "menu_type": "M",
      "parent_id": 0,
      "icon": "team",
      "order_num": 2,
      "children": [
        {
          "id": 21,
          "menu_name": "账号列表",
          "path": "/accounts/list",
          "component": "AdminAccountManager",
          "menu_type": "C",
          "parent_id": 2,
          "perms": "system:account:list",
          "is_cache": 1
        }
      ]
    }
  ]
}
```

### 3.3 路由生成规范

#### 3.3.1 路由结构

```typescript
// 生成的路由配置
const route: RouteRecordRaw = {
  path: '/accounts/list',
  component: () => import('@/layouts/AdminLayout.vue'),
  meta: {
    title: '账号列表',
    icon: 'team',
    perms: 'system:account:list',
    keepAlive: true,
    id: 21
  },
  children: [
    {
      path: '',
      name: 'AccountsList',
      component: () => import('@/views/admin/AccountManager.vue'),
      meta: {
        title: '账号列表',
        keepAlive: true
      }
    }
  ]
};
```

#### 3.3.2 路由名称生成

```typescript
// 根据路径生成路由名称
// /accounts/list → AccountsList
// /system/users/roles → SystemUsersRoles

function generateRouteName(path: string): string {
  return path
    .replace(/^\//, '')
    .split('/')
    .map(segment => 
      segment.charAt(0).toUpperCase() + segment.slice(1)
    )
    .join('');
}
```

---

## 四、配置指南

### 4.1 新增页面流程

#### 步骤1：前端开发页面

```bash
# 在对应目录创建 Vue 文件
# 例：管理端账号管理页面
touch frontend/src/views/admin/AccountManager.vue
```

#### 步骤2：编写页面代码

```vue
<template>
  <div class="account-manager-page">
    <h1>账号管理</h1>
    <!-- 页面内容 -->
  </div>
</template>

<script setup lang="ts">
// 页面逻辑
</script>

<style scoped>
/* 页面样式 */
</style>
```

#### 步骤3：确认组件名称

根据文件路径确认组件注册名称：
- 文件：`@/views/admin/AccountManager.vue`
- 组件名：`AdminAccountManager`

#### 步骤4：后台配置菜单

1. 登录管理后台
2. 进入【系统管理】→【菜单管理】
3. 点击【新增】按钮
4. 填写配置：
   - 菜单名称：账号管理
   - 路由路径：/accounts/list
   - 组件名称：AdminAccountManager（必须与扫描结果一致）
   - 权限标识：system:account:list
   - 是否缓存：是
5. 保存并授权给角色
6. 刷新页面即可访问

### 4.2 常见问题排查

#### 问题1：配置后页面显示 404

**排查步骤**：
1. 检查组件名称是否匹配（大小写敏感）
2. 检查 `views/` 目录下文件是否存在
3. 查看浏览器控制台是否有 `[ComponentScanner]` 警告
4. 检查用户角色是否有该菜单权限

**查看可用组件**：
```javascript
// 在浏览器控制台执行
console.table(Object.keys(componentMap).filter(k => k.startsWith('Admin')));
```

#### 问题2：组件名称冲突

**现象**：
```
[ComponentScanner] 组件名称冲突: AdminDashboard
```

**解决**：
- 重命名文件，添加目录前缀区分
- 如 `admin/Dashboard.vue` → `AdminDashboard`

#### 问题3：权限不生效

**排查步骤**：
1. 检查 `perms` 字段是否填写正确
2. 检查用户所属角色是否拥有该权限
3. 检查角色权限是否已保存（重新登录生效）

---

## 五、兼容性说明

### 5.1 后端兼容性

| 后端框架 | 兼容性 | 说明 |
|---------|-------|------|
| FastAPI (Python) | ✅ 支持 | 原始版本 |
| Spring Boot (Java) | ✅ 支持 | 当前版本 |
| 其他 | ⚠️ 需适配 | 只要提供 `/api/v1/system/menus/nav` 接口 |

### 5.2 前端兼容性

| Vue 版本 | 兼容性 | 说明 |
|---------|-------|------|
| Vue 3.2+ | ✅ 完全支持 | 推荐版本 |
| Vue 3.0-3.1 | ⚠️ 部分支持 | 需测试验证 |
| Vue 2 | ❌ 不支持 | 需使用 Vue Router 3 |

### 5.3 浏览器兼容性

| 浏览器 | 版本 | 兼容性 |
|--------|------|-------|
| Chrome | 90+ | ✅ 完全支持 |
| Edge | 90+ | ✅ 完全支持 |
| Firefox | 88+ | ✅ 完全支持 |
| Safari | 14+ | ✅ 完全支持 |

---

## 六、附录

### 6.1 组件别名映射表

完整别名映射表（在 `componentScanner.ts` 中维护）：

```typescript
const componentAliasMap: Record<string, string> = {
  // 账号管理
  'AdminAccounts': 'AdminAccountManager',
  'AdminAccount': 'AdminAccountManager',
  'AdminAccountList': 'AdminAccountManager',
  
  // 题库管理
  'AdminQuestionBanks': 'AdminQuestionBankList',
  'AdminQuestionBank': 'AdminQuestionBankList',
  'AdminQuestions': 'AdminQuestionBankList',
  
  // 试卷管理
  'AdminPapers': 'AdminPaperManager',
  'AdminPaper': 'AdminPaperManager',
  
  // 考试管理
  'AdminExams': 'AdminExamManager',
  'AdminExam': 'AdminExamManager',
  
  // 成绩管理
  'AdminScores': 'AdminScoreManager',
  'AdminScore': 'AdminScoreManager',
  
  // 资源管理
  'AdminResources': 'AdminResourceManager',
  'AdminResource': 'AdminResourceManager',
  
  // 反馈管理
  'AdminFeedbacks': 'AdminFeedbackManager',
  'AdminFeedback': 'AdminFeedbackManager',
  
  // 激活码管理
  'AdminActivation': 'AdminActivationCodes',
  'AdminActivationCode': 'AdminActivationCodes',
  'AdminActivationPlan': 'AdminActivationPlans',
};
```

### 6.2 相关文档

- [前端动态路由规范文档](./FRONTEND_ROUTING_SPEC.md)
- [架构文档 - 动态路由章节](../../CLAUDE.md#8-动态路由系统-dynamic-routing)

---

**文档版本**: v1.0  
**更新日期**: 2026-04-08  
**适用版本**: 前端动态路由系统 v1.0
