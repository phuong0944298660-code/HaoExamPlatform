<template>
  <div class="student-detail-page">
    <!-- 页面标题 -->
    <a-page-header
      title="学生详情"
      @back="goBack"
    />

    <!-- 学生基本信息 -->
    <a-card :bordered="false" class="info-card">
      <div class="student-header">
        <a-avatar :size="80" style="background-color: #1890ff; font-size: 32px;">
          {{ studentInfo.name?.charAt(0) }}
        </a-avatar>
        <div class="student-meta">
          <h2>{{ studentInfo.name }}</h2>
          <p class="student-no">学号: {{ studentInfo.student_no }}</p>
          <p class="student-class">{{ studentInfo.grade }} {{ studentInfo.class_name }}</p>
        </div>
        <div class="student-stats">
          <div class="stat-item">
            <div class="stat-value">{{ studentInfo.avg_score }}</div>
            <div class="stat-label">平均分</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ studentInfo.total_exams }}</div>
            <div class="stat-label">参考次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ studentInfo.class_rank }}</div>
            <div class="stat-label">班级排名</div>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 成绩趋势图 -->
    <a-row :gutter="16" class="charts-row">
      <a-col :span="16">
        <a-card title="成绩趋势" :bordered="false">
          <div ref="trendChart" style="height: 300px;"></div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="成绩分布" :bordered="false">
          <div ref="distributionChart" style="height: 300px;"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 考试记录 -->
    <a-card title="考试记录" :bordered="false" class="history-card">
      <a-table
        :columns="columns"
        :data-source="examHistory"
        :pagination="{ pageSize: 10 }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'score'">
            <span :class="['score', getScoreClass(record.score)]">
              {{ record.score }}
            </span>
          </template>
          <template v-if="column.key === 'class_rank'">
            <a-tag :color="record.class_rank <= 10 ? 'green' : record.class_rank <= 30 ? 'blue' : 'default'">
              {{ record.class_rank }}/{{ record.class_total }}
            </a-tag>
          </template>
          <template v-if="column.key === 'trend'">
            <span :class="['trend', record.trend > 0 ? 'up' : record.trend < 0 ? 'down' : 'flat']">
              {{ record.trend > 0 ? '↑' : record.trend < 0 ? '↓' : '→' }} {{ Math.abs(record.trend) || '-' }}
            </span>
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" size="small" @click="viewExamDetail(record)">
              查看试卷
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 知识点掌握情况 -->
    <a-card title="知识点掌握情况" :bordered="false" class="knowledge-card">
      <a-row :gutter="16">
        <a-col v-for="item in knowledgeStats" :key="item.name" :span="8">
          <div class="knowledge-item">
            <div class="knowledge-name">{{ item.name }}</div>
            <a-progress
              :percent="item.mastery"
              :status="item.mastery >= 80 ? 'success' : item.mastery >= 60 ? 'normal' : 'exception'"
              :stroke-color="item.mastery >= 80 ? '#52c41a' : item.mastery >= 60 ? '#1890ff' : '#ff4d4f'"
            />
            <div class="knowledge-detail">
              <span>正确率: {{ item.correct_rate }}%</span>
              <span>做题数: {{ item.total_questions }}</span>
            </div>
          </div>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 学生信息
const studentInfo = ref({
  id: 1,
  name: '张三',
  student_no: '202401001',
  grade: '高一',
  class_name: '(1)班',
  avg_score: 85.5,
  total_exams: 12,
  class_rank: 8,
})

// 考试历史
const examHistory = ref([
  { id: 1, exam_name: '期中数学考试', date: '2024-04-15', score: 92, class_rank: 5, class_total: 45, trend: 5 },
  { id: 2, exam_name: '月考测试', date: '2024-03-28', score: 87, class_rank: 12, class_total: 45, trend: -2 },
  { id: 3, exam_name: '单元测试-函数', date: '2024-03-10', score: 90, class_rank: 8, class_total: 45, trend: 3 },
  { id: 4, exam_name: '单元测试-集合', date: '2024-02-25', score: 85, class_rank: 15, class_total: 45, trend: 0 },
  { id: 5, exam_name: '期末模拟考试', date: '2024-01-20', score: 88, class_rank: 10, class_total: 45, trend: 8 },
])

// 知识点统计
const knowledgeStats = ref([
  { name: '函数与方程', mastery: 85, correct_rate: 82, total_questions: 45 },
  { name: '立体几何', mastery: 72, correct_rate: 75, total_questions: 38 },
  { name: '概率统计', mastery: 90, correct_rate: 88, total_questions: 42 },
  { name: '数列', mastery: 65, correct_rate: 62, total_questions: 35 },
  { name: '三角函数', mastery: 78, correct_rate: 76, total_questions: 40 },
  { name: '平面向量', mastery: 82, correct_rate: 80, total_questions: 36 },
])

// 表格列
const columns = [
  { title: '考试名称', dataIndex: 'exam_name', key: 'exam_name' },
  { title: '考试时间', dataIndex: 'date', key: 'date', width: 120 },
  { title: '成绩', key: 'score', width: 100 },
  { title: '班级排名', key: 'class_rank', width: 120 },
  { title: '趋势', key: 'trend', width: 80 },
  { title: '操作', key: 'action', width: 100 },
]

function getScoreClass(score: number) {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 60) return 'pass'
  return 'fail'
}

function viewExamDetail(record: any) {
  // 查看试卷详情
}

function goBack() {
  router.back()
}

const trendChart = ref()
const distributionChart = ref()

onMounted(() => {
  // 这里可以初始化 ECharts 图表
  // 由于条件限制，暂时留空，实际使用时引入 echarts 初始化
})
</script>

<style scoped lang="less">
.student-detail-page {
  padding: 24px;
}

.info-card {
  margin-bottom: 24px;
  .student-header {
    display: flex;
    align-items: center;
    gap: 24px;
    .student-meta {
      flex: 1;
      h2 {
        margin: 0 0 8px;
        font-size: 24px;
      }
      .student-no, .student-class {
        margin: 4px 0;
        color: #666;
      }
    }
    .student-stats {
      display: flex;
      gap: 48px;
      .stat-item {
        text-align: center;
        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #1890ff;
        }
        .stat-label {
          margin-top: 4px;
          color: #666;
        }
      }
    }
  }
}

.charts-row {
  margin-bottom: 24px;
}

.history-card {
  margin-bottom: 24px;
  .score {
    font-weight: bold;
    font-size: 16px;
    &.excellent { color: #52c41a; }
    &.good { color: #1890ff; }
    &.pass { color: #faad14; }
    &.fail { color: #ff4d4f; }
  }
  .trend {
    &.up { color: #52c41a; }
    &.down { color: #ff4d4f; }
    &.flat { color: #999; }
  }
}

.knowledge-card {
  .knowledge-item {
    margin-bottom: 24px;
    padding: 16px;
    background: #f5f5f5;
    border-radius: 8px;
    .knowledge-name {
      font-weight: 500;
      margin-bottom: 8px;
    }
    .knowledge-detail {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;
      color: #666;
    }
  }
}
</style>
