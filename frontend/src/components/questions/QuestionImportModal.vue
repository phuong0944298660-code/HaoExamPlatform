<template>
  <a-modal
    v-model:open="visible"
    :title="currentStep === 'upload' ? '批量导入题目' : '导入预览'"
    :width="currentStep === 'upload' ? 600 : 900"
    :confirm-loading="uploading || importing"
    :ok-text="currentStep === 'upload' ? '开始导入' : '确认导入'"
    :cancel-text="currentStep === 'upload' ? '取消' : '返回'"
    @ok="handleOk"
    @cancel="handleCancel"
    :mask-closable="false"
  >
    <!-- 步骤条 -->
    <a-steps :current="currentStep === 'upload' ? 0 : 1" size="small" class="import-steps">
      <a-step title="上传文件" description="选择Excel/Word文件" />
      <a-step title="预览确认" description="检查并确认导入" />
    </a-steps>

    <!-- 第一步：上传文件 -->
    <div v-if="currentStep === 'upload'" class="upload-section">
      <a-tabs v-model:activeKey="uploadMethod">
        <a-tab-pane key="file" tab="上传文件">
          <!-- 文件上传拖拽区域 -->
          <a-upload-dragger
            v-model:fileList="fileList"
            :before-upload="beforeUpload"
            :max-count="1"
            accept=".xlsx,.xls,.csv,.docx"
            class="upload-dragger"
          >
            <p class="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p class="ant-upload-hint">
              支持 Excel (.xlsx, .xls)、CSV 或 Word (.docx) 格式<br>
              文件大小不超过 10MB
            </p>
          </a-upload-dragger>

          <!-- 导入说明 -->
          <a-alert
            message="导入说明"
            description="请按照模板格式填写题目数据，包含题目类型、内容、选项、答案等字段。系统会自动识别并解析题目。"
            type="info"
            show-icon
            class="upload-alert"
          />
        </a-tab-pane>
        
        <a-tab-pane key="paste" tab="粘贴内容">
          <a-textarea
            v-model:value="pastedContent"
            placeholder="请将题目内容粘贴到此处...
支持格式：
1. 题目内容
A. 选项A
B. 选项B
C. 选项C
D. 选项D
答案：A
解析：这是答案解析"
            :rows="10"
          />
          <a-button type="primary" block style="margin-top: 16px" @click="parsePastedContent">
            <FileTextOutlined /> 解析内容
          </a-button>
        </a-tab-pane>
      </a-tabs>

      <!-- 模板下载 -->
      <div class="template-section">
        <span class="template-label">下载导入模板：</span>
        <a-space>
          <a-button type="link" size="small" @click="downloadTemplate('excel')">
            <DownloadOutlined /> Excel模板
          </a-button>
          <a-button type="link" size="small" @click="downloadTemplate('word')">
            <DownloadOutlined /> Word模板
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 第二步：预览确认 -->
    <div v-else class="preview-section">
      <!-- 统计信息 -->
      <div class="preview-stats">
        <a-row :gutter="16">
          <a-col :span="6">
            <div class="stat-box">
              <div class="stat-number total">{{ previewData.length }}</div>
              <div class="stat-label">待导入题目</div>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="stat-box">
              <div class="stat-number success">{{ validCount }}</div>
              <div class="stat-label">验证通过</div>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="stat-box">
              <div class="stat-number warning">{{ warningCount }}</div>
              <div class="stat-label">有警告</div>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="stat-box">
              <div class="stat-number error">{{ errorCount }}</div>
              <div class="stat-label">有错误</div>
            </div>
          </a-col>
        </a-row>
      </div>

      <!-- 错误提示 -->
      <a-alert
        v-if="errorCount > 0"
        :message="`存在 ${errorCount} 道题目有错误，请修正后重新导入`"
        type="error"
        show-icon
        class="error-alert"
      />

      <!-- 题目预览列表 -->
      <div class="preview-list">
        <div class="list-header">
          <span>题目预览</span>
          <a-checkbox v-model:checked="selectAll" @change="handleSelectAll">
            全选
          </a-checkbox>
        </div>
        
        <a-spin :spinning="parsing">
          <div class="preview-items">
            <div 
              v-for="(item, index) in previewData" 
              :key="index"
              class="preview-item"
              :class="{ 'has-error': item.errors?.length, 'has-warning': item.warnings?.length }"
            >
              <div class="item-header">
                <a-checkbox 
                  v-model:checked="item.selected"
                  :disabled="item.errors?.length > 0"
                />
                <span class="item-index">#{{ index + 1 }}</span>
                <a-tag size="small" :color="getQuestionTypeColor(item.question_type)">
                  {{ getQuestionTypeText(item.question_type) }}
                </a-tag>
                <span class="item-status">
                  <CheckCircleOutlined v-if="!item.errors?.length && !item.warnings?.length" class="status-icon success" />
                  <WarningOutlined v-else-if="item.warnings?.length" class="status-icon warning" />
                  <CloseCircleOutlined v-else class="status-icon error" />
                </span>
              </div>
              
              <div class="item-content" @click="expandItem(index)">
                <div class="content-text">{{ truncateContent(item.content) }}</div>
                <RightOutlined class="expand-icon" :class="{ 'expanded': expandedItems[index] }" />
              </div>

              <!-- 展开详情 -->
              <div v-if="expandedItems[index]" class="item-detail">
                <QuestionPreview :question="item" :show-answer="true" />
                
                <!-- 错误和警告 -->
                <div v-if="item.errors?.length" class="validation-errors">
                  <div v-for="(error, i) in item.errors" :key="i" class="error-item">
                    <CloseCircleOutlined /> {{ error }}
                  </div>
                </div>
                <div v-if="item.warnings?.length" class="validation-warnings">
                  <div v-for="(warning, i) in item.warnings" :key="i" class="warning-item">
                    <WarningOutlined /> {{ warning }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </a-spin>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  InboxOutlined,
  DownloadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  RightOutlined,
} from '@ant-design/icons-vue'
import type { Question } from '@/types/api'
import QuestionPreview from './QuestionPreview.vue'
import { batchImportQuestions } from '@/api/questions'

