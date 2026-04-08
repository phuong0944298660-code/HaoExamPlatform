<template>
  <div class="wrong-answer-book">
    <!-- 页面标题 -->
    <div class="page-header-section">
      <div class="header-left">
        <a-button type="text" @click="router.back()" class="back-btn">
          <template #icon><ArrowLeftOutlined /></template>
        </a-button>
        <div>
          <h2 class="page-title">
            <WarningOutlined class="title-icon error" />
            错题本
          </h2>
          <p class="page-subtitle">收录你做错过的题目，复习巩固，消灭错题</p>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <a-select
        v-model:value="filterBankId"
        placeholder="按题库筛选"
        allow-clear
        style="min-width: 200px"
        @change="loadWrongAnswers"
      >
        <a-select-option :value="undefined">全部题库</a-select-option>
        <a-select-option v-for="bank in banks" :key="bank.id" :value="bank.id">
          {{ bank.name }}
        </a-select-option>
      </a-select>
      <a-radio-group v-model:value="filterResolved" button-style="solid" @change="applyFilter">
        <a-radio-button :value="null">全部</a-radio-button>
        <a-radio-button :value="false">未掌握</a-radio-button>
        <a-radio-button :value="true">已掌握</a-radio-button>
      </a-radio-group>
      <span class="count-info">共 {{ filteredItems.length }} 道错题</span>
    </div>

    <!-- 加载状态 -->
    <a-spin :spinning="loading" tip="加载中...">
      <!-- 空状态 -->
      <a-empty
        v-if="!loading && filteredItems.length === 0"
        description="暂无错题记录，继续加油练习吧！"
        class="empty-state"
      />

      <!-- 错题列表 -->
      <div v-else class="wrong-list">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          :class="['wrong-item', { resolved: item.isResolved }]"
        >
          <!-- 题目头部信息 -->
          <div class="item-header">
            <div class="item-meta">
              <a-tag :color="typeColor(item.questionType)">{{ typeLabel(item.questionType) }}</a-tag>
              <a-tag v-if="item.difficulty" color="orange">{{ diffLabel(item.difficulty) }}</a-tag>
              <span v-if="item.isResolved" class="resolved-badge">
                <CheckCircleOutlined /> 已掌握
              </span>
            </div>
            <div class="item-stats">
              <a-tooltip :title="`最近答错：${formatTime(item.lastWrongAt)}`">
                <span class="wrong-count">
                  <CloseCircleOutlined class="icon-error" />
                  答错 {{ item.wrongCount }} 次
                </span>
              </a-tooltip>
            </div>
          </div>

          <!-- 题目内容 -->
          <div class="item-content">
            <span class="q-text" v-html="item.content"></span>
          </div>

          <!-- 选项预览（仅选择题展示） -->
          <div v-if="item.options && parsedOptions(item.options).length > 0" class="item-options">
            <div v-for="opt in parsedOptions(item.options)" :key="opt.label" class="opt-row">
              <span class="opt-label">{{ opt.label }}.</span>
              <span class="opt-content">{{ opt.content }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="item-actions">
            <a-button
              type="primary"
              ghost
              size="small"
              @click="rePractice(item)"
            >
              <PlayCircleOutlined />
              重新作答
            </a-button>
            <a-button
              v-if="!item.isResolved"
              type="default"
              size="small"
              class="resolve-btn"
              :loading="resolvingId === item.questionId"
              @click="resolveItem(item)"
            >
              <CheckOutlined />
              标记已掌握
            </a-button>
            <a-tag v-else color="success">
              <CheckCircleOutlined />
              已掌握 {{ item.resolvedAt ? formatTime(item.resolvedAt) : '' }}
            </a-tag>
            <a-popconfirm
              title="确认从错题本删除此题？"
              ok-text="删除"
              cancel-text="取消"
              ok-type="danger"
              @confirm="deleteItem(item)"
            >
              <a-button type="text" size="small" danger>
                <DeleteOutlined />
                删除
              </a-button>
            </a-popconfirm>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  ArrowLeftOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  CheckOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import { practiceApi } from '@/api/practice'
import type { WrongAnswerItem, PracticeBank } from '@/api/practice'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const wrongItems = ref<WrongAnswerItem[]>([])
const banks = ref<PracticeBank[]>([])
const filterBankId = ref<number | undefined>(
  route.query.bankId ? Number(route.query.bankId) : undefined
)
const filterResolved = ref<boolean | null>(null)
const resolvingId = ref<number | null>(null)

const filteredItems = computed(() => {
  let items = wrongItems.value
  if (filterResolved.value !== null) {
    items = items.filter(i => i.isResolved === filterResolved.value)
  }
  return items
})

async function loadWrongAnswers() {
  loading.value = true
  try {
    const res = await practiceApi.getWrongAnswers(filterBankId.value)
    wrongItems.value = res.data || []
  } catch {
    message.error('加载错题本失败')
  } finally {
    loading.value = false
  }
}

async function loadBanks() {
  try {
    const res = await practiceApi.getBanks()
    banks.value = res.data || []
  } catch {
    // 忽略
  }
}

function applyFilter() {
  // filterResolved 变化直接通过 computed 过滤，无需重新请求
}

async function resolveItem(item: WrongAnswerItem) {
  resolvingId.value = item.questionId
  try {
    await practiceApi.resolveWrongAnswer(item.questionId)
    const found = wrongItems.value.find(w => w.questionId === item.questionId)
    if (found) {
      found.isResolved = true
      found.resolvedAt = new Date().toISOString()
    }
    message.success('已标记为掌握')
  } catch {
    message.error('操作失败')
  } finally {
    resolvingId.value = null
  }
}

async function deleteItem(item: WrongAnswerItem) {
  try {
    await practiceApi.deleteWrongAnswer(item.questionId)
    wrongItems.value = wrongItems.value.filter(w => w.id !== item.id)
    message.success('已从错题本删除')
  } catch {
    message.error('删除失败')
  }
}

function rePractice(item: WrongAnswerItem) {
  router.push({
    name: 'PracticePage',
    params: { bankId: item.questionBankId },
    query: { name: banks.value.find(b => b.id === item.questionBankId)?.name || '练习' },
  })
}

function parsedOptions(optionsJson: string): Array<{ label: string; content: string }> {
  if (!optionsJson) return []
  try {
    const parsed = JSON.parse(optionsJson)
    if (Array.isArray(parsed)) {
      return parsed.map((o: any) => ({
        label: o.label || o.key || o,
        content: o.content || o.value || o.text || '',
      }))
    }
  } catch {
    return []
  }
  return []
}

function typeLabel(type: string) {
  const t = type?.toUpperCase() || ''
  if (t.includes('SINGLE')) return '单选题'
  if (t.includes('MULTI')) return '多选题'
  if (t.includes('JUDG') || t === 'TRUE_FALSE') return '判断题'
  return '主观题'
}

function typeColor(type: string) {
  const t = type?.toUpperCase() || ''
  if (t.includes('SINGLE')) return 'blue'
  if (t.includes('MULTI')) return 'purple'
  if (t.includes('JUDG') || t === 'TRUE_FALSE') return 'green'
  return 'orange'
}

function diffLabel(diff: string) {
  const map: Record<string, string> = {
    EASY: '简单', MEDIUM: '中等', HARD: '困难',
    easy: '简单', medium: '中等', hard: '困难',
  }
  return map[diff] || diff
}

function formatTime(t: string) {
  return dayjs(t).format('MM-DD HH:mm')
}

onMounted(async () => {
  await Promise.all([loadWrongAnswers(), loadBanks()])
})
</script>

<style scoped lang="less">
.wrong-answer-book {
  max-width: 900px;
  margin: 0 auto;
}

/* 页面标题 */
.page-header-section {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.back-btn {
  margin-top: 2px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon.error {
  color: #ff4d4f;
}

.page-subtitle {
  margin: 0;
  font-size: 13px;
  color: #888;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.count-info {
  font-size: 13px;
  color: #888;
  margin-left: auto;
}

/* 空状态 */
.empty-state {
  padding: 80px 0;
}

/* 错题列表 */
.wrong-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wrong-item {
  background: #fff;
  border-radius: 10px;
  padding: 16px 20px;
  border: 1.5px solid #ffccc7;
  box-shadow: 0 1px 4px rgba(255, 77, 79, 0.06);
  transition: border-color 0.2s;

  &.resolved {
    border-color: #b7eb8f;
    opacity: 0.75;
  }

  &:hover {
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  }
}

/* 头部信息 */
.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.resolved-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #52c41a;
  font-weight: 500;
}

.item-stats {
  font-size: 12px;
  color: #888;
}

.wrong-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-error {
  color: #ff4d4f;
}

/* 题目内容 */
.item-content {
  font-size: 15px;
  color: #1a1a1a;
  line-height: 1.7;
  margin-bottom: 10px;
}

/* 选项 */
.item-options {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
}

.opt-row {
  display: flex;
  gap: 6px;
  font-size: 13px;
  color: #555;
  padding: 2px 0;
}

.opt-label {
  font-weight: 600;
  flex-shrink: 0;
  color: #1677ff;
}

/* 操作按钮 */
.item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px solid #f5f5f5;
}

.resolve-btn {
  border-color: #52c41a;
  color: #52c41a;

  &:hover {
    background: #f6ffed;
    border-color: #73d13d;
    color: #389e0d;
  }
}

/* 响应式 */
@media (max-width: 576px) {
  .filter-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .count-info {
    margin-left: 0;
  }
}
</style>
