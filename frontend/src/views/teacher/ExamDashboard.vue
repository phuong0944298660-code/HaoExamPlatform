<template>
  <div class="exam-dashboard-page">
    <!-- 页面标题 -->
    <a-page-header
      title="考试监控看板"
      :sub-title="examInfo?.name"
      @back="handleBack"
    >
      <template #extra>
        <a-space>
          <a-tag :color="getStatusColor(examInfo?.status)">
            {{ getStatusText(examInfo?.status) }}
          </a-tag>
          <a-switch
            v-model:checked="autoRefresh"
            checked-children="自动刷新"
            un-checked-children="手动刷新"
          />
          <a-button @click="refreshData">
            <ReloadOutlined :spin="refreshing" />
            刷新
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <!-- 考试基本信息卡片 -->
    <a-row :gutter="16" class="info-row">
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="考试时间"
            :value="formatTimeRange(examInfo?.start_time, examInfo?.end_time)"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="考试时长" :value="examInfo?.duration" suffix="分钟" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="套卷数量" :value="examInfo?.paper_ids?.length || 0" suffix="套" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="年级" :value="examInfo?.grade_group || '-'" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 实时统计数据 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="4">
        <a-card class="stat-card">
          <a-statistic
            title="应到人数"
            :value="stats.expectedCount"
            :value-style="{ color: '#1890ff' }"
          >
            <template #prefix>
              <TeamOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="4">
        <a-card class="stat-card">
          <a-statistic
            title="实到人数"
            :value="stats.actualCount"
            :value-style="{ color: '#52c41a' }"
          >
            <template #prefix>
              <CheckCircleOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="4">
        <a-card class="stat-card">
          <a-statistic
            title="缺考人数"
            :value="stats.absentCount"
            :value-style="{ color: '#ff4d4f' }"
          >
            <template #prefix>
              <CloseCircleOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="4">
        <a-card class="stat-card">
          <a-statistic
            title="已提交"
            :value="stats.submittedCount"
            :value-style="{ color: '#722ed1' }"
          >
            <template #prefix>
              <FileDoneOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="4">
        <a-card class="stat-card">
          <a-statistic
            title="考试中"
            :value="stats.inProgressCount"
            :value-style="{ color: '#faad14' }"
          >
            <template #prefix>
              <EditOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="4">
        <a-card class="stat-card">
          <a-statistic
            title="平均进度"
            :value="stats.avgProgress"
            :precision="1"
            suffix="%"
            :value-style="{ color: '#13c2c2' }"
          >
            <template #prefix>
              <PieChartOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 考生状态列表 -->
    <a-card title="考生实时状态" :bordered="false" class="students-card">
      <template #extra>
        <a-space>
          <a-input
            v-model:value="searchKeyword"
            placeholder="搜索考生姓名"
            style="width: 200px"
            allow-clear
            @pressEnter="filterStudents"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
          <a-select
            v-model:value="statusFilter"
            placeholder="筛选状态"
            style="width: 120px"
            allow-clear
            @change="filterStudents"
          >
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="not_started">未开始</a-select-option>
            <a-select-option value="in_progress">进行中</a-select-option>
            <a-select-option value="submitted">已提交</a-select-option>
            <a-select-option value="abnormal">异常</a-select-option>
          </a-select>
        </a-space>
      </template>

      <a-table
        :columns="columns"
        :data-source="filteredStudents"
        :pagination="pagination"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <!-- 状态列 -->
          <template v-if="column.key === 'status'">
            <a-badge
              :status="getStudentStatusBadge(record.status)"
              :text="getStudentStatusText(record.status)"
            />
          </template>

          <!-- 答题进度列 -->
          <template v-if="column.key === 'progress'">
            <a-progress
              :percent="record.progress"
              :size="'small'"
              :status="record.progress === 100 ? 'success' : 'normal'"
            />
          </template>

          <!-- 切屏次数列 -->
          <template v-if="column.key === 'switchCount'">
            <a-tag :color="record.switchCount > 3 ? 'red' : record.switchCount > 0 ? 'orange' : 'green'">
              {{ record.switchCount }} 次
            </a-tag>
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button
                type="link"
                size="small"
                :disabled="record.status === 'submitted'"
                @click="handleForceSubmit(record)"
              >
                强制交卷
              </a-button>
              <a-button
                type="link"
                size="small"
                :danger="record.status !== 'abnormal'"
                @click="handleMarkAbnormal(record)"
              >
                {{ record.status === 'abnormal' ? '取消标记' : '标记异常' }}
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  ReloadOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileDoneOutlined,
  EditOutlined,
  PieChartOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import type { TablePaginationConfig } from 'ant-design-vue'
