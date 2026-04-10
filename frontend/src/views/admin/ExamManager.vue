<template>
  <div class="exam-manager">
    <a-page-header title="考试管理" sub-title="创建和管理考试场次" />

    <!-- 筛选栏 -->
    <a-card class="filter-card" :bordered="false">
      <a-form layout="inline" class="search-form">
        <a-row :gutter="[16, 16]" style="width: 100%">
          <a-col :xs="24" :sm="12" :md="4">
            <a-form-item label="状态" style="width: 100%">
              <a-select
                v-model:value="filters.status"
                placeholder="全部状态"
                allowClear
                style="width: 100%"
                @change="handleSearch"
              >
                <a-select-option value="draft">草稿</a-select-option>
                <a-select-option value="pending">待开放</a-select-option>
                <a-select-option value="open">进行中</a-select-option>
                <a-select-option value="finished">已结束</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="4">
            <a-form-item label="学段" style="width: 100%">
              <a-select
                v-model:value="filters.grade_group"
                placeholder="全部学段"
                allowClear
                style="width: 100%"
                @change="handleSearch"
              >
                <a-select-option value="primary">小学组</a-select-option>
                <a-select-option value="junior">初中组</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="5">
            <a-form-item label="考试名称" style="width: 100%">
              <a-input
                v-model:value="filters.keyword"
                placeholder="关键词搜索"
                allow-clear
                @pressEnter="handleSearch"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="5">
            <a-form-item label="考试日期" style="width: 100%">
              <a-range-picker
                v-model:value="dateRange"
                style="width: 100%"
                :placeholder="['开始日期', '结束日期']"
                @change="handleSearch"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="6" class="form-actions-col">
            <div class="form-actions">
              <a-space>
                <a-button type="primary" @click="handleSearch">
                  <SearchOutlined /> 查询
                </a-button>
                <a-button @click="resetFilters">
                  <ReloadOutlined /> 重置
                </a-button>
                <a-button type="primary" ghost @click="openCreateModal">
                  <PlusOutlined /> 新增
                </a-button>
              </a-space>
            </div>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 考试列表 -->
    <a-card :bordered="false" style="margin-top: 16px">
      <a-table
        :columns="columns"
        :data-source="exams"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        :scroll="{ x: 1200 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="statusColor(record.status)">{{ statusText(record.status) }}</a-tag>
            <a-tag v-if="record.is_emergency_extended" color="orange">已延时</a-tag>
          </template>
          <template v-if="column.dataIndex === 'paper_name'">
            {{ record.paperName || record.paper_name || `试卷ID: ${record.paperId || record.paper_ids?.[0] || '-'}` }}
          </template>
          <template v-if="column.dataIndex === 'start_time'">
            {{ formatTime(record.startTime || record.start_time) }}
          </template>
          <template v-if="column.dataIndex === 'end_time'">
            {{ formatTime(record.endTime || record.end_time) }}
          </template>
          <template v-if="column.dataIndex === 'duration'">
            {{ record.duration || record.durationMinutes }} 分钟
          </template>
          <template v-if="column.dataIndex === 'student_count'">
            {{ record.totalSubmissions || record.total_submissions || 0 }} / {{ record.enrolledCount || record.enrolled_count || record.maxStudents || record.max_students || 0 }}
          </template>
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <!-- 通用操作：编辑 (除进行中外) -->
              <a-button 
                v-if="record.status?.toLowerCase() !== 'open' && record.status?.toLowerCase() !== 'finished'"
                type="link" 
                size="small" 
                @click="openEditModal(record)"
              >
                编辑
              </a-button>

              <!-- 草稿状态特有 -->
              <template v-if="record.status?.toLowerCase() === 'draft'">
                <a-button type="link" size="small" @click="handlePublish(record)">发布</a-button>
              </template>

              <!-- 进行中/已发布：监控 -->
              <template v-if="record.status?.toLowerCase() === 'open' || record.status?.toLowerCase() === 'published' || record.status?.toLowerCase() === 'pending'">
                <a-button type="link" size="small" @click="gotoDashboard(record)">监控</a-button>
              </template>

              <!-- 进行中：紧急延时 -->
              <template v-if="record.status?.toLowerCase() === 'open'">
                <a-button type="link" size="small" @click="openExtendModal(record)">延时</a-button>
              </template>
              
              <!-- 已结束/进行中：查看成绩/进度 -->
              <a-button type="link" size="small" @click="gotoScores(record)">
                {{ record.status?.toLowerCase() === 'finished' ? '成绩' : '进度' }}
              </a-button>

              <!-- 管理员操作：删除 (全状态可见) -->
              <a-popconfirm
                :title="record.status?.toLowerCase() === 'draft' ? '确认删除此考试场次？' : '考试已发布，删除可能导致学生成绩无法找回，确认删除？'"
                ok-text="确认"
                cancel-text="取消"
                ok-type="danger"
                @confirm="handleDelete(record)"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 创建/编辑考试对话框 -->
    <a-modal
      v-model:open="examModalVisible"
      :title="editingExam ? '编辑考试' : '创建考试'"
      :ok-text="editingExam ? '保存' : '创建'"
      cancel-text="取消"
      :confirm-loading="examModalLoading"
      width="640px"
      @ok="submitExamForm"
    >
      <a-form
        ref="examFormRef"
        :model="examForm"
        :rules="examRules"
        :label-col="{ span: 5 }"
        :wrapper-col="{ span: 18 }"
        style="margin-top: 16px"
      >
        <a-form-item label="考试名称" name="name">
          <a-input v-model:value="examForm.name" placeholder="请输入考试名称" />
        </a-form-item>
        <a-form-item label="关联试卷" name="paper_id">
          <a-select
            v-model:value="examForm.paper_id"
            placeholder="请选择已发布的试卷"
            show-search
            :filter-option="filterPaperOption"
            :loading="publishedPapersLoading"
          >
            <a-select-option
              v-for="p in publishedPapers"
              :key="p.id"
              :value="p.id"
              :label="p.name"
            >
              {{ p.name }} ({{ p.grade_group === 'primary' ? '小学' : '初中' }} | {{ p.total_score }}分)
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="开始时间" name="start_time">
          <a-date-picker
            v-model:value="examForm.start_time"
            show-time
            format="YYYY-MM-DD HH:mm"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="考试时长" name="duration_minutes">
          <a-input-number
            v-model:value="examForm.duration_minutes"
            :min="10"
            :max="300"
            :step="5"
            placeholder="分钟"
            style="width: 100%"
          >
            <template #addonAfter>分钟</template>
          </a-input-number>
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="examForm.description" placeholder="考试描述（选填）" :rows="3" />
        </a-form-item>
        <a-form-item label="防作弊设置" name="max_screen_switches">
          <a-input-number
            v-model:value="examForm.max_screen_switches"
            :min="0"
            :max="10"
            placeholder="最大允许切屏次数"
            style="width: 100%"
          >
            <template #addonBefore>最大允许切屏次数</template>
            <template #addonAfter>次 (0表示一经发现即警告)</template>
          </a-input-number>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 紧急延时对话框 -->
    <a-modal
      v-model:open="extendModalVisible"
      title="紧急延时"
      ok-text="确认延时"
      cancel-text="取消"
      :confirm-loading="extendLoading"
      @ok="submitExtend"
    >
      <a-alert
        message="注意：延时操作不可撤销，将影响所有正在考试的学生。"
        type="warning"
        show-icon
        style="margin-bottom: 16px"
      />
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="延长时间">
          <a-input-number
            v-model:value="extendForm.extra_minutes"
            :min="1"
            :max="120"
            :step="5"
            style="width: 100%"
          >
            <template #addonAfter>分钟</template>
          </a-input-number>
        </a-form-item>
        <a-form-item label="延时原因">
          <a-textarea
            v-model:value="extendForm.reason"
            placeholder="请说明紧急延时的原因"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import {
  getExams,
  createExam,
  updateExam,
  deleteExam,
  publishExam,
  closeExam,
  emergencyExtend,
} from '@/api/exams'
import { getPapers } from '@/api/papers'
import type { Exam, Paper } from '@/types/api'
import type { FormInstance } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'

