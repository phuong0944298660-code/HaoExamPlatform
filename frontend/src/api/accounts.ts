import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse, LoginResult } from '@/types/api'

/** Token 续期 */
export function refreshToken() {
  return request.post<any, ApiResponse<LoginResult>>('/accounts/refresh', {})
}

/** 心跳检测 */
export function sendHeartbeat() {
  return request.get<any, ApiResponse>('/accounts/heartbeat')
}

/** 账号列表 (后端接口: AccountController.list @GetMapping) */
export function getAccounts(params: {
  page?: number
  size?: number
  gradeGroup?: string  // 后端是驼峰 gradeGroup
  accountType?: string  // 后端是驼峰 accountType
  is_activated?: boolean // 查询字段待定，后端 list 中有 gradeGroup, accountType
  search?: string
}) {
  // 后端 list 接口不支持 is_activated，仅支持 gradeGroup, accountType
  return request.get<any, PaginatedResponse>('/accounts', { params })
}

/** 批量生成练习账号 (后端接口: AccountController.batchGeneratePractice @PostMapping("/batch/practice")) */
export function batchGeneratePractice(data: {
  count: number
  grade_group: string // 后端 BatchGeneratePracticeRequest 用的是下划线
  initial_password: string
}) {
  return request.post<any, ApiResponse>('/accounts/batch/practice', data)
}

/** 批量生成考试账号 (后端尚未实现，需占位或待定) */
export function batchGenerateExam(data: {
  grade_group: string
  initial_password: string
  students: { identity_no: string; name: string; school: string }[]
}) {
  // 暂时指向普通生成，或待后端补全
  return request.post<any, ApiResponse>('/accounts', { 
    account_type: 'EXAM',
    ...data 
  })
}

/** 生成激活码 (后端接口: ActivationController.batchGenerateCodes @PostMapping("/admin/codes/batch")) */
export function generateActivationCodes(data: {
  planId: number  // 后端要求 planId
  count: number
  batchNo?: string
}) {
  return request.post<any, ApiResponse>('/activations/admin/codes/batch', data)
}

/** 激活码列表 (后端接口: ActivationController.listCodes @GetMapping("/admin/codes")) */
export function getActivationCodes(params: {
  page?: number
  size?: number
  planId?: number
  status?: string // UNUSED, USED, EXPIRED
}) {
  return request.get<any, PaginatedResponse>('/activations/admin/codes', { params })
}

/** 获取激活计划列表 (后端接口: ActivationController.listPlans @GetMapping("/admin/plans")) */
export function getActivationPlans(params?: { page?: number; size?: number }) {
  return request.get<any, PaginatedResponse>('/activations/admin/plans', { params })
}

/** 启用/禁用账号 (后端接口: AccountController.toggleAccountStatus - 实际在 Controller 中未发现此接口) */
/** 这里的 toggleAccountStatus 指向 DataInitializer 逻辑或待修复 */
export function toggleAccountStatus(accountId: number, isActive: boolean) {
  return request.post<any, ApiResponse>(`/accounts/${accountId}/toggle-status`, null, {
    params: { is_active: isActive },
  })
}

export function updateAccount(id: number, data: any) {
  return request.put<any, ApiResponse>(`/accounts/${id}`, data)
}

export function deleteAccount(id: number) {
  return request.delete<any, ApiResponse>(`/accounts/${id}`)
}

export function createAccount(data: any) {
  return request.post<any, ApiResponse>('/accounts', data)
}

export function getSchools() {
  return request.get<any, ApiResponse<string[]>>('/accounts/schools')
}
