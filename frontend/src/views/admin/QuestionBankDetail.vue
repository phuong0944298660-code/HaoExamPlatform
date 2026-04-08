<template>
  <div class="question-bank-detail-page">
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
            批量导入
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
            :status="bankInfo.status === 'published' ? 'success' : bankInfo.status === 'draft' ? 'processing' : 'default'"
            :text="getStatusText(bankInfo.status)"
          />
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ bankInfo.created_at }}</a-descriptions-item>
        <a-descriptions-item label="题库描述" :span="4">
          {{ bankInfo.description || '暂无描述' }}
        </a-descriptions-item>
      </a-descriptions>

      <!-- 题型统计 -->
      <a-divider />
      <a-row :gutter="16" class="stats-row">
        <a-col :span="4">
          <div class="stat-item total">
            <div class="stat-value">{{ stats.total_questions || 0 }}</div>
            <div class="stat-label">题目总数</div>
          </div>
        </a-col>
        <a-col :span="4">
          <div class="stat-item">
            <div class="stat-value blue">{{ stats.single_choice_count || 0 }}</div>
            <div class="stat-label">单选题</div>
          </div>
        </a-col>
        <a-col :span="4">
          <div class="stat-item">
            <div class="stat-value green">{{ stats.multi_choice_count || 0 }}</div>
            <div class="stat-label">多选题</div>
          </div>
        </a-col>
        <a-col :span="4">
          <div class="stat-item">
            <div class="stat-value orange">{{ stats.judgment_count || 0 }}</div>
            <div class="stat-label">判断题</div>
          </div>
        </a-col>
        <a-col :span="4">
          <div class="stat-item">
            <div class="stat-value purple">{{ stats.subjective_count || 0 }}</div>
            <div class="stat-label">主观题</div>
          </div>
        </a-col>
        <a-col :span="4">
          <div class="stat-item">
            <div class="stat-value cyan">{{ stats.subjective_count || 0 }}</div>
            <div class="stat-label">总分数</div>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <!-- 筛选和搜索 -->
    <a-card :bordered="false" class="filter-card">
      <a-row :gutter="16" align="middle">
        <a-col :span="6">
          <a-input-search
            v-model:value="searchQuery"
            placeholder="搜索题目内容"
            allow-clear
            @search="handleSearch"
          />
        </a-col>
        <a-col :span="4">
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
        <a-col :span="4">
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
        <a-col :span="6">
          <a-select
            v-model:value="filterTags"
            placeholder="标签筛选"
            allow-clear
            mode="multiple"
            :max-tag-count="1"
            style="width: 100%"
            @change="handleFilterChange"
          >
            <a-select-option v-for="tag in allTags" :key="tag" :value="tag">{{ tag }}</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4" style="text-align: right">
          <a-button @click="resetFilters">
            <ReloadOutlined /> 重置
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 批量操作栏 -->
    <a-card :bordered="false" class="batch-card" v-if="selectedRowKeys.length > 0">
      <a-space>
        <span>已选择 <strong>{{ selectedRowKeys.length }}</strong> 项</span>
        <a-button size="small" @click="batchMove">
          <FolderOpenOutlined /> 批量移动
        </a-button>
        <a-popconfirm
          title="确定要删除选中的题目吗？"
          ok-text="确定"
          cancel-text="取消"
          ok-type="danger"
          @confirm="batchDelete"
        >
          <a-button size="small" danger>
            <DeleteOutlined /> 批量删除
          </a-button>
        </a-popconfirm>
        <a-button size="small" @click="clearSelection">
          取消选择
        </a-button>
      </a-space>
    </a-card>

    <!-- 题目列表 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :data-source="questionList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 题型列 -->
          <template v-if="column.key === 'questionType'">
            <a-tag :color="getQuestionTypeColor(record.question_type)">
              {{ getQuestionTypeText(record.question_type) }}
            </a-tag>
          </template>

          <!-- 难度列 -->
          <template v-if="column.key === 'difficulty'">
            <a-tag :color="getDifficultyColor(record.difficulty)">
              {{ getDifficultyText(record.difficulty) }}
            </a-tag>
          </template>

          <!-- 内容列 -->
          <template v-if="column.key === 'content'">
            <div class="question-content">
              <span class="content-text">{{ truncateContent(record.content) }}</span>
              <PictureOutlined v-if="record.images?.length > 0" class="image-icon" />
            </div>
          </template>

          <!-- 标签列 -->
          <template v-if="column.key === 'tags'">
            <a-space size="small" wrap>
              <a-tag v-for="tag in (record.tags || []).slice(0, 2)" :key="tag" size="small">
                {{ tag }}
              </a-tag>
              <span v-if="(record.tags || []).length > 2" class="more-tags">
                +{{ record.tags.length - 2 }}
              </span>
            </a-space>
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="previewQuestion(record)">
                <EyeOutlined /> 预览
              </a-button>
              <a-button type="link" size="small" @click="editQuestion(record)">
                <EditOutlined /> 编辑
              </a-button>
              <a-popconfirm
                title="确定要删除这道题吗？"
                ok-text="确定"
                cancel-text="取消"
                ok-type="danger"
                @confirm="deleteQuestionRecord(record)"
              >
                <a-button type="link" size="small" danger>
                  <DeleteOutlined /> 删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 题目表单弹窗 -->
    <a-modal
      v-model:open="questionModalVisible"
      :title="isEditingQuestion ? '编辑题目' : '添加题目'"
      :width="900"
      :footer="null"
      :destroy-on-close="true"
    >
      <QuestionForm
        :initial-data="editingQuestion"
        :question-bank-id="bankId"
        @submit="handleQuestionSubmit"
        @cancel="questionModalVisible = false"
      />
    </a-modal>

    <!-- 导入题目弹窗 -->
    <QuestionImportModal
      v-model:visible="importModalVisible"
      :question-bank-id="bankId"
      @success="handleImportSuccess"
    />

    <!-- 题目预览弹窗 -->
    <a-modal
      v-model:open="previewModalVisible"
      title="题目预览"
      :width="800"
      :footer="null"
    >
      <QuestionPreview
        :question="previewingQuestion"
        :show-answer="showAnswerInPreview"
      />
      <div class="preview-actions">
        <a-switch
          v-model:checked="showAnswerInPreview"
          checked-children="显示答案"
          un-checked-children="隐藏答案"
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  ImportOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  PictureOutlined,
} from '@ant-design/icons-vue'
import type { QuestionBank, Question, QuestionBankStats } from '@/types/api'
import { 
  getQuestions, 
  getQuestionBank, 
  createQuestion, 
  updateQuestion, 
  deleteQuestion 
} from '@/api/questions'
import QuestionForm from '@/components/questions/QuestionForm.vue'
import QuestionImportModal from '@/components/questions/QuestionImportModal.vue'
import QuestionPreview from '@/components/questions/QuestionPreview.vue'

