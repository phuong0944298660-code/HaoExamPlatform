<template>
  <div class="question-bank-list-page">
    <!-- 页面标题 -->
    <a-page-header title="题库管理" sub-title="管理系统题库资源，支持题库CRUD和题目管理">
      <template #extra>
        <a-button type="primary" @click="showCreateModal">
          <template #icon><PlusOutlined /></template>
          创建题库
        </a-button>
      </template>
    </a-page-header>

    <!-- 统计卡片 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <DatabaseOutlined class="stat-icon" />
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalBanks }}</div>
              <div class="stat-label">题库总数</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <FileTextOutlined class="stat-icon blue" />
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalQuestions }}</div>
              <div class="stat-label">题目总数</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <CheckCircleOutlined class="stat-icon green" />
            <div class="stat-info">
              <div class="stat-value">{{ stats.publishedBanks }}</div>
              <div class="stat-label">已发布题库</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <EditOutlined class="stat-icon orange" />
            <div class="stat-info">
              <div class="stat-value">{{ stats.draftBanks }}</div>
              <div class="stat-label">草稿题库</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 搜索和筛选区域 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" class="search-form">
        <a-row :gutter="[16, 16]" style="width: 100%">
          <a-col :xs="24" :sm="12" :md="6">
            <a-form-item label="题库名称" style="width: 100%">
              <a-input
                v-model:value="searchQuery"
                placeholder="请输入题库名称"
                allow-clear
                @pressEnter="handleSearch"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="4">
            <a-form-item label="适用学段" style="width: 100%">
              <a-select
                v-model:value="filterGrade"
                placeholder="全部学段"
                allow-clear
                style="width: 100%"
                @change="handleFilterChange"
              >
                <a-select-option value="primary">小学</a-select-option>
                <a-select-option value="junior">初中</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="4">
            <a-form-item label="题库状态" style="width: 100%">
              <a-select
                v-model:value="filterStatus"
                placeholder="全部状态"
                allow-clear
                style="width: 100%"
                @change="handleFilterChange"
              >
                <a-select-option value="published">已发布</a-select-option>
                <a-select-option value="draft">草稿</a-select-option>
                <a-select-option value="archived">已归档</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <a-form-item label="创建日期" style="width: 100%">
              <a-range-picker
                v-model:value="dateRange"
                style="width: 100%"
                :placeholder="['开始日期', '结束日期']"
                @change="handleFilterChange"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="4" class="form-actions-col">
            <div class="form-actions">
              <a-space>
                <a-button type="primary" @click="handleSearch">
                  <SearchOutlined /> 查询
                </a-button>
                <a-button @click="resetFilters">
                  <ReloadOutlined /> 重置
                </a-button>
              </a-space>
            </div>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 题库列表 - 卡片视图 -->
    <a-card :bordered="false" class="list-card">
      <a-spin :spinning="loading">
        <a-row :gutter="16">
          <a-col 
            v-for="bank in bankList" 
            :key="bank.id" 
            :xs="24" :sm="12" :md="8" :lg="6"
            class="bank-col"
          >
            <a-card 
              class="bank-card"
              :class="{ 'archived': bank.status === 'archived' }"
              hoverable
              @click="viewDetail(bank)"
            >
              <!-- 卡片头部 -->
              <div class="bank-header">
                <div class="bank-title">{{ bank.name }}</div>
                <a-dropdown :trigger="['click']" @click.stop>
                  <a-button type="text" size="small">
                    <MoreOutlined />
                  </a-button>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item key="edit" @click.stop="editBank(bank)">
                        <EditOutlined /> 编辑信息
                      </a-menu-item>
                      <a-menu-item key="manage" @click.stop="viewDetail(bank)">
                        <FileTextOutlined /> 管理题目
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item 
                        v-if="bank.status === 'draft'" 
                        key="publish" 
                        @click.stop="publishBank(bank)"
                      >
                        <CheckCircleOutlined /> 发布题库
                      </a-menu-item>
                      <a-menu-item 
                        v-if="bank.status === 'published'" 
                        key="archive" 
                        @click.stop="archiveBank(bank)"
                      >
                        <InboxOutlined /> 归档题库
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="delete" danger @click.stop="confirmDelete(bank)">
                        <DeleteOutlined /> 删除题库
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>

              <!-- 题库描述 -->
              <div class="bank-desc">{{ bank.description || '暂无描述' }}</div>

              <!-- 统计信息 -->
              <div class="bank-stats">
                <div class="stat-item">
                  <FileTextOutlined />
                  <span>{{ bank.total_questions || 0 }} 题</span>
                </div>
                <div class="stat-item">
                  <TagOutlined />
                  <span>{{ getGradeText(bank.grade_group) }}</span>
                </div>
              </div>

              <!-- 底部标签 -->
              <div class="bank-footer">
                <a-tag :color="getStatusColor(bank.status)">
                  {{ getStatusText(bank.status) }}
                </a-tag>
                <span class="create-time">{{ formatDate(bank.created_at) }}</span>
              </div>
            </a-card>
          </a-col>
        </a-row>

        <!-- 空状态 -->
        <a-empty v-if="!loading && bankList.length === 0" description="暂无题库数据" />

        <!-- 分页 -->
        <a-pagination
          v-if="pagination.total > 0"
          v-model:current="pagination.current"
          v-model:pageSize="pagination.pageSize"
          :total="pagination.total"
          :show-size-changer="true"
          :show-total="(total: number) => `共 ${total} 条`"
          class="pagination"
          @change="handlePageChange"
        />
      </a-spin>
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
            placeholder="请输入题库名称，如：小学组模拟题库"
            maxlength="100"
            show-count
          />
        </a-form-item>
        <a-form-item label="适用学段" name="grade_group">
          <a-radio-group v-model:value="formData.grade_group">
            <a-radio-button value="primary">小学</a-radio-button>
            <a-radio-button value="junior">初中</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="题库描述" name="description">
          <a-textarea
            v-model:value="formData.description"
            placeholder="请输入题库描述（选填）"
            :rows="3"
            maxlength="500"
            show-count
          />
        </a-form-item>
        <a-form-item label="初始状态" name="status" v-if="!isEditing">
          <a-radio-group v-model:value="formData.status">
            <a-radio value="draft">草稿（不对外可见）</a-radio>
            <a-radio value="published">发布（立即可用）</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除确认弹窗 -->
    <a-modal
      v-model:open="deleteModalVisible"
      title="确认删除"
      ok-text="确定删除"
      cancel-text="取消"
      ok-type="danger"
      :confirm-loading="deleteLoading"
      @ok="handleDelete"
    >
      <a-alert
        message="警告：此操作不可恢复！"
        description="删除题库将同时删除题库中的所有题目，请谨慎操作。"
        type="warning"
        show-icon
        style="margin-bottom: 16px"
      />
      <p>确定要删除题库 <strong>{{ deletingBank?.name }}</strong> 吗？</p>
      <p>该题库包含 <strong>{{ deletingBank?.total_questions || 0 }}</strong> 道题目。</p>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import {
  PlusOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  EditOutlined,
  ReloadOutlined,
  MoreOutlined,
  DeleteOutlined,
  InboxOutlined,
  TagOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue'
import type { QuestionBank } from '@/types/api'
import { 
  getQuestionBanks, 
  createQuestionBank, 
  updateQuestionBank, 
  deleteQuestionBank 
} from '@/api/questions'

const router = useRouter()

// ── 统计状态 ──
const stats = reactive({
  totalBanks: 0,
  totalQuestions: 0,
  publishedBanks: 0,
  draftBanks: 0,
})

// ── 数据状态 ──
const loading = ref(false)
const bankList = ref<QuestionBank[]>([])
const searchQuery = ref('')
const filterGrade = ref<string | undefined>(undefined)
const filterStatus = ref<string | undefined>(undefined)
const dateRange = ref<[any, any] | null>(null)

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 12,
  total: 0,
})

