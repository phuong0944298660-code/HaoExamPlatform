import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'

export interface PracticeBank {
  id: number
  name: string
  description: string
  subject: string
  gradeGroup: string
  questionCount: number
  practicedCount: number
  correctCount: number
  wrongCount: number
  accuracy: number
  progress: number
}

export interface PracticeQuestion {
  id: number
  questionType: string
  gradeGroup: string
  difficulty: string
  content: string
  options: string
  score: number
  knowledgePoints: string
  practiced: boolean
  inWrongBook: boolean
}

export interface AnswerResult {
  isCorrect: boolean
  correctAnswer: string
  analysis: string
  analysisImages: string   // JSON 数组字符串
  studentAnswer: string
}

export interface WrongAnswerItem {
  id: number
  questionId: number
  questionBankId: number
  wrongCount: number
  isResolved: boolean
  lastWrongAt: string
  resolvedAt: string | null
  questionType: string
  content: string
  options: string
  difficulty: string
  knowledgePoints: string
}

export interface PracticeStats {
  totalPracticed: number
  totalCorrect: number
  totalWrong: number
  accuracy: number
}

export const practiceApi = {
  /** 获取可访问的题库列表 */
  getBanks(): Promise<ApiResponse<PracticeBank[]>> {
    return request.get('/practice/banks')
  },

  /** 获取题库题目列表（不含答案） */
  getBankQuestions(bankId: number): Promise<ApiResponse<PracticeQuestion[]>> {
    return request.get(`/practice/banks/${bankId}/questions`)
  },

  /** 提交答案，立即返回判题结果 */
  submitAnswer(data: {
    questionId: number
    bankId: number
    answer: string
  }): Promise<ApiResponse<AnswerResult>> {
    return request.post('/practice/answer', data)
  },

  /** 获取错题本 */
  getWrongAnswers(questionBankId?: number): Promise<ApiResponse<WrongAnswerItem[]>> {
    return request.get('/practice/wrong-answers', { params: { questionBankId } })
  },

  /** 标记为已掌握 */
  resolveWrongAnswer(questionId: number): Promise<ApiResponse<string>> {
    return request.put(`/practice/wrong-answers/${questionId}/resolve`)
  },

  /** 从错题本删除 */
  deleteWrongAnswer(questionId: number): Promise<ApiResponse<string>> {
    return request.delete(`/practice/wrong-answers/${questionId}`)
  },

  /** 获取练习统计数据 */
  getStats(): Promise<ApiResponse<PracticeStats>> {
    return request.get('/practice/stats')
  },
}
