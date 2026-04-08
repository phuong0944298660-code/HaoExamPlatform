<template>
  <div class="resources-page">
    <!-- 页面标题 -->
    <a-page-header title="资源中心" sub-title="管理和分享教学资源">
      <template #extra>
        <a-button type="primary" @click="showUploadModal = true">
          <UploadOutlined />
          上传文件
        </a-button>
      </template>
    </a-page-header>

    <!-- 搜索和筛选区域 -->
    <a-card :bordered="false" class="search-card">
      <a-row :gutter="16" align="middle">
        <a-col :span="6">
          <a-input
            v-model:value="searchKeyword"
            placeholder="搜索文件名"
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
            v-model:value="typeFilter"
            placeholder="文件类型"
            style="width: 100%"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option value="">全部类型</a-select-option>
            <a-select-option value="document">文档</a-select-option>
            <a-select-option value="image">图片</a-select-option>
            <a-select-option value="video">视频</a-select-option>
            <a-select-option value="audio">音频</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 文件列表 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data-source="resourceList"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 文件名列 -->
          <template v-if="column.key === 'name'">
            <a-space>
              <component :is="getFileIcon(record.file_type)" class="file-icon" />
              <span>{{ record.name }}</span>
            </a-space>
          </template>

          <!-- 类型列 -->
          <template v-if="column.key === 'type'">
            <a-tag>{{ getFileTypeText(record.file_type) }}</a-tag>
          </template>

          <!-- 大小列 -->
          <template v-if="column.key === 'size'">
            {{ formatFileSize(record.file_size) }}
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handlePreview(record)">
                <EyeOutlined />
                预览
              </a-button>
              <a-button type="link" size="small" @click="handleDownload(record)">
                <DownloadOutlined />
                下载
              </a-button>
              <a-popconfirm
                title="确定要删除这个文件吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <a-button type="link" size="small" danger>
                  <DeleteOutlined />
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 上传文件弹窗 -->
    <a-modal
      v-model:open="showUploadModal"
      title="上传文件"
      :footer="null"
      width="600px"
    >
      <a-upload-dragger
        v-model:fileList="fileList"
        name="file"
        :multiple="true"
        :custom-request="customUpload"
        @change="handleUploadChange"
      >
        <p class="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p class="ant-upload-hint">
          支持单个或批量上传，文件大小不超过 100MB
        </p>
      </a-upload-dragger>

      <div class="upload-actions">
        <a-space>
          <a-button @click="showUploadModal = false">取消</a-button>
          <a-button type="primary" :loading="uploading" @click="handleUploadSubmit">
            确认上传
          </a-button>
        </a-space>
      </div>
    </a-modal>

    <!-- 预览弹窗 -->
    <a-modal
      v-model:open="showPreviewModal"
      :title="previewFile?.name"
      :footer="null"
      width="800px"
    >
      <div class="preview-content">
        <!-- 图片预览 -->
        <img
          v-if="getFileCategory(previewFile?.file_type) === 'image'"
          :src="previewFile?.file_url"
          class="preview-image"
          alt="预览"
        />
        <!-- 文档预览 -->
        <div v-else-if="getFileCategory(previewFile?.file_type) === 'document'" class="preview-document">
          <FileTextOutlined style="font-size: 64px; color: #1890ff" />
          <p>文档预览功能开发中，请下载后查看</p>
          <a-button type="primary" @click="handleDownload(previewFile)">
            <DownloadOutlined />
            下载文件
          </a-button>
        </div>
        <!-- 视频预览 -->
        <video
          v-else-if="getFileCategory(previewFile?.file_type) === 'video'"
          :src="previewFile?.file_url"
          controls
          class="preview-video"
        />
        <!-- 音频预览 -->
        <audio
          v-else-if="getFileCategory(previewFile?.file_type) === 'audio'"
          :src="previewFile?.file_url"
          controls
          class="preview-audio"
        />
        <!-- 其他类型 -->
        <div v-else class="preview-other">
          <FileUnknownOutlined style="font-size: 64px; color: #999" />
          <p>暂不支持预览该类型文件</p>
          <a-button type="primary" @click="handleDownload(previewFile)">
            <DownloadOutlined />
            下载文件
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { message } from 'ant-design-vue'
import type { UploadProps, UploadFile } from 'ant-design-vue'
import type { TablePaginationConfig } from 'ant-design-vue'
import {
  UploadOutlined,
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  InboxOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FileUnknownOutlined,
  VideoCameraOutlined,
  SoundOutlined,
} from '@ant-design/icons-vue'
import type { Resource } from '@/types/api'
import { getResources, uploadResource, deleteResource } from '@/api/resources'

// ── 搜索和筛选状态 ──
const searchKeyword = ref('')
const typeFilter = ref('')

// ── 弹窗状态 ──
const showUploadModal = ref(false)
const showPreviewModal = ref(false)
const previewFile = ref<Resource | null>(null)

// ── 上传相关 ──
const fileList = ref<UploadFile[]>([])
const uploading = ref(false)

// ── 资源列表数据 ──
const resourceList = ref<Resource[]>([])
const loading = ref(false)

// ── 表格列定义 ──
const columns = [
  {
    title: '文件名',
    key: 'name',
    ellipsis: true,
  },
  {
    title: '类型',
    key: 'type',
    width: 100,
  },
  {
    title: '大小',
    key: 'size',
    width: 120,
  },
  {
    title: '上传时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 220,
    fixed: 'right',
  },
]

