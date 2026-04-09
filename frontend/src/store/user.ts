import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types/api'
import { login as loginApi, logout as logoutApi, getCurrentUser } from '@/api/auth'
import router, { resetDynamicRoutes } from '@/router'
import { heartbeatService } from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<UserInfo | null>(
    JSON.parse(localStorage.getItem('user') || 'null')
  )

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || '')
  const isStudent = computed(() => userRole.value.toLowerCase() === 'student')
  const isTeacher = computed(() => userRole.value.toLowerCase() === 'teacher')
  const isAdmin = computed(() => userRole.value.toLowerCase() === 'admin')

  /** 登录 */
  async function login(account: string, password: string) {
    const res = await loginApi({ account, password })
    const data = res.data
    
    // 保存登录信息
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))

    console.log('[UserStore] 登录成功，角色:', data.user.role)

    // 启动心跳检测
    heartbeatService.start()

    // 根据角色跳转 - 使用 replace 避免历史记录堆积
    const role = data.user.role?.toLowerCase()
    if (role === 'admin') {
      await router.replace('/')
    } else if (role === 'teacher') {
      await router.replace('/teacher')
    } else if (role === 'student') {
      await router.replace('/student')
    } else {
      console.error('[UserStore] 未知角色:', data.user.role)
      throw new Error('账号角色异常，请联系管理员')
    }
  }

  /** 登出 */
  async function logout() {
    try {
      await logoutApi()
    } catch {
      // 即使API失败也清除本地
    }
    // 停止心跳检测
    heartbeatService.stop()

    // 重置动态路由
    resetDynamicRoutes()

    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  /** 刷新用户信息 */
  async function refreshUser() {
    try {
      const res = await getCurrentUser()
      user.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
    } catch {
      await logout()
    }
  }

  /** 初始化心跳（用于页面刷新后恢复） */
  function initHeartbeat() {
    if (token.value && user.value) {
      console.log('[UserStore] 检测到已有登录状态，启动心跳检测')
      heartbeatService.start()
    }
  }

  return { 
    token, 
    user, 
    isLoggedIn, 
    userRole, 
    isStudent, 
    isTeacher, 
    isAdmin, 
    login, 
    logout, 
    refreshUser,
    initHeartbeat
  }
})
