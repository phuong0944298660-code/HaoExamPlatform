<template>
  <div :class="['exam-layout', { 'is-fullscreen': isFullscreen }]">
    <!-- 顶部导航栏 -->
    <header class="exam-header">
      <div class="header-left">
        <h1 class="exam-title">{{ examTitle }}</h1>
        <a-tag v-if="examInfo" color="blue" class="exam-meta">
          {{ examInfo.totalQuestions }}题 / {{ examInfo.totalScore }}分
        </a-tag>
      </div>
      
      <div class="header-center">
        <ExamCountdown
          v-if="endTime"
          :end-time="endTime"
          :warning-minutes="10"
          @warning="onTimeWarning"
          @timeout="onTimeOut"
        />
      </div>
      
      <div class="header-right">
        <a-button 
          type="primary" 
          danger 
          size="large"
          :loading="submitting"
          @click="onSubmitClick"
        >
          <template #icon><UploadOutlined /></template>
          交卷
        </a-button>
        <a-button 
          type="text" 
          class="fullscreen-btn"
          @click="toggleFullscreen"
        >
          <FullscreenExitOutlined v-if="isFullscreen" />
          <FullscreenOutlined v-else />
        </a-button>
      </div>
    </header>

    <!-- 主体内容区 -->
    <main class="exam-main">
      <div class="exam-container">
        <!-- 左侧答题卡 -->
        <aside class="exam-sidebar">
          <AnswerSheet
            :questions="questions"
            :answers="answers"
            :current-index="currentIndex"
            :subjective-uploads="subjectiveUploads"
            @navigate="onNavigate"
          />
        </aside>

        <!-- 右侧题目内容 -->
        <section class="exam-content">
          <slot 
            :current-question="currentQuestion"
            :current-answer="currentAnswer"
            :on-answer-change="onAnswerChange"
          />
        </section>
      </div>
    </main>

    <!-- 底部导航 -->
    <footer class="exam-footer">
      <div class="footer-nav">
        <a-button 
          :disabled="currentIndex <= 0"
          size="large"
          @click="onPrev"
        >
          <template #icon><LeftOutlined /></template>
          上一题
        </a-button>
        
        <span class="nav-info">
          第 {{ currentIndex + 1 }} / {{ questions.length }} 题
        </span>
        
        <a-button 
          :disabled="currentIndex >= questions.length - 1"
          type="primary"
          size="large"
          @click="onNext"
        >
          下一题
          <template #icon><RightOutlined /></template>
        </a-button>
      </div>
    </footer>

    <!-- 离开页面警告 -->
    <a-modal
      v-model:visible="leaveWarningVisible"
      title="⚠️ 警告"
      :closable="false"
      :mask-closable="false"
      :footer="null"
      centered
    >
      <div class="warning-content">
        <p>考试期间请不要离开此页面！</p>
        <p class="warning-count">您已离开 {{ leaveCount }} 次</p>
        <a-button type="primary" block size="large" @click="continueExam">
          我知道了，继续考试
        </a-button>
      </div>
    </a-modal>

    <!-- 全屏提示 -->
    <a-modal
      v-model:visible="fullscreenTipVisible"
      title="进入全屏考试模式"
      :closable="false"
      :mask-closable="false"
      :footer="null"
      centered
    >
      <div class="fullscreen-tip">
        <FullscreenOutlined class="tip-icon" />
        <p>考试即将开始，建议进入全屏模式以获得最佳体验</p>
        <a-button type="primary" block size="large" @click="enterFullscreen">
          进入全屏模式
        </a-button>
        <a-button type="link" block @click="fullscreenTipVisible = false">
          暂不进入
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  UploadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons-vue'
import ExamCountdown from '@/components/exam/ExamCountdown.vue'
import AnswerSheet from '@/components/exam/AnswerSheet.vue'

/** 考试题目 */
export interface ExamQuestionItem {
  question_id: number
  order: number
  question_type: 'single_choice' | 'multiple_choice' | 'judgment' | 'subjective' | string
  content: string
  images: string[]
  options: { label: string; content: string }[] | null
  score: number
  difficulty?: string
}

/** 主观题上传文件 */
export interface SubjectiveUpload {
  file_id: string
  file_name: string
  file_url: string
  uploaded_at: string
}

const props = defineProps<{
  /** 考试标题 */
  examTitle: string
  /** 考试信息 */
  examInfo?: {
    totalQuestions: number
    totalScore: number
    duration: number
  }
  /** 考试结束时间 */
  endTime: string
  /** 题目列表 */
  questions: ExamQuestionItem[]
  /** 答案映射 */
  answers: Map<number | string, string>
  /** 当前题目索引 */
  currentIndex: number
  /** 主观题上传文件映射 question_id -> files */
  subjectiveUploads?: Map<number, SubjectiveUpload[]>
  /** 是否正在提交 */
  submitting?: boolean
}>()

