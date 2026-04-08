<template>
  <div class="grading-page">
    <a-page-header title="主观题批阅" sub-title="为学生主观题答案评分">
      <template #extra>
        <a-space>
          <span class="progress-text" v-if="selectedExamId">
            已批 <strong>{{ gradedCount }}</strong> / 共 <strong>{{ totalCount }}</strong> 份
          </span>
          <a-progress
            v-if="selectedExamId && totalCount > 0"
            type="circle"
            :percent="progressPercent"
            :width="40"
            :stroke-width="8"
          />
        </a-space>
      </template>
    </a-page-header>

    <!-- 考试选择 -->
    <a-card :bordered="false" style="margin-top: 16px">
      <a-row :gutter="16" align="middle">
        <a-col :span="8">
          <a-select
            v-model:value="selectedExamId"
            placeholder="请选择要批阅的考试"
            show-search
            :filter-option="filterExamOption"
            style="width: 100%"
            @change="handleExamChange"
          >
            <a-select-option
              v-for="e in examList"
              :key="e.id"
              :value="e.id"
              :label="e.name"
            >
              {{ e.name }}
              <a-tag :color="statusColor(e.status)" style="margin-left: 8px">{{ statusText(e.status) }}</a-tag>
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="gradingFilter"
            style="width: 100%"
            @change="filterStudents"
          >
            <a-select-option value="all">全部</a-select-option>
            <a-select-option value="ungraded">未批阅</a-select-option>
            <a-select-option value="graded">已批阅</a-select-option>
          </a-select>
        </a-col>
      </a-row>
    </a-card>

    <!-- 批阅区域 -->
    <a-row :gutter="16" style="margin-top: 16px" v-if="selectedExamId">
      <!-- 左侧：学生列表 -->
      <a-col :span="7">
        <a-card title="学生列表" :bordered="false" :bodyStyle="{ padding: '8px', maxHeight: '680px', overflowY: 'auto' }">
          <a-spin :spinning="studentsLoading">
            <a-empty v-if="!studentsLoading && filteredStudents.length === 0" description="暂无学生数据" />
            <a-list :data-source="filteredStudents" size="small">
              <template #renderItem="{ item }">
                <a-list-item
                  :class="['student-item', { active: item.account_id === selectedStudentId }]"
                  @click="selectStudent(item)"
                >
                  <a-list-item-meta>
                    <template #title>
                      <a-space>
                        <span>{{ item.student_name || `学生${item.account_id}` }}</span>
                        <a-tag v-if="item.is_graded" color="green" size="small">已批</a-tag>
                        <a-tag v-else color="orange" size="small">待批</a-tag>
                      </a-space>
                    </template>
                    <template #description>
                      <span v-if="item.total_score !== null">
                        总分: {{ item.total_score }} | 客观题: {{ item.objective_score ?? '-' }}
                      </span>
                      <span v-else>未提交</span>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-spin>
        </a-card>
      </a-col>

      <!-- 右侧：批阅区域 -->
      <a-col :span="17">
        <a-card title="批阅详情" :bordered="false">
          <template v-if="selectedStudentId && studentDetail">
            <a-spin :spinning="detailLoading">
              <div v-if="subjectiveQuestions.length === 0" style="text-align: center; padding: 40px">
                <a-empty description="该学生没有需要批阅的主观题" />
              </div>
              <div v-else>
                <div
                  v-for="(sq, idx) in subjectiveQuestions"
                  :key="sq.question_id"
                  class="grading-question"
                >
                  <a-divider v-if="idx > 0" />

                  <!-- 题目信息 -->
                  <div class="question-header">
                    <a-tag color="blue">第 {{ sq.order }} 题</a-tag>
                    <a-tag>主观题</a-tag>
                    <a-tag color="orange">满分 {{ sq.full_score }} 分</a-tag>
                  </div>

                  <!-- 题目内容 -->
                  <div class="question-content" v-html="sq.content"></div>

                  <!-- 参考答案（如果有） -->
                  <a-collapse v-if="sq.reference_answer" :bordered="false" style="margin: 8px 0">
                    <a-collapse-panel key="ref" header="参考答案">
                      <div v-html="sq.reference_answer"></div>
                    </a-collapse-panel>
                  </a-collapse>

                  <!-- 学生答案 -->
                  <div class="student-answer">
                    <strong>学生答案：</strong>
                    <a-card size="small" :bodyStyle="{ background: '#fafafa' }">
                      <div v-if="sq.student_answer" v-html="sq.student_answer"></div>
                      <a-empty v-else description="学生未作答" :image-style="{ height: '40px' }" />
                    </a-card>
                  </div>

                  <!-- 评分 -->
                  <a-row :gutter="16" style="margin-top: 12px" align="middle">
                    <a-col :span="8">
                      <a-form-item label="评分" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
                        <a-input-number
                          v-model:value="sq.given_score"
                          :min="0"
                          :max="sq.full_score"
                          :step="0.5"
                          :precision="2"
                          style="width: 100%"
                        >
                          <template #addonAfter>/ {{ sq.full_score }}</template>
                        </a-input-number>
                      </a-form-item>
                    </a-col>
                    <a-col :span="16">
                      <a-form-item label="评语" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
                        <a-input
                          v-model:value="sq.comment"
                          placeholder="评语（选填）"
                          allow-clear
                        />
                      </a-form-item>
                    </a-col>
                  </a-row>
                </div>

                <!-- 提交按钮 -->
                <a-divider />
                <div style="text-align: center">
                  <a-space size="large">
                    <a-button @click="resetGrading">重置</a-button>
                    <a-button type="primary" :loading="submitLoading" @click="submitGrading">
                      提交评分
                    </a-button>
                    <a-button type="primary" ghost :loading="submitLoading" @click="submitAndNext">
                      提交并批阅下一位
                    </a-button>
                  </a-space>
                </div>
              </div>
            </a-spin>
          </template>
          <template v-else>
            <a-empty description="请从左侧选择要批阅的学生" style="padding: 80px 0" />
          </template>
        </a-card>
      </a-col>
    </a-row>

    <!-- 未选择考试 -->
    <a-card v-if="!selectedExamId" :bordered="false" style="margin-top: 16px">
      <a-empty description="请先选择要批阅的考试" style="padding: 60px 0" />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getExams } from '@/api/exams'
