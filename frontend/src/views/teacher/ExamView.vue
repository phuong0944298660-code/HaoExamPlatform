<template>
  <div class="exam-view-page">
    <!-- 页面标题 -->
    <a-page-header
      title="考试详情"
      sub-title="查看考试信息和统计"
      @back="handleBack"
      class="page-header"
    >
      <template #extra>
        <a-space>
          <a-button @click="handleEdit">
            <EditOutlined />
            编辑
          </a-button>
          <a-button type="primary" @click="handleBack">
            返回列表
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-spin :spinning="loading" tip="加载中...">
      <!-- 考试基本信息卡片 -->
      <a-card 
        title="基本信息" 
        :bordered="false" 
        class="info-card"
        :head-style="{ borderBottom: '1px solid #f0f0f0' }"
      >
        <a-descriptions :column="{ xs: 1, sm: 2, md: 3 }" bordered size="middle">
          <a-descriptions-item label="考试名称" :span="{ xs: 1, sm: 2 }">
            <span class="exam-name">{{ examData?.name || '-' }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="考试状态">
            <a-tag :color="getStatusColor(examData?.status)" class="status-tag">
              {{ getStatusText(examData?.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="学段">
            <a-tag :color="examData?.grade_group === 'primary' ? 'green' : 'blue'">
              {{ examData?.grade_group === 'primary' ? '小学' : examData?.grade_group === 'junior' ? '初中' : '-' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="考试时长">
            <ClockCircleOutlined /> {{ examData?.duration || 0 }} 分钟
          </a-descriptions-item>
          <a-descriptions-item label="总分">
            <TrophyOutlined /> {{ examData?.total_score || 0 }} 分
          </a-descriptions-item>
          <a-descriptions-item label="开始时间">
            <CalendarOutlined /> {{ formatDateTime(examData?.start_time) }}
          </a-descriptions-item>
          <a-descriptions-item label="结束时间">
            <CalendarOutlined /> {{ formatDateTime(examData?.end_time) }}
          </a-descriptions-item>
          <a-descriptions-item label="考试说明" :span="{ xs: 1, sm: 2, md: 3 }">
            <div class="exam-description">
              {{ examData?.description || '暂无说明' }}
            </div>
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 统计数据卡片 -->
      <a-row :gutter="[16, 16]" class="stats-row">
        <a-col :xs="12" :sm="6">
          <a-card class="stat-card stat-primary">
            <div class="stat-icon-wrapper">
              <TeamOutlined class="stat-icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ examData?.enrolled_count || 0 }}</div>
              <div class="stat-label">参与人数</div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6">
          <a-card class="stat-card stat-success">
            <div class="stat-icon-wrapper">
              <CheckCircleOutlined class="stat-icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ examData?.total_submissions || 0 }}</div>
              <div class="stat-label">已提交</div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6">
          <a-card class="stat-card stat-warning">
            <div class="stat-icon-wrapper">
              <PercentageOutlined class="stat-icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ getCompletionRate() }}%</div>
              <div class="stat-label">完成率</div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6">
          <a-card class="stat-card stat-info">
            <div class="stat-icon-wrapper">
              <BarChartOutlined class="stat-icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value highlight">{{ avgScore }}</div>
              <div class="stat-label">平均分</div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 关联套卷 -->
      <a-card 
        title="关联套卷" 
        :bordered="false" 
        class="papers-card"
        :head-style="{ borderBottom: '1px solid #f0f0f0' }"
      >
        <div class="table-responsive">
          <a-table
            :columns="paperColumns"
            :data-source="papersList"
            :pagination="false"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" @click="previewPaper(record.id)">
                  <EyeOutlined /> 预览
                </a-button>
              </template>
            </template>
          </a-table>
        </div>
      </a-card>

      <!-- 参与学生列表 -->
      <a-card 
        title="参与学生" 
        :bordered="false" 
        class="students-card"
        :head-style="{ borderBottom: '1px solid #f0f0f0' }"
      >
        <template #extra>
          <a-space>
            <a-radio-group v-model:value="studentFilter" button-style="solid" size="small">
              <a-radio-button value="all">全部</a-radio-button>
              <a-radio-button value="submitted">已提交</a-radio-button>
              <a-radio-button value="absent">缺考</a-radio-button>
            </a-radio-group>
            <a-button type="primary" size="small" @click="exportStudents">
              <DownloadOutlined />
              导出名单
            </a-button>
          </a-space>
        </template>
        
        <!-- 搜索框 -->
        <div class="student-search">
          <a-input
            v-model:value="studentSearchKeyword"
            placeholder="搜索学生姓名或学号"
            allow-clear
            style="max-width: 300px"
            @change="handleStudentSearch"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
        </div>
        
        <div class="table-responsive">
          <a-table
            :columns="studentColumns"
            :data-source="filteredStudentList"
            :loading="studentsLoading"
            :pagination="studentPagination"
            row-key="id"
            @change="handleStudentTableChange"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <!-- 状态列 -->
              <template v-if="column.key === 'status'">
                <a-tag :color="getStudentStatusColor(record.status)">
                  {{ getStudentStatusText(record.status) }}
                </a-tag>
              </template>
              <!-- 得分列 -->
              <template v-if="column.key === 'score'">
                <span 
                  class="score-display"
                  :class="{ 
                    'score-null': record.total_score === null,
                    'score-high': record.total_score && record.total_score >= 90,
                    'score-pass': record.total_score && record.total_score >= 60 && record.total_score < 90,
                    'score-fail': record.total_score && record.total_score < 60
                  }"
                >
                  {{ record.total_score !== null ? record.total_score : '-' }}
                </span>
              </template>
              <!-- 操作列 -->
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" @click="viewStudentDetail(record)">
                  <FileSearchOutlined /> 查看答卷
                </a-button>
              </template>
            </template>
          </a-table>
        </div>
      </a-card>

      <!-- 成绩统计 -->
      <a-card 
        title="成绩分布" 
        :bordered="false" 
        class="score-stats-card" 
        v-if="scoreStats"
        :head-style="{ borderBottom: '1px solid #f0f0f0' }"
      >
        <a-row :gutter="[24, 24]">
          <a-col :xs="24" :md="8">
            <div class="score-detail-item">
              <div class="score-detail-label">最高分</div>
              <div class="score-detail-value success">{{ scoreStats.max_score || 0 }}</div>
            </div>
          </a-col>
          <a-col :xs="24" :md="8">
            <div class="score-detail-item">
              <div class="score-detail-label">最低分</div>
              <div class="score-detail-value error">{{ scoreStats.min_score || 0 }}</div>
            </div>
          </a-col>
          <a-col :xs="24" :md="8">
            <div class="score-detail-item">
              <div class="score-detail-label">标准差</div>
              <div class="score-detail-value">{{ scoreStats.std_deviation || 0 }}</div>
            </div>
          </a-col>
        </a-row>
        
        <!-- 分数段分布 -->
        <div class="score-distribution" v-if="scoreStats.distribution">
          <h4>分数段分布</h4>
          <a-row :gutter="[8, 8]">
            <a-col :span="6" v-for="(count, range) in scoreStats.distribution" :key="range">
              <div class="distribution-item">
                <div class="distribution-range">{{ range }}分</div>
                <div class="distribution-count">{{ count }}人</div>
                <a-progress 
                  :percent="Math.round((count / scoreStats.total_count) * 100)" 
                  :show-info="false"
                  :stroke-color="getDistributionColor(range)"
                  size="small"
                />
              </div>
            </a-col>
          </a-row>
        </div>
      </a-card>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  EditOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  DownloadOutlined,
  SearchOutlined,
  EyeOutlined,
  FileSearchOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  CalendarOutlined,
} from '@ant-design/icons-vue'
import { getExam, getExamStudents } from '@/api/exams'
import type { Exam } from '@/types/api'
import { PercentageOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()
const examId = computed(() => Number(route.params.id))

// ── 数据状态 ──
const loading = ref(false)
const examData = ref<Exam | null>(null)
const papersList = ref<any[]>([])
const studentList = ref<any[]>([])
const studentsLoading = ref(false)
const scoreStats = ref<any>(null)
const studentSearchKeyword = ref('')
const studentFilter = ref('all')

// ── 表格列定义 ──
const paperColumns = [
  { title: '套卷名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '总分', dataIndex: 'total_score', key: 'totalScore', width: 100, align: 'center' },
  { title: '题目数量', dataIndex: 'total_questions', key: 'questionCount', width: 100, align: 'center' },
  { title: '操作', key: 'action', width: 100, align: 'center' },
]

const studentColumns = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
  { title: '学号', dataIndex: 'identity_no', key: 'studentNo', width: 120 },
  { title: '状态', key: 'status', width: 100, align: 'center' },
  { title: '得分', key: 'score', width: 100, align: 'center' },
  { title: '提交时间', dataIndex: 'submitted_at', key: 'submitTime', width: 160 },
  { title: '操作', key: 'action', width: 120, align: 'center', fixed: 'right' },
]

const studentPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 人`,
})

// ── 过滤后的学生列表 ──
const filteredStudentList = computed(() => {
  let result = studentList.value
  
  // 状态筛选
  if (studentFilter.value !== 'all') {
    result = result.filter(s => s.status === studentFilter.value)
  }
  
  // 关键词搜索
  const keyword = studentSearchKeyword.value.trim().toLowerCase()
  if (keyword) {
    result = result.filter(s => 
      s.name?.toLowerCase().includes(keyword) || 
      s.identity_no?.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

// ── 工具函数 ──
function getStatusColor(status?: string): string {
  const colorMap: Record<string, string> = {
    draft: 'default',
    pending: 'orange',
    open: 'green',
    closed: 'red',
    finished: 'gray',
  }
  return colorMap[status || ''] || 'default'
}

function getStatusText(status?: string): string {
  const textMap: Record<string, string> = {
    draft: '草稿',
    pending: '待开放',
    open: '进行中',
    closed: '已关闭',
    finished: '已结束',
  }
  return textMap[status || ''] || status || '-'
}

function getStudentStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    submitted: 'blue',
    graded: 'green',
    absent: 'red',
    in_progress: 'processing',
  }
  return colorMap[status] || 'default'
}

function getStudentStatusText(status: string): string {
  const textMap: Record<string, string> = {
    submitted: '已提交',
    graded: '已评分',
    absent: '缺考',
    in_progress: '进行中',
  }
  return textMap[status] || status
}

function getDistributionColor(range: string): string {
  const score = parseInt(range)
  if (score >= 90) return '#52c41a'
  if (score >= 80) return '#1890ff'
  if (score >= 60) return '#faad14'
  return '#f5222d'
}

function formatDateTime(time?: string): string {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
}

function getCompletionRate(): number {
  if (!examData.value?.enrolled_count) return 0
  return Math.round((examData.value.total_submissions / examData.value.enrolled_count) * 100)
}

const avgScore = computed(() => {
  if (!scoreStats.value?.average_score) return '-'
  return Math.round(scoreStats.value.average_score * 10) / 10
})

// ── 数据加载 ──
async function fetchExamData() {
  loading.value = true
  try {
    const res = await getExam(examId.value)
    examData.value = res.data
    papersList.value = res.data?.papers || []
    await fetchStudents()
    // 使用学生数据计算统计
    calculateStatsFromStudents()
  } catch (error) {
    message.error('获取考试详情失败')
  } finally {
    loading.value = false
  }
}

// 从学生数据计算统计
function calculateStatsFromStudents() {
  const scores = studentList.value
    .map(s => s.total_score)
    .filter(s => s !== null && s !== undefined) as number[]
  
  if (scores.length === 0) {
    scoreStats.value = {
      max_score: 0,
      min_score: 0,
      average_score: 0,
      std_deviation: 0,
      total_count: studentList.value.length,
      distribution: {}
    }
    return
  }
  
  const max = Math.max(...scores)
  const min = Math.min(...scores)
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  
  // 计算标准差
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length
  const stdDev = Math.sqrt(variance)
  
  // 计算分布
  const distribution: Record<string, number> = {
    '90-100': 0,
    '80-89': 0,
    '70-79': 0,
    '60-69': 0,
    '0-59': 0
  }
  scores.forEach(score => {
    if (score >= 90) distribution['90-100']++
    else if (score >= 80) distribution['80-89']++
    else if (score >= 70) distribution['70-79']++
    else if (score >= 60) distribution['60-69']++
    else distribution['0-59']++
  })
  
  scoreStats.value = {
    max_score: max,
    min_score: min,
    average_score: Math.round(avg * 10) / 10,
    std_deviation: Math.round(stdDev * 10) / 10,
    total_count: studentList.value.length,
    distribution
  }
}

async function fetchStudents() {
  studentsLoading.value = true
  try {
    const res = await getExamStudents(examId.value, {
      page: studentPagination.current,
      size: studentPagination.pageSize,
    })
    studentList.value = res.data?.list || res.data?.items || []
    studentPagination.total = res.data?.total || 0
  } catch (error) {
    console.error('获取学生列表失败:', error)
  } finally {
    studentsLoading.value = false
  }
}

// 统计已内联到 calculateStatsFromStudents

// ── 事件处理 ──
function handleBack() {
  router.push('/teacher/exams')
}

function handleEdit() {
  router.push(`/teacher/exams/${examId.value}/edit`)
}

function previewPaper(paperId: number) {
  window.open(`/teacher/papers/${paperId}`, '_blank')
}

function viewStudentDetail(record: any) {
  router.push(`/teacher/students/${record.id}`)
}

function exportStudents() {
  message.info('导出功能开发中...')
}

function handleStudentTableChange(pag: any) {
  studentPagination.current = pag.current
  studentPagination.pageSize = pag.pageSize
  fetchStudents()
}

function handleStudentSearch() {
  // 搜索时重置分页
  studentPagination.current = 1
}

// ── 监听 ──
watch(() => studentFilter.value, () => {
  studentPagination.current = 1
})

watch(() => examId.value, () => {
  if (examId.value) {
    fetchExamData()
  }
})

onMounted(() => {
  if (examId.value) {
    fetchExamData()
  }
})

onMounted(() => {
  if (!examData.value) {
    fetchExamData()
  }
})
</script>

<style scoped lang="less">
.exam-view-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  padding-left: 0;
  padding-right: 0;
}

/* 基本信息卡片 */
.info-card {
  margin-bottom: var(--space-4);
}

.exam-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.status-tag {
  font-size: var(--font-size-sm);
}

.exam-description {
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  max-height: 100px;
  overflow-y: auto;
}

/* 统计卡片 */
.stats-row {
  margin-bottom: var(--space-4);
}

.stat-card {
  display: flex;
  align-items: center;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  
  :deep(.ant-card-body) {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 0;
    width: 100%;
  }
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon {
  font-size: 24px;
  color: white;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: 1.2;
  
  &.highlight {
    color: var(--primary-500);
  }
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: 2px;
}

/* 统计卡片颜色变体 */
.stat-primary .stat-icon-wrapper {
  background: linear-gradient(135deg, var(--primary-400), var(--primary-600));
}

.stat-success .stat-icon-wrapper {
  background: linear-gradient(135deg, var(--success-400), var(--success-600));
}

.stat-warning .stat-icon-wrapper {
  background: linear-gradient(135deg, var(--warning-400), var(--warning-600));
}

.stat-info .stat-icon-wrapper {
  background: linear-gradient(135deg, #36cfc9, #08979c);
}

/* 表格卡片 */
.papers-card,
.students-card,
.score-stats-card {
  margin-bottom: var(--space-4);
}

.student-search {
  margin-bottom: var(--space-3);
}

/* 分数显示 */
.score-display {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
}

.score-null {
  color: var(--text-tertiary);
}

.score-high {
  color: var(--success-500);
}

.score-pass {
  color: var(--primary-500);
}

.score-fail {
  color: var(--error-500);
}

/* 成绩详情 */
.score-detail-item {
  text-align: center;
  padding: var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.score-detail-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.score-detail-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  
  &.success {
    color: var(--success-500);
  }
  
  &.error {
    color: var(--error-500);
  }
}

/* 分数段分布 */
.score-distribution {
  margin-top: var(--space-5);
  
  h4 {
    margin-bottom: var(--space-3);
    font-weight: var(--font-weight-medium);
  }
}

.distribution-item {
  background: var(--bg-secondary);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  text-align: center;
}

.distribution-range {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
}

.distribution-count {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
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

/* 响应式适配 */
@media (max-width: 768px) {
  .stat-card {
    :deep(.ant-card-body) {
      flex-direction: column;
      text-align: center;
    }
  }
  
  .stat-icon-wrapper {
    width: 40px;
    height: 40px;
  }
  
  .stat-icon {
    font-size: 20px;
  }
  
  .stat-value {
    font-size: var(--font-size-lg);
  }
  
  .score-detail-value {
    font-size: var(--font-size-xl);
  }
}
</style>
