<template>
  <div class="teacher-dashboard">
    <!-- 页面标题 -->
    <a-page-header title="教师工作台" sub-title="查看教学数据概览和最近考试">
      <template #extra>
        <a-button type="primary" @click="refreshData" :loading="loading">
          <template #icon><ReloadOutlined /></template>
          刷新数据
        </a-button>
      </template>
    </a-page-header>

    <!-- 统计卡片区域 -->
    <div class="stats-row">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :lg="6">
          <DashboardCard
            title="我的题库"
            :value="stats.questionBankCount"
            :icon="DatabaseOutlined"
            color="#1890ff"
            @click="goToQuestionBanks"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <DashboardCard
            title="套卷数量"
            :value="stats.paperCount"
            :icon="FileTextOutlined"
            color="#52c41a"
            @click="goToPapers"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <DashboardCard
            title="进行中考试"
            :value="stats.activeExamCount"
            :icon="FormOutlined"
            color="#fa8c16"
            @click="goToExams"
          />
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <DashboardCard
            title="待批阅试卷"
            :value="stats.pendingGradingCount"
            :icon="EditOutlined"
            color="#f5222d"
            @click="goToGrading"
          />
        </a-col>
      </a-row>
    </div>

    <!-- 最近考试列表 -->
    <a-card :bordered="false" class="recent-exams-card">
      <template #title>
        <span class="card-title">
          <ClockCircleOutlined />
          最近考试
        </span>
      </template>
      <template #extra>
        <a-button type="link" @click="goToExams">查看全部</a-button>
      </template>

      <!-- 加载状态 -->
      <a-skeleton v-if="loading" active :paragraph="{ rows: 4 }" />
      
      <!-- 空状态 -->
      <EmptyState
        v-else-if="recentExams.length === 0"
        type="form"
        title="暂无考试"
        description="您还没有创建任何考试，点击下方按钮开始创建"
        action-text="创建考试"
        action-type="primary"
        size="medium"
        @action="goToExams"
        class="exam-empty-state"
      />
      
      <!-- 数据表格 -->
      <div v-else class="table-responsive">
        <a-table
          :data-source="recentExams"
          :columns="examColumns"
          :pagination="false"
          row-key="id"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <!-- 状态列 -->
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ getStatusText(record.status) }}
              </a-tag>
            </template>
            <template v-if="column.key === 'timeRange'">
              <span class="time-range">
                <CalendarOutlined class="time-icon" />
                {{ formatTime(record.start_time) }} ~ {{ formatTime(record.end_time) }}
              </span>
            </template>
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="viewExamDetail(record)">
                  详情
                </a-button>
                <a-button 
                  v-if="record.status === 'closed' && record.pendingGrading > 0"
                  type="link" 
                  size="small"
                  @click="goToGrading(record)"
                >
                  去批阅
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
    </a-card>

    <!-- 快捷操作区域 -->
    <a-row :gutter="[16, 16]" class="quick-actions">
      <a-col :span="24">
        <a-card :bordered="false">
          <template #title>
            <span class="card-title">
              <ThunderboltOutlined />
              快捷操作
            </span>
          </template>
           <div class="action-buttons">
             <a-button type="primary" size="large" @click="goToQuestionBanks">
               <template #icon><DatabaseOutlined /></template>
               管理题库
             </a-button>
             <a-button type="primary" ghost size="large" @click="goToPapers">
               <template #icon><FileTextOutlined /></template>
               创建套卷
             </a-button>
             <a-button size="large" @click="goToGrading">
               <template #icon><EditOutlined /></template>
               批阅试卷
             </a-button>
             <a-button size="large" @click="goToClasses">
               <template #icon><TeamOutlined /></template>
               管理班级
             </a-button>
             <a-button type="dashed" size="large" @click="goToActivate">
               <template #icon><KeyOutlined /></template>
               激活账号
             </a-button>
           </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import DashboardCard from '@/components/common/DashboardCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
 import {
   DatabaseOutlined,
   FileTextOutlined,
   FormOutlined,
   EditOutlined,
   ReloadOutlined,
   ClockCircleOutlined,
   ThunderboltOutlined,
   TeamOutlined,
   CalendarOutlined,
   KeyOutlined,
 } from '@ant-design/icons-vue'
import { getPapers } from '@/api/papers'
import { getExams } from '@/api/exams'
import { getQuestionBanks } from '@/api/questions'
import type { Exam } from '@/types/api'

const router = useRouter()

// ── 统计数据 ──
interface TeacherStats {
  questionBankCount: number
  paperCount: number
  activeExamCount: number
  pendingGradingCount: number
}