const router = useRouter()

// ── 列表数据 ──
const loading = ref(false)
const exams = ref<Exam[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

const filters = reactive({
  status: undefined as string | undefined,
  grade_group: undefined as string | undefined,
  keyword: '',
})
const dateRange = ref<[Dayjs, Dayjs] | null>(null)

const columns = [
  { title: '考试名称', dataIndex: 'name', ellipsis: true, width: 200 },
  { title: '关联试卷', dataIndex: 'paper_name', ellipsis: true, width: 180 },
  { title: '状态', dataIndex: 'status', width: 140 },
  { title: '开始时间', dataIndex: 'start_time', width: 160 },
  { title: '结束时间', dataIndex: 'end_time', width: 160 },
  { title: '时长', dataIndex: 'duration', width: 90, align: 'center' as const },
  { title: '参考/总人数', dataIndex: 'student_count', width: 120, align: 'center' as const },
  { title: '操作', dataIndex: 'action', width: 200, fixed: 'right' as const },
]

// ── 辅助函数 ──
function statusColor(s: string) {
  const key = (s || '').toLowerCase()
  return { draft: 'default', pending: 'orange', published: 'blue', open: 'green', closed: 'red', finished: 'gray' }[key] || 'default'
}
function statusText(s: string) {
  const key = (s || '').toLowerCase()
  return { draft: '草稿', pending: '待开放', published: '已发布', open: '进行中', closed: '已关闭', finished: '已结束' }[key] || s
}
function formatTime(t: string) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

// ── 加载数据 ──
async function fetchExams() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.current,
      size: pagination.pageSize,
      status: filters.status,
      grade_group: filters.grade_group,
    }
    const res = await getExams(params)
    exams.value = res.data?.list || res.data?.items || []
    pagination.total = res.data?.total || 0
  } catch {
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  fetchExams()
}

