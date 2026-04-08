<template>
  <div class="practice-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-wrap">
      <a-spin size="large" tip="加载题目中..." />
    </div>

    <!-- 空状态 -->
    <a-empty
      v-else-if="!loading && questions.length === 0"
      description="该题库暂无题目"
      class="empty-state"
    />

    <!-- 练习主界面 -->
    <template v-else>
      <!-- 顶部进度栏 -->
      <div class="practice-header">
        <div class="header-left">
          <a-button type="text" @click="router.back()">
            <template #icon><ArrowLeftOutlined /></template>
          </a-button>
          <div class="header-title">
            <span class="bank-name">{{ bankName }}</span>
            <span class="question-count">第 {{ currentIndex + 1 }} / {{ questions.length }} 题</span>
          </div>
        </div>
        <div class="header-progress">
          <a-progress
            :percent="progressPercent"
            size="small"
            :show-info="false"
            class="progress-bar"
            :stroke-color="{ from: '#108ee9', to: '#87d068' }"
          />
          <span class="progress-text">{{ answeredCount }} / {{ questions.length }} 已答</span>
        </div>
      </div>

      <div class="practice-body">
        <!-- 左侧题号导航 -->
        <div class="left-nav">
          <div class="nav-title">题目列表</div>
          <div class="question-nav-grid">
            <div
              v-for="(q, idx) in questions"
              :key="q.id"
              :class="['nav-num', {
                'current': idx === currentIndex,
                'correct': answerResults[q.id]?.isCorrect === true,
                'wrong': answerResults[q.id]?.isCorrect === false,
                'in-wrong-book': q.inWrongBook
              }]"
              @click="goToQuestion(idx)"
            >
              {{ idx + 1 }}
            </div>
          </div>
          <div class="nav-legend">
            <span class="legend-item"><span class="dot correct"></span>答对</span>
            <span class="legend-item"><span class="dot wrong"></span>答错</span>
            <span class="legend-item"><span class="dot current-dot"></span>当前</span>
          </div>
        </div>

        <!-- 主答题区域 -->
        <div class="main-content">
          <div class="question-card">
            <!-- 题目信息 -->
            <div class="question-meta">
              <a-tag :color="typeColor(currentQuestion.questionType)">
                {{ typeLabel(currentQuestion.questionType) }}
              </a-tag>
              <a-tag color="orange" v-if="currentQuestion.difficulty">
                {{ diffLabel(currentQuestion.difficulty) }}
              </a-tag>
              <a-tag v-if="currentQuestion.inWrongBook" color="red">错题本</a-tag>
              <span v-if="currentQuestion.score" class="score-info">
                （{{ currentQuestion.score }} 分）
              </span>
            </div>

            <!-- 题目内容 -->
            <div class="question-content">
              <span class="q-number">{{ currentIndex + 1 }}.</span>
              <span class="q-text" v-html="formatQuestionContent(currentQuestion.content)"></span>
            </div>

            <!-- 选项区域 -->
            <div class="options-area">
              <!-- 单选题 -->
              <a-radio-group
                v-if="isSingleChoice(currentQuestion.questionType)"
                v-model:value="currentAnswer"
                :disabled="!!answerResults[currentQuestion.id]"
                class="option-group"
                @change="() => {}"
              >
                <a-radio
                  v-for="opt in parsedOptions(currentQuestion.options)"
                  :key="opt.label"
                  :value="opt.label"
                  :class="['option-item', getOptionClass(opt.label)]"
                >
                  <span class="opt-label">{{ opt.label }}</span>
                  <span class="opt-content" v-html="formatQuestionContent(opt.content)"></span>
                </a-radio>
              </a-radio-group>

              <!-- 多选题 -->
              <a-checkbox-group
                v-else-if="isMultiChoice(currentQuestion.questionType)"
                v-model:value="currentAnswerMulti"
                :disabled="!!answerResults[currentQuestion.id]"
                class="option-group"
              >
                <a-checkbox
                  v-for="opt in parsedOptions(currentQuestion.options)"
                  :key="opt.label"
                  :value="opt.label"
                  :class="['option-item', getOptionClass(opt.label)]"
                >
                  <span class="opt-label">{{ opt.label }}</span>
                  <span class="opt-content" v-html="formatQuestionContent(opt.content)"></span>
                </a-checkbox>
              </a-checkbox-group>

              <!-- 判断题 -->
              <a-radio-group
                v-else-if="isJudgment(currentQuestion.questionType)"
                v-model:value="currentAnswer"
                :disabled="!!answerResults[currentQuestion.id]"
                class="option-group"
              >
                <a-radio value="TRUE" :class="['option-item', getOptionClass('TRUE')]">
                  <span class="opt-label">✓</span>
                  <span class="opt-content">正确</span>
                </a-radio>
                <a-radio value="FALSE" :class="['option-item', getOptionClass('FALSE')]">
                  <span class="opt-label">✗</span>
                  <span class="opt-content">错误</span>
                </a-radio>
              </a-radio-group>
            </div>

            <!-- 提交按钮 -->
            <div class="submit-area" v-if="!answerResults[currentQuestion.id]">
              <a-button
                type="primary"
                size="large"
                :disabled="!hasAnswer"
                :loading="submitting"
                @click="submitAnswer"
                class="submit-btn"
              >
                确认答案
              </a-button>
            </div>

            <!-- 答题结果反馈 -->
            <div v-if="answerResults[currentQuestion.id]" class="result-feedback">
              <div :class="['result-banner', answerResults[currentQuestion.id].isCorrect ? 'correct-banner' : 'wrong-banner']">
                <component
                  :is="answerResults[currentQuestion.id].isCorrect ? CheckCircleFilled : CloseCircleFilled"
                  class="result-icon"
                />
                <span class="result-text">
                  {{ answerResults[currentQuestion.id].isCorrect ? '回答正确！' : '回答错误' }}
                </span>
              </div>

              <!-- 正确答案（答错时显示） -->
              <div v-if="!answerResults[currentQuestion.id].isCorrect" class="correct-answer">
                <span class="answer-label">正确答案：</span>
                <span class="answer-value">{{ formatCorrectAnswer(answerResults[currentQuestion.id].correctAnswer, currentQuestion.questionType) }}</span>
              </div>

              <!-- 题目解析 -->
              <div
                v-if="answerResults[currentQuestion.id].analysis || hasAnalysisImages(answerResults[currentQuestion.id])"
                class="analysis-section"
              >
                <div class="analysis-title">
                  <BulbOutlined />
                  题目解析
                </div>
                <div v-if="answerResults[currentQuestion.id].analysis" class="analysis-text">
                  {{ answerResults[currentQuestion.id].analysis }}
                </div>
                <div v-if="hasAnalysisImages(answerResults[currentQuestion.id])" class="analysis-images">
                  <img
                    v-for="(imgUrl, i) in parseAnalysisImages(answerResults[currentQuestion.id].analysisImages)"
                    :key="i"
                    :src="imgUrl"
                    class="analysis-img"
                    alt="解析图片"
                    @click="previewImage(imgUrl)"
                  />
                </div>
              </div>
            </div>

            <!-- 下一题按钮 -->
            <div class="nav-buttons" v-if="answerResults[currentQuestion.id]">
              <a-button
                v-if="currentIndex > 0"
                @click="goToQuestion(currentIndex - 1)"
              >
                <LeftOutlined /> 上一题
              </a-button>
              <a-button
                v-if="currentIndex < questions.length - 1"
                type="primary"
                @click="goToQuestion(currentIndex + 1)"
              >
                下一题 <RightOutlined />
              </a-button>
              <a-button
                v-if="currentIndex === questions.length - 1"
                type="primary"
                @click="finishPractice"
              >
                <CheckOutlined /> 完成练习
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 图片预览 -->
    <a-image
      v-if="previewVisible"
      :preview="{ visible: previewVisible, onVisibleChange: (v: boolean) => (previewVisible = v) }"
      :src="previewUrl"
      style="display: none"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  BulbOutlined,
  CheckOutlined,
} from '@ant-design/icons-vue'
import { practiceApi } from '@/api/practice'
import type { PracticeQuestion, AnswerResult } from '@/api/practice'
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

