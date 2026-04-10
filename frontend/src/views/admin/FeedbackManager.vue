<template>
  <div class="feedback-page">
    <a-page-header title="赛事反馈管理" sub-title="查看和处理赛事反馈">
      <template #extra>
        <a-button type="primary" @click="showCreateModal = true">
          <PlusOutlined />
          提交反馈
        </a-button>
      </template>
    </a-page-header>

    <!-- 筛选区域 -->
    <a-card class="filter-card" :bordered="false">
      <a-form layout="inline" class="search-form">
        <a-row :gutter="[16, 16]" style="width: 100%">
          <a-col :xs="24" :sm="12" :md="6">
            <a-form-item label="处理状态" style="width: 100%">
              <a-select
                v-model:value="filterStatus"
                placeholder="全部状态"
                allow-clear
                style="width: 100%"
                @change="handleSearch"
              >
                <a-select-option value="pending">待处理</a-select-option>
                <a-select-option value="processing">处理中</a-select-option>
                <a-select-option value="resolved">已解决</a-select-option>
                <a-select-option value="rejected">已拒绝</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <a-form-item label="反馈类别" style="width: 100%">
              <a-select
                v-model:value="filterCategory"
                placeholder="全部类别"
                allow-clear
                style="width: 100%"
                @change="handleSearch"
              >
                <a-select-option value="bug">系统缺陷</a-select-option>
                <a-select-option value="feature">功能建议</a-select-option>
                <a-select-option value="performance">性能问题</a-select-option>
                <a-select-option value="ui">界面问题</a-select-option>
                <a-select-option value="other">其他</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <a-form-item label="关键词" style="width: 100%">
              <a-input
                v-model:value="filterKeyword"
                placeholder="标题或反馈人"
                allow-clear
                @pressEnter="handleSearch"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6" class="form-actions-col">
            <div class="form-actions">
              <a-space>
                <a-button type="primary" @click="handleSearch">
                  <template #icon><SearchOutlined /></template>
                  查询
                </a-button>
                <a-button @click="resetFilters">
                  <template #icon><ReloadOutlined /></template>
                  重置
                </a-button>
              </a-space>
            </div>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 反馈列表 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data-source="feedbackList"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'category'">
            <a-tag :color="getCategoryColor(record.category)">
              {{ getCategoryText(record.category) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'priority'">
            <a-tag :color="getPriorityColor(record.priority)">
              {{ getPriorityText(record.priority) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleViewDetail(record)">
                ��情
              </a-button>
              <a-dropdown>
                <a-button type="link" size="small">
                  处理 <DownOutlined />
                </a-button>
                <template #overlay>
                  <a-menu @click="({ key }: any) => handleUpdateStatus(record.id, key)">
                    <a-menu-item key="processing">开始处理</a-menu-item>
                    <a-menu-item key="resolved">标记已解决</a-menu-item>
                    <a-menu-item key="rejected">拒绝</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
              <a-popconfirm title="确认删除？" @confirm="handleDelete(record.id)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 提交反馈弹窗 -->
    <a-modal
      v-model:open="showCreateModal"
      title="提交赛事反馈"
      :confirm-loading="submitting"
      @ok="handleCreateFeedback"
      width="600px"
    >
      <a-form :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="标题" required>
          <a-input v-model:value="createForm.title" placeholder="请输入反馈标题" maxlength="200" />
        </a-form-item>
        <a-form-item label="类别">
          <a-select v-model:value="createForm.category" style="width: 100%">
            <a-select-option value="bug">系统缺陷</a-select-option>
            <a-select-option value="feature">功能建议</a-select-option>
            <a-select-option value="performance">性能问题</a-select-option>
            <a-select-option value="ui">界面问题</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="优先级">
          <a-select v-model:value="createForm.priority" style="width: 100%">
            <a-select-option value="low">低</a-select-option>
            <a-select-option value="medium">中</a-select-option>
            <a-select-option value="high">高</a-select-option>
            <a-select-option value="critical">紧急</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="反馈人" required>
          <a-input v-model:value="createForm.reporter_name" placeholder="请输入反馈人姓名" />
        </a-form-item>
        <a-form-item label="联系方式">
          <a-input v-model:value="createForm.reporter_contact" placeholder="手机号或邮箱" />
        </a-form-item>
        <a-form-item label="详细描述" required>
          <a-textarea
            v-model:value="createForm.description"
            placeholder="请详细描述问题或建议"
            :rows="5"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 反馈详情弹窗 -->
    <a-modal
      v-model:open="showDetailModal"
      title="反馈详情"
      :footer="null"
      width="650px"
    >
      <div v-if="detailRecord">
        <a-descriptions bordered :column="2" size="small">
          <a-descriptions-item label="标题" :span="2">{{ detailRecord.title }}</a-descriptions-item>
          <a-descriptions-item label="类别">
            <a-tag :color="getCategoryColor(detailRecord.category)">
              {{ getCategoryText(detailRecord.category) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="优先级">
            <a-tag :color="getPriorityColor(detailRecord.priority)">
              {{ getPriorityText(detailRecord.priority) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="反馈人">{{ detailRecord.reporter_name }}</a-descriptions-item>
          <a-descriptions-item label="联系方式">{{ detailRecord.reporter_contact || '-' }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getStatusColor(detailRecord.status)">
              {{ getStatusText(detailRecord.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="提交时间">{{ detailRecord.created_at }}</a-descriptions-item>
          <a-descriptions-item label="详细描述" :span="2">
            <div style="white-space: pre-wrap">{{ detailRecord.description }}</div>
          </a-descriptions-item>
          <a-descriptions-item label="处理结果" :span="2" v-if="detailRecord.resolution">
            <div style="white-space: pre-wrap">{{ detailRecord.resolution }}</div>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, DownOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import type { TablePaginationConfig } from 'ant-design-vue'
import {
  getFeedbacks,
  createFeedback,
  updateFeedbackStatus,
  deleteFeedback,
} from '@/api/feedbacks'

// ── 数据 ──
const feedbackList = ref<any[]>([])
const loading = ref(false)
const filterStatus = ref<string | undefined>(undefined)
const filterCategory = ref<string | undefined>(undefined)
const filterKeyword = ref('')

// ── 分页 ──
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条反馈`,
})

// ── 表格列 ──
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '类别', key: 'category', width: 100 },
  { title: '优先级', key: 'priority', width: 80 },
  { title: '反馈人', dataIndex: 'reporter_name', key: 'reporter_name', width: 100 },
  { title: '状态', key: 'status', width: 90 },
  { title: '提交时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: '操作', key: 'action', width: 200 },
]

// ── 创建表单 ──
const showCreateModal = ref(false)
const submitting = ref(false)
const createForm = reactive({
  title: '',
  category: 'other',
  priority: 'medium',
  reporter_name: '',
  reporter_contact: '',
  description: '',
})

// ── 详情弹窗 ──
const showDetailModal = ref(false)
const detailRecord = ref<any>(null)

// ── 标签映射 ──
function getCategoryColor(cat: string): string {
  const map: Record<string, string> = {
    bug: 'red', feature: 'blue', performance: 'orange', ui: 'purple', other: 'default',
  }
  return map[cat] || 'default'
}

function getCategoryText(cat: string): string {
  const map: Record<string, string> = {
    bug: '系统缺陷', feature: '功能建议', performance: '性能问题', ui: '界面问题', other: '其他',
  }
  return map[cat] || cat
}

function getPriorityColor(p: string): string {
  const map: Record<string, string> = {
    low: 'default', medium: 'blue', high: 'orange', critical: 'red',
  }
  return map[p] || 'default'
}

function getPriorityText(p: string): string {
  const map: Record<string, string> = {
    low: '低', medium: '中', high: '高', critical: '紧急',
  }
  return map[p] || p
}

function getStatusColor(s: string): string {
  const map: Record<string, string> = {
    pending: 'default', processing: 'processing', resolved: 'success', rejected: 'error',
  }
  return map[s] || 'default'
}

function getStatusText(s: string): string {
  const map: Record<string, string> = {
    pending: '待处理', processing: '处理中', resolved: '已解决', rejected: '已拒绝',
  }
  return map[s] || s
}

// ── 获取数据 ──
async function fetchList() {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      size: pagination.pageSize,
      status: filterStatus.value,
      category: filterCategory.value,
      search: filterKeyword.value,
    }
    const res = await getFeedbacks(params)
    feedbackList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch {
    message.error('加载反馈列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  fetchList()
}

function resetFilters() {
  filterStatus.value = undefined
  filterCategory.value = undefined
  filterKeyword.value = ''
  pagination.current = 1
  fetchList()
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchList()
}

// ── 创建反馈 ──
async function handleCreateFeedback() {
  if (!createForm.title || !createForm.reporter_name || !createForm.description) {
    message.error('请填写标题、反馈人和详细描述')
    return
  }
  submitting.value = true
  try {
    await createFeedback(createForm)
    message.success('反馈提交成功')
    showCreateModal.value = false
    // 重置表单
    createForm.title = ''
    createForm.description = ''
    createForm.reporter_name = ''
    createForm.reporter_contact = ''
    createForm.category = 'other'
    createForm.priority = 'medium'
    fetchList()
  } catch {
    message.error('提交失败')
  } finally {
    submitting.value = false
  }
}

// ── 查看详情 ──
function handleViewDetail(record: any) {
  detailRecord.value = record
  showDetailModal.value = true
}

// ── 更新状态 ──
async function handleUpdateStatus(feedbackId: number, newStatus: string) {
  try {
    await updateFeedbackStatus(feedbackId, { status: newStatus })
    message.success('状态更新成功')
    fetchList()
  } catch {
    message.error('操作失败')
  }
}

// ── 删除 ──
async function handleDelete(feedbackId: number) {
  try {
    await deleteFeedback(feedbackId)
    message.success('反馈已删除')
    fetchList()
  } catch {
    message.error('删除失败')
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="less">
.feedback-page {
  max-width: 1400px;
  margin: 0 auto;
}

.filter-card {
  margin-top: 16px;
}

.search-form {
  :deep(.ant-form-item) {
    margin-bottom: 0;
    display: flex;
    align-items: center;
    width: 100%;
  }

  :deep(.ant-form-item-label) {
    flex-shrink: 0;
    padding-right: 4px;
  }

  :deep(.ant-form-item-control) {
    flex: 1;
    min-width: 0;
  }



  .form-actions-col {
    display: flex;
    align-items: center;
  }

  .form-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    min-height: 32px;
  }
}

.table-card {
  margin-top: 16px;
}
</style>
