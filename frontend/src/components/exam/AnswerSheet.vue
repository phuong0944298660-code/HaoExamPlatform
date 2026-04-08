<template>
  <a-card title="答题卡" size="small" class="answer-sheet">
    <!-- 答题统计 -->
    <div class="stats-section">
      <div class="stats-header">
        <span class="stats-text">
          已答 <strong>{{ answeredCount }}</strong> / {{ questions.length }} 题
        </span>
        <span class="stats-percent">{{ progressPercent }}%</span>
      </div>
      <a-progress
        :percent="progressPercent"
        :show-info="false"
        :stroke-color="progressColor"
        size="small"
        class="stats-progress"
      />
    </div>

    <a-divider style="margin: 12px 0" />

    <!-- 图例说明 -->
    <div class="legend-section">
      <div class="legend-row">
        <span class="legend-item">
          <span class="legend-dot legend-answered"></span>
          已答
        </span>
        <span class="legend-item">
          <span class="legend-dot legend-current"></span>
          当前
        </span>
        <span class="legend-item">
          <span class="legend-dot legend-unanswered"></span>
          未答
        </span>
      </div>
      <div v-if="hasSubjective" class="legend-row">
        <span class="legend-item">
          <span class="legend-dot legend-subjective"></span>
          主观题（有附件）
        </span>
      </div>
    </div>

    <a-divider style="margin: 12px 0" />

    <!-- 题号网格 -->
    <div class="question-grid">
      <div
        v-for="(q, idx) in questions"
        :key="q.question_id ?? idx"
        :class="[
          'question-cell',
          {
            'cell-answered': isAnswered(q.question_id),
            'cell-current': idx === currentIndex,
            'cell-subjective': q.question_type === 'subjective' && hasSubjectiveUpload(q.question_id),
          },
        ]"
        @click="onNavigate(idx)"
      >
        <span class="cell-number">{{ idx + 1 }}</span>
        <span v-if="q.question_type === 'subjective' && hasSubjectiveUpload(q.question_id)" class="cell-badge">
          <PaperClipOutlined />
        </span>
      </div>
    </div>

    <!-- 题目类型分布 -->
    <template v-if="typeStats.length > 0">
      <a-divider style="margin: 12px 0" />
      <div class="type-stats">
        <div
          v-for="stat in typeStats"
          :key="stat.type"
          class="type-stat-item"
        >
          <span class="type-label">{{ stat.label }}</span>
          <span :class="['type-progress', { 'is-complete': stat.answered === stat.total }]">
            {{ stat.answered }}/{{ stat.total }}
          </span>
        </div>
      </div>
    </template>

    <!-- 快速跳转 -->
    <div class="quick-nav">
      <a-input-number
        v-model:value="jumpNumber"
        :min="1"
        :max="questions.length"
        placeholder="题号"
        size="small"
        class="jump-input"
        @press-enter="onJump"
      />
      <a-button size="small" @click="onJump">跳转</a-button>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PaperClipOutlined } from '@ant-design/icons-vue'
import type { SubjectiveUpload } from '@/layouts/ExamLayout.vue'

interface Question {
  question_id: number
  order: number
  question_type: string
  score: number
}

const props = defineProps<{
  /** 题目列表 */
  questions: Question[]
  /** 答案映射 question_id -> answer */
  answers: Map<number | string, string>
  /** 当前题目索引 */
  currentIndex: number
  /** 主观题上传文件映射 question_id -> files */
  subjectiveUploads?: Map<number, SubjectiveUpload[]>
}>()

const emit = defineEmits<{
  navigate: [index: number]
}>()

// ==================== 状态 ====================
const jumpNumber = ref<number | undefined>(undefined)

// ==================== 计算属性 ====================
const answeredCount = computed(() => {
  let count = 0
  for (const q of props.questions) {
    const ans = props.answers.get(q.question_id)
    if (ans !== undefined && ans !== null && ans !== '') {
      count++
    }
  }
  return count
})

const progressPercent = computed(() => {
  if (props.questions.length === 0) return 0
  return Math.round((answeredCount.value / props.questions.length) * 100)
})

