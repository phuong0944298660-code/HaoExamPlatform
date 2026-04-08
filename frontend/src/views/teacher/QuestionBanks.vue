<template>
  <div class="question-banks-page">
    <!-- 页面标题 -->
    <a-page-header title="题库管理" sub-title="管理您的题库资源">
      <template #extra>
        <a-button type="primary" @click="showCreateModal">
          <template #icon><PlusOutlined /></template>
          创建题库
        </a-button>
      </template>
    </a-page-header>

    <!-- 搜索和筛选区域 -->
    <a-card :bordered="false" class="filter-card">
      <a-row :gutter="16" align="middle">
        <a-col :span="8">
          <a-input-search
            v-model:value="searchQuery"
            placeholder="搜索题库名称"
            allow-clear
            @search="handleSearch"
          />
        </a-col>
        <a-col :span="5">
          <a-select
            v-model:value="filterGrade"
            placeholder="选择学段"
            allow-clear
            style="width: 100%"
            @change="handleFilterChange"
          >
            <a-select-option value="primary">小学</a-select-option>
            <a-select-option value="junior">初中</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="5">
          <a-select
            v-model:value="filterStatus"
            placeholder="选择状态"
            allow-clear
            style="width: 100%"
            @change="handleFilterChange"
          >
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="archived">归档</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="6" style="text-align: right">
          <a-button @click="resetFilters">重置筛选</a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 题库列表表格 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :data-source="bankList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 学段列 -->
          <template v-if="column.key === 'gradeGroup'">
            <a-tag :color="getGradeColor(record.grade_group)">
              {{ getGradeText(record.grade_group) }}
            </a-tag>
          </template>

          <!-- 状态列 -->
          <template v-if="column.key === 'status'">
            <a-badge
              :status="record.status === 'active' ? 'success' : 'default'"
              :text="record.status === 'active' ? '启用' : '归档'"
            />
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="viewDetail(record)">
                详情
              </a-button>
              <a-button type="link" size="small" @click="editBank(record)">
                编辑
              </a-button>
              <a-button 
                v-if="record.status === 'active'"
                type="link" 
                size="small"
                @click="showArchiveConfirm(record)"
              >
                归档
              </a-button>
              <a-button type="link" size="small" danger @click="showDeleteConfirm(record)">
                删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 创建/编辑题库弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEditing ? '编辑题库' : '创建题库'"
      ok-text="确定"
      cancel-text="取消"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
      >
        <a-form-item label="题库名称" name="name">
          <a-input
            v-model:value="formData.name"
            placeholder="请输入题库名称"
            maxlength="50"
            show-count
          />
        </a-form-item>
        <a-form-item label="适用学段" name="grade_group">
          <a-select v-model:value="formData.grade_group" placeholder="请选择学段">
            <a-select-option value="primary">小学</a-select-option>
            <a-select-option value="junior">初中</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="题库描述" name="description">
          <a-textarea
            v-model:value="formData.description"
            placeholder="请输入题库描述（选填）"
            :rows="3"
            maxlength="200"
            show-count
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, createVNode, h } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { getQuestionBanks, createQuestionBank, updateQuestionBank, deleteQuestionBank } from '@/api/questions'
import type { QuestionBank } from '@/types/api'

const router = useRouter()

// ── 表格列定义 ──
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '题库名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '学段', key: 'gradeGroup', width: 100 },
  { title: '题目数量', dataIndex: 'total_questions', key: 'totalQuestions', width: 100 },
  { title: '创建时间', dataIndex: 'created_at', key: 'createdAt', width: 180 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' },
]

// ── 数据状态 ──
const loading = ref(false)
const bankList = ref<QuestionBank[]>([])
const searchQuery = ref('')
const filterGrade = ref<string | undefined>(undefined)
const filterStatus = ref<string | undefined>(undefined)

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

// ── 弹窗状态 ──
const modalVisible = ref(false)
const modalLoading = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const formData = reactive({
  name: '',
  grade_group: undefined as string | undefined,
  description: '',
})

const formRules = {
  name: [{ required: true, message: '请输入题库名称', trigger: 'blur' }],
  grade_group: [{ required: true, message: '请选择学段', trigger: 'change' }],
}

