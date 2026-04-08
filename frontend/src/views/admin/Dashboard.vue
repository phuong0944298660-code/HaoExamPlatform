<template>
  <div class="admin-dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="welcome-left">
          <h1 class="welcome-title">👋 欢迎使用接力教育智慧云平台</h1>
          <p class="welcome-subtitle">今天是 {{ currentDate }}，您有 {{ pendingTasks.length }} 个待办事项需要处理</p>
        </div>
        <div class="welcome-actions">
          <a-button type="primary" size="large" @click="createExam">
            <template #icon><PlusOutlined /></template>
            创建考试
          </a-button>
          <a-button size="large" @click="generateAccounts">
            <template #icon><UserAddOutlined /></template>
            批量生成账号
          </a-button>
        </div>
      </div>
    </div>

    <!-- 核心统计区域 - 账号统计（按学段分组） -->
    <div class="section-title">账号统计</div>
    <div class="stats-section">
      <a-row :gutter="[16, 16]">
        <!-- 小学组 -->
        <a-col :xs="24" :sm="12" :md="6">
          <div class="stat-card primary-school">
            <div class="stat-header">
              <div class="stat-icon school-icon primary">
                <ReadOutlined />
              </div>
              <div class="stat-school-tag">小学组</div>
            </div>
            <div class="stat-body">
              <div class="stat-item">
                <div class="stat-item-value">{{ accountStats.primary.practice }}</div>
                <div class="stat-item-label">练习账号</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="stat-item-value">{{ accountStats.primary.exam }}</div>
                <div class="stat-item-label">考试账号</div>
              </div>
            </div>
            <div class="stat-footer">
              总计：<span class="stat-total">{{ accountStats.primary.total }}</span> 账号
            </div>
          </div>
        </a-col>

        <!-- 初中组 -->
        <a-col :xs="24" :sm="12" :md="6">
          <div class="stat-card middle-school">
            <div class="stat-header">
              <div class="stat-icon school-icon middle">
                <ExperimentOutlined />
              </div>
              <div class="stat-school-tag">初中组</div>
            </div>
            <div class="stat-body">
              <div class="stat-item">
                <div class="stat-item-value">{{ accountStats.middle.practice }}</div>
                <div class="stat-item-label">练习账号</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="stat-item-value">{{ accountStats.middle.exam }}</div>
                <div class="stat-item-label">考试账号</div>
              </div>
            </div>
            <div class="stat-footer">
              总计：<span class="stat-total">{{ accountStats.middle.total }}</span> 账号
            </div>
          </div>
        </a-col>

        <!-- 激活码统计 -->
        <a-col :xs="24" :sm="12" :md="6">
          <div class="stat-card activation-code">
            <div class="stat-header">
              <div class="stat-icon code-icon">
                <KeyOutlined />
              </div>
              <div class="stat-school-tag">激活码</div>
            </div>
            <div class="stat-body">
              <div class="stat-item">
                <div class="stat-item-value">{{ activationStats.teacher }}</div>
                <div class="stat-item-label">教师</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="stat-item-value">{{ activationStats.student }}</div>
                <div class="stat-item-label">学生</div>
              </div>
            </div>
            <div class="stat-footer">
              剩余：<span class="stat-total">{{ activationStats.remaining }}</span> 未使用
            </div>
          </div>
        </a-col>

        <!-- 在线统计 -->
        <a-col :xs="24" :sm="12" :md="6">
          <div class="stat-card online-users">
            <div class="stat-header">
              <div class="stat-icon online-icon">
                <ThunderboltOutlined />
              </div>
              <div class="stat-school-tag">实时在线</div>
            </div>
            <div class="stat-body">
              <div class="stat-item">
                <div class="stat-item-value text-green">{{ onlineStats.current }}</div>
                <div class="stat-item-label">当前在线</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="stat-item-value text-orange">{{ onlineStats.peak }}</div>
                <div class="stat-item-label">今日峰值</div>
              </div>
            </div>
            <div class="stat-footer">
              比昨日 <span :class="onlineStats.change > 0 ? 'text-green' : 'text-red'">
                {{ onlineStats.change > 0 ? '+' : '' }}{{ onlineStats.change }}%
              </span>
            </div>
          </div>
        </a-col>
      </a-row>
    </div>

    <!-- 快捷操作区 - 按业务场景分组 -->
    <div class="section-title">快捷操作</div>
    <div class="quick-actions-section">
      <a-row :gutter="[16, 16]">
        <!-- 账号管理 -->
        <a-col :xs="24" :sm="12" :lg="8">
          <a-card class="action-card" :bordered="false">
            <template #title>
              <div class="action-card-title">
                <TeamOutlined class="title-icon account-icon" />
                <span>账号管理</span>
              </div>
            </template>
            <div class="action-list">
              <div class="action-item" @click="goTo('/accounts/practice')">
                <div class="action-item-icon"><UserAddOutlined /></div>
                <div class="action-item-content">
                  <div class="action-item-title">生成练习账号</div>
                  <div class="action-item-desc">批量生成 300-600 个赛前练习账号</div>
                </div>
                <RightOutlined class="action-item-arrow" />
              </div>
              <div class="action-item" @click="goTo('/accounts/exam')">
                <div class="action-item-icon"><IdcardOutlined /></div>
                <div class="action-item-content">
                  <div class="action-item-title">生成考试账号</div>
                  <div class="action-item-desc">身份证号为账号的赛中考试账号</div>
                </div>
                <RightOutlined class="action-item-arrow" />
              </div>
              <div class="action-item" @click="goTo('/accounts/activation-codes/generate')">
                <div class="action-item-icon"><KeyOutlined /></div>
                <div class="action-item-content">
                  <div class="action-item-title">生成激活码</div>
                  <div class="action-item-desc">四类激活码：小/初老师+学生</div>
                </div>
                <RightOutlined class="action-item-arrow" />
              </div>
            </div>
          </a-card>
        </a-col>

        <!-- 题库套卷 -->
        <a-col :xs="24" :sm="12" :lg="8">
          <a-card class="action-card" :bordered="false">
            <template #title>
              <div class="action-card-title">
                <DatabaseOutlined class="title-icon question-icon" />
                <span>题库套卷</span>
              </div>
            </template>
            <div class="action-list">
              <div class="action-item" @click="goTo('/questions/banks')">
                <div class="action-item-icon"><FileAddOutlined /></div>
                <div class="action-item-content">
                  <div class="action-item-title">题库管理</div>
                  <div class="action-item-desc">支持题库创建、题目管理与导入</div>
                </div>
                <RightOutlined class="action-item-arrow" />
              </div>
              <div class="action-item" @click="goTo('/papers/list')">
                <div class="action-item-icon"><FormOutlined /></div>
                <div class="action-item-content">
                  <div class="action-item-title">试卷管理</div>
                  <div class="action-item-desc">可视化组卷，智能配置规则</div>
                </div>
                <RightOutlined class="action-item-arrow" />
              </div>
              <div class="action-item" @click="goTo('/questions/import')">
                <div class="action-item-icon"><ImportOutlined /></div>
                <div class="action-item-content">
                  <div class="action-item-title">批量导入</div>
                  <div class="action-item-desc">Excel/Word 批量导入题目</div>
                </div>
                <RightOutlined class="action-item-arrow" />
              </div>
            </div>
          </a-card>
        </a-col>

        <!-- 考试管理 -->
        <a-col :xs="24" :sm="12" :lg="8">
          <a-card class="action-card" :bordered="false">
            <template #title>
              <div class="action-card-title">
                <CalendarOutlined class="title-icon exam-icon" />
                <span>考试管理</span>
              </div>
            </template>
            <div class="action-list">
              <div class="action-item" @click="goTo('/exams/create')">
                <div class="action-item-icon"><PlusCircleOutlined /></div>
                <div class="action-item-content">
                  <div class="action-item-title">创建考试</div>
                  <div class="action-item-desc">设置时间、规则、参考人员</div>
                </div>
                <RightOutlined class="action-item-arrow" />
              </div>
              <div class="action-item" @click="goTo('/exams/monitoring')">
                <div class="action-item-icon"><EyeOutlined /></div>
                <div class="action-item-content">
                  <div class="action-item-title">实时监控</div>
                  <div class="action-item-desc">实时查看考试状态和进度</div>
                </div>
                <RightOutlined class="action-item-arrow" />
              </div>
              <div class="action-item" @click="goTo('/scores/list')">
                <div class="action-item-icon"><TrophyOutlined /></div>
                <div class="action-item-content">
                  <div class="action-item-title">成绩管理</div>
                  <div class="action-item-desc">成绩统计、排名、导出</div>
                </div>
                <RightOutlined class="action-item-arrow" />
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 底部内容区 -->
    <div class="bottom-section">
      <a-row :gutter="[16, 16]">
        <!-- 待办事项 -->
        <a-col :xs="24" :lg="12" :xl="8">
          <a-card class="todo-card" :bordered="false" title="待办事项">
            <template #extra>
              <a-button type="link" size="small" @click="goTo('/exams/list')">查看全部</a-button>
            </template>
            <div class="todo-list">
              <div
                v-for="(task, index) in pendingTasks"
                :key="index"
                class="todo-item"
                :class="{ urgent: task.urgent }"
              >
                <div class="todo-status" :class="task.type">
                  <BellOutlined v-if="task.type === 'warning'" />
                  <ClockCircleOutlined v-else-if="task.type === 'info'" />
                  <CheckCircleOutlined v-else />
                </div>
                <div class="todo-content">
                  <div class="todo-title">{{ task.title }}</div>
                  <div class="todo-meta">
                    <span class="todo-time">{{ task.time }}</span>
                    <a-tag :color="task.tagColor" size="small">{{ task.tag }}</a-tag>
                  </div>
                </div>
                <a-button type="link" size="small" @click="handleTask(task)">处理</a-button>
              </div>
              <a-empty v-if="pendingTasks.length === 0" description="暂无待办事项" />
            </div>
          </a-card>
        </a-col>

        <!-- 考试场次分布图表 -->
        <a-col :xs="24" :lg="12" :xl="10">
          <a-card class="chart-card" :bordered="false" title="考试场次分布">
            <template #extra>
              <a-radio-group v-model:value="chartPeriod" size="small" button-style="solid">
                <a-radio-button value="week">本周</a-radio-button>
                <a-radio-button value="month">本月</a-radio-button>
                <a-radio-button value="year">全年</a-radio-button>
              </a-radio-group>
            </template>
            <div class="chart-container">
              <!-- 自定义柱状图 -->
              <div class="simple-bar-chart">
                <div
                  v-for="(item, index) in examDistribution"
                  :key="index"
                  class="bar-item"
                >
                  <div class="bar-wrapper">
                    <div
                      class="bar"
                      :style="{ height: item.percentage + '%', background: item.color }"
                    ></div>
                  </div>
                  <div class="bar-label">{{ item.label }}</div>
                  <div class="bar-value">{{ item.value }}</div>
                </div>
              </div>
              <div class="chart-legend">
                <div v-for="(item, index) in examDistribution" :key="index" class="legend-item">
                  <div class="legend-dot" :style="{ background: item.color }"></div>
                  <span>{{ item.label }}: {{ item.value }}场</span>
                </div>
              </div>
            </div>
          </a-card>
        </a-col>

        <!-- 系统通知 -->
        <a-col :xs="24" :lg="24" :xl="6">
          <a-card class="notice-card" :bordered="false" title="系统通知">
            <template #extra>
              <a-button type="link" size="small" @click="markAllRead">全部已读</a-button>
            </template>
            <div class="notice-list">
              <div
                v-for="(notice, index) in notices"
                :key="index"
                class="notice-item"
                :class="{ unread: !notice.read }"
                @click="readNotice(notice)"
              >
                <div class="notice-dot" v-if="!notice.read"></div>
                <div class="notice-content">
                  <div class="notice-title">{{ notice.title }}</div>
                  <div class="notice-time">{{ notice.time }}</div>
                </div>
              </div>
              <a-empty v-if="notices.length === 0" description="暂无通知" />
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 近期考试 -->
    <div class="section-title">近期考试</div>
    <a-card class="recent-exam-card" :bordered="false">
      <a-table
        :columns="examColumns"
        :dataSource="recentExams"
        :pagination="{ pageSize: 5, size: 'small' }"
        :scroll="{ x: 'max-content' }"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="exam-name-cell">
              <div class="exam-grade-tag" :class="record.grade">{{ record.gradeLabel }}</div>
              <span class="exam-name">{{ record.name }}</span>
            </div>
          </template>
          <template v-if="column.key === 'status'">
            <a-badge :status="getStatusType(record.status)" :text="getStatusText(record.status)" />
          </template>
          <template v-if="column.key === 'participants'">
            <div class="participants-cell">
              <span class="joined">{{ record.joined }}</span>
              <span class="divider">/</span>
              <span class="total">{{ record.totalParticipants }}</span>
              <a-progress
                :percent="Math.round((record.joined / record.totalParticipants) * 100)"
                :show-info="false"
                size="small"
                class="participant-progress"
              />
            </div>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="viewExam(record)">查看</a-button>
              <a-button type="link" size="small" @click="monitorExam(record)">监控</a-button>
              <a-dropdown>
                <a-button type="link" size="small">更多<DownOutlined /></a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="editExam(record)">编辑</a-menu-item>
                    <a-menu-item @click="exportResults(record)">导出成绩</a-menu-item>
                    <a-menu-divider />
                    <a-menu-item danger @click="deleteExam(record)">删除</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="暂无考试数据" />
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import request from '@/utils/request'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  UserAddOutlined,
  TeamOutlined,
  DatabaseOutlined,
  CalendarOutlined,
  KeyOutlined,
  ReadOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  FileAddOutlined,
  FormOutlined,
  ImportOutlined,
  PlusCircleOutlined,
  EyeOutlined,
  TrophyOutlined,
  RightOutlined,
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  IdcardOutlined,
  DownOutlined,
} from '@ant-design/icons-vue'