// ── Props & Emits ──
interface Props {
  visible: boolean
  questionBankId: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: [count: number]
}>()

// ── 状态定义 ──
const currentStep = ref<'upload' | 'preview'>('upload')
const uploadMethod = ref<'file' | 'paste'>('file')
const fileList = ref<any[]>([])
const pastedContent = ref('')
const uploading = ref(false)
const parsing = ref(false)
const importing = ref(false)

// 预览数据
interface PreviewItem extends Partial<Question> {
  selected?: boolean
  errors?: string[]
  warnings?: string[]
}

const previewData = ref<PreviewItem[]>([])
const expandedItems = reactive<Record<number, boolean>>({})
const selectAll = ref(false)

// ── 计算属性 ──
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const validCount = computed(() => 
  previewData.value.filter(item => !item.errors?.length).length
)

const warningCount = computed(() => 
  previewData.value.filter(item => item.warnings?.length && !item.errors?.length).length
)

const errorCount = computed(() => 
  previewData.value.filter(item => item.errors?.length).length
)

const selectedCount = computed(() => 
  previewData.value.filter(item => item.selected && !item.errors?.length).length
)

// ── 方法定义 ──

// 文件上传前验证
function beforeUpload(file: File) {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  ]
  
  const isValidType = validTypes.includes(file.type) || 
    file.name.endsWith('.xlsx') || 
    file.name.endsWith('.xls') || 
    file.name.endsWith('.csv') ||
    file.name.endsWith('.docx')
  
  if (!isValidType) {
    message.error('只支持 Excel (.xlsx, .xls)、CSV 或 Word (.docx) 文件!')
    return false
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    message.error('文件大小不能超过 10MB!')
    return false
  }
  
  return false // 阻止自动上传
}

// 生成模拟预览数据
function generateMockPreviewData(): PreviewItem[] {
  return [
    {
      content: '若a、b为实数，且|a+1|+√(b-1)=0，则(ab)^2023的值是？',
      question_type: 'single_choice',
      difficulty: 'medium',
      default_score: 3,
      options: [
        { label: 'A', content: '0' },
        { label: 'B', content: '1' },
        { label: 'C', content: '-1' },
        { label: 'D', content: '2023' },
      ],
      correct_answer: 'C',
      answer_analysis: '根据绝对值和平方根的非负性，可得a=-1, b=1，所以ab=-1，(ab)^2023=-1',
      tags: ['代数', '绝对值'],
      selected: true,
    },
    {
      content: '下列函数中，是正比例函数的是？',
      question_type: 'single_choice',
      difficulty: 'easy',
      default_score: 3,
      options: [
        { label: 'A', content: 'y=x²' },
        { label: 'B', content: 'y=2x' },
        { label: 'C', content: 'y=1/x' },
        { label: 'D', content: 'y=x+1' },
      ],
      correct_answer: 'B',
      tags: ['函数'],
      selected: true,
    },
    {
      content: '', // 空内容，有错误
      question_type: 'single_choice',
      difficulty: 'easy',
      default_score: 2,
      options: [],
      selected: false,
      errors: ['题目内容不能为空', '至少需要2个选项'],
    },
    {
      content: '三角形的内角和等于180度。',
      question_type: 'judgment',
      difficulty: 'easy',
      default_score: 2,
      options: [
        { label: 'A', content: '正确' },
        { label: 'B', content: '错误' },
      ],
      correct_answer: 'A',
      tags: ['几何'],
      selected: true,
    },
    {
      content: '下列各组数中，能构成直角三角形的是？',
      question_type: 'multi_choice',
      difficulty: 'medium',
      default_score: 4,
      options: [
        { label: 'A', content: '3,4,5' },
        { label: 'B', content: '5,12,13' },
        { label: 'C', content: '1,2,3' },
        { label: 'D', content: '6,8,10' },
      ],
      correct_answer: 'ABD',
      scoring_rules: { full_score: 4, partial_score: 2, wrong_score: 0, partial_mode: 'per_option' },
      tags: ['几何', '勾股定理'],
      selected: true,
      warnings: ['未设置答案解析'],
    },
  ]
}

