<template>
  <div class="paper-manager">
    <a-page-header title="试卷管理" sub-title="创建、编辑和发布考试试卷" />

    <!-- 筛选栏 -->
    <a-card class="filter-card" :bordered="false">
      <a-form layout="inline" class="search-form">
        <a-row :gutter="[16, 16]" style="width: 100%">
          <a-col :xs="24" :sm="12" :md="5">
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
            <a-form-item label="状态" style="width: 100%">
              <a-select
                v-model:value="filters.status"
                placeholder="全部状态"
                allowClear
                style="width: 100%"
                @change="handleSearch"
              >
                <a-select-option value="draft">草稿</a-select-option>
                <a-select-option value="published">已发布</a-select-option>
                <a-select-option value="archived">已归档</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <a-form-item label="试卷名称" style="width: 100%">
              <a-input
                v-model:value="filters.keyword"
                placeholder="搜索试卷名称"
                allow-clear
                @pressEnter="handleSearch"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" class="form-actions-col">
            <div class="form-actions">
              <a-space>
                <a-button type="primary" @click="handleSearch">
                  <SearchOutlined /> 查询
                </a-button>
                <a-button @click="resetFilters">
                  <ReloadOutlined /> 重置
                </a-button>
                <a-button type="primary" ghost @click="handleCreate">
                  <PlusOutlined /> 新建
                </a-button>
              </a-space>
            </div>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 试卷列表 -->
    <a-card :bordered="false" style="margin-top: 16px">
      <a-table
        :columns="columns"
        :data-source="papers"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'grade_group'">
            {{ (record.gradeGroup || record.grade_group) === 'primary' ? '小学组' : '初中组' }}
          </template>
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="statusColor(record.status)">{{ statusText(record.status) }}</a-tag>
          </template>
          <template v-if="column.dataIndex === 'created_at'">
            {{ formatTime(record.createdAt || record.created_at) }}
          </template>
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-button type="link" size="small" @click="handlePreview(record)">预览</a-button>
              
              <!-- 发布/归档 (基于状态但对管理员可见) -->
              <a-button
                v-if="record.status?.toLowerCase() === 'draft'"
                type="link"
                size="small"
                @click="handlePublish(record)"
              >
                发布
              </a-button>
              <a-button
                v-if="record.status?.toLowerCase() === 'published'"
                type="link"
                size="small"
                @click="handleArchive(record)"
              >
                归档
              </a-button>

              <a-popconfirm
                :title="record.status?.toLowerCase() === 'published' ? '此试卷已发布，删除可能影响正在进行的考试，确认删除？' : '确认删除此试卷？'"
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

    <!-- 新建试卷对话框 -->
    <a-modal
      v-model:open="createModalVisible"
      title="新建试卷"
      ok-text="创建"
      cancel-text="取消"
      :confirm-loading="createLoading"
      @ok="submitCreate"
    >
      <a-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        :label-col="{ span: 5 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="试卷名称" name="name">
          <a-input v-model:value="createForm.name" placeholder="请输入试卷名称" />
        </a-form-item>
        <a-form-item label="学段" name="grade_group">
          <a-select v-model:value="createForm.grade_group" placeholder="请选择学段">
            <a-select-option value="primary">小学组</a-select-option>
            <a-select-option value="junior">初中组</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="createForm.description" placeholder="试卷描述（选填）" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 预览对话框 -->
    <a-modal
      v-model:open="previewModalVisible"
      title="试卷预览"
      :footer="null"
      width="800px"
    >
      <a-spin :spinning="previewLoading">
        <div v-if="previewData" class="paper-preview">
          <h3>{{ previewData.name }}</h3>
          <p class="preview-meta">
            总分: {{ previewData.total_score }} 分 | 共 {{ previewData.total_questions }} 题
          </p>
          <a-divider />
          <div v-for="(q, idx) in previewData.questions" :key="idx" class="preview-question">
            <p><strong>{{ (idx as number) + 1 }}. ({{ typeText(q.question_type) }}, {{ q.score }}分)</strong></p>
            <div v-html="q.content"></div>
            <div v-if="q.options" class="preview-options">
              <p v-for="opt in q.options" :key="opt.label">{{ opt.label }}. {{ opt.content }}</p>
            </div>
            <a-divider dashed />
          </div>
        </div>
        <a-empty v-else description="暂无预览数据" />
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import {
  getPapers,
  createPaper,
  deletePaper,
  publishPaper,
  archivePaper,
  previewPaper,
} from '@/api/papers'
import type { Paper } from '@/types/api'
import type { FormInstance } from 'ant-design-vue'
import dayjs from 'dayjs'