const bankId = Number(route.params.bankId)
const bankName = ref((route.query.name as string) || '题库练习')

const loading = ref(false)
const submitting = ref(false)
const questions = ref<PracticeQuestion[]>([])
const currentIndex = ref(0)
const currentAnswer = ref<string>('')
const currentAnswerMulti = ref<string[]>([])
const answerResults = ref<Record<number, AnswerResult>>({})
const previewVisible = ref(false)
const previewUrl = ref('')

const currentQuestion = computed(() => questions.value[currentIndex.value])

const hasAnswer = computed(() => {
  if (!currentQuestion.value) return false
  if (isMultiChoice(currentQuestion.value.questionType)) {
    return currentAnswerMulti.value.length > 0
  }
  return !!currentAnswer.value
})

const answeredCount = computed(() => Object.keys(answerResults.value).length)

const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round((answeredCount.value / questions.value.length) * 100)
})

async function loadQuestions() {
  loading.value = true
  try {
    const res = await practiceApi.getBankQuestions(bankId)
    questions.value = res.data || []
  } catch {
    message.error('加载题目失败')
  } finally {
    loading.value = false
  }
}

function goToQuestion(idx: number) {
  currentIndex.value = idx
  currentAnswer.value = ''
  currentAnswerMulti.value = []
}

