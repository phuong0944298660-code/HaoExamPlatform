# 基础功能底座开发计划

> 基于 RuoYi 架构的 B 端系统基础功能底座补充开发计划

---

## 一、项目概述

### 1.1 目标
为接力教育智慧云平台补充标准 B 端系统的基础功能底座，包括：
- 系统管理（用户、角色、菜单、部门、字典、参数、日志）
- 消息中心（站内信、消息模板）
- 个人中心（个人信息、密码修改、操作记录）

### 1.2 开发周期
- **总工期**: 4-5 周
- **开发人数**: 2-3 人（1 后端 + 1 前端 + 1 全栈）
- **优先级**: P0（核心功能）> P1（重要功能）> P2（扩展功能）

---

## 二、阶段划分

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         基础功能底座开发时间线                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Week 1        Week 2        Week 3        Week 4        Week 5            │
│ ├───────────┼───────────┼───────────┼───────────┼───────────┤            │
│ │           │           │           │           │           │            │
│ │  P0核心    │  P0核心    │  P1重要    │  P1重要    │  P2扩展    │            │
│ │  系统管理  │  系统管理  │  系统管理  │  消息中心  │  完善优化  │            │
│ │           │           │           │           │           │            │
│ │ • 数据库  │ • 角色    │ • 字典    │ • 站内信  │ • 性能    │            │
│ │ • 用户    │ • 菜单    │ • 参数    │ • 模板    │ • 优化    │            │
│ │ • 部门    │ • 权限    │ • 公告    │ • 个人中心 │ • 测试    │            │
│ │ • 登录    │           │ • 日志    │           │ • 部署    │            │
│ │           │           │           │           │           │            │
│ └───────────┴───────────┴───────────┴───────────┴───────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 三、详细开发计划

### Phase 1: Week 1 - P0 核心功能（数据库 + 用户 + 部门 + 登录）

#### Day 1-2: 数据库与基础架构
**负责人**: 后端
**任务**:
1. 执行数据库迁移脚本
2. 创建所有模型类
3. 配置 Alembic 迁移

**交付物**:
```
app/models/
├── __init__.py
├── sys_user.py      # 系统用户模型
├── sys_role.py      # 角色模型
├── sys_menu.py      # 菜单模型
├── sys_dept.py      # 部门模型
├── sys_dict.py      # 字典模型
├── sys_config.py    # 参数模型
├── sys_log.py       # 日志模型
├── sys_notice.py    # 公告模型
└── message.py       # 消息模型
```

#### Day 3-4: 用户管理模块
**负责人**: 后端 + 前端
**后端任务**:
- [ ] 用户 CRUD API
- [ ] 用户状态管理
- [ ] 重置密码功能
- [ ] 头像上传

**前端任务**:
- [ ] 用户列表页面
- [ ] 用户新增/编辑弹窗
- [ ] 用户详情抽屉

**API 列表**:
```
GET    /api/v1/system/users/list
GET    /api/v1/system/users/{user_id}
POST   /api/v1/system/users
PUT    /api/v1/system/users/{user_id}
DELETE /api/v1/system/users/{user_id}
PUT    /api/v1/system/users/{user_id}/status
PUT    /api/v1/system/users/{user_id}/reset-password
POST   /api/v1/system/users/{user_id}/avatar
```

#### Day 5: 部门管理 + 登录日志
**负责人**: 后端 + 前端
**任务**:
- [ ] 部门树形结构 API
- [ ] 部门 CRUD
- [ ] 登录日志记录中间件
- [ ] 登录日志查询 API

**前端页面**:
```
views/system/depts/index.vue    # 部门管理
views/system/logs/loginlog.vue  # 登录日志
```

---

### Phase 2: Week 2 - P0 核心功能（角色 + 菜单 + 权限）

#### Day 6-7: 角色管理
**负责人**: 后端 + 前端
**后端任务**:
- [ ] 角色 CRUD
- [ ] 角色分配用户
- [ ] 角色分配菜单权限

**前端任务**:
- [ ] 角色列表页面
- [ ] 角色权限配置（树形选择）

