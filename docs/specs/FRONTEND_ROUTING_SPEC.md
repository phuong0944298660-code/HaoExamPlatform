# 前端动态路由规范文档

> 本文档定义了接力教育智慧云平台前端动态路由系统的技术规范，用于指导开发人员和管理员配置菜单路由。

## 1. 概述

### 1.1 设计目标

- **零代码配置**：前端开发完成后，管理员仅需在后台配置即可上线新页面
- **自动组件发现**：构建时自动扫描 `views/` 目录，无需手动注册组件
- **权限集成**：路由级权限控制，与现有 RBAC 系统无缝集成
- **多类型支持**：支持普通页面、外链、Iframe 内嵌等多种页面类型

### 1.2 核心优势

| 传统方式 | 动态路由方式 |
|---------|-------------|
| 新增页面需修改 `router/index.ts` | 仅需在后台菜单管理配置 |
| 前后端菜单分离维护 | 后端菜单即路由源，保持一致 |
| 组件手动导入 | 自动扫描注册，避免遗漏 |
| 权限硬编码 | 后端配置，实时生效 |

## 2. 组件命名规范

### 2.1 命名规则

组件注册名称遵循 **`{目录前缀}{文件名}`** 的 PascalCase 格式：

```typescript
// 规则：目录首字母大写前缀 + PascalCase 文件名
// 文件: @/views/admin/DataScreen.vue → AdminDataScreen
// 文件: @/views/system/users/index.vue → SystemUsers
// 文件: @/views/teacher/exam/Monitor.vue → TeacherExam_Monitor
```

### 2.2 扫描范围

```typescript
// 扫描路径模式
const patterns = [
  '@/views/admin/**/*.vue',      // 管理端页面
  '@/views/teacher/**/*.vue',    // 教师端页面
  '@/views/student/**/*.vue',    // 学生端页面
  '@/views/system/**/*.vue',     // 系统管理页面
  '@/views/common/**/*.vue',     // 通用组件页面
]
```

### 2.3 名称冲突处理

当不同目录存在同名文件时，通过目录前缀区分：

```
文件路径                          注册名称
─────────────────────────────────────────────────────
@/views/admin/Dashboard.vue       AdminDashboard
@/views/teacher/Dashboard.vue     TeacherDashboard
@/views/student/Dashboard.vue     StudentDashboard
```

### 2.4 特殊组件

| 组件名 | 用途 | 说明 |
|--------|------|------|
| `Iframe` | Iframe 内嵌页面 | 用于嵌入第三方系统 |
| `ExternalLink` | 外链跳转 | 打开外部 URL |

## 3. 菜单配置规范

### 3.1 配置字段说明

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `menu_name` | 是 | 菜单显示名称 | 数据大屏 |
| `path` | 是 | 路由路径 | /dashboard/data-screen |
| `component` | 否 | 组件名 | AdminDataScreen |
| `menu_type` | 是 | M=目录, C=菜单, F=按钮 | C |
| `parent_id` | 否 | 父菜单ID，顶级为0 | 0 |
| `icon` | 否 | Ant Design 图标 | dashboard |
| `perms` | 否 | 权限标识 | system:dashboard:view |
| `is_cache` | 否 | 是否缓存 | true/false |
| `is_frame` | 否 | 是否外链 | true/false |
| `query` | 否 | 参数/iframe URL | https://example.com |

### 3.2 页面类型配置

#### 3.2.1 普通页面

```json
{
  "menu_name": "数据大屏",
  "path": "/dashboard/data-screen",
  "component": "AdminDataScreen",
  "menu_type": "C",
  "parent_id": 0,
  "icon": "dashboard",
  "perms": "system:dashboard:view",
  "is_cache": true
}
```

#### 3.2.2 外链页面

```json
{
  "menu_name": "帮助文档",
  "path": "/help",
  "menu_type": "C",
  "parent_id": 0,
  "icon": "question-circle",
  "is_frame": true,
  "query": "https://docs.example.com"
}
```

