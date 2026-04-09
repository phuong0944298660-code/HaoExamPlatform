# 基础功能底座需求文档

> 基于 RuoYi 架构和 B 端系统标准，为接力教育智慧云平台补充基础功能底座

---

## 一、现状分析

### 1.1 当前系统功能

| 模块 | 功能 | 状态 |
|-----|-----|-----|
| 账号管理 | 学生/教师账号生成 | ✅ 已实现 |
| 题库系统 | 题目CRUD、组卷 | ✅ 已实现 |
| 考试引擎 | 答题、提交、评分 | ✅ 已实现 |
| 成绩管理 | 成绩查询、导出 | ✅ 已实现 |
| 资源中心 | 教学资源管理 | ✅ 已实现 |

### 1.2 缺失的基础功能

| 类别 | 缺失功能 | 重要程度 |
|-----|---------|---------|
| 系统管理 | 用户管理、角色权限、菜单管理 | 🔴 核心 |
| 系统管理 | 部门管理、岗位管理 | 🟡 重要 |
| 系统管理 | 字典管理、参数管理 | 🟡 重要 |
| 系统管理 | 操作日志、登录日志 | 🔴 核心 |
| 系统管理 | 通知公告 | 🟡 重要 |
| 前端架构 | 动态路由系统 | 🔴 核心 |
| 消息中心 | 站内消息、消息模板 | 🟡 重要 |
| 个人中心 | 个人信息、修改密码 | 🔴 核心 |
| 个人中心 | 头像修改、我的消息 | 🟡 重要 |

### 1.3 文档目录

