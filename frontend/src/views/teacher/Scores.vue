<template>
  <div class="scores-page">
    <!-- 页面标题 -->
    <a-page-header title="成绩管理" sub-title="查看和导出考试成绩">
      <template #extra>
        <a-space>
          <a-button :disabled="!selectedExam" @click="showGradingUpload = true">
            <UploadOutlined />
            导入评分表
          </a-button>
          <a-button type="primary" :disabled="!selectedExam" @click="handleExport">
            <DownloadOutlined />
            导出成绩
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <!-- 考试选择器 -->
    <a-card :bordered="false" class="search-card">
      <a-row :gutter="[16, 16]" align="middle">
        <a-col :xs="24" :md="8">
          <a-select
            v-model:value="selectedExam"
            placeholder="请选择要查看成绩的考试"
            show-search
            :filter-option="filterExamOption"
            style="width: 100%"
            @change="handleExamChange"
            size="large"
            :loading="examLoading"
          >
            <a-select-option
              v-for="exam in examList"
              :key="exam.id"
              :value="exam.id"
              :label="exam.name"
            >
              {{ exam.name }}
              <a-tag :color="getStatusColor(exam.status)" style="margin-left: 8px">
                {{ getStatusText(exam.status) }}
              </a-tag>
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :md="8">
          <a-input
            v-model:value="searchKeyword"
            placeholder="搜索学生姓名或学号"
            allow-clear
            @change="handleSearchChange"
            size="large"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
        </a-col>
        <a-col :xs="24" :md="8" style="text-align: right">
          <a-button @click="handleClearFilters" :disabled="!selectedExam && !searchKeyword">
            <ClearOutlined />
            清空筛选
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 成绩统计卡片 -->
    <a-row :gutter="[16, 16]" class="stats-row" v-if="selectedExam">
      <a-col :xs="12" :sm="8" :md="4">
        <a-card class="stat-card" :body-style="{ padding: '16px' }">
          <a-statistic title="参考人数" :value="scoreStats.totalCount" suffix="人">
            <template #prefix>
              <TeamOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="8" :md="4">
        <a-card class="stat-card" :body-style="{ padding: '16px' }">
          <a-statistic
            title="平均分"
            :value="scoreStats.averageScore"
            :precision="2"
            suffix="分"
            :value-style="{ color: '#1890ff' }"
          />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="8" :md="4">
        <a-card class="stat-card" :body-style="{ padding: '16px' }">
          <a-statistic
            title="最高分"
            :value="scoreStats.maxScore"
            :precision="1"
            suffix="分"
            :value-style="{ color: '#52c41a' }"
          />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="8" :md="4">
        <a-card class="stat-card" :body-style="{ padding: '16px' }">
          <a-statistic
            title="最低分"
            :value="scoreStats.minScore"
            :precision="1"
            suffix="分"
            :value-style="{ color: '#ff4d4f' }"
          />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="8" :md="4">
        <a-card class="stat-card" :body-style="{ padding: '16px' }">
          <a-statistic
            title="及格率"
            :value="scoreStats.passRate"
            :precision="2"
            suffix="%"
            :value-style="{ color: '#722ed1' }"
          />
        </a-card>
      </a-col>
      <a-col :xs="12" :sm="8" :md="4">
        <a-card class="stat-card" :body-style="{ padding: '16px' }">
          <a-statistic
            title="优秀率"
            :value="scoreStats.excellentRate"
            :precision="2"
            suffix="%"
            :value-style="{ color: '#faad14' }"
          />
        </a-card>
      </a-col>
    </a-row>

    <!-- 成绩列表表格 -->
    <a-card :bordered="false" class="table-card" v-if="selectedExam">
      <div class="table-responsive">
        <a-table
          :columns="columns"
          :data-source="filteredScores"
          :loading="loading"
          :pagination="pagination"
          row-key="id"
          @change="handleTableChange"
          size="middle"
        >
          <template #bodyCell="{ column, record, index }">
            <!-- 排名列 -->
            <template v-if="column.key === 'rank'">
              <a-tag :color="getRankColor(index + 1)" class="rank-tag">
                {{ index + 1 }}
              </a-tag>
            </template>

            <!-- 客观题得分列 -->
            <template v-if="column.key === 'objectiveScore'">
              <span :class="{ 'text-muted': record.objectiveScore === null }">
                {{ record.objectiveScore !== null ? record.objectiveScore : '-' }}
              </span>
            </template>

            <!-- 主观题得分列 -->
            <template v-if="column.key === 'subjectiveScore'">
              <span :class="{ 'text-muted': record.subjectiveScore === null }">
                {{ record.subjectiveScore !== null ? record.subjectiveScore : '-' }}
              </span>
            </template>

            <!-- 总分列 -->
            <template v-if="column.key === 'totalScore'">
              <span 
                class="total-score"
                :class="{ 
                  'text-muted': record.totalScore === null,
                  'score-high': record.totalScore && record.totalScore >= 90,
                  'score-pass': record.totalScore && record.totalScore >= 60 && record.totalScore < 90,
                  'score-fail': record.totalScore && record.totalScore < 60
                }"
              >
                {{ record.totalScore !== null ? record.totalScore : '未出分' }}
              </span>
            </template>

            <!-- 状态列 -->
            <template v-if="column.key === 'status'">
              <a-tag :color="getScoreStatusColor(record.status)">
                {{ getScoreStatusText(record.status) }}
              </a-tag>
            </template>

            <!-- 操作列 -->
            <template v-if="column.key === 'action'">
              <a-button type="link" size="small" @click="handleViewDetail(record)">
                查看详情
              </a-button>
            </template>
          </template>
        </a-table>
      </div>
    </a-card>

    <!-- 未选择考试提示 -->
    <a-card v-if="!selectedExam" :bordered="false" class="empty-card">
      <EmptyState
        type="chart"
        title="请选择考试"
        description="选择上方下拉菜单中的考试，查看该考试的成绩统计和详细数据"
        size="large"
      />
    </a-card>

    <!-- 搜索无结果提示 -->
    <a-card v-else-if="filteredScores.length === 0 && !loading" :bordered="false" class="empty-card">
      <EmptyState
        type="search"
        title="未找到匹配的学生"
        description="尝试使用其他关键词搜索，或清空搜索条件"
        action-text="清空搜索"
        @action="searchKeyword = ''; handleSearchChange()"
        size="medium"
      />
    </a-card>

    <!-- 评分表导入弹窗 -->
    <a-modal
      v-model:open="showGradingUpload"
      title="批量导入评分表"
      :footer="null"
      width="750px"
      destroy-on-close
    >
      <GradingSheetUploader
        v-if="selectedExam"
        :exam-id="selectedExam"
        @import-success="onGradingImportSuccess"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  DownloadOutlined,
  SearchOutlined,
  TeamOutlined,
  UploadOutlined,
  ClearOutlined,
} from '@ant-design/icons-vue'
import type { TablePaginationConfig } from 'ant-design-vue'
import type { Exam } from '@/types/api'
import { getExams } from '@/api/exams'
import { getScores, exportScores } from '@/api/scores'
import GradingSheetUploader from '@/components/grading/GradingSheetUploader.vue'
import EmptyState from '@/components/common/EmptyState.vue'