const router = useRouter()
const userStore = useUserStore()

// 当前日期
const currentDate = ref('')
const chartPeriod = ref('week')

// 账号统计（区分小学/初中、练习/考试）
const accountStats = ref({
  primary: { practice: 0, exam: 0, total: 0 },
  middle: { practice: 0, exam: 0, total: 0 },
})

// 激活码统计
const activationStats = ref({
  teacher: 0,
  student: 0,
  remaining: 0,
})

// 在线统计
const onlineStats = ref({
  current: 0,
  peak: 0,
  change: 0,
})

// 待办事项
const pendingTasks = ref([
  {
    title: '小学组激活码即将用完，请及时补充',
    time: '10分钟前',
    type: 'warning',
    tag: '紧急',
    tagColor: 'red',
    urgent: true,
  },
  {
    title: '明日 14:00 有 "数学能力测试" 考试',
    time: '1小时前',
    type: 'info',
    tag: '提醒',
    tagColor: 'blue',
    urgent: false,
  },
  {
    title: '初中组题库需要补充主观题',
    time: '3小时前',
    type: 'default',
    tag: '待办',
    tagColor: 'default',
    urgent: false,
  },
])

// 考试分布数据
const examDistribution = ref([
  { label: '模拟考试', value: 12, percentage: 80, color: '#5470c6' },
  { label: '单元测试', value: 28, percentage: 100, color: '#91cc75' },
  { label: '期中考试', value: 8, percentage: 40, color: '#fac858' },
  { label: '期末考试', value: 4, percentage: 25, color: '#ee6666' },
  { label: '竞赛考试', value: 6, percentage: 35, color: '#73c0de' },
])