// ── 分页配置 ──
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 个文件`,
})

// ── 文件类型图标 ──
// 获取文件分类
function getFileCategory(fileType: string | undefined): string {
  if (!fileType) return 'other'
  const extToCategory: Record<string, string> = {
    pdf: 'document',
    doc: 'document', docx: 'document',
    xls: 'document', xlsx: 'document',
    ppt: 'document', pptx: 'document',
    txt: 'document',
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image',
    mp4: 'video', avi: 'video', mov: 'video',
    mp3: 'audio', wav: 'audio',
  }
  return extToCategory[fileType] || 'other'
}

function getFileIcon(fileType: string) {
  const category = getFileCategory(fileType)
  const iconMap: Record<string, any> = {
    document: FileTextOutlined,
    image: FileImageOutlined,
    video: VideoCameraOutlined,
    audio: SoundOutlined,
    other: FileUnknownOutlined,
  }
  return iconMap[category] || FileUnknownOutlined
}

// ── 文件类型文本 ──
function getFileTypeText(fileType: string): string {
  const textMap: Record<string, string> = {
    document: '文档',
    image: '图片',
    video: '视频',
    audio: '音频',
    other: '其他',
    pdf: 'PDF',
    doc: 'Word',
    docx: 'Word',
    xls: 'Excel',
    xlsx: 'Excel',
    ppt: 'PPT',
    pptx: 'PPT',
    mp4: '视频',
    mp3: '音频',
  }
  return textMap[fileType] || '其他'
}

// ── 文件大小格式化 ──
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ── 加载资源列表（真实API） ──
async function fetchResources() {
  loading.value = true
  try {
    const res = await getResources({
      page: pagination.current,
      size: pagination.pageSize,
      file_type: typeFilter.value || undefined,
    })
    resourceList.value = res.data?.list || res.data?.items || []
    pagination.total = res.data?.total || 0
  } catch {
    message.error('加载资源列表失败')
  } finally {
    loading.value = false
  }
}

// ── 搜索和重置 ──
function handleSearch() {
  pagination.current = 1
  fetchResources()
}

function handleReset() {
  searchKeyword.value = ''
  typeFilter.value = ''
  pagination.current = 1
  fetchResources()
}

// ── 表格分页变化 ──
function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchResources()
}

// ── 预览文件 ──
function handlePreview(record: Resource) {
  previewFile.value = record
  showPreviewModal.value = true
}

// ── 下载文件（置灰提示） ──
function handleDownload(record: Resource) {
  message.warning('资源仅支持在线预览，禁止下载')
}

// ── 删除文件（真实API） ──
async function handleDelete(record: Resource) {
  try {
    await deleteResource(record.id)
    message.success('删除成功')
    fetchResources()
  } catch {
    message.error('删除失败')
  }
}

// ── 自定义上传（真实API） ──
function customUpload(options: any) {
  const { onProgress, onSuccess, onError, file } = options

  const formData = new FormData()
  formData.append('file', file)

  uploadResource(formData)
    .then((res) => {
      onSuccess(res)
    })
    .catch((err) => {
      onError(err)
    })
}

// ── 上传状态变化 ──
const handleUploadChange: UploadProps['onChange'] = (info) => {
  const { status } = info.file
  if (status === 'done') {
    message.success(`${info.file.name} 上传成功`)
  } else if (status === 'error') {
    message.error(`${info.file.name} 上传失败`)
  }
}

// ── 提交上传 ──
async function handleUploadSubmit() {
  if (fileList.value.length === 0) {
    message.warning('请选择要上传的文件')
    return
  }

  // 检查是否所有文件已上传完成
  const allDone = fileList.value.every(f => f.status === 'done')
  if (!allDone) {
    message.warning('请等待所有文件上传完成')
    return
  }

  fileList.value = []
  showUploadModal.value = false
  fetchResources()
  message.success('文件上传完成')
}

// ── 根据扩展名获取文件类型 ──
function getFileTypeByExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv']
  const audioExts = ['mp3', 'wav', 'wma', 'aac', 'flac']
  const documentExts = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt']
  
  if (imageExts.includes(ext)) return 'image'
  if (videoExts.includes(ext)) return 'video'
  if (audioExts.includes(ext)) return 'audio'
  if (documentExts.includes(ext)) return 'document'
  return 'other'
}

// ── 初始化 ──
onMounted(() => {
  fetchResources()
})
</script>

<style scoped lang="less">
.resources-page {
  max-width: 1400px;
  margin: 0 auto;
}

.search-card {
  margin-top: 16px;
}

.table-card {
  margin-top: 16px;
}

.file-icon {
  font-size: 20px;
  color: #1890ff;
}

.upload-actions {
  margin-top: 24px;
  text-align: right;
}

.preview-content {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  .preview-image {
    max-width: 100%;
    max-height: 500px;
  }
  
  .preview-video {
    max-width: 100%;
    max-height: 500px;
  }
  
  .preview-audio {
    width: 100%;
  }
  
  .preview-document,
  .preview-other {
    text-align: center;
    
    p {
      margin: 16px 0;
      color: #666;
    }
  }
}
</style>