async function submitAnswer() {
  if (!hasAnswer.value || submitting.value) return
  const q = currentQuestion.value

  let answer: string
  if (isMultiChoice(q.questionType)) {
    // 排序后拼接
    answer = [...currentAnswerMulti.value].sort().join('')
  } else {
    answer = currentAnswer.value
  }

  submitting.value = true
  try {
    const res = await practiceApi.submitAnswer({
      questionId: q.id,
      bankId,
      answer,
    })
    answerResults.value[q.id] = res.data
  } catch {
    message.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

function getOptionClass(label: string) {
  const result = answerResults.value[currentQuestion.value?.id]
  if (!result) return ''
  const correct = result.correctAnswer?.toUpperCase() || ''
  const labelUp = label.toUpperCase()

  if (correct.includes(labelUp)) return 'opt-correct'

  // 检查学生答案
  const studentAns = result.studentAnswer?.toUpperCase() || ''
  if (studentAns.includes(labelUp) && !correct.includes(labelUp)) return 'opt-wrong'
  return ''
}

function formatCorrectAnswer(answer: string, questionType: string) {
  if (!answer) return ''
  if (isJudgment(questionType)) {
    return answer.toUpperCase() === 'TRUE' ? '正确 ✓' : '错误 ✗'
  }
  return answer
}

function hasAnalysisImages(result: AnswerResult): boolean {
  if (!result?.analysisImages) return false
  try {
    const arr = JSON.parse(result.analysisImages)
    return Array.isArray(arr) && arr.length > 0
  } catch {
    return false
  }
}

function parseAnalysisImages(json: string): string[] {
  try {
    return JSON.parse(json) || []
  } catch {
    return []
  }
}

function previewImage(url: string) {
  previewUrl.value = url
  previewVisible.value = true
}

function parsedOptions(optionsJson: string): Array<{ label: string; content: string }> {
  if (!optionsJson) return []
  try {
    const parsed = JSON.parse(optionsJson)
    if (Array.isArray(parsed)) {
      return parsed.map((o: any) => ({
        label: o.label || o.key || o,
        content: o.content || o.value || o.text || '',
      }))
    }
  } catch {
    // 可能是 "A.内容\nB.内容" 格式
  }
  return []
}

function isSingleChoice(type: string) {
  return type?.toUpperCase().includes('SINGLE') || type?.toUpperCase() === 'SINGLE_CHOICE'
}

function isMultiChoice(type: string) {
  return type?.toUpperCase().includes('MULTI') || type?.toUpperCase() === 'MULTIPLE_CHOICE'
}

function isJudgment(type: string) {
  return type?.toUpperCase().includes('JUDG') || type?.toUpperCase() === 'TRUE_FALSE'
}

function typeLabel(type: string) {
  if (isSingleChoice(type)) return '单选题'
  if (isMultiChoice(type)) return '多选题'
  if (isJudgment(type)) return '判断题'
  return '主观题'
}

function typeColor(type: string) {
  if (isSingleChoice(type)) return 'blue'
  if (isMultiChoice(type)) return 'purple'
  if (isJudgment(type)) return 'green'
  return 'orange'
}

function diffLabel(diff: string) {
  const map: Record<string, string> = {
    EASY: '简单', MEDIUM: '中等', HARD: '困难',
    easy: '简单', medium: '中等', hard: '困难',
  }
  return map[diff] || diff
}

function finishPractice() {
  const correct = Object.values(answerResults.value).filter(r => r.isCorrect).length
  const total = questions.value.length
  const answered = answeredCount.value

  Modal.success({
    title: '练习完成',
    content: `本次练习：答题 ${answered} 题，答对 ${correct} 题，正确率 ${answered > 0 ? Math.round(correct / answered * 100) : 0}%`,
    okText: '返回题库',
    onOk: () => router.back(),
  })
}

onMounted(() => {
  loadQuestions()
})
</script>

<style scoped lang="less">
.practice-page {
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 80px);
}

.loading-wrap,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 60px;
}

