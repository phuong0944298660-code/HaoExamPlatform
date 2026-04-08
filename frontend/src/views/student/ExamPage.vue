<template>
  <div class="exam-page">
    <a-row :gutter="16" class="exam-container">
      <!-- 左侧：题型导航 -->
      <a-col :span="5" class="left-panel">
        <div class="panel-content">
          <!-- 单选题区域 -->
          <div class="question-type-section">
            <div class="type-header">
              <span class="type-name">单选题</span>
              <span class="type-stats">共 {{ singleChoiceQuestions.length }} 题，共 {{ getTotalScore(singleChoiceQuestions) }} 分</span>
            </div>
            <div class="question-grid">
              <div
                v-for="(q, idx) in singleChoiceQuestions"
                :key="q.question_id"
                :class="['question-number', {
                  'answered': isAnswered(q.question_id),
                  'current': getQuestionIndex(q.question_id) === currentIndex
                }]"
                @click="goToQuestion(getQuestionIndex(q.question_id))"
              >
                {{ getQuestionIndex(q.question_id) + 1 }}
              </div>
            </div>
          </div>

          <!-- 多选题区域 -->
          <div class="question-type-section" v-if="multiChoiceQuestions.length > 0">
            <div class="type-header">
              <span class="type-name">多选题</span>
              <span class="type-stats">共 {{ multiChoiceQuestions.length }} 题，共 {{ getTotalScore(multiChoiceQuestions) }} 分</span>
            </div>
            <div class="question-grid">
              <div
                v-for="(q, idx) in multiChoiceQuestions"
                :key="q.question_id"
                :class="['question-number', {
                  'answered': isAnswered(q.question_id),
                  'current': getQuestionIndex(q.question_id) === currentIndex
                }]"
                @click="goToQuestion(getQuestionIndex(q.question_id))"
              >
                {{ getQuestionIndex(q.question_id) + 1 }}
              </div>
            </div>
          </div>

          <!-- 判断题区域 -->
          <div class="question-type-section" v-if="judgmentQuestions.length > 0">
            <div class="type-header">
              <span class="type-name">判断题</span>
              <span class="type-stats">共 {{ judgmentQuestions.length }} 题，共 {{ getTotalScore(judgmentQuestions) }} 分</span>
            </div>
            <div class="question-grid">
              <div
                v-for="(q, idx) in judgmentQuestions"
                :key="q.question_id"
                :class="['question-number', {
                  'answered': isAnswered(q.question_id),
                  'current': getQuestionIndex(q.question_id) === currentIndex
                }]"
                @click="goToQuestion(getQuestionIndex(q.question_id))"
              >
                {{ getQuestionIndex(q.question_id) + 1 }}
              </div>
            </div>
          </div>

          <!-- 主观题区域 -->
          <div class="question-type-section" v-if="subjectiveQuestions.length > 0">
            <div class="type-header">
              <span class="type-name">主观题</span>
              <span class="type-stats">共 {{ subjectiveQuestions.length }} 题，共 {{ getTotalScore(subjectiveQuestions) }} 分</span>
            </div>
            <div class="question-grid">
              <div
                v-for="(q, idx) in subjectiveQuestions"
                :key="q.question_id"
                :class="['question-number', {
                  'answered': isAnswered(q.question_id),
                  'current': getQuestionIndex(q.question_id) === currentIndex
                }]"
                @click="goToQuestion(getQuestionIndex(q.question_id))"
              >
                {{ getQuestionIndex(q.question_id) + 1 }}
              </div>
            </div>
          </div>
        </div>
      </a-col>

      <!-- 中间：题目内容 -->
      <a-col :span="14" class="center-panel">
        <div class="panel-content">
          <!-- 顶部信息栏 -->
          <div class="exam-header-bar">
            <div class="timer">
              <a-tag color="red" v-if="remainSeconds > 0">
                <ClockCircleOutlined /> {{ formatCountdown(remainSeconds) }}
              </a-tag>
              <a-tag color="gray" v-else>考试已结束</a-tag>
            </div>
            <a-button type="primary" danger @click="handleSubmit" :loading="submitting">
              交卷
            </a-button>
          </div>

          <a-spin :spinning="loading">
            <div v-if="currentQuestion" class="question-main">
              <!-- 题目头部 -->
              <div class="question-title-area">
                <span class="question-number">{{ currentIndex + 1 }}.</span>
                <span class="question-content" v-html="formatQuestionContent(currentQuestion.content)"></span>
              </div>

              <!-- 选项区域 -->
              <div class="options-area">
                <!-- 单选题 -->
                <div v-if="currentQuestion.question_type === 'single_choice'" class="options-list">
                  <div
                    v-for="opt in currentQuestion.options"
                    :key="opt.label"
                    :class="['option-card', { 'selected': currentAnswer === opt.label }]"
                    @click="selectOption(opt.label)"
                  >
                    <span class="option-label">{{ opt.label }}</span>
                    <span class="option-text" v-html="formatQuestionContent(opt.content)"></span>
                    <CheckCircleFilled v-if="currentAnswer === opt.label" class="check-icon" />
                  </div>
                </div>

                <!-- 多选题 -->
                <div v-else-if="currentQuestion.question_type === 'multi_choice'" class="options-list">
                  <div
                    v-for="opt in currentQuestion.options"
                    :key="opt.label"
                    :class="['option-card', { 'selected': currentMultiAnswer.includes(opt.label) }]"
                    @click="toggleMultiOption(opt.label)"
                  >
                    <span class="option-label">{{ opt.label }}</span>
                    <span class="option-text" v-html="formatQuestionContent(opt.content)"></span>
                    <CheckSquareFilled v-if="currentMultiAnswer.includes(opt.label)" class="check-icon" />
                  </div>
                </div>

                <!-- 判断题 -->
                <div v-else-if="currentQuestion.question_type === 'judgment'" class="options-list">
                  <div
                    :class="['option-card', { 'selected': currentAnswer === 'T' }]"
                    @click="selectOption('T')"
                  >
                    <span class="option-label">✓</span>
                    <span class="option-text">正确</span>
                    <CheckCircleFilled v-if="currentAnswer === 'T'" class="check-icon" />
                  </div>
                  <div
                    :class="['option-card', { 'selected': currentAnswer === 'F' }]"
                    @click="selectOption('F')"
                  >
                    <span class="option-label">✗</span>
                    <span class="option-text">错误</span>
                    <CheckCircleFilled v-if="currentAnswer === 'F'" class="check-icon" />
                  </div>
                </div>

                <!-- 主观题 -->
                <div v-else class="subjective-area">
                  <Subjective
                    :model-value="currentAnswer"
                    :uploads="currentUploads"
                    @update:model-value="onSubjectiveTextChange"
                    @upload-success="onUploadSuccess"
                    @upload-remove="onUploadRemove"
                  />
                </div>
              </div>

              <!-- 答题结果提示（预览模式显示） -->
              <div v-if="showResult" class="result-area">
                <div class="result-status" :class="{ 'correct': isCorrect, 'wrong': !isCorrect }">
                  <CheckCircleFilled v-if="isCorrect" />
                  <CloseCircleFilled v-else />
                  <span>{{ isCorrect ? '答对了' : '答错了' }}</span>
                </div>
                <div class="result-detail">
                  <p>学员得分：{{ getScore }}</p>
                  <p>学员答案：{{ currentAnswer || '未作答' }}</p>
                </div>
              </div>

              <!-- 底部导航 -->
              <div class="bottom-nav">
                <a-button :disabled="currentIndex <= 0" @click="prevQuestion">
                  <LeftOutlined /> 上一题
                </a-button>
                <span class="nav-info">{{ currentIndex + 1 }} / {{ questions.length }}</span>
                <a-button :disabled="currentIndex >= questions.length - 1" @click="nextQuestion">
                  下一题 <RightOutlined />
                </a-button>
              </div>
            </div>
          </a-spin>
        </div>
      </a-col>

      <!-- 右侧：考试信息 -->
      <a-col :span="5" class="right-panel">
        <div class="panel-content">
          <!-- 试卷信息 -->
          <div class="info-card">
            <h3 class="paper-title">{{ examData?.paper?.name || examData?.paper_name || examData?.examName || '试卷' }}</h3>
            <a-divider />
            <div class="info-item">
              <span class="info-label">人员姓名</span>
              <span class="info-value">{{ userName }}</span>
            </div>
            <a-divider />
            <div class="info-item">
              <span class="info-label">已答题数</span>
              <span class="info-value highlight">{{ answeredCount }} / {{ questions.length }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">答题进度</span>
              <a-progress :percent="progressPercent" size="small" />
            </div>
            <a-divider />
            <div class="info-item">
              <span class="info-label">当前题目</span>
              <span class="info-value">第 {{ currentIndex + 1 }} 题</span>
            </div>
            <div class="info-item">
              <span class="info-label">本题分值</span>
              <span class="info-value highlight">{{ currentQuestion?.score || 0 }} 分</span>
            </div>
          </div>

          <!-- 交卷按钮 -->
          <a-button
            type="primary"
            danger
            block
            size="large"
            :loading="submitting"
            @click="handleSubmit"
            class="submit-btn"
          >
            交卷
          </a-button>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  ClockCircleOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleFilled,
  CheckSquareFilled,
  CloseCircleFilled,
} from '@ant-design/icons-vue'
import { getExamQuestions, saveAnswer, submitExam, getExamProgress } from '@/api/exams'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import Subjective from '@/components/exam/Subjective.vue'
import type { SubjectiveUpload } from '@/components/exam/Subjective.vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// 渲染 LaTeX 公式
function renderLatex(content: string): string {
  if (!content) return ''

  // 处理块级公式 $$...$$
  let result = content.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: true,
      })
    } catch (e) {
      console.error('KaTeX render error:', e)
      return match
    }
  })

  // 处理行内公式 $...$
  result = result.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: false,
      })
    } catch (e) {
      console.error('KaTeX render error:', e)
      return match
    }
  })

  return result
}

