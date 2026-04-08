<template>
  <div class="exams-page">
    <!-- 页面标题 -->
    <a-page-header title="考试管理" sub-title="创建和管理考试">
      <template #extra>
        <a-button type="primary" @click="handleCreate">
          <PlusOutlined />
          创建考试
        </a-button>
      </template>
    </a-page-header>

    <!-- 搜索和筛选区域 -->
    <a-card :bordered="false" class="search-card">
      <a-row :gutter="16" align="middle">
        <a-col :span="6">
          <a-input
            v-model:value="searchKeyword"
            placeholder="搜索考试名称"
            allow-clear
            @pressEnter="handleSearch"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="statusFilter"
            placeholder="筛选状态"
            style="width: 100%"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option value="">全部状态</a-select-option>
            <a-select-option value="draft">草稿</a-select-option>
            <a-select-option value="pending">待开放</a-select-option>
            <a-select-option value="open">进行中</a-select-option>
            <a-select-option value="closed">已关闭</a-select-option>
            <a-select-option value="finished">已结束</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 学生选择器弹窗（用于发布时选人）-->
    <StudentSelectorModal
      v-model:visible="publishModalVisible"
      :grade-group="currentExam?.gradeGroup || currentExam?.grade_group"
      @confirm="handleConfirmPublish"
      @cancel="handleCancelPublish"
    />

    <!-- 考试列表表格 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data-source="examList"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <!-- 考试名称列 -->
        <template #bodyCell="{ column, record }">
          <!-- 状态列 -->
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>

          <!-- 考试时间列 -->
          <template v-if="column.key === 'time'">
            <div class="time-cell">
              <div>{{ formatDateTime(record.startTime || record.start_time) }}</div>
              <div class="time-separator">至</div>
              <div>{{ formatDateTime(record.endTime || record.end_time) }}</div>
            </div>
          </template>

          <!-- 时长列 -->
          <template v-if="column.key === 'duration'">
            <span>{{ record.duration }} 分钟</span>
          </template>

          <!-- 参与人数列 -->
          <template v-if="column.key === 'participants'">
            <span>{{ record.enrolled_count || 0 }} 人</span>
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleView(record)">
                <EyeOutlined />
                查看
              </a-button>
              <a-button type="link" size="small" @click="handleEdit(record)">
                <EditOutlined />
                编辑
              </a-button>
              <a-button
                v-if="record.status?.toLowerCase() === 'draft'"
                type="link"
                size="small"
                @click="handleShowPublishModal(record)"
              >
                <SendOutlined />
                发布
              </a-button>
              <a-button
                v-if="record.status?.toLowerCase() === 'open'"
                type="link"
                size="small"
                danger
                @click="handleClose(record)"
              >
                <CloseCircleOutlined />
                关闭
              </a-button>
              <a-button
                v-if="record.status?.toLowerCase() === 'open'"
                type="link"
                size="small"
                @click="handleMonitor(record)"
              >
                <DashboardOutlined />
                监控
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  SendOutlined,
  CloseCircleOutlined,
  DashboardOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import type { TablePaginationConfig } from 'ant-design-vue'
import type { Exam } from '@/types/api'
import StudentSelectorModal from '@/components/exam/StudentSelectorModal.vue'
import { getExams, createExam, deleteExam, publishExam, closeExam } from '@/api/exams'

// ── 路由实例 ──
const router = useRouter()

// ── 搜索和筛选状态 ──
const searchKeyword = ref('')
const statusFilter = ref('')

// ── 发布弹窗状态 ──
const publishModalVisible = ref(false)
const currentExam = ref<Exam | null>(null)

// ── 表格列定义 ──
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: '考试名称',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
  },
  {
    title: '关联套卷',
    dataIndex: 'paper_name',
    key: 'paper_name',
    ellipsis: true,
  },
  {
    title: '考试时间',
    key: 'time',
    width: 200,
  },
  {
    title: '考试时长',
    key: 'duration',
    width: 100,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '参与人数',
    key: 'participants',
    width: 100,
  },
  {
    title: '操作',
    key: 'action',
    width: 280,
    fixed: 'right',
  },
]

// ── 考试列表数据 ──
const examList = ref<Exam[]>([])
const loading = ref(false)

// ── 分页配置 ──
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
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
  return colorMap[status?.toLowerCase()] || 'default'
}

function getStatusText(status: string): string {
  const textMap: Record<string, string> = {
    draft: '草稿',
    pending: '待开放',
    open: '进行中',
    closed: '已关闭',
    finished: '已结束',
  }
  return textMap[status?.toLowerCase()] || status
}

// ── 日期格式化 ──
function formatDateTime(time: string): string {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// ── 获取考试列表 ──
async function fetchExamList() {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      size: pagination.pageSize,
      status: statusFilter.value || undefined,
      search: searchKeyword.value || undefined,
    }
    const res = await getExams(params)
    examList.value = res.data?.list || res.data?.items || []
    pagination.total = res.data?.meta?.total || 0
  } catch (error) {
    message.error('获取考试列表失败')
    console.error('[Exams] 获取考试列表失败:', error)
  } finally {
    loading.value = false
  }
}

// ── 搜索和重置 ──
function handleSearch() {
  pagination.current = 1
  fetchExamList()
}

function handleReset() {
  searchKeyword.value = ''
  statusFilter.value = ''
  pagination.current = 1
  fetchExamList()
}

// ── 表格分页变化 ──
function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchExamList()
}

// ── 操作按钮处理 ──
function handleCreate() {
  router.push('/teacher/exams/create')
}

function handleView(record: Exam) {
  router.push(`/teacher/exams/${record.id}`)
}

function handleEdit(record: Exam) {
  router.push(`/teacher/exams/${record.id}/edit`)
}

function handleMonitor(record: Exam) {
  router.push(`/teacher/exams/${record.id}/dashboard`)
}

// ── 显示发布弹窗 ──
function handleShowPublishModal(record: Exam) {
  currentExam.value = record
  publishModalVisible.value = true
}

// ── 确认发布 ──
async function handleConfirmPublish(students: any[]) {
  if (!currentExam.value) return
  
  if (students.length === 0) {
    message.error('请至少选择一名学生')
    return
  }
  
  try {
    await publishExam(currentExam.value.id)
    message.success(`考试发布成功，共分配 ${students.length} 名学生`)
    publishModalVisible.value = false
    currentExam.value = null
    fetchExamList()
  } catch (error) {
    message.error('发布失败')
    console.error('[Exams] 发布考试失败:', error)
  }
}

// ── 取消发布 ──
function handleCancelPublish() {
  currentExam.value = null
}

// ── 兼容旧版直接发布 ──
async function handlePublish(record: Exam) {
  handleShowPublishModal(record)
}

async function handleClose(record: Exam) {
  try {
    await closeExam(record.id)
    message.success('考试已关闭')
    fetchExamList()
  } catch (error) {
    message.error('关闭失败')
    console.error('[Exams] 关闭考试失败:', error)
  }
}

// ── 初始化 ──
onMounted(() => {
  fetchExamList()
})
</script>

<style scoped lang="less">
.exams-page {
  max-width: 1400px;
  margin: 0 auto;
}

.search-card {
  margin-top: 16px;
}

.table-card {
  margin-top: 16px;
}

.time-cell {
  .time-separator {
    color: #999;
    font-size: 12px;
    margin: 2px 0;
  }
}
</style>