// ── 考试列表 ──
const examList = ref<Exam[]>([])
const selectedExam = ref<number | undefined>(undefined)
const examLoading = ref(false)

// ── 搜索 ──
const searchKeyword = ref('')
const searchTimeout = ref<number | null>(null)

// ── 评分表导入弹窗 ──
const showGradingUpload = ref(false)

// ── 成绩数据 ──
interface ScoreRecord {
  id: number
  examId: number
  studentName: string
  studentNo: string
  objectiveScore: number | null
  subjectiveScore: number | null
  totalScore: number | null
  status: string
  submitTime: string | null
}

const allScores = ref<ScoreRecord[]>([])
const filteredScores = ref<ScoreRecord[]>([])
const loading = ref(false)

// ── 统计 ──
const scoreStats = reactive({
  totalCount: 0,
  averageScore: 0,
  maxScore: 0,
  minScore: 0,
  passRate: 0,
  excellentRate: 0,
})

// ── 表格列定义 ──
const columns = [
  {
    title: '排名',
    key: 'rank',
    width: 70,
    align: 'center',
    fixed: 'left',
  },
  {
    title: '姓名',
    dataIndex: 'studentName',
    key: 'studentName',
    width: 100,
    fixed: 'left',
  },
  {
    title: '学号',
    dataIndex: 'studentNo',
    key: 'studentNo',
    width: 120,
  },
  {
    title: '客观题',
    key: 'objectiveScore',
    width: 100,
    align: 'center',
    sorter: (a: ScoreRecord, b: ScoreRecord) =>
      (a.objectiveScore || 0) - (b.objectiveScore || 0),
  },
  {
    title: '主观题',
    key: 'subjectiveScore',
    width: 100,
    align: 'center',
    sorter: (a: ScoreRecord, b: ScoreRecord) =>
      (a.subjectiveScore || 0) - (b.subjectiveScore || 0),
  },
  {
    title: '总分',
    key: 'totalScore',
    width: 90,
    align: 'center',
    sorter: (a: ScoreRecord, b: ScoreRecord) =>
      (a.totalScore || 0) - (b.totalScore || 0),
  },
  {
    title: '状态',
    key: 'status',
    width: 90,
    align: 'center',
  },
  {
    title: '交卷时间',
    dataIndex: 'submitTime',
    key: 'submitTime',
    width: 160,
  },
  {
    title: '操作',
    key: 'action',
    width: 90,
    align: 'center',
    fixed: 'right',
  },
]

