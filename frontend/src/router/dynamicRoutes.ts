/**
 * 动态路由生成模块
 * 根据后端菜单配置自动生成 Vue Router 路由
 */
import type { RouteRecordRaw, RouteMeta } from 'vue-router'
import { generateComponentMap, getComponentLoader, resolveComponentName } from './componentScanner'

// ==================== 类型定义 ====================

/**
 * 后端菜单项
 */
export interface MenuItem {
  id: number
  menu_name: string
  path: string
  component?: string
  menu_type: 'M' | 'C' | 'F' // M=目录, C=菜单, F=按钮
  parent_id: number
  icon?: string
  perms?: string
  is_cache?: boolean
  is_frame?: boolean
  query?: string
  is_active?: boolean
  order_num?: number
  children?: MenuItem[]
}

/**
 * 布局组件类型
 */
type LayoutType = 'admin' | 'teacher' | 'student' | 'blank'

// ==================== 布局组件映射 ====================

// 延迟加载布局组件
const layoutLoaders: Record<LayoutType, () => Promise<any>> = {
  admin: () => import('@/layouts/AdminLayout.vue'),
  teacher: () => import('@/layouts/TeacherLayout.vue'),
  student: () => import('@/layouts/StudentLayout.vue'),
  blank: () => import('@/layouts/BlankLayout.vue'),
}

// ==================== 特殊组件映射 ====================

// 这些组件不需要扫描，直接内置
const builtinComponents: Record<string, () => Promise<any>> = {
  Iframe: () => import('@/views/common/Iframe.vue'),
  ExternalLink: () => import('@/views/common/ExternalLink.vue'),
}

// ==================== 核心函数 ====================

/**
 * 将路径格式组件名转换为 PascalCase 格式
 * 如：admin/AccountManager → AdminAccountManager
 * 如：system/users/index → SystemUsers
 */
function convertPathToComponentName(pathComponent: string): string {
  if (!pathComponent || pathComponent === 'Layout') return ''

  // 如果已经是 PascalCase（没有斜杠），直接返回
  if (!pathComponent.includes('/')) {
    return pathComponent
  }

  // 分割路径
  const parts = pathComponent.split('/')

  // 处理目录前缀
  const folder = parts[0]
  const folderPrefix = folder.charAt(0).toUpperCase() + folder.slice(1).toLowerCase()

  // 处理文件名
  let fileName = parts[parts.length - 1]

  // 如果是 index，使用上一级目录名
  if (fileName === 'index' && parts.length > 1) {
    fileName = parts[parts.length - 2]
  }

  // 转为 PascalCase
  const pascalFileName = fileName
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase())

  return folderPrefix + pascalFileName
}

/**
 * 从菜单列表生成路由配置
 * @param menus 后端返回的菜单列表
 * @returns Vue Router 路由配置数组
 */
export function generateRoutesFromMenus(menus: MenuItem[]): RouteRecordRaw[] {
  // 获取组件映射表
  const componentMap = generateComponentMap()

  // 合并内置组件
  const fullComponentMap = { ...componentMap, ...builtinComponents }

  // 构建菜单树
  const menuTree = buildMenuTree(menus)

  // 生成路由
  const routes: RouteRecordRaw[] = []

  for (const menu of menuTree) {
    // 跳过按钮类型和非激活菜单
    if (menu.menu_type === 'F') continue
    if (menu.is_active === false) continue

    const route = convertMenuToRoute(menu, fullComponentMap)
    if (route) {
      routes.push(route)
    }
  }

  console.log('[DynamicRoutes] 生成路由数量:', routes.length)
  return routes
}

/**
 * 将单个菜单转换为路由
 */