// 解析粘贴的内容
async function parsePastedContent() {
  if (!pastedContent.value.trim()) {
    message.warning('请输入要解析的内容')
    return
  }
  
  parsing.value = true
  try {
    // TODO: 实现真实的内容解析逻辑
    // 这里模拟解析过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 生成预览数据（模拟）
    previewData.value = generateMockPreviewData()
    currentStep.value = 'preview'
  } finally {
    parsing.value = false
  }
}

// 解析文件
async function parseFile(file: File): Promise<PreviewItem[]> {
  // TODO: 实现真实的文件解析逻辑
  // 根据文件类型调用不同的解析方法
  await new Promise(resolve => setTimeout(resolve, 1500))
  return generateMockPreviewData()
}

// 下载模板
function downloadTemplate(type: 'excel' | 'word') {
  message.success(`正在下载${type === 'excel' ? 'Excel' : 'Word'}模板...`)
  
  // TODO: 调用API下载模板文件
  // const link = document.createElement('a')
  // link.href = `/api/templates/question-import.${type === 'excel' ? 'xlsx' : 'docx'}`
  // link.download = `题目导入模板.${type === 'excel' ? 'xlsx' : 'docx'}`
  // link.click()
}

// 展开/收起题目详情
function expandItem(index: number) {
  expandedItems[index] = !expandedItems[index]
}

// 全选/取消全选
function handleSelectAll(e: any) {
  const checked = e.target.checked
  previewData.value.forEach(item => {
    if (!item.errors?.length) {
      item.selected = checked
    }
  })
}

// 获取题型文本
function getQuestionTypeText(type: string): string {
  const textMap: Record<string, string> = {
    single_choice: '单选',
    multi_choice: '多选',
    judgment: '判断',
    subjective: '主观',
  }
  return textMap[type] || type
}

// 获取题型颜色
function getQuestionTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    single_choice: 'blue',
    multi_choice: 'green',
    judgment: 'orange',
    subjective: 'purple',
  }
  return colorMap[type] || 'default'
}

// 截断内容
function truncateContent(content: string, maxLength: number = 80): string {
  if (!content) return '(无内容)'
  const text = content.replace(/<[^>]+>/g, '')
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 处理确定按钮
async function handleOk() {
  if (currentStep.value === 'upload') {
    // 检查是否有文件
    if (uploadMethod.value === 'file' && fileList.value.length === 0) {
      message.warning('请先选择要导入的文件')
      return
    }
    
    if (uploadMethod.value === 'paste' && !pastedContent.value.trim()) {
      message.warning('请输入要解析的内容')
      return
    }
    
    // 解析文件并进入预览
    parsing.value = true
    try {
      if (uploadMethod.value === 'file' && fileList.value[0]?.originFileObj) {
        previewData.value = await parseFile(fileList.value[0].originFileObj)
      } else {
        previewData.value = generateMockPreviewData()
      }
      currentStep.value = 'preview'
    } finally {
      parsing.value = false
    }
  } else {
    // 确认导入
    if (selectedCount.value === 0) {
      message.warning('请至少选择一道题目导入')
      return
    }
    
    if (errorCount.value > 0) {
      message.error(`存在 ${errorCount.value} 道题目有错误，请修正后重新导入`)
      return
    }
    
    importing.value = true
    try {
      // 调用真实API导入题目
      const selectedItems = previewData.value.filter(item => item.selected)
      const formData = new FormData()
      
      // 如果是文件上传方式，直接使用原文件
      if (uploadMethod.value === 'file' && fileList.value[0]?.originFileObj) {
        formData.append('file', fileList.value[0].originFileObj)
      } else {
        // 否则将选中的题目数据作为JSON提交
        formData.append('questions', JSON.stringify(selectedItems))
      }
      formData.append('bank_id', props.questionBankId.toString())
      
      const res = await batchImportQuestions(formData)
      
      message.success(`成功导入 ${selectedCount.value} 道题目`)
      emit('success', selectedCount.value)
      resetAndClose()
    } catch (error: any) {
      message.error(error.message || '导入失败，请重试')
    } finally {
      importing.value = false
    }
  }
}

// 处理取消按钮
function handleCancel() {
  if (currentStep.value === 'preview') {
    // 返回上传步骤
    currentStep.value = 'upload'
  } else {
    // 关闭弹窗
    resetAndClose()
  }
}

// 重置并关闭
function resetAndClose() {
  currentStep.value = 'upload'
  fileList.value = []
  pastedContent.value = ''
  previewData.value = []
  Object.keys(expandedItems).forEach(key => delete expandedItems[Number(key)])
  selectAll.value = false
  visible.value = false
}

// 监听弹窗显示状态
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    // 弹窗关闭时重置状态
    setTimeout(() => {
      currentStep.value = 'upload'
      fileList.value = []
      pastedContent.value = ''
      previewData.value = []
    }, 300)
  }
})
</script>

