/**
 * Axios 请求封装
 * - 自动附加 JWT Token
 * - Token 自动续期机制
 * - 心跳检测保持会话
 * - 统一错误处理
 * - 被踢出会话自动跳转登录
 */
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { message } from 'ant-design-vue'
import router from '@/router'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Token 管理配置
const TOKEN_CONFIG = {
  // Token 过期前 5 分钟开始续期
  RENEW_THRESHOLD_MINUTES: 5,
  // Token 本地存储键名
  TOKEN_KEY: 'token',
  USER_KEY: 'user',
  // 续期冷却时间（避免频繁续期）
  RENEW_COOLDOWN_MS: 60000, // 1分钟
}

// 续期状态管理
let lastRenewTime: number = 0
let isRenewing: boolean = false

/**
 * 解析 JWT Token 获取过期时间
 */
function getTokenExpiry(token: string): number | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonPayload)
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

/**
 * 检查是否需要续期 Token
 */
function shouldRenewToken(token: string): boolean {
  const expiry = getTokenExpiry(token)
  if (!expiry) return false

  const now = Date.now()
  const threshold = TOKEN_CONFIG.RENEW_THRESHOLD_MINUTES * 60 * 1000

  // 如果距离上次续期不足冷却时间，跳过
  if (now - lastRenewTime < TOKEN_CONFIG.RENEW_COOLDOWN_MS) {
    return false
  }

  // 如果即将过期（5分钟内），需要续期
  return expiry - now < threshold
}

/**
 * 续期 Token
 */
async function renewToken(): Promise<boolean> {
  if (isRenewing) return false

  isRenewing = true
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/accounts/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(TOKEN_CONFIG.TOKEN_KEY)}`,
        },
      }
    )

    if (response.data?.data?.token) {
      const newToken = response.data.data.token
      localStorage.setItem(TOKEN_CONFIG.TOKEN_KEY, newToken)
      lastRenewTime = Date.now()
      console.log('[Request] Token 续期成功')
      return true
    }
  } catch (error) {
    console.error('[Request] Token 续期失败:', error)
  } finally {
    isRenewing = false
  }
  return false
}

// 请求拦截器：自动附加 Token + 自动续期
service.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem(TOKEN_CONFIG.TOKEN_KEY)
    if (token) {
      // 检查是否需要续期（排除续期请求本身）
      if (config.url !== '/accounts/refresh' && shouldRenewToken(token)) {
        await renewToken()
        // 使用新 Token
        const newToken = localStorage.getItem(TOKEN_CONFIG.TOKEN_KEY)
        config.headers.Authorization = `Bearer ${newToken}`
      } else {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 标记是否正在跳转登录页（防止多个请求同时触发重复跳转）
let isRedirectingToLogin = false

// 响应拦截器：统一错误处理
service.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    const status = error.response?.status
    const detail = error.response?.data?.detail || error.message

    if (status === 401) {
      // Token 过期或被踢出 - 静默处理，直接跳转
      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true
        localStorage.removeItem(TOKEN_CONFIG.TOKEN_KEY)
        localStorage.removeItem(TOKEN_CONFIG.USER_KEY)
        // 使用 replace 避免返回时能回到原页面
        router.replace('/login')
      }
      // 不显示错误消息，不 reject，静默处理
      return new Promise(() => {})
    } else if (status === 403) {
      // 权限不足才显示错误
      message.error(detail || '没有权限访问')
    } else if (status === 409) {
      message.warning(detail || '数据冲突，请刷新后重试')
    } else if (status === 429) {
      message.warning(detail || '操作过于频繁，请稍后重试')
    } else if (status >= 500) {
      message.error('服务器错误，请稍后重试')
    } else {
      message.error(detail || '请求失败')
    }

    return Promise.reject(error)
  }
)

/**
 * 心跳检测服务
 * 定期发送心跳保持会话活跃
 */
export class HeartbeatService {
  private static instance: HeartbeatService
  private intervalId: number | null = null
  private readonly HEARTBEAT_INTERVAL = 5 * 60 * 1000 // 5分钟

  private constructor() {}

  static getInstance(): HeartbeatService {
    if (!HeartbeatService.instance) {
      HeartbeatService.instance = new HeartbeatService()
    }
    return HeartbeatService.instance
  }

  /**
   * 开始心跳检测
   */
  start(): void {
    if (this.intervalId) return

    console.log('[Heartbeat] 启动心跳检测，间隔:', this.HEARTBEAT_INTERVAL / 60000, '分钟')

    this.intervalId = window.setInterval(() => {
      this.sendHeartbeat()
    }, this.HEARTBEAT_INTERVAL)
  }

  /**
   * 停止心跳检测
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('[Heartbeat] 心跳检测已停止')
    }
  }

  /**
   * 发送心跳请求
   */
  private async sendHeartbeat(): Promise<void> {
    const token = localStorage.getItem(TOKEN_CONFIG.TOKEN_KEY)
    if (!token) {
      this.stop()
      return
    }

    try {
      await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/accounts/heartbeat`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      )
      console.log('[Heartbeat] 心跳发送成功')
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token 已过期，停止心跳并跳转登录
        this.stop()
        localStorage.removeItem(TOKEN_CONFIG.TOKEN_KEY)
        localStorage.removeItem(TOKEN_CONFIG.USER_KEY)
        message.error('会话已过期，请重新登录')
        router.push('/login')
      } else {
        console.warn('[Heartbeat] 心跳发送失败:', error.message)
      }
    }
  }
}

// 导出心跳服务实例
export const heartbeatService = HeartbeatService.getInstance()

export default service
