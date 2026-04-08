<template>
  <a-modal
    :visible="visible"
    title="确认交卷"
    :width="560"
    :closable="false"
    :mask-closable="false"
    :confirm-loading="submitting"
    @ok="onConfirm"
    @cancel="onCancel"
  >
    <div class="submit-confirm">
      <!-- 答题统计 -->
      <div class="stats-section">
        <h4 class="section-title">📊 答题统计</h4>
        <div class="stats-grid">
          <div class="stat-item stat-total">
            <span class="stat-number">{{ totalQuestions }}</span>
            <span class="stat-label">总题数</span>
          </div>
          <div class="stat-item stat-answered">
            <span class="stat-number">{{ answeredCount }}</span>
            <span class="stat-label">已答</span>
          </div>
          <div class="stat-item stat-unanswered">
            <span class="stat-number">{{ unansweredCount }}</span>
            <span class="stat-label">未答</span>
          </div>
          <div class="stat-item stat-progress">
            <a-progress
              type="circle"
              :percent="progressPercent"
              :size="60"
              :stroke-color="progressPercent === 100 ? '#52c41a' : '#1890ff'"
            />
            <span class="stat-label">完成度</span>
          </div>
        </div>
      </div>

      <a-divider />

      <!-- 主观题检查 -->
      <div v-if="subjectiveQuestions.length > 0" class="subjective-section">
        <h4 class="section-title">
          📝 主观题检查
          <a-tag :color="subjectiveCompleted ? 'success' : 'warning'">
            {{ subjectiveCompleted ? '已完成' : '未完成' }}
          </a-tag>
        </h4>
        
        <div class="subjective-list">
          <div
            v-for="q in subjectiveQuestions"
            :key="q.question_id"
            :class="['subjective-item', { 'is-completed': isSubjectiveCompleted(q.question_id) }]"
          >
            <div class="item-left">
              <span class="question-order">第 {{ getQuestionIndex(q.question_id) + 1 }} 题</span>
              <span class="question-status">
                <template v-if="isSubjectiveCompleted(q.question_id)">
                  <CheckCircleOutlined style="color: #52c41a" />
                  <span class="status-text completed">
                    {{ getSubjectiveStatusText(q.question_id) }}
                  </span>
                </template>
                <template v-else>
                  <ExclamationCircleOutlined style="color: #faad14" />
                  <span class="status-text pending">未作答</span>
                </template>
              </span>
            </div>
            <a-button
              type="link"
              size="small"
              @click="navigateToQuestion(q.question_id)"
            >
              前往答题
            </a-button>
          </div>
        </div>

        <a-alert
          v-if="!subjectiveCompleted"
          message="温馨提示"
          description="您还有未作答的主观题，请检查是否已完成文字作答和文件上传"
          type="warning"
          show-icon
          banner
          style="margin-top: 12px"
        />
      </div>

      <!-- 未答题目列表 -->
      <div v-if="unansweredQuestions.length > 0" class="unanswered-section">
        <h4 class="section-title">⚠️ 未答题目</h4>
        <div class="unanswered-tags">
          <a-tag
            v-for="q in unansweredQuestions.slice(0, 10)"
            :key="q.question_id"
            color="error"
            class="unanswered-tag"
            @click="navigateToQuestion(q.question_id)"
          >
            第 {{ getQuestionIndex(q.question_id) + 1 }} 题
          </a-tag>
          <span v-if="unansweredQuestions.length > 10" class="more-hint">
            等共 {{ unansweredQuestions.length }} 题
          </span>
        </div>
      </div>

      <!-- 确认提示 -->
      <div class="confirm-hint">
        <ExclamationCircleOutlined class="hint-icon" />
        <p>交卷后将无法修改答案，请仔细检查后再提交。</p>
      </div>
    </div>

    <template #footer>
      <a-button size="large" @click="onCancel">继续答题</a-button>
      <a-button
        type="primary"
        danger
        size="large"
        :loading="submitting"
        @click="onConfirm"
      >
        确认交卷
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import type { SubjectiveUpload } from '@/layouts/ExamLayout.vue'

