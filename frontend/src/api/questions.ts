import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

// ── 题库 ──

export function getQuestionBanks(params: {
  page?: number; size?: number; grade_group?: string; status?: string; search?: string
}) {
  return request.get<any, PaginatedResponse>('/question-banks', { params })
}

export function getQuestionBank(bankId: number) {
  return request.get<any, ApiResponse>(`/question-banks/${bankId}`)
}

export function createQuestionBank(data: { name: string; description?: string; grade_group: string }) {
  return request.post<any, ApiResponse>('/question-banks', data)
}

export function updateQuestionBank(bankId: number, data: { name?: string; description?: string; status?: string }) {
  return request.put<any, ApiResponse>(`/question-banks/${bankId}`, data)
}

export function deleteQuestionBank(bankId: number) {
  return request.delete<any, ApiResponse>(`/question-banks/${bankId}`)
}

// ── 题目 ──

export function getQuestions(params: {
  page?: number; size?: number; bank_id?: number; question_type?: string;
  difficulty?: string; tags?: string; search?: string
}) {
  return request.get<any, PaginatedResponse>('/questions', { params })
}

export function getQuestion(questionId: number) {
  return request.get<any, ApiResponse>(`/questions/${questionId}`)
}

export function createQuestion(data: any) {
  return request.post<any, ApiResponse>('/questions', data)
}

export function updateQuestion(questionId: number, data: any) {
  return request.put<any, ApiResponse>(`/questions/${questionId}`, data)
}

export function deleteQuestion(questionId: number) {
  return request.delete<any, ApiResponse>(`/questions/${questionId}`)
}

/** 批量导入题目 */
export function batchImportQuestions(formData: FormData) {
  return request.post<any, ApiResponse>('/questions/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