// ── 弹窗状态 ──
const modalVisible = ref(false)
const modalLoading = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const formData = reactive({
  name: '',
  grade_group: 'primary' as string,
  description: '',
  status: 'draft' as string,
})

const formRules = {
  name: [
    { required: true, message: '请输入题库名称', trigger: 'blur' },
    { min: 2, max: 100, message: '名称长度应为2-100字符', trigger: 'blur' },
  ],
  grade_group: [{ required: true, message: '请选择学段', trigger: 'change' }],
}

// ── 删除相关 ──
const deleteModalVisible = ref(false)
const deleteLoading = ref(false)
const deletingBank = ref<QuestionBank | null>(null)

// ── 工具函数 ──
function getGradeText(grade: string): string {
  const textMap: Record<string, string> = {
    primary: '小学',
    junior: '初中',
  }
  return textMap[grade] || grade
}

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    published: 'success',
    draft: 'default',
    archived: 'warning',
  }
  return colorMap[status] || 'default'
}

function getStatusText(status: string): string {
  const textMap: Record<string, string> = {
    published: '已发布',
    draft: '草稿',
    archived: '已归档',
  }
  return textMap[status] || status
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

// ── 数据加载 ──
async function fetchStats() {
  // TODO: 需要添加 getQuestionBankStats API
  // const res = await getQuestionBankStats()
  // Object.assign(stats, res.data)
  
  // 暂时保留模拟数据，直到后端统计接口就绪
  stats.totalBanks = bankList.value.length
  stats.totalQuestions = bankList.value.reduce((acc, curr) => acc + (curr.total_questions || 0), 0)
  stats.publishedBanks = bankList.value.filter(b => b.status === 'published').length
  stats.draftBanks = bankList.value.filter(b => b.status === 'draft').length
}

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
    bankList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    message.error('获取题库列表失败')
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
  dateRange.value = null
  pagination.current = 1
  fetchData()
}