**核心功能**: 权限树组件
```vue
<!-- PermissionTree.vue -->
<template>
  <a-tree
    v-model:checkedKeys="checkedKeys"
    checkable
    :tree-data="menuTree"
    :field-names="{ title: 'menu_name', key: 'id', children: 'children' }"
  />
</template>
```

#### Day 8-9: 菜单管理
**负责人**: 后端 + 前端
**任务**:
- [ ] 菜单树形 CRUD
- [ ] 菜单权限标识管理
- [ ] 前端动态路由生成

**关键实现**:
```typescript
// 前端动态路由生成
function generateRoutes(menus: Menu[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = [];
  
  for (const menu of menus) {
    if (menu.menu_type === 'M') {
      // 目录
      routes.push({
        path: menu.path,
        component: Layout,
        children: generateRoutes(menu.children || [])
      });
    } else if (menu.menu_type === 'C') {
      // 菜单
      routes.push({
        path: menu.path,
        component: () => import(`@/views/${menu.component}.vue`),
        meta: { 
          title: menu.menu_name,
          perms: menu.perms 
        }
      });
    }
  }
  
  return routes;
}
```

#### Day 10: 权限控制完善
**负责人**: 后端
**任务**:
- [ ] 权限装饰器
- [ ] 数据权限过滤
- [ ] JWT Token 刷新机制

**权限装饰器实现**:
```python
# app/core/permission.py

def require_permissions(perms: List[str]):
    """权限检查装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(status_code=401, detail="未登录")
            
            # 获取用户权限
            user_perms = await get_user_permissions(current_user.id)
            
            # 检查权限
            for perm in perms:
                if perm not in user_perms:
                    raise HTTPException(status_code=403, detail=f"缺少权限: {perm}")
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# 使用示例
@router.get("/list")
@require_permissions(["system:user:list"])
async def list_users(current_user: SysUser = Depends(get_current_user)):
    pass
```

---

### Phase 3: Week 3 - P1 重要功能（字典 + 参数 + 公告 + 日志）

#### Day 11-12: 字典管理
**负责人**: 后端 + 前端
**任务**:
- [ ] 字典类型 CRUD
- [ ] 字典数据 CRUD
- [ ] 前端字典缓存

**前端字典 Hook**:
```typescript
// composables/useDict.ts
import { ref, onMounted } from 'vue';

export function useDict(dictType: string) {
  const dictData = ref<DictData[]>([]);
  
  onMounted(async () => {
    const res = await getDictDataByType(dictType);
    dictData.value = res.data;
  });
  
  return { dictData };
}

// 使用
const { dictData: userSexOptions } = useDict('sys_user_sex');
```

#### Day 13-14: 参数管理 + 通知公告
**负责人**: 后端 + 前端
**任务**:
- [ ] 系统参数 CRUD
- [ ] 参数缓存
- [ ] 通知公告 CRUD
- [ ] 公告发布/撤回

#### Day 15: 操作日志
**负责人**: 后端
**任务**:
- [ ] 操作日志中间件
- [ ] 日志注解
- [ ] 操作日志查询

**日志注解实现**:
```python
# app/core/log.py

class LogAnnotation:
    """操作日志注解"""
    def __init__(self, title: str, business_type: int):
        self.title = title
        self.business_type = business_type
    
    def __call__(self, func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = await func(*args, **kwargs)
                status = 0
                error_msg = None
            except Exception as e:
                status = 1
                error_msg = str(e)
                raise
            finally:
                # 异步记录日志
                await log_operation(
                    title=self.title,
                    business_type=self.business_type,
                    status=status,
                    error_msg=error_msg,
                    execute_time=int((time.time() - start_time) * 1000)
                )
            
            return result
        return wrapper

# 使用示例
@router.post("")
@LogAnnotation(title="用户管理", business_type=1)  # 1-新增
async def create_user(data: UserCreate):
    pass
```

---

### Phase 4: Week 4 - P1 重要功能（消息中心 + 个人中心）

#### Day 16-17: 消息中心
**负责人**: 后端 + 前端
**任务**:
- [ ] 消息模板管理
- [ ] 站内消息发送
- [ ] 消息接收列表
- [ ] 未读消息计数
- [ ] 消息标记已读

