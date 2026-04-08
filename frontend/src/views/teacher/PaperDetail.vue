<template>
  <div class="paper-detail-page">
    <!-- 页面标题 -->
    <a-page-header
      :title="isEditing ? '编辑套卷' : '创建套卷'"
      sub-title="编辑套卷结构和题目"
      @back="goBack"
    >
      <template #extra>
        <a-space>
          <a-button @click="saveDraft">保存草稿</a-button>
          <a-button type="primary" @click="publishPaper">发布套卷</a-button>
        </a-space>
      </template>
    </a-page-header>

    <!-- 套卷基本信息 -->
    <a-card :bordered="false" class="info-card">
      <a-form
        ref="infoFormRef"
        :model="paperInfo"
        :rules="infoRules"
        layout="inline"
      >
        <a-form-item label="套卷名称" name="name" style="width: 300px">
          <a-input v-model:value="paperInfo.name" placeholder="请输入套卷名称" />
        </a-form-item>
        <a-form-item label="考试时长" name="duration">
          <a-input-number
            v-model:value="paperInfo.duration"
            :min="10"
            :max="300"
            addon-after="分钟"
          />
        </a-form-item>
        <a-form-item label="总分">
          <span class="score-display">{{ totalScore }} 分</span>
        </a-form-item>
        <a-form-item label="题目数量">
          <span class="count-display">{{ selectedQuestions.length }} 题</span>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 左右分栏布局 -->
    <a-row :gutter="16" class="content-row">
      <!-- 左侧：题目选择区 -->
      <a-col :span="11">
        <a-card :bordered="false" class="left-card" title="题目库">
          <template #extra>
            <a-input-search
              v-model:value="searchQuery"
              placeholder="搜索题目"
              allow-clear
              style="width: 200px"
              @search="handleSearch"
            />
          </template>

          <!-- 题库筛选 -->
          <a-form layout="inline" class="filter-form">
            <a-form-item label="选择题库">
              <a-select
                v-model:value="selectedBankId"
                placeholder="选择题库"
                allow-clear
                style="width: 180px"
                @change="handleBankChange"
              >
                <a-select-option 
                  v-for="bank in questionBanks" 
                  :key="bank.id" 
                  :value="bank.id"
                >
                  {{ bank.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-select
                v-model:value="filterType"
                placeholder="题型"
                allow-clear
                style="width: 120px"
                @change="handleFilterChange"
              >
                <a-select-option value="single_choice">单选题</a-select-option>
                <a-select-option value="multi_choice">多选题</a-select-option>
                <a-select-option value="judgment">判断题</a-select-option>
                <a-select-option value="subjective">主观题</a-select-option>
              </a-select>
            </a-form-item>
          </a-form>

          <!-- 题目列表 -->
          <div class="question-list">
            <a-spin :spinning="questionsLoading">
              <a-empty v-if="availableQuestions.length === 0" description="暂无题目" />
              <div
                v-for="q in availableQuestions"
                :key="q.id"
                class="question-item"
                :class="{ 'selected': isQuestionSelected(q.id) }"
              >
                <div class="question-header">
                  <a-space>
                    <a-tag size="small">{{ getQuestionTypeText(q.question_type) }}</a-tag>
                    <a-tag size="small" :color="getDifficultyColor(q.difficulty)">
                      {{ getDifficultyText(q.difficulty) }}
                    </a-tag>
                    <span class="question-score">{{ q.default_score }}分</span>
                  </a-space>
                </div>
                <div class="question-content" v-html="truncateContent(q.content, 60)"></div>
                <div class="question-footer">
                  <a-button 
                    type="primary" 
                    size="small"
                    :disabled="isQuestionSelected(q.id)"
                    @click="addQuestion(q)"
                  >
                    <PlusOutlined />
                    {{ isQuestionSelected(q.id) ? '已添加' : '添加' }}
                  </a-button>
                </div>
              </div>
            </a-spin>
          </div>

          <!-- 分页 -->
          <a-pagination
            v-if="questionPagination.total > 0"
            v-model:current="questionPagination.current"
            v-model:pageSize="questionPagination.pageSize"
            :total="questionPagination.total"
            :page-size-options="['5', '10', '20']"
            show-size-changer
            size="small"
            class="question-pagination"
            @change="fetchAvailableQuestions"
          />
        </a-card>
      </a-col>

      <!-- 中间：箭头区域 -->
      <a-col :span="2" class="arrow-col">
        <div class="arrow-container">
          <RightCircleOutlined class="arrow-icon" />
          <div class="arrow-text">添加到套卷</div>
        </div>
      </a-col>

      <!-- 右侧：套卷结构区 -->
      <a-col :span="11">
        <a-card :bordered="false" class="right-card" title="套卷结构">
          <template #extra>
            <a-button type="link" danger @click="clearAll" :disabled="selectedQuestions.length === 0">
              清空全部
            </a-button>
          </template>

          <div class="selected-questions">
            <a-empty v-if="selectedQuestions.length === 0" description="请从左侧选择题库和题目">
              <template #description>
                <span>请从左侧选择题库和题目<br />添加到套卷中</span>
              </template>
            </a-empty>

            <a-timeline v-else>
              <a-timeline-item
                v-for="(q, index) in selectedQuestions"
                :key="q.id"
                :color="getDifficultyColor(q.difficulty)"
              >
                <div class="selected-question-item">
                  <div class="question-index">第 {{ index + 1 }} 题</div>
                  <div class="question-info">
                    <a-space>
                      <a-tag size="small">{{ getQuestionTypeText(q.question_type) }}</a-tag>
                      <span class="question-content" v-html="truncateContent(q.content, 40)"></span>
                    </a-space>
                  </div>
                  <div class="question-actions">
                    <a-input-number
                      v-model:value="q.score"
                      :min="0.5"
                      :max="100"
                      :step="0.5"
                      size="small"
                      style="width: 80px"
                      @change="updateScore(q)"
                    />
                    <span class="score-unit">分</span>
                    <a-button
                      type="text"
                      size="small"
                      danger
                      @click="removeQuestion(index)"
                    >
                      <DeleteOutlined />
                    </a-button>
                  </div>
                </div>
              </a-timeline-item>
            </a-timeline>
          </div>

          <!-- 底部统计 -->
          <a-divider v-if="selectedQuestions.length > 0" />
          <div v-if="selectedQuestions.length > 0" class="paper-stats">
            <a-row :gutter="16">
              <a-col :span="8">
                <div class="stat-item">
                  <div class="stat-label">题目总数</div>
                  <div class="stat-value">{{ selectedQuestions.length }} 题</div>
                </div>
              </a-col>
              <a-col :span="8">
                <div class="stat-item">
                  <div class="stat-label">当前总分</div>
                  <div class="stat-value highlight">{{ totalScore }} 分</div>
                </div>
              </a-col>
              <a-col :span="8">
                <div class="stat-item">
                  <div class="stat-label">预计时长</div>
                  <div class="stat-value">{{ paperInfo.duration }} 分钟</div>
                </div>
              </a-col>
            </a-row>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined, RightCircleOutlined } from '@ant-design/icons-vue'
import { getPaper, createPaper, updatePaper, publishPaper as publishPaperApi } from '@/api/papers'
import { getQuestionBanks, getQuestions } from '@/api/questions'
import type { Paper, QuestionBank, Question } from '@/types/api'

const route = useRoute()
const router = useRouter()
const paperId = route.params.paperId as string
const isEditing = !!paperId && paperId !== 'new'

// ── 套卷基本信息 ──
const infoFormRef = ref<FormInstance>()
const paperInfo = reactive({
  name: '',
  duration: 90,
  description: '',
})

const infoRules = {
  name: [{ required: true, message: '请输入套卷名称', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入考试时长', trigger: 'blur' }],
}

// ── 已选题目列表 ──
interface SelectedQuestion extends Question {
  score: number
}

const selectedQuestions = ref<SelectedQuestion[]>([])

// 计算总分
const totalScore = computed(() => {
  return selectedQuestions.value.reduce((sum, q) => sum + (q.score || 0), 0)
})

// ── 左侧：题目库 ──
const questionBanks = ref<QuestionBank[]>([])
const selectedBankId = ref<number | undefined>(undefined)
const filterType = ref<string | undefined>(undefined)
const searchQuery = ref('')
const questionsLoading = ref(false)
const availableQuestions = ref<Question[]>([])

const questionPagination = reactive({
  current: 1,
  pageSize: 5,
  total: 0,
})

// ── 工具函数 ──
function getQuestionTypeText(type: string): string {
  const textMap: Record<string, string> = {
    single_choice: '单选',
    multi_choice: '多选',
    judgment: '判断',
    subjective: '主观',
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
    easy: '简',
    medium: '中',
    hard: '难',
  }
  return textMap[difficulty] || difficulty
}

function truncateContent(content: string, maxLength: number = 50): string {
  if (!content) return ''
  const text = content.replace(/<[^>]+>/g, '')
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function isQuestionSelected(questionId: number): boolean {
  return selectedQuestions.value.some(q => q.id === questionId)
}

// ── 数据加载 ──
async function fetchPaperInfo() {
  if (!isEditing) return
  
  try {
    // const res = await getPaper(Number(paperId))
    // const data = res.data as Paper
    // paperInfo.name = data.name
    // paperInfo.duration = data.duration || 90
    // paperInfo.description = data.description || ''
    
    // 模拟数据
    paperInfo.name = '2024年春季期中数学考试'
    paperInfo.duration = 120
    paperInfo.description = '初中数学期中考试'
  } catch {
    message.error('获取套卷信息失败')
  }
}

async function fetchQuestionBanks() {
  try {
    const res = await getQuestionBanks({ page: 1, size: 100 })
    questionBanks.value = res.data?.list || res.data?.items || []
  } catch {
    // 错误已在拦截器处理
  }
}

async function fetchAvailableQuestions() {
  if (!selectedBankId.value) {
    availableQuestions.value = []
    return
  }
  
  questionsLoading.value = true
  try {
    const params = {
      page: questionPagination.current,
      size: questionPagination.pageSize,
      bank_id: selectedBankId.value,
      question_type: filterType.value || undefined,
      search: searchQuery.value || undefined,
    }
    const res = await getQuestions(params)
    availableQuestions.value = res.data?.list || res.data?.items || []
    questionPagination.total = res.data?.total || 0
  } finally {
    questionsLoading.value = false
  }
}

// ── 搜索和筛选 ──
function handleSearch() {
  questionPagination.current = 1
  fetchAvailableQuestions()
}

function handleBankChange() {
  questionPagination.current = 1
  fetchAvailableQuestions()
}

function handleFilterChange() {
  questionPagination.current = 1
  fetchAvailableQuestions()
}

// ── 题目操作 ──
function addQuestion(question: Question) {
  if (isQuestionSelected(question.id)) {
    message.warning('该题目已添加')
    return
  }
  
  selectedQuestions.value.push({
    ...question,
    score: question.default_score,
  })
  message.success('题目已添加')
}

function removeQuestion(index: number) {
  selectedQuestions.value.splice(index, 1)
  message.success('题目已移除')
}

function clearAll() {
  selectedQuestions.value = []
  message.success('已清空所有题目')
}

function updateScore(question: SelectedQuestion) {
  // 可以在这里添加实时保存到后端的逻辑
}

// ── 保存和发布 ──
async function saveDraft() {
  try {
    await infoFormRef.value?.validate()
    
    const data = {
      ...paperInfo,
      questions: selectedQuestions.value.map((q, index) => ({
        question_id: q.id,
        order: index + 1,
        score: q.score,
      })),
    }
    
    if (isEditing) {
      await updatePaper(Number(paperId), data)
      message.success('草稿已保存')
    } else {
      // 创建新套卷
      const res = await createPaper(data)
      message.success('套卷创建成功')
      // 跳转到编辑页面
      router.push(`/teacher/papers/${res.data.id}`)
    }
  } catch (error) {
    // 验证失败
  }
}

async function publishPaper() {
  try {
    await infoFormRef.value?.validate()
    
    if (selectedQuestions.value.length === 0) {
      message.warning('请至少添加一道题目')
      return
    }
    
    await publishPaperApi(Number(paperId))
    message.success('套卷已发布')
    router.push('/teacher/papers')
  } catch (error) {
    // 验证失败
  }
}

// ── 返回上一页 ──
function goBack() {
  router.push('/teacher/papers')
}

// ── 生命周期 ──
onMounted(() => {
  fetchPaperInfo()
  fetchQuestionBanks()
})
</script>

<style scoped lang="less">
.paper-detail-page {
  max-width: 1400px;
  margin: 0 auto;
}

.info-card {
  margin-top: 16px;
  
  .score-display,
  .count-display {
    font-size: 16px;
    font-weight: 600;
    color: #1890ff;
  }
}

.content-row {
  margin-top: 16px;
}

.left-card,
.right-card {
  height: calc(100vh - 280px);
  display: flex;
  flex-direction: column;
  
  :deep(.ant-card-body) {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}

.filter-form {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.question-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.question-item {
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  transition: all 0.3s;
  
  &:hover {
    border-color: #1890ff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  }
  
  &.selected {
    background: #f6ffed;
    border-color: #52c41a;
  }
  
  .question-header {
    margin-bottom: 8px;
    
    .question-score {
      color: #1890ff;
      font-weight: 500;
    }
  }
  
  .question-content {
    margin-bottom: 8px;
    color: #333;
    font-size: 14px;
  }
  
  .question-footer {
    text-align: right;
  }
}

.question-pagination {
  margin-top: 16px;
  text-align: center;
}

.arrow-col {
  display: flex;
  align-items: center;
  justify-content: center;
  
  .arrow-container {
    text-align: center;
    
    .arrow-icon {
      font-size: 48px;
      color: #1890ff;
    }
    
    .arrow-text {
      margin-top: 8px;
      color: #666;
      font-size: 12px;
    }
  }
}

.selected-questions {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  
  :deep(.ant-timeline) {
    padding-top: 8px;
  }
}

.selected-question-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #fafafa;
  border-radius: 4px;
  
  .question-index {
    width: 60px;
    font-weight: 600;
    color: #1890ff;
    flex-shrink: 0;
  }
  
  .question-info {
    flex: 1;
    min-width: 0;
    
    .question-content {
      color: #333;
    }
  }
  
  .question-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    
    .score-unit {
      margin-right: 8px;
      color: #666;
    }
  }
}

.paper-stats {
  padding: 16px;
  background: #f6ffed;
  border-radius: 8px;
  
  .stat-item {
    text-align: center;
    
    .stat-label {
      color: #666;
      font-size: 12px;
      margin-bottom: 4px;
    }
    
    .stat-value {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      
      &.highlight {
        color: #52c41a;
      }
    }
  }
}
</style>