const emit = defineEmits<{
  /** 导航到指定题目 */
  navigate: [index: number]
  /** 答案变更 */
  'answer-change': [questionId: number, answer: string]
  /** 点击交卷 */
  submit: []
  /** 倒计时结束 */
  'time-out': []
}>()

// ==================== 状态 ====================
const isFullscreen = ref(false)
const leaveWarningVisible = ref(false)
const leaveCount = ref(0)
const fullscreenTipVisible = ref(false)

// ==================== 计算属性 ====================
const currentQuestion = computed(() => props.questions[props.currentIndex])

const currentAnswer = computed({
  get: () => props.answers.get(currentQuestion.value?.question_id) || '',
  set: (value: string) => {
    if (currentQuestion.value) {
      emit('answer-change', currentQuestion.value.question_id, value)
    }
  },
})

// ==================== 方法 ====================
function onNavigate(index: number) {
  emit('navigate', index)
}

function onPrev() {
  if (props.currentIndex > 0) {
    emit('navigate', props.currentIndex - 1)
  }
}

function onNext() {
  if (props.currentIndex < props.questions.length - 1) {
    emit('navigate', props.currentIndex + 1)
  }
}

function onAnswerChange(value: string) {
  if (currentQuestion.value) {
    emit('answer-change', currentQuestion.value.question_id, value)
  }
}

function onSubmitClick() {
  emit('submit')
}

function onTimeWarning() {
  message.warning('考试时间即将结束，请抓紧时间答题！', 5)
}

function onTimeOut() {
  emit('time-out')
}

// ==================== 全屏控制 ====================
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    enterFullscreen()
  } else {
    exitFullscreen()
  }
}

function enterFullscreen() {
  const elem = document.documentElement
  if (elem.requestFullscreen) {
    elem.requestFullscreen()
  }
  isFullscreen.value = true
  fullscreenTipVisible.value = false
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  }
  isFullscreen.value = false
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// ==================== 防作弊：多层次完整性检测 ====================

/** 页面可见性变化检测 */
function onVisibilityChange() {
  if (document.hidden) {
    leaveCount.value++
    leaveWarningVisible.value = true
    // 记录离开事件到服务器
    recordCheatingAttempt('page_hidden')
  }
}

/** 窗口失焦检测 */
function onWindowBlur() {
  leaveCount.value++
  leaveWarningVisible.value = true
  recordCheatingAttempt('window_blur')
}

/** 右键菜单禁用 */
function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  message.warning('考试期间禁止使用右键菜单')
  return false
}

/** 选择文本禁用 */
function onSelectStart(e: Event) {
  e.preventDefault()
  return false
}

/** 复制禁用 */
function onCopy(e: ClipboardEvent) {
  e.preventDefault()
  message.warning('考试期间禁止复制内容')
  return false
}

/** 粘贴禁用 */
function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  message.warning('考试期间禁止粘贴内容')
  return false
}

/** 键盘快捷键拦截（防开发者工具） */
function onKeyDown(e: KeyboardEvent) {
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  const ctrl = isMac ? e.metaKey : e.ctrlKey

  // 阻止打开开发者工具的快捷键
  const blockedKeys = [
    { key: 'F12', detect: () => e.key === 'F12' },
    { key: 'Ctrl+Shift+I', detect: () => ctrl && e.shiftKey && e.key === 'I' },
    { key: 'Ctrl+Shift+C', detect: () => ctrl && e.shiftKey && e.key === 'C' },
    { key: 'Ctrl+Shift+J', detect: () => ctrl && e.shiftKey && e.key === 'J' },
    { key: 'Ctrl+Shift+K', detect: () => ctrl && e.shiftKey && e.key === 'K' },
    { key: 'Ctrl+I', detect: () => ctrl && e.key === 'I' },
  ]

  for (const blocked of blockedKeys) {
    if (blocked.detect()) {
      e.preventDefault()
      recordCheatingAttempt(`keyboard_shortcut_${blocked.key}`)
      return
    }
  }
}

/** 检测多窗口/标签页 */
function checkMultipleWindows() {
  // 使用 localStorage 检测多个打开的标签页
  const tabId = `exam-tab-${Date.now()}`
  const activeTab = localStorage.getItem('exam-active-tab')

  if (activeTab && activeTab !== tabId) {
    message.error('检测到多个标签页，请在单个标签页中完成考试')
    recordCheatingAttempt('multiple_tabs_detected')
  }

  localStorage.setItem('exam-active-tab', tabId)
}

/** 防止拖拽和下载 */
function onDragStart(e: DragEvent) {
  e.preventDefault()
  return false
}

