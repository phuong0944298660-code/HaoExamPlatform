<template>
  <div class="classes-page">
    <!-- 页面标题 -->
    <a-page-header title="班级管理" sub-title="管理您的班级和学生">
      <template #extra>
        <a-button type="primary" @click="showCreateModal">
          <PlusOutlined />
          创建班级
        </a-button>
      </template>
    </a-page-header>

    <!-- 统计卡片 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-value">{{ classList.length }}</div>
          <div class="stat-label">我的班级</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-value">{{ totalStudents }}</div>
          <div class="stat-label">学生总数</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-value">{{ avgScore }}</div>
          <div class="stat-label">班级均分</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-value">{{ activeExams }}</div>
          <div class="stat-label">进行中考次</div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 班级列表 -->
    <a-card :bordered="false" class="classes-card">
      <a-row :gutter="16">
        <a-col v-for="cls in classList" :key="cls.id" :span="8" class="class-col">
          <a-card hoverable class="class-card" @click="goToClassDetail(cls)">
            <div class="class-header">
              <div class="class-name">{{ cls.class_name || cls.name }}</div>
              <a-tag :color="cls.grade_group === 'primary' ? 'green' : 'blue'">
                {{ cls.grade }}
              </a-tag>
            </div>
            <div class="class-info">
              <div class="info-item">
                <TeamOutlined />
                <span>{{ cls.student_count }} 人</span>
              </div>
              <div class="info-item">
                <BookOutlined />
                <span>{{ cls.exam_count || 0 }} 场考试</span>
              </div>
              <div class="info-item">
                <TrophyOutlined />
                <span>均分 {{ cls.avg_score || '-' }}</span>
              </div>
            </div>
            <div class="class-actions">
              <a-button type="link" size="small" @click.stop="viewStudents(cls)">
                查看学生
              </a-button>
              <a-button type="link" size="small" @click.stop="viewScores(cls)">
                班级成绩
              </a-button>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-card>

    <!-- 创建班级弹窗 -->
    <a-modal
      v-model:open="createModalVisible"
      title="创建班级"
      @ok="handleCreateClass"
      @cancel="createModalVisible = false"
    >
      <a-form :model="createForm" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="班级名称" required>
          <a-input v-model:value="createForm.name" placeholder="如：高一(1)班" />
        </a-form-item>
        <a-form-item label="年级" required>
          <a-select v-model:value="createForm.grade" placeholder="选择年级">
            <a-select-option value="高一">高一</a-select-option>
            <a-select-option value="高二">高二</a-select-option>
            <a-select-option value="高三">高三</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="createForm.description" :rows="3" placeholder="班级描述（选填）" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  TeamOutlined,
  BookOutlined,
  TrophyOutlined,
} from '@ant-design/icons-vue'

import { getClasses, createClass, updateClass, deleteClass } from '@/api/classes'

const router = useRouter()
const loading = ref(false)

const classList = ref<any[]>([])

const totalStudents = computed(() => classList.value.reduce((sum, c) => sum + c.student_count, 0))
const avgScore = computed(() => {
  const validClasses = classList.value.filter(c => c.avg_score && c.avg_score > 0)
  if (validClasses.length === 0) return '-'
  const total = validClasses.reduce((sum, c) => sum + (c.avg_score || 0) * (c.student_count || 0), 0)
  const count = validClasses.reduce((sum, c) => sum + (c.student_count || 0), 0)
  return count > 0 ? (total / count).toFixed(1) : '-'
})
const activeExams = computed(() => {
  // 从班级数据中统计进行中的考试，如果没有数据则显示 -
  const total = classList.value.reduce((sum, c) => sum + (c.active_exam_count || 0), 0)
  return total > 0 ? total : '-'
})

// 创建班级
const createModalVisible = ref(false)
const createForm = ref({ name: '', grade: '', description: '' })

function showCreateModal() {
  createModalVisible.value = true
  createForm.value = { name: '', grade: '', description: '' }
}

async function handleCreateClass() {
  if (!createForm.value.name || !createForm.value.grade) {
    message.error('请填写完整信息')
    return
  }
  
  try {
    await createClass(createForm.value)
    message.success('班级创建成功')
    fetchClassList()
    createModalVisible.value = false
  } catch (error) {
    message.error('班级创建失败')
    console.error('[Classes] 创建班级失败:', error)
  }
}

// ── 数据加载 ──
async function fetchClassList() {
  loading.value = true
  try {
    const res = await getClasses()
    classList.value = res.data?.list || res.data?.items || []
  } catch (error) {
    message.error('获取班级列表失败')
    console.error('[Classes] 获取班级列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 跳转
function goToClassDetail(cls: any) {
  router.push(`/teacher/classes/${cls.id}`)
}

function viewStudents(cls: any) {
  router.push(`/teacher/classes/${cls.id}`)
}

function viewScores(cls: any) {
  router.push(`/teacher/classes/${cls.id}/scores`)
}

// ── 生命周期 ──
onMounted(() => {
  fetchClassList()
})
</script>

<style scoped lang="less">
.classes-page {
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

.classes-card {
  margin-top: 16px;
}

.class-col {
  margin-bottom: 16px;
}

.class-card {
  cursor: pointer;
  .class-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    .class-name {
      font-size: 18px;
      font-weight: 500;
    }
  }
  .class-info {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
    .info-item {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #666;
      font-size: 14px;
    }
  }
  .class-actions {
    display: flex;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
  }
}
</style>
