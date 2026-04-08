<template>
  <div class="paper-builder">
    <a-row :gutter="16" class="builder-body">
      <!-- 左侧：题库浏览 -->
      <a-col :span="10">
        <a-card title="题库" size="small" class="panel-card">
          <!-- 筛选条件 -->
          <div class="filters">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索题目内容..."
              allow-clear
              @search="fetchQuestions"
            />
            <div class="filter-row">
              <a-select
                v-model:value="filterType"
                placeholder="题型"
                allow-clear
                style="width: 120px"
                @change="fetchQuestions"
              >
                <a-select-option value="single_choice">单选题</a-select-option>
                <a-select-option value="multiple_choice">多选题</a-select-option>
                <a-select-option value="true_false">判断题</a-select-option>
                <a-select-option value="fill_blank">填空题</a-select-option>
              </a-select>
              <a-select
                v-model:value="filterDifficulty"
                placeholder="难度"
                allow-clear
                style="width: 100px"
                @change="fetchQuestions"
              >
                <a-select-option value="easy">简单</a-select-option>
                <a-select-option value="medium">中等</a-select-option>
                <a-select-option value="hard">困难</a-select-option>
              </a-select>
            </div>
          </div>

          <!-- 题目列表 -->
          <a-spin :spinning="bankLoading">
            <div class="bank-list">
              <a-empty v-if="bankQuestions.length === 0" description="暂无题目" />
              <div
                v-for="q in bankQuestions"
                :key="q.id"
                class="bank-item"
              >
                <div class="bank-item-header">
                  <a-tag :color="typeColor(q.question_type)" size="small">
                    {{ typeLabel(q.question_type) }}
                  </a-tag>
                  <a-tag size="small">{{ q.default_score }} 分</a-tag>
                  <a-tag size="small" :color="difficultyColor(q.difficulty)">
                    {{ difficultyLabel(q.difficulty) }}
                  </a-tag>
                </div>
                <div class="bank-item-content" v-html="q.content"></div>
                <a-button
                  type="link"
                  size="small"
                  :disabled="isInPaper(q.id)"
                  @click="addToPaper(q)"
                >
                  {{ isInPaper(q.id) ? '已添加' : '+ 添加到试卷' }}
                </a-button>
              </div>
            </div>
          </a-spin>

          <!-- 分页 -->
          <a-pagination
            v-model:current="bankPage"
            :total="bankTotal"
            :page-size="bankPageSize"
            size="small"
            simple
            class="bank-pagination"
            @change="fetchQuestions"
          />
        </a-card>
      </a-col>

      <!-- 右侧：试卷组卷区 -->
      <a-col :span="14">
        <a-card size="small" class="panel-card">
          <template #title>
            <div class="paper-title-bar">
              <span>试卷题目</span>
              <a-tag color="blue">共 {{ paperQuestions.length }} 题</a-tag>
              <a-tag color="orange">总分 {{ totalScore }} 分</a-tag>
            </div>
          </template>

          <a-empty v-if="paperQuestions.length === 0" description="请从左侧题库添加题目">
            <template #image>
              <InboxOutlined style="font-size: 48px; color: #d9d9d9" />
            </template>
          </a-empty>

          <!-- 拖拽排序列表 -->
          <div class="paper-list">
            <div
              v-for="(pq, idx) in paperQuestions"
              :key="pq.question_id"
              :class="['paper-item', { 'paper-item--dragging': dragIndex === idx }]"
              draggable="true"
              @dragstart="onDragStart(idx, $event)"
              @dragover.prevent="onDragOver(idx)"
              @dragend="onDragEnd"
            >
              <div class="paper-item-handle">
                <HolderOutlined />
              </div>
              <div class="paper-item-index">{{ idx + 1 }}</div>
              <div class="paper-item-body">
                <div class="paper-item-meta">
                  <a-tag :color="typeColor(pq.question_type)" size="small">
                    {{ typeLabel(pq.question_type) }}
                  </a-tag>
                  <span class="paper-item-content-text" v-html="pq.content"></span>
                </div>
                <div class="paper-item-actions">
                  <span class="score-editor">
                    <a-input-number
                      v-model:value="pq.score"
                      :min="0"
                      :max="100"
                      :precision="1"
                      size="small"
                      style="width: 70px"
                    />
                    <span class="score-unit">分</span>
                  </span>
                  <a-button type="link" danger size="small" @click="removeFromPaper(idx)">
                    移除
                  </a-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <a-divider style="margin: 12px 0" />
          <div class="paper-footer">
            <a-button @click="clearPaper" :disabled="paperQuestions.length === 0">
              清空试卷
            </a-button>
            <a-button
              type="primary"
              :loading="saving"
              :disabled="paperQuestions.length === 0"
              @click="savePaper"
            >
              保存试卷
            </a-button>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { HolderOutlined, InboxOutlined } from '@ant-design/icons-vue'