// ── 分页配置 ──
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
  pageSizeOptions: ['10', '20', '50', '100'],
})

// ── 状态相关工具函数 ──
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

function getScoreStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    submitted: 'blue',
    graded: 'green',
    absent: 'red',
    cheating: 'orange',
    in_progress: 'processing',
    timeout: 'warning',
  }
  return colorMap[status] || 'default'
}

function getScoreStatusText(status: string): string {
  const textMap: Record<string, string> = {
    submitted: '已提交',
    graded: '已出分',
    absent: '缺考',
    cheating: '作弊',
    in_progress: '答题中',
    timeout: '超时提交',
  }
  return textMap[status] || status
}

function getRankColor(rank: number): string {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'orange'
  return 'blue'
}

// ── 筛选考试选项 ──
function filterExamOption(input: string, option: any) {
  return (option?.label || '').toLowerCase().includes(input.toLowerCase())
}

// ── 加载考试列表 ──
async function fetchExamList() {
  examLoading.value = true
  try {
    const res = await getExams({ page: 1, size: 100 })
    examList.value = res.data?.list || res.data?.items || []
    
    // 默认选中第一个考试
    if (examList.value.length > 0 && !selectedExam.value) {
      const firstExamId = examList.value[0].id
      selectedExam.value = firstExamId
      await handleExamChange(firstExamId)
    }
  } catch {
    message.error('加载考试列表失败')
  } finally {
    examLoading.value = false
  }
}

// ── 考试选择变化 ──
async function handleExamChange(examId: number) {
  loading.value = true
  pagination.current = 1
  searchKeyword.value = ''
  try {
    await fetchScoreData(examId)
  } finally {
    loading.value = false
  }
}

// ── 从后端获取成绩数据 ──
async function fetchScoreData(examId: number) {
  try {
    const res = await getScores({
      exam_id: examId,
      page: pagination.current,
      size: pagination.pageSize,
    })

    const items = res.data?.list || res.data?.items || []
    // 将后端返回的字段映射到前端的ScoreRecord结构
    allScores.value = items.map((item: any) => ({
      id: item.id,
      examId: item.exam_id,
      studentName: item.student_name || item.name || `学生${item.account_id}`,
      studentNo: item.identity_no || item.username || '-',
      objectiveScore: item.objective_score,
      subjectiveScore: item.subjective_score,
      totalScore: item.total_score,
      status: item.status,
      submitTime: item.submitted_at,
    }))

    pagination.total = res.data?.total || 0

    // 应用搜索过滤
    applySearchFilter()
    
    // 计算统计数据
    calculateStats(allScores.value)
  } catch (err) {
    message.error('加载成绩数据失败')
    console.error('fetchScoreData error:', err)
  }
}

// ── 搜索功能（带防抖） ──
function handleSearchChange() {
  // 清除之前的定时器
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  // 设置新的定时器，300ms 后执行搜索
  searchTimeout.value = window.setTimeout(() => {
    applySearchFilter()
  }, 300)
}