interface Question {
  question_id: number
  order: number
  question_type: string
  score: number
}

const props = defineProps<{
  /** 弹窗可见性 */
  visible: boolean
  /** 题目列表 */
  questions: Question[]
  /** 答案映射 */
  answers: Map<number | string, string>
  /** 主观题上传文件映射 */
  subjectiveUploads: Map<number, SubjectiveUpload[]>
  /** 是否正在提交 */
  submitting?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  /** 确认提交 */
  confirm: []
  /** 导航到指定题目 */
  navigate: [index: number]
}>()

// ==================== 计算属性 ====================
const totalQuestions = computed(() => props.questions.length)

const answeredCount = computed(() => {
  return props.questions.filter(q => {
    const ans = props.answers.get(q.question_id)
    return ans !== undefined && ans !== null && ans !== ''
  }).length
})

const unansweredCount = computed(() => totalQuestions.value - answeredCount.value)

const progressPercent = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((answeredCount.value / totalQuestions.value) * 100)
})

const unansweredQuestions = computed(() => {
  return props.questions.filter(q => {
    const ans = props.answers.get(q.question_id)
    return ans === undefined || ans === null || ans === ''
  })
})

const subjectiveQuestions = computed(() => {
  return props.questions.filter(q => q.question_type === 'subjective')
})

const subjectiveCompleted = computed(() => {
  if (subjectiveQuestions.value.length === 0) return true
  return subjectiveQuestions.value.every(q => isSubjectiveCompleted(q.question_id))
})

// ==================== 方法 ====================
function isSubjectiveCompleted(questionId: number): boolean {
  const answer = props.answers.get(questionId)
  const uploads = props.subjectiveUploads.get(questionId) || []
  return (answer !== undefined && answer !== null && answer !== '') || uploads.length > 0
}

function getSubjectiveStatusText(questionId: number): string {
  const answer = props.answers.get(questionId)
  const uploads = props.subjectiveUploads.get(questionId) || []
  
  if (answer && uploads.length > 0) {
    return `已作答 · ${uploads.length}个附件`
  } else if (answer) {
    return '已文字作答'
  } else if (uploads.length > 0) {
    return `${uploads.length}个附件`
  }
  return '未作答'
}

function getQuestionIndex(questionId: number): number {
  return props.questions.findIndex(q => q.question_id === questionId)
}

function navigateToQuestion(questionId: number) {
  const index = getQuestionIndex(questionId)
  if (index >= 0) {
    emit('navigate', index)
    emit('update:visible', false)
  }
}

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('update:visible', false)
}
</script>

<style scoped>
.submit-confirm {
  max-height: 60vh;
  overflow-y: auto;
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 统计区域 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.stat-total .stat-number {
  color: #262626;
}

.stat-answered .stat-number {
  color: #52c41a;
}

.stat-unanswered .stat-number {
  color: #ff4d4f;
}

.stat-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-top: 8px;
}

/* 主观题区域 */
.subjective-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subjective-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 6px;
  transition: all 0.2s;
}

.subjective-item.is-completed {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.question-order {
  font-weight: 500;
  color: #262626;
}

.question-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-text {
  font-size: 13px;
}

.status-text.completed {
  color: #52c41a;
}

.status-text.pending {
  color: #fa8c14;
}

/* 未答题区域 */
.unanswered-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.unanswered-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.unanswered-tag:hover {
  transform: scale(1.05);
}

.more-hint {
  color: #8c8c8c;
  font-size: 13px;
}

/* 确认提示 */
.confirm-hint {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  margin-top: 16px;
}

.hint-icon {
  font-size: 20px;
  color: #ff4d4f;
  flex-shrink: 0;
  margin-top: 2px;
}

.confirm-hint p {
  margin: 0;
  color: #262626;
  font-size: 14px;
  line-height: 1.6;
}

/* 响应式 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .subjective-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .item-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