<style scoped lang="less">
.import-steps {
  margin-bottom: 24px;
}

// 上传区域
.upload-section {
  .upload-dragger {
    margin-bottom: 16px;
  }
  
  .upload-alert {
    margin-top: 16px;
  }
  
  .template-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed #d9d9d9;
    text-align: center;
    
    .template-label {
      color: #8c8c8c;
      font-size: 13px;
    }
  }
}

// 预览区域
.preview-section {
  .preview-stats {
    margin-bottom: 16px;
    
    .stat-box {
      text-align: center;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      
      .stat-number {
        font-size: 24px;
        font-weight: 600;
        line-height: 1.2;
        
        &.total { color: #1890ff; }
        &.success { color: #52c41a; }
        &.warning { color: #faad14; }
        &.error { color: #f5222d; }
      }
      
      .stat-label {
        font-size: 12px;
        color: #8c8c8c;
        margin-top: 4px;
      }
    }
  }
  
  .error-alert {
    margin-bottom: 16px;
  }
  
  .preview-list {
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
    
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #fafafa;
      border-bottom: 1px solid #f0f0f0;
      font-weight: 500;
    }
    
    .preview-items {
      max-height: 400px;
      overflow-y: auto;
      
      .preview-item {
        padding: 12px 16px;
        border-bottom: 1px solid #f0f0f0;
        transition: background 0.3s;
        
        &:last-child {
          border-bottom: none;
        }
        
        &:hover {
          background: #fafafa;
        }
        
        &.has-error {
          background: #fff2f0;
          border-left: 3px solid #f5222d;
        }
        
        &.has-warning {
          background: #fffbe6;
          border-left: 3px solid #faad14;
        }
        
        .item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          
          .item-index {
            font-size: 12px;
            color: #8c8c8c;
            min-width: 40px;
          }
          
          .item-status {
            margin-left: auto;
            
            .status-icon {
              font-size: 16px;
              
              &.success { color: #52c41a; }
              &.warning { color: #faad14; }
              &.error { color: #f5222d; }
            }
          }
        }
        
        .item-content {
          display: flex;
          align-items: center;
          cursor: pointer;
          padding-left: 32px;
          
          .content-text {
            flex: 1;
            color: #262626;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .expand-icon {
            color: #8c8c8c;
            transition: transform 0.3s;
            
            &.expanded {
              transform: rotate(90deg);
            }
          }
        }
        
        .item-detail {
          margin-top: 12px;
          padding: 16px;
          background: white;
          border-radius: 4px;
          
          .validation-errors {
            margin-top: 12px;
            padding: 8px 12px;
            background: #fff2f0;
            border-radius: 4px;
            
            .error-item {
              color: #f5222d;
              font-size: 13px;
              
              &:not(:last-child) {
                margin-bottom: 4px;
              }
            }
          }
          
          .validation-warnings {
            margin-top: 12px;
            padding: 8px 12px;
            background: #fffbe6;
            border-radius: 4px;
            
            .warning-item {
              color: #d48806;
              font-size: 13px;
              
              &:not(:last-child) {
                margin-bottom: 4px;
              }
            }
          }
        }
      }
    }
  }
}
</style>
