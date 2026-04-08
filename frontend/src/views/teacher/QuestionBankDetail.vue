<template>
  <div class="question-bank-detail">
    <!-- 页面标题和返回按钮 -->
    <a-page-header
      title="题库详情"
      sub-title="查看和管理题库中的题目"
      @back="goBack"
    >
      <template #extra>
        <a-space>
          <a-button @click="showImportModal">
            <template #icon><ImportOutlined /></template>
            导入题目
          </a-button>
          <a-button type="primary" @click="showAddQuestionModal">
            <template #icon><PlusOutlined /></template>
            添加题目
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <!-- 题库基本信息 -->
    <a-card :bordered="false" class="info-card" v-if="bankInfo">
      <a-descriptions :title="bankInfo.name" :column="{ xs: 1, sm: 2, md: 4 }">
        <a-descriptions-item label="题库ID">{{ bankInfo.id }}</a-descriptions-item>
        <a-descriptions-item label="适用学段">
          <a-tag :color="getGradeColor(bankInfo.grade_group)">
            {{ getGradeText(bankInfo.grade_group) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-badge
            :status="bankInfo.status === 'active' ? 'success' : 'default'"
            :text="bankInfo.status === 'active' ? '启用' : '归档'"
          />
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ bankInfo.created_at }}</a-descriptions-item>
        <a-descriptions-item label="题库描述" :span="4">
          {{ bankInfo.description || '暂无描述' }}
        </a-descriptions-item>
      </a-descriptions>

      <!-- 统计信息 -->
      <a-divider />
      <a-row :gutter="16" class="stats-row">
        <a-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ bankInfo.total_questions || 0 }}</div>
            <div class="stat-label">题目总数</div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ stats.single_choice_count || 0 }}</div>
            <div class="stat-label">单选题</div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ stats.multi_choice_count || 0 }}</div>
            <div class="stat-label">多选题</div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ stats.judgment_count || 0 }}</div>
            <div class="stat-label">判断题</div>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <!-- 筛选和搜索 -->
    <a-card :bordered="false" class="filter-card">
      <a-row :gutter="16" align="middle">
        <a-col :span="8">
          <a-input-search
            v-model:value="searchQuery"
            placeholder="搜索题目内容"
            allow-clear
            @search="handleSearch"
          />
        </a-col>
        <a-col :span="5">
          <a-select
            v-model:value="filterType"
            placeholder="题型筛选"
            allow-clear
            style="width: 100%"
            @change="handleFilterChange"
          >
            <a-select-option value="single_choice">单选题</a-select-option>
            <a-select-option value="multi_choice">多选题</a-select-option>
            <a-select-option value="judgment">判断题</a-select-option>
            <a-select-option value="subjective">主观题</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="5">
          <a-select
            v-model:value="filterDifficulty"
            placeholder="难度筛选"
            allow-clear
            style="width: 100%"
            @change="handleFilterChange"
          >
            <a-select-option value="easy">简单</a-select-option>
            <a-select-option value="medium">中等</a-select-option>
            <a-select-option value="hard">困难</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="6" style="text-align: right">
          <a-button @click="resetFilters">重置筛选</a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 题目列表 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :data-source="questionList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 题型列 -->
          <template v-if="column.key === 'questionType'">
            <a-tag>{{ getQuestionTypeText(record.question_type) }}</a-tag>
          </template>

          <!-- 难度列 -->
          <template v-if="column.key === 'difficulty'">
            <a-tag :color="getDifficultyColor(record.difficulty)">
              {{ getDifficultyText(record.difficulty) }}
            </a-tag>
          </template>

          <!-- 内容列 -->
          <template v-if="column.key === 'content'">
            <div class="question-content" v-html="truncateContent(record.content)"></div>
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="viewQuestion(record)">
                查看
              </a-button>
              <a-button type="link" size="small" @click="editQuestion(record)">
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除这道题吗？"
                ok-text="确定"
                cancel-text="取消"
                ok-type="danger"
                @confirm="handleDeleteQuestion(record)"
              >
                <a-button type="link" size="small" danger>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加/编辑题目弹窗 -->
    <a-modal
      v-model:open="questionModalVisible"
      :title="isEditingQuestion ? '编辑题目' : '添加题目'"
      ok-text="确定"
      cancel-text="取消"
      :confirm-loading="questionModalLoading"
      width="860px"
      @ok="handleQuestionModalOk"
      @cancel="handleQuestionModalCancel"
    >
      <a-form
        ref="questionFormRef"
        :model="questionForm"
        :rules="questionFormRules"
        layout="vertical"
      >
        <a-form-item label="题目类型" name="question_type">
          <a-select v-model:value="questionForm.question_type" placeholder="请选择题型">
            <a-select-option value="single_choice">单选题</a-select-option>
            <a-select-option value="multi_choice">多选题</a-select-option>
            <a-select-option value="judgment">判断题</a-select-option>
            <a-select-option value="subjective">主观题</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="题目内容" name="content">
          <a-textarea
            v-model:value="questionForm.content"
            placeholder="请输入题目内容"
            :rows="4"
          />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="难度" name="difficulty">
              <a-select v-model:value="questionForm.difficulty" placeholder="请选择难度">
                <a-select-option value="easy">简单</a-select-option>
                <a-select-option value="medium">中等</a-select-option>
                <a-select-option value="hard">困难</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="默认分值" name="default_score">
              <a-input-number
                v-model:value="questionForm.default_score"
                :min="0.5"
                :max="100"
                :step="0.5"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <!-- 题目解析 -->
        <a-form-item label="题目解析（可选）" name="analysis">
          <a-textarea
            v-model:value="questionForm.analysis"
            placeholder="请输入题目解析说明（学生答题后可见）"
            :rows="3"
          />
        </a-form-item>
        <!-- 解析图片上传 -->
        <a-form-item label="解析图片（可选）">
          <div class="analysis-image-upload">
            <a-upload
              v-model:file-list="analysisImageFileList"
              list-type="picture-card"
              :before-upload="beforeAnalysisImageUpload"
              :custom-request="uploadAnalysisImage"
              :max-count="5"
              accept="image/*"
              @remove="removeAnalysisImage"
            >
              <div v-if="analysisImageFileList.length < 5">
                <PlusOutlined />
                <div style="margin-top: 8px; font-size: 12px">上传解析图片</div>
              </div>
            </a-upload>
            <div class="upload-hint">最多上传 5 张图片，支持 JPG、PNG、GIF，每张不超过 5MB</div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 导入题目弹窗 -->
    <a-modal
      v-model:open="importModalVisible"
      title="导入题目"
      ok-text="开始导入"
      cancel-text="取消"
      :confirm-loading="importLoading"
      @ok="handleImport"
      @cancel="importModalVisible = false"
    >
      <a-upload-dragger
        v-model:fileList="importFileList"
        :before-upload="beforeUpload"
        :max-count="1"
        accept=".xlsx,.xls,.csv"
      >
        <p class="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p class="ant-upload-hint">
          支持 Excel (.xlsx, .xls) 或 CSV 格式，文件大小不超过 10MB
        </p>
      </a-upload-dragger>
      <a-divider />
      <a-alert
        message="导入说明"
        description="请按照模板格式填写题目数据，包含题目类型、内容、选项、答案等字段。"
        type="info"
        show-icon
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { PlusOutlined, ImportOutlined, InboxOutlined } from '@ant-design/icons-vue'
import { getQuestionBank, getQuestions, createQuestion, updateQuestion, deleteQuestion, batchImportQuestions } from '@/api/questions'
import type { QuestionBank, Question } from '@/types/api'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const bankId = Number(route.params.bankId)

