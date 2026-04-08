import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

// ========== 用户管理 ==========
export function getUsers(params: any) {
  return request.get('/system/users', { params })
}

export function getUser(id: number) {
  return request.get(`/system/users/${id}`)
}

export function createUser(data: any) {
  return request.post('/system/users', data)
}

export function updateUser(id: number, data: any) {
  return request.put(`/system/users/${id}`, data)
}

export function deleteUser(id: number) {
  return request.delete(`/system/users/${id}`)
}

// ========== 角色管理 ==========
export function getRoles(params?: any) {
  return request.get('/system/roles', { params })
}

export function createRole(data: any) {
  return request.post('/system/roles', data)
}

export function updateRole(id: number, data: any) {
  return request.put(`/system/roles/${id}`, data)
}

export function deleteRole(id: number) {
  return request.delete(`/system/roles/${id}`)
}

export function assignRoleMenus(roleId: number, menuIds: number[]) {
  return request.post(`/system/roles/${roleId}/menus`, menuIds)
}

export function getRoleMenus(roleId: number) {
  return request.get(`/system/roles/${roleId}/menus`)
}

// ========== 菜单管理 ==========
export function getMenus() {
  return request.get('/system/menus')
}

export function createMenu(data: any) {
  return request.post('/system/menus', data)
}

export function updateMenu(id: number, data: any) {
  return request.put(`/system/menus/${id}`, data)
}

export function deleteMenu(id: number) {
  return request.delete(`/system/menus/${id}`)
}

// ========== 部门管理 ==========
export function getDepts() {
  return request.get('/system/depts')
}

export function createDept(data: any) {
  return request.post('/system/depts', data)
}

export function updateDept(id: number, data: any) {
  return request.put(`/system/depts/${id}`, data)
}

export function deleteDept(id: number) {
  return request.delete(`/system/depts/${id}`)
}

// ========== 通知公告 ==========
export function getNotices(params: {
  page?: number
  size?: number
  notice_type?: string
  status?: string
  search?: string
}) {
  return request.get<any, PaginatedResponse>('/system/notices', { params })
}

export function getNotice(id: number) {
  return request.get<any, ApiResponse>(`/system/notices/${id}`)
}

export function createNotice(data: any) {
  return request.post<any, ApiResponse>('/system/notices', data)
}

export function updateNotice(id: number, data: any) {
  return request.put<any, ApiResponse>(`/system/notices/${id}`, data)
}

export function deleteNotice(id: number) {
  return request.delete<any, ApiResponse>(`/system/notices/${id}`)
}

// ========== 系统配置 ==========
export function getConfigs(params: {
  page?: number
  size?: number
  config_type?: string
  search?: string
}) {
  return request.get<any, PaginatedResponse>('/system/configs', { params })
}

export function getConfig(id: number) {
  return request.get<any, ApiResponse>(`/system/configs/${id}`)
}

export function createConfig(data: any) {
  return request.post<any, ApiResponse>('/system/configs', data)
}

export function updateConfig(id: number, data: any) {
  return request.put<any, ApiResponse>(`/system/configs/${id}`, data)
}

export function deleteConfig(id: number) {
  return request.delete<any, ApiResponse>(`/system/configs/${id}`)
}

// ========== 字典管理 ==========
// 字典类型
export function getDictTypes(params: {
  page?: number
  size?: number
  status?: number
  search?: string
}) {
  return request.get<any, PaginatedResponse>('/system/dict-types', { params })
}

export function getDictType(id: number) {
  return request.get<any, ApiResponse>(`/system/dict-types/${id}`)
}

export function createDictType(data: any) {
  return request.post<any, ApiResponse>('/system/dict-types', data)
}

export function updateDictType(id: number, data: any) {
  return request.put<any, ApiResponse>(`/system/dict-types/${id}`, data)
}

export function deleteDictType(id: number) {
  return request.delete<any, ApiResponse>(`/system/dict-types/${id}`)
}

// 字典数据
export function getDictData(dictTypeId: number, params?: { page?: number; size?: number; status?: number }) {
  return request.get<any, PaginatedResponse>(`/system/dict-types/${dictTypeId}/data`, { params })
}

export function getDictDataItem(id: number) {
  return request.get<any, ApiResponse>(`/system/dict-data/${id}`)
}

export function createDictData(data: any) {
  return request.post<any, ApiResponse>('/system/dict-data', data)
}

export function updateDictData(id: number, data: any) {
  return request.put<any, ApiResponse>(`/system/dict-data/${id}`, data)
}

export function deleteDictData(id: number) {
  return request.delete<any, ApiResponse>(`/system/dict-data/${id}`)
}

// ========== 日志管理 ==========
export function getLoginLogs(params: {
  page?: number
  size?: number
  username?: string
  status?: number
  start_time?: string
  end_time?: string
}) {
  return request.get<any, PaginatedResponse>('/system/logs/login', { params })
}

export function getOperationLogs(params: {
  page?: number
  size?: number
  title?: string
  operator_name?: string
  status?: number
  start_time?: string
  end_time?: string
}) {
  return request.get<any, PaginatedResponse>('/system/logs/operation', { params })
}

export function clearLoginLogs(days?: number) {
  return request.delete<any, ApiResponse>('/system/logs/login', { params: { days } })
}

export function clearOperationLogs(days?: number) {
  return request.delete<any, ApiResponse>('/system/logs/operation', { params: { days } })
}

// ========== 日志导出（预留） ==========
export function exportLoginLogs(params: any) {
  // TODO: 后端实现日志导出API
  return request.get('/system/logs/login/export', { 
    params,
    responseType: 'blob'
  })
}

export function exportOperationLogs(params: any) {
  // TODO: 后端实现日志导出API
  return request.get('/system/logs/operation/export', { 
    params,
    responseType: 'blob'
  })
}