// 系统通知
const notices = ref([
  { title: '系统将于今晚 02:00 进行维护升级', time: '10分钟前', read: false },
  { title: '新增题库导入功能，支持批量上传', time: '2小时前', read: false },
  { title: '账号激活码有效期调整为 7 天', time: '昨天', read: true },
  { title: '接力教育智慧云平台 v2.0 正式上线', time: '3天前', read: true },
])

// 近期考试
const recentExams = ref<any[]>([])

const examColumns = [
  { title: '考试名称', dataIndex: 'name', key: 'name', width: 250 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 160 },
  { title: '时长', dataIndex: 'duration', key: 'duration', width: 80 },
  { title: '参考情况', dataIndex: 'participants', key: 'participants', width: 180 },
  { title: '组卷人', dataIndex: 'creator', key: 'creator', width: 100 },
  { title: '操作', key: 'action', fixed: 'right', width: 200 },
]

// 获取状态类型
function getStatusType(status: string) {
  const map: Record<string, string> = {
    upcoming: 'warning',
    active: 'processing',
    ended: 'default',
    grading: 'default',
  }
  return map[status] || 'default'
}

// 获取状态文本
function getStatusText(status: string) {
  const map: Record<string, string> = {
    upcoming: '待开始',
    active: '进行中',
    ended: '已结束',
    grading: '阅卷中',
  }
  return map[status] || status
}