/** 防止浏览器后退/前进 */
function preventNavigation(e: PopStateEvent) {
  if (window.history.length > 1) {
    window.history.pushState(null, '', window.location.href)
    message.warning('考试期间禁止浏览器导航')
    recordCheatingAttempt('back_navigation_attempt')
  }
}

/** 记录作弊尝试到服务器 */
async function recordCheatingAttempt(attemptType: string) {
  try {
    // 这里可以调用API记录作弊尝试
    // await request.post('/api/v1/exams/integrity-logs', {
    //   exam_id: examId,
    //   attempt_type: attemptType,
    //   timestamp: new Date().toISOString()
    // })
    console.warn(`[诚信检测] ${attemptType}`, new Date().toISOString())
  } catch (error) {
    console.error('记录作弊尝试失败:', error)
  }
}

function continueExam() {
  leaveWarningVisible.value = false
  // 重新进入全屏
  if (!document.fullscreenElement) {
    enterFullscreen()
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  // ========== 基础防作弊 ==========
  // 监听全屏变化
  document.addEventListener('fullscreenchange', onFullscreenChange)

  // 监听页面可见性变化（标签页切换）
  document.addEventListener('visibilitychange', onVisibilityChange)

  // 监听窗口失焦
  window.addEventListener('blur', onWindowBlur)

  // ========== 防止信息泄露 ==========
  // 禁用右键菜单
  document.addEventListener('contextmenu', onContextMenu)

  // 禁用文本选择
  document.addEventListener('selectstart', onSelectStart)

  // 禁用复制
  document.addEventListener('copy', onCopy)

  // 禁用粘贴
  document.addEventListener('paste', onPaste)

  // ========== 防止工具和快捷键滥用 ==========
  // 键盘快捷键拦截
  window.addEventListener('keydown', onKeyDown)

  // 防止浏览器导航
  window.addEventListener('popstate', preventNavigation)

  // 防止拖拽
  document.addEventListener('dragstart', onDragStart)

  // ========== 多窗口检测 ==========
  checkMultipleWindows()
  window.addEventListener('storage', () => {
    checkMultipleWindows()
  })

  // 显示全屏提示
  setTimeout(() => {
    fullscreenTipVisible.value = true
  }, 500)
})

onUnmounted(() => {
  // 清理所有事件监听
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('blur', onWindowBlur)
  document.removeEventListener('contextmenu', onContextMenu)
  document.removeEventListener('selectstart', onSelectStart)
  document.removeEventListener('copy', onCopy)
  document.removeEventListener('paste', onPaste)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('popstate', preventNavigation)
  document.removeEventListener('dragstart', onDragStart)
  window.removeEventListener('storage', () => {
    checkMultipleWindows()
  })

  // 清理 localStorage
  localStorage.removeItem('exam-active-tab')
})
</script>

<style scoped>
.exam-layout {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.exam-layout.is-fullscreen {
  background: #f5f7fa;
}

/* 顶部导航栏 */
.exam-header {
  height: 64px;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.exam-title {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.exam-meta {
  font-size: 13px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.fullscreen-btn {
  color: #fff !important;
  font-size: 18px;
}

/* 主体内容 */
.exam-main {
  flex: 1;
  padding: 16px 24px;
  overflow: hidden;
}

.exam-container {
  display: flex;
  gap: 16px;
  height: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

/* 左侧答题卡 */
.exam-sidebar {
  width: 280px;
  flex-shrink: 0;
}

/* 右侧题目内容 */
.exam-content {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
  overflow-y: auto;
}

/* 底部导航 */
.exam-footer {
  height: 64px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
}

.footer-nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-info {
  font-size: 15px;
  color: #595959;
  font-weight: 500;
  min-width: 120px;
  text-align: center;
}

/* 警告弹窗 */
.warning-content {
  text-align: center;
  padding: 16px;
}

.warning-content p {
  font-size: 16px;
  color: #262626;
  margin-bottom: 8px;
}

.warning-count {
  color: #ff4d4f !important;
  font-weight: 600;
}

/* 全屏提示 */
.fullscreen-tip {
  text-align: center;
  padding: 24px;
}

.tip-icon {
  font-size: 48px;
  color: #1890ff;
  margin-bottom: 16px;
}

.fullscreen-tip p {
  font-size: 16px;
  color: #595959;
  margin-bottom: 24px;
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .exam-sidebar {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .exam-container {
    flex-direction: column;
  }
  
  .exam-sidebar {
    width: 100%;
    order: 2;
  }
  
  .exam-content {
    order: 1;
    min-height: 400px;
  }
  
  .exam-title {
    font-size: 14px;
  }
  
  .header-center {
    display: none;
  }
}
</style>
