<template>
  <div class="subjective">
    <!-- 文字作答区域 -->
    <div class="text-answer">
      <div class="section-title">
        <EditOutlined />
        <span>文字作答</span>
      </div>
      <a-textarea
        :value="modelValue"
        :rows="8"
        :maxlength="5000"
        show-count
        placeholder="请输入您的答案..."
        class="answer-textarea"
        @update:value="onTextChange"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { EditOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  /** 文字答案 */
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// ==================== 方法 ====================
function onTextChange(value: string) {
  emit('update:modelValue', value)
}
</script>

<style scoped>
.subjective {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 12px;
}

.text-answer {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
}

.answer-textarea {
  font-size: 14px;
  line-height: 1.8;
}

.answer-textarea :deep(.ant-input) {
  resize: vertical;
  min-height: 160px;
}

/* 响应式 */
@media (max-width: 768px) {
  .subjective {
    gap: 16px;
  }

  .text-answer {
    padding: 12px;
  }
}
</style>