// 获取统计数据
async function fetchStats() {
  try {
    const res = await request.get('/dashboard/stats')
    const data = res.data
    
    accountStats.value = {
      primary: {
        practice: data.primaryPractice ?? 0,
        exam: data.primaryExam ?? 0,
        total: (data.primaryPractice ?? 0) + (data.primaryExam ?? 0),
      },
      middle: {
        practice: data.middlePractice ?? 0,
        exam: data.middleExam ?? 0,
        total: (data.middlePractice ?? 0) + (data.middleExam ?? 0),
      },
    }

    activationStats.value = {
      teacher: data.teacherCodes ?? 0,
      student: data.studentCodes ?? 0,
      remaining: data.remainingCodes ?? 0,
    }

    onlineStats.value = {
      current: data.onlineCurrent ?? 0,
      peak: data.onlinePeak ?? 0,
      change: data.onlineChange ?? 0,
    }
  } catch (err) {
    console.error('获取统计失败', err)
    // API 失败时显示 0，不使用假数据
    accountStats.value = {
      primary: { practice: 0, exam: 0, total: 0 },
      middle: { practice: 0, exam: 0, total: 0 },
    }
    activationStats.value = { teacher: 0, student: 0, remaining: 0 }
    onlineStats.value = { current: 0, peak: 0, change: 0 }
  }
}