function handlePageChange(page: number, pageSize: number) {
  pagination.current = page
  pagination.pageSize = pageSize
  fetchData()
}

// ── 弹窗操作 ──
function showCreateModal() {
  isEditing.value = false
  editingId.value = null
  formData.name = ''
  formData.grade_group = 'primary'
  formData.description = ''
  formData.status = 'draft'
  modalVisible.value = true
}

function editBank(record: QuestionBank) {
  isEditing.value = true
  editingId.value = record.id
  formData.name = record.name
  formData.grade_group = record.grade_group
  formData.description = record.description || ''
  formData.status = record.status
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
      await createQuestionBank(formData)
      message.success('题库创建成功')
    }
    
    modalVisible.value = false
    fetchData()
    fetchStats()
  } catch (error) {
    // 验证失败或请求失败
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
  router.push(`/admin/question-banks/${record.id}`)
}

async function publishBank(record: QuestionBank) {
  try {
    await updateQuestionBank(record.id, { status: 'published' })
    message.success('题库已发布')
    fetchData()
  } catch {
    // 错误已在拦截器处理
  }
}

async function archiveBank(record: QuestionBank) {
  try {
    await updateQuestionBank(record.id, { status: 'archived' })
    message.success('题库已归档')
    fetchData()
  } catch {
    // 错误已在拦截器处理
  }
}

function confirmDelete(record: QuestionBank) {
  deletingBank.value = record
  deleteModalVisible.value = true
}

async function handleDelete() {
  if (!deletingBank.value) return
  
  deleteLoading.value = true
  try {
    await deleteQuestionBank(deletingBank.value.id)
    message.success('题库已删除')
    deleteModalVisible.value = false
    fetchData()
  } catch {
    // 错误已在拦截器处理
  } finally {
    deleteLoading.value = false
  }
}

// ── 生命周期 ──
onMounted(() => {
  fetchStats()
  fetchData()
})
</script>

<style scoped lang="less">
.question-bank-list-page {
  max-width: 1400px;
  margin: 0 auto;
}

// 统计卡片
.stats-row {
  margin-top: 16px;
  
  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .stat-icon {
      font-size: 32px;
      color: #1890ff;
      
      &.blue {
        color: #52c41a;
      }
      
      &.green {
        color: #52c41a;
      }
      
      &.orange {
        color: #fa8c16;
      }
    }
    
    .stat-info {
      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #262626;
        line-height: 1.2;
      }
      
      .stat-label {
        font-size: 14px;
        color: #8c8c8c;
        margin-top: 4px;
      }
    }
  }
}

// 筛选卡片
.filter-card {
  margin-top: 16px;
}

.search-form {
  :deep(.ant-form-item) {
    margin-bottom: 0;
    display: flex;
    align-items: center;
    width: 100%;
  }

  :deep(.ant-form-item-label) {
    flex-shrink: 0;
    padding-right: 4px;
  }

  :deep(.ant-form-item-control) {
    flex: 1;
    min-width: 0;
  }



  .form-actions-col {
    display: flex;
    align-items: center;
  }

  .form-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    min-height: 32px;
  }
}

// 列表卡片
.list-card {
  margin-top: 16px;
  
  .bank-col {
    margin-bottom: 16px;
  }
  
  .bank-card {
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
    
    &.archived {
      opacity: 0.7;
      background-color: #f5f5f5;
    }
    
    .bank-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      
      .bank-title {
        font-size: 16px;
        font-weight: 500;
        color: #262626;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-right: 8px;
      }
    }
    
    .bank-desc {
      font-size: 13px;
      color: #8c8c8c;
      line-height: 1.5;
      height: 40px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      margin-bottom: 12px;
    }
    
    .bank-stats {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
      padding: 8px 0;
      border-top: 1px solid #f0f0f0;
      border-bottom: 1px solid #f0f0f0;
      
      .stat-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #595959;
      }
    }
    
    .bank-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .create-time {
        font-size: 12px;
        color: #bfbfbf;
      }
    }
  }
  
  .pagination {
    margin-top: 24px;
    text-align: right;
  }
}
</style>