// ── 题库信息 ──
const bankInfo = ref<QuestionBank | null>(null)
const stats = reactive({
  total_questions: 0,
  single_choice_count: 0,
  multi_choice_count: 0,
  judgment_count: 0,
  subjective_count: 0,
  easy_count: 0,
  medium_count: 0,
  hard_count: 0,
})

// ── 表格列定义 ──
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '题型', key: 'questionType', width: 100 },
  { title: '题目内容', key: 'content', ellipsis: true },
  { title: '难度', key: 'difficulty', width: 100 },
  { title: '分值', dataIndex: 'default_score', key: 'score', width: 80 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
]

// ── 数据状态 ──
const loading = ref(false)
const questionList = ref<Question[]>([])
const searchQuery = ref('')
const filterType = ref<string | undefined>(undefined)
const filterDifficulty = ref<string | undefined>(undefined)

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

// ── 工具函数 ──
function getGradeColor(grade: string): string {
  const colorMap: Record<string, string> = {
    primary: 'green',
    junior: 'blue',
  }
  return colorMap[grade] || 'default'
}

function getGradeText(grade: string): string {
  const textMap: Record<string, string> = {
    primary: '小学',
    junior: '初中',
  }
  return textMap[grade] || grade
}

function getQuestionTypeText(type: string): string {
  const textMap: Record<string, string> = {
    single_choice: '单选题',
    multi_choice: '多选题',
    judgment: '判断题',
    subjective: '主观题',
  }
  return textMap[type] || type
}

