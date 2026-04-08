import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

/** 班级列表 */
export function getClasses(params: {
  page?: number
  size?: number
  grade_group?: string
  search?: string
}) {
  return request.get<any, PaginatedResponse>('/classes', { params })
}

/** 班级详情 */
export function getClass(id: number) {
  return request.get<any, ApiResponse>(`/classes/${id}`)
}

/** 创建班级 */
export function createClass(data: {
  class_name: string
  grade_group: string
  grade: string
  teacher_id?: number
  description?: string
}) {
  return request.post<any, ApiResponse>('/classes', data)
}

/** 更新班级 */
export function updateClass(id: number, data: {
  class_name?: string
  grade_group?: string
  grade?: string
  teacher_id?: number
  description?: string
}) {
  return request.put<any, ApiResponse>(`/classes/${id}`, data)
}

/** 删除班级 */
export function deleteClass(id: number) {
  return request.delete<any, ApiResponse>(`/classes/${id}`)
}

/** 班级学生列表 */
export function getClassStudents(classId: number, params: {
  page?: number
  size?: number
  search?: string
}) {
  return request.get<any, PaginatedResponse>(`/classes/${classId}/students`, { params })
}

/** 添加学生到班级 */
export function addStudentToClass(classId: number, studentId: number) {
  return request.post<any, ApiResponse>(`/classes/${classId}/students`, { student_id: studentId })
}

/** 从班级移除学生 */
export function removeStudentFromClass(classId: number, studentId: number) {
  return request.delete<any, ApiResponse>(`/classes/${classId}/students/${studentId}`)
}

/** 可添加的学生列表（不在班级中的学生） */
export function getAvailableStudents(classId: number, params: {
  page?: number
  size?: number
  grade_group?: string
  search?: string
}) {
  return request.get<any, PaginatedResponse>(`/classes/${classId}/available-students`, { params })
}

/** 班级成绩统计 */
export function getClassScores(classId: number, params?: {
  exam_id?: number
}) {
  return request.get<any, ApiResponse>(`/classes/${classId}/scores`, { params })
}

/** 导出班级成绩 */
export function exportClassScores(classId: number, params?: {
  exam_id?: number
}) {
  return request.get<any, ApiResponse>(`/classes/${classId}/scores/export`, { params })
}
