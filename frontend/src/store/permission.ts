/**
 * 权限管理Store - 动态菜单和权限控制
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { getMenus } from '@/api/system'

// 菜单类型定义
export interface Menu {
  id: number
  menu_name: string
  path: string
  component?: string
  menu_type: 'M' | 'C' | 'F' // M-目录 C-菜单 F-按钮
  icon?: string
  parent_id: number
  children?: Menu[]
  perms?: string
  visible: number
  status: number
}

// 权限状态
export const usePermissionStore = defineStore('permission', () => {
  // State
  const menus = ref<Menu[]>([])
  const permissions = ref<string[]>([])
  const routes = ref<RouteRecordRaw[]>([])
  const isLoaded = ref(false)

  // Getters
  const sidebarMenus = computed(() => {
    // 过滤出可见的目录和菜单
    return filterVisibleMenus(menus.value)
  })

  const flatMenus = computed(() => {
    // 扁平化菜单（用于权限检查）
    return flattenMenus(menus.value)
  })

  // Actions
  
  /**
   * 加载用户菜单和权限
   */
  async function loadMenus() {
    try {
      const res = await getMenus()
      menus.value = res.data || []
      
      // 提取所有权限标识
      permissions.value = extractPermissions(menus.value)
      
      // 生成动态路由
      routes.value = generateRoutes(menus.value)
      
      isLoaded.value = true
      return true
    } catch (error) {
      console.error('加载菜单失败:', error)
      return false
    }
  }

  /**
   * 检查是否有权限
   */
  function hasPermission(perm: string): boolean {
    // 超级管理员拥有所有权限
    // if (isAdmin()) return true
    
    return permissions.value.includes(perm)
  }

  /**
   * 检查是否有任意一个权限
   */
  function hasAnyPermission(perms: string[]): boolean {
    // if (isAdmin()) return true
    return perms.some(p => permissions.value.includes(p))
  }

  /**
   * 清空权限数据
   */
  function clearPermissions() {
    menus.value = []
    permissions.value = []
    routes.value = []
    isLoaded.value = false
  }

  return {
    menus,
    permissions,
    routes,
    isLoaded,
    sidebarMenus,
    flatMenus,
    loadMenus,
    hasPermission,
    hasAnyPermission,
    clearPermissions,
  }
})

/**
 * 过滤可见菜单
 */
function filterVisibleMenus(menus: Menu[]): Menu[] {
  return menus
    .filter(menu => menu.visible === 1 && menu.status === 1)
    .map(menu => {
      if (menu.children && menu.children.length > 0) {
        return {
          ...menu,
          children: filterVisibleMenus(menu.children),
        }
      }
      return menu
    })
    .filter(menu => {
      // 目录如果没有子菜单则不显示
      if (menu.menu_type === 'M') {
        return !menu.children || menu.children.length === 0 || menu.children.some(c => c.visible === 1)
      }
      return true
    })
}

/**
 * 扁平化菜单
 */
function flattenMenus(menus: Menu[], result: Menu[] = []): Menu[] {
  menus.forEach(menu => {
    result.push(menu)
    if (menu.children) {
      flattenMenus(menu.children, result)
    }
  })
  return result
}

/**
 * 提取所有权限标识
 */
function extractPermissions(menus: Menu[]): string[] {
  const perms: string[] = []
  
  function traverse(menuList: Menu[]) {
    menuList.forEach(menu => {
      if (menu.perms) {
        perms.push(menu.perms)
      }
      if (menu.children) {
        traverse(menu.children)
      }
    })
  }
  
  traverse(menus)
  return perms
}

/**
 * 根据菜单生成路由
 */
function generateRoutes(menus: Menu[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  
  function traverse(menuList: Menu[], parentPath = '') {
    menuList.forEach(menu => {
      if (menu.menu_type === 'C' && menu.component) {
        // 菜单类型，生成路由
        const route: RouteRecordRaw = {
          path: menu.path,
          name: `Dynamic_${menu.id}`,
          component: () => import(`@/views/${menu.component}.vue`),
          meta: {
            title: menu.menu_name,
            perms: menu.perms ? [menu.perms] : [],
          },
        }
        routes.push(route)
      }
      
      if (menu.children) {
        traverse(menu.children, menu.path)
      }
    })
  }
  
  traverse(menus)
  return routes
}