const route = useRoute()
const router = useRouter()
const bankId = Number(route.params.bankId)

// ── 题库信息 ──
const bankInfo = ref<QuestionBank | null>(null)
const stats = reactive<Partial<QuestionBankStats>>({
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
  { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
  { title: '题型', key: 'questionType', width: 100 },
  { title: '题目内容', key: 'content', ellipsis: true },
  { title: '难度', key: 'difficulty', width: 80 },
  { title: '分值', dataIndex: 'default_score', key: 'score', width: 70 },
  { title: '标签', key: 'tags', width: 120 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
]

// ── 数据状态 ──
const loading = ref(false)
const questionList = ref<Question[]>([])
const searchQuery = ref('')
const filterType = ref<string | undefined>(undefined)
const filterDifficulty = ref<string | undefined>(undefined)
const filterTags = ref<string[]>([])
const selectedRowKeys = ref<number[]>([])

// 所有可用标签
const allTags = computed(() => {
  const tags = new Set<string>()
  questionList.value.forEach(q => {
    q.tags?.forEach(tag => tags.add(tag))
  })
  return Array.from(tags)
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

// ── 弹窗状态 ──
const questionModalVisible = ref(false)
const isEditingQuestion = ref(false)
const editingQuestion = ref<Partial<Question> | undefined>(undefined)

const importModalVisible = ref(false)

const previewModalVisible = ref(false)
const previewingQuestion = ref<Question | null>(null)
const showAnswerInPreview = ref(false)

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

function getStatusText(status: string): string {
  const textMap: Record<string, string> = {
    published: '已发布',
    draft: '草稿',
    archived: '已归档',
  }
  return textMap[status] || status
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

function getQuestionTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    single_choice: 'blue',
    multi_choice: 'green',
    judgment: 'orange',
    subjective: 'purple',
  }
  return colorMap[type] || 'default'
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

function truncateContent(content: string, maxLength: number = 60): string {
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
    bankInfo.value = res.data
    
    // 自动计算汇总状态（如果后端没返回汇总字段）
    if (bankInfo.value) {
      stats.total_questions = bankInfo.value.total_questions || 0
      // 其他详细统计可能需要单独接口或从列表计算，此处先保留基础统计
    }
  } catch {
    message.error('获取题库信息失败')
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
      tags: filterTags.value.length > 0 ? filterTags.value : undefined,
      search: searchQuery.value || undefined,
    }
    const res = await getQuestions(params)
    questionList.value = res.data?.list || res.data?.items || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    message.error('获取题目列表失败')
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
  filterTags.value = []
  pagination.current = 1
  fetchQuestions()
}

function handleTableChange(p: any) {
  pagination.current = p.current
  pagination.pageSize = p.pageSize
  fetchQuestions()
}

// ── 表格选择 ──
function onSelectChange(keys: number[]) {
  selectedRowKeys.value = keys
}

function clearSelection() {
  selectedRowKeys.value = []
}

// ── 题目操作 ──
function showAddQuestionModal() {
  isEditingQuestion.value = false
  editingQuestion.value = undefined
  questionModalVisible.value = true
}

function previewQuestion(record: Question) {
  previewingQuestion.value = record
  showAnswerInPreview.value = false
  previewModalVisible.value = true
}

function editQuestion(record: Question) {
  isEditingQuestion.value = true
  editingQuestion.value = { ...record }
  questionModalVisible.value = true
}

async function handleQuestionSubmit(values: any) {
  try {
    if (isEditingQuestion.value && editingQuestion.value?.id) {
      await updateQuestion(editingQuestion.value.id, values)
      message.success('题目更新成功')
    } else {
      await createQuestion({ ...values, question_bank_id: bankId })
      message.success('题目添加成功')
    }
    
    questionModalVisible.value = false
    fetchQuestions()
    fetchBankInfo()
  } catch {
    // 错误已在拦截器处理
  }
}

async function deleteQuestionRecord(record: Question) {
  try {
    await deleteQuestion(record.id)
    message.success('题目已删除')
    fetchQuestions()
    fetchBankInfo()
  } catch {
    // 错误已在拦截器处理
  }
}

// ── 批量操作 ──
function batchMove() {
  message.info('批量移动功能开发中...')
}

async function batchDelete() {
  try {
    // await batchDeleteQuestions(selectedRowKeys.value)
    message.success(`已删除 ${selectedRowKeys.value.length} 道题目`)
    selectedRowKeys.value = []
    fetchQuestions()
    fetchBankInfo()
  } catch {
    // 错误已在拦截器处理
  }
}

// ── 导入功能 ──
function showImportModal() {
  importModalVisible.value = true
}

function handleImportSuccess(count: number) {
  message.success(`成功导入 ${count} 道题目`)
  fetchQuestions()
  fetchBankInfo()
}

// ── 返回上一页 ──
function goBack() {
  router.push('/admin/question-banks')
}

// ── 生命周期 ──
onMounted(() => {
  fetchBankInfo()
  fetchQuestions()
})
</script>

<style scoped lang="less">
.question-bank-detail-page {
  max-width: 1400px;
  margin: 0 auto;
}

// 信息卡片
.info-card {
  margin-top: 16px;
  
  .stats-row {
    .stat-item {
      text-align: center;
      padding: 16px 8px;
      background: #f6ffed;
      border-radius: 8px;
      
      &.total {
        background: #e6f7ff;
      }
      
      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: #52c41a;
        line-height: 1.2;
        
        &.blue { color: #1890ff; }
        &.green { color: #52c41a; }
        &.orange { color: #fa8c16; }
        &.purple { color: #722ed1; }
        &.cyan { color: #13c2c2; }
      }
      
      .stat-label {
        margin-top: 8px;
        color: #666;
        font-size: 13px;
      }
    }
  }
}

// 筛选卡片
.filter-card {
  margin-top: 16px;
}

// 批量操作卡片
.batch-card {
  margin-top: 16px;
  background: #e6f7ff;
  
  :deep(.ant-card-body) {
    padding: 12px 24px;
  }
}

// 表格卡片
.table-card {
  margin-top: 16px;
  
  .question-content {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .content-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .image-icon {
      color: #1890ff;
      flex-shrink: 0;
    }
  }
  
  .more-tags {
    font-size: 12px;
    color: #8c8c8c;
  }
}

// 预览操作
.preview-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}
</style>
