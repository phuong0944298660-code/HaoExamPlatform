import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

export function getPapers(params: {
  page?: number; size?: number; grade_group?: string; status?: string
}) {
  return request.get<any, PaginatedResponse>('/papers', { params })
}

export function getPaper(paperId: number) {
  return request.get<any, ApiResponse>(`/papers/${paperId}`)
}

export function createPaper(data: any) {
  return request.post<any, ApiResponse>('/papers', data)
}

export function updatePaper(paperId: number, data: any, force = false) {
  return request.put<any, ApiResponse>(`/papers/${paperId}`, data, { params: { force } })
}

export function deletePaper(paperId: number) {
  return request.delete<any, ApiResponse>(`/papers/${paperId}`)
}

export function addQuestionsToPaper(paperId: number, questionsConfig: any[]) {
  return request.post<any, ApiResponse>(`/papers/${paperId}/questions`, questionsConfig)
}

export function removeQuestionFromPaper(paperId: number, questionId: number) {
  return request.delete<any, ApiResponse>(`/papers/${paperId}/questions/${questionId}`)
}

export function reorderQuestions(paperId: number, data: { order: number[] }) {
  return request.put<any, ApiResponse>(`/papers/${paperId}/reorder`, data)
}

export function updateQuestionScore(paperId: number, questionId: number, data: { score: number }) {
  return request.put<any, ApiResponse>(`/papers/${paperId}/questions/${questionId}/score`, data)
}

export function previewPaper(paperId: number) {
  return request.get<any, ApiResponse>(`/papers/${paperId}/preview`)
}

export function publishPaper(paperId: number) {
  return request.post<any, ApiResponse>(`/papers/${paperId}/publish`)
}

export function archivePaper(paperId: number) {
  return request.post<any, ApiResponse>(`/papers/${paperId}/archive`)
}