import type { Exam } from '@/types/api'
import { getExam, getExamDashboard, getExamStudents, emergencyExtend, closeExam } from '@/api/exams'
import { submitExam } from '@/api/exams'

// ── 路由实例 ──
const route = useRoute()
const router = useRouter()
const examId = computed(() => route.params.examId as string)

// ── 自动刷新相关 ──
const autoRefresh = ref(true)
const refreshing = ref(false)
let refreshTimer: number | null = null

// ── 考试信息 ──
const examInfo = ref<Exam | null>(null)

// ── 统计数据 ──
const stats = reactive({
  expectedCount: 0,
  actualCount: 0,
  absentCount: 0,
  submittedCount: 0,
  inProgressCount: 0,
  avgProgress: 0,
})

// ── 考生列表 ──
interface StudentStatus {
  id: number
  name: string
  studentNo: string
  loginTime: string | null
  progress: number
  status: string
  switchCount: number
  ipAddress: string
}

const allStudents = ref<StudentStatus[]>([])
const filteredStudents = ref<StudentStatus[]>([])
const searchKeyword = ref('')
const statusFilter = ref('')

// ── 表格列定义 ──
const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    width: 100,
  },
  {
    title: '学号',
    dataIndex: 'studentNo',
    key: 'studentNo',
    width: 120,
  },
  {
    title: '登录时间',
    dataIndex: 'loginTime',
    key: 'loginTime',
    width: 180,
  },
  {
    title: '答题进度',
    key: 'progress',
    width: 150,
  },
  {
    title: '当前状态',
    key: 'status',
    width: 100,
  },
  {
    title: '切屏次数',
    key: 'switchCount',
    width: 100,
  },
  {
    title: 'IP地址',
    dataIndex: 'ipAddress',
    key: 'ipAddress',
    width: 130,
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
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
  showTotal: (total: number) => `共 ${total} 人`,
})

// ── 状态相关工具函数 ──
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

function getStudentStatusBadge(status: string): string {
  const badgeMap: Record<string, string> = {
    not_started: 'default',
    in_progress: 'processing',
    submitted: 'success',
    abnormal: 'error',
    timeout: 'warning',
  }
  return badgeMap[status] || 'default'
}

function getStudentStatusText(status: string): string {
  const textMap: Record<string, string> = {
    not_started: '未开始',
    in_progress: '进行中',
    submitted: '已提交',
    abnormal: '异常',
    timeout: '超时提交',
  }
  return textMap[status] || status
}

// ── 时间格式化 ──
function formatTimeRange(start?: string, end?: string): string {
  if (!start || !end) return '-'
  return `${dayjs(start).format('MM-DD HH:mm')} ~ ${dayjs(end).format('HH:mm')}`
}

// ── 加载考试数据（真实API） ──
async function loadExamData() {
  try {
    const id = parseInt(examId.value)
    const res = await getExam(id)
    examInfo.value = res.data
  } catch {
    message.error('加载考试信息失败')
  }
}

