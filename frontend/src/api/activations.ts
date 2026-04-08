import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

// ========== 激活计划管理（Admin） ==========

export function getActivationPlans(params: {
  page?: number
  size?: number
  target_role?: string
  status?: string
}) {
  return request.get<any, PaginatedResponse>('/activations/admin/plans', { params })
}

export function getActivationPlan(id: number) {
  return request.get<any, ApiResponse>(`/activations/admin/plans/${id}`)
}

export function createActivationPlan(data: {
  name: string
  description?: string
  target_role: string
  target_grade_group?: string
  validity_days: number
  permissions?: string
  question_bank_ids?: string
  resource_ids?: string
  price: number
  is_online_sale?: boolean
}) {
  return request.post<any, ApiResponse>('/activations/admin/plans', data)
}

export function updateActivationPlan(id: number, data: {
  name?: string
  description?: string
  target_role?: string
  target_grade_group?: string
  validity_days?: number
  permissions?: string
  question_bank_ids?: string
  resource_ids?: string
  price?: number
  is_online_sale?: boolean
  status?: string
}) {
  return request.put<any, ApiResponse>(`/activations/admin/plans/${id}`, data)
}

export function deleteActivationPlan(id: number) {
  return request.delete<any, ApiResponse>(`/activations/admin/plans/${id}`)
}

export function togglePlanStatus(id: number, isActive: boolean) {
  return request.patch<any, ApiResponse>(`/activations/admin/plans/${id}/status`, {
    is_active: isActive
  })
}

// ========== 激活码管理（Admin） ==========

export function batchGenerateCodes(data: {
  plan_id: number
  count: number
  source?: 'online' | 'offline'
  batch_no?: string
}) {
  return request.post<any, ApiResponse>('/activations/admin/codes/batch', data)
}

export function getActivationCodes(params: {
  page?: number
  size?: number
  plan_id?: number
  status?: 'unused' | 'used' | 'expired'
  source?: string
  batch_no?: string
  search?: string
}) {
  return request.get<any, PaginatedResponse>('/activations/admin/codes', { params })
}

export function revokeActivationCode(codeId: number) {
  return request.delete<any, ApiResponse>(`/activations/admin/codes/${codeId}`)
}

// ========== 用户使用激活码 ==========

export function useActivationCode(code: string) {
  return request.post<any, ApiResponse>('/activations/use', { code })
}

export function getMyActivations(params?: {
  page?: number
  size?: number
}) {
  return request.get<any, PaginatedResponse>('/activations/my-activations', { params })
}

export function getMyPermissions() {
  return request.get<any, ApiResponse>('/activations/my-permissions')
}

// ========== 公共接口 ==========

export function getSalePlans(targetRole?: string) {
  return request.get<any, ApiResponse>('/activations/plans', {
    params: { target_role: targetRole }
  })
}
