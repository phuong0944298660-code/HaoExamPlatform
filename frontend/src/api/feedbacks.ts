import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

/** 提交反馈 */
export function createFeedback(data: {
  exam_id?: number | null
  reporter_name: string
  reporter_contact?: string
  reporter_role?: string
  category: string
  priority?: string
  title: string
  description: string
  screenshots?: string[]
}) {
  return request.post<any, ApiResponse>('/feedbacks', data)
}

/** 获取反馈列表 */
export function getFeedbacks(params: {
  page?: number
  size?: number
  exam_id?: number
  status?: string
  category?: string
}) {
  return request.get<any, PaginatedResponse>('/feedbacks', { params })
}

/** 获取反馈详情 */
export function getFeedback(feedbackId: number) {
  return request.get<any, ApiResponse>(`/feedbacks/${feedbackId}`)
}

/** 更新反馈状态 */
export function updateFeedbackStatus(feedbackId: number, data: {
  status: string
  resolution?: string
  assigned_to?: number
}) {
  return request.put<any, ApiResponse>(`/feedbacks/${feedbackId}/status`, data)
}

/** 删除反馈 */
export function deleteFeedback(feedbackId: number) {
  return request.delete<any, ApiResponse>(`/feedbacks/${feedbackId}`)
}
