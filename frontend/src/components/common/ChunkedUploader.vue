<template>
  <div class="chunked-uploader">
    <!-- 文件选择 -->
    <a-upload-dragger
      v-if="!uploading"
      :before-upload="beforeUpload"
      :custom-request="handleCustomRequest"
      :show-upload-list="false"
      accept=".mp4,.avi,.mov,.mkv,.pdf,.ppt,.pptx,.doc,.docx,.zip,.rar"
    >
      <p class="ant-upload-drag-icon">
        <upload-outlined />
      </p>
      <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
      <p class="ant-upload-hint">
        支持大文件分片上传（最大2GB）<br>
        支持格式：视频、PDF、PPT、Word、压缩包
      </p>
    </a-upload-dragger>

    <!-- 上传进度 -->
    <div v-else class="upload-progress">
      <a-card>
        <div class="file-info">
          <file-outlined class="file-icon" />
          <div class="file-detail">
            <div class="file-name">{{ currentFile?.name }}</div>
            <div class="file-size">{{ formatFileSize(currentFile?.size) }}</div>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">上传进度</span>
            <span class="progress-text">{{ progress }}%</span>
          </div>
          <a-progress
            :percent="progress"
            :status="progressStatus"
            :stroke-color="{ from: '#108ee9', to: '#87d068' }"
          />
          <div class="progress-detail">
            <span>已上传 {{ uploadedChunks }}/{{ totalChunks }} 片</span>
            <span v-if="uploadSpeed > 0">速度: {{ formatSpeed(uploadSpeed) }}</span>
          </div>
        </div>

        <div class="action-buttons">
          <a-button v-if="status === 'paused'" type="primary" @click="resumeUpload">
            <play-circle-outlined /> 继续上传
          </a-button>
          <a-button v-else-if="status === 'uploading'" @click="pauseUpload">
            <pause-circle-outlined /> 暂停
          </a-button>
          <a-button danger @click="cancelUpload">
            <close-outlined /> 取消
          </a-button>
        </div>
      </a-card>
    </div>

    <!-- 完成提示 -->
    <a-modal
      :open="showSuccessModal"
      title="上传成功"
      :footer="null"
      @cancel="showSuccessModal = false"
    >
      <a-result
        status="success"
        title="文件上传成功"
        :sub-title="`文件 ${currentFile?.name} 已成功上传`"
      >
        <template #extra>
          <a-button type="primary" @click="resetUpload">继续上传</a-button>
        </template>
      </a-result>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  UploadOutlined,
  FileOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import request from '@/utils/request'

// 配置
const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB 每片
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2GB

// Props
const props = defineProps<{
  categoryPath: string
  questionBankId?: number
}>()

// Emits
const emit = defineEmits<{
  success: [data: any]
  error: [error: any]
}>()

// 状态
const uploading = ref(false)
const progress = ref(0)
const uploadedChunks = ref(0)
const totalChunks = ref(0)
const currentFile = ref<File | null>(null)
const uploadId = ref('')
const status = ref<'idle' | 'uploading' | 'paused' | 'completed' | 'error'>('idle')
const uploadSpeed = ref(0)
const showSuccessModal = ref(false)

// 暂停控制
const abortControllers = ref<AbortController[]>([])
const uploadedChunkIndices = ref<Set<number>>(new Set())

// 计算属性
const progressStatus = computed(() => {
  switch (status.value) {
    case 'error':
      return 'exception'
    case 'completed':
      return 'success'
    default:
      return 'active'
  }
})

// 文件大小格式化
function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

// 速度格式化
function formatSpeed(bytesPerSecond: number): string {
  return `${formatFileSize(bytesPerSecond)}/s`
}

// 计算文件MD5（用于完整性校验）
async function calculateMD5(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const spark = new (window as any).SparkMD5.ArrayBuffer()
      spark.append(e.target?.result as ArrayBuffer)
      resolve(spark.end())
    }
    reader.readAsArrayBuffer(file)
  })
}

// 上传前检查
async function beforeUpload(file: File): Promise<boolean> {
  // 文件大小检查
  if (file.size > MAX_FILE_SIZE) {
    message.error(`文件大小超过限制（最大${formatFileSize(MAX_FILE_SIZE)}）`)
    return false
  }

  // 文件类型检查
  const allowedTypes = ['.mp4', '.avi', '.mov', '.mkv', '.pdf', '.ppt', '.pptx', '.doc', '.docx', '.zip', '.rar', '.7z']
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!allowedTypes.includes(ext)) {
    message.error('不支持的文件类型')
    return false
  }

  currentFile.value = file
  return true
}

// 自定义上传处理
async function handleCustomRequest() {
  if (!currentFile.value) return

  await startUpload()
}

