<template>
  <div class="papers-page">
    <!-- 页面标题 -->
    <a-page-header title="套卷管理" sub-title="创建和管理考试套卷">
      <template #extra>
        <a-button type="primary" @click="showCreateModal">
          <template #icon><PlusOutlined /></template>
          创建套卷
        </a-button>
      </template>
    </a-page-header>

    <!-- 搜索和筛选区域 -->
    <a-card :bordered="false" class="filter-card">
      <a-row :gutter="16" align="middle">
        <a-col :span="10">
          <a-input-search
            v-model:value="searchQuery"
            placeholder="搜索套卷名称"
            allow-clear
            @search="handleSearch"
          />
        </a-col>
        <a-col :span="6">
          <a-select
            v-model:value="filterStatus"
            placeholder="状态筛选"
            allow-clear
            style="width: 100%"
            @change="handleFilterChange"
          >
            <a-select-option value="draft">草稿</a-select-option>
            <a-select-option value="published">已发布</a-select-option>
            <a-select-option value="archived">已归档</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="8" style="text-align: right">
          <a-button @click="resetFilters">重置筛选</a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 套卷列表表格 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :data-source="paperList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 状态列 -->
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>

          <!-- 考试时长列 -->
          <template v-if="column.key === 'duration'">
            {{ record.duration }} 分钟
          </template>

          <!-- 创建时间列 -->
          <template v-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt || record.created_at) }}
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="editPaper(record)">
                编辑
              </a-button>
              <a-button type="link" size="small" @click="previewPaper(record)">
                预览
              </a-button>
              <a-dropdown>
                <a-button type="link" size="small">
                  更多 <DownOutlined />
                </a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item v-if="record.status?.toLowerCase() === 'draft'" @click="handlePublishPaper(record)">
                      <CheckCircleOutlined /> 发布
                    </a-menu-item>
                    <a-menu-item v-if="record.status?.toLowerCase() === 'published'" @click="handleArchivePaper(record)">
                      <FolderOutlined /> 归档
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item danger @click="confirmDelete(record)">
                      <DeleteOutlined /> 删除
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 创建套卷弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      title="创建套卷"
      ok-text="创建"
      cancel-text="取消"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
      >
        <a-form-item label="套卷名称" name="name">
          <a-input
            v-model:value="formData.name"
            placeholder="请输入套卷名称"
            maxlength="50"
            show-count
          />
        </a-form-item>
        <a-form-item label="适用学段" name="grade_group">
          <a-select v-model:value="formData.grade_group" placeholder="请选择学段">
            <a-select-option value="primary">小学</a-select-option>
            <a-select-option value="junior">初中</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="关联题库" name="question_bank_id">
          <a-select v-model:value="formData.question_bank_id" placeholder="请选择题库" :options="questionBanks.map(b => ({ label: b.name, value: b.id }))" />
        </a-form-item>
        <a-form-item label="考试时长（分钟）" name="duration">
          <a-input-number
            v-model:value="formData.duration"
            :min="10"
            :max="300"
            style="width: 100%"
            placeholder="请输入考试时长"
          />
        </a-form-item>
        <a-form-item label="套卷描述" name="description">
          <a-textarea
            v-model:value="formData.description"
            placeholder="请输入套卷描述（选填）"
            :rows="3"
            maxlength="200"
            show-count
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 预览套卷弹窗 - 沉浸式三栏布局 -->
    <a-modal
      v-model:open="previewVisible"
      title="套卷预览 - 模拟考试界面"
      width="95%"
      :footer="null"
      :closable="false"
      :maskClosable="false"
      wrapClassName="paper-preview-modal"
      @cancel="previewVisible = false"
    >
      <a-spin :spinning="previewLoading">
        <div v-if="previewData" class="paper-preview-exam">
          <a-row :gutter="12" class="preview-container">
            <!-- 左侧：题型导航 -->
            <a-col :span="5" class="preview-left-panel">
              <div class="panel-header">答题卡</div>
              <div class="panel-content">
                <!-- 单选题区域 -->
                <div class="type-section" v-if="singleChoiceQuestions.length > 0">
                  <div class="type-title">单选题</div>
                  <div class="type-stats">共 {{ singleChoiceQuestions.length }} 题，共 {{ getTypeTotalScore(singleChoiceQuestions) }} 分</div>
                  <div class="question-numbers">
                    <span
                      v-for="(q, idx) in singleChoiceQuestions"
                      :key="q.question_id"
                      :class="['q-num', { 'active': getQuestionIndex(q.question_id) === previewCurrentIndex }]"
                      @click="goToQuestion(getQuestionIndex(q.question_id))"
                    >
                      {{ getQuestionIndex(q.question_id) + 1 }}
                    </span>
                  </div>
                </div>

                <!-- 多选题区域 -->
                <div class="type-section" v-if="multiChoiceQuestions.length > 0">
                  <div class="type-title">多选题</div>
                  <div class="type-stats">共 {{ multiChoiceQuestions.length }} 题，共 {{ getTypeTotalScore(multiChoiceQuestions) }} 分</div>
                  <div class="question-numbers">
                    <span
                      v-for="(q, idx) in multiChoiceQuestions"
                      :key="q.question_id"
                      :class="['q-num', { 'active': getQuestionIndex(q.question_id) === previewCurrentIndex }]"
                      @click="goToQuestion(getQuestionIndex(q.question_id))"
                    >
                      {{ getQuestionIndex(q.question_id) + 1 }}
                    </span>
                  </div>
                </div>

                <!-- 判断题区域 -->
                <div class="type-section" v-if="judgmentQuestions.length > 0">
                  <div class="type-title">判断题</div>
                  <div class="type-stats">共 {{ judgmentQuestions.length }} 题，共 {{ getTypeTotalScore(judgmentQuestions) }} 分</div>
                  <div class="question-numbers">
                    <span
                      v-for="(q, idx) in judgmentQuestions"
                      :key="q.question_id"
                      :class="['q-num', { 'active': getQuestionIndex(q.question_id) === previewCurrentIndex }]"
                      @click="goToQuestion(getQuestionIndex(q.question_id))"
                    >
                      {{ getQuestionIndex(q.question_id) + 1 }}
                    </span>
                  </div>
                </div>

                <!-- 主观题区域 -->
                <div class="type-section" v-if="subjectiveQuestions.length > 0">
                  <div class="type-title">主观题</div>
                  <div class="type-stats">共 {{ subjectiveQuestions.length }} 题，共 {{ getTypeTotalScore(subjectiveQuestions) }} 分</div>
                  <div class="question-numbers">
                    <span
                      v-for="(q, idx) in subjectiveQuestions"
                      :key="q.question_id"
                      :class="['q-num', { 'active': getQuestionIndex(q.question_id) === previewCurrentIndex }]"
                      @click="goToQuestion(getQuestionIndex(q.question_id))"
                    >
                      {{ getQuestionIndex(q.question_id) + 1 }}
                    </span>
                  </div>
                </div>
              </div>
            </a-col>

            <!-- 中间：题目内容 -->
            <a-col :span="14" class="preview-center-panel">
              <div class="panel-header">题目内容</div>
              <div class="panel-content question-display">
                <div v-if="previewCurrentQuestion" class="question-wrapper">
                  <!-- 题目标题 -->
                  <div class="question-title-bar">
                    <span class="q-index">第 {{ previewCurrentIndex + 1 }} 题</span>
                    <a-tag color="blue">{{ getQuestionTypeText(previewCurrentQuestion.question_type) }}</a-tag>
                    <span class="q-score">{{ previewCurrentQuestion.paper_score || previewCurrentQuestion.score || 0 }} 分</span>
                  </div>

                  <!-- 题目内容 -->
                  <div class="question-body">
                    <div class="q-content" v-html="previewCurrentQuestion.content"></div>

                    <!-- 选项展示（仅预览模式，不可选） -->
                    <div v-if="previewCurrentQuestion.options && previewCurrentQuestion.options.length > 0" class="options-display">
                      <div
                        v-for="opt in previewCurrentQuestion.options"
                        :key="opt.label"
                        class="option-row"
                        :class="{ 'correct': isCorrectOption(opt.label) }"
                      >
                        <span class="opt-label">{{ opt.label }}</span>
                        <span class="opt-content">{{ opt.content }}</span>
                        <CheckCircleFilled v-if="isCorrectOption(opt.label)" class="correct-icon" />
                      </div>
                    </div>

                    <!-- 判断题选项 -->
                    <div v-else-if="previewCurrentQuestion.question_type === 'judgment'" class="options-display">
                      <div class="option-row" :class="{ 'correct': previewCurrentQuestion.correct_answer === 'T' }">
                        <span class="opt-label">✓</span>
                        <span class="opt-content">正确</span>
                        <CheckCircleFilled v-if="previewCurrentQuestion.correct_answer === 'T'" class="correct-icon" />
                      </div>
                      <div class="option-row" :class="{ 'correct': previewCurrentQuestion.correct_answer === 'F' }">
                        <span class="opt-label">✗</span>
                        <span class="opt-content">错误</span>
                        <CheckCircleFilled v-if="previewCurrentQuestion.correct_answer === 'F'" class="correct-icon" />
                      </div>
                    </div>

                    <!-- 主观题提示 -->
                    <div v-else-if="previewCurrentQuestion.question_type === 'subjective'" class="subjective-hint">
                      <a-textarea
                        :rows="6"
                        placeholder="主观题答题区域（预览模式下不可编辑）"
                        disabled
                      />
                    </div>
                  </div>

                  <!-- 答案解析 -->
                  <div class="answer-section" v-if="previewCurrentQuestion.correct_answer">
                    <div class="answer-title">
                      <CheckCircleFilled /> 正确答案：{{ previewCurrentQuestion.correct_answer }}
                    </div>
                    <div v-if="previewCurrentQuestion.answer_analysis" class="analysis-content">
                      <strong>解析：</strong>{{ previewCurrentQuestion.answer_analysis }}
                    </div>
                  </div>

                  <!-- 底部导航 -->
                  <div class="preview-nav">
                    <a-button :disabled="previewCurrentIndex <= 0" @click="prevPreviewQuestion">
                      <LeftOutlined /> 上一题
                    </a-button>
                    <span class="nav-info">{{ previewCurrentIndex + 1 }} / {{ previewData.questions.length }}</span>
                    <a-button :disabled="previewCurrentIndex >= previewData.questions.length - 1" @click="nextPreviewQuestion">
                      下一题 <RightOutlined />
                    </a-button>
                  </div>
                </div>
              </div>
            </a-col>

            <!-- 右侧：试卷信息 -->
            <a-col :span="5" class="preview-right-panel">
              <div class="panel-header">试卷信息</div>
              <div class="panel-content">
                <div class="info-section">
                  <h3 class="paper-name">{{ previewData.name }}</h3>
                  <a-divider />
                  <div class="info-row">
                    <span class="info-label">总分</span>
                    <span class="info-value">{{ previewData.total_score }} 分</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">时长</span>
                    <span class="info-value">{{ previewData.duration }} 分钟</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">题数</span>
                    <span class="info-value">{{ previewData.total_questions }} 题</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">学段</span>
                    <span class="info-value">
                      <a-tag size="small" :color="(previewData.gradeGroup || previewData.grade_group) === 'primary' ? 'green' : 'blue'">
                        {{ (previewData.gradeGroup || previewData.grade_group) === 'primary' ? '小学' : '初中' }}
                      </a-tag>
                    </span>
                  </div>
                  <a-divider />
                  <div class="info-row">
                    <span class="info-label">当前题号</span>
                    <span class="info-value highlight">第 {{ previewCurrentIndex + 1 }} 题</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">本题分值</span>
                    <span class="info-value highlight">{{ previewCurrentQuestion?.paper_score || previewCurrentQuestion?.score || 0 }} 分</span>
                  </div>
                </div>

                <!-- 退出预览按钮 -->
                <a-button
                  type="primary"
                  block
                  size="large"
                  @click="previewVisible = false"
                  class="exit-preview-btn"
                >
                  <CloseOutlined />
                  退出预览
                </a-button>
              </div>
            </a-col>
          </a-row>
        </div>
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { 
  PlusOutlined, 
  DownOutlined, 
  CheckCircleOutlined, 
  FolderOutlined, 
  DeleteOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleFilled,
  CloseOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { getPapers, createPaper, deletePaper, publishPaper, archivePaper, previewPaper as getPaperPreview } from '@/api/papers'
import { getQuestionBanks } from '@/api/questions'
import type { Paper } from '@/types/api'

const router = useRouter()

// ── 表格列定义 ──
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '套卷名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '总分', dataIndex: 'total_score', key: 'totalScore', width: 100 },
  { title: '考试时长', key: 'duration', width: 120 },
  { title: '题目数量', dataIndex: 'total_questions', key: 'questionCount', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'created_at', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
]

// ── 数据状态 ──
const loading = ref(false)
const paperList = ref<Paper[]>([])
const searchQuery = ref('')
const filterStatus = ref<string | undefined>(undefined)

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

// ── 弹窗状态 ──
const modalVisible = ref(false)
const modalLoading = ref(false)
const formRef = ref<FormInstance>()

// ── 预览弹窗状态 ──
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewData = ref<any>(null)
const previewCurrentIndex = ref(0)

// 按题型分组的题目
const singleChoiceQuestions = computed(() => previewData.value?.questions?.filter((q: any) => q.question_type === 'single_choice') || [])
const multiChoiceQuestions = computed(() => previewData.value?.questions?.filter((q: any) => q.question_type === 'multi_choice') || [])
const judgmentQuestions = computed(() => previewData.value?.questions?.filter((q: any) => q.question_type === 'judgment') || [])
const subjectiveQuestions = computed(() => previewData.value?.questions?.filter((q: any) => q.question_type === 'subjective') || [])

// 当前预览的题目
const previewCurrentQuestion = computed(() => previewData.value?.questions?.[previewCurrentIndex.value])

const formData = reactive({
  name: '',
  grade_group: undefined as string | undefined,
  question_bank_id: undefined as number | undefined,
  duration: 90,
  description: '',
})

const questionBanks = ref<{ id: number; name: string }[]>([])

const formRules = {
  name: [{ required: true, message: '请输入套卷名称', trigger: 'blur' }],
  grade_group: [{ required: true, message: '请选择学段', trigger: 'change' }],
  question_bank_id: [{ required: true, message: '请选择题库', trigger: 'change' }],
  duration: [{ required: true, message: '请输入考试时长', trigger: 'blur' }],
}

// ── 工具函数 ──
function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    draft: 'default',
    published: 'green',
    archived: 'gray',
  }
  return colorMap[status?.toLowerCase()] || 'default'
}