const progressColor = computed(() => {
  if (progressPercent.value === 100) return '#52c41a'
  if (progressPercent.value >= 80) return '#1890ff'
  if (progressPercent.value >= 50) return '#faad14'
  return '#ff4d4f'
})

const hasSubjective = computed(() => {
  return props.questions.some(q => q.question_type === 'subjective')
})

const typeStats = computed(() => {
  const typeMap: Record<string, { label: string; total: number; answered: number }> = {}
  
  for (const q of props.questions) {
    if (!typeMap[q.question_type]) {
      typeMap[q.question_type] = {
        label: getTypeLabel(q.question_type),
        total: 0,
        answered: 0,
      }
    }
    typeMap[q.question_type].total++
    
    const ans = props.answers.get(q.question_id)
    if (ans !== undefined && ans !== null && ans !== '') {
      typeMap[q.question_type].answered++
    }
  }
  
  return Object.values(typeMap)
})

// ==================== 方法 ====================
function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    single_choice: '单选',
    multiple_choice: '多选',
    judgment: '判断',
    subjective: '主观',
  }
  return map[type] || type
}

function isAnswered(questionId: number): boolean {
  const ans = props.answers.get(questionId)
  return ans !== undefined && ans !== null && ans !== ''
}

function hasSubjectiveUpload(questionId: number): boolean {
  const uploads = props.subjectiveUploads?.get(questionId)
  return uploads !== undefined && uploads.length > 0
}

function onNavigate(index: number) {
  emit('navigate', index)
}

function onJump() {
  if (jumpNumber.value && jumpNumber.value >= 1 && jumpNumber.value <= props.questions.length) {
    emit('navigate', jumpNumber.value - 1)
    jumpNumber.value = undefined
  }
}
</script>

<style scoped>
.answer-sheet {
  position: sticky;
  top: 16px;
}

/* 统计区域 */
.stats-section {
  padding: 4px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stats-text {
  font-size: 14px;
  color: #595959;
}

.stats-text strong {
  color: #1890ff;
  font-size: 18px;
}

.stats-percent {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

/* 图例 */
.legend-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-row {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8c8c8c;
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  display: inline-block;
}

.legend-answered {
  background: #52c41a;
}

.legend-current {
  background: #fff;
  border: 2px solid #1890ff;
}

.legend-unanswered {
  background: #fff;
  border: 1px solid #d9d9d9;
}

.legend-subjective {
  background: #722ed1;
}

/* 题号网格 */
.question-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
  padding: 4px;
}

.question-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #595959;
  background: #fff;
  transition: all 0.2s;
  user-select: none;
  position: relative;
}

.question-cell:hover {
  border-color: #1890ff;
  color: #1890ff;
  transform: scale(1.05);
}

.cell-number {
  font-weight: 500;
}

/* 已答 */
.cell-answered {
  background: #52c41a;
  color: #fff;
  border-color: #52c41a;
}

.cell-answered:hover {
  background: #73d13d;
  border-color: #73d13d;
  color: #fff;
}

/* 当前题目 */
.cell-current {
  border-color: #1890ff;
  border-width: 2px;
  color: #1890ff;
  font-weight: 700;
}

/* 已答且当前 */
.cell-answered.cell-current {
  background: #52c41a;
  border-color: #1890ff;
  color: #fff;
}

/* 主观题有附件 */
.cell-subjective {
  position: relative;
}

.cell-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  background: #722ed1;
  color: #fff;
  font-size: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 题型统计 */
.type-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
}

.type-label {
  color: #595959;
}

.type-progress {
  color: #8c8c8c;
  font-weight: 500;
}

.type-progress.is-complete {
  color: #52c41a;
}

/* 快速跳转 */
.quick-nav {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.jump-input {
  flex: 1;
}

/* 响应式 */
@media (max-width: 768px) {
  .question-grid {
    grid-template-columns: repeat(6, 1fr);
    max-height: 200px;
  }
  
  .question-cell {
    font-size: 13px;
  }
  
  .legend-row {
    gap: 12px;
  }
}
</style>