// 格式化题目内容（处理 HTML 和公式）
function formatQuestionContent(content?: string): string {
  if (!content) return ''
  return renderLatex(content)
}

const route = useRoute()
const router = useRouter()
const examId = Number(route.params.examId)

const loading = ref(true)
const submitting = ref(false)
const examData = ref<any>(null)
const questions = ref<any[]>([])
const answers = ref<Record<number, string>>({})
const subjectiveUploads = ref<Record<number, SubjectiveUpload[]>>({})
const currentIndex = ref(0)
const remainSeconds = ref(0)
const userName = ref('考生')
const switchCount = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

// 是否显示答题结果（用于预览/练习模式）
const showResult = ref(false)
const isCorrect = ref(false)
const getScore = ref(0)

// 当前题目
const currentQuestion = computed(() => questions.value[currentIndex.value])

// 按题型分组的题目
const singleChoiceQuestions = computed(() => questions.value.filter(q => q.question_type === 'single_choice'))
const multiChoiceQuestions = computed(() => questions.value.filter(q => q.question_type === 'multi_choice'))
const judgmentQuestions = computed(() => questions.value.filter(q => q.question_type === 'judgment'))
const subjectiveQuestions = computed(() => questions.value.filter(q => q.question_type === 'subjective'))

// 当前题目的答案（单选/判断）
const currentAnswer = computed({
  get: () => answers.value[currentQuestion.value?.question_id] || '',
  set: (v: string) => {
    if (currentQuestion.value) answers.value[currentQuestion.value.question_id] = v
  },
})

