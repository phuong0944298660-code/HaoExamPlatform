<template>
  <div class="single-choice">
    <a-radio-group
      :value="modelValue"
      class="options-group"
      @update:value="onChange"
    >
      <a-radio
        v-for="option in options"
        :key="option.label"
        :value="option.label"
        class="option-item"
      >
        <span class="option-label">{{ option.label }}</span>
        <span class="option-content" v-html="option.content"></span>
      </a-radio>
    </a-radio-group>
  </div>
</template>

<script setup lang="ts">
/** 选项定义 */
interface Option {
  label: string
  content: string
}

const props = defineProps<{
  /** 选项列表 */
  options: Option[]
  /** 当前选中的答案 */
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onChange(value: string) {
  emit('update:modelValue', value)
}
</script>

<style scoped>
.single-choice {
  width: 100%;
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
  padding: 14px 18px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  transition: all 0.25s ease;
  cursor: pointer;
  min-height: 52px;
}

.option-item:hover {
  border-color: #1890ff;
  background: #f0f7ff;
}

.option-item :deep(.ant-radio) {
  margin-top: 3px;
}

.option-item :deep(.ant-radio-checked + span) {
  color: #1890ff;
}

.option-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  background: #f0f0f0;
  border-radius: 4px;
  font-weight: 600;
  font-size: 14px;
  color: #595959;
  margin-right: 12px;
  flex-shrink: 0;
}

.option-item:hover .option-label {
  background: #1890ff;
  color: #fff;
}

.option-item :deep(.ant-radio-checked) ~ .option-label {
  background: #1890ff;
  color: #fff;
}

.option-content {
  flex: 1;
  font-size: 15px;
  line-height: 1.7;
  color: #262626;
  word-break: break-word;
}

.option-content :deep(p) {
  margin: 0;
}

.option-content :deep(img) {
  max-width: 100%;
  max-height: 200px;
  margin-top: 8px;
  border-radius: 4px;
}

/* 选中状态 */
.option-item:deep(.ant-radio-wrapper-checked) {
  border-color: #1890ff;
  background: #e6f7ff;
}

.option-item:deep(.ant-radio-wrapper-checked) .option-label {
  background: #1890ff;
  color: #fff;
}

/* 响应式 */
@media (max-width: 768px) {
  .option-item {
    padding: 12px 14px;
  }
  
  .option-label {
    min-width: 24px;
    height: 24px;
    font-size: 13px;
    margin-right: 10px;
  }
  
  .option-content {
    font-size: 14px;
  }
}
</style>
