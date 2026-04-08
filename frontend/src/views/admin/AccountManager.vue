<template>
  <div class="account-manager">

    <div class="account-content">
      <!-- 筛选区域 -->
      <a-card class="filter-card" :bordered="false">
        <a-form layout="inline" class="search-form">
          <a-flex align="center" gap="8" style="width: 100%; white-space: nowrap;">
            <a-flex align="center" gap="4">
              <span class="filter-label">角色:</span>
              <a-select v-model:value="filters.role" placeholder="全部" allow-clear @change="loadAccounts" style="width: 100px">
                <a-select-option value="ADMIN">管理员</a-select-option>
                <a-select-option value="TEACHER">教师</a-select-option>
                <a-select-option value="STUDENT">学生</a-select-option>
              </a-select>
            </a-flex>
            <a-flex align="center" gap="4" v-if="filters.role === 'STUDENT'">
              <span class="filter-label">类型:</span>
              <a-select v-model:value="filters.account_type" placeholder="全部" allow-clear @change="loadAccounts" style="width: 100px">
                <a-select-option value="PRACTICE">练习</a-select-option>
                <a-select-option value="EXAM">考试</a-select-option>
              </a-select>
            </a-flex>
            <a-flex align="center" gap="4">
              <span class="filter-label">学段:</span>
              <a-select v-model:value="filters.grade_group" placeholder="全部" allow-clear @change="loadAccounts" style="width: 100px">
                <a-select-option value="PRIMARY">小学组</a-select-option>
                <a-select-option value="JUNIOR">初中组</a-select-option>
              </a-select>
            </a-flex>
            <a-flex align="center" gap="4">
              <span class="filter-label">状态:</span>
              <a-select v-model:value="filters.is_activated" placeholder="全部" allow-clear @change="loadAccounts" style="width: 100px">
                <a-select-option :value="true">已激活</a-select-option>
                <a-select-option :value="false">未激活</a-select-option>
              </a-select>
            </a-flex>
            <div style="flex: 1"></div>
            <a-flex align="center" gap="8">
              <a-input-search
                v-model:value="filters.search"
                placeholder="用户名/姓名"
                @search="loadAccounts"
                style="width: 160px"
              />
              <a-button type="primary" @click="loadAccounts" title="查询">
                <template #icon><SearchOutlined /></template>
              </a-button>
              <a-button @click="resetAccountFilters" title="重置">
                <template #icon><ReloadOutlined /></template>
              </a-button>
              <a-divider type="vertical" />
              <a-button type="primary" @click="handleCreateAccount">
                <template #icon><PlusOutlined /></template>
                新增
              </a-button>
              <a-button v-if="!filters.role || filters.role === 'STUDENT'" @click="showGenerateModal = true">
                <template #icon><PlusOutlined /></template>
                批量生成
              </a-button>
            </a-flex>
          </a-flex>
        </a-form>
      </a-card>

      <!-- 账号表格 -->
      <a-card :bordered="false">
        <a-table
          :columns="accountColumns"
          :data-source="accounts"
          :loading="tableLoading"
          :pagination="pagination"
          row-key="id"
          size="middle"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'role'">
              <a-space>
                <a-tag :color="record.role === 'ADMIN' ? 'red' : (record.role === 'TEACHER' ? 'green' : 'blue')">
                  {{ record.role === 'ADMIN' ? '管理' : (record.role === 'TEACHER' ? '教师' : '学生') }}
                </a-tag>
                <a-tag v-if="record.role === 'STUDENT' && record.accountType" color="purple">
                  {{ record.accountType === 'EXAM' ? '考试' : '练习' }}
                </a-tag>
              </a-space>
            </template>
            <template v-else-if="column.key === 'grade_group'">
              {{ getGradeGroupText(record.gradeGroup) }}
            </template>
            <template v-else-if="column.key === 'is_activated'">
              <a-badge :status="record.isActivated ? 'success' : 'default'" :text="record.isActivated ? '已激活' : '未激活'" />
            </template>
            <template v-else-if="column.key === 'created_at'">
              {{ formatTime(record.createdAt) }}
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space size="small">
                <a @click="handleEditAccount(record)">编辑</a>
                <a-divider type="vertical" />
                <a-popconfirm
                  :title="record.is_active ? '确认禁用该账号？' : '确认启用该账号？'"
                  @confirm="handleToggleStatus(record)"
                >
                  <a :style="{ color: record.is_active ? '#ff4d4f' : '#52c41a' }">
                    {{ record.is_active ? '禁用' : '启用' }}
                  </a>
                </a-popconfirm>
                <a-divider type="vertical" />
                <a-popconfirm
                  title="确认删除该账号？此操作不可恢复"
                  @confirm="handleDeleteAccount(record)"
                >
                  <a class="text-danger">删除</a>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 新增账号弹窗 -->
    <a-modal
      v-model:open="showCreateModal"
      title="新增账号"
      :confirm-loading="createLoading"
      @ok="handleCreateSubmit"
    >
      <a-form :model="createForm" layout="vertical">
        <a-form-item label="账号角色" required>
          <a-radio-group v-model:value="createForm.role">
            <a-radio value="ADMIN">管理员</a-radio>
            <a-radio value="TEACHER">教师</a-radio>
            <a-radio value="STUDENT">学生</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="用户名" required>
          <a-input v-model:value="createForm.username" placeholder="建议使用拼音或英文" />
        </a-form-item>
        <a-form-item label="姓名/昵称" required>
          <a-input v-model:value="createForm.name" placeholder="显示在系统中的名称" />
        </a-form-item>
        <a-form-item label="初始密码" required>
          <a-input-password v-model:value="createForm.password" />
        </a-form-item>
        <template v-if="createForm.role !== 'ADMIN'">
          <a-form-item label="学段" required>
            <a-select v-model:value="createForm.grade_group" placeholder="请选择学段">
              <a-select-option value="PRIMARY">小学组</a-select-option>
              <a-select-option value="JUNIOR">初中组</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="对应类型" v-if="createForm.role === 'STUDENT'">
            <a-select v-model:value="createForm.account_type">
              <a-select-option value="PRACTICE">练习账号</a-select-option>
              <a-select-option value="EXAM">考试账号</a-select-option>
            </a-select>
          </a-form-item>
        </template>
      </a-form>
    </a-modal>

    <!-- 批量生成账号弹窗 -->
    <a-modal
      v-model:open="showGenerateModal"
      :title="(!filters.account_type || filters.account_type === 'PRACTICE') ? '批量生成练习账号' : '批量生成考试账号'"
      :confirm-loading="generateLoading"
      @ok="handleGenerate"
      @cancel="resetGenerateForm"
    >
      <a-form v-if="!filters.account_type || filters.account_type === 'PRACTICE'" :model="practiceForm" layout="vertical">
        <a-form-item label="生成数量" required>
          <a-input-number v-model:value="practiceForm.count" :min="1" :max="1000" style="width: 100%" />
        </a-form-item>
        <a-form-item label="学段" required>
          <a-select v-model:value="practiceForm.grade_group" placeholder="请选择学段">
            <a-select-option value="PRIMARY">小学组</a-select-option>
            <a-select-option value="JUNIOR">初中组</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="初始密码" required>
          <a-input-password v-model:value="practiceForm.initial_password" />
        </a-form-item>
      </a-form>

      <a-form v-if="filters.account_type === 'EXAM'" :model="examForm" layout="vertical">
        <a-form-item label="学段组" required>
          <a-select v-model:value="examForm.grade_group" placeholder="请选择学段">
            <a-select-option value="PRIMARY">小学组</a-select-option>
            <a-select-option value="JUNIOR">初中组</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="初始密码" required>
          <a-input-password v-model:value="examForm.initial_password" />
        </a-form-item>
        <a-form-item label="学生名单（CSV）" required>
          <a-upload :before-upload="handleCsvUpload" :max-count="1" accept=".csv">
            <a-button><template #icon><UploadOutlined /></template>上传 CSV</a-button>
          </a-upload>
          <div class="form-help">格式：身份ID, 姓名, 学校（每行一条）</div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑账号弹窗 -->
    <a-modal
      v-model:open="showEditModal"
      title="编辑账号信息"
      :confirm-loading="editLoading"
      @ok="handleEditSubmit"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="账号角色" required>
          <a-select v-model:value="editForm.role" placeholder="选择角色">
            <a-select-option value="ADMIN">管理员</a-select-option>
            <a-select-option value="TEACHER">教师</a-select-option>
            <a-select-option value="STUDENT">学生</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="姓名/昵称" required>
          <a-input v-model:value="editForm.name" />
        </a-form-item>
        <template v-if="editForm.role !== 'ADMIN'">
          <a-form-item label="学段" required>
            <a-select v-model:value="editForm.grade_group">
              <a-select-option value="PRIMARY">小学组</a-select-option>
              <a-select-option value="JUNIOR">初中组</a-select-option>
            </a-select>
          </a-form-item>
        </template>
        <a-form-item label="重置密码">
          <a-input-password v-model:value="editForm.password" placeholder="留空则不修改" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated } from 'vue'