// 当前题目的答案（多选）
const currentMultiAnswer = computed({
  get: () => {
    const a = answers.value[currentQuestion.value?.question_id] || ''
    return a ? a.split('') : []
  },
  set: (v: string[]) => {
    if (currentQuestion.value) answers.value[currentQuestion.value.question_id] = v.sort().join('')
  },
})

// 当前主观题的上传文件列表
const currentUploads = computed(() => {
  const qid = currentQuestion.value?.question_id
  return qid ? (subjectiveUploads.value[qid] || []) : []
})

// 统计
const answeredCount = computed(() => Object.keys(answers.value).filter(k => answers.value[Number(k)]).length)
const progressPercent = computed(() => questions.value.length > 0 ? Math.round((answeredCount.value / questions.value.length) * 100) : 0)

// 获取题目在总列表中的索引
function getQuestionIndex(questionId: number): number {
  return questions.value.findIndex(q => q.question_id === questionId)
}

// 判断题目是否已作答
function isAnswered(questionId: number): boolean {
  return !!answers.value[questionId]
}

// 获取一组题目的总分
function getTotalScore(questionList: any[]): number {
  return questionList.reduce((sum, q) => sum + (q.score || 0), 0)
}

// 跳转到指定题目
function goToQuestion(index: number) {
  currentIndex.value = index
}

// 上一题
function prevQuestion() {
  if (currentIndex.value > 0) currentIndex.value--
}

// 下一题
function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) currentIndex.value++
}

// 选择单选/判断选项
function selectOption(label: string) {
  currentAnswer.value = label
  autoSave()
}

// 切换多选选项
function toggleMultiOption(label: string) {
  const current = currentMultiAnswer.value
  const index = current.indexOf(label)
  if (index > -1) {
    current.splice(index, 1)
  } else {
    current.push(label)
  }
  currentMultiAnswer.value = [...current].sort()
  autoSave()
}

