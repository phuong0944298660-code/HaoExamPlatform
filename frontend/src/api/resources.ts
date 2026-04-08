import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

export function getResources(params: {
  page?: number; size?: number; category_path?: string; file_type?: string; question_bank_id?: number
}) {
  return request.get<any, PaginatedResponse>('/resources', { params })
}

export function getResource(resourceId: number) {
  return request.get<any, ApiResponse>(`/resources/${resourceId}`)
}

export function uploadResource(formData: FormData) {
  return request.post<any, ApiResponse>('/resources/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function deleteResource(resourceId: number) {
  return request.delete<any, ApiResponse>(`/resources/${resourceId}`)
}