import { PlusOutlined, UploadOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import type { TablePaginationConfig } from 'ant-design-vue'
import {
  getAccounts,
  batchGeneratePractice,
  batchGenerateExam,
  toggleAccountStatus,
  updateAccount,
  deleteAccount,
  createAccount,
  getSchools
} from '@/api/accounts'

// ── 学校数据 ──
const schools = ref<string[]>([])
const schoolOptions = ref<{ value: string, label: string }[]>([])
const tempSchool = ref('')

async function loadSchools() {
  try {
    const res = await getSchools()
    schools.value = res.data || []
    schoolOptions.value = schools.value.map(s => ({ value: s, label: s }))
  } catch (err) {
    console.error('Load Schools Error:', err)
  }
}

// ── 新增账号 ──
const showCreateModal = ref(false)
const createLoading = ref(false)
const createForm = reactive({
  username: '',
  name: '',
  password: '',
  role: 'STUDENT',
  account_type: 'PRACTICE',
  grade_group: 'PRIMARY',
  school: '',
})

function handleCreateAccount() {
  createForm.username = ''
  createForm.name = ''
  createForm.password = '123456'
  createForm.role = filters.role || 'STUDENT'
  createForm.account_type = filters.account_type || 'PRACTICE'
  showCreateModal.value = true
}

async function handleCreateSubmit() {
  if (!createForm.username || !createForm.name || !createForm.password) {
    message.warning('请填写必要信息')
    return
  }
  createLoading.value = true
  try {
    const payload = {
      username: createForm.username,
      name: createForm.name,
      password: createForm.password,
      role: createForm.role,
      account_type: createForm.account_type || 'PRACTICE',
      grade_group: createForm.role !== 'ADMIN' ? createForm.grade_group : undefined,
      school: createForm.role !== 'ADMIN' ? createForm.school : undefined,
      is_active: true
    }
    await createAccount(payload)
    message.success('创建成功')
    showCreateModal.value = false
    // 重置到第一页，确保能看到新创建的账号
    pagination.current = 1
    loadAccounts()
  } catch (err) {
    console.error('Create Error:', err)
  } finally {
    createLoading.value = false
  }
}

// ── 编辑账号 ──
const showEditModal = ref(false)
const editLoading = ref(false)
const editForm = reactive({
  id: 0,
  name: '',
  role: '',
  grade_group: '',
  school: '',
  password: '',
})

function handleEditAccount(record: any) {
  editForm.id = record.id
  editForm.name = record.nickname || record.name
  editForm.role = record.role
  editForm.grade_group = record.gradeGroup
  editForm.school = record.school
  editForm.password = ''
  showEditModal.value = true
}

async function handleEditSubmit() {
  editLoading.value = true
  try {
    await updateAccount(editForm.id, {
      nickname: editForm.name,
      role: editForm.role,
      grade_group: editForm.role !== 'ADMIN' ? editForm.grade_group : undefined,
      school: editForm.role !== 'ADMIN' ? editForm.school : undefined,
      password: editForm.password || undefined
    })
    message.success('更新成功')
    showEditModal.value = false
    loadAccounts()
  } catch {
  } finally {
    editLoading.value = false
  }
}

async function handleDeleteAccount(record: any) {
  try {
    await deleteAccount(record.id)
    message.success('注销成功')
    loadAccounts()
  } catch {
  }
}


// ── 账号列表 ──
const tableLoading = ref(false)
const accounts = ref<any[]>([])
const filters = reactive<{
  grade_group?: string
  is_activated?: boolean
  role?: string
  account_type?: string
  search: string
}>({
  search: '',
})
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showTotal: (total: number) => `共 ${total} 条`,
  showSizeChanger: true,
})