import { getQuestions } from '@/api/questions'
import {
  getPaper,
  addQuestionsToPaper,
  removeQuestionFromPaper,
  reorderQuestions,
  updateQuestionScore,
} from '@/api/papers'

/** 题库中的题目 */
interface BankQuestion {
  id: number
  content: string
  question_type: string
  default_score: number
  difficulty: string
  options?: any[] | null
  [key: string]: any
}

/** 试卷中的题目 */
interface PaperQuestion {
  question_id: number
  content: string
  question_type: string
  score: number
  order: number
  [key: string]: any
}

const props = defineProps<{
  /** 试卷ID，不传则为新建模式 */
  paperId?: number
}>()

// ── 题库浏览状态 ──
const bankLoading = ref(false)
const bankQuestions = ref<BankQuestion[]>([])
const bankPage = ref(1)
const bankPageSize = 10
const bankTotal = ref(0)
const searchKeyword = ref('')
const filterType = ref<string | undefined>(undefined)
const filterDifficulty = ref<string | undefined>(undefined)

// ── 试卷组卷状态 ──
const paperQuestions = ref<PaperQuestion[]>([])
const saving = ref(false)

// ── 拖拽状态 ──
const dragIndex = ref<number | null>(null)

/** 总分 */
const totalScore = computed(() =>
  paperQuestions.value.reduce((sum, q) => sum + (q.score || 0), 0),
)

// ── 题型 / 难度映射 ──
function typeLabel(t: string): string {
  const map: Record<string, string> = {
    single_choice: '单选',
    multiple_choice: '多选',
    true_false: '判断',
    fill_blank: '填空',
  }
  return map[t] || t
}

function typeColor(t: string): string {
  const map: Record<string, string> = {
    single_choice: 'blue',
    multiple_choice: 'purple',
    true_false: 'cyan',
    fill_blank: 'green',
  }
  return map[t] || 'default'
}

function difficultyLabel(d: string): string {
  return { easy: '简单', medium: '中等', hard: '困难' }[d] || d
}

function difficultyColor(d: string): string {
  return { easy: 'green', medium: 'orange', hard: 'red' }[d] || 'default'
}

/** 判断题目是否已在试卷中 */
function isInPaper(questionId: number): boolean {
  return paperQuestions.value.some((q) => q.question_id === questionId)
}

// ── 题库加载 ──
async function fetchQuestions() {
  bankLoading.value = true
  try {
    const res = await getQuestions({
      page: bankPage.value,
      size: bankPageSize,
      question_type: filterType.value,
      difficulty: filterDifficulty.value,
      search: searchKeyword.value || undefined,
    })
    bankQuestions.value = res.data.items
    bankTotal.value = res.data.meta.total
  } catch {
    message.error('加载题目失败')
  } finally {
    bankLoading.value = false
  }
}