/* 顶部进度栏 */
.practice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  display: flex;
  flex-direction: column;
}

.bank-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
}

.question-count {
  font-size: 12px;
  color: #888;
}

.header-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
}

.progress-bar {
  flex: 1;
}

.progress-text {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
}

/* 主布局 */
.practice-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

/* 左侧题号导航 */
.left-nav {
  width: 160px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  position: sticky;
  top: 16px;
}

.nav-title {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  margin-bottom: 12px;
}

.question-nav-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 12px;
}

.nav-num {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  background: #f5f5f5;
  color: #666;
  border: 1px solid transparent;
  transition: all 0.15s;

  &:hover {
    background: #e6f4ff;
    color: #1677ff;
  }

  &.current {
    background: #1677ff;
    color: #fff;
    border-color: #1677ff;
  }

  &.correct {
    background: #f6ffed;
    border-color: #52c41a;
    color: #52c41a;
  }

  &.wrong {
    background: #fff2f0;
    border-color: #ff4d4f;
    color: #ff4d4f;
  }

  &.in-wrong-book {
    border-color: #faad14;
  }
}

.nav-legend {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: #888;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;

  &.correct { background: #52c41a; }
  &.wrong { background: #ff4d4f; }
  &.current-dot { background: #1677ff; }
}

/* 主内容区 */
.main-content {
  flex: 1;
  min-width: 0;
}

.question-card {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.score-info {
  font-size: 13px;
  color: #888;
}

/* 题目内容 */
.question-content {
  font-size: 16px;
  line-height: 1.7;
  color: #1a1a1a;
  margin-bottom: 20px;
  display: flex;
  gap: 6px;
}

.q-number {
  font-weight: 700;
  color: #1677ff;
  flex-shrink: 0;
}

.q-text {
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

/* 选项 */
.options-area {
  margin-bottom: 20px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border: 1.5px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  background: #fafafa;
  width: 100%;
  margin: 0 !important;

  &:hover {
    background: #e6f4ff;
    border-color: #91caff;
  }

  &.opt-correct {
    background: #f6ffed;
    border-color: #52c41a;
    color: #237804;
  }

  &.opt-wrong {
    background: #fff2f0;
    border-color: #ff4d4f;
    color: #cf1322;
  }

  :deep(.ant-radio),
  :deep(.ant-checkbox) {
    margin-right: 8px;
    margin-top: 2px;
    flex-shrink: 0;
  }
}

.opt-label {
  font-weight: 600;
  margin-right: 8px;
  flex-shrink: 0;
}

.opt-content {
  flex: 1;
  line-height: 1.5;

  :deep(.katex) {
    font-size: 1em;
  }

  :deep(.katex-display) {
    margin: 0.3em 0;
  }
}

/* 提交按钮 */
.submit-area {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.submit-btn {
  min-width: 160px;
  height: 42px;
  font-size: 15px;
}

/* 结果反馈 */
.result-feedback {
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;

  &.correct-banner {
    background: #f6ffed;
    color: #237804;
    border: 1px solid #b7eb8f;
  }

  &.wrong-banner {
    background: #fff2f0;
    color: #cf1322;
    border: 1px solid #ffccc7;
  }
}

.result-icon {
  font-size: 22px;
}

.correct-answer {
  font-size: 14px;
  padding: 10px 14px;
  background: #f6ffed;
  border-radius: 6px;
  color: #237804;
}

.answer-label {
  font-weight: 600;
}

.answer-value {
  font-size: 16px;
  font-weight: 700;
  color: #389e0d;
}

/* 解析 */
.analysis-section {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  padding: 14px;
}

.analysis-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #ad6800;
  margin-bottom: 8px;
  font-size: 14px;
}

.analysis-text {
  font-size: 14px;
  color: #595959;
  line-height: 1.7;
}

.analysis-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.analysis-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #e8e8e8;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }
}

/* 导航按钮 */
.nav-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

/* 响应式 */
@media (max-width: 768px) {
  .practice-body {
    flex-direction: column;
  }

  .left-nav {
    width: 100%;
    position: static;
  }

  .question-nav-grid {
    grid-template-columns: repeat(8, 1fr);
  }

  .question-card {
    padding: 16px;
  }
}
</style>