function getStatusText(status: string): string {
  const textMap: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档',
  }
  return textMap[status?.toLowerCase()] || status
}

function getQuestionTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    single_choice: '单选题',
    multi_choice: '多选题',
    judgment: '判断题',
    fill_blank: '填空题',
    subjective: '主观题',
  }
  return typeMap[type] || type
}

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// ── 数据加载 ──
async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      size: pagination.pageSize,
      search: searchQuery.value || undefined,
      status: filterStatus.value,
    }
    const res = await getPapers(params)
    paperList.value = res.data?.list || res.data?.items || []
    pagination.total = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

// ── 搜索和筛选 ──
function handleSearch() {
  pagination.current = 1
  fetchData()
}

function handleFilterChange() {
  pagination.current = 1
  fetchData()
}

function resetFilters() {
  searchQuery.value = ''
  filterStatus.value = undefined
  pagination.current = 1
  fetchData()
}

function handleTableChange(p: any) {
  pagination.current = p.current
  pagination.pageSize = p.pageSize
  fetchData()
}

// ── 弹窗操作 ──
async function showCreateModal() {
  formData.name = ''
  formData.grade_group = undefined
  formData.question_bank_id = undefined
  formData.duration = 90
  formData.description = ''
  
  // 加载题库列表
  try {
    const res = await getQuestionBanks({ page: 1, size: 100 })
    questionBanks.value = res.data?.list || res.data?.items || []
  } catch {
    // 错误已在拦截器处理
  }
  
  modalVisible.value = true
}

