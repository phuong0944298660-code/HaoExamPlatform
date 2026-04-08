<template>
  <div class="judgment">
    <a-radio-group
      :value="modelValue"
      class="options-group"
      @update:value="onChange"
    >
      <a-radio value="T" class="option-item option-true">
        <CheckCircleOutlined class="option-icon" />
        <span class="option-text">正确</span>
      </a-radio>
      <a-radio value="F" class="option-item option-false">
        <CloseCircleOutlined class="option-icon" />
        <span class="option-text">错误</span>
      </a-radio>
    </a-radio-group>
  </div>
</template>

<script setup lang="ts">
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  /** 当前选中的答案：'T' 表示正确，'F' 表示错误 */
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
.judgment {
  width: 100%;
}

.options-group {
  display: flex;
  gap: 20px;
  width: 100%;
}

.option-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 24px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  transition: all 0.25s ease;
  cursor: pointer;
  min-height: 80px;
}

.option-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.option-true:hover {
  border-color: #52c41a;
  background: #f6ffed;
}

.option-false:hover {
  border-color: #ff4d4f;
  background: #fff2f0;
}

.option-icon {
  font-size: 28px;
  margin-right: 12px;
  transition: all 0.25s;
}

.option-true .option-icon {
  color: #b7eb8f;
}

.option-false .option-icon {
  color: #ffa39e;
}

.option-item:hover .option-icon {
  transform: scale(1.1);
}

.option-true:hover .option-icon {
  color: #52c41a;
}

.option-false:hover .option-icon {
  color: #ff4d4f;
}

.option-text {
  font-size: 18px;
  font-weight: 500;
  color: #262626;
}

/* 选中状态 */
.option-item:deep(.ant-radio-wrapper-checked).option-true {
  border-color: #52c41a;
  background: #f6ffed;
}

.option-item:deep(.ant-radio-wrapper-checked).option-false {
  border-color: #ff4d4f;
  background: #fff2f0;
}

.option-item:deep(.ant-radio-wrapper-checked).option-true .option-icon {
  color: #52c41a;
}

.option-item:deep(.ant-radio-wrapper-checked).option-false .option-icon {
  color: #ff4d4f;
}

/* 响应式 */
@media (max-width: 768px) {
  .options-group {
    flex-direction: column;
  }
  
  .option-item {
    padding: 16px 20px;
    min-height: 60px;
  }
  
  .option-icon {
    font-size: 24px;
  }
  
  .option-text {
    font-size: 16px;
  }
}
</style>
