<template>
  <div class="student-home">
    <a-page-header 
      title="我的考试" 
      sub-title="查看和参加可用考试"
      class="page-header"
    >
      <template #extra>
        <a-button type="dashed" @click="goToActivate">
          <template #icon><KeyOutlined /></template>
          激活账号
        </a-button>
      </template>
    </a-page-header>
    
    <!-- 考试筛选标签 -->
    <div class="filter-tabs">
      <a-radio-group v-model:value="filterStatus" button-style="solid" @change="handleFilterChange">
        <a-radio-button value="all">全部</a-radio-button>
        <a-radio-button value="open">进行中</a-radio-button>
        <a-radio-button value="pending">即将开始</a-radio-button>
        <a-radio-button value="finished">已结束</a-radio-button>
      </a-radio-group>
    </div>
    
    <a-spin :spinning="loading" tip="加载考试中...">
      <!-- 空状态 -->
      <EmptyState
        v-if="!loading && filteredExams.length === 0"
        :type="filterStatus === 'all' ? 'form' : 'search'"
        :title="filterStatus === 'all' ? '暂无考试' : '未找到匹配的考试'"
        :description="filterStatus === 'all' 
          ? '当前没有可参加的考试，请稍后再来' 
          : '尝试切换其他筛选条件查看'"
        size="large"
        class="exam-empty-state"
      />
      
      <!-- 考试卡片网格 -->
      <a-row v-else :gutter="[16, 16]" class="exam-grid">
        <a-col 
          :xs="24" 
          :sm="12" 
          :lg="8" 
          v-for="exam in filteredExams" 
          :key="exam.id"
        >
          <a-card 
            hoverable 
            class="exam-card"
            :class="{ 'exam-open': exam.status === 'open' }"
          >
            <!-- 卡片头部 -->
            <div class="exam-card-header">
              <div class="exam-title-wrapper">
                <h3 class="exam-title" :title="exam.name">{{ exam.name }}</h3>
                <a-tag
                  :color="statusColor(examStatus(exam))"
                  class="status-tag"
                >
                  {{ statusText(examStatus(exam)) }}
                </a-tag>
              </div>
              <p class="exam-grade">
                <TrophyOutlined />
                {{ (exam.gradeGroup || exam.grade_group) === 'primary' ? '小学组' : '初中组' }}
              </p>
            </div>
            
            <!-- 考试信息 -->
            <div class="exam-info">
              <div class="info-item">
                <ClockCircleOutlined class="info-icon" />
                <div class="info-content">
                  <span class="info-label">考试时间</span>
                  <span class="info-value">{{ formatTime(exam.startTime || exam.start_time) }}</span>
                </div>
              </div>
              
              <div class="info-item">
                <HourglassOutlined class="info-icon" />
                <div class="info-content">
                  <span class="info-label">考试时长</span>
                  <span class="info-value">{{ exam.duration }} 分钟</span>
                </div>
              </div>
              
              <div class="info-item" v-if="getTimeRemaining(exam)">
                <BellOutlined class="info-icon" />
                <div class="info-content">
                  <span class="info-label">剩余时间</span>
                  <span class="info-value highlight">{{ getTimeRemaining(exam) }}</span>
                </div>
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <template #actions>
              <div class="exam-actions">
                <!-- 进行中的考试 -->
                <a-button
                  v-if="examStatus(exam) === 'open'"
                  type="primary"
                  block
                  size="large"
                  class="enter-btn"
                  @click="enterExam(exam.id)"
                >
                  <PlayCircleOutlined />
                  进入考试
                </a-button>
                <!-- 待开放的考试 -->
                <a-button
                  v-else-if="examStatus(exam) === 'pending'"
                  disabled
                  block
                  size="large"
                >
                  <LockOutlined />
                  未开放
                </a-button>
                <!-- 已结束/已关闭的考试 - 查看结果 -->
                <a-button
                  v-else-if="examStatus(exam) === 'finished' || examStatus(exam) === 'closed'"
                  block
                  size="large"
                  @click="viewResult(exam.id)"
                >
                  <FileSearchOutlined />
                  查看结果
                </a-button>
                <!-- 其他状态 -->
                <a-button
                  v-else
                  disabled
                  block
                  size="large"
                >
                  未开放
                </a-button>
              </div>
            </template>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
 import {
   TrophyOutlined,
   ClockCircleOutlined,
   HourglassOutlined,
   BellOutlined,
   PlayCircleOutlined,
   LockOutlined,
   FileSearchOutlined,
   KeyOutlined,
 } from '@ant-design/icons-vue'
import { getExams } from '@/api/exams'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()
const loading = ref(false)
const exams = ref<any[]>([])
const filterStatus = ref('all')

// 检查账号类型，PRACTICE 账号重定向到练习首页
function checkAccountType() {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr && userStr !== 'null') {
      const user = JSON.parse(userStr)
      const accountType = (user.accountType || user.account_type || '').toUpperCase()
      if (accountType === 'PRACTICE') {
        router.replace('/student/practice')
        return true
      }
    }
  } catch (e) {
    console.error('[Home] 读取用户信息失败:', e)
  }
  return false
}

// 过滤后的考试列表
const filteredExams = computed(() => {
  if (filterStatus.value === 'all') {
    return exams.value
  }
  return exams.value.filter(exam => examStatus(exam) === filterStatus.value)
})

// 根据考试状态返回对应的标签颜色
function statusColor(s: string) {
  const key = s?.toUpperCase()
  return {
    DRAFT: 'default',
    PENDING: 'orange',
    PUBLISHED: 'blue',
    OPEN: 'green',
    CLOSED: 'red',
    FINISHED: 'gray'
  }[key] || 'default'
}