/** 加载已有试卷 */
async function loadPaper() {
  if (!props.paperId) return
  try {
    const res = await getPaper(props.paperId)
    const paper = res.data
    // 试卷中的题目列表，按 order 排序
    if (paper.questions) {
      paperQuestions.value = paper.questions
        .sort((a: PaperQuestion, b: PaperQuestion) => a.order - b.order)
    }
  } catch {
    message.error('加载试卷失败')
  }
}

// ── 添加/移除题目 ──
function addToPaper(q: BankQuestion) {
  if (isInPaper(q.id)) return
  paperQuestions.value.push({
    question_id: q.id,
    content: q.content,
    question_type: q.question_type,
    score: q.default_score,
    order: paperQuestions.value.length + 1,
  })
}

function removeFromPaper(index: number) {
  paperQuestions.value.splice(index, 1)
  // 重新计算 order
  paperQuestions.value.forEach((q, i) => (q.order = i + 1))
}

function clearPaper() {
  Modal.confirm({
    title: '确认清空',
    content: '确定清空所有已添加的题目吗？此操作不可恢复。',
    okText: '确认',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: () => {
      paperQuestions.value = []
    },
  })
}

// ── HTML5 拖拽排序 ──
function onDragStart(index: number, event: DragEvent) {
  dragIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDragOver(overIndex: number) {
  if (dragIndex.value === null || dragIndex.value === overIndex) return
  const list = [...paperQuestions.value]
  const [moved] = list.splice(dragIndex.value, 1)
  list.splice(overIndex, 0, moved)
  paperQuestions.value = list
  dragIndex.value = overIndex
}

function onDragEnd() {
  dragIndex.value = null
  // 更新 order
  paperQuestions.value.forEach((q, i) => (q.order = i + 1))
}

// ── 保存试卷 ──
async function savePaper() {
  if (!props.paperId) {
    message.warning('请先创建试卷后再添加题目')
    return
  }
  saving.value = true
  try {
    // 添加题目到试卷
    const questionsConfig = paperQuestions.value.map((q) => ({
      question_id: q.question_id,
      score: q.score,
    }))
    await addQuestionsToPaper(props.paperId, questionsConfig)

    // 设置排序
    const order = paperQuestions.value.map((q) => q.question_id)
    await reorderQuestions(props.paperId, { order })

    // 更新各题分值
    for (const q of paperQuestions.value) {
      await updateQuestionScore(props.paperId, q.question_id, { score: q.score })
    }

    message.success('试卷保存成功')
  } catch {
    message.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchQuestions()
  loadPaper()
})
</script>

<style scoped>
.paper-builder {
  height: 100%;
}

.builder-body {
  height: 100%;
}

.panel-card {
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.panel-card :deep(.ant-card-body) {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-row {
  display: flex;
  gap: 8px;
}

.bank-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bank-item {
  padding: 10px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  transition: box-shadow 0.2s;
}

.bank-item:hover {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.bank-item-header {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
}

.bank-item-content {
  font-size: 13px;
  color: #595959;
  line-height: 1.6;
  margin-bottom: 6px;
  max-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bank-pagination {
  margin-top: 12px;
  text-align: center;
}

/* 试卷标题栏 */
.paper-title-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 试卷题目列表 */
.paper-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.paper-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background: #fff;
  transition: all 0.2s;
  cursor: grab;
}

.paper-item:hover {
  border-color: #d9d9d9;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.paper-item--dragging {
  opacity: 0.5;
  border-color: #1890ff;
  border-style: dashed;
}

.paper-item-handle {
  color: #bfbfbf;
  cursor: grab;
  padding-top: 2px;
  font-size: 14px;
}

.paper-item-index {
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.paper-item-body {
  flex: 1;
  min-width: 0;
}

.paper-item-meta {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 6px;
}

.paper-item-content-text {
  font-size: 13px;
  color: #595959;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.paper-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-editor {
  display: flex;
  align-items: center;
  gap: 4px;
}

.score-unit {
  font-size: 12px;
  color: #8c8c8c;
}

.paper-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