const router = useRouter()

// ── 列表数据 ──
const loading = ref(false)
const papers = ref<Paper[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

const filters = reactive({
  grade_group: undefined as string | undefined,
  status: undefined as string | undefined,
  keyword: '',
})

const columns = [
  { title: '试卷名称', dataIndex: 'name', ellipsis: true },
  { title: '学段', dataIndex: 'grade_group', width: 100 },
  { title: '总分', dataIndex: 'total_score', width: 80, align: 'center' as const },
  { title: '题目数', dataIndex: 'total_questions', width: 80, align: 'center' as const },
  { title: '状态', dataIndex: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'created_at', width: 170 },
  { title: '操作', dataIndex: 'action', width: 240, fixed: 'right' as const },
]

// ── 辅助函数 ──
function statusColor(s: string) {
  const key = (s || '').toLowerCase()
  return { draft: 'default', published: 'green', archived: 'gray' }[key] || 'default'
}
function statusText(s: string) {
  const key = (s || '').toLowerCase()
  return { draft: '草稿', published: '已发布', archived: '已归档' }[key] || s
}
function typeText(t: string) {
  return { single_choice: '单选题', multi_choice: '多选题', judgment: '判断题', subjective: '主观题' }[t] || t
}
function formatTime(t: string) {
  return dayjs(t).format('YYYY-MM-DD HH:mm')
}

// ── 加载数据 ──
async function fetchPapers() {
  loading.value = true
  try {
    const res = await getPapers({
      page: pagination.current,
      size: pagination.pageSize,
      grade_group: filters.grade_group,
      status: filters.status,
    })
    papers.value = res.data?.list || res.data?.items || []
    pagination.total = res.data?.total || 0
  } catch {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  fetchPapers()
}

function resetFilters() {
  filters.grade_group = undefined
  filters.status = undefined
  filters.keyword = ''
  pagination.current = 1
  fetchPapers()
}

function handleTableChange(pag: any) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchPapers()
}

// ── 新建试卷 ──
const createModalVisible = ref(false)
const createLoading = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({
  name: '',
  grade_group: undefined as string | undefined,
  description: '',
})
const createRules = {
  name: [{ required: true, message: '请输入试卷名称', trigger: 'blur' }],
  grade_group: [{ required: true, message: '请选择学段', trigger: 'change' }],
}

function handleCreate() {
  createForm.name = ''
  createForm.grade_group = undefined
  createForm.description = ''
  createModalVisible.value = true
}

async function submitCreate() {
  try {
    await createFormRef.value?.validateFields()
  } catch {
    return
  }
  createLoading.value = true
  try {
    await createPaper({
      name: createForm.name,
      grade_group: createForm.grade_group,
      description: createForm.description || null,
    })
    message.success('试卷创建成功')
    createModalVisible.value = false
    fetchPapers()
  } catch {
    // 错误已在拦截器处理
  } finally {
    createLoading.value = false
  }
}

// ── 操作 ──
function handleEdit(record: Paper) {
  router.push(`/papers/${record.id}`)
}

// 预览
const previewModalVisible = ref(false)
const previewLoading = ref(false)
const previewData = ref<any>(null)

async function handlePreview(record: Paper) {
  previewModalVisible.value = true
  previewLoading.value = true
  previewData.value = null
  try {
    const res = await previewPaper(record.id)
    previewData.value = res.data
  } catch {
    // 错误已在拦截器处理
  } finally {
    previewLoading.value = false
  }
}

async function handlePublish(record: Paper) {
  try {
    await publishPaper(record.id)
    message.success('试卷发布成功')
    fetchPapers()
  } catch {
    // 错误已在拦截器处理
  }
}

async function handleArchive(record: Paper) {
  try {
    await archivePaper(record.id)
    message.success('试卷已归档')
    fetchPapers()
  } catch {
    // 错误已在拦截器处理
  }
}

async function handleDelete(record: Paper) {
  try {
    await deletePaper(record.id)
    message.success('试卷已删除')
    fetchPapers()
  } catch {
    // 错误已在拦截器处理
  }
}

onMounted(() => {
  fetchPapers()
})
</script>

<style scoped>
.paper-manager {
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

.paper-preview {
  max-height: 600px;
  overflow-y: auto;
}
.preview-meta {
  color: #666;
  font-size: 14px;
}
.preview-question {
  margin-bottom: 8px;
}
.preview-options {
  padding-left: 20px;
  color: #555;
}
</style>