// ── 应用搜索过滤 ──
function applySearchFilter() {
  const keyword = searchKeyword.value.trim().toLowerCase()
  
  if (!keyword) {
    filteredScores.value = allScores.value
  } else {
    filteredScores.value = allScores.value.filter(
      (item) =>
        item.studentName.toLowerCase().includes(keyword) ||
        item.studentNo.toLowerCase().includes(keyword)
    )
  }
  
  // 重新计算过滤后的统计
  calculateStats(filteredScores.value)
}

// ── 清空筛选 ──
function handleClearFilters() {
  searchKeyword.value = ''
  if (selectedExam.value) {
    fetchScoreData(selectedExam.value)
  }
}

// ── 表格分页变化 ──
function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  if (selectedExam.value) {
    loading.value = true
    fetchScoreData(selectedExam.value).finally(() => {
      loading.value = false
    })
  }
}

// ── 计算统计数据 ──
function calculateStats(scores: ScoreRecord[]) {
  const validScores = scores.filter(s => s.totalScore !== null)
  const totalCount = validScores.length

  if (totalCount === 0) {
    scoreStats.totalCount = scores.length
    scoreStats.averageScore = 0
    scoreStats.maxScore = 0
    scoreStats.minScore = 0
    scoreStats.passRate = 0
    scoreStats.excellentRate = 0
    return
  }

  const total = validScores.reduce((sum, s) => sum + (s.totalScore || 0), 0)
  const maxScore = Math.max(...validScores.map(s => s.totalScore || 0))
  const minScore = Math.min(...validScores.map(s => s.totalScore || 0))
  const passCount = validScores.filter(s => (s.totalScore || 0) >= 60).length
  const excellentCount = validScores.filter(s => (s.totalScore || 0) >= 90).length

  scoreStats.totalCount = scores.length
  scoreStats.averageScore = Math.round((total / totalCount) * 100) / 100
  scoreStats.maxScore = maxScore
  scoreStats.minScore = minScore
  scoreStats.passRate = Math.round((passCount / totalCount) * 10000) / 100
  scoreStats.excellentRate = Math.round((excellentCount / totalCount) * 10000) / 100
}

// ── 导出成绩 ──
async function handleExport() {
  if (!selectedExam.value) return
  try {
    message.loading('正在导出成绩...', 0)

    const blob = await exportScores(selectedExam.value, 'excel')

    // 触发浏览器下载
    const url = URL.createObjectURL(blob as Blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `成绩表_${selectedExam.value}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    message.destroy()
    message.success('成绩导出成功')
  } catch {
    message.destroy()
    message.error('导出失败，请稍后重试')
  }
}

// ── 查看详情 ──
function handleViewDetail(record: ScoreRecord) {
  message.info(`查看 ${record.studentName} 的成绩详情（功能开发中）`)
}

// ── 评分表导入成功 ──
function onGradingImportSuccess(_result: any) {
  showGradingUpload.value = false
  // 刷新成绩列表
  if (selectedExam.value) {
    fetchScoreData(selectedExam.value)
  }
}

// ── 组件销毁时清理 ──
watch(() => searchTimeout.value, (timeout) => {
  if (timeout) {
    clearTimeout(timeout)
  }
})

// ── 初始化 ──
onMounted(() => {
  fetchExamList()
})
</script>

<style scoped lang="less">
.scores-page {
  max-width: 1400px;
  margin: 0 auto;
}

.search-card {
  margin-top: var(--space-4);
}

.stats-row {
  margin-top: var(--space-4);
}

.stat-card {
  text-align: center;
  
  :deep(.ant-statistic-title) {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-bottom: var(--space-1);
  }
  
  :deep(.ant-statistic-content) {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
  }
}

.table-card {
  margin-top: var(--space-4);
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  :deep(.ant-table) {
    min-width: 800px;
  }
}

.empty-card {
  margin-top: var(--space-4);
}

/* 排名标签 */
.rank-tag {
  min-width: 28px;
  text-align: center;
  font-weight: var(--font-weight-medium);
}

/* 分数样式 */
.total-score {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
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

.text-muted {
  color: var(--text-tertiary);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .stats-row {
    :deep(.ant-col) {
      margin-bottom: var(--space-2);
    }
  }
  
  .stat-card {
    :deep(.ant-statistic-content) {
      font-size: var(--font-size-lg);
    }
  }
  
  .search-card {
    :deep(.ant-col) {
      margin-bottom: var(--space-2);
    }
  }
}
</style>