// ── 工具函数 ──
function getGradeColor(grade: string): string {
  const colorMap: Record<string, string> = {
    primary: 'green',
    junior: 'blue',
  }
  return colorMap[grade] || 'default'
}

function getGradeText(grade: string): string {
  const textMap: Record<string, string> = {
    primary: '小学',
    junior: '初中',
  }
  return textMap[grade] || grade
}

// ── 数据加载 ──
async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      size: pagination.pageSize,
      search: searchQuery.value || undefined,
      grade_group: filterGrade.value,
      status: filterStatus.value,
    }
    const res = await getQuestionBanks(params)
    bankList.value = res.data?.list || res.data?.items || []
    pagination.total = res.data?.meta?.total || 0
  } catch (error) {
    message.error('数据加载失败，请稍后重试')
    console.error('[QuestionBanks] 加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

// ── 搜索和筛选 ──
function handleSearch() {
  pagination.current = 1
  fetchData()
}

function handleFilterChange() {
  pagination.current = 1
  fetchData()
}

function resetFilters() {
  searchQuery.value = ''
  filterGrade.value = undefined
  filterStatus.value = undefined
  pagination.current = 1
  fetchData()
}

function handleTableChange(p: any) {
  pagination.current = p.current
  pagination.pageSize = p.pageSize
  fetchData()
}

// ── 弹窗操作 ──
function showCreateModal() {
  isEditing.value = false
  editingId.value = null
  formData.name = ''
  formData.grade_group = undefined
  formData.description = ''
  modalVisible.value = true
}

function editBank(record: QuestionBank) {
  isEditing.value = true
  editingId.value = record.id
  formData.name = record.name
  formData.grade_group = record.grade_group
  formData.description = record.description || ''
  modalVisible.value = true
}

async function handleModalOk() {
  try {
    await formRef.value?.validate()
    modalLoading.value = true
    
    if (isEditing.value && editingId.value) {
      await updateQuestionBank(editingId.value, formData)
      message.success('题库更新成功')
    } else {
      await createQuestionBank(formData as { name: string; description?: string; grade_group: string })
      message.success('题库创建成功')
    }
    
    modalVisible.value = false
    fetchData()
  } catch (error) {
    // 验证失败或请求失败
    console.error('[QuestionBanks] 保存题库失败:', error)
  } finally {
    modalLoading.value = false
  }
}

function handleModalCancel() {
  formRef.value?.resetFields()
  modalVisible.value = false
}

// ── 题库操作 ──
function viewDetail(record: QuestionBank) {
  router.push(`/teacher/question-banks/${record.id}`)
}

// 归档确认弹窗
function showArchiveConfirm(record: QuestionBank) {
  Modal.confirm({
    title: '归档确认',
    icon: createVNode(ExclamationCircleOutlined),
    content: `确定要归档题库 "${record.name}" 吗？归档后题库将不再显示在默认列表中，但可以随时恢复。`,
    okText: '确认归档',
    cancelText: '取消',
    onOk: () => archiveBank(record),
  })
}

async function archiveBank(record: QuestionBank) {
  try {
    await updateQuestionBank(record.id, { status: 'archived' })
    message.success('题库已归档')
    fetchData()
  } catch (error) {
    message.error('归档失败，请稍后重试')
    console.error('[QuestionBanks] 归档失败:', error)
  }
}

// 删除确认弹窗
function showDeleteConfirm(record: QuestionBank) {
  Modal.confirm({
    title: '删除确认',
    icon: createVNode(ExclamationCircleOutlined),
    content: h('div', [
      h('p', `确定要删除题库 "${record.name}" 吗？`),
      h('p', { style: 'color: #ff4d4f; margin-top: 8px;' }, '⚠️ 此操作不可恢复，题库内的所有题目将被永久删除！'),
    ]),
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => deleteBank(record),
  })
}

async function deleteBank(record: QuestionBank) {
  try {
    await deleteQuestionBank(record.id)
    message.success('题库已删除')
    fetchData()
  } catch (error) {
    message.error('删除失败，请稍后重试')
    console.error('[QuestionBanks] 删除失败:', error)
  }
}

// ── 生命周期 ──
onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="less">
.question-banks-page {
  max-width: 1200px;
  margin: 0 auto;
}

.filter-card {
  margin-top: 16px;
}

.table-card {
  margin-top: 16px;
}
</style>
