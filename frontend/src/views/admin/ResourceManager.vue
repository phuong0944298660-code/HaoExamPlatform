<template>
  <div class="resource-manager">
    <a-page-header title="资源管理" sub-title="上传和管理教学资源（仅支持在线预览，不可下载）" />

    <!-- 上传区域 -->
    <a-card title="上传资源" :bordered="false" style="margin-top: 16px">
      <a-upload-dragger
        :custom-request="handleUpload"
        :multiple="true"
        :show-upload-list="true"
        :file-list="uploadFileList"
        @change="handleUploadChange"
      >
        <p class="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p class="ant-upload-hint">支持 PDF、Word、Excel、PPT、图片等格式</p>
      </a-upload-dragger>
    </a-card>

    <!-- 筛选区域 -->
    <a-card class="filter-card" :bordered="false" style="margin-top: 16px">
      <a-form layout="inline" class="search-form">
        <a-row :gutter="[16, 16]" style="width: 100%">
          <a-col :xs="24" :sm="12" :md="6">
            <a-form-item label="资源类型" style="width: 100%">
              <a-select
                v-model:value="filterType"
                placeholder="全部类型"
                allow-clear
                style="width: 100%"
                @change="handleSearch"
              >
                <a-select-option value="pdf">PDF 文档</a-select-option>
                <a-select-option value="doc">Word 文档</a-select-option>
                <a-select-option value="xls">Excel 表格</a-select-option>
                <a-select-option value="ppt">PPT 演示</a-select-option>
                <a-select-option value="image">图片资源</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="10">
            <a-form-item label="关键词" style="width: 100%">
              <a-input
                v-model:value="searchKeyword"
                placeholder="搜索文件名或上传者"
                allow-clear
                @pressEnter="handleSearch"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="8" class="form-actions-col">
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

    <!-- 资源列表 -->
    <a-card :bordered="false" title="资源列表" style="margin-top: 16px">
      <a-table
        :columns="columns"
        :data-source="resources"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'name'">
            <a-space>
              <component :is="getFileIcon(record.file_type)" :style="{ color: getFileIconColor(record.file_type), fontSize: '18px' }" />
              <span>{{ record.name }}</span>
            </a-space>
          </template>
          <template v-if="column.dataIndex === 'file_type'">
            <a-tag>{{ record.file_type?.toUpperCase() || '未知' }}</a-tag>
          </template>
          <template v-if="column.dataIndex === 'file_size'">
            {{ formatFileSize(record.file_size) }}
          </template>
          <template v-if="column.dataIndex === 'created_at'">
            {{ formatTime(record.created_at) }}
          </template>
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handlePreview(record)">
                <template #icon><EyeOutlined /></template>
                在线预览
              </a-button>
              <a-popconfirm
                title="确认删除此资源？"
                ok-text="确认"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <a-button type="link" size="small" danger>
                  <template #icon><DeleteOutlined /></template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 在线预览对话框 -->
    <a-modal
      v-model:open="previewVisible"
      :title="`预览: ${previewResource?.name || ''}`"
      :footer="null"
      width="900px"
      :bodyStyle="{ padding: 0, minHeight: '500px' }"
    >
      <div class="preview-container">
        <template v-if="previewResource">
          <!-- 图片预览 -->
          <img
            v-if="isImage(previewResource.file_type)"
            :src="previewResource.file_url"
            :alt="previewResource.name"
            style="max-width: 100%; max-height: 600px; display: block; margin: 0 auto"
          />
          <!-- PDF 预览 -->
          <iframe
            v-else-if="previewResource.file_type === 'pdf'"
            :src="previewResource.file_url"
            style="width: 100%; height: 600px; border: none"
          />
          <!-- 其他格式 -->
          <a-result
            v-else
            status="info"
            title="暂不支持在线预览此文件格式"
            :sub-title="`文件类型: ${previewResource.file_type}`"
          />
        </template>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated } from 'vue'
import { message } from 'ant-design-vue'
import {
  InboxOutlined,
  EyeOutlined,
  DeleteOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileImageOutlined,
  FileOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'
import { getResources, uploadResource, deleteResource } from '@/api/resources'
import type { Resource } from '@/types/api'
import type { UploadChangeParam } from 'ant-design-vue'
import dayjs from 'dayjs'

// ── 列表数据 ──
const loading = ref(false)
const resources = ref<Resource[]>([])
const searchKeyword = ref('')
const filterType = ref<string | undefined>(undefined)
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

const columns = [
  { title: '文件名', dataIndex: 'name', ellipsis: true },
  { title: '类型', dataIndex: 'file_type', width: 100 },
  { title: '大小', dataIndex: 'file_size', width: 110 },
  { title: '上传者', dataIndex: 'uploader_name', width: 120 },
  { title: '上传时间', dataIndex: 'created_at', width: 170 },
  { title: '操作', dataIndex: 'action', width: 200, fixed: 'right' as const },
]

// ── 辅助函数 ──
function formatTime(t: string) {
  return dayjs(t).format('YYYY-MM-DD HH:mm')
}

function formatFileSize(bytes: number) {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

function getFileIcon(fileType: string) {
  const type = (fileType || '').toLowerCase()
  if (['doc', 'docx'].includes(type)) return FileWordOutlined
  if (['xls', 'xlsx'].includes(type)) return FileExcelOutlined
  if (type === 'pdf') return FilePdfOutlined
  if (['ppt', 'pptx'].includes(type)) return FilePptOutlined
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(type)) return FileImageOutlined
  return FileOutlined
}

function getFileIconColor(fileType: string) {
  const type = (fileType || '').toLowerCase()
  if (['doc', 'docx'].includes(type)) return '#2b579a'
  if (['xls', 'xlsx'].includes(type)) return '#217346'
  if (type === 'pdf') return '#d32f2f'
  if (['ppt', 'pptx'].includes(type)) return '#d24726'
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(type)) return '#1890ff'
  return '#8c8c8c'
}

function isImage(fileType: string) {
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes((fileType || '').toLowerCase())
}

// ── 加载数据 ──
async function fetchResources() {
  loading.value = true
  try {
    const res = await getResources({
      page: pagination.current,
      size: pagination.pageSize,
      search: searchKeyword.value,
      type: filterType.value,
    })
    resources.value = res.data?.list || res.data?.items || []
    pagination.total = res.data?.total || 0
  } catch {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  fetchResources()
}

function resetFilters() {
  searchKeyword.value = ''
  filterType.value = undefined
  pagination.current = 1
  fetchResources()
}

function handleTableChange(pag: any) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchResources()
}

// ── 上传 ──
const uploadFileList = ref<any[]>([])

async function handleUpload(options: any) {
  const { file, onSuccess, onError } = options
  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await uploadResource(formData)
    onSuccess(res, file)
    message.success(`${file.name} 上传成功`)
    fetchResources()
  } catch (err) {
    onError(err)
  }
}

function handleUploadChange(info: UploadChangeParam) {
  uploadFileList.value = info.fileList.filter((f) => f.status !== 'removed')
}

// ── 预览 ──
const previewVisible = ref(false)
const previewResource = ref<Resource | null>(null)

function handlePreview(record: Resource) {
  previewResource.value = record
  previewVisible.value = true
}

// ── 删除 ──
async function handleDelete(record: Resource) {
  try {
    await deleteResource(record.id)
    message.success('资源已删除')
    fetchResources()
  } catch {
    // 错误已在拦截器处理
  }
}

onMounted(() => {
  fetchResources()
})
</script>

<style scoped>
.resource-manager {
  max-width: 1400px;
  margin: 0 auto;
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

.preview-container {
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>
