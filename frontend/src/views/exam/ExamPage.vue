<template>
  <ExamLayout
    :exam-title="examData?.name || '正在加载考试...'"
    :exam-info="examInfo"
    :end-time="endTime"
    :questions="questions"
    :answers="answers"
    :current-index="currentIndex"
    :subjective-uploads="subjectiveUploads"
    :submitting="submitting"
    @navigate="onNavigate"
    @answer-change="onAnswerChange"
    @submit="onSubmit"
    @time-out="onTimeOut"
  >
    <template #default="{ currentQuestion, currentAnswer, onAnswerChange }">
      <!-- 加载状态 -->
      <a-skeleton v-if="loading" active :paragraph="{ rows: 6 }" />
      
      <!-- 网络异常提示 -->
      <a-alert
        v-if="networkError"
        message="网络连接异常"
        description="您的答案将在网络恢复后自动保存，请继续答题"
        type="warning"
        show-icon
        banner
        closable
        @close="networkError = false"
        style="margin-bottom: 16px"
      />

      <!-- 题目展示 -->
      <div v-else-if="currentQuestion" class="question-wrapper">
        <!-- 题目头部 -->
        <div class="question-header">
          <div class="header-left">
            <span class="question-number">第 {{ currentIndex + 1 }} 题</span>
            <a-tag :color="getTypeColor(currentQuestion.question_type)">
              {{ getTypeLabel(currentQuestion.question_type) }}
            </a-tag>
            <a-tag color="warning">{{ currentQuestion.score }} 分</a-tag>
            <a-tag v-if="currentQuestion.difficulty" :color="getDifficultyColor(currentQuestion.difficulty)">
              {{ currentQuestion.difficulty }}
            </a-tag>
          </div>
          <div class="header-right">
            <a-tooltip title="自动保存已开启">
              <span class="auto-save-status">
                <CheckCircleOutlined v-if="saveStatus === 'saved'" style="color: #52c41a" />
                <SyncOutlined v-else-if="saveStatus === 'saving'" spin style="color: #1890ff" />
                <ExclamationCircleOutlined v-else style="color: #faad14" />
                {{ saveStatusText }}
              </span>
            </a-tooltip>
          </div>
        </div>

        <!-- 题目内容 -->
        <div class="question-body">
          <div class="question-content" v-html="currentQuestion.content"></div>
          
          <!-- 题目图片 -->
          <div v-if="currentQuestion.images?.length" class="question-images">
            <a-image
              v-for="(img, idx) in currentQuestion.images"
              :key="idx"
              :src="img"
              :width="200"
              :preview="{ mask: '查看大图' }"
            />
          </div>
        </div>

        <!-- 答题区域 - 根据题型切换组件 -->
        <div class="answer-area">
          <SingleChoice
            v-if="currentQuestion.question_type === 'single_choice'"
            :options="currentQuestion.options || []"
            :model-value="currentAnswer"
            @update:model-value="onAnswerChange"
          />
          
          <MultiChoice
            v-else-if="currentQuestion.question_type === 'multiple_choice'"
            :options="currentQuestion.options || []"
            :model-value="currentAnswer"
            @update:model-value="onAnswerChange"
          />
          
          <Judgment
            v-else-if="currentQuestion.question_type === 'judgment'"
            :model-value="currentAnswer"
            @update:model-value="onAnswerChange"
          />
          
          <Subjective
            v-else-if="currentQuestion.question_type === 'subjective'"
            :model-value="currentAnswer"
            :uploads="subjectiveUploads.get(currentQuestion.question_id) || []"
            @update:model-value="onAnswerChange"
            @upload-success="onUploadSuccess"
            @upload-remove="onUploadRemove"
          />
          
          <div v-else class="unknown-type">
            <a-textarea
              :value="currentAnswer"
              :rows="6"
              placeholder="请输入答案..."
              @update:value="onAnswerChange"
            />
          </div>
        </div>

        <!-- 答题提示 -->
        <div class="question-tips">
          <a-alert
            v-if="currentQuestion.question_type === 'subjective'"
            message="主观题提示"
            description="请完成文字作答并上传相关附件（图片、文档等），文件大小不超过 50MB"
            type="info"
            show-icon
          />
          <a-alert
            v-else-if="currentQuestion.question_type === 'multiple_choice'"
            message="多选题评分规则"
            description="全对得满分，少选得部分分，多选或错选不得分"
            type="info"
            show-icon
          />
        </div>
      </div>

      <!-- 无题目提示 -->
      <a-empty v-else description="暂无题目" />
    </template>
  </ExamLayout>

  <!-- 提交确认弹窗 -->
  <SubmitConfirmModal
    v-model:visible="submitModalVisible"
    :questions="questions"
    :answers="answers"
    :subjective-uploads="subjectiveUploads"
    :submitting="submitting"
    @confirm="confirmSubmit"
  />

  <!-- 强制提交弹窗 -->
  <ForceSubmitModal
    v-model:visible="forceSubmitVisible"
    @confirm="forceSubmit"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons-vue'