import { getScores, recordSubjectiveScore, getStudentScoreDetail } from '@/api/scores'
import type { Exam } from '@/types/api'

// ── 考试列表 ──
const examList = ref<Exam[]>([])
const selectedExamId = ref<number | undefined>(undefined)

async function fetchExamList() {
  try {
    // 获取已关闭或已结束的考试（需要批阅的）
    const res = await getExams({ page: 1, size: 200 })
    examList.value = res.data?.list || res.data?.items || []
  } catch {
    // 错误已在拦截器处理
  }
}

function filterExamOption(input: string, option: any) {
  return (option?.label || '').toLowerCase().includes(input.toLowerCase())
}

function statusColor(s: string) {
  return { draft: 'default', pending: 'orange', open: 'green', closed: 'red', finished: 'gray' }[s] || 'default'
}
function statusText(s: string) {
  return { draft: '草稿', pending: '待开放', open: '进行中', closed: '已关闭', finished: '已结束' }[s] || s
}

// ── 学生列表 ──
const studentsLoading = ref(false)
const allStudents = ref<any[]>([])
const filteredStudents = ref<any[]>([])
const gradingFilter = ref('all')
const selectedStudentId = ref<number | undefined>(undefined)

// 统计
const gradedCount = computed(() => allStudents.value.filter((s) => s.is_graded).length)
const totalCount = computed(() => allStudents.value.length)
const progressPercent = computed(() =>
  totalCount.value > 0 ? Math.round((gradedCount.value / totalCount.value) * 100) : 0
)

async function handleExamChange(examId: number) {
  selectedStudentId.value = undefined
  studentDetail.value = null
  subjectiveQuestions.value = []
  await fetchStudents(examId)
}

async function fetchStudents(examId: number) {
  studentsLoading.value = true
  try {
    const res = await getScores({ exam_id: examId, page: 1, size: 500 })
    allStudents.value = (res.data?.list || res.data?.items || []).map((s: any) => ({
      ...s,
      is_graded: s.status === 'graded',
    }))
    filterStudents()
  } catch {
    // 错误已在拦截器处理
  } finally {
    studentsLoading.value = false
  }
}

