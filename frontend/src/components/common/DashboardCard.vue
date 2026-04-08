<template>
  <a-card class="dashboard-card" :bordered="false" hoverable @click="handleClick">
    <div class="card-body">
      <div class="card-icon" :style="{ background: iconBg }">
        <component :is="icon" :style="{ color, fontSize: '24px' }" />
      </div>
      <div class="card-info">
        <div class="card-value" :style="{ color }">{{ value }}</div>
        <div class="card-title">{{ title }}</div>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  /** 卡片标题 */
  title: string
  /** 数值 */
  value: number | string
  /** Ant Design 图标组件 */
  icon: any
  /** 主题色 */
  color?: string
}>(), {
  color: '#1890ff',
})

const emit = defineEmits<{
  click: []
}>()

/** 图标背景色（主题色 10% 透明度） */
const iconBg = computed(() => {
  return `${props.color}15`
})

function handleClick() {
  emit('click')
}
</script>

<style scoped>
.dashboard-card {
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s;
  cursor: pointer;
}

.dashboard-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-body {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.card-title {
  font-size: 14px;
  color: #8c8c8c;
  margin-top: 4px;
}
</style>
