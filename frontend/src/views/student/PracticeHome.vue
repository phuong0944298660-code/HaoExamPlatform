<template>
  <div class="practice-home">
    <!-- 页面标题 & 统计 -->
    <div class="page-header-section">
      <div class="header-left">
        <h2 class="page-title">
          <BookOutlined class="title-icon" />
          题库练习
        </h2>
        <p class="page-subtitle">选择题库，开始练习，提升能力</p>
      </div>
      <div class="header-right">
        <a-button type="default" size="large" @click="goWrongBook">
          <template #icon><WarningOutlined /></template>
          错题本
          <a-badge v-if="stats.totalWrong > 0" :count="stats.totalWrong" :offset="[6, -6]" />
        </a-button>
      </div>
    </div>

    <!-- 总览统计卡片 -->
    <a-row :gutter="[16, 16]" class="stats-row">
      <a-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-value primary">{{ stats.totalPracticed }}</div>
          <div class="stat-label">已练习题数</div>
        </div>
      </a-col>
      <a-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-value success">{{ stats.totalCorrect }}</div>
          <div class="stat-label">答对题数</div>
        </div>
      </a-col>
      <a-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-value error">{{ stats.totalWrong }}</div>
          <div class="stat-label">错题数量</div>
        </div>
      </a-col>
      <a-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-value warning">{{ stats.accuracy }}%</div>
          <div class="stat-label">正确率</div>
        </div>
      </a-col>
    </a-row>

    <!-- 题库列表 -->
    <div class="section-header">
      <h3 class="section-title">可用题库</h3>
    </div>

    <a-spin :spinning="loading" tip="加载中...">
      <!-- 空状态 -->
      <a-empty
        v-if="!loading && banks.length === 0"
        description="暂无可用题库，请确认激活码权限"
        class="empty-state"
      >
        <template #image>
          <InboxOutlined class="empty-icon" />
        </template>
      </a-empty>

      <!-- 题库卡片 -->
      <a-row v-else :gutter="[16, 16]">
        <a-col
          v-for="bank in banks"
          :key="bank.id"
          :xs="24"
          :sm="12"
          :lg="8"
        >
          <a-card hoverable class="bank-card" @click="goToPractice(bank.id, bank.name)">
            <div class="bank-header">
              <div class="bank-title-row">
                <span class="bank-icon">
                  <ReadOutlined />
                </span>
                <h4 class="bank-title">{{ bank.name }}</h4>
              </div>
              <a-tag v-if="bank.subject" color="blue">{{ bank.subject }}</a-tag>
            </div>

            <p v-if="bank.description" class="bank-desc">{{ bank.description }}</p>

            <!-- 进度条 -->
            <div class="bank-progress">
              <div class="progress-label">
                <span>练习进度</span>
                <span class="progress-num">{{ bank.practicedCount }} / {{ bank.questionCount }} 题</span>
              </div>
              <a-progress
                :percent="bank.progress"
                :show-info="true"
                status="active"
                size="small"
                :stroke-color="{ from: '#108ee9', to: '#87d068' }"
              />
            </div>

            <!-- 统计 -->
            <div class="bank-stats">
              <div class="bank-stat-item">
                <CheckCircleOutlined class="stat-icon success" />
                <span>正确率 {{ bank.accuracy }}%</span>
              </div>
              <div class="bank-stat-item" v-if="bank.wrongCount > 0">
                <CloseCircleOutlined class="stat-icon error" />
                <span>{{ bank.wrongCount }} 道错题</span>
              </div>
              <div class="bank-stat-item">
                <FileTextOutlined class="stat-icon" />
                <span>共 {{ bank.questionCount }} 题</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="bank-actions" @click.stop>
              <a-button
                type="primary"
                block
                @click="goToPractice(bank.id, bank.name)"
              >
                <PlayCircleOutlined />
                开始练习
              </a-button>
              <a-button
                v-if="bank.wrongCount > 0"
                block
                class="wrong-btn"
                @click="goWrongBook(bank.id)"
              >
                <WarningOutlined />
                错题本 ({{ bank.wrongCount }})
              </a-button>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  BookOutlined,
  ReadOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  InboxOutlined,
} from '@ant-design/icons-vue'
import { practiceApi } from '@/api/practice'
import type { PracticeBank, PracticeStats } from '@/api/practice'

const router = useRouter()
const loading = ref(false)
const banks = ref<PracticeBank[]>([])
const stats = ref<PracticeStats>({
  totalPracticed: 0,
  totalCorrect: 0,
  totalWrong: 0,
  accuracy: 0,
})

async function loadData() {
  loading.value = true
  try {
    const [banksRes, statsRes] = await Promise.all([
      practiceApi.getBanks(),
      practiceApi.getStats(),
    ])
    banks.value = banksRes.data || []
    stats.value = statsRes.data || { totalPracticed: 0, totalCorrect: 0, totalWrong: 0, accuracy: 0 }
  } catch {
    message.error('加载数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function goToPractice(bankId: number, bankName?: string) {
  router.push({ name: 'PracticePage', params: { bankId }, query: { name: bankName } })
}

function goWrongBook(bankId?: number) {
  if (bankId) {
    router.push({ name: 'WrongAnswerBook', query: { bankId } })
  } else {
    router.push({ name: 'WrongAnswerBook' })
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="less">
.practice-home {
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面标题区 */
.page-header-section {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  color: var(--primary-500, #1677ff);
}

.page-subtitle {
  margin: 0;
  color: var(--text-secondary, #666);
  font-size: 14px;
}

/* 统计卡片 */
.stats-row {
  margin-bottom: 28px;
}

.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;

  &.primary { color: #1677ff; }
  &.success { color: #52c41a; }
  &.error   { color: #ff4d4f; }
  &.warning { color: #fa8c16; }
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary, #888);
}

/* 分区标题 */
.section-header {
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary, #1a1a1a);
}

/* 空状态 */
.empty-state {
  padding: 60px 0;
}

.empty-icon {
  font-size: 48px;
  color: #bfbfbf;
}

/* 题库卡片 */
.bank-card {
  height: 100%;
  border-radius: 10px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }

  :deep(.ant-card-body) {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }
}

.bank-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.bank-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.bank-icon {
  font-size: 18px;
  color: #1677ff;
  flex-shrink: 0;
}

.bank-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bank-desc {
  font-size: 13px;
  color: #888;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
  max-height: 3em;
}

/* 进度 */
.bank-progress {
  .progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #888;
    margin-bottom: 4px;
  }

  .progress-num {
    font-weight: 500;
    color: #555;
  }
}

/* 统计 */
.bank-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bank-stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.stat-icon {
  font-size: 13px;
  &.success { color: #52c41a; }
  &.error   { color: #ff4d4f; }
}

/* 操作按钮 */
.bank-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.wrong-btn {
  border-color: #ff4d4f;
  color: #ff4d4f;

  &:hover {
    background: #fff1f0;
    border-color: #ff7875;
    color: #ff7875;
  }
}

/* 响应式 */
@media (max-width: 576px) {
  .page-header-section {
    flex-direction: column;
  }
}
</style>