#### 3.2.3 Iframe 内嵌页面

```json
{
  "menu_name": "监控中心",
  "path": "/monitor",
  "component": "Iframe",
  "menu_type": "C",
  "parent_id": 0,
  "icon": "eye",
  "perms": "system:monitor:view",
  "query": "https://grafana.example.com/d/monitor"
}
```

#### 3.2.4 目录（仅用于分组）

```json
{
  "menu_name": "系统管理",
  "path": "/system",
  "menu_type": "M",
  "parent_id": 0,
  "icon": "setting",
  "children": [
    { /* 子菜单 */ }
  ]
}
```

### 3.3 路径规范

#### 3.3.1 路径格式

- 必须以 `/` 开头
- 使用 kebab-case（短横线连接）
- 避免特殊字符和空格

```
✅ 正确：/dashboard/data-screen
✅ 正确：/system/user-management
❌ 错误：dashboard/data-screen
❌ 错误：/dashboard/dataScreen
❌ 错误：/dashboard/data screen
```

#### 3.3.2 层级结构

```
/system                    (目录)
  ├── /system/users        (菜单)
  ├── /system/roles        (菜单)
  └── /system/logs         (菜单)
```

## 4. 权限配置

### 4.1 权限标识规范

权限标识采用 `{模块}:{功能}:{操作}` 的格式：

```
system:user:view      // 查看用户
system:user:add       // 新增用户
system:user:edit      // 编辑用户
system:user:delete    // 删除用户
system:role:view      // 查看角色
system:menu:view      // 查看菜单
```

### 4.2 路由权限检查

```typescript
// 路由守卫中的权限检查逻辑
if (to.meta.perms) {
  const userPerms = userStore.permissions || []
  const hasPerm = userPerms.includes(to.meta.perms)
  
  if (!hasPerm) {
    // 无权限，跳转 403 页面
    next('/403')
  }
}
```

### 4.3 按钮级权限

按钮级权限也通过 `perms` 字段配置，但 `menu_type` 为 `F`（按钮）：

```json
{
  "menu_name": "新增用户",
  "menu_type": "F",
  "perms": "system:user:add",
  "parent_id": 100  // 所属页面菜单ID
}
```

## 5. 开发规范

### 5.1 新页面开发流程

#### 步骤1：创建页面组件

在对应目录下创建 Vue 文件：

```bash
# 管理端页面
frontend/src/views/admin/NewFeature.vue

# 教师端页面
frontend/src/views/teacher/NewFeature.vue

# 系统管理页面
frontend/src/views/system/modules/NewFeature.vue
```

#### 步骤2：编写页面代码

```vue
<template>
  <div class="new-feature-page">
    <h1>新功能页面</h1>
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

```
文件: @/views/admin/NewFeature.vue
组件名: AdminNewFeature
```

#### 步骤4：后台配置菜单

1. 登录管理后台
2. 进入【系统管理】→【菜单管理】
3. 点击【新增】
4. 填写配置信息：
   - 菜单名称：新功能
   - 路由路径：/admin/new-feature
   - 组件名称：AdminNewFeature（重要！必须与扫描结果一致）
   - 权限标识：admin:newfeature:view
5. 保存并授权给角色
6. 刷新页面即可访问

### 5.2 命名检查清单

- [ ] 文件名使用 PascalCase（如 `DataScreen.vue`）
- [ ] 多单词文件名使用驼峰（如 `UserManagement.vue`）
- [ ] 目录结构清晰，避免过深嵌套
- [ ] 组件名在全局唯一（通过目录前缀保证）

## 6. 调试指南

### 6.1 组件扫描调试

浏览器控制台查看扫描结果：

```javascript
// 查看已注册的组件列表
console.log('[Router] 动态路由加载完成，新增 X 条路由')