// ── 加载考生数据（真实API） ──
async function loadStudents() {
  try {
    refreshing.value = true
    const id = parseInt(examId.value)

    // 并行加载 dashboard 统计和学生列表
    const [dashRes, studentsRes] = await Promise.all([
      getExamDashboard(id).catch(() => null),
      getExamStudents(id, { page: pagination.current, size: pagination.pageSize }),
    ])

    // 处理 dashboard 统计数据
    if (dashRes?.data) {
      const d = dashRes.data
      stats.expectedCount = d.enrolled_count || d.expected_count || 0
      stats.actualCount = d.actual_count || d.logged_in_count || 0
      stats.absentCount = d.absent_count || (stats.expectedCount - stats.actualCount)
      stats.submittedCount = d.submitted_count || d.total_submissions || 0
      stats.inProgressCount = d.in_progress_count || 0
      stats.avgProgress = d.avg_progress || 0
    }

    // 处理学生列表
    const items = studentsRes?.data?.items || []
    allStudents.value = items.map((item: any) => ({
      id: item.id || item.account_id,
      name: item.student_name || item.name || `学生${item.account_id}`,
      studentNo: item.identity_no || item.username || '-',
      loginTime: item.login_time || item.started_at || null,
      progress: item.progress || 0,
      status: item.status || 'not_started',
      switchCount: item.switch_count || item.tab_switches || 0,
      ipAddress: item.ip_address || item.login_ip || '-',
    }))

    filterStudents()
    pagination.total = studentsRes?.data?.total || allStudents.value.length
  } catch (err) {
    console.error('loadStudents error:', err)
  } finally {
    refreshing.value = false
  }
}

// ── 筛选考生 ──
function filterStudents() {
  let filtered = [...allStudents.value]

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(keyword) ||
      s.studentNo.includes(keyword)
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(s => s.status === statusFilter.value)
  }

  filteredStudents.value = filtered
}

// ── 刷新数据 ──
function refreshData() {
  loadExamData()
  loadStudents()
}

// ── 强制交卷（真实API） ──
function handleForceSubmit(record: StudentStatus) {
  Modal.confirm({
    title: '确认强制交卷',
    content: `确定要强制学生「${record.name}」交卷吗？此操作不可撤销。`,
    okText: '确认',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        const id = parseInt(examId.value)
        await submitExam(id, { force: true })
        record.status = 'submitted'
        record.progress = 100
        filterStudents()
        message.success('强制交卷成功')
        // 刷新数据获取最新状态
        loadStudents()
      } catch {
        message.error('操作失败')
      }
    },
  })
}

// ── 标记异常 ──
function handleMarkAbnormal(record: StudentStatus) {
  const isAbnormal = record.status === 'abnormal'
  Modal.confirm({
    title: isAbnormal ? '取消异常标记' : '标记异常',
    content: isAbnormal
      ? `确定要取消「${record.name}」的异常标记吗？`
      : `确定要将「${record.name}」标记为异常状态吗？`,
    okText: '确认',
    okType: isAbnormal ? 'default' : 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        // TODO: 后端暂无标记异常API，暂时保留前端状态更新
        record.status = isAbnormal ? 'in_progress' : 'abnormal'
        filterStudents()
        message.success(isAbnormal ? '已取消异常标记' : '已标记为异常')
      } catch {
        message.error('操作失败')
      }
    },
  })
}

// ── 返回 ──
function handleBack() {
  router.back()
}

// ── 初始化 ──
onMounted(() => {
  loadExamData()
  loadStudents()

  // 设置自动刷新
  refreshTimer = window.setInterval(() => {
    if (autoRefresh.value) {
      loadStudents()
    }
  }, 10000) // 每10秒刷新一次
})

// ── 清理 ──
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped lang="less">
.exam-dashboard-page {
  max-width: 1400px;
  margin: 0 auto;
}

.info-row {
  margin-top: 16px;
}

.stats-row {
  margin-top: 16px;
}

.stat-card {
  text-align: center;
  
  :deep(.ant-statistic-title) {
    font-size: 14px;
  }
  
  :deep(.ant-statistic-content) {
    font-size: 28px;
    font-weight: bold;
  }
}

.students-card {
  margin-top: 16px;
}
</style>