function getDifficultyColor(difficulty: string): string {
  const colorMap: Record<string, string> = {
    easy: 'success',
    medium: 'warning',
    hard: 'error',
  }
  return colorMap[difficulty] || 'default'
}

function getDifficultyText(difficulty: string): string {
  const textMap: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  }
  return textMap[difficulty] || difficulty
}

function truncateContent(content: string, maxLength: number = 50): string {
  if (!content) return ''
  // 去除HTML标签
  const text = content.replace(/<[^>]+>/g, '')
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// ── 数据加载 ──
async function fetchBankInfo() {
  try {
    const res = await getQuestionBank(bankId)
    bankInfo.value = res.data as QuestionBank
    
    // 更新统计数据
    if (bankInfo.value) {
      Object.assign(stats, {
        total_questions: bankInfo.value.total_questions || 0,
        single_choice_count: 0,
        multi_choice_count: 0,
        judgment_count: 0,
        subjective_count: 0,
      })
    }
  } catch (error) {
    message.error('获取题库信息失败')
    console.error('[QuestionBankDetail] 获取题库信息失败:', error)
  }
}

async function fetchQuestions() {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      size: pagination.pageSize,
      bank_id: bankId,
      question_type: filterType.value,
      difficulty: filterDifficulty.value,
      search: searchQuery.value || undefined,
    }
    const res = await getQuestions(params)
    questionList.value = res.data?.list || res.data?.items || []
    pagination.total = res.data?.meta?.total || 0
  } catch (error) {
    message.error('获取题目列表失败')
    console.error('[QuestionBankDetail] 获取题目列表失败:', error)
  } finally {
    loading.value = false
  }
}

// ── 搜索和筛选 ──
function handleSearch() {
  pagination.current = 1
  fetchQuestions()
}

function handleFilterChange() {
  pagination.current = 1
  fetchQuestions()
}

function resetFilters() {
  searchQuery.value = ''
  filterType.value = undefined
  filterDifficulty.value = undefined
  pagination.current = 1
  fetchQuestions()
}

function handleTableChange(p: any) {
  pagination.current = p.current
  pagination.pageSize = p.pageSize
  fetchQuestions()
}

// ── 题目操作 ──
const questionModalVisible = ref(false)
const questionModalLoading = ref(false)
const isEditingQuestion = ref(false)
const editingQuestionId = ref<number | null>(null)
const questionFormRef = ref<FormInstance>()

const questionForm = reactive({
  question_type: 'single_choice',
  content: '',
  difficulty: 'medium',
  default_score: 3,
  analysis: '',
  analysis_images: [] as string[],  // 存储图片URL列表
})

// 解析图片上传相关
const analysisImageFileList = ref<any[]>([])