**前端消息组件**:
```vue
<!-- MessageBell.vue -->
<template>
  <a-dropdown>
    <a-badge :count="unreadCount" :offset="[-2, 2]">
      <BellOutlined class="header-icon" />
    </a-badge>
    <template #overlay>
      <a-list class="message-list" :data-source="messages">
        <template #header>
          <div class="message-header">
            <span>消息通知</span>
            <a @click="markAllRead">全部已读</a>
          </div>
        </template>
        <template #renderItem="{ item }">
          <a-list-item :class="{ unread: !item.is_read }">
            <div @click="readMessage(item)">
              <h4>{{ item.title }}</h4>
              <p>{{ item.content }}</p>
              <span>{{ formatTime(item.create_time) }}</span>
            </div>
          </a-list-item>
        </template>
      </a-list>
    </template>
  </a-dropdown>
</template>
```

#### Day 18-19: 个人中心
**负责人**: 前端
**任务**:
- [ ] 个人信息展示/编辑
- [ ] 头像上传裁剪
- [ ] 修改密码
- [ ] 我的操作记录

#### Day 20: 前端整合
**负责人**: 前端
**任务**:
- [ ] 系统管理菜单整合
- [ ] 权限指令实现
- [ ] 按钮级权限控制

**权限指令**:
```typescript
// directives/permission.ts
import { Directive } from 'vue';

export const permission: Directive = {
  mounted(el, binding) {
    const { value } = binding;
    const permissions = useUserStore().permissions;
    
    if (value && !permissions.includes(value)) {
      el.parentNode?.removeChild(el);
    }
  }
};

// 使用
<a-button v-permission="'system:user:add'">新增用户</a-button>
```

---

### Phase 5: Week 5 - P2 扩展功能（测试 + 优化 + 部署）

#### Day 21-22: 测试
**负责人**: 全栈
**任务**:
- [ ] 单元测试
- [ ] 接口测试
- [ ] 权限测试
- [ ] 前端组件测试

#### Day 23-24: 性能优化
**负责人**: 后端
**任务**:
- [ ] Redis 缓存优化
- [ ] 数据库索引优化
- [ ] 日志异步写入
- [ ] 接口响应优化

#### Day 25: 部署准备
**负责人**: 全栈
**任务**:
- [ ] 生产环境配置
- [ ] 文档更新
- [ ] 数据迁移脚本测试

---

## 四、前端页面清单

### 4.1 系统管理页面

```
views/system/
├── users/
│   ├── index.vue           # 用户列表
│   ├── components/
│   │   ├── UserForm.vue    # 用户表单
│   │   └── UserDetail.vue  # 用户详情
├── roles/
│   ├── index.vue           # 角色列表
│   └── components/
│       ├── RoleForm.vue    # 角色表单
│       └── PermissionTree.vue  # 权限树
├── menus/
│   ├── index.vue           # 菜单列表
│   └── components/
│       └── MenuForm.vue    # 菜单表单
├── depts/
│   ├── index.vue           # 部门列表
│   └── components/
│       └── DeptTree.vue    # 部门树
├── dicts/
│   ├── index.vue           # 字典类型列表
│   └── components/
│       └── DictData.vue    # 字典数据
├── configs/
│   └── index.vue           # 参数管理
├── notices/
│   ├── index.vue           # 公告列表
│   └── components/
│       └── NoticeForm.vue  # 公告编辑
└── logs/
    ├── operlog.vue         # 操作日志
    └── loginlog.vue        # 登录日志
```

### 4.2 个人中心页面

```
views/profile/
├── index.vue               # 个人中心布局
├── Info.vue                # 个人信息
├── Password.vue            # 修改密码
└── Logs.vue                # 操作记录
```

### 4.3 API 模块

```
api/system/
├── user.ts                 # 用户管理 API
├── role.ts                 # 角色管理 API
├── menu.ts                 # 菜单管理 API
├── dept.ts                 # 部门管理 API
├── dict.ts                 # 字典管理 API
├── config.ts               # 参数管理 API
├── notice.ts               # 公告管理 API
├── log.ts                  # 日志管理 API
└── message.ts              # 消息中心 API

api/profile.ts              # 个人中心 API
```

---

