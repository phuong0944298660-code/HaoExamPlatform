<template>
  <div class="class-scores-page">
    <!-- 页面标题 -->
    <a-page-header
      title="班级成绩"
      :sub-title="`查看 ${className} 的成绩统计`"
      @back="handleBack"
    >
      <template #extra>
        <a-button type="primary" @click="handleExport">
          <DownloadOutlined />
          导出成绩
        </a-button>
      </template>
    </a-page-header>

    <!-- 统计卡片 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-value">{{ stats.avgScore }}</div>
          <div class="stat-label">班级均分</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-value">{{ stats.maxScore }}</div>
          <div class="stat-label">最高分</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-value">{{ stats.minScore }}</div>
          <div class="stat-label">最低分</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-value">{{ stats.passRate }}%</div>
          <div class="stat-label">及格率</div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 成绩表格 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data-source="studentScores"
        :loading="loading"
        row-key="id"
        :pagination="pagination"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'rank'">
            <a-tag :color="getRankColor(record.rank)">{{ record.rank }}</a-tag>
          </template>
          <template v-if="column.key === 'score'">
            <span :class="getScoreClass(record.score)">{{ record.score }}</span>
          </template>
          <template v-if="column.key === 'trend'">
            <span :class="getTrendClass(record.trend)">
              <ArrowUpOutlined v-if="record.trend > 0" />
              <ArrowDownOutlined v-if="record.trend < 0" />
              {{ record.trend > 0 ? '+' : '' }}{{ record.trend }}
            </span>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  DownloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons-vue'
import type { TablePaginationConfig } from 'ant-design-vue'

import { getClassScores, exportClassScores } from '@/api/classes'

const route = useRoute()
const router = useRouter()
const classId = route.params.classId as string

const loading = ref(false)
const className = ref('高一(1)班')

const stats = ref({
  avgScore: 0,
  maxScore: 0,
  minScore: 0,
  passRate: 0,
})

const columns = [
  { title: '排名', dataIndex: 'rank', key: 'rank', width: 80 },
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '学号', dataIndex: 'studentNo', key: 'studentNo' },
  { title: '总分', dataIndex: 'score', key: 'score', width: 100 },
  { title: '排名变化', dataIndex: 'trend', key: 'trend', width: 120 },
]

const studentScores = ref<any[]>([])

const pagination: TablePaginationConfig = {
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
}

// 加载班级成绩数据
async function fetchClassScores() {
  loading.value = true
  try {
    const res = await getClassScores(classId)
    const data = res.data || { students: [], statistics: {} }

    // 更新学生成绩列表
    studentScores.value = data.students.map((s: any, index: number) => ({
      id: s.student_id,
      rank: index + 1,
      name: s.name,
      studentNo: s.identity_no || s.username,
      score: s.avg_score,
      trend: 0 // 后端暂无趋势数据
    }))

    // 更新统计信息
    const dataStats = data.statistics || {}
    stats.value = {
      avgScore: dataStats.avg_score || 0,
      maxScore: dataStats.max_score || 0,
      minScore: dataStats.min_score || 0,
      passRate: Math.round((dataStats.avg_score || 0) / 100 * 100), // 简化计算
    }
  } catch (error) {
    message.error('获取班级成绩失败')
  } finally {
    loading.value = false
  }
}

function getRankColor(rank: number): string {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return '#cd7f32'
  return 'default'
}

function getScoreClass(score: number): string {
  if (score >= 90) return 'score-excellent'
  if (score >= 60) return 'score-pass'
  return 'score-fail'
}

function getTrendClass(trend: number): string {
  if (trend > 0) return 'trend-up'
  if (trend < 0) return 'trend-down'
  return 'trend-flat'
}

function handleBack() {
  router.back()
}

async function handleExport() {
  try {
    const res = await exportClassScores(classId)
    const data = res.data || []
    
    // 转换为CSV并下载
    const csvContent = convertToCSV(data)
    downloadCSV(csvContent, `班级成绩_${className.value}.csv`)
    
    message.success('成绩导出成功')
  } catch (error) {
    message.error('导出失败')
  }
}

// 添加辅助函数
function convertToCSV(data: any[]) {
  if (!data.length) return ''
  const headers = Object.keys(data[0])
  const rows = data.map(row => headers.map(h => row[h]).join(','))
  return [headers.join(','), ...rows].join('\n')
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

onMounted(fetchClassScores)
</script>

<style scoped lang="less">
.class-scores-page {
  padding: 24px;
}

.stats-row {
  margin: 24px 0;
}

.stat-card {
  text-align: center;
  .stat-value {
    font-size: 32px;
    font-weight: bold;
    color: #1890ff;
  }
  .stat-label {
    margin-top: 8px;
    color: #666;
  }
}

.table-card {
  margin-top: 16px;
}

.score-excellent {
  color: #52c41a;
  font-weight: bold;
}

.score-pass {
  color: #1890ff;
}

.score-fail {
  color: #ff4d4f;
}

.trend-up {
  color: #52c41a;
}

.trend-down {
  color: #ff4d4f;
}

.trend-flat {
  color: #999;
}
</style>