const stats = reactive<TeacherStats>({
  questionBankCount: 0,
  paperCount: 0,
  activeExamCount: 0,
  pendingGradingCount: 0,
})

const loading = ref(false)
const recentExams = ref<Exam[]>([])

// 考试列表表格列定义
const examColumns = [
  { title: '考试名称', dataIndex: 'name', key: 'name', ellipsis: true, width: '25%' },
  { title: '考试时间', key: 'timeRange', width: '35%' },
  { title: '状态', key: 'status', width: '15%' },
  { title: '参与人数', dataIndex: 'enrolled_count', key: 'enrolledCount', width: '12%', align: 'center' },
  { title: '操作', key: 'action', width: '13%', align: 'center' },
]

// 状态颜色映射
function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    draft: 'default',
    pending: 'orange',
    open: 'green',
    closed: 'red',
    finished: 'gray',
  }
  return colorMap[status] || 'default'
}

// 状态文本映射
function getStatusText(status: string): string {
  const textMap: Record<string, string> = {
    draft: '草稿',
    pending: '待开放',
    open: '进行中',
    closed: '已关闭',
    finished: '已结束',
  }
  return textMap[status] || status
}

// 格式化时间
function formatTime(time: string): string {
  return dayjs(time).format('MM-DD HH:mm')
}

// ── 数据加载 ──
async function fetchStats() {
  try {
    // 获取套卷数量
    const papersRes = await getPapers({ page: 1, size: 1 })
    stats.paperCount = papersRes.data?.total || 0
    
    // 获取考试统计数据（进行中考试）
    const examsRes = await getExams({ page: 1, size: 1, status: 'open' })
    stats.activeExamCount = examsRes.data?.total || 0
    
    // TODO: 待批阅试卷数量需要单独的API支持
    stats.pendingGradingCount = 0
    
    // 获取题库数量
    const banksRes = await getQuestionBanks({ page: 1, size: 1 })
    stats.questionBankCount = banksRes.data?.total || 0
  } catch (error) {
    console.error('[Dashboard] 获取统计数据失败:', error)
  }
}

async function fetchRecentExams() {
  loading.value = true
  try {
    const res = await getExams({ page: 1, size: 5 })
    recentExams.value = res.data?.list || res.data?.items || []
  } catch (error) {
    message.error('获取最近考试失败')
    console.error('[Dashboard] 获取最近考试失败:', error)
  } finally {
    loading.value = false
  }
}

// 刷新数据
async function refreshData() {
  const hide = message.loading('正在刷新数据...', 0)
  try {
    await Promise.all([fetchStats(), fetchRecentExams()])
    message.success('数据已更新')
  } catch (error) {
    message.error('数据刷新失败，请稍后重试')
    console.error('[Dashboard] 刷新数据失败:', error)
  } finally {
    hide()
  }
}

// ── 页面跳转 ──
function goToExams() {
  router.push('/teacher/exams')
}

function goToQuestionBanks() {
  router.push('/teacher/question-banks')
}

function goToPapers() {
  router.push('/teacher/papers')
}

function goToGrading(exam?: Exam) {
  if (exam) {
    router.push({ path: '/teacher/grading', query: { examId: exam.id.toString() } })
  } else {
    router.push('/teacher/grading')
  }
}

 function goToClasses() {
   router.push('/teacher/classes')
 }

 function goToActivate() {
   router.push('/activate')
 }

 function viewExamDetail(exam: Exam) {
  router.push(`/teacher/exams/${exam.id}`)
}

// ── 生命周期 ──
onMounted(() => {
  fetchStats()
  fetchRecentExams()
})
</script>

<style scoped lang="less">
.teacher-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-row {
  margin-top: var(--space-4);
}

.recent-exams-card {
  margin-top: var(--space-6);
}

.card-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.exam-empty-state {
  padding: var(--space-10) 0;
}

.time-range {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.time-icon {
  color: var(--primary-500);
}

.quick-actions {
  margin-top: var(--space-6);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .teacher-dashboard {
    padding: 0;
  }
  
  .stats-row {
    margin-top: var(--space-3);
  }
  
  .recent-exams-card {
    margin-top: var(--space-4);
  }
  
  .exam-empty-state {
    padding: var(--space-6) 0;
  }
  
  .quick-actions {
    margin-top: var(--space-4);
  }
  
  .action-buttons {
    flex-direction: column;
    
    .ant-btn {
      width: 100%;
    }
  }
}

/* 表格响应式 */
.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  :deep(.ant-table) {
    min-width: 600px;
  }
}

@media (max-width: 576px) {
  .table-responsive :deep(.ant-table) {
    min-width: 500px;
  }
}
</style>