// 主观题文字变更
function onSubjectiveTextChange(value: string) {
  if (currentQuestion.value) {
    answers.value[currentQuestion.value.question_id] = value
    autoSave()
  }
}

// 主观题文件上传成功
function onUploadSuccess(file: SubjectiveUpload) {
  const qid = currentQuestion.value?.question_id
  if (!qid) return
  if (!subjectiveUploads.value[qid]) {
    subjectiveUploads.value[qid] = []
  }
  subjectiveUploads.value[qid].push(file)
}

// 主观题文件删除
function onUploadRemove(fileId: string) {
  const qid = currentQuestion.value?.question_id
  if (!qid || !subjectiveUploads.value[qid]) return
  subjectiveUploads.value[qid] = subjectiveUploads.value[qid].filter(f => f.file_id !== fileId)
}

// 格式化倒计时
function formatCountdown(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// 自动保存
async function autoSave() {
  if (!currentQuestion.value) return
  try {
    await saveAnswer(examId, {
      question_id: currentQuestion.value.question_id,
      answer: answers.value[currentQuestion.value.question_id] || '',
    })
  } catch {
    // 静默失败
  }
}

// 交卷
async function handleSubmit() {
  Modal.confirm({
    title: '确认交卷？',
    content: `已答 ${answeredCount.value} / ${questions.value.length} 题，确认提交吗？`,
    okText: '确认交卷',
    cancelText: '继续答题',
    onOk: async () => {
      submitting.value = true
      try {
        await submitExam(examId, { idempotency_key: uuidv4() })
        message.success('交卷成功')
        router.push(`/student/result/${examId}`)
      } catch {
        // 拦截器处理
      } finally {
        submitting.value = false
      }
    },
  })
}

// 页面加载
onMounted(async () => {
  try {
    const res = await getExamQuestions(examId)
    examData.value = res.data

    // 从 paper.questions 获取题目（后端返回结构：{ paper: { questions: [] }, endTime, savedAnswers }）
    const rawQuestions = res.data?.paper?.questions || res.data?.questions || []
    // 统一题型名称映射（兼容各种后端枚举命名）
    const normalizeType = (t: string) => {
      const map: Record<string, string> = {
        'single_choice': 'single_choice', 'SINGLE_CHOICE': 'single_choice',
        'multi_choice': 'multi_choice', 'MULTI_CHOICE': 'multi_choice',
        'multiple_choice': 'multi_choice', 'MULTIPLE_CHOICE': 'multi_choice',
        'judgment': 'judgment', 'JUDGMENT': 'judgment',
        'true_false': 'judgment', 'TRUE_FALSE': 'judgment',
        'subjective': 'subjective', 'SUBJECTIVE': 'subjective',
      }
      return map[t] || (t ? t.toLowerCase() : '')
    }
    // 规范化字段：兼容后端返回的驼峰命名
    questions.value = rawQuestions.map((q: any) => {
      const rawType = q.question_type ?? (q.questionType ?? '')
      return {
        ...q,
        question_id: q.question_id ?? q.id,
        question_type: normalizeType(rawType),
        // 确保 options 是数组（后端可能返回 JSON 字符串）
        options: typeof q.options === 'string' ? (() => { try { return JSON.parse(q.options) } catch { return [] } })() : (q.options || []),
      }
    })

    // 恢复答题进度（优先使用初始响应中的 savedAnswers）
    const savedAnswers = res.data?.savedAnswers || {}
    for (const [qid, ans] of Object.entries(savedAnswers)) {
      if (ans) answers.value[Number(qid)] = ans as string
    }
    // 兼容：也从进度接口恢复
    try {
      const progressRes = await getExamProgress(examId)
      if (progressRes.data?.answers) {
        const saved = progressRes.data.answers
        for (const [qid, ans] of Object.entries(saved)) {
          if (ans) answers.value[Number(qid)] = ans as string
        }
      }
    } catch {
      // 忽略
    }

    // 倒计时：使用后端返回的 endTime
    const endTime = dayjs(res.data.endTime || res.data.end_time)
    const updateTimer = () => {
      const now = dayjs()
      remainSeconds.value = Math.max(0, endTime.diff(now, 'second'))
      if (remainSeconds.value <= 0 && timer) {
        clearInterval(timer)
        message.warning('考试时间已到，自动交卷')
        submitExam(examId, { force: true, idempotency_key: uuidv4() }).then(() => {
          router.push(`/student/result/${examId}`)
        })
      }
    }
    updateTimer()
    timer = setInterval(updateTimer, 1000)

    // 防作弊：切屏检测
    window.addEventListener('visibilitychange', handleVisibilityChange)
  } catch {
    //
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('visibilitychange', handleVisibilityChange)
})

// 处理切屏
function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    switchCount.value++
    const maxAllowed = examData.value?.maxScreenSwitches ?? examData.value?.max_screen_switches ?? 0
    
    if (switchCount.value > maxAllowed) {
      // 超过限制，强制交卷
      Modal.error({
        title: '异常操作告警',
        content: `检测到您已切屏 ${switchCount.value} 次，超过系统允许上限 (${maxAllowed}次)。系统已强制交卷，请联系监考老师。`,
        okText: '确定',
        onOk: async () => {
          submitting.value = true
          try {
            await submitExam(examId, { force: true, idempotency_key: uuidv4() })
            router.push(`/student/result/${examId}`)
          } catch {
            //
          } finally {
            submitting.value = false
          }
        }
      })
    } else {
      // 警告
      Modal.warning({
        title: '防作弊提示',
        content: `检测到非正常切屏行为！请保持在考试页面答题。当前违规次数: ${switchCount.value}/${maxAllowed}。`,
        okText: '我知道了',
      })
    }
  }
}
</script>

