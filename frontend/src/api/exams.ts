import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

// ── 管理端 ──

export function getExams(params: {
  page?: number; size?: number; status?: string; grade_group?: string
}) {
  return request.get<any, PaginatedResponse>('/exams', { params })
}

export function getExam(examId: number) {
  return request.get<any, ApiResponse>(`/exams/${examId}`)
}

export function createExam(data: any) {
  return request.post<any, ApiResponse>('/exams', data)
}

export function updateExam(examId: number, data: any) {
  return request.put<any, ApiResponse>(`/exams/${examId}`, data)
}

export function deleteExam(examId: number) {
  return request.delete<any, ApiResponse>(`/exams/${examId}`)
}

export function publishExam(examId: number) {
  return request.post<any, ApiResponse>(`/exams/${examId}/publish`)
}

export function closeExam(examId: number) {
  return request.post<any, ApiResponse>(`/exams/${examId}/close`)
}

export function emergencyExtend(examId: number, data: { extra_minutes: number; reason: string }) {
  return request.post<any, ApiResponse>(`/exams/${examId}/emergency-extend`, data)
}

export function getExamDashboard(examId: number) {
  return request.get<any, ApiResponse>(`/exams/${examId}/dashboard`)
}

export function getExamStudents(examId: number, params: { page?: number; size?: number }) {
  return request.get<any, PaginatedResponse>(`/exams/${examId}/students`, { params })
}

/** 配置成绩查询时间窗口 */
export function updateScoreQueryConfig(examId: number, data: {
  is_open: boolean
  start_time?: string | null
  end_time?: string | null
}) {
  return request.put<any, ApiResponse>(`/exams/${examId}/score-query-config`, data)
}

// ── 学生端（考试引擎） ──

export function getExamQuestions(examId: number) {
  return request.get<any, ApiResponse>(`/exam-engine/exams/${examId}/questions`)
}

export function saveAnswer(examId: number, data: { question_id: number; answer: string; uploaded_files?: string[] }) {
  return request.post<any, ApiResponse>(`/exam-engine/exams/${examId}/answers`, data)
}

export function getExamProgress(examId: number) {
  return request.get<any, ApiResponse>(`/exam-engine/exams/${examId}/progress`)
}

export function submitExam(examId: number, data: { force?: boolean; idempotency_key?: string }) {
  return request.post<any, ApiResponse>(`/exam-engine/exams/${examId}/submit`, data)
}
