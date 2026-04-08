<template>
  <div class="class-students-page">
    <!-- 页面标题 -->
    <a-page-header
      :title="`${classInfo.name} - 学生管理`"
      sub-title="管理班级学生和查看成绩"
      @back="goBack"
    >
      <template #extra>
        <a-space>
          <a-button @click="showAddModal">
            <PlusOutlined />
            添加学生
          </a-button>
          <a-button type="primary" @click="exportData">
            <DownloadOutlined />
            导出成绩
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <!-- 班级统计 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-value">{{ studentList.length }}</div>
          <div class="stat-label">学生人数</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-value">{{ classInfo.avg_score }}</div>
          <div class="stat-label">班级均分</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-value">{{ highestScore }}</div>
          <div class="stat-label">最高分</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-value">{{ passRate }}%</div>
          <div class="stat-label">及格率</div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 搜索和筛选 -->
    <a-card :bordered="false" class="search-card">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-input
            v-model:value="searchKeyword"
            placeholder="搜索学生姓名/学号"
            allow-clear
            @pressEnter="handleSearch"
          >
            <template #prefix><SearchOutlined /></template>
          </a-input>
        </a-col>
        <a-col :span="4">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 学生列表 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data-source="filteredStudentList"
        :pagination="pagination"
        row-key="id"
        :loading="loading"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="student-name">
              <a-avatar :size="32" style="background-color: #1890ff; margin-right: 8px;">
                {{ record.name.charAt(0) }}
              </a-avatar>
              <div>
                <div>{{ record.name }}</div>
                <div class="student-no">{{ record.student_no }}</div>
              </div>
            </div>
          </template>
          <template v-if="column.key === 'trend'">
            <div :class="['trend', record.trend > 0 ? 'up' : record.trend < 0 ? 'down' : 'flat']">
              <ArrowUpOutlined v-if="record.trend > 0" />
              <ArrowDownOutlined v-else-if="record.trend < 0" />
              <MinusOutlined v-else />
              {{ Math.abs(record.trend) }}
            </div>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="viewStudentDetail(record)">
                详情
              </a-button>
              <a-button type="link" size="small" @click="viewHistory(record)">
                成绩历史
              </a-button>
              <a-button type="link" size="small" danger @click="removeStudent(record)">
                移出班级
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 学生成绩历史弹窗 -->
    <a-modal
      v-model:open="historyModalVisible"
      :title="`${currentStudent?.name} - 成绩历史`"
      width="800"
      :footer="null"
    >
      <a-timeline v-if="currentStudent?.history?.length">
        <a-timeline-item v-for="(item, index) in currentStudent.history" :key="index">
          <div class="history-item">
            <div class="history-header">
              <span class="exam-name">{{ item.exam_name }}</span>
              <span class="exam-date">{{ item.date }}</span>
            </div>
            <div class="history-score">
              <span class="score" :class="getScoreClass(item.score)">{{ item.score }}分</span>
              <span class="rank">班级排名: {{ item.class_rank }}/{{ classInfo.student_count }}</span>
              <span class="trend" :class="item.trend > 0 ? 'up' : item.trend < 0 ? 'down' : 'flat'">
                {{ item.trend > 0 ? '↑' : item.trend < 0 ? '↓' : '→' }} {{ Math.abs(item.trend) || '-' }}
              </span>
            </div>
          </div>
        </a-timeline-item>
      </a-timeline>
      <a-empty v-else description="暂无考试记录" />
    </a-modal>

    <!-- 添加学生弹窗 -->
    <a-modal
      v-model:open="addModalVisible"
      title="添加学生到班级"
      width="700"
      @ok="handleAddStudents"
      @cancel="addModalVisible = false"
    >
      <a-transfer
        v-model:target-keys="selectedStudentKeys"
        :data-source="availableStudents"
        :titles="['可选学生', '已选学生']"
        :render="item => item.title"
        :filter-option="(inputValue, item) => item.title.indexOf(inputValue) !== -1"
        show-search
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  PlusOutlined,
  DownloadOutlined,
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
} from '@ant-design/icons-vue'
import type { TablePaginationConfig } from 'ant-design-vue'

import { 
  getClass, 
  getClassStudents, 
  addStudentToClass, 
  removeStudentFromClass,
  getAvailableStudents,
  exportClassScores
} from '@/api/classes'

const route = useRoute()
const router = useRouter()
const classId = computed(() => Number(route.params.classId))

const loading = ref(false)

// 班级信息
const classInfo = ref({
  id: 1,
  name: '高一(1)班',
  grade: '高一',
  student_count: 45,
  avg_score: 82.5,
})

// 学生列表
const studentList = ref<any[]>([])

// 计算属性
const highestScore = computed(() => {
  if (studentList.value.length === 0) return 0
  return Math.max(...studentList.value.map(s => s.recent_score || 0))
})

const passRate = computed(() => {
  if (studentList.value.length === 0) return 0
  const passed = studentList.value.filter(s => (s.recent_score || 0) >= 60).length
  return Math.round((passed / studentList.value.length) * 100)
})

// 搜索
const searchKeyword = ref('')
const filteredStudentList = computed(() => {
  if (!searchKeyword.value) return studentList.value
  const keyword = searchKeyword.value.toLowerCase()
  return studentList.value.filter((s: any) => 
    s.name?.toLowerCase().includes(keyword) || 
    s.identity_no?.includes(keyword) ||
    s.username?.includes(keyword)
  )
})

