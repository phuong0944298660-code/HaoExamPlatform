/**
 * 权限指令 - 按钮级权限控制
 * 
 * 使用方式：
 * <a-button v-permission="'system:user:add'">新增</a-button>
 * <a-button v-permission="['system:user:edit', 'system:user:admin']">编辑</a-button>
 */

import type { Directive, DirectiveBinding } from 'vue'
import { usePermissionStore } from '@/store/permission'

export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const permissionStore = usePermissionStore()
    
    if (value) {
      let hasPermission = false
      
      if (Array.isArray(value)) {
        // 数组形式：有任意一个权限即可
        hasPermission = permissionStore.hasAnyPermission(value)
      } else {
        // 字符串形式：必须有该权限
        hasPermission = permissionStore.hasPermission(value)
      }
      
      if (!hasPermission) {
        // 没有权限，移除元素
        el.parentNode?.removeChild(el)
      }
    }
  },
}

// 注册所有指令
export function setupDirectives(app: any) {
  app.directive('permission', permission)
}
