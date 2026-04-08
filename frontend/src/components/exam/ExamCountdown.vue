<template>
  <div :class="['exam-countdown', statusClass]">
    <ClockCircleOutlined class="countdown-icon" />
    <span class="countdown-label">剩余时间</span>
    <span class="countdown-time">{{ displayTime }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ClockCircleOutlined } from '@ant-design/icons-vue'

const props = withDefaults(defineProps<{
  /** 考试结束时间（ISO 8601 字符串） */
  endTime: string
  /** 预警阈值（分钟），默认 10 分钟 */
  warningMinutes?: number
}>(), {
  warningMinutes: 10,
})

const emit = defineEmits<{
  /** 倒计时归零 */
  timeout: []
  /** 进入预警阶段 */
  warning: []
}>()

/** 剩余秒数 */
const remainingSeconds = ref(0)
/** 是否已触发预警 */
let warningEmitted = false
/** 是否已触发超时 */
let timeoutEmitted = false
/** 定时器句柄 */
let timer: ReturnType<typeof setInterval> | null = null

/** 计算剩余秒数 */
function calcRemaining(): number {
  const end = new Date(props.endTime).getTime()
  const now = Date.now()
  return Math.max(0, Math.floor((end - now) / 1000))
}

/** 格式化为 HH:MM:SS */
const displayTime = computed(() => {
  const total = remainingSeconds.value
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, '0'))
    .join(':')
})

/** 当前状态样式类 */
const statusClass = computed(() => {
  const total = remainingSeconds.value
  if (total <= 0) return 'countdown--expired'
  if (total < 60) return 'countdown--critical'
  if (total < props.warningMinutes * 60) return 'countdown--warning'
  return 'countdown--normal'
})

/** 每秒更新 */
function tick() {
  remainingSeconds.value = calcRemaining()

  // 触发预警事件（仅一次）
  if (
    !warningEmitted &&
    remainingSeconds.value > 0 &&
    remainingSeconds.value < props.warningMinutes * 60
  ) {
    warningEmitted = true
    emit('warning')
  }

  // 触发超时事件（仅一次）
  if (!timeoutEmitted && remainingSeconds.value <= 0) {
    timeoutEmitted = true
    emit('timeout')
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

onMounted(() => {
  remainingSeconds.value = calcRemaining()
  timer = setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
.exam-countdown {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 6px;
  font-variant-numeric: tabular-nums;
  font-family: 'Helvetica Neue', 'PingFang SC', sans-serif;
  transition: color 0.3s, background 0.3s;
}

.countdown-icon {
  font-size: 16px;
}

.countdown-label {
  font-size: 13px;
  opacity: 0.85;
}

.countdown-time {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 1px;
}

/* 正常状态：蓝色 */
.countdown--normal {
  color: #1890ff;
  background: #e6f7ff;
}

/* 预警状态：橙色闪烁 */
.countdown--warning {
  color: #fa8c16;
  background: #fff7e6;
  animation: countdown-blink 1s ease-in-out infinite;
}

/* 紧急状态：红色快速闪烁 */
.countdown--critical {
  color: #ff4d4f;
  background: #fff2f0;
  animation: countdown-blink 0.5s ease-in-out infinite;
}

/* 已结束 */
.countdown--expired {
  color: #8c8c8c;
  background: #f5f5f5;
}

@keyframes countdown-blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