function beforeAnalysisImageUpload(file: File): boolean {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件')
    return false
  }
  const isUnder5M = file.size / 1024 / 1024 < 5
  if (!isUnder5M) {
    message.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

async function uploadAnalysisImage({ file, onSuccess, onError }: any) {
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res: any = await request.post('/resources/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const url = res.data?.url || res.data?.fileUrl || res.data?.file_url || ''
    if (url) {
      questionForm.analysis_images.push(url)
      onSuccess({ url }, file)
    } else {
      onError(new Error('上传失败，未获取到URL'))
    }
  } catch (e) {
    message.error('图片上传失败')
    onError(e)
  }
}

function removeAnalysisImage(file: any) {
  const url = file.response?.url || file.url || ''
  if (url) {
    questionForm.analysis_images = questionForm.analysis_images.filter(u => u !== url)
  }
}

const questionFormRules = {
  question_type: [{ required: true, message: '请选择题型', trigger: 'change' }],
  content: [{ required: true, message: '请输入题目内容', trigger: 'blur' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }],
  default_score: [{ required: true, message: '请输入分值', trigger: 'blur' }],
}

function showAddQuestionModal() {
  isEditingQuestion.value = false
  editingQuestionId.value = null
  questionForm.question_type = 'single_choice'
  questionForm.content = ''
  questionForm.difficulty = 'medium'
  questionForm.default_score = 3
  questionForm.analysis = ''
  questionForm.analysis_images = []
  analysisImageFileList.value = []
  questionModalVisible.value = true
}

function viewQuestion(record: Question) {
  message.info(`查看题目 ID: ${record.id}`)
}

function editQuestion(record: any) {
  isEditingQuestion.value = true
  editingQuestionId.value = record.id
  questionForm.question_type = record.question_type
  questionForm.content = record.content
  questionForm.difficulty = record.difficulty
  questionForm.default_score = record.default_score
  questionForm.analysis = record.analysis || record.answer_analysis || ''
  // 解析已有的图片
  const imgs: string[] = (() => {
    try {
      return JSON.parse(record.analysis_images || record.analysisImages || '[]') || []
    } catch {
      return []
    }
  })()
  questionForm.analysis_images = imgs
  analysisImageFileList.value = imgs.map((url: string, idx: number) => ({
    uid: `-${idx}`,
    name: `图片${idx + 1}`,
    status: 'done',
    url,
  }))
  questionModalVisible.value = true
}

async function handleQuestionModalOk() {
  try {
    await questionFormRef.value?.validate()
    questionModalLoading.value = true
    
    const payload = {
      ...questionForm,
      analysis_images: JSON.stringify(questionForm.analysis_images),
      question_bank_id: bankId,
    }
    if (isEditingQuestion.value && editingQuestionId.value) {
      await updateQuestion(editingQuestionId.value, payload)
      message.success('题目更新成功')
    } else {
      await createQuestion(payload)
      message.success('题目添加成功')
    }
    
    questionModalVisible.value = false
    fetchQuestions()
  } catch (error) {
    // 验证失败或请求失败
    console.error('[QuestionBankDetail] 保存题目失败:', error)
  } finally {
    questionModalLoading.value = false
  }
}

function handleQuestionModalCancel() {
  questionFormRef.value?.resetFields()
  questionModalVisible.value = false
}

async function handleDeleteQuestion(record: Question) {
  try {
    await deleteQuestion(record.id)
    message.success('题目已删除')
    fetchQuestions()
  } catch (error) {
    message.error('删除题目失败')
    console.error('[QuestionBankDetail] 删除题目失败:', error)
  }
}

// ── 导入功能 ──
const importModalVisible = ref(false)
const importLoading = ref(false)
const importFileList = ref<any[]>([])

function showImportModal() {
  importFileList.value = []
  importModalVisible.value = true
}

function beforeUpload(file: File) {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel' ||
                  file.name.endsWith('.csv')
  if (!isExcel) {
    message.error('只支持 Excel 或 CSV 文件!')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    message.error('文件大小不能超过 10MB!')
    return false
  }
  return false // 阻止自动上传
}

async function handleImport() {
  if (importFileList.value.length === 0) {
    message.warning('请选择要导入的文件')
    return
  }
  
  importLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', importFileList.value[0].originFileObj)
    formData.append('bank_id', bankId.toString())
    await batchImportQuestions(formData)
    message.success('题目导入成功')
    importModalVisible.value = false
    fetchQuestions()
  } catch (error) {
    message.error('导入题目失败')
    console.error('[QuestionBankDetail] 导入题目失败:', error)
  } finally {
    importLoading.value = false
  }
}

// ── 返回上一页 ──
function goBack() {
  router.push('/teacher/question-banks')
}

// ── 生命周期 ──
onMounted(() => {
  fetchBankInfo()
  fetchQuestions()
})
</script>

<style scoped lang="less">
.question-bank-detail {
  max-width: 1200px;
  margin: 0 auto;
}

.info-card {
  margin-top: 16px;
}

.stats-row {
  .stat-item {
    text-align: center;
    padding: 16px;
    background: #f6ffed;
    border-radius: 8px;
    
    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #52c41a;
    }
    
    .stat-label {
      margin-top: 4px;
      color: #666;
    }
  }
}

.filter-card {
  margin-top: 16px;
}

.table-card {
  margin-top: 16px;
}

.question-content {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analysis-image-upload {
  .upload-hint {
    margin-top: 8px;
    font-size: 12px;
    color: #888;
  }

  :deep(.ant-upload-list-picture-card) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
