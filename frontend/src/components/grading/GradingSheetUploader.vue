<template>
  <div class="grading-sheet-uploader">
    <a-card title="批量导入评分表" :bordered="false">
      <a-alert
        message="上传格式说明"
        type="info"
        show-icon
        class="upload-alert"
      >
        <template #description>
          <p>压缩包内需按 <strong>身份证号/评分表图片</strong> 的结构组织：</p>
          <pre class="format-example">评分表.zip/
├── 450203200801011234/    ← 身份证号
│   ├── 裁判1.jpg
│   ├── 裁判2.jpg
│   └── 裁判3.jpg
├── 450203200801015678/
│   └── 评分表.png
└── ...</pre>
          <p>支持的图片格式：JPG、PNG、GIF、BMP、WEBP、PDF</p>
        </template>
      </a-alert>

      <a-upload-dragger
        v-model:fileList="fileList"
        name="archive_file"
        accept=".zip"
        :max-count="1"
        :custom-request="handleUpload"
        :before-upload="beforeUpload"
        :disabled="uploading"
        class="upload-dragger"
      >
        <p class="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p class="ant-upload-text">点击或拖拽上传评分表压缩包</p>
        <p class="ant-upload-hint">
          仅支持 ZIP 格式，单个文件不超过 500MB
        </p>
      </a-upload-dragger>
    </a-card>

    <!-- 导入结果弹窗 -->
    <a-modal
      v-model:open="resultVisible"
      title="导入结果"
      :footer="null"
      width="700px"
      :maskClosable="false"
    >
      <div class="import-result">
        <!-- 进度条（上传中显示） -->
        <a-progress
          v-if="uploading"
          :percent="uploadPercent"
          status="active"
          class="upload-progress"
        />

        <!-- 结果统计 -->
        <div v-if="importResult" class="result-stats">
          <a-row :gutter="16">
            <a-col :span="8">
              <a-statistic
                title="成功导入"
                :value="importResult.summary?.success_count || 0"
                suffix="人"
                :value-style="{ color: '#52c41a' }"
              >
                <template #prefix>
                  <CheckCircleOutlined />
                </template>
              </a-statistic>
            </a-col>
            <a-col :span="8">
              <a-statistic
                title="导入失败"
                :value="importResult.summary?.failed_count || 0"
                suffix="人"
                :value-style="{ color: '#ff4d4f' }"
              >
                <template #prefix>
                  <CloseCircleOutlined />
                </template>
              </a-statistic>
            </a-col>
            <a-col :span="8">
              <a-statistic
                title="跳过文件"
                :value="importResult.summary?.skipped_count || 0"
                suffix="个"
                :value-style="{ color: '#faad14' }"
              >
                <template #prefix>
                  <ExclamationCircleOutlined />
                </template>
              </a-statistic>
            </a-col>
          </a-row>
        </div>

        <!-- 失败详情 -->
        <div v-if="importResult?.failed?.length" class="failed-list">
          <a-divider>导入失败详情</a-divider>
          <a-table
            :columns="failedColumns"
            :data-source="importResult.failed"
            :pagination="false"
            size="small"
            row-key="identity_no"
          />
        </div>

        <!-- 成功详情 -->
        <div v-if="importResult?.success?.length" class="success-list">
          <a-divider>导入成功详情</a-divider>
          <a-table
            :columns="successColumns"
            :data-source="importResult.success"
            :pagination="{ pageSize: 10 }"
            size="small"
            row-key="identity_no"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import type { UploadFile } from 'ant-design-vue'
import {
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons-vue'
import { uploadGradingSheets } from '@/api/scores'

const props = defineProps<{
  examId: number
}>()

const emit = defineEmits<{
  'import-success': [result: any]
}>()

// 上传状态
const fileList = ref<UploadFile[]>([])
const uploading = ref(false)
const uploadPercent = ref(0)

// 结果弹窗
const resultVisible = ref(false)
const importResult = ref<any>(null)

// 上传前校验
function beforeUpload(file: File): boolean {
  const isZip = file.name.toLowerCase().endsWith('.zip')
  if (!isZip) {
    message.error('请上传 ZIP 格式的压缩包')
    return false
  }

  const isLt500M = file.size / 1024 / 1024 < 500
  if (!isLt500M) {
    message.error('文件大小不能超过 500MB')
    return false
  }

  return true
}

// 处理上传
async function handleUpload(options: any) {
  const { file, onProgress, onSuccess, onError } = options

  uploading.value = true
  uploadPercent.value = 0
  resultVisible.value = true
  importResult.value = null

  try {
    const formData = new FormData()
    formData.append('archive_file', file)

    const result = await uploadGradingSheets(props.examId, formData, {
      onUploadProgress: (progressEvent: any) => {
        uploadPercent.value = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        )
        onProgress({ percent: uploadPercent.value })
      },
    })

    importResult.value = result.data
    onSuccess(result)

    const summary = result.data?.summary || {}
    if (summary.failed_count > 0) {
      message.warning(`导入完成：成功${summary.success_count}人，失败${summary.failed_count}人`)
    } else {
      message.success(`导入完成：成功${summary.success_count}人`)
    }

    emit('import-success', result.data)
  } catch (error: any) {
    onError(error)
    message.error('导入失败：' + (error.message || '请稍后重试'))
  } finally {
    uploading.value = false
    fileList.value = []
  }
}

// 失败表格列
const failedColumns = [
  { title: '身份证号', dataIndex: 'identity_no', key: 'identity_no' },
  { title: '学生姓名', dataIndex: 'student_name', key: 'student_name' },
  { title: '失败原因', dataIndex: 'reason', key: 'reason' },
]

// 成功表格列
const successColumns = [
  { title: '身份证号', dataIndex: 'identity_no', key: 'identity_no' },
  { title: '学生姓名', dataIndex: 'student_name', key: 'student_name' },
  { title: '评分表数量', dataIndex: 'sheets_count', key: 'sheets_count' },
]
</script>

<style scoped>
.upload-alert {
  margin-bottom: 20px;
}

.format-example {
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  margin: 8px 0;
}

.upload-dragger {
  margin-top: 16px;
}

.upload-progress {
  margin-bottom: 24px;
}

.result-stats {
  padding: 16px 0;
}

.failed-list,
.success-list {
  margin-top: 8px;
}
</style>