async function handleModalOk() {
  try {
    await formRef.value?.validate()
    modalLoading.value = true
    
    const res = await createPaper(formData)
    message.success('套卷创建成功')
    modalVisible.value = false
    
    // 跳转到套卷编辑页面
    router.push(`/teacher/papers/${res.data.id}`)
  } catch (error) {
    // 验证失败或请求失败
  } finally {
    modalLoading.value = false
  }
}

function handleModalCancel() {
  formRef.value?.resetFields()
  modalVisible.value = false
}

// ── 套卷操作 ──
function editPaper(record: Paper) {
  router.push(`/teacher/papers/${record.id}`)
}

async function previewPaper(record: Paper) {
  previewVisible.value = true
  previewLoading.value = true
  previewData.value = null
  previewCurrentIndex.value = 0
  
  try {
    const res = await getPaperPreview(record.id)
    previewData.value = res.data
  } catch (error) {
    message.error('获取套卷预览失败')
    previewVisible.value = false
  } finally {
    previewLoading.value = false
  }
}

// 获取题目在总列表中的索引
function getQuestionIndex(questionId: number): number {
  return previewData.value?.questions?.findIndex((q: any) => q.question_id === questionId) || 0
}

// 跳转到指定题目
function goToQuestion(index: number) {
  previewCurrentIndex.value = index
}

