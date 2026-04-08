<template>
  <a-card title="答题卡" size="small" class="answer-card-container">
    <!-- 答题状态统计 -->
    <div class="answer-stats">
      <span class="stats-text">已答 {{ answeredCount }} / 共 {{ questions.length }} 题</span>
      <a-progress
        :percent="progressPercent"
        :show-info="false"
        :stroke-color="progressPercent === 100 ? '#52c41a' : '#1890ff'"
        size="small"
      />
    </div>

    <a-divider style="margin: 12px 0" />

    <!-- 图例说明 -->
    <div class="legend">
      <span class="legend-item">
        <span class="legend-dot legend-dot--answered"></span>已答
      </span>
      <span class="legend-item">
        <span class="legend-dot legend-dot--unanswered"></span>未答
      </span>
      <span class="legend-item">
        <span class="legend-dot legend-dot--current"></span>当前
      </span>
    </div>

    <!-- 题号按钮网格 -->
    <div class="answer-grid">
      <div
        v-for="(q, idx) in questions"
        :key="q.question_id ?? idx"
        :class="[
          'answer-cell',
          {
            'answer-cell--answered': isAnswered(q.question_id),
            'answer-cell--current': idx === currentIndex,
          },
        ]"
        @click="onNavigate(idx)"
      >
        {{ idx + 1 }}
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface QuestionItem {
  question_id: number | string
  [key: string]: any
}

const props = withDefaults(defineProps<{
  /** 题目列表 */
  questions: QuestionItem[]
  /** 答案映射 question_id -> answer */
  answers: Map<number | string, string>
  /** 当前题目索引 */
  currentIndex: number
}>(), {
  currentIndex: 0,
})

const emit = defineEmits<{
  navigate: [index: number]
}>()

/** 已答题目数 */
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

/** 答题进度百分比 */
const progressPercent = computed(() => {
  if (props.questions.length === 0) return 0
  return Math.round((answeredCount.value / props.questions.length) * 100)
})

/** 判断某题是否已作答 */
function isAnswered(questionId: number | string): boolean {
  const ans = props.answers.get(questionId)
  return ans !== undefined && ans !== null && ans !== ''
}

/** 导航到指定题目 */
function onNavigate(index: number) {
  emit('navigate', index)
}
</script>

<style scoped>
.answer-card-container {
  position: sticky;
  top: 16px;
}

.answer-stats {
  text-align: center;
}

.stats-text {
  font-size: 14px;
  color: #595959;
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #8c8c8c;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  display: inline-block;
}

.legend-dot--answered {
  background: #52c41a;
}

.legend-dot--unanswered {
  background: #fff;
  border: 1px solid #d9d9d9;
}

.legend-dot--current {
  background: #fff;
  border: 2px solid #1890ff;
}

.answer-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.answer-cell {
  width: 100%;
  aspect-ratio: 1;
  max-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #595959;
  background: #fff;
  transition: all 0.2s;
  user-select: none;
}

.answer-cell:hover {
  border-color: #1890ff;
  color: #1890ff;
}

/* 已答：绿色填充 */
.answer-cell--answered {
  background: #52c41a;
  color: #fff;
  border-color: #52c41a;
}

.answer-cell--answered:hover {
  background: #73d13d;
  border-color: #73d13d;
  color: #fff;
}

/* 当前题目：蓝色边框 */
.answer-cell--current {
  border-color: #1890ff;
  border-width: 2px;
  color: #1890ff;
  font-weight: 700;
}

/* 当前 + 已答 */
.answer-cell--current.answer-cell--answered {
  background: #52c41a;
  border-color: #1890ff;
  color: #fff;
}
</style>