const accountColumns = [
  { title: '用户名', dataIndex: 'username', key: 'username', ellipsis: true },
  { title: '姓名', dataIndex: 'nickname', key: 'nickname', width: 120 },
  { title: '角色', key: 'role', width: 90 },
  { title: '学段', key: 'grade_group', width: 80 },
  { title: '状态', key: 'is_activated', width: 90 },
  { title: '创建时间', key: 'created_at', width: 170 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' as const },
]

async function loadAccounts() {
  tableLoading.value = true
  try {
    const params: any = {
      page: pagination.current,
      size: pagination.pageSize,
      gradeGroup: filters.grade_group,
      isActivated: filters.is_activated,
      search: filters.search || undefined,
      role: filters.role || undefined,
      accountType: filters.account_type || undefined
    }

    const res = (await getAccounts(params)) as any
    accounts.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (err) {
    console.error('Load Error:', err)
  } finally {
    tableLoading.value = false
  }
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1
  pagination.pageSize = pag.pageSize || 20
  loadAccounts()
}

function resetAccountFilters() {
  filters.grade_group = undefined
  filters.is_activated = undefined
  filters.role = undefined
  filters.account_type = undefined
  filters.search = ''
  pagination.current = 1
  loadAccounts()
}

async function handleToggleStatus(record: any) {
  try {
    await toggleAccountStatus(record.id, !record.is_active)
    message.success(record.is_active ? '已禁用' : '已启用')
    loadAccounts()
  } catch {
  }
}

// ── 批量生成账号 ──
const showGenerateModal = ref(false)
const generateLoading = ref(false)

const practiceForm = reactive({
  count: 300,
  grade_group: undefined as string | undefined,
  initial_password: '',
})

const examForm = reactive({
  grade_group: undefined as string | undefined,
  initial_password: '',
  students: [] as { identity_no: string; name: string; school: string }[],
})

function handleCsvUpload(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    const lines = text.trim().split('\n')
    examForm.students = lines
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(',')
        return { 
          identity_no: parts[0]?.trim() || '', 
          name: parts[1]?.trim() || '', 
          school: parts[2]?.trim() || '' 
        }
      })
    if (examForm.students.length > 0) {
      message.success(`已解析 ${examForm.students.length} 条记录`)
    } else {
      message.error('CSV 文件内容格式不正确')
    }
  }
  reader.readAsText(file)
  return false
}

