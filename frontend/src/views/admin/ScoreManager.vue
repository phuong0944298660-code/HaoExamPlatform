<template>
  <div class="score-manager">
    <a-page-header title="成绩管理" sub-title="查看、统计和导出考试成绩" />

    <!-- 统计概览 -->
    <a-row :gutter="16" class="stats-row" v-if="stats.total > 0">
      <a-col :span="6">
        <a-card :bordered="false">
          <a-statistic title="最高分" :value="stats.highest" :precision="2" suffix="分">
            <template #prefix>
              <ArrowUpOutlined style="color: #52c41a" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card :bordered="false">
          <a-statistic title="最低分" :value="stats.lowest" :precision="2" suffix="分">
            <template #prefix>
              <ArrowDownOutlined style="color: #ff4d4f" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card :bordered="false">
          <a-statistic title="平均分" :value="stats.average" :precision="2" suffix="分" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card :bordered="false">
          <a-statistic title="及格率" :value="stats.passRate" :precision="1" suffix="%" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 筛选栏 -->
    <a-card class="filter-card" :bordered="false">
      <a-form layout="inline" class="search-form">
        <a-row :gutter="[16, 16]" style="width: 100%">
          <a-col :xs="24" :sm="12" :md="5">
            <a-form-item label="选择考试" style="width: 100%">
              <a-select
                v-model:value="filters.exam_id"
                placeholder="全部考试"
                allowClear
                show-search
                :filter-option="filterExamOption"
                style="width: 100%"
                @change="handleSearch"
              >
                <a-select-option
                  v-for="e in examList"
                  :key="e.id"
                  :value="e.id"
                  :label="e.name"
                >
                  {{ e.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="4">
            <a-form-item label="适用学段" style="width: 100%">
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
            <a-form-item label="分数区间" style="width: 100%">
              <a-input-group compact style="display: flex">
                <a-input-number
                  v-model:value="filters.min_score"
                  placeholder="最低"
                  :min="0"
                  style="flex: 1; text-align: center"
                />
                <a-input
                  style="width: 30px; border-left: 0; pointer-events: none; background-color: #fff"
                  placeholder="~"
                  disabled
                />
                <a-input-number
                  v-model:value="filters.max_score"
                  placeholder="最高"
                  :min="0"
                  style="flex: 1; text-align: center; border-left: 0"
                />
              </a-input-group>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="4">
            <a-form-item label="关键词" style="width: 100%">
              <a-input
                v-model:value="filters.keyword"
                placeholder="姓名/用户名"
                allow-clear
                @pressEnter="handleSearch"
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
                <a-dropdown>
                  <a-button>
                    <DownloadOutlined /> 导出成绩
                    <DownOutlined />
                  </a-button>
                  <template #overlay>
                    <a-menu @click="handleExport">
                      <a-menu-item key="excel">导出 Excel</a-menu-item>
                      <a-menu-item key="csv">导出 CSV</a-menu-item>
                      <a-menu-item key="pdf">导出 PDF</a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </a-space>
            </div>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 成绩列表 -->
    <a-card :bordered="false" style="margin-top: 16px">
      <a-table
        :columns="columns"
        :data-source="scores"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'total_score'">
            <span :style="{ color: getScoreColor(record.total_score), fontWeight: 'bold' }">
              {{ record.total_score ?? '-' }}
            </span>
          </template>
          <template v-if="column.dataIndex === 'objective_score'">
            {{ record.objective_score ?? '-' }}
          </template>
          <template v-if="column.dataIndex === 'submitted_at'">
            {{ record.submitted_at ? formatTime(record.submitted_at) : '-' }}
          </template>
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="scoreStatusColor(record.status)">{{ scoreStatusText(record.status) }}</a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  SearchOutlined,
  DownloadOutlined,
  DownOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'
import { getScores, exportScores } from '@/api/scores'
import { getExams } from '@/api/exams'
import type { ScoreRecord, Exam } from '@/types/api'
import dayjs from 'dayjs'

// ── 列表数据 ──
const loading = ref(false)
const scores = ref<any[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

const filters = reactive({
  exam_id: undefined as number | undefined,
  grade_group: undefined as string | undefined,
  min_score: undefined as number | undefined,
  max_score: undefined as number | undefined,
  keyword: '',
})

// ── 统计数据 ──
const stats = reactive({
  total: 0,
  highest: 0,
  lowest: 0,
  average: 0,
  passRate: 0,
})

// ── 考试下拉列表 ──
const examList = ref<Exam[]>([])

async function fetchExamList() {
  try {
    const res = await getExams({ page: 1, size: 200 })
    examList.value = res.data?.list || res.data?.items || []
  } catch {
    // 错误已在拦截器处理
  }
}

function filterExamOption(input: string, option: any) {
  return (option?.label || '').toLowerCase().includes(input.toLowerCase())
}

const columns = [
  { title: '姓名', dataIndex: 'student_name', width: 120 },
  { title: '用户名', dataIndex: 'username', width: 150 },
  { title: '考试名称', dataIndex: 'exam_name', ellipsis: true },
  { title: '总分', dataIndex: 'total_score', width: 100, align: 'center' as const, sorter: true },
  { title: '客观题得分', dataIndex: 'objective_score', width: 110, align: 'center' as const },
  { title: '提交时间', dataIndex: 'submitted_at', width: 170 },
  { title: '状态', dataIndex: 'status', width: 100 },
]

// ── 辅助函数 ──
function formatTime(t: string) {
  return dayjs(t).format('YYYY-MM-DD HH:mm')
}

function getScoreColor(score: number | null) {
  if (score === null || score === undefined) return '#999'
  if (score >= 90) return '#52c41a'
  if (score >= 60) return '#1890ff'
  return '#ff4d4f'
}

function scoreStatusColor(s: string) {
  return {
    submitted: 'green',
    grading: 'orange',
    graded: 'blue',
    not_started: 'default',
    in_progress: 'processing',
  }[s] || 'default'
}

function scoreStatusText(s: string) {
  return {
    submitted: '已提交',
    grading: '批阅中',
    graded: '已批阅',
    not_started: '未开始',
    in_progress: '答题中',
  }[s] || s
}

// ── 加载数据 ──
async function fetchScores() {
  loading.value = true
  try {
    const res = await getScores({
      page: pagination.current,
      size: pagination.pageSize,
      exam_id: filters.exam_id,
      grade_group: filters.grade_group,
      min_score: filters.min_score,
      max_score: filters.max_score,
      search: filters.keyword,
    })
    scores.value = res.data?.list || res.data?.items || []
    pagination.total = res.data?.total || 0

    // 计算统计数据
    computeStats(scores.value)
  } catch {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}

function computeStats(items: any[]) {
  const validScores = items
    .filter((r) => r.total_score !== null && r.total_score !== undefined)
    .map((r) => Number(r.total_score))

  if (validScores.length === 0) {
    Object.assign(stats, { total: 0, highest: 0, lowest: 0, average: 0, passRate: 0 })
    return
  }

  stats.total = validScores.length
  stats.highest = Math.max(...validScores)
  stats.lowest = Math.min(...validScores)
  stats.average = validScores.reduce((a, b) => a + b, 0) / validScores.length
  stats.passRate = (validScores.filter((s) => s >= 60).length / validScores.length) * 100
}

function handleSearch() {
  pagination.current = 1
  fetchScores()
}

function resetFilters() {
  filters.exam_id = undefined
  filters.grade_group = undefined
  filters.min_score = undefined
  filters.max_score = undefined
  filters.keyword = ''
  pagination.current = 1
  fetchScores()
}

function handleTableChange(pag: any) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchScores()
}

// ── 导出 ──
async function handleExport({ key }: { key: string }) {
  if (!filters.exam_id) {
    message.warning('请先选择要导出成绩的考试')
    return
  }
  try {
    message.loading({ content: '正在生成导出文件...', key: 'export' })
    const res = await exportScores(filters.exam_id, key)
    // 处理 Blob 下载
    const blob = new Blob([res as any])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const extMap: Record<string, string> = { excel: 'xlsx', csv: 'csv', pdf: 'pdf' }
    link.href = url
    link.download = `成绩导出_${filters.exam_id}.${extMap[key] || key}`
    link.click()
    window.URL.revokeObjectURL(url)
    message.success({ content: '导出成功', key: 'export' })
  } catch {
    message.error({ content: '导出失败', key: 'export' })
  }
}

onMounted(() => {
  fetchExamList()
  fetchScores()
})
</script>

<style scoped>
.score-manager {
  max-width: 1400px;
  margin: 0 auto;
}
.stats-row {
  margin-top: 16px;
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
.search-form :deep(.ant-inputGroup) {
  display: flex;
  align-items: center;
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
