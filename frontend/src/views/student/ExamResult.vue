<template>
  <div class="exam-result">
    <a-spin :spinning="loading">
      <!-- 成绩概览 -->
      <a-result
        v-if="result"
        :status="resultStatus"
        :title="resultTitle"
      >
        <template #subTitle>
          <p v-if="result.exam_name">{{ result.exam_name }}</p>
        </template>
        <template #extra>
          <div class="score-overview" v-if="result.total_score != null">
            <a-statistic
              title="总分"
              :value="result.total_score"
              :precision="1"
              :value-style="{ color: result.total_score >= 60 ? '#3f8600' : '#cf1322', fontSize: '48px' }"
            />
          </div>

          <a-descriptions bordered :column="2" class="score-details" v-if="hasDetailedScores">
            <a-descriptions-item label="客观题得分">
              {{ result.objective_score != null ? result.objective_score + ' 分' : '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="主观题得分">
              {{ result.subjective_score != null ? result.subjective_score + ' 分' : '待评分' }}
            </a-descriptions-item>
            <a-descriptions-item label="提交时间">
              {{ formatTime(result.submitted_at) }}
            </a-descriptions-item>
            <a-descriptions-item label="考试状态">
              <a-tag :color="statusColor">{{ statusText }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="排名" v-if="result.rank != null">
              <a-tag :color="rankColor">第 {{ result.rank }} 名</a-tag>
            </a-descriptions-item>
          </a-descriptions>

          <!-- 裁判评分表 -->
          <div v-if="gradingSheets.length > 0" class="grading-section">
            <a-divider>裁判评分表</a-divider>
            <a-row :gutter="[16, 16]">
              <a-col
                v-for="sheet in gradingSheets"
                :key="sheet.id"
                :xs="24"
                :sm="12"
                :md="8"
              >
                <a-card
                  :bordered="true"
                  hoverable
                  class="grading-card"
                >
                  <template #cover>
                    <a-image
                      :src="getImageUrl(sheet.file_url)"
                      :alt="sheet.judge_name || `裁判${sheet.judge_order}`"
                      :fallback="fallbackImage"
                      class="grading-image"
                    />
                  </template>
                  <a-card-meta
                    :title="sheet.judge_name || `裁判 ${sheet.judge_order}`"
                    :description="`评分表 ${sheet.judge_order}`"
                  />
                </a-card>
              </a-col>
            </a-row>
          </div>

          <div class="result-actions">
            <a-button type="primary" @click="$router.push('/student')">返回首页</a-button>
          </div>
        </template>
      </a-result>

      <!-- 成绩查询未开放 -->
      <a-result
        v-else-if="!loading && scoreQueryClosed"
        status="info"
        title="成绩查询暂未开放"
        sub-title="请等待管理员开启成绩查询，届时您可再次访问本页面查看成绩"
      >
        <template #extra>
          <a-button type="primary" @click="$router.push('/student')">返回首页</a-button>
          <a-button @click="fetchResult" style="margin-left: 8px">重试</a-button>
        </template>
      </a-result>

      <!-- 加载失败降级显示 -->
      <a-result
        v-else-if="!loading && submitted"
        status="success"
        title="试卷提交成功！"
        sub-title="成绩数据正在处理中，请稍后查看"
      >
        <template #extra>
          <a-button type="primary" @click="$router.push('/student')">返回首页</a-button>
          <a-button @click="fetchResult" style="margin-left: 8px">刷新成绩</a-button>
        </template>
      </a-result>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMyExamResult, getStudentScoreDetail } from '@/api/scores'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const examId = Number(route.params.examId)
const loading = ref(true)
const submitted = ref(true)
const scoreQueryClosed = ref(false)

interface GradingSheetItem {
  id: number
  judge_name: string | null
  judge_order: number
  file_url: string
  file_name: string
}

interface ExamResult {
  exam_name?: string
  total_score: number | null
  objective_score: number | null
  subjective_score: number | null
  submitted_at: string | null
  status: string
  rank?: number | null
}

const result = ref<ExamResult | null>(null)
const gradingSheets = ref<GradingSheetItem[]>([])

// 图片加载失败时的默认图
const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjE0Ij7lm77niYfliqDovb3lpLHotKU8L3RleHQ+PC9zdmc+'

const hasDetailedScores = computed(() => {
  return result.value && (
    result.value.objective_score != null ||
    result.value.subjective_score != null ||
    result.value.submitted_at
  )
})

const resultStatus = computed(() => {
  if (!result.value || result.value.total_score == null) return 'info'
  return result.value.total_score >= 60 ? 'success' : 'warning'
})

const resultTitle = computed(() => {
  if (!result.value || result.value.total_score == null) return '试卷已提交，成绩待出'
  return `考试成绩：${result.value.total_score} 分`
})

const statusColor = computed(() => {
  const s = result.value?.status
  const map: Record<string, string> = {
    submitted: 'blue',
    graded: 'green',
    timeout: 'orange',
    in_progress: 'processing',
  }
  return map[s || ''] || 'default'
})

const statusText = computed(() => {
  const s = result.value?.status
  const map: Record<string, string> = {
    submitted: '已提交',
    graded: '已评分',
    timeout: '超时提交',
    in_progress: '进行中',
  }
  return map[s || ''] || s || '-'
})

const rankColor = computed(() => {
  const rank = result.value?.rank
  if (!rank) return 'default'
  if (rank === 1) return 'gold'
  if (rank === 2) return '#C0C0C0'
  if (rank === 3) return 'orange'
  return 'blue'
})

function formatTime(time: string | null): string {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

function getImageUrl(url: string): string {
  if (!url) return ''
  // 如果是绝对URL直接返回；相对路径拼上后端地址
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return url
}

async function fetchResult() {
  loading.value = true
  scoreQueryClosed.value = false
  try {
    // 优先使用 getMyExamResult（学生查询本人成绩，含排名和评分表）
    const res = await getMyExamResult(examId)
    if (res.data) {
      result.value = {
        exam_name: res.data.exam_name,
        total_score: res.data.total_score,
        objective_score: res.data.objective_score,
        subjective_score: res.data.subjective_score,
        submitted_at: res.data.submitted_at,
        status: res.data.status,
        rank: res.data.rank,
      }
      gradingSheets.value = res.data.grading_sheets || []
    }
  } catch (err: any) {
    // 403 表示成绩查询未开放
    if (err?.response?.status === 403) {
      scoreQueryClosed.value = true
      return
    }
    console.warn('getMyExamResult 失败，降级使用 getStudentScoreDetail:', err)
    // 降级：尝试用旧接口
    try {
      const accountId = Number(route.params.accountId) || 0
      const res = await getStudentScoreDetail(examId, accountId || examId)
      if (res.data) {
        result.value = {
          exam_name: res.data.exam_name,
          total_score: res.data.total_score,
          objective_score: res.data.objective_score,
          subjective_score: res.data.subjective_score,
          submitted_at: res.data.submitted_at,
          status: res.data.status,
        }
      }
    } catch (err2) {
      console.warn('获取成绩详情失败:', err2)
      submitted.value = true
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchResult()
})
</script>

<style scoped lang="less">
.exam-result {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 16px;
}

.score-overview {
  text-align: center;
  margin-bottom: 24px;
}

.score-details {
  margin-top: 16px;
  margin-bottom: 24px;
}

.grading-section {
  margin-top: 8px;
  margin-bottom: 24px;

  :deep(.ant-divider) {
    font-size: 16px;
    font-weight: 500;
  }
}

.grading-card {
  .grading-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  :deep(.ant-card-meta-title) {
    font-size: 14px;
  }

  :deep(.ant-card-meta-description) {
    font-size: 12px;
    color: #999;
  }
}

.result-actions {
  margin-top: 24px;
  text-align: center;
}
</style>