function resetFilters() {
  filters.status = undefined
  filters.grade_group = undefined
  filters.keyword = ''
  dateRange.value = null
  pagination.current = 1
  fetchExams()
}

function handleTableChange(pag: any) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchExams()
}

// ── 已发布试卷列表（供选择） ──
const publishedPapers = ref<Paper[]>([])
const publishedPapersLoading = ref(false)

async function fetchPublishedPapers() {
  publishedPapersLoading.value = true
  try {
    const res = await getPapers({ page: 1, size: 200, status: 'published' })
    publishedPapers.value = res.data?.list || res.data?.items || []
  } catch {
  } finally {
    publishedPapersLoading.value = false
  }
}

function filterPaperOption(input: string, option: any) {
  return (option?.label || '').toLowerCase().includes(input.toLowerCase())
}

// ── 创建/编辑考试 ──
const examModalVisible = ref(false)
const examModalLoading = ref(false)
const editingExam = ref<Exam | null>(null)
const examFormRef = ref<FormInstance>()
const examForm = reactive({
  name: '',
  paper_id: undefined as number | undefined,
  start_time: undefined as Dayjs | undefined,
  duration_minutes: 60,
  description: '',
  max_screen_switches: 0,
})
const examRules = {
  name: [{ required: true, message: '请输入考试名称', trigger: 'blur' }],
  paper_id: [{ required: true, message: '请选择试卷', trigger: 'change' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  duration_minutes: [{ required: true, message: '请输入考试时长', trigger: 'blur' }],
}

function openCreateModal() {
  editingExam.value = null
  Object.assign(examForm, {
    name: '',
    paper_id: undefined,
    start_time: undefined,
    duration_minutes: 60,
    description: '',
    max_screen_switches: 0
  })
  examModalVisible.value = true
  fetchPublishedPapers()
}

function openEditModal(record: Exam) {
  editingExam.value = record
  Object.assign(examForm, {
    name: record.name,
    paper_id: record.paperId || record.paper_ids?.[0],
    start_time: dayjs(record.startTime || record.start_time),
    duration_minutes: record.duration || record.durationMinutes,
    description: record.description || '',
    max_screen_switches: record.maxScreenSwitches ?? record.max_screen_switches ?? 0
  })
  examModalVisible.value = true
  fetchPublishedPapers()
}

async function submitExamForm() {
  try {
    await examFormRef.value?.validateFields()
  } catch {
    return
  }
  examModalLoading.value = true
  try {
    const startMoment = examForm.start_time
    const startTimeStr = startMoment?.format('YYYY-MM-DDTHH:mm:ss')
    const endMoment = startMoment?.add(examForm.duration_minutes, 'minute')
    const endTimeStr = endMoment?.format('YYYY-MM-DDTHH:mm:ss')
    
    const payload = {
      name: examForm.name,
      paperId: examForm.paper_id,
      paperIds: JSON.stringify([examForm.paper_id]),
      startTime: startTimeStr,
      endTime: endTimeStr,
      duration: examForm.duration_minutes,
      durationMinutes: examForm.duration_minutes,
      description: examForm.description || null,
      maxScreenSwitches: examForm.max_screen_switches,
    }

    if (editingExam.value) {
      await updateExam(editingExam.value.id, payload)
      message.success('更新成功')
    } else {
      await createExam(payload)
      message.success('创建成功')
    }
    examModalVisible.value = false
    fetchExams()
  } catch {
  } finally {
    examModalLoading.value = false
  }
}

// ── 操作 ──
async function handlePublish(record: Exam) {
  try {
    await publishExam(record.id)
    message.success('考试已发布')
    fetchExams()
  } catch {
  }
}

async function handleDelete(record: Exam) {
  try {
    await deleteExam(record.id)
    message.success('考试已删除')
    fetchExams()
  } catch {
  }
}

function gotoDashboard(record: Exam) {
  router.push(`/exams/${record.id}/dashboard`)
}

function gotoScores(record: Exam) {
  router.push(`/scores?exam_id=${record.id}`)
}

// ── 紧急延时 ──
const extendModalVisible = ref(false)
const extendLoading = ref(false)
const extendingExamId = ref<number>(0)
const extendForm = reactive({
  extra_minutes: 15,
  reason: '',
})

function openExtendModal(record: Exam) {
  extendingExamId.value = record.id
  extendForm.extra_minutes = 15
  extendForm.reason = ''
  extendModalVisible.value = true
}

async function submitExtend() {
  if (!extendForm.reason.trim()) {
    message.warning('请填写延时原因')
    return
  }
  extendLoading.value = true
  try {
    await emergencyExtend(extendingExamId.value, {
      extra_minutes: extendForm.extra_minutes,
      reason: extendForm.reason,
    })
    message.success(`已延长 ${extendForm.extra_minutes} 分钟`)
    extendModalVisible.value = false
    fetchExams()
  } catch {
    // 错误已在拦截器处理
  } finally {
    extendLoading.value = false
  }
}

onMounted(() => {
  fetchExams()
})
</script>

<style scoped>
.exam-manager {
  max-width: 1400px;
  margin: 0 auto;
}
.filter-card {
  margin-top: 16px;
}

.search-form :deep(.ant-form-item) {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  width: 100%;
}
.search-form :deep(.ant-form-item-label) {
  flex-shrink: 0;
  padding-right: 4px;
}
.search-form :deep(.ant-form-item-control) {
  flex: 1;
  min-width: 0;
}
.search-form .form-actions-col {
  display: flex;
  align-items: center;
}
.search-form .form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  min-height: 32px;
}
</style>