// 获取近期考试
async function fetchRecentExams() {
  try {
    const res = await request.get('/dashboard/recent-exams')
    recentExams.value = res.data || []
  } catch (err) {
    console.error('获取考试列表失败', err)
    recentExams.value = []
  }
}

// 导航方法
function createExam() { router.push('/exams/create') }
function generateAccounts() { router.push('/accounts/practice') }
function goTo(path: string) { router.push(path) }
function viewExam(exam: any) { router.push(`/admin/exams/${exam.id}`) }
function monitorExam(exam: any) { router.push(`/admin/exams/monitoring?id=${exam.id}`) }
function editExam(exam: any) { router.push(`/admin/exams/${exam.id}/edit`) }
function exportResults(exam: any) { message.info('导出成绩功能开发中...') }
function deleteExam(exam: any) { message.info('删除考试功能开发中...') }
function handleTask(task: any) { message.info(`处理: ${task.title}`) }
function readNotice(notice: any) { notice.read = true }
function markAllRead() { notices.value.forEach(n => n.read = true) }

// 更新时间
function updateDate() {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }
  currentDate.value = now.toLocaleDateString('zh-CN', options)
}

let timer: number

onMounted(() => {
  fetchStats()
  fetchRecentExams()
  updateDate()
  timer = window.setInterval(updateDate, 60000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.admin-dashboard {
  width: 100%;
}

/* 区域标题 */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 3px solid #1890ff;
}

/* 欢迎区域 */
.welcome-section {
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  color: #fff;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #ffffff;
}

.welcome-subtitle {
  font-size: 14px;
  opacity: 1;
  margin: 0;
  color: #ffffff;
}

.welcome-actions {
  display: flex;
  gap: 12px;
}

.welcome-actions :deep(.ant-btn) {
  border-radius: 6px;
}

.welcome-actions :deep(.ant-btn-primary) {
  background: #fff;
  color: #1890ff;
  border: none;
}

.welcome-actions :deep(.ant-btn-primary:hover) {
  background: #f0f0f0;
  color: #1890ff;
}

/* 统计区域 */
.stats-section {
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  height: 100%;
}

.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.school-icon.primary {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
}

.school-icon.middle {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.code-icon {
  background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
}

.online-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-school-tag {
  background: #f0f0f0;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #595959;
}

.stat-body {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  text-align: center;
}

.stat-item-value {
  font-size: 28px;
  font-weight: 700;
  color: #262626;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-item-value.text-green {
  color: #52c41a;
}

.stat-item-value.text-orange {
  color: #fa8c16;
}

.stat-item-value.text-red {
  color: #f5222d;
}

.stat-item-label {
  font-size: 12px;
  color: #8c8c8c;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #e8e8e8;
}

.stat-footer {
  text-align: center;
  padding-top: 12px;
  font-size: 13px;
  color: #8c8c8c;
}

.stat-total {
  font-weight: 600;
  color: #262626;
}

/* 快捷操作区域 */
.quick-actions-section {
  margin-bottom: 24px;
}

.action-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  height: 100%;
}

.action-card :deep(.ant-card-head) {
  border-bottom: none;
  padding: 16px 20px 0;
}

.action-card :deep(.ant-card-body) {
  padding: 16px 20px 20px;
}

.action-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}

.title-icon {
  font-size: 18px;
}

.title-icon.account-icon {
  color: #1890ff;
}

.title-icon.question-icon {
  color: #52c41a;
}

.title-icon.exam-icon {
  color: #fa8c16;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-item:hover {
  background: #f5f7fa;
}

.action-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f0f5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1890ff;
  font-size: 18px;
  flex-shrink: 0;
}