async function handleGenerate() {
  generateLoading.value = true
  try {
    const type = filters.account_type || 'PRACTICE'
    if (type === 'PRACTICE') {
      await batchGeneratePractice(practiceForm)
    } else if (type === 'EXAM') {
      await batchGenerateExam(examForm)
    }
    message.success('批量生成任务已提交')
    showGenerateModal.value = false
    loadAccounts()
  } catch {
  } finally {
    generateLoading.value = false
  }
}

function resetGenerateForm() {
  practiceForm.count = 300
  practiceForm.grade_group = undefined
  practiceForm.initial_password = ''
  examForm.grade_group = undefined
  examForm.initial_password = ''
  examForm.students = []
}

// ── 工具函数 ──
function formatTime(time: string): string {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// 学段显示转换
function getGradeGroupText(gradeGroup: string | undefined): string {
  if (!gradeGroup) return '-'
  const upper = gradeGroup.toUpperCase()
  const map: Record<string, string> = {
    'PRIMARY': '小学',
    'JUNIOR': '初中',
    'MIDDLE': '初中',
    'HIGH': '高中',
    'SENIOR': '高中',
    'UNIVERSITY': '大学',
    'ALL': '全学段',
    'OTHER': '其他'
  }
  return map[upper] || gradeGroup
}

onMounted(() => {
  loadAccounts()
  loadSchools()
})
</script>

<style scoped>
.account-manager {
  padding: 0;
}
.filter-card {
  margin-bottom: 16px;
}
.account-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 16px;
  background: #fff;
  padding: 0 16px;
  border-radius: 4px;
}
.text-danger {
  color: #ff4d4f;
}
.form-help {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 操作按钮横向排列 */
:deep(.ant-space) {
  display: inline-flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center;
  gap: 4px !important;
}

:deep(.ant-space-item) {
  display: inline-flex;
  align-items: center;
}

/* 操作列固定样式优化 */
:deep(.ant-table-cell-fix-right) {
  white-space: nowrap !important;
  background: #fff;
}

/* 文字按钮间距 */
:deep(.ant-table-cell) a {
  padding: 0 4px;
}

:deep(.ant-divider-vertical) {
  margin: 0 2px;
}

/* 允许在 Select 中直接输入新内容的 hack：确保输入值能同步 */
:deep(.ant-select-selection-search-input) {
  opacity: 1 !important;
}
</style>
