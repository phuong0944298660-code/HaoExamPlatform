import request from '@/utils/request'
import type { ApiResponse, LoginResult } from '@/types/api'

/** 登录 */
export function login(data: { account: string; password: string }) {
  return request.post<any, ApiResponse<LoginResult>>('/accounts/login', data)
}

/** 登出 */
export function logout() {
  return request.post<any, ApiResponse>('/accounts/logout')
}

/** 获取当前用户信息 */
export function getCurrentUser() {
  return request.get<any, ApiResponse>('/accounts/me')
}

/** 激活账号 */
export function activateAccount(data: {
  activation_code: string
  identity_no?: string
  username?: string
  password?: string
}) {
  return request.post<any, ApiResponse>('/accounts/activate', data)
}
