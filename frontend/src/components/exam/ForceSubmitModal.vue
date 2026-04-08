<template>
  <a-modal
    :visible="visible"
    title="⏰ 考试时间已结束"
    :width="480"
    :closable="false"
    :mask-closable="false"
    :footer="null"
    centered
  >
    <div class="force-submit-modal">
      <!-- 警告图标 -->
      <div class="warning-icon">
        <ClockCircleOutlined />
      </div>
      
      <!-- 标题 -->
      <h3 class="modal-title">考试时间已到</h3>
      
      <!-- 说明 -->
      <p class="modal-desc">
        考试时间已经结束，系统正在为您自动交卷。<br>
        请确认是否立即提交当前答案。
      </p>

      <!-- 自动提交倒计时 -->
      <div class="auto-submit-countdown">
        <span class="countdown-label">自动提交倒计时</span>
        <span class="countdown-number">{{ countdown }} 秒</span>
      </div>

      <!-- 进度条 -->
      <a-progress
        :percent="progressPercent"
        :show-info="false"
        status="exception"
        :stroke-width="8"
        class="countdown-progress"
      />

      <!-- 按钮 -->
      <div class="modal-actions">
        <a-button
          type="primary"
          danger
          size="large"
          block
          :loading="submitting"
          @click="onConfirm"
        >
          立即交卷
        </a-button>
      </div>

      <!-- 提示 -->
      <p class="footer-hint">
        <InfoCircleOutlined />
        倒计时结束后将自动提交，请尽快确认
      </p>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  /** 弹窗可见性 */
  visible: boolean
  /** 自动提交倒计时秒数 */
  autoSubmitSeconds?: number
  /** 是否正在提交 */
  submitting?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  /** 确认提交 */
  confirm: []
}>()

// ==================== 状态 ====================
const countdown = ref(props.autoSubmitSeconds || 30)
const timer = ref<ReturnType<typeof setInterval> | null>(null)

// ==================== 计算属性 ====================
const progressPercent = computed(() => {
  const total = props.autoSubmitSeconds || 30
  return Math.round((countdown.value / total) * 100)
})

// ==================== 方法 ====================
function startCountdown() {
  // 清除之前的定时器
  if (timer.value) {
    clearInterval(timer.value)
  }
  
  // 重置倒计时
  countdown.value = props.autoSubmitSeconds || 30
  
  // 启动倒计时
  timer.value = setInterval(() => {
    countdown.value--
    
    if (countdown.value <= 0) {
      // 倒计时结束，自动提交
      if (timer.value) {
        clearInterval(timer.value)
        timer.value = null
      }
      onConfirm()
    }
  }, 1000)
}

function stopCountdown() {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

function onConfirm() {
  stopCountdown()
  emit('confirm')
}

// ==================== 监听 ====================
watch(() => props.visible, (newVal) => {
  if (newVal) {
    startCountdown()
  } else {
    stopCountdown()
  }
})

// ==================== 生命周期 ====================
onUnmounted(() => {
  stopCountdown()
})
</script>

<style scoped>
.force-submit-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  text-align: center;
}

.warning-icon {
  font-size: 64px;
  color: #ff4d4f;
  margin-bottom: 16px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.modal-title {
  font-size: 22px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 12px 0;
}

.modal-desc {
  font-size: 14px;
  color: #595959;
  line-height: 1.8;
  margin: 0 0 24px 0;
}

.auto-submit-countdown {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.countdown-label {
  font-size: 13px;
  color: #8c8c8c;
}

.countdown-number {
  font-size: 24px;
  font-weight: 700;
  color: #ff4d4f;
  font-variant-numeric: tabular-nums;
}

.countdown-progress {
  width: 100%;
  margin-bottom: 24px;
}

.modal-actions {
  width: 100%;
}

.footer-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #8c8c8c;
  margin: 16px 0 0 0;
}
</style>