// 根据考试状态返回对应的中文文本
function statusText(s: string) {
  const key = s?.toUpperCase()
  return {
    DRAFT: '草稿',
    PENDING: '待开放',
    PUBLISHED: '待开放',
    OPEN: '进行中',
    CLOSED: '已关闭',
    FINISHED: '已结束'
  }[key] || s
}

// 统一状态映射（后端可能返回大写或不同命名）
function examStatus(exam: any): string {
  const s = (exam.status || '').toUpperCase()
  const now = dayjs()
  const start = dayjs(exam.startTime || exam.start_time)
  const end = dayjs(exam.endTime || exam.end_time)

  if (s === 'FINISHED' || s === 'CLOSED') return 'finished'
  if (s === 'OPEN' || (s === 'PUBLISHED' && now.isAfter(start) && now.isBefore(end))) return 'open'
  if (s === 'PUBLISHED' && now.isAfter(end)) return 'finished'
  if (s === 'PENDING' || s === 'PUBLISHED') return 'pending'
  return s.toLowerCase()
}

// 格式化时间显示
function formatTime(t: string) {
  return dayjs(t).format('YYYY-MM-DD HH:mm')
}

// 计算剩余时间
function getTimeRemaining(exam: any): string | null {
  const now = dayjs()
  const startTime = dayjs(exam.startTime || exam.start_time)
  const endTime = dayjs(exam.endTime || exam.end_time)
  
  const st = examStatus(exam)
  if (st === 'pending') {
    const diff = startTime.diff(now, 'minute')
    if (diff > 60 * 24) {
      return `${Math.floor(diff / 60 / 24)} 天后开始`
    } else if (diff > 60) {
      return `${Math.floor(diff / 60)} 小时后开始`
    } else if (diff > 0) {
      return `${diff} 分钟后开始`
    }
  } else if (st === 'open') {
    const diff = endTime.diff(now, 'minute')
    if (diff > 60) {
      return `${Math.floor(diff / 60)} 小时 ${diff % 60} 分钟`
    } else if (diff > 0) {
      return `${diff} 分钟`
    } else {
      return '即将结束'
    }
  }
  return null
}

// 处理筛选变化
function handleFilterChange() {
  // 可以在这里添加额外的筛选逻辑
}

// 进入考试页面
function enterExam(examId: number) {
  Modal.confirm({
    title: '确认进入考试',
    content: '进入考试后将开始计时，请确保您有充足的时间完成考试。',
    okText: '确认进入',
    cancelText: '再等等',
    onOk: () => {
      router.push(`/student/exam/${examId}`)
    },
  })
}

// 查看考试结果
 function viewResult(examId: number) {
   router.push(`/student/exam-result/${examId}`)
 }

 // 激活账号
 function goToActivate() {
   router.push('/activate')
 }

 // 页面加载时获取考试列表
onMounted(async () => {
  // 练习账号重定向到练习首页
  if (checkAccountType()) return

  loading.value = true
  try {
    const res = await getExams({ page: 1, size: 50 })
    // 过滤掉草稿状态的考试，学生不应该看到草稿
    exams.value = (res.data?.list || res.data?.items || []).filter((exam: any) => exam.status !== 'DRAFT' && exam.status !== 'draft')
  } catch {
    message.error('加载考试列表失败')
  } finally {
    loading.value = false
  }
})

import { Modal } from 'ant-design-vue'
</script>

<style scoped lang="less">
.student-home { 
  max-width: 1200px; 
  margin: 0 auto;
}

.page-header {
  padding-left: 0;
  padding-right: 0;
}

/* 筛选标签 */
.filter-tabs {
  margin-bottom: var(--space-4);
  
  :deep(.ant-radio-group) {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }
  
  :deep(.ant-radio-button-wrapper) {
    border-radius: var(--radius-md);
  }
}

/* 考试网格 */
.exam-grid {
  margin-top: var(--space-2);
}

/* 考试卡片 */
.exam-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg);
  transition: all var(--duration-normal) var(--ease-default);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
  
  &.exam-open {
    border-color: var(--success-500);
    
    :deep(.ant-card-body) {
      background: linear-gradient(135deg, var(--success-50) 0%, var(--bg-primary) 100%);
    }
  }
  
  :deep(.ant-card-body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: var(--space-4);
  }
  
  :deep(.ant-card-actions) {
    border-top: 1px solid var(--border-light);
    
    > li {
      margin: 0;
      padding: var(--space-3);
    }
  }
}

/* 卡片头部 */
.exam-card-header {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-light);
}

.exam-title-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.exam-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  max-height: 2.8em;
}

.status-tag {
  flex-shrink: 0;
}

.exam-grade {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  
  .anticon {
    color: var(--warning-500);
  }
}

/* 考试信息 */
.exam-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.info-icon {
  font-size: 16px;
  color: var(--primary-500);
  margin-top: 2px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.info-value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  
  &.highlight {
    color: var(--error-500);
    font-weight: var(--font-weight-semibold);
  }
}

/* 操作按钮 */
.exam-actions {
  width: 100%;
}

.enter-btn {
  font-weight: var(--font-weight-medium);
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
}

/* 空状态 */
.exam-empty-state {
  padding: var(--space-12) 0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .filter-tabs {
    :deep(.ant-radio-group) {
      width: 100%;
    }
    
    :deep(.ant-radio-button-wrapper) {
      flex: 1;
      text-align: center;
      padding: 0 var(--space-2);
    }
  }
  
  .exam-card {
    :deep(.ant-card-body) {
      padding: var(--space-3);
    }
  }
  
  .exam-title {
    font-size: var(--font-size-md);
  }
  
  .exam-empty-state {
    padding: var(--space-8) 0;
  }
}
</style>