.action-item-content {
  flex: 1;
  min-width: 0;
}

.action-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 2px;
}

.action-item-desc {
  font-size: 12px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-item-arrow {
  color: #bfbfbf;
  font-size: 12px;
}

/* 底部内容区 */
.bottom-section {
  margin-bottom: 24px;
}

.todo-card,
.chart-card,
.notice-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  height: 100%;
}

.todo-card :deep(.ant-card-head),
.chart-card :deep(.ant-card-head),
.notice-card :deep(.ant-card-head) {
  font-weight: 600;
}

/* 待办事项 */
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;
}

.todo-item.urgent {
  background: #fff2f0;
  border: 1px solid #ffccc7;
}

.todo-status {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.todo-status.warning {
  background: #fff2f0;
  color: #f5222d;
}

.todo-status.info {
  background: #e6f7ff;
  color: #1890ff;
}

.todo-status.default {
  background: #f0f0f0;
  color: #8c8c8c;
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title {
  font-size: 14px;
  color: #262626;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #8c8c8c;
}

/* 图表容器 */
.chart-container {
  padding: 16px 0;
}

.simple-bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 150px;
  padding-bottom: 40px;
  position: relative;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-wrapper {
  width: 32px;
  height: 120px;
  background: #f0f0f0;
  border-radius: 4px 4px 0 0;
  position: relative;
  overflow: hidden;
}

.bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
}

.bar-label {
  position: absolute;
  bottom: 8px;
  font-size: 11px;
  color: #8c8c8c;
  white-space: nowrap;
}

.bar-value {
  position: absolute;
  top: -20px;
  font-size: 12px;
  font-weight: 500;
  color: #262626;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #595959;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

/* 通知列表 */
.notice-list {
  max-height: 280px;
  overflow-y: auto;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.3s;
}

.notice-item:last-child {
  border-bottom: none;
}

.notice-item:hover {
  background: #fafafa;
}

.notice-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1890ff;
  margin-top: 6px;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 13px;
  color: #262626;
  line-height: 1.5;
  margin-bottom: 4px;
}

.notice-time {
  font-size: 11px;
  color: #8c8c8c;
}

.notice-item.unread .notice-title {
  font-weight: 500;
}

/* 近期考试表格 */
.recent-exam-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.recent-exam-card :deep(.ant-card-body) {
  padding: 0;
}

.exam-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.exam-grade-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.exam-grade-tag.primary {
  background: #fff2f0;
  color: #f5222d;
}

.exam-grade-tag.middle {
  background: #e6f7ff;
  color: #1890ff;
}

.exam-name {
  font-weight: 500;
}

.participants-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.participants-cell .joined {
  color: #52c41a;
  font-weight: 500;
}

.participants-cell .divider {
  color: #d9d9d9;
}

.participants-cell .total {
  color: #8c8c8c;
}

.participant-progress {
  width: 60px;
}

/* 响应式 */
@media (max-width: 768px) {
  .welcome-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .welcome-title {
    font-size: 18px;
  }

  .stat-item-value {
    font-size: 22px;
  }

  .simple-bar-chart {
    height: 120px;
  }

  .bar-wrapper {
    width: 24px;
    height: 100px;
  }
}
</style>