import { v4 as uuidv4 } from 'uuid'
import ExamLayout from '@/layouts/ExamLayout.vue'
import SingleChoice from '@/components/exam/SingleChoice.vue'
import MultiChoice from '@/components/exam/MultiChoice.vue'
import Judgment from '@/components/exam/Judgment.vue'
import Subjective from '@/components/exam/Subjective.vue'
import SubmitConfirmModal from '@/components/exam/SubmitConfirmModal.vue'
import ForceSubmitModal from '@/components/exam/ForceSubmitModal.vue'
import { getExamQuestions, saveAnswer, submitExam, getExamProgress } from '@/api/exams'
import type { SubjectiveUpload } from '@/layouts/ExamLayout.vue'

// ==================== 类型定义 ====================
interface ExamQuestion {
  question_id: number
  order: number
  question_type: 'single_choice' | 'multiple_choice' | 'judgment' | 'subjective' | string
  content: string
  images: string[]
  options: { label: string; content: string }[] | null
  score: number
  difficulty?: string
}

interface ExamData {
  id: number
  name: string
  description: string | null
  start_time: string
  end_time: string
  duration: number
  questions: ExamQuestion[]
}

// ==================== WebSocket 消息类型 ====================
enum WebSocketMessageType {
  ANSWER_SAVED = 'ANSWER_SAVED',
  TIME_SYNC = 'TIME_SYNC',
  SUBJECTIVE_UPLOADED = 'SUBJECTIVE_UPLOADED',
  EXAM_ENDING = 'EXAM_ENDING',
  FORCE_SUBMIT = 'FORCE_SUBMIT',
}

interface WebSocketMessage {
  type: WebSocketMessageType
  data: any
}

// ==================== 路由和状态 ====================
const route = useRoute()
const router = useRouter()
const examId = Number(route.params.examId)

// ==================== Refs ====================
const loading = ref(true)
const submitting = ref(false)
const networkError = ref(false)
const saveStatus = ref<'saved' | 'saving' | 'error'>('saved')
const saveStatusText = computed(() => ({
  saved: '已保存',
  saving: '保存中...',
  error: '保存失败',
}[saveStatus.value]))

const examData = ref<ExamData | null>(null)
const questions = ref<ExamQuestion[]>([])
const answers = ref<Map<number, string>>(new Map())
const subjectiveUploads = ref<Map<number, SubjectiveUpload[]>>(new Map())
const currentIndex = ref(0)

// 弹窗状态
const submitModalVisible = ref(false)
const forceSubmitVisible = ref(false)

// WebSocket
let ws: WebSocket | null = null

// 自动保存防抖定时器
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

// ==================== 计算属性 ====================
const endTime = computed(() => examData.value?.end_time || '')

const examInfo = computed(() => {
  if (!examData.value) return undefined
  return {
    totalQuestions: questions.value.length,
    totalScore: questions.value.reduce((sum, q) => sum + q.score, 0),
    duration: examData.value.duration,
  }
})

// ==================== 方法 ====================
function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    single_choice: '单选题',
    multiple_choice: '多选题',
    judgment: '判断题',
    subjective: '主观题',
  }
  return map[type] || type
}

function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    single_choice: 'blue',
    multiple_choice: 'purple',
    judgment: 'cyan',
    subjective: 'orange',
  }
  return map[type] || 'default'
}

function getDifficultyColor(difficulty: string): string {
  const map: Record<string, string> = {
    easy: 'success',
    medium: 'warning',
    hard: 'error',
  }
  return map[difficulty] || 'default'
}

function onNavigate(index: number) {
  currentIndex.value = index
}

// 答案变更处理（自动保存）
function onAnswerChange(questionId: number, answer: string) {
  answers.value.set(questionId, answer)
  
  // 清除之前的定时器
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  // 设置保存状态
  saveStatus.value = 'saving'
  
  // 防抖自动保存（延迟 1 秒）
  autoSaveTimer = setTimeout(() => {
    saveAnswerToServer(questionId, answer)
  }, 1000)
}

// 保存答案到服务器
async function saveAnswerToServer(questionId: number, answer: string) {
  try {
    const uploads = subjectiveUploads.value.get(questionId)
    await saveAnswer(examId, {
      question_id: questionId,
      answer: answer,
      uploaded_files: uploads?.map(u => u.file_id),
    })
    saveStatus.value = 'saved'
    networkError.value = false
  } catch (error) {
    saveStatus.value = 'error'
    networkError.value = true
    console.error('保存答案失败:', error)
  }
}

// 主观题上传成功
function onUploadSuccess(questionId: number, file: SubjectiveUpload) {
  const uploads = subjectiveUploads.value.get(questionId) || []
  uploads.push(file)
  subjectiveUploads.value.set(questionId, uploads)
  
  // 立即保存
  const answer = answers.value.get(questionId) || ''
  saveAnswerToServer(questionId, answer)
}