## 五、后端模块清单

### 5.1 API 路由

```
app/api/v1/
├── __init__.py
├── router.py              # 路由聚合
├── system/
│   ├── __init__.py
│   ├── users.py           # 用户管理
│   ├── roles.py           # 角色管理
│   ├── menus.py           # 菜单管理
│   ├── depts.py           # 部门管理
│   ├── dicts.py           # 字典管理
│   ├── configs.py         # 参数管理
│   ├── notices.py         # 公告管理
│   ├── logs.py            # 日志管理
│   └── messages.py        # 消息管理
└── profile.py             # 个人中心
```

### 5.2 服务层

```
app/services/
├── __init__.py
├── sys_user_service.py    # 用户服务
├── sys_role_service.py    # 角色服务
├── sys_menu_service.py    # 菜单服务
├── sys_dept_service.py    # 部门服务
├── sys_dict_service.py    # 字典服务
├── sys_config_service.py  # 参数服务
├── sys_notice_service.py  # 公告服务
├── sys_log_service.py     # 日志服务
└── message_service.py     # 消息服务
```

### 5.3 核心组件

```
app/core/
├── __init__.py
├── auth.py                # 认证（已有）
├── permission.py          # 权限控制（新增）
├── log.py                 # 日志注解（新增）
└── cache.py               # 缓存工具（新增）
```

---

## 六、测试计划

### 6.1 单元测试

```python
# tests/test_system_user.py

class TestSysUser:
    async def test_create_user(self, client, admin_token):
        """测试创建用户"""
        response = await client.post(
            "/api/v1/system/users",
            json={"username": "test", "nickname": "测试", "password": "123456"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["code"] == 200
    
    async def test_user_list(self, client, admin_token):
        """测试用户列表"""
        response = await client.get(
            "/api/v1/system/users/list",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
```

### 6.2 权限测试

```python
# tests/test_permission.py

class TestPermission:
    async def test_no_permission(self, client, user_token):
        """测试无权限访问"""
        response = await client.get(
            "/api/v1/system/users/list",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403
```

---

## 七、验收标准

### 7.1 功能验收

| 模块 | 功能点 | 验收标准 |
|-----|-------|---------|
| 用户管理 | 增删改查 | ✅ 支持分页、搜索、状态管理 |
| 角色管理 | 权限分配 | ✅ 支持菜单权限、数据权限 |
| 菜单管理 | 动态路由 | ✅ 前端根据权限动态生成菜单 |
| 部门管理 | 树形结构 | ✅ 支持层级展示、搜索 |
| 字典管理 | 数据维护 | ✅ 前端可通过 hook 获取字典 |
| 参数管理 | 配置维护 | ✅ 支持系统参数热更新 |
| 日志管理 | 审计追踪 | ✅ 记录操作人、IP、耗时 |
| 消息中心 | 站内信 | ✅ 未读消息提醒、消息列表 |
| 个人中心 | 信息维护 | ✅ 头像上传、密码修改 |

### 7.2 性能指标

| 指标 | 目标 | 验收标准 |
|-----|-----|---------|
| 页面加载 | < 3s | Lighthouse 评分 > 80 |
| API 响应 | < 200ms | p95 响应时间 |
| 并发用户 | 500 | 系统稳定运行 |
| 权限校验 | < 10ms | Redis 缓存命中 |

---

## 八、风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|-----|-----|-----|---------|
| 权限模型复杂 | 中 | 高 | 参考 RuoYi 简化实现 |
| 前端工作量大 | 高 | 中 | 复用 Ant Design Pro 组件 |
| 与现有系统冲突 | 低 | 高 | 保持现有账号体系，新增系统用户表 |
| 工期延误 | 中 | 中 | 优先 P0 功能，P1/P2 可延期 |

---

## 九、附录

### 9.1 参考文档

- [RuoYi 文档](https://doc.ruoyi.vip/)
- [Ant Design Pro](https://pro.ant.design/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)

### 9.2 开发规范

- 后端: PEP8 规范
- 前端: ESLint + Prettier
- 接口: RESTful 规范
- 提交: Conventional Commits

---

*文档版本: v1.0*  
*更新日期: 2026-03-24*