// 开始上传
async function startUpload() {
  if (!currentFile.value) return

  uploading.value = true
  status.value = 'uploading'
  uploadedChunkIndices.value.clear()
  abortControllers.value = []

  try {
    // 1. 初始化上传
    const file = currentFile.value
    const totalChunkCount = Math.ceil(file.size / CHUNK_SIZE)
    totalChunks.value = totalChunkCount

    const initRes = await request.post('/resources/chunked/init', {
      filename: file.name,
      file_size: file.size,
      total_chunks: totalChunkCount,
      file_hash: null, // 可选：计算MD5
    })

    uploadId.value = initRes.data.upload_id

    // 2. 上传分片
    await uploadChunks(file, totalChunkCount)

    // 3. 完成合并
    await completeUpload()

  } catch (error: any) {
    console.error('上传失败:', error)
    status.value = 'error'
    message.error(error.message || '上传失败')
    emit('error', error)
  }
}

// 上传分片
async function uploadChunks(file: File, totalChunkCount: number) {
  const startTime = Date.now()
  let uploadedBytes = 0

  // 串行上传（如需并行可改为Promise.all + 并发控制）
  for (let i = 0; i < totalChunkCount; i++) {
    if (status.value === 'paused') {
      await waitForResume()
    }

    if (status.value === 'idle') {
      // 已取消
      return
    }

    // 跳过已上传的分片
    if (uploadedChunkIndices.value.has(i)) {
      continue
    }

    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)

    const formData = new FormData()
    formData.append('upload_id', uploadId.value)
    formData.append('chunk_index', i.toString())
    formData.append('chunk_file', chunk, `${file.name}.part${i}`)

    const controller = new AbortController()
    abortControllers.value.push(controller)

    try {
      const chunkStartTime = Date.now()
      
      await request.post('/resources/chunked/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal,
      })

      // 计算速度
      const chunkTime = (Date.now() - chunkStartTime) / 1000
      uploadedBytes += chunk.size
      uploadSpeed.value = chunk.size / chunkTime

      // 更新进度
      uploadedChunkIndices.value.add(i)
      uploadedChunks.value = uploadedChunkIndices.value.size
      progress.value = Math.floor((uploadedChunks.value / totalChunkCount) * 100)

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // 主动取消，不抛错
        return
      }
      throw error
    }
  }

  const totalTime = (Date.now() - startTime) / 1000
  console.log(`上传完成，总耗时: ${totalTime}s，平均速度: ${formatSpeed(file.size / totalTime)}`)
}

// 等待恢复
function waitForResume(): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      if (status.value !== 'paused') {
        resolve()
      } else {
        setTimeout(check, 100)
      }
    }
    check()
  })
}

// 完成上传
async function completeUpload() {
  if (!currentFile.value) return

  const res = await request.post('/resources/chunked/complete', {
    upload_id: uploadId.value,
    category_path: props.categoryPath,
    name: currentFile.value.name,
    question_bank_id: props.questionBankId,
  })

  status.value = 'completed'
  progress.value = 100
  showSuccessModal.value = true
  
  message.success('文件上传成功')
  emit('success', res.data)
}

// 暂停上传
function pauseUpload() {
  status.value = 'paused'
  message.info('上传已暂停')
}

// 恢复上传
function resumeUpload() {
  status.value = 'uploading'
  message.info('继续上传')
}

// 取消上传
async function cancelUpload() {
  // 中止所有进行中的请求
  abortControllers.value.forEach(controller => controller.abort())
  
  // 调用取消API
  if (uploadId.value) {
    try {
      await request.post('/resources/chunked/cancel', { upload_id: uploadId.value })
    } catch (e) {
      // 忽略错误
    }
  }

  resetUpload()
  message.info('上传已取消')
}

// 重置上传
function resetUpload() {
  uploading.value = false
  status.value = 'idle'
  progress.value = 0
  uploadedChunks.value = 0
  totalChunks.value = 0
  currentFile.value = null
  uploadId.value = ''
  uploadSpeed.value = 0
  showSuccessModal.value = false
  uploadedChunkIndices.value.clear()
  abortControllers.value = []
}
</script>

<style scoped lang="less">
.chunked-uploader {
  width: 100%;
}

.upload-progress {
  .file-info {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    .file-icon {
      font-size: 48px;
      color: #1890ff;
      margin-right: 16px;
    }

    .file-detail {
      flex: 1;

      .file-name {
        font-size: 16px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.85);
        margin-bottom: 4px;
        word-break: break-all;
      }

      .file-size {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.45);
      }
    }
  }

  .progress-section {
    margin-bottom: 20px;

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      .progress-label {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.65);
      }

      .progress-text {
        font-size: 14px;
        font-weight: 500;
        color: #1890ff;
      }
    }

    .progress-detail {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
}
</style>
