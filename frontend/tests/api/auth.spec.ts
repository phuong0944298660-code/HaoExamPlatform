import { describe, it, expect, vi } from 'vitest'
import { login, logout, getCurrentUser } from '@/api/auth'
import service from '@/utils/request'

// 模拟 service
vi.mock('@/utils/request', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('Auth API', () => {
  const mockUser = {
    id: 1,
    account_type: 'student',
    grade_group: 'primary',
    role: 'student',
    identity_no: '123456',
    username: 'testuser',
    name: '测试用户',
    school: '测试学校',
    region: '测试地区',
    is_activated: true,
    is_active: true,
  }

  describe('login', () => {
    it('应该调用正确的接口并返回数据', async () => {
      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          token: 'mock-token',
          user: mockUser,
        },
      }

      vi.mocked(service.post).mockResolvedValue(mockResponse)

      const result = await login({ account: 'test', password: 'pass123' })

      expect(service.post).toHaveBeenCalledWith('/auth/login', {
        account: 'test',
        password: 'pass123',
      })
      expect(result).toEqual(mockResponse)
    })

    it('应该处理登录失败', async () => {
      const mockError = new Error('登录失败')
      vi.mocked(service.post).mockRejectedValue(mockError)

      await expect(login({ account: 'test', password: 'wrong' })).rejects.toThrow('登录失败')
    })
  })

  describe('logout', () => {
    it('应该调用登出接口', async () => {
      const mockResponse = { code: 200, message: 'success', data: null }
      vi.mocked(service.post).mockResolvedValue(mockResponse)

      const result = await logout()

      expect(service.post).toHaveBeenCalledWith('/auth/logout')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getCurrentUser', () => {
    it('应该获取当前用户信息', async () => {
      const mockResponse = {
        code: 200,
        message: 'success',
        data: mockUser,
      }
      vi.mocked(service.get).mockResolvedValue(mockResponse)

      const result = await getCurrentUser()

      expect(service.get).toHaveBeenCalledWith('/auth/me')
      expect(result).toEqual(mockResponse)
    })
  })
})
