/** 通用分页响应 */
export interface PaginatedResponse<T = any> {
  code: number
  message: string
  data: {
    items: T[]
    meta: {
      page: number
      size: number
      total: number
      total_pages: number
      has_next: boolean
      has_prev: boolean
    }
  }
}

/** 通用成功响应 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/** 用户信息 */
export interface UserInfo {
  id: number
  account_type: string | null
  grade_group: string | null
  role: string | null
  identity_no: string | null
  username: string | null
  name: string | null
  school: string | null
  region: string | null
  is_activated: boolean
  is_active: boolean
}

/** 登录响应 */
export interface LoginResult {
  token: string
  user: UserInfo
}

/** 题库 */
export interface QuestionBank {
  id: number
  name: string
  description: string | null
  grade_group: string
  total_questions: number
  status: string
  created_at: string
  stats?: QuestionBankStats
}

export interface QuestionBankStats {
  total_questions: number
  single_choice_count: number
  multi_choice_count: number
  judgment_count: number
  subjective_count: number
  easy_count: number
  medium_count: number
  hard_count: number
}

/** 题目 */
export interface Question {
  id: number
  content: string
  images: string[]
  question_type: string
  options: QuestionOption[] | null
  correct_answer: string | null
  scoring_rules: any
  default_score: number
  answer_analysis: string | null
  tags: string[]
  difficulty: string
  question_bank_id: number
  version: number
  created_at: string
}

export interface QuestionOption {
  label: string
  content: string
}

/** 套卷 */
export interface Paper {
  id: number
  name: string
  description: string | null
  grade_group: string
  status: string
  total_questions: number
  total_score: number
  version: number
  created_at: string
}

/** 考试 */
export interface Exam {
  id: number
  name: string
  description: string | null
  paper_ids: number[]
  grade_group: string
  start_time: string
  end_time: string
  duration: number
  status: string
  is_emergency_extended: boolean
  extended_minutes: number
  max_students: number
  max_screen_switches: number
  enrolled_count: number
  total_submissions: number
  version: number
  created_at: string
}

/** 考试题目（学生端，不含答案） */
export interface ExamQuestion {
  question_id: number
  order: number
  score: number
  content: string
  images: string[]
  question_type: string
  options: QuestionOption[] | null
}

/** 成绩记录 */
export interface ScoreRecord {
  id: number
  exam_id: number
  account_id: number
  assigned_paper_id: number
  status: string
  submitted_at: string | null
  objective_score: number | null
  subjective_score: number | null
  total_score: number | null
}

/** 资源 */
export interface Resource {
  id: number
  name: string
  description: string | null
  category_path: string
  file_url: string
  file_type: string
  file_size: number
  question_bank_id: number | null
  is_active: boolean
  created_at: string
}

/** 激活码 */
export interface ActivationCode {
  id: number
  code: string
  grade_group: string
  user_role: string
  distribution_type: string
  is_used: boolean
  used_by_account_id: number | null
  used_at: string | null
  created_at: string
}
