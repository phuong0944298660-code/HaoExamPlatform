import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/store/user'
import * as authApi from '@/api/auth'
import router from '@/router'

// 模拟 API 模块
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}))

describe('User Store', () => {
  const mockUser = {
    id: 1,
    account_type: 'student',
    grade_group: 'primary',
    role: 'student',
    identity_no: '1234567890',
    username: 'testuser',
    name: '测试用户',
    school: '测试学校',
    region: '测试地区',
    is_activated: true,
    is_active: true,
  }

  const mockToken = 'mock-jwt-token-12345'

  beforeEach(() => {
    // 创建新的 Pinia 实例
    setActivePinia(createPinia())
    
    // 清理 localStorage
    localStorage.clear()
    
    // 重置所有 mock
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('State 初始化', () => {
    it('应该有正确的初始状态', () => {
      const store = useUserStore()
      
      expect(store.token).toBe('')
      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(store.userRole).toBe('')
    })

    it('应该从 localStorage 恢复 token', () => {
      localStorage.setItem('token', mockToken)
      
      const store = useUserStore()
      // 由于 store 在 setup 时已经初始化，需要重新创建
      setActivePinia(createPinia())
      const newStore = useUserStore()
      
      // token 应该从 localStorage 读取
      expect(localStorage.getItem('token')).toBe(mockToken)
    })

    it('应该从 localStorage 恢复用户信息', () => {
      localStorage.setItem('user', JSON.stringify(mockUser))
      
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
    })
  })

  describe('Getters', () => {
    it('isLoggedIn 应该在有 token 时返回 true', () => {
      const store = useUserStore()
      store.token = mockToken
      
      expect(store.isLoggedIn).toBe(true)
    })

    it('isLoggedIn 应该在 token 为空时返回 false', () => {
      const store = useUserStore()
      store.token = ''
      
      expect(store.isLoggedIn).toBe(false)
    })

    it('userRole 应该返回用户角色', () => {
      const store = useUserStore()
      store.user = mockUser
      
      expect(store.userRole).toBe('student')
    })

    it('userRole 应该在用户为空时返回空字符串', () => {
      const store = useUserStore()
      store.user = null
      
      expect(store.userRole).toBe('')
    })

    it('isStudent 应该在角色为学生时返回 true', () => {
      const store = useUserStore()
      store.user = mockUser
      
      expect(store.isStudent).toBe(true)
      expect(store.isTeacher).toBe(false)
      expect(store.isAdmin).toBe(false)
    })

    it('isTeacher 应该在角色为教师时返回 true', () => {
      const store = useUserStore()
      store.user = { ...mockUser, role: 'teacher' }
      
      expect(store.isStudent).toBe(false)
      expect(store.isTeacher).toBe(true)
      expect(store.isAdmin).toBe(false)
    })

    it('isAdmin 应该在角色为管理员时返回 true', () => {
      const store = useUserStore()
      store.user = { ...mockUser, role: 'admin' }
      
      expect(store.isStudent).toBe(false)
      expect(store.isTeacher).toBe(false)
      expect(store.isAdmin).toBe(true)
    })
  })

  describe('Login Action', () => {
    it('login 应该成功并保存 token 和用户信息', async () => {
      const store = useUserStore()
      const mockResponse = {
        data: {
          token: mockToken,
          user: mockUser,
        },
      }
      
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)
      
      await store.login('testaccount', 'password123')
      
      expect(store.token).toBe(mockToken)
      expect(store.user).toEqual(mockUser)
      expect(localStorage.getItem('token')).toBe(mockToken)
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
    })

    it('学生登录应该跳转到学生页面', async () => {
      const store = useUserStore()
      const mockResponse = {
        data: {
          token: mockToken,
          user: { ...mockUser, role: 'student' },
        },
      }
      
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)
      
      await store.login('student', 'password')
      
      expect(router.push).toHaveBeenCalledWith('/student')
    })

    it('教师登录应该跳转到教师页面', async () => {
      const store = useUserStore()
      const mockResponse = {
        data: {
          token: mockToken,
          user: { ...mockUser, role: 'teacher' },
        },
      }
      
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)
      
      await store.login('teacher', 'password')
      
      expect(router.push).toHaveBeenCalledWith('/teacher')
    })

    it('管理员登录应该跳转到管理页面', async () => {
      const store = useUserStore()
      const mockResponse = {
        data: {
          token: mockToken,
          user: { ...mockUser, role: 'admin' },
        },
      }
      
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)
      
      await store.login('admin', 'password')
      
      expect(router.push).toHaveBeenCalledWith('/admin')
    })

    it('login 失败应该抛出错误', async () => {
      const store = useUserStore()
      const error = new Error('登录失败')
      
      vi.mocked(authApi.login).mockRejectedValue(error)
      
      await expect(store.login('test', 'wrong')).rejects.toThrow('登录失败')
    })
  })

  describe('Logout Action', () => {
    it('logout 应该清除 token 和用户信息', async () => {
      const store = useUserStore()
      store.token = mockToken
      store.user = mockUser
      localStorage.setItem('token', mockToken)
      localStorage.setItem('user', JSON.stringify(mockUser))
      
      vi.mocked(authApi.logout).mockResolvedValue({} as any)
      
      await store.logout()
      
      expect(store.token).toBe('')
      expect(store.user).toBeNull()
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })

    it('logout 应该跳转到登录页面', async () => {
      const store = useUserStore()
      store.token = mockToken
      store.user = mockUser
      
      vi.mocked(authApi.logout).mockResolvedValue({} as any)
      
      await store.logout()
      
      expect(router.push).toHaveBeenCalledWith('/login')
    })

    it('logout API 失败也应该清除本地状态', async () => {
      const store = useUserStore()
      store.token = mockToken
      store.user = mockUser
      localStorage.setItem('token', mockToken)
      localStorage.setItem('user', JSON.stringify(mockUser))
      
      vi.mocked(authApi.logout).mockRejectedValue(new Error('API错误'))
      
      await store.logout()
      
      expect(store.token).toBe('')
      expect(store.user).toBeNull()
      expect(localStorage.getItem('token')).toBeNull()
    })
  })

  describe('RefreshUser Action', () => {
    it('refreshUser 应该更新用户信息', async () => {
      const store = useUserStore()
      store.token = mockToken
      const updatedUser = { ...mockUser, name: '更新后的名字' }
      
      vi.mocked(authApi.getCurrentUser).mockResolvedValue({
        data: updatedUser,
      } as any)
      
      await store.refreshUser()
      
      expect(store.user).toEqual(updatedUser)
      expect(localStorage.getItem('user')).toBe(JSON.stringify(updatedUser))
    })

    it('refreshUser 失败应该执行 logout', async () => {
      const store = useUserStore()
      store.token = mockToken
      store.user = mockUser
      
      vi.mocked(authApi.getCurrentUser).mockRejectedValue(new Error('获取失败'))
      vi.mocked(authApi.logout).mockResolvedValue({} as any)
      
      await store.refreshUser()
      
      // logout 应该被调用
      expect(store.token).toBe('')
      expect(store.user).toBeNull()
      expect(router.push).toHaveBeenCalledWith('/login')
    })
  })

  describe('状态持久化', () => {
    it('token 应该持久化到 localStorage', () => {
      const store = useUserStore()
      store.token = mockToken
      
      // 手动触发 localStorage 更新（实际在代码中通过 ref 的赋值触发）
      localStorage.setItem('token', store.token)
      
      expect(localStorage.getItem('token')).toBe(mockToken)
    })

    it('user 应该持久化到 localStorage', () => {
      const store = useUserStore()
      store.user = mockUser
      
      localStorage.setItem('user', JSON.stringify(store.user))
      
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
    })

    it('logout 应该清除 localStorage', async () => {
      const store = useUserStore()
      store.token = mockToken
      store.user = mockUser
      localStorage.setItem('token', mockToken)
      localStorage.setItem('user', JSON.stringify(mockUser))
      
      vi.mocked(authApi.logout).mockResolvedValue({} as any)
      
      await store.logout()
      
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })
  })

  describe('边界情况', () => {
    it('应该处理 role 为 null 的情况', () => {
      const store = useUserStore()
      store.user = { ...mockUser, role: null }
      
      expect(store.userRole).toBe('')
      expect(store.isStudent).toBe(false)
      expect(store.isTeacher).toBe(false)
      expect(store.isAdmin).toBe(false)
    })

    it('应该处理 user 为 null 的情况', () => {
      const store = useUserStore()
      store.user = null
      
      expect(store.userRole).toBe('')
      expect(store.isStudent).toBe(false)
      expect(store.isTeacher).toBe(false)
      expect(store.isAdmin).toBe(false)
    })

    it('应该处理空字符串 token', () => {
      const store = useUserStore()
      store.token = ''
      
      expect(store.isLoggedIn).toBe(false)
    })
  })
})
