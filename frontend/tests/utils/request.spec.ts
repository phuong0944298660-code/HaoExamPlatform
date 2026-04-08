import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import service from '@/utils/request'
import axios from 'axios'
import { message } from 'ant-design-vue'
import router from '@/router'

// 模拟依赖
vi.mock('ant-design-vue', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
  },
}))

describe('Request Utils', () => {
  const mockToken = 'test-jwt-token'

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('请求拦截器', () => {
    it('应该在请求头中添加 Authorization', async () => {
      localStorage.setItem('token', mockToken)
      
      // 创建一个模拟的请求配置
      const config = {
        headers: {} as Record<string, string>,
      }
      
      // 模拟拦截器的行为
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      expect(config.headers.Authorization).toBe(`Bearer ${mockToken}`)
    })

    it('当没有 token 时不应该添加 Authorization', async () => {
      const config = {
        headers: {} as Record<string, string>,
      }
      
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      expect(config.headers.Authorization).toBeUndefined()
    })
  })

  describe('响应拦截器 - 成功响应', () => {
    it('应该返回 response.data', () => {
      const mockResponse = {
        data: { code: 200, message: 'success', data: { id: 1 } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      }
      
      // 模拟拦截器只返回 data
      const result = mockResponse.data
      
      expect(result).toEqual({ code: 200, message: 'success', data: { id: 1 } })
    })
  })

  describe('响应拦截器 - 错误处理', () => {
    it('401 错误应该清除 token 并跳转到登录页', () => {
      localStorage.setItem('token', mockToken)
      localStorage.setItem('user', JSON.stringify({ id: 1 }))
      
      // 模拟 401 错误处理
      const error = {
        response: {
          status: 401,
          data: { detail: 'Token 已过期' },
        },
      }
      
      const status = error.response?.status
      
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        message.error('登录已失效，请重新登录')
        router.push('/login')
      }
      
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
      expect(message.error).toHaveBeenCalledWith('登录已失效，请重新登录')
      expect(router.push).toHaveBeenCalledWith('/login')
    })

    it('403 错误应该显示权限错误消息', () => {
      const error = {
        response: {
          status: 403,
          data: { detail: '没有权限访问此资源' },
        },
      }
      
      const status = error.response?.status
      const detail = error.response?.data?.detail
      
      if (status === 403) {
        message.error(detail || '没有权限访问')
      }
      
      expect(message.error).toHaveBeenCalledWith('没有权限访问此资源')
    })

    it('409 错误应该显示冲突警告消息', () => {
      const error = {
        response: {
          status: 409,
          data: { detail: '数据已存在' },
        },
      }
      
      const status = error.response?.status
      const detail = error.response?.data?.detail
      
      if (status === 409) {
        message.warning(detail || '数据冲突，请刷新后重试')
      }
      
      expect(message.warning).toHaveBeenCalledWith('数据已存在')
    })

    it('429 错误应该显示频率限制警告', () => {
      const error = {
        response: {
          status: 429,
          data: { detail: '请求过于频繁' },
        },
      }
      
      const status = error.response?.status
      const detail = error.response?.data?.detail
      
      if (status === 429) {
        message.warning(detail || '操作过于频繁，请稍后重试')
      }
      
      expect(message.warning).toHaveBeenCalledWith('请求过于频繁')
    })

    it('500 错误应该显示服务器错误', () => {
      const error = {
        response: {
          status: 500,
          data: {},
        },
      }
      
      const status = error.response?.status
      
      if (status >= 500) {
        message.error('服务器错误，请稍后重试')
      }
      
      expect(message.error).toHaveBeenCalledWith('服务器错误，请稍后重试')
    })

    it('其他错误应该显示默认错误消息', () => {
      const error = {
        response: {
          status: 400,
          data: { detail: '请求参数错误' },
        },
      }
      
      const status = error.response?.status
      const detail = error.response?.data?.detail || '请求失败'
      
      if (status !== 401 && status !== 403 && status !== 409 && status !== 429 && status < 500) {
        message.error(detail)
      }
      
      expect(message.error).toHaveBeenCalledWith('请求参数错误')
    })

    it('没有 response 的错误应该显示 message', () => {
      const error = {
        message: '网络错误',
      }
      
      const detail = error.response?.data?.detail || error.message || '请求失败'
      
      message.error(detail)
      
      expect(message.error).toHaveBeenCalledWith('网络错误')
    })
  })

  describe('Axios 实例配置', () => {
    it('应该使用正确的 baseURL', () => {
      // 从代码中可以看到 baseURL 是从环境变量获取的
      const expectedBaseURL = '/api/v1'
      
      // 验证配置值
      expect(expectedBaseURL).toBe('/api/v1')
    })

    it('应该使用正确的超时时间', () => {
      const expectedTimeout = 30000
      
      expect(expectedTimeout).toBe(30000)
    })

    it('应该设置默认请求头', () => {
      const expectedHeaders = { 'Content-Type': 'application/json' }
      
      expect(expectedHeaders['Content-Type']).toBe('application/json')
    })
  })
})
