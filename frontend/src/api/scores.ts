import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

export function getScores(params: {
  page?: number; size?: number; exam_id?: number; grade_group?: string
}) {
  return request.get<any, PaginatedResponse>('/scores', { params })
}

export function recordSubjectiveScore(data: {
  assignment_id: number; question_id: number; score: number
}) {
  return request.post<any, ApiResponse>('/scores/subjective', data)
}

export function exportScores(examId: number, format: string = 'excel') {
  return request.get(`/scores/export`, {
    params: { exam_id: examId, format },
    responseType: 'blob',
  })
}

export function getStudentScoreDetail(examId: number, accountId: number) {
  return request.get<any, ApiResponse>(`/scores/${examId}/students/${accountId}`)
}

/** 批量导入评分表压缩包 */
export function uploadGradingSheets(
  examId: number,
  formData: FormData,
  config?: { onUploadProgress?: (progressEvent: any) => void }
) {
  return request.post<any, ApiResponse>(
    `/scores/${examId}/grading-sheets:batchImport`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 5分钟超时（大文件）
      ...(config || {}),
    }
  )
}

/** 获取学生评分表列表 */
export function getGradingSheets(examId: number, accountId: number) {
  return request.get<any, ApiResponse>(`/scores/${examId}/grading-sheets/${accountId}`)
}

/** 学生查询本人成绩（含评分表） */
export function getMyExamResult(examId: number) {
  return request.get<any, ApiResponse>('/scores/my-result', {
    params: { exam_id: examId },
  })
}