// 主观题删除文件
function onUploadRemove(questionId: number, fileId: string) {
  const uploads = subjectiveUploads.value.get(questionId) || []
  const newUploads = uploads.filter(u => u.file_id !== fileId)
  subjectiveUploads.value.set(questionId, newUploads)
  
  // 立即保存
  const answer = answers.value.get(questionId) || ''
  saveAnswerToServer(questionId, answer)
}

// 点击交卷
function onSubmit() {
  submitModalVisible.value = true
}

// 确认提交
async function confirmSubmit() {
  await doSubmit(false)
}

// 强制提交（倒计时结束）
async function forceSubmit() {
  await doSubmit(true)
}

// 倒计时结束
function onTimeOut() {
  forceSubmitVisible.value = true
}

// 执行提交
async function doSubmit(force: boolean) {
  submitting.value = true
  try {
    const res = await submitExam(examId, {
      force,
      idempotency_key: uuidv4(),
    })
    
    if (res.code === 200) {
      message.success(force ? '考试时间已到，已自动交卷' : '交卷成功！')
      router.push(`/student/result/${examId}`)
    } else {
      message.error(res.message || '交卷失败')
    }
  } catch (error) {
    message.error('交卷失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// ==================== WebSocket ====================
function initWebSocket() {
  // 使用 wss 或 ws 协议
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  // 获取 token 用于 WebSocket 认证
  const token = localStorage.getItem('token')
  const wsUrl = `${protocol}//${window.location.host}/ws/exam/${examId}?token=${token}`
  
  ws = new WebSocket(wsUrl)
  
  ws.onopen = () => {
    console.log('WebSocket 连接成功')
  }
  
  ws.onmessage = (event) => {
    try {
      const msg: WebSocketMessage = JSON.parse(event.data)
      handleWebSocketMessage(msg)
    } catch (error) {
      console.error('WebSocket 消息解析失败:', error)
    }
  }
  
  ws.onerror = (error) => {
    console.error('WebSocket 错误:', error)
  }
  
  ws.onclose = () => {
    console.log('WebSocket 连接关闭')
    // 尝试重连
    setTimeout(() => {
      initWebSocket()
    }, 5000)
  }
}

function handleWebSocketMessage(msg: WebSocketMessage) {
  switch (msg.type) {
    case WebSocketMessageType.ANSWER_SAVED:
      // 答案已保存确认
      message.success('答案已自动保存', 1)
      break
      
    case WebSocketMessageType.TIME_SYNC:
      // 时间同步
      if (examData.value && msg.data.end_time) {
        examData.value.end_time = msg.data.end_time
      }
      break
      
    case WebSocketMessageType.SUBJECTIVE_UPLOADED:
      // 主观题上传完成
      message.success('文件上传成功')
      break
      
    case WebSocketMessageType.EXAM_ENDING:
      // 考试即将结束提醒
      message.warning('考试即将结束，请尽快完成答题！', 5)
      break
      
    case WebSocketMessageType.FORCE_SUBMIT:
      // 强制提交
      forceSubmitVisible.value = true
      break
  }
}

// ==================== 页面加载 ====================
async function loadExamData() {
  loading.value = true
  try {
    // 获取考试题目
    const res = await getExamQuestions(examId)
    examData.value = res.data
    questions.value = res.data.questions || []
    
    // 获取答题进度（断网恢复）
    try {
      const progressRes = await getExamProgress(examId)
      if (progressRes.data?.answers) {
        // 恢复已保存的答案
        for (const [qid, answer] of Object.entries(progressRes.data.answers)) {
          answers.value.set(Number(qid), answer as string)
        }
      }
      if (progressRes.data?.uploads) {
        // 恢复已上传的文件
        for (const [qid, files] of Object.entries(progressRes.data.uploads)) {
          subjectiveUploads.value.set(Number(qid), files as SubjectiveUpload[])
        }
      }
    } catch (error) {
      console.log('获取答题进度失败:', error)
    }
    
    // 初始化 WebSocket
    initWebSocket()
    
  } catch (error) {
    message.error('加载考试数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadExamData()
  
  // 页面刷新/关闭警告
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  // 关闭 WebSocket
  if (ws) {
    ws.close()
  }
  
  // 清除定时器
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

function handleBeforeUnload(e: BeforeUnloadEvent) {
  // 如果有未保存的答案，提示用户
  if (saveStatus.value === 'saving') {
    e.preventDefault()
    e.returnValue = '您有未保存的答案，确定要离开吗？'
    return e.returnValue
  }
}
</script>

<style scoped>
.question-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.question-number {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.header-right {
  display: flex;
  align-items: center;
}

.auto-save-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #8c8c8c;
}

.question-body {
  padding: 16px 0;
}

.question-content {
  font-size: 16px;
  line-height: 1.8;
  color: #262626;
  word-break: break-word;
}

.question-content :deep(p) {
  margin-bottom: 12px;
}

.question-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.question-images {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.answer-area {
  padding: 16px 0;
  min-height: 200px;
}

.question-tips {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.unknown-type {
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}
</style>