// 上一题
function prevPreviewQuestion() {
  if (previewCurrentIndex.value > 0) {
    previewCurrentIndex.value--
  }
}

// 下一题
function nextPreviewQuestion() {
  if (previewCurrentIndex.value < (previewData.value?.questions?.length || 0) - 1) {
    previewCurrentIndex.value++
  }
}

// 获取某类题目的总分
function getTypeTotalScore(questions: any[]): number {
  return questions.reduce((sum, q) => sum + (q.paper_score || q.score || 0), 0)
}

// 判断是否为正确答案
function isCorrectOption(label: string): boolean {
  const correct = previewCurrentQuestion.value?.correct_answer
  if (!correct) return false
  return correct.includes(label)
}

async function handlePublishPaper(record: Paper) {
  try {
    await publishPaper(record.id)
    message.success('套卷已发布')
    fetchData()
  } catch {
    // 错误已在拦截器处理
  }
}

async function handleArchivePaper(record: Paper) {
  try {
    await archivePaper(record.id)
    message.success('套卷已归档')
    fetchData()
  } catch {
    // 错误已在拦截器处理
  }
}

function confirmDelete(record: Paper) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除套卷 "${record.name}" 吗？此操作不可恢复！`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deletePaper(record.id)
        message.success('套卷已删除')
        fetchData()
      } catch {
        // 错误已在拦截器处理
      }
    },
  })
}

// ── 生命周期 ──
onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="less">
.papers-page {
  max-width: 1200px;
  margin: 0 auto;
}

.filter-card {
  margin-top: 16px;
}

.table-card {
  margin-top: 16px;
}

/* 沉浸式预览弹窗样式 - 类似考试作答界面 */
.paper-preview-modal {
  .ant-modal-content {
    height: 85vh;
    display: flex;
    flex-direction: column;
  }
  
  .ant-modal-body {
    flex: 1;
    overflow: hidden;
    padding: 0;
  }
}

.paper-preview-exam {
  height: 100%;
  background: #f5f5f5;
}

.preview-container {
  height: 100%;
  margin: 0 !important;
  
  .ant-col {
    height: 100%;
  }
}

.preview-left-panel,
.preview-center-panel,
.preview-right-panel {
  display: flex;
  flex-direction: column;
  background: #fff;
  height: 100%;
}

.panel-header {
  padding: 12px 16px;
  background: #1890ff;
  color: #fff;
  font-weight: bold;
  font-size: 15px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 左侧题型导航 */
.type-section {
  margin-bottom: 20px;
  
  .type-title {
    font-size: 15px;
    font-weight: bold;
    color: #1890ff;
    margin-bottom: 4px;
  }
  
  .type-stats {
    font-size: 12px;
    color: #999;
    margin-bottom: 10px;
  }
  
  .question-numbers {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    .q-num {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.3s;
      
      &:hover {
        border-color: #1890ff;
        color: #1890ff;
      }
      
      &.active {
        background: #ff4d4f;
        color: #fff;
        border-color: #ff4d4f;
        font-weight: bold;
      }
    }
  }
}

/* 中间题目显示区域 */
.question-display {
  padding: 20px;
}

.question-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.question-title-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  
  .q-index {
    font-size: 18px;
    font-weight: bold;
    color: #1890ff;
  }
  
  .q-score {
    margin-left: auto;
    color: #f5222d;
    font-weight: bold;
    font-size: 15px;
  }
}

.question-body {
  .q-content {
    font-size: 16px;
    line-height: 1.8;
    margin-bottom: 24px;
  }
}

.options-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  
  .option-row {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    background: #fafafa;
    transition: all 0.3s;
    position: relative;
    
    &:hover {
      border-color: #1890ff;
      background: #f6ffed;
    }
    
    &.correct {
      background: #f6ffed;
      border-color: #52c41a;
      
      .opt-label {
        background: #52c41a;
        color: #fff;
      }
    }
    
    .opt-label {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
      border-radius: 50%;
      margin-right: 12px;
      font-weight: bold;
      font-size: 13px;
      flex-shrink: 0;
    }
    
    .opt-content {
      flex: 1;
      font-size: 15px;
    }
    
    .correct-icon {
      color: #52c41a;
      font-size: 20px;
    }
  }
}

.subjective-hint {
  margin-bottom: 24px;
}

.answer-section {
  margin-top: 24px;
  padding: 16px;
  background: #f6ffed;
  border-radius: 8px;
  border: 1px solid #b7eb8f;
  
  .answer-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #52c41a;
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 12px;
  }
  
  .analysis-content {
    color: #666;
    line-height: 1.8;
  }
}

.preview-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  
  .nav-info {
    color: #999;
    font-size: 14px;
  }
}

/* 右侧信息面板 */
.info-section {
  .paper-name {
    font-size: 16px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 8px;
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 12px 0;
    
    .info-label {
      color: #666;
      font-size: 14px;
    }
    
    .info-value {
      font-size: 14px;
      font-weight: 500;
      
      &.highlight {
        color: #1890ff;
        font-weight: bold;
        font-size: 16px;
      }
    }
  }
}

.exit-preview-btn {
  margin-top: 24px;
  background: #ff4d4f;
  border-color: #ff4d4f;
  
  &:hover {
    background: #ff7875;
    border-color: #ff7875;
  }
}
</style>
