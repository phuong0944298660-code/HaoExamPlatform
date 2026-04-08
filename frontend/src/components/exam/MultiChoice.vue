<template>
  <div class="multi-choice">
    <a-checkbox-group
      :value="selectedValues"
      class="options-group"
      @change="onChange"
    >
      <a-checkbox
        v-for="option in options"
        :key="option.label"
        :value="option.label"
        class="option-item"
      >
        <span class="option-label">{{ option.label }}</span>
        <span class="option-content" v-html="option.content"></span>
      </a-checkbox>
    </a-checkbox-group>
    
    <!-- 已选提示 -->
    <div v-if="selectedValues.length > 0" class="selected-hint">
      已选择: {{ selectedLabels.join('、') }}
      <a-button type="link" size="small" @click="clearSelection">
        清除选择
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** 选项定义 */
interface Option {
  label: string
  content: string
}

const props = defineProps<{
  /** 选项列表 */
  options: Option[]
  /** 当前选中的答案（逗号分隔的字符串） */
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

/** 将逗号分隔的字符串转为数组 */
const selectedValues = computed({
  get: () => {
    if (!props.modelValue) return []
    return props.modelValue.split(',').filter(Boolean)
  },
  set: (values: string[]) => {
    // 按字母顺序排序后拼接
    const sorted = [...values].sort()
    emit('update:modelValue', sorted.join(','))
  }
})

/** 已选选项的完整标签 */
const selectedLabels = computed(() => {
  return selectedValues.value.map(label => {
    const option = props.options.find(opt => opt.label === label)
    return option ? `${label}. ${option.content.substring(0, 20)}${option.content.length > 20 ? '...' : ''}` : label
  })
})

function onChange(checkedValues: string[]) {
  selectedValues.value = checkedValues
}

function clearSelection() {
  selectedValues.value = []
}
</script>

<style scoped>
.multi-choice {
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
  margin-left: 0 !important;
}

.option-item:hover {
  border-color: #722ed1;
  background: #f9f0ff;
}

.option-item :deep(.ant-checkbox) {
  margin-top: 3px;
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
  background: #722ed1;
  color: #fff;
}

.option-item:deep(.ant-checkbox-wrapper-checked) .option-label {
  background: #722ed1;
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
.option-item:deep(.ant-checkbox-wrapper-checked) {
  border-color: #722ed1;
  background: #f3e6ff;
}

/* 已选提示 */
.selected-hint {
  margin-top: 16px;
  padding: 10px 14px;
  background: #f9f0ff;
  border: 1px dashed #d3adf7;
  border-radius: 6px;
  font-size: 13px;
  color: #531dab;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  
  .selected-hint {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>