function filterStudents() {
  if (gradingFilter.value === 'ungraded') {
    filteredStudents.value = allStudents.value.filter((s) => !s.is_graded)
  } else if (gradingFilter.value === 'graded') {
    filteredStudents.value = allStudents.value.filter((s) => s.is_graded)
  } else {
    filteredStudents.value = [...allStudents.value]
  }
}

// ── 学生详情 ──
const detailLoading = ref(false)
const studentDetail = ref<any>(null)

interface SubjectiveQuestion {
  question_id: number
  order: number
  content: string
  full_score: number
  student_answer: string | null
  reference_answer: string | null
  given_score: number | undefined
  comment: string
}

const subjectiveQuestions = ref<SubjectiveQuestion[]>([])

async function selectStudent(student: any) {
  selectedStudentId.value = student.account_id
  detailLoading.value = true
  try {
    const res = await getStudentScoreDetail(selectedExamId.value!, student.account_id)
    studentDetail.value = res.data

    // 提取主观题
    const questions = res.data?.questions || []
    subjectiveQuestions.value = questions
      .filter((q: any) => q.question_type === 'subjective')
      .map((q: any) => ({
        question_id: q.question_id,
        order: q.order,
        content: q.content,
        full_score: q.score || q.full_score || 0,
        student_answer: q.student_answer || null,
        reference_answer: q.reference_answer || q.correct_answer || null,
        given_score: q.given_score ?? undefined,
        comment: q.comment || '',
      }))
  } catch {
    // 错误已在拦截器处理
  } finally {
    detailLoading.value = false
  }
}

// ── 提交评分 ──
const submitLoading = ref(false)

function resetGrading() {
  subjectiveQuestions.value.forEach((sq) => {
    sq.given_score = undefined
    sq.comment = ''
  })
}

async function submitGrading() {
  // 校验所有主观题均已打分
  const unscored = subjectiveQuestions.value.filter(
    (sq) => sq.given_score === undefined || sq.given_score === null
  )
  if (unscored.length > 0) {
    message.warning(`还有 ${unscored.length} 道题未评分`)
    return
  }

  submitLoading.value = true
  try {
    // 逐题提交评分
    for (const sq of subjectiveQuestions.value) {
      await recordSubjectiveScore({
        assignment_id: studentDetail.value?.assignment_id || studentDetail.value?.id,
        question_id: sq.question_id,
        score: sq.given_score!,
      })
    }
    message.success('评分提交成功')

    // 更新学生列表中的批阅状态
    const student = allStudents.value.find((s) => s.account_id === selectedStudentId.value)
    if (student) {
      student.is_graded = true
    }
    filterStudents()
  } catch {
    // 错误已在拦截器处理
  } finally {
    submitLoading.value = false
  }
}

async function submitAndNext() {
  await submitGrading()
  if (!submitLoading.value) {
    // 找到下一个未批阅的学生
    const currentIdx = filteredStudents.value.findIndex(
      (s) => s.account_id === selectedStudentId.value
    )
    const nextUngraded = allStudents.value.find(
      (s, idx) => !s.is_graded && s.account_id !== selectedStudentId.value
    )
    if (nextUngraded) {
      selectStudent(nextUngraded)
    } else {
      message.success('所有学生均已批阅完毕！')
      selectedStudentId.value = undefined
      studentDetail.value = null
      subjectiveQuestions.value = []
    }
  }
}

onMounted(() => {
  fetchExamList()
})
</script>

<style scoped>
.grading-page {
  max-width: 1400px;
  margin: 0 auto;
}
.progress-text {
  font-size: 14px;
  color: #666;
}
.student-item {
  cursor: pointer;
  padding: 8px 12px !important;
  border-radius: 4px;
  transition: background 0.2s;
}
.student-item:hover {
  background: #f0f5ff;
}
.student-item.active {
  background: #e6f7ff;
  border-left: 3px solid #1890ff;
}
.grading-question {
  margin-bottom: 16px;
}
.question-header {
  margin-bottom: 12px;
}
.question-content {
  font-size: 15px;
  line-height: 1.8;
  margin-bottom: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 4px;
}
.student-answer {
  margin-top: 8px;
}
</style>