// 表格列
const columns = [
  { title: '学生', key: 'name', width: 200 },
  { title: '平均分', dataIndex: 'avg_score', width: 100, sorter: (a: any, b: any) => a.avg_score - b.avg_score },
  { title: '最近成绩', dataIndex: 'recent_score', width: 100, sorter: (a: any, b: any) => a.recent_score - b.recent_score },
  { title: '趋势', key: 'trend', width: 80 },
  { title: '参考次数', dataIndex: 'exam_count', width: 100 },
  { title: '及格次数', dataIndex: 'pass_count', width: 100 },
  { title: '操作', key: 'action', width: 200 },
]

const pagination: TablePaginationConfig = { 
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
}

// 加载班级和学生数据
async function fetchClassData() {
  loading.value = true
  try {
    // 获取班级信息
    const classRes = await getClass(classId.value)
    if (classRes.data) {
      classInfo.value = {
        id: classRes.data.id,
        name: classRes.data.class_name,
        grade: classRes.data.grade,
        grade_group: classRes.data.grade_group,
        student_count: classRes.data.student_count || 0,
        avg_score: classRes.data.avg_score || 0,
      }
    }
    
    // 获取班级学生列表
    const studentsRes = await getClassStudents(classId.value, {
      page: pagination.current || 1,
      size: pagination.pageSize || 10,
      search: searchKeyword.value
    })
    studentList.value = studentsRes.data?.items || []
    
    // 更新分页信息
    pagination.total = studentsRes.data?.total || 0
  } catch (error) {
    message.error('获取班级数据失败')
  } finally {
    loading.value = false
  }
}

// 历史记录弹窗
const historyModalVisible = ref(false)
const currentStudent = ref<any>(null)

function viewHistory(student: any) {
  currentStudent.value = student
  historyModalVisible.value = true
}

function getScoreClass(score: number) {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 60) return 'pass'
  return 'fail'
}

// 添加学生
const addModalVisible = ref(false)
const availableStudents = ref<{ key: string; title: string }[]>([])
const selectedStudentKeys = ref<string[]>([])

async function fetchAvailableStudents() {
  try {
    const res = await getAvailableStudents(classId.value, {
      page: 1,
      size: 100,
      grade_group: classInfo.value.grade_group
    })
    const students = res.data?.list || res.data?.items || []
    availableStudents.value = students.map((s: any) => ({
      key: String(s.id),
      title: `${s.name} - ${s.identity_no || s.username}`
    }))
  } catch (error) {
    message.error('获取可选学生列表失败')
  }
}

async function showAddModal() {
  addModalVisible.value = true
  await fetchAvailableStudents()
}

async function handleAddStudents() {
  try {
    for (const studentKey of selectedStudentKeys.value) {
      await addStudentToClass(classId.value, Number(studentKey))
    }
    message.success(`成功添加 ${selectedStudentKeys.value.length} 名学生`)
    addModalVisible.value = false
    selectedStudentKeys.value = []
    fetchClassData()
  } catch (error) {
    message.error('添加学生失败')
  }
}

// 其他操作
function viewStudentDetail(student: any) {
  router.push(`/teacher/students/${student.id}`)
}

async function removeStudent(student: any) {
  Modal.confirm({
    title: '确认移出班级',
    content: `确定将 ${student.name} 移出本班级吗？`,
    async onOk() {
      try {
        await removeStudentFromClass(classId.value, student.id)
        message.success('已移出班级')
        fetchClassData()
      } catch (error) {
        message.error('移出班级失败')
      }
    },
  })
}

async function exportData() {
  try {
    const res = await exportClassScores(classId.value)
    // 下载文件处理
    const data = res.data || []
    const csvContent = convertToCSV(data)
    downloadCSV(csvContent, `班级成绩_${classInfo.value.name}.csv`)
    message.success('成绩数据导出成功')
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

function handleSearch() {
  // 搜索已在前端计算属性中处理
}

function handleReset() {
  searchKeyword.value = ''
}

function goBack() {
  router.back()
}

onMounted(fetchClassData)
</script>

<style scoped lang="less">
.class-students-page {
  padding: 24px;
}

.stats-row {
  margin: 24px 0;
}

.stat-card {
  text-align: center;
  .stat-value {
    font-size: 28px;
    font-weight: bold;
    color: #1890ff;
  }
  .stat-label {
    margin-top: 8px;
    color: #666;
  }
}

.search-card {
  margin-bottom: 16px;
}

.student-name {
  display: flex;
  align-items: center;
  .student-no {
    font-size: 12px;
    color: #999;
  }
}

.trend {
  display: flex;
  align-items: center;
  gap: 4px;
  &.up { color: #52c41a; }
  &.down { color: #ff4d4f; }
  &.flat { color: #999; }
}

.history-item {
  .history-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    .exam-name {
      font-weight: 500;
    }
    .exam-date {
      color: #999;
      font-size: 14px;
    }
  }
  .history-score {
    display: flex;
    gap: 16px;
    align-items: center;
    .score {
      font-size: 18px;
      font-weight: bold;
      &.excellent { color: #52c41a; }
      &.good { color: #1890ff; }
      &.pass { color: #faad14; }
      &.fail { color: #ff4d4f; }
    }
    .rank {
      color: #666;
    }
    .trend {
      font-size: 14px;
      &.up { color: #52c41a; }
      &.down { color: #ff4d4f; }
    }
  }
}
</style>