- [一、现状分析](#一现状分析)
- [二、系统管理模块](#二系统管理模块)
- [三、前端动态路由系统](#三前端动态路由系统) ⭐ 新增
- [四、消息中心模块](#四消息中心模块)
- [五、个人中心模块](#五个人中心模块)
- [六、权限控制实现](#六权限控制实现)

---

## 二、系统管理模块

### 2.1 权限模型设计 (RBAC)

```
┌─────────────────────────────────────────────────────────────────┐
│                        RBAC 权限模型                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐              │
│   │   用户   │◄────┤  用户角色 │────►│   角色   │              │
│   │  (User)  │     │ 关联表   │     │  (Role)  │              │
│   └────┬─────┘     └──────────┘     └────┬─────┘              │
│        │                                  │                     │
│        │         ┌──────────┐            │                     │
│        └────────►│   部门   │◄───────────┘                     │
│                  │ (Dept)   │                                  │
│                  └────┬─────┘                                  │
│                       │                                        │
│        ┌──────────────┼──────────────┐                        │
│        │              │              │                        │
│   ┌────▼─────┐   ┌────▼─────┐   ┌────▼─────┐                 │
│   │   菜单   │   │  数据权限 │   │ 操作权限  │                 │
│   │  (Menu)  │   │          │   │          │                 │
│   └──────────┘   └──────────┘   └──────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 数据库模型设计

#### 2.2.1 用户表 (sys_user)

```python
class SysUser(Base):
    """系统用户表 - 区分于学生/教师账号"""
    __tablename__ = "sys_users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False, comment="登录账号")
    nickname = Column(String(50), nullable=True, comment="用户昵称")
    password = Column(String(100), nullable=False, comment="密码")
    
    # 个人信息
    avatar = Column(String(255), default="", comment="头像URL")
    email = Column(String(100), nullable=True, comment="邮箱")
    phone = Column(String(20), nullable=True, comment="手机号")
    
    # 组织架构
    dept_id = Column(Integer, ForeignKey("sys_depts.id"), nullable=True, comment="部门ID")
    
    # 状态
    status = Column(Integer, default=1, comment="状态 0-禁用 1-启用")
    
    # 登录信息
    login_ip = Column(String(50), nullable=True, comment="最后登录IP")
    login_date = Column(DateTime, nullable=True, comment="最后登录时间")
    
    # 关联
    roles = relationship("SysRole", secondary="sys_user_roles", back_populates="users")
    dept = relationship("SysDept", back_populates="users")
    
    # 审计字段
    create_by = Column(String(50), nullable=True, comment="创建者")
    create_time = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    update_by = Column(String(50), nullable=True, comment="更新者")
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    remark = Column(String(500), nullable=True, comment="备注")
    
    # 删除标记（软删除）
    del_flag = Column(Integer, default=0, comment="删除标记 0-正常 1-已删除")
```

#### 2.2.2 角色表 (sys_role)

```python
class SysRole(Base):
    """系统角色表"""
    __tablename__ = "sys_roles"
    
    id = Column(Integer, primary_key=True)
    role_name = Column(String(50), nullable=False, comment="角色名称")
    role_key = Column(String(50), unique=True, nullable=False, comment="角色权限字符串")
    role_sort = Column(Integer, default=0, comment="显示顺序")
    
    # 数据权限范围
    data_scope = Column(String(20), default="1", comment="
        数据范围：
        1-全部数据权限
        2-本部门数据权限
        3-本部门及以下数据权限
        4-仅本人数据权限
        5-自定义数据权限
    ")
    
    # 状态
    status = Column(Integer, default=1, comment="状态 0-禁用 1-启用")
    
    # 关联
    users = relationship("SysUser", secondary="sys_user_roles", back_populates="roles")
    menus = relationship("SysMenu", secondary="sys_role_menus", back_populates="roles")
    
    # 审计字段
    create_by = Column(String(50), nullable=True)
    create_time = Column(DateTime, default=datetime.utcnow)
    update_by = Column(String(50), nullable=True)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    remark = Column(String(500), nullable=True)
    del_flag = Column(Integer, default=0)
```

#### 2.2.3 菜单表 (sys_menu)

```python
class SysMenu(Base):
    """系统菜单表"""
    __tablename__ = "sys_menus"

    id = Column(Integer, primary_key=True)
    menu_name = Column(String(50), nullable=False, comment="菜单名称")

    # 父级菜单
    parent_id = Column(Integer, default=0, comment="父菜单ID")

    # 排序
    order_num = Column(Integer, default=0, comment="显示顺序")

    # 路由信息
    path = Column(String(200), nullable=True, comment="路由地址")
    component = Column(String(255), nullable=True, comment="组件名称，用于前端动态路由")

    # 菜单类型
    menu_type = Column(String(20), default="M", comment="菜单类型 M-目录 C-菜单 F-按钮")

    # 权限标识
    perms = Column(String(100), nullable=True, comment="权限标识 如: system:user:list")

    # 图标
    icon = Column(String(100), default="#", comment="菜单图标")

    # 状态
    status = Column(Integer, default=1, comment="状态 0-禁用 1-启用")
    visible = Column(Integer, default=1, comment="显示状态 0-隐藏 1-显示")
    is_cache = Column(Integer, default=1, comment="是否缓存 0-不缓存 1-缓存")
    is_frame = Column(Integer, default=0, comment="是否外链 0-否 1-是")

    # 查询参数或iframe URL
    query = Column(String(500), nullable=True, comment="路由参数或iframe链接地址")

    # 关联
    roles = relationship("SysRole", secondary="sys_role_menus", back_populates="menus")

    # 审计字段
    create_by = Column(String(50), nullable=True)
    create_time = Column(DateTime, default=datetime.utcnow)
    update_by = Column(String(50), nullable=True)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    remark = Column(String(500), nullable=True)
```

#### 2.2.4 部门表 (sys_dept)

```python
class SysDept(Base):
    """部门表"""
    __tablename__ = "sys_depts"
    
    id = Column(Integer, primary_key=True)
    parent_id = Column(Integer, default=0, comment="父部门ID")
    dept_name = Column(String(50), nullable=False, comment="部门名称")
    order_num = Column(Integer, default=0, comment="显示顺序")
    leader = Column(String(50), nullable=True, comment="负责人")
    phone = Column(String(20), nullable=True, comment="联系电话")
    email = Column(String(100), nullable=True, comment="邮箱")
    status = Column(Integer, default=1, comment="状态")
    
    # 关联
    users = relationship("SysUser", back_populates="dept")
    
    # 审计字段
    create_by = Column(String(50), nullable=True)
    create_time = Column(DateTime, default=datetime.utcnow)
    update_by = Column(String(50), nullable=True)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    del_flag = Column(Integer, default=0)
```

#### 2.2.5 字典表

```python
class SysDictType(Base):
    """字典类型表"""
    __tablename__ = "sys_dict_types"
    
    id = Column(Integer, primary_key=True)
    dict_name = Column(String(100), nullable=False, comment="字典名称")
    dict_type = Column(String(100), unique=True, nullable=False, comment="字典类型")
    status = Column(Integer, default=1, comment="状态")
    
    # 关联
    data = relationship("SysDictData", back_populates="dict_type")
    
    create_by = Column(String(50), nullable=True)
    create_time = Column(DateTime, default=datetime.utcnow)
    update_by = Column(String(50), nullable=True)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    remark = Column(String(500), nullable=True)


class SysDictData(Base):
    """字典数据表"""
    __tablename__ = "sys_dict_data"
    
    id = Column(Integer, primary_key=True)
    dict_type_id = Column(Integer, ForeignKey("sys_dict_types.id"), nullable=False)
    dict_sort = Column(Integer, default=0, comment="字典排序")
    dict_label = Column(String(100), nullable=False, comment="字典标签")
    dict_value = Column(String(100), nullable=False, comment="字典键值")
    css_class = Column(String(100), nullable=True, comment="样式属性")
    list_class = Column(String(100), nullable=True, comment="表格回显样式")
    is_default = Column(Integer, default=0, comment="是否默认")
    status = Column(Integer, default=1, comment="状态")
    
    # 关联
    dict_type = relationship("SysDictType", back_populates="data")
    
    create_by = Column(String(50), nullable=True)
    create_time = Column(DateTime, default=datetime.utcnow)
    update_by = Column(String(50), nullable=True)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    remark = Column(String(500), nullable=True)
```

#### 2.2.6 操作日志表

```python
class SysOperationLog(Base):
    """操作日志表"""
    __tablename__ = "sys_operation_logs"
    
    id = Column(Integer, primary_key=True)
    
    # 操作信息
    title = Column(String(50), nullable=True, comment="模块标题")
    business_type = Column(Integer, default=0, comment="业务类型 0-其它 1-新增 2-修改 3-删除")
    method = Column(String(100), nullable=True, comment="请求方法")
    request_method = Column(String(10), nullable=True, comment="请求方式 GET/POST/PUT/DELETE")
    
    # 操作者信息
    operator_name = Column(String(50), nullable=True, comment="操作人员")
    operator_id = Column(Integer, nullable=True, comment="操作人员ID")
    dept_name = Column(String(50), nullable=True, comment="部门名称")
    
    # 请求信息
    url = Column(String(255), nullable=True, comment="请求URL")
    ip = Column(String(50), nullable=True, comment="IP地址")
    location = Column(String(255), nullable=True, comment="操作地点")
    param = Column(Text, nullable=True, comment="请求参数")
    
    # 响应信息
    json_result = Column(Text, nullable=True, comment="返回结果")
    status = Column(Integer, default=0, comment="操作状态 0-正常 1-异常")
    error_msg = Column(Text, nullable=True, comment="错误消息")
    
    # 执行时间
    execute_time = Column(Integer, default=0, comment="执行耗时(ms)")
    
    # 操作时间
    oper_time = Column(DateTime, default=datetime.utcnow, comment="操作时间")
```

#### 2.2.7 登录日志表

```python
class SysLoginLog(Base):
    """登录日志表"""
    __tablename__ = "sys_login_logs"
    
    id = Column(Integer, primary_key=True)
    
    # 用户信息
    username = Column(String(50), nullable=True, comment="用户账号")
    ip = Column(String(50), nullable=True, comment="登录IP地址")
    location = Column(String(255), nullable=True, comment="登录地点")
    browser = Column(String(50), nullable=True, comment="浏览器类型")
    os = Column(String(50), nullable=True, comment="操作系统")
    
    # 登录状态
    status = Column(Integer, default=0, comment="登录状态 0-成功 1-失败")
    msg = Column(String(255), nullable=True, comment="提示消息")
    
    # 登录时间
    login_time = Column(DateTime, default=datetime.utcnow, comment="访问时间")
```

#### 2.2.8 系统参数表

```python
class SysConfig(Base):
    """系统参数配置表"""
    __tablename__ = "sys_configs"
    
    id = Column(Integer, primary_key=True)
    config_name = Column(String(100), nullable=False, comment="参数名称")
    config_key = Column(String(100), unique=True, nullable=False, comment="参数键名")
    config_value = Column(String(500), nullable=False, comment="参数键值")
    config_type = Column(Integer, default="Y", comment="系统内置 Y-是 N-否")
    
    create_by = Column(String(50), nullable=True)
    create_time = Column(DateTime, default=datetime.utcnow)
    update_by = Column(String(50), nullable=True)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    remark = Column(String(500), nullable=True)
```

#### 2.2.9 通知公告表

```python
class SysNotice(Base):
    """通知公告表"""
    __tablename__ = "sys_notices"
    
    id = Column(Integer, primary_key=True)
    notice_title = Column(String(100), nullable=False, comment="公告标题")
    notice_type = Column(Integer, default=1, comment="公告类型 1-通知 2-公告")
    notice_content = Column(Text, nullable=True, comment="公告内容")
    status = Column(Integer, default=0, comment="状态 0-正常 1-关闭")
    
    create_by = Column(String(50), nullable=True)
    create_time = Column(DateTime, default=datetime.utcnow)
    update_by = Column(String(50), nullable=True)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    remark = Column(String(255), nullable=True)
```

---

### 2.3 API 接口设计

#### 2.3.1 用户管理接口

```python
# app/api/v1/system/users.py

from fastapi import APIRouter, Depends, Query
from typing import List, Optional

router = APIRouter(prefix="/system/users", tags=["系统管理-用户管理"])

@router.get("/list", response_model=PageResponse[UserInfo])
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    username: Optional[str] = None,
    nickname: Optional[str] = None,
    status: Optional[int] = None,
    dept_id: Optional[int] = None,
    current_user: SysUser = Depends(get_current_admin)
):
    """获取用户列表"""
    pass

@router.get("/{user_id}", response_model=Response[UserDetail])
async def get_user(user_id: int, current_user: SysUser = Depends(get_current_admin)):
    """获取用户详情"""
    pass

@router.post("", response_model=Response[dict])
async def create_user(data: UserCreate, current_user: SysUser = Depends(get_current_admin)):
    """新增用户"""
    pass

@router.put("/{user_id}", response_model=Response[dict])
async def update_user(
    user_id: int, 
    data: UserUpdate, 
    current_user: SysUser = Depends(get_current_admin)
):
    """修改用户"""
    pass

@router.delete("/{user_id}", response_model=Response[dict])
async def delete_user(user_id: int, current_user: SysUser = Depends(get_current_admin)):
    """删除用户"""
    pass

@router.put("/{user_id}/status", response_model=Response[dict])
async def change_user_status(
    user_id: int,
    status: int,
    current_user: SysUser = Depends(get_current_admin)
):
    """修改用户状态"""
    pass

@router.put("/{user_id}/reset-password", response_model=Response[dict])
async def reset_password(user_id: int, current_user: SysUser = Depends(get_current_admin)):
    """重置密码"""
    pass
```

#### 2.3.2 角色管理接口

```python
# app/api/v1/system/roles.py

@router.get("/list", response_model=PageResponse[RoleInfo])
async def list_roles(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    role_name: Optional[str] = None,
    status: Optional[int] = None,
    current_user: SysUser = Depends(get_current_admin)
):
    """获取角色列表"""
    pass

@router.get("/{role_id}", response_model=Response[RoleDetail])
async def get_role(role_id: int, current_user: SysUser = Depends(get_current_admin)):
    """获取角色详情"""
    pass

@router.post("", response_model=Response[dict])
async def create_role(data: RoleCreate, current_user: SysUser = Depends(get_current_admin)):
    """新增角色"""
    pass

@router.put("/{role_id}", response_model=Response[dict])
async def update_role(
    role_id: int,
    data: RoleUpdate,
    current_user: SysUser = Depends(get_current_admin)
):
    """修改角色"""
    pass

@router.delete("/{role_id}", response_model=Response[dict])
async def delete_role(role_id: int, current_user: SysUser = Depends(get_current_admin)):
    """删除角色"""
    pass

@router.get("/{role_id}/menus", response_model=Response[List[int]])
async def get_role_menus(role_id: int, current_user: SysUser = Depends(get_current_admin)):
    """获取角色已分配的菜单权限"""
    pass

@router.put("/{role_id}/menus", response_model=Response[dict])
async def assign_role_menus(
    role_id: int,
    menu_ids: List[int],
    current_user: SysUser = Depends(get_current_admin)
):
    """分配角色菜单权限"""
    pass
```

#### 2.3.3 菜单管理接口

```python
# app/api/v1/system/menus.py

@router.get("/list", response_model=Response[List[MenuTree]])
async def list_menus(
    menu_name: Optional[str] = None,
    status: Optional[int] = None,
    current_user: SysUser = Depends(get_current_admin)
):
    """获取菜单列表（树形结构）"""
    pass

@router.get("/treeselect", response_model=Response[List[TreeSelect]])
async def menu_tree_select(current_user: SysUser = Depends(get_current_admin)):
    """获取菜单下拉树"""
    pass

@router.get("/roleMenuTreeselect/{role_id}", response_model=Response[RoleMenuTree])
async def role_menu_tree_select(
    role_id: int,
    current_user: SysUser = Depends(get_current_admin)
):
    """加载对应角色菜单列表树"""
    pass

@router.post("", response_model=Response[dict])
async def create_menu(data: MenuCreate, current_user: SysUser = Depends(get_current_admin)):
    """新增菜单"""
    pass

@router.put("/{menu_id}", response_model=Response[dict])
async def update_menu(
    menu_id: int,
    data: MenuUpdate,
    current_user: SysUser = Depends(get_current_admin)
):
    """修改菜单"""
    pass

@router.delete("/{menu_id}", response_model=Response[dict])
async def delete_menu(menu_id: int, current_user: SysUser = Depends(get_current_admin)):
    """删除菜单"""
    pass
```

#### 2.3.4 部门管理接口

```python
# app/api/v1/system/depts.py

@router.get("/list", response_model=Response[List[DeptTree]])
async def list_depts(
    dept_name: Optional[str] = None,
    status: Optional[int] = None,
    current_user: SysUser = Depends(get_current_admin)
):
    """获取部门列表（树形结构）"""
    pass

@router.get("/treeselect", response_model=Response[List[TreeSelect]])
async def dept_tree_select(current_user: SysUser = Depends(get_current_admin)):
    """获取部门下拉树"""
    pass

@router.post("", response_model=Response[dict])
async def create_dept(data: DeptCreate, current_user: SysUser = Depends(get_current_admin)):
    """新增部门"""
    pass

@router.put("/{dept_id}", response_model=Response[dict])
async def update_dept(
    dept_id: int,
    data: DeptUpdate,
    current_user: SysUser = Depends(get_current_admin)
):
    """修改部门"""
    pass

@router.delete("/{dept_id}", response_model=Response[dict])
async def delete_dept(dept_id: int, current_user: SysUser = Depends(get_current_admin)):
    """删除部门"""
    pass
```

#### 2.3.5 字典管理接口

```python
# app/api/v1/system/dicts.py

@router.get("/type/list", response_model=PageResponse[DictTypeInfo])
async def list_dict_types(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    dict_name: Optional[str] = None,
    dict_type: Optional[str] = None,
    status: Optional[int] = None,
    current_user: SysUser = Depends(get_current_admin)
):
    """获取字典类型列表"""
    pass

@router.get("/type/{dict_id}", response_model=Response[DictTypeDetail])
async def get_dict_type(dict_id: int, current_user: SysUser = Depends(get_current_admin)):
    """获取字典类型详情"""
    pass

@router.get("/data/type/{dict_type}", response_model=Response[List[DictDataInfo]])
async def get_dict_data_by_type(dict_type: str):
    """根据字典类型获取字典数据（公开接口，前端下拉框使用）"""
    pass

@router.post("/type", response_model=Response[dict])
async def create_dict_type(
    data: DictTypeCreate,
    current_user: SysUser = Depends(get_current_admin)
):
    """新增字典类型"""
    pass

@router.get("/data/list", response_model=PageResponse[DictDataInfo])
async def list_dict_data(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    dict_type_id: Optional[int] = None,
    dict_label: Optional[str] = None,
    status: Optional[int] = None,
    current_user: SysUser = Depends(get_current_admin)
):
    """获取字典数据列表"""
    pass

@router.post("/data", response_model=Response[dict])
async def create_dict_data(
    data: DictDataCreate,
    current_user: SysUser = Depends(get_current_admin)
):
    """新增字典数据"""
    pass
```

#### 2.3.6 日志管理接口

```python
# app/api/v1/system/logs.py

# 操作日志
@router.get("/operlog/list", response_model=PageResponse[OperLogInfo])
async def list_oper_logs(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    title: Optional[str] = None,
    oper_name: Optional[str] = None,
    business_type: Optional[int] = None,
    status: Optional[int] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    current_user: SysUser = Depends(get_current_admin)
):
    """获取操作日志列表"""
    pass

@router.delete("/operlog/{log_id}", response_model=Response[dict])
async def delete_oper_log(log_id: int, current_user: SysUser = Depends(get_current_admin)):
    """删除操作日志"""
    pass

@router.delete("/operlog/clean", response_model=Response[dict])
async def clean_oper_logs(current_user: SysUser = Depends(get_current_admin)):
    """清空操作日志"""
    pass

# 登录日志
@router.get("/loginlog/list", response_model=PageResponse[LoginLogInfo])
async def list_login_logs(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    username: Optional[str] = None,
    ip: Optional[str] = None,
    status: Optional[int] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    current_user: SysUser = Depends(get_current_admin)
):
    """获取登录日志列表"""
    pass

@router.delete("/loginlog/{log_id}", response_model=Response[dict])
async def delete_login_log(log_id: int, current_user: SysUser = Depends(get_current_admin)):
    """删除登录日志"""
    pass

@router.delete("/loginlog/clean", response_model=Response[dict])
async def clean_login_logs(current_user: SysUser = Depends(get_current_admin)):
    """清空登录日志"""
    pass
```

---

## 三、前端动态路由系统

### 3.1 需求背景

为满足后台管理系统的灵活性和可扩展性，前端需要实现**动态路由系统**，支持管理员在后台【菜单管理】中配置菜单后，无需修改前端代码即可自动加载对应页面。

### 3.2 核心功能需求

#### 3.2.1 自动组件扫描

- **需求描述**：前端构建时自动扫描 `views/` 目录下的所有 `.vue` 文件
- **命名规范**：组件名 = 目录前缀 + PascalCase文件名
  - 例：`@/views/admin/AccountManager.vue` → `AdminAccountManager`
  - 例：`@/views/system/users/index.vue` → `SystemUsers`
- **冲突处理**：不同目录下同名文件通过目录前缀区分

#### 3.2.2 组件别名映射

- **需求描述**：支持后端配置的组件名与前端实际组件名的映射转换
- **映射规则**：在 `componentScanner.ts` 中维护别名映射表
- **常见别名**：

| 后端配置名 | 前端实际组件名 |
|-----------|--------------|
| `AdminAccounts` | `AdminAccountManager` |
| `AdminAccount` | `AdminAccountManager` |
| `AdminQuestions` | `AdminQuestionBankList` |
| `AdminPapers` | `AdminPaperManager` |
| `AdminExams` | `AdminExamManager` |
| `AdminScores` | `AdminScoreManager` |

#### 3.2.3 菜单配置字段

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `menu_name` | 是 | 菜单显示名称 | 账号管理 |
| `path` | 是 | 路由路径 | /accounts/list |
| `component` | 否 | 组件名 | AdminAccountManager |
| `menu_type` | 是 | M=目录, C=菜单, F=按钮 | C |
| `parent_id` | 否 | 父菜单ID | 0 |
| `icon` | 否 | Ant Design 图标名 | team |
| `perms` | 否 | 权限标识 | system:account:list |
| `is_cache` | 否 | 是否缓存 | 1 |
| `is_frame` | 否 | 是否外链 | 0 |
| `query` | 否 | 参数/iframe URL | https://example.com |

#### 3.2.4 特殊页面类型

1. **外链页面** (`is_frame = 1`)
   - 在新标签页打开外部链接
   - `query` 字段填写外部 URL

2. **Iframe 内嵌** (`component = 'Iframe'`)
   - 在系统内嵌第三方页面
   - `query` 字段填写 iframe URL

3. **普通页面** (`menu_type = 'C'`)
   - 需要配置 `component` 字段
   - 组件名必须与前端扫描结果匹配

### 3.3 路由加载流程

```
用户登录成功
    ↓
获取用户角色
    ↓
角色为 admin？
    ↓ 是
调用 /api/v1/system/menus/nav 获取菜单列表
    ↓
前端扫描可用组件
    ↓
根据菜单生成路由配置
    ↓
使用 router.addRoute() 动态添加路由
    ↓
重新导航到目标页面
```

### 3.4 错误处理机制

#### 3.4.1 组件未找到

- **场景**：后端配置的组件名在前端不存在
- **处理**：控制台输出警告日志，显示可用的相似组件名列表
- **提示**：页面显示 "组件未找到，请检查菜单配置"

#### 3.4.2 路由未找到

- **场景**：用户访问的路径没有对应的路由
- **处理**：跳转到 404 页面，显示诊断信息
- **提示**：显示可能原因（Token过期、动态路由未加载、组件不存在等）

#### 3.4.3 Token 过期

- **场景**：动态路由加载时 Token 已过期
- **处理**：API 返回 403，跳转登录页
- **提示**："登录已过期，请重新登录"

### 3.5 页面配置示例

#### 场景1：新增账号管理页面

**步骤1**：前端开发页面
```
文件路径：frontend/src/views/admin/AccountManager.vue
组件名称：AdminAccountManager（自动扫描生成）
```

**步骤2**：后台菜单配置
```sql
INSERT INTO sys_menu (
  menu_name, path, component, menu_type, 
  parent_id, icon, perms, is_cache
) VALUES (
  '账号管理', '/accounts/list', 'AdminAccountManager', 'C',
  0, 'team', 'system:account:list', 1
);
```

**步骤3**：访问页面
- 管理员登录后，侧边栏自动显示"账号管理"菜单
- 点击菜单即可访问页面，无需重启前端服务

### 3.6 性能要求

1. **组件扫描**：构建时完成，不影响运行时性能
2. **路由加载**：登录时一次性加载，后续页面切换无需重新加载
3. **缓存策略**：支持 keep-alive 缓存，通过 `is_cache` 字段控制

---

## 四、消息中心模块

### 3.1 数据模型设计

```python
# 消息模板表
class MessageTemplate(Base):
    """消息模板表"""
    __tablename__ = "message_templates"
    
    id = Column(Integer, primary_key=True)
    template_code = Column(String(50), unique=True, nullable=False, comment="模板编码")
    template_name = Column(String(100), nullable=False, comment="模板名称")
    template_type = Column(Integer, default=1, comment="模板类型 1-站内信 2-邮件 3-短信")
    template_content = Column(Text, nullable=False, comment="模板内容")
    template_params = Column(String(255), nullable=True, comment="模板参数")
    status = Column(Integer, default=1, comment="状态")
    
    create_time = Column(DateTime, default=datetime.utcnow)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    remark = Column(String(500), nullable=True)


# 站内消息表
class Message(Base):
    """站内消息表"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, nullable=True, comment="发送者ID，null为系统消息")
    sender_name = Column(String(50), default="系统", comment="发送者名称")
    
    # 接收者
    recipient_id = Column(Integer, ForeignKey("sys_users.id"), nullable=False)
    
    # 消息内容
    title = Column(String(200), nullable=False, comment="消息标题")
    content = Column(Text, nullable=False, comment="消息内容")
    content_type = Column(Integer, default=1, comment="内容类型 1-文本 2-HTML")
    
    # 消息类型
    message_type = Column(Integer, default=1, comment="消息类型 1-通知 2-提醒 3-公告")
    
    # 优先级
    priority = Column(Integer, default=1, comment="优先级 1-普通 2-重要 3-紧急")
    
    # 状态
    is_read = Column(Integer, default=0, comment="是否已读 0-未读 1-已读")
    read_time = Column(DateTime, nullable=True, comment="阅读时间")
    
    # 链接
    link_url = Column(String(500), nullable=True, comment="跳转链接")
    
    create_time = Column(DateTime, default=datetime.utcnow)


# 消息接收记录表（群发时使用）
class MessageRecipient(Base):
    """消息接收记录表"""
    __tablename__ = "message_recipients"
    
    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("sys_users.id"), nullable=False)
    is_read = Column(Integer, default=0)
    read_time = Column(DateTime, nullable=True)
```

### 3.2 API 接口设计

```python
# app/api/v1/system/messages.py

@router.get("/list", response_model=PageResponse[MessageInfo])
async def list_messages(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    is_read: Optional[int] = None,
    message_type: Optional[int] = None,
    current_user: SysUser = Depends(get_current_user)
):
    """获取我的消息列表"""
    pass

@router.get("/unread-count", response_model=Response[int])
async def get_unread_count(current_user: SysUser = Depends(get_current_user)):
    """获取未读消息数量"""
    pass

@router.get("/{message_id}", response_model=Response[MessageDetail])
async def get_message(
    message_id: int,
    current_user: SysUser = Depends(get_current_user)
):
    """获取消息详情（自动标记为已读）"""
    pass

@router.put("/{message_id}/read", response_model=Response[dict])
async def mark_as_read(
    message_id: int,
    current_user: SysUser = Depends(get_current_user)
):
    """标记消息为已读"""
    pass

@router.put("/read-all", response_model=Response[dict])
async def mark_all_as_read(current_user: SysUser = Depends(get_current_user)):
    """标记所有消息为已读"""
    pass

@router.delete("/{message_id}", response_model=Response[dict])
async def delete_message(
    message_id: int,
    current_user: SysUser = Depends(get_current_user)
):
    """删除消息"""
    pass

# 管理员接口 - 发送消息
@router.post("/send", response_model=Response[dict])
async def send_message(
    data: SendMessageRequest,
    current_user: SysUser = Depends(get_current_admin)
):
    """发送消息（支持群发）"""
    pass
```

---

## 四、个人中心模块

### 4.1 API 接口设计

```python
# app/api/v1/profile.py

@router.get("", response_model=Response[UserProfile])
async def get_profile(current_user: SysUser = Depends(get_current_user)):
    """获取个人信息"""
    pass

@router.put("", response_model=Response[dict])
async def update_profile(
    data: UpdateProfileRequest,
    current_user: SysUser = Depends(get_current_user)
):
    """修改个人信息"""
    pass

@router.post("/avatar", response_model=Response[dict])
async def update_avatar(
    avatar: UploadFile = File(...),
    current_user: SysUser = Depends(get_current_user)
):
    """修改头像"""
    pass

@router.put("/password", response_model=Response[dict])
async def change_password(
    data: ChangePasswordRequest,
    current_user: SysUser = Depends(get_current_user)
):
    """修改密码"""
    pass

@router.get("/operlog", response_model=PageResponse[OperLogInfo])
async def get_my_oper_logs(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: SysUser = Depends(get_current_user)
):
    """获取我的操作记录"""
    pass
```

---

## 五、前端设计

### 6.1 系统管理菜单结构（动态路由版）

```typescript
// 前端动态路由系统配置
// 菜单数据从后端 /api/v1/system/menus/nav 接口获取

/**
 * 后端菜单数据结构
 */
interface MenuItem {
  id: number;                    // 菜单ID
  menu_name: string;             // 菜单名称
  path: string;                  // 路由路径
  component?: string;            // 组件名（如：AdminAccountManager）
  menu_type: 'M' | 'C' | 'F';    // M=目录, C=菜单, F=按钮
  parent_id: number;             // 父菜单ID
  icon?: string;                 // Ant Design 图标名
  perms?: string;                // 权限标识
  is_cache?: boolean;            // 是否缓存
  is_frame?: boolean;            // 是否外链
  query?: string;                // 查询参数/iframe URL
  children?: MenuItem[];         // 子菜单
}

/**
 * 前端组件命名规范
 * 目录前缀 + PascalCase文件名
 * 
 * 示例：
 * - @/views/admin/AccountManager.vue     → AdminAccountManager
 * - @/views/system/users/index.vue       → SystemUsers
 * - @/views/teacher/QuestionBanks.vue    → TeacherQuestionBanks
 * - @/views/common/Iframe.vue            → Iframe
 */

/**
 * 组件别名映射（处理命名不一致）
 */
const componentAliasMap: Record<string, string> = {
  'AdminAccounts': 'AdminAccountManager',
  'AdminAccount': 'AdminAccountManager',
  'AdminQuestions': 'AdminQuestionBankList',
  'AdminPapers': 'AdminPaperManager',
  'AdminExams': 'AdminExamManager',
  'AdminScores': 'AdminScoreManager',
};

/**
 * 系统管理菜单配置示例（后台配置）
 * 
 * SQL 插入示例：
 * INSERT INTO sys_menu (menu_name, path, component, menu_type, parent_id, icon, perms) VALUES
 * ('系统管理', '/system', NULL, 'M', 0, 'setting', NULL),
 * ('用户管理', '/system/users', 'SystemUsers', 'C', @parent_id, 'user', 'system:user:list'),
 * ('角色管理', '/system/roles', 'SystemRoles', 'C', @parent_id, 'team', 'system:role:list'),
 * ('菜单管理', '/system/menus', 'SystemMenus', 'C', @parent_id, 'menu', 'system:menu:list');
 */
```

### 5.2 个人中心路由

```typescript
const profileRoutes = [
  {
    path: '/profile',
    name: 'Profile',
    component: 'views/profile/index',
    meta: { title: '个人中心', hidden: true },
    children: [
      {
        path: '',
        name: 'ProfileInfo',
        component: 'views/profile/Info',
        meta: { title: '个人信息' }
      },
      {
        path: 'password',
        name: 'ProfilePassword',
        component: 'views/profile/Password',
        meta: { title: '修改密码' }
      },
      {
        path: 'logs',
        name: 'ProfileLogs',
        component: 'views/profile/Logs',
        meta: { title: '操作记录' }
      }
    ]
  }
];
```

---

## 六、权限控制实现

### 6.1 后端权限装饰器

```python
# app/core/permission.py

from functools import wraps
from fastapi import HTTPException, Depends
from typing import List

def require_permissions(perms: List[str]):
    """权限检查装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: SysUser = Depends(get_current_user), **kwargs):
            # 获取用户所有权限
            user_perms = await get_user_permissions(current_user.id)
            
            # 检查是否包含所需权限
            for perm in perms:
                if perm not in user_perms:
                    raise HTTPException(status_code=403, detail=f"缺少权限: {perm}")
            
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# 使用示例
@router.get("/list")
@require_permissions(["system:user:list"])
async def list_users(current_user: SysUser = Depends(get_current_user)):
    pass
```

### 6.2 数据权限控制

```python
class DataScope:
    """数据权限范围"""
    ALL = 1  # 全部数据权限
    DEPT_ONLY = 2  # 本部门数据权限
    DEPT_AND_CHILD = 3  # 本部门及以下数据权限
    SELF_ONLY = 4  # 仅本人数据权限
    CUSTOM = 5  # 自定义数据权限

async def apply_data_scope(query, user_id: int):
    """应用数据权限"""
    user = await db.get(SysUser, user_id)
    
    # 获取用户角色的数据权限范围
    min_scope = DataScope.ALL
    for role in user.roles:
        if role.data_scope < min_scope:
            min_scope = role.data_scope
    
    # 根据数据权限范围过滤
    if min_scope == DataScope.ALL:
        return query
    elif min_scope == DataScope.SELF_ONLY:
        return query.filter(Model.create_by == user_id)
    elif min_scope == DataScope.DEPT_ONLY:
        return query.filter(Model.dept_id == user.dept_id)
    elif min_scope == DataScope.DEPT_AND_CHILD:
        dept_ids = await get_dept_and_children(user.dept_id)
        return query.filter(Model.dept_id.in_(dept_ids))
    
    return query
```

---

*文档版本: v1.2*  
*更新日期: 2026-04-08*  
*更新内容: 新增前端动态路由系统需求章节*

---

## 7. 项目仓库与交付规范

### 7.1 Git 仓库信息

| 项目 | 内容 |
|------|------|
| **远程仓库** | https://github.com/phuong0944298660-code/HaoExamPlatform.git |
| **开发分支** | `Develop` |
| **预发布分支** | `UAT` |
| **生产分支** | `Main` |

### 7.2 分支晋升流程

```
feature/* → Develop → UAT → Main
   ↓           ↓        ↓       ↓
功能开发    开发集成   预发布   生产环境
```

**交付检查清单：**

| 阶段 | 检查项 | 状态 |
|------|--------|------|
| Develop 交付 | 功能完成、本地测试通过 | ☐ |
| UAT 交付 | 代码审查通过、无阻塞 Bug | ☐ |
| Main 交付 | UAT 验收通过、生产就绪 | ☐ |

### 7.3 代码推送规范

⚠️ **重要**：所有推送到远程仓库的操作必须获得明确授权。

- 禁止自动推送到 `Main` 和 `UAT` 分支
- 推送到远程仓库前需用户确认
- Commit message 需遵循规范：`type(scope): description`

---

*文档版本: v1.1*  
*更新日期: 2026-04-08*  
*Git 仓库: https://github.com/phuong0944298660-code/HaoExamPlatform*