// 查看具体组件
// 在动态路由加载后，通过 Vue DevTools 查看路由配置
```

### 6.2 常见问题

#### 问题1：配置菜单后页面显示 404

**排查步骤：**
1. 检查组件名称是否匹配（大小写敏感）
2. 检查 `views/` 目录下文件是否存在
3. 查看浏览器控制台是否有 `[ComponentScanner]` 警告
4. 确认用户角色有权限访问该菜单

**检查命令：**
```javascript
// 在浏览器控制台执行，查看已注册组件
// 需要开启开发模式
```

#### 问题2：组件名称冲突

**现象：**
```
[ComponentScanner] 组件名称冲突: Dashboard
```

**解决：**
- 重命名文件，添加目录前缀区分
- 如 `admin/Dashboard.vue` → `AdminDashboard`

#### 问题3：权限不生效

**排查步骤：**
1. 检查 `perms` 字段是否填写正确
2. 检查用户所属角色是否拥有该权限
3. 检查角色权限是否已保存（重新登录生效）

### 6.3 开发模式调试

```typescript
// vite.config.ts 中开启详细日志
export default defineConfig({
  // ...
  define: {
    __VUE_PROD_DEVTOOLS__: true,
  },
})
```

## 7. API 接口

### 7.1 获取菜单导航

```http
GET /api/v1/system/menus/nav
Authorization: Bearer {token}
```

**响应格式：**

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
      "is_cache": true,
      "is_frame": false,
      "order_num": 1,
      "children": []
    }
  ]
}
```

## 8. 附录

### 8.1 组件映射算法

```typescript
function generateComponentName(filePath: string): string {
  // 匹配 @/views/{folder}/{filename}.vue
  const match = filePath.match(/@\/views\/(\w+)\/(.*?)\.vue$/)
  if (!match) return ''
  
  const [, folder, filePathPart] = match
  
  // 处理文件名
  let fileName = filePathPart
  if (filePathPart === 'index') {
    fileName = folder
  } else {
    // 将 kebab-case 转为 PascalCase
    fileName = filePathPart.replace(/[-_](.)/g, (_, char) => char.toUpperCase())
  }
  
  // 首字母大写
  fileName = fileName.charAt(0).toUpperCase() + fileName.slice(1)
  
  // 目录首字母大写前缀
  const folderPrefix = folder.charAt(0).toUpperCase() + folder.slice(1)
  
  return `${folderPrefix}${fileName}`
}

// 示例
console.log(generateComponentName('@/views/admin/DataScreen.vue'))
// 输出: AdminDataScreen

console.log(generateComponentName('@/views/system/users/index.vue'))
// 输出: SystemUsers
```

### 8.2 路由生成算法

```typescript
function generateRoutesFromMenus(
  menus: MenuItem[],
  componentMap: Record<string, Component>
): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  
  // 构建菜单树
  const menuTree = buildMenuTree(menus)
  
  for (const menu of menuTree) {
    // 跳过按钮类型
    if (menu.menu_type === 'F') continue
    
    const route = convertMenuToRoute(menu, componentMap)
    if (route) {
      routes.push(route)
    }
  }
  
  return routes
}
```

### 8.3 文件结构参考

```
frontend/src/
├── router/
│   ├── index.ts              # 路由入口，整合动态加载
│   ├── dynamicRoutes.ts      # 动态路由生成逻辑
│   └── componentScanner.ts   # 组件自动扫描
├── views/
│   ├── common/
│   │   ├── Iframe.vue        # Iframe 内嵌组件
│   │   └── ExternalLink.vue  # 外链跳转组件
│   ├── error/
│   │   ├── 403.vue           # 无权限页面
│   │   └── LoadError.vue     # 加载失败页面
│   ├── admin/                # 管理端页面
│   ├── teacher/              # 教师端页面
│   ├── student/              # 学生端页面
│   └── system/               # 系统管理页面
└── store/
    └── user.ts               # 用户状态，含动态路由重置
```

---

**文档版本**: 1.0  
**更新日期**: 2026-04-08  
**适用版本**: 前端动态路由系统 v1.0