function convertMenuToRoute(
  menu: MenuItem,
  componentMap: Record<string, () => Promise<any>>
): RouteRecordRaw | null {
  // 确定布局类型
  const layoutType = getLayoutTypeByPath(menu.path)

  // 构建路由元数据
  const meta: RouteMeta = {
    title: menu.menu_name,
    icon: menu.icon,
    perms: menu.perms,
    keepAlive: menu.is_cache ?? false,
    id: menu.id,
  }

  // 处理外链
  if (menu.is_frame) {
    return createExternalLinkRoute(menu, layoutType, meta)
  }

  // 处理 iframe 内嵌
  if (menu.component === 'Iframe') {
    return createIframeRoute(menu, layoutType, meta, componentMap)
  }

  // 获取页面组件（支持路径格式转换和别名映射）
  const pascalComponentName = menu.component ? convertPathToComponentName(menu.component) : null
  const resolvedComponentName = pascalComponentName ? resolveComponentName(pascalComponentName) : null
  const pageComponent = resolvedComponentName ? componentMap[resolvedComponentName] : null

  // 如果是菜单类型但没有组件，警告并跳过
  if (menu.menu_type === 'C' && !pageComponent) {
    console.warn(`[DynamicRoutes] 菜单缺少组件: ${menu.menu_name} (path: ${menu.path}, component: ${menu.component})`)
    if (pascalComponentName && menu.component !== pascalComponentName) {
      console.warn(`  ↳ 路径转换: ${menu.component} → ${pascalComponentName}`)
    }
    if (resolvedComponentName && pascalComponentName !== resolvedComponentName) {
      console.warn(`  ↳ 别名映射: ${pascalComponentName} → ${resolvedComponentName}`)
    }
    console.warn(`  ↳ 可用组件:`, Object.keys(componentMap).filter(k => k.startsWith('Admin') || k.startsWith('System')).slice(0, 20).join(', '))
    return null
  }

  // 构建基础路由
  const route: RouteRecordRaw = {
    path: normalizePath(menu.path),
    component: layoutLoaders[layoutType],
    meta,
    children: [],
  }

  // 处理子菜单
  if (menu.children?.length) {
    for (const child of menu.children) {
      if (child.menu_type === 'F' || child.is_active === false) continue

      const childRoute = convertChildMenuToRoute(child, componentMap, menu)
      if (childRoute) {
        route.children!.push(childRoute)
      }
    }
  }

  // 如果有页面组件，添加默认子路由
  if (pageComponent) {
    route.children!.push({
      path: '',
      name: generateRouteName(menu.path),
      component: createErrorHandledLoader(pageComponent, menu.menu_name),
      meta: {
        ...meta,
        // 如果有子菜单，当前页面可能只是占位，不需要高亮
        hideInBreadcrumb: menu.children && menu.children.length > 0,
      },
    })
  }

  return route
}

/**
 * 转换子菜单为路由
 */
function convertChildMenuToRoute(
  menu: MenuItem,
  componentMap: Record<string, () => Promise<any>>,
  parent: MenuItem
): RouteRecordRaw | null {
  // 外链处理
  if (menu.is_frame) {
    return {
      path: menu.path,
      name: generateRouteName(menu.path),
      component: createErrorHandledLoader(builtinComponents.ExternalLink, menu.menu_name),
      meta: {
        title: menu.menu_name,
        icon: menu.icon,
        perms: menu.perms,
        externalLink: menu.path,
        activeMenu: normalizePath(parent.path),
      },
    }
  }

  // iframe 内嵌
  if (menu.component === 'Iframe') {
    return {
      path: menu.path,
      name: generateRouteName(menu.path),
      component: createErrorHandledLoader(builtinComponents.Iframe, menu.menu_name),
      meta: {
        title: menu.menu_name,
        icon: menu.icon,
        iframeUrl: menu.query,
        activeMenu: normalizePath(parent.path),
      },
    }
  }

  // 普通页面（支持路径格式转换和别名映射）
  const pascalComponentName = menu.component ? convertPathToComponentName(menu.component) : null
  const resolvedComponentName = pascalComponentName ? resolveComponentName(pascalComponentName) : null
  const pageComponent = resolvedComponentName ? componentMap[resolvedComponentName] : null
  if (!pageComponent) {
    console.warn(`[DynamicRoutes] 子菜单组件未找到: ${menu.component}, path: ${menu.path}`)
    if (menu.component !== resolvedComponentName) {
      console.warn(`  ↳ 尝试解析: ${menu.component} → ${pascalComponentName} → ${resolvedComponentName}`)
    }
    return null
  }

  // 子路由使用相对路径
  // 注意：后端配置的子路径可能不完全遵循父路径前缀（如父：/activation，子：/accounts/plans）
  // 这种情况下，我们使用完整路径作为子路由路径（Vue Router会相对于父路径解析）
  let childPath: string
  if (menu.path.startsWith(parent.path + '/')) {
    // 正常情况：子路径以父路径开头，如父：/accounts，子：/accounts/list → list
    childPath = menu.path.slice(parent.path.length + 1)
  } else if (menu.path.startsWith('/')) {
    // 非层级路径：以 / 开头表示绝对路径，Vue Router会正确处理
    // 如父：/activation，子：/accounts/activation → 使用完整路径
    childPath = menu.path
  } else {
    childPath = menu.path
  }

  return {
    path: childPath,
    name: generateRouteName(menu.path),
    component: createErrorHandledLoader(pageComponent, menu.menu_name),
    meta: {
      title: menu.menu_name,
      icon: menu.icon,
      perms: menu.perms,
      keepAlive: menu.is_cache ?? false,
      activeMenu: normalizePath(parent.path),
    },
  }
}

/**
 * 创建外链路由
 */