<style scoped lang="less">
.exam-page {
  height: 100vh;
  background: #f5f5f5;
  overflow: hidden;
}

.exam-container {
  height: 100%;
  padding: 16px;
}

.left-panel,
.center-panel,
.right-panel {
  height: 100%;
}

.panel-content {
  background: #fff;
  border-radius: 8px;
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

// 左侧题型导航
.question-type-section {
  margin-bottom: 20px;

  .type-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .type-name {
      font-size: 16px;
      font-weight: bold;
      color: #1890ff;
    }

    .type-stats {
      font-size: 12px;
      color: #999;
    }
  }
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.question-number {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;

  &:hover {
    border-color: #1890ff;
    color: #1890ff;
  }

  &.answered {
    background: #52c41a;
    color: #fff;
    border-color: #52c41a;
  }

  &.current {
    background: #ff4d4f;
    color: #fff;
    border-color: #ff4d4f;
    font-weight: bold;
  }
}

// 中间题目区域
.exam-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.question-main {
  min-height: 500px;
}

.question-title-area {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  font-size: 16px;
  line-height: 1.8;

  .question-number {
    font-weight: bold;
    color: #1890ff;
    flex-shrink: 0;
  }

  .question-content {
    flex: 1;

    :deep(.katex) {
      font-size: 1.1em;
    }

    :deep(.katex-display) {
      margin: 0.5em 0;
      overflow-x: auto;
      overflow-y: hidden;
    }
  }
}

.options-area {
  margin-bottom: 24px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;

  &:hover {
    border-color: #1890ff;
    background: #f6ffed;
  }

  &.selected {
    border-color: #1890ff;
    background: #e6f7ff;
  }

  .option-label {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    border-radius: 50%;
    margin-right: 12px;
    font-weight: bold;
    color: #666;
    flex-shrink: 0;
  }

  .option-text {
    flex: 1;
    font-size: 15px;

    :deep(.katex) {
      font-size: 1em;
    }

    :deep(.katex-display) {
      margin: 0.3em 0;
    }
  }

  .check-icon {
    color: #1890ff;
    font-size: 20px;
  }
}

.subjective-area {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

// 答题结果
.result-area {
  margin-top: 24px;
  padding: 16px;
  background: #f6ffed;
  border-radius: 8px;
  border: 1px solid #b7eb8f;

  .result-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 12px;

    &.correct {
      color: #52c41a;
    }

    &.wrong {
      color: #ff4d4f;
    }
  }

  .result-detail {
    color: #666;

    p {
      margin: 4px 0;
    }
  }
}

// 底部导航
.bottom-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;

  .nav-info {
    color: #999;
    font-size: 14px;
  }
}

// 右侧信息面板
.info-card {
  margin-bottom: 16px;

  .paper-title {
    font-size: 16px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 8px;
  }
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0;

  .info-label {
    color: #666;
    font-size: 14px;
  }

  .info-value {
    font-size: 14px;
    font-weight: 500;

    &.highlight {
      color: #1890ff;
      font-weight: bold;
    }
  }
}

.submit-btn {
  margin-top: 16px;
}

// 滚动条样式
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f5f5f5;
}
</style>
