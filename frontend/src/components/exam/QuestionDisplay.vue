<template>
  <div class="question-display">
    <!-- 题目头部：序号 + 类型 + 分值 -->
    <div class="question-header">
      <span class="question-number">{{ index + 1 }}.</span>
      <a-tag color="processing">{{ questionTypeLabel }}</a-tag>
      <a-tag color="warning">{{ question.score }} 分</a-tag>
    </div>

    <!-- 题目内容 -->
    <div class="question-content" v-html="question.content"></div>

    <!-- 题目图片 -->
    <div v-if="question.images?.length" class="question-images">
      <a-image
        v-for="(img, i) in question.images"
        :key="i"
        :src="img"
        :width="200"
        :preview="{ mask: '查看大图' }"
      />
    </div>

    <!-- 单选题 -->
    <a-radio-group
      v-if="question.question_type === 'single_choice'"
      :value="answer"
      :disabled="readonly"
      class="options-group"
      @update:value="onAnswerChange"
    >
      <a-radio
        v-for="opt in question.options"
        :key="opt.label"
        :value="opt.label"
        class="option-item"
      >
        <span class="option-label">{{ opt.label }}</span>
        <span class="option-content">{{ opt.content }}</span>
      </a-radio>
    </a-radio-group>

    <!-- 多选题 -->
    <a-checkbox-group
      v-else-if="question.question_type === 'multiple_choice'"
      :value="multiAnswerArray"
      :disabled="readonly"
      class="options-group"
      @change="onMultiChange"
    >
      <a-checkbox
        v-for="opt in question.options"
        :key="opt.label"
        :value="opt.label"
        class="option-item"
      >
        <span class="option-label">{{ opt.label }}</span>
        <span class="option-content">{{ opt.content }}</span>
      </a-checkbox>
    </a-checkbox-group>

    <!-- 判断题 -->
    <a-radio-group
      v-else-if="question.question_type === 'true_false'"
      :value="answer"
      :disabled="readonly"
      class="options-group"
      @update:value="onAnswerChange"
    >
      <a-radio value="T" class="option-item">
        <span class="option-content">对</span>
      </a-radio>
      <a-radio value="F" class="option-item">
        <span class="option-content">错</span>
      </a-radio>
    </a-radio-group>

    <!-- 填空题 -->
    <a-input
      v-else-if="question.question_type === 'fill_blank'"
      :value="answer"
      :disabled="readonly"
      placeholder="请输入答案..."
      allow-clear
      class="fill-input"
      @update:value="onAnswerChange"
      @blur="onAnswerChange(($event.target as HTMLInputElement).value)"
    />

    <!-- 未知题型兜底 -->
    <a-textarea
      v-else
      :value="answer"
      :disabled="readonly"
      :rows="4"
      placeholder="请输入答案..."
      @update:value="onAnswerChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** 题目选项 */
interface QuestionOption {
  label: string
  content: string
}

/** 题目数据 */
interface QuestionData {
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | string
  content: string
  options?: QuestionOption[] | null
  score: number
  images?: string[]
}

const props = withDefaults(defineProps<{
  /** 题目数据对象 */
  question: QuestionData
  /** 当前答案 */
  answer: string
  /** 题目序号（从0开始） */
  index: number
  /** 是否只读（阅卷模式） */
  readonly?: boolean
}>(), {
  answer: '',
  readonly: false,
})

const emit = defineEmits<{
  'update:answer': [value: string]
}>()

/** 题型中文标签 */
const questionTypeLabel = computed(() => {
  const map: Record<string, string> = {
    single_choice: '单选题',
    multiple_choice: '多选题',
    true_false: '判断题',
    fill_blank: '填空题',
  }
  return map[props.question.question_type] || '其他题型'
})

/** 多选答案字符串拆分为数组 */
const multiAnswerArray = computed(() => {
  if (!props.answer) return []
  return props.answer.split(',').filter(Boolean)
})

/** 单选 / 判断 / 填空 答案变更 */
function onAnswerChange(value: string | Event) {
  if (typeof value === 'string') {
    emit('update:answer', value)
  }
}

/** 多选答案变更：数组排序后用逗号拼接 */
function onMultiChange(checkedValues: string[]) {
  emit('update:answer', [...checkedValues].sort().join(','))
}
</script>

<style scoped>
.question-display {
  padding: 20px 24px;
  background: #fff;
  border-radius: 8px;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.question-number {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  min-width: 28px;
}

.question-content {
  font-size: 15px;
  line-height: 1.8;
  color: #262626;
  margin-bottom: 20px;
  word-break: break-word;
}

.question-images {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 14px;
  line-height: 1.6;
}

.option-item:hover {
  border-color: #1890ff;
  background: #f0f5ff;
}

.option-label {
  font-weight: 600;
  margin-right: 8px;
  color: #1890ff;
}

.option-content {
  flex: 1;
  color: #262626;
}

.fill-input {
  max-width: 600px;
  font-size: 14px;
}
</style>