function createExternalLinkRoute(
  menu: MenuItem,
  layoutType: LayoutType,
  meta: RouteMeta
): RouteRecordRaw {
  return {
    path: normalizePath(menu.path),
    component: layoutLoaders[layoutType],
    meta: {
      ...meta,
      externalLink: menu.path,
    },
    children: [
      {
        path: '',
        name: generateRouteName(menu.path),
        component: builtinComponents.ExternalLink,
        meta: {
          ...meta,
          externalLink: menu.path,
        },
      },
    ],
  }
}

/**
 * 创建 iframe 路由
 */
function createIframeRoute(
  menu: MenuItem,
  layoutType: LayoutType,
  meta: RouteMeta,
  componentMap: Record<string, () => Promise<any>>
): RouteRecordRaw | null {
  if (!menu.query) {
    console.warn(`[DynamicRoutes] Iframe 菜单缺少 query (URL): ${menu.menu_name}`)
    return null
  }

  return {
    path: normalizePath(menu.path),
    component: layoutLoaders[layoutType],
    meta: {
      ...meta,
      iframeUrl: menu.query,
    },
    children: [
      {
        path: '',
        name: generateRouteName(menu.path),
        component: builtinComponents.Iframe,
        meta: {
          ...meta,
          iframeUrl: menu.query,
        },
      },
    ],
  }
}

/**
 * 创建带错误处理的组件加载器
 */
function createErrorHandledLoader(
  loader: () => Promise<any>,
  pageName: string
): () => Promise<any> {
  return () =>
    loader().catch((error) => {
      console.error(`[DynamicRoutes] 加载页面失败: ${pageName}`, error)
      // 返回错误页面组件
      return import('@/views/error/LoadError.vue')
    })
}

// ==================== 工具函数 ====================

/**
 * 构建菜单树
 */
function buildMenuTree(menus: MenuItem[]): MenuItem[] {
  const menuMap = new Map<number, MenuItem>()
  const tree: MenuItem[] = []

  // 先建立 id 映射（保留已存在的 children）
  for (const menu of menus) {
    menuMap.set(menu.id, { ...menu, children: menu.children || [] })
  }

  // 构建树形结构
  for (const menu of menuMap.values()) {
    if (menu.parent_id === 0 || !menu.parent_id) {
      tree.push(menu)
    } else {
      const parent = menuMap.get(menu.parent_id)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(menu)
      } else {
        // 父菜单不存在，作为顶级菜单
        tree.push(menu)
      }
    }
  }

  // 按 order_num 排序
  tree.sort((a, b) => (a.order_num ?? 0) - (b.order_num ?? 0))
  for (const menu of tree) {
    if (menu.children) {
      menu.children.sort((a, b) => (a.order_num ?? 0) - (b.order_num ?? 0))
    }
  }

  return tree
}

/**
 * 根据路径判断布局类型
 */
function getLayoutTypeByPath(path: string): LayoutType {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (normalizedPath.startsWith('/teacher')) return 'teacher'
  if (normalizedPath.startsWith('/student')) return 'student'
  if (normalizedPath.startsWith('/blank')) return 'blank'

  // 默认使用 admin 布局
  return 'admin'
}

/**
 * 规范化路径
 */
function normalizePath(path: string): string {
  if (!path) return '/'
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * 生成路由名称
 * 如：/accounts/activation → AccountsActivation
 */
export function generateRouteName(path: string): string {
  if (!path || path === '/') return 'Root'

  return path
    .replace(/^\//, '')
    .split('/')
    .map((segment) =>
      segment
        .replace(/[-_]/g, ' ')
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
        .replace(/\s+/g, '')
    )
    .join('')
}

/**
 * 扁平化菜单（用于侧边栏渲染）
 */
export function flattenMenus(menus: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = []

  function traverse(list: MenuItem[]) {
    for (const item of list) {
      result.push(item)
      if (item.children?.length) {
        traverse(item.children)
      }
    }
  }

  traverse(menus)
  return result
}

/**
 * 根据权限过滤菜单
 */
export function filterMenusByPerms(menus: MenuItem[], perms: string[]): MenuItem[] {
  return menus.filter((menu) => {
    // 没有配置权限或权限匹配
    const hasPerm = !menu.perms || perms.includes(menu.perms)

    if (hasPerm && menu.children?.length) {
      menu.children = filterMenusByPerms(menu.children, perms)
    }

    return hasPerm
  })
}

/**
 * 获取需要缓存的组件名列表
 */
export function getCachedComponentNames(menus: MenuItem[]): string[] {
  const names: string[] = []

  function traverse(list: MenuItem[]) {
    for (const item of list) {
      if (item.is_cache && item.component) {
        names.push(item.component)
      }
      if (item.children?.length) {
        traverse(item.children)
      }
    }
  }

  traverse(menus)
  return names
}
