<template>
  <!-- 激活码管理页面 -->
  <div class="activation-codes-page">
    <!-- Tab切换 -->
    <div class="page-header">
          <h2>激活码管理</h2>
          <a-space>
            <a-button type="primary" @click="handleGenerate">
              <PlusOutlined />
              批量生成激活码
            </a-button>
            <a-button @click="handleExport">
              <DownloadOutlined />
              导出激活码
            </a-button>
          </a-space>
        </div>

        <!-- 统计卡片区域 -->
        <div class="statistics-row">
          <a-row :gutter="16">
            <a-col :span="6">
              <a-card class="stat-card">
                <a-statistic title="激活码总数" :value="statistics.total" :value-style="{ color: '#1890ff' }">
                  <template #prefix>
                    <KeyOutlined />
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card class="stat-card">
                <a-statistic title="已使用" :value="statistics.used" :value-style="{ color: '#52c41a' }">
                  <template #prefix>
                    <CheckCircleOutlined />
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card class="stat-card">
                <a-statistic title="未使用" :value="statistics.unused" :value-style="{ color: '#faad14' }">
                  <template #prefix>
                    <ClockCircleOutlined />
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
            <a-col :span="6">
              <a-card class="stat-card">
                <a-statistic title="已过期" :value="statistics.expired" :value-style="{ color: '#ff4d4f' }">
                  <template #prefix>
                    <ExpiredOutlined />
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
          </a-row>
        </div>

        <!-- 筛选区域 -->
        <a-card class="filter-card" :bordered="false">
          <a-form layout="inline" class="search-form">
            <a-row :gutter="[16, 16]" style="width: 100%">
              <a-col :xs="24" :sm="12" :md="5">
                <a-form-item label="激活计划" style="width: 100%">
                  <a-select
                    v-model:value="filterForm.planId"
                    placeholder="全部计划"
                    allow-clear
                    style="width: 100%"
                    @change="handleFilterChange"
                  >
                    <a-select-option v-for="plan in planList" :key="plan.id" :value="plan.id">
                      {{ plan.name }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="4">
                <a-form-item label="状态" style="width: 100%">
                  <a-select
                    v-model:value="filterForm.status"
                    placeholder="全部状态"
                    allow-clear
                    style="width: 100%"
                    @change="handleFilterChange"
                  >
                    <a-select-option value="unused">未使用</a-select-option>
                    <a-select-option value="used">已使用</a-select-option>
                    <a-select-option value="expired">已过期</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="4">
                <a-form-item label="来源" style="width: 100%">
                  <a-select
                    v-model:value="filterForm.source"
                    placeholder="全部来源"
                    allow-clear
                    style="width: 100%"
                    @change="handleFilterChange"
                  >
                    <a-select-option value="online">线上销售</a-select-option>
                    <a-select-option value="offline">线下分发</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="5">
                <a-form-item label="搜索" style="width: 100%">
                  <a-input
                    v-model:value="filterForm.search"
                    placeholder="激活码/批次号"
                    allow-clear
                    @pressEnter="handleFilterChange"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="6" class="form-actions-col">
                <div class="form-actions">
                  <a-space>
                    <a-button type="primary" @click="handleFilterChange">
                      <template #icon><SearchOutlined /></template>
                      查询
                    </a-button>
                    <a-button @click="resetFilters">
                      <template #icon><ReloadOutlined /></template>
                      重置
                    </a-button>
                  </a-space>
                </div>
              </a-col>
            </a-row>
          </a-form>
        </a-card>

        <!-- 激活码列表表格 -->
        <a-card class="table-card">
          <a-table
            :columns="columns"
            :data-source="tableData"
            :loading="loading"
            :pagination="pagination"
            row-key="id"
            @change="handleTableChange"
          >
            <!-- 自定义列渲染 -->
            <template #bodyCell="{ column, record }">
              <!-- 激活码列 - 可点击复制 -->
              <template v-if="column.key === 'code'">
                <a-typography-paragraph copyable class="code-text">
                  {{ record.code }}
                </a-typography-paragraph>
              </template>
              <!-- 来源列 -->
              <template v-else-if="column.key === 'source'">
                <a-tag :color="record.source === 'online' ? 'blue' : 'orange'">
                  {{ record.source === 'online' ? '线上销售' : '线下分发' }}
                </a-tag>
              </template>
              <!-- 状态列 -->
              <template v-else-if="column.key === 'status'">
                <a-badge
                  :status="getStatusType(record)"
                  :text="getStatusText(record)"
                />
              </template>
              <!-- 使用者列 -->
              <template v-else-if="column.key === 'usedByName'">
                <span v-if="record.used_by_name">
                  <UserOutlined />
                  {{ record.used_by_name }}
                </span>
                <span v-else class="empty-text">-</span>
              </template>
              <!-- 使用时间列 -->
              <template v-else-if="column.key === 'usedAt'">
                <span v-if="record.used_at && record.used_at !== 'None'" class="time-text">
                  <ClockCircleOutlined />
                  {{ formatDateTime(record.used_at) }}
                </span>
                <span v-else class="empty-text">-</span>
              </template>
              <!-- 到期时间列 -->
              <template v-else-if="column.key === 'expireAt'">
                <span v-if="record.expire_at && record.expire_at !== 'None'" class="time-text">
                  {{ formatDateTime(record.expire_at) }}
                </span>
                <span v-else class="empty-text">永久有效</span>
              </template>
              <!-- 操作列 -->
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="handleCopyCode(record.code)">
                    <CopyOutlined />
                    复制
                  </a-button>
                  <a-button
                    v-if="!record.is_used && !isExpired(record)"
                    type="link"
                    size="small"
                    danger
                    @click="handleRevoke(record)"
                  >
                    <StopOutlined />
                    作废
                  </a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>

    <!-- 批量生成激活码弹窗 -->
    <a-modal
      v-model:open="generateModalVisible"
      title="批量生成激活码"
      @ok="handleGenerateConfirm"
      @cancel="generateModalVisible = false"
      :confirm-loading="generateLoading"
    >
      <a-form :model="generateForm" layout="vertical">
        <a-form-item label="选择激活计划" required>
          <a-select
            v-model:value="generateForm.planId"
            placeholder="请选择激活计划"
            @change="onPlanChange"
          >
            <a-select-option
              v-for="plan in planList"
              :key="plan.id"
              :value="plan.id"
            >
              {{ plan.name }} ({{ plan.target_role }} - {{ plan.target_grade_group }})
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="生成数量" required>
          <a-input-number
            v-model:value="generateForm.count"
            :min="1"
            :max="1000"
            style="width: 100%"
            placeholder="请输入生成数量(1-1000)"
          />
        </a-form-item>
        
        <a-form-item label="来源">
          <a-radio-group v-model:value="generateForm.source">
            <a-radio value="offline">线下分发</a-radio>
            <a-radio value="online">线上销售</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="批次号" v-if="generateForm.source === 'offline'">
          <a-input
            v-model:value="generateForm.batchNo"
            placeholder="请输入批次号，如：2024春季培训"
          />
        </a-form-item>

        <a-form-item>
          <a-alert
            message="提示"
            description="生成的激活码可用于账号激活，每个激活码只能使用一次。"
            type="info"
            show-icon
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 生成结果弹窗 -->
    <a-modal
      v-model:open="resultModalVisible"
      title="生成成功"
      :footer="null"
      width="700px"
    >
      <div class="result-content">
        <a-alert
          :message="`成功生成 ${generatedCodes.length} 个激活码`"
          type="success"
          show-icon
          style="margin-bottom: 16px"
        />
        <div class="codes-list">
          <a-typography-paragraph
            v-for="code in generatedCodes"
            :key="code"
            copyable
            class="generated-code"
          >
            {{ code }}
          </a-typography-paragraph>
        </div>
        <a-space style="margin-top: 16px">
          <a-button type="primary" @click="handleCopyAllCodes">
            <CopyOutlined />
            复制全部
          </a-button>
          <a-button @click="handleDownloadCodes">
            <DownloadOutlined />
            下载文本
          </a-button>
        </a-space>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 激活码管理页面
 * 功能：激活码列表展示、筛选搜索、批量生成、导出、作废
 */
import { ref, reactive, onMounted, onActivated, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import type { TablePaginationConfig } from 'ant-design-vue'
import {
  PlusOutlined,
  DownloadOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  CopyOutlined,
  StopOutlined,
  UserOutlined,
  CloseCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue'
import {
  getActivationPlans,
  getActivationCodes,
  batchGenerateCodes,
  revokeActivationCode,
} from '@/api/activations'

// ==================== 图标组件 ====================

const ExpiredOutlined = CloseCircleOutlined

// ==================== 类型定义 ====================

/** 激活码来源 */
type CodeSource = 'online' | 'offline'

/** 激活码状态 */
type CodeStatus = 'unused' | 'used' | 'expired'

/** 激活计划 */
interface ActivationPlan {
  id: number
  name: string
  target_grade_group: string
  target_role: string
  validity_days: number
  price: number
  is_active: boolean
}

/** 激活码数据接口 */
interface ActivationCode {
  id: number
  code: string
  plan_id: number
  plan_name: string
  grade_group: string
  user_role: string
  is_used: boolean
  used_by: number | null
  used_by_name: string | null
  used_at: string | null
  expire_at: string | null
  source: CodeSource
  batch_no: string | null
  created_at: string
}

/** 筛选表单 */
interface FilterForm {
  planId: number | undefined
  status: CodeStatus | undefined
  source: CodeSource | undefined
  batchNo: string
  search: string
}

/** 生成表单 */
interface GenerateForm {
  planId: number | undefined
  count: number
  source: CodeSource
  batchNo: string
}

/** 统计数据 */
interface Statistics {
  total: number
  used: number
  unused: number
  expired: number
}

// ==================== 表格列配置 ====================

const columns = [
  {
    title: '激活码',
    dataIndex: 'code',
    key: 'code',
    width: 200,
  },
  {
    title: '计划名称',
    dataIndex: 'plan_name',
    key: 'planName',
    width: 150,
  },
  {
    title: '来源',
    dataIndex: 'source',
    key: 'source',
    width: 100,
  },
  {
    title: '批次号',
    dataIndex: 'batch_no',
    key: 'batchNo',
    width: 150,
  },
  {
    title: '使用者',
    dataIndex: 'used_by_name',
    key: 'usedByName',
    width: 150,
  },
  {
    title: '使用时间',
    dataIndex: 'used_at',
    key: 'usedAt',
    width: 180,
  },
  {
    title: '到期时间',
    dataIndex: 'expire_at',
    key: 'expireAt',
    width: 180,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right',
  },
]

// ==================== 响应式数据 ====================

/** 加载状态 */
const loading = ref(false)

/** 表格数据 */
const tableData = ref<ActivationCode[]>([])

/** 激活计划列表 */
const planList = ref<ActivationPlan[]>([])

/** 筛选表单 */
const filterForm = reactive<FilterForm>({
  planId: undefined,
  status: undefined,
  source: undefined,
  batchNo: '',
  search: '',
})

/** 分页配置 */
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
  pageSizeOptions: ['10', '20', '50', '100'],
})

/** 统计数据 */
const statistics = reactive<Statistics>({
  total: 0,
  used: 0,
  unused: 0,
  expired: 0,
})

/** 生成弹窗显示状态 */
const generateModalVisible = ref(false)

/** 生成加载状态 */
const generateLoading = ref(false)

/** 生成表单 */
const generateForm = reactive<GenerateForm>({
  planId: undefined,
  count: 50,
  source: 'offline',
  batchNo: '',
})

/** 生成结果弹窗显示状态 */
const resultModalVisible = ref(false)

/** 新生成的激活码列表 */
const generatedCodes = ref<string[]>([])

/** 所有激活码数据（用于导出） */
const allCodes = ref<ActivationCode[]>([])

// ==================== 辅助函数 ====================

/** 格式化日期时间 */
const formatDateTime = (datetime: string | null): string => {
  if (!datetime || datetime === 'None') return '-'
  const date = new Date(datetime)
  return date.toLocaleString('zh-CN')
}

/** 判断是否已过期 */
const isExpired = (record: ActivationCode): boolean => {
  if (!record.expire_at || record.expire_at === 'None') return false
  return new Date(record.expire_at) < new Date()
}

/** 获取状态类型 */
const getStatusType = (record: ActivationCode): string => {
  if (record.is_used) return 'success'
  if (isExpired(record)) return 'error'
  return 'warning'
}

/** 获取状态文本 */
const getStatusText = (record: ActivationCode): string => {
  if (record.is_used) return '已使用'
  if (isExpired(record)) return '已过期'
  return '未使用'
}

/** 更新统计数据 */
const updateStatistics = (data: ActivationCode[]) => {
  statistics.total = data.length
  statistics.used = data.filter(item => item.is_used).length
  statistics.unused = data.filter(item => !item.is_used && !isExpired(item)).length
  statistics.expired = data.filter(item => !item.is_used && isExpired(item)).length
}

/** 更新统计数据（从API响应） */
const updateStatisticsFromResponse = (data: any) => {
  statistics.total = data.total || 0
  statistics.used = data.used_count || 0
  statistics.unused = data.unused_count || 0
  statistics.expired = data.expired_count || 0
}

// ==================== 数据获取 ====================

/** 获取激活计划列表 */
const fetchPlans = async () => {
  try {
    const res = await getActivationPlans()
    planList.value = res.data?.list || res.data?.items || []
  } catch (error) {
    message.error('获取激活计划列表失败')
  }
}

/** 获取激活码列表 */
const fetchData = async () => {
  loading.value = true
  
  try {
    const res = await getActivationCodes({
      page: pagination.current,
      size: pagination.pageSize,
      plan_id: filterForm.planId,
      status: filterForm.status,
      source: filterForm.source,
      batch_no: filterForm.batchNo || undefined,
      search: filterForm.search || undefined,
    })
    
    allCodes.value = res.data?.list || res.data?.items || []
    tableData.value = allCodes.value
    pagination.total = res.data?.total || 0
    
    // 更新统计数据
    updateStatisticsFromResponse(res.data || {})
  } catch (error) {
    message.error('获取激活码列表失败')
  } finally {
    loading.value = false
  }
}

// ==================== 事件处理 ====================

/** 处理表格分页/排序变化 */
const handleTableChange = (pag: TablePaginationConfig) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchData()
}

/** 处理筛选条件变化 */
const handleFilterChange = () => {
  pagination.current = 1
  fetchData()
}

/** 重置筛选条件 */
const resetFilters = () => {
  filterForm.planId = undefined
  filterForm.status = undefined
  filterForm.source = undefined
  filterForm.batchNo = ''
  filterForm.search = ''
  pagination.current = 1
  fetchData()
}

/** 打开放生成弹窗 */
const handleGenerate = () => {
  generateForm.planId = undefined
  generateForm.count = 50
  generateForm.source = 'offline'
  generateForm.batchNo = ''
  generateModalVisible.value = true
}

/** 计划选择变化 */
const onPlanChange = (planId: number) => {
  const plan = planList.value.find(p => p.id === planId)
  if (plan) {
    generateForm.planId = plan.id
  }
}

/** 提交生成激活码 */
const handleGenerateConfirm = async () => {
  if (!generateForm.planId) {
    message.error('请选择激活计划')
    return
  }
  if (!generateForm.count || generateForm.count < 1) {
    message.error('请输入有效的生成数量')
    return
  }
  
  generateLoading.value = true
  
  try {
    const res = await batchGenerateCodes({
      plan_id: generateForm.planId,
      count: generateForm.count,
      source: generateForm.source,
      batch_no: generateForm.source === 'offline' ? generateForm.batchNo : undefined,
    })
    
    // 检查响应状态码
    if (res.code !== 200) {
      message.error(res.message || '生成激活码失败')
      return
    }
    
    generatedCodes.value = res.data?.codes || []
    
    if (generatedCodes.value.length > 0) {
      generateModalVisible.value = false
      resultModalVisible.value = true
      
      // 刷新列表
      fetchData()
      message.success(`成功生成 ${generatedCodes.value.length} 个激活码`)
    } else {
      message.warning('未生成任何激活码，请检查参数')
    }
  } catch (error: any) {
    console.error('Batch generate error:', error)
    message.error(error.response?.data?.message || '生成激活码失败')
  } finally {
    generateLoading.value = false
  }
}

/** 复制激活码 */
const handleCopyCode = (code: string) => {
  navigator.clipboard.writeText(code).then(() => {
    message.success('复制成功')
  }).catch(() => {
    message.error('复制失败')
  })
}

/** 复制全部激活码 */
const handleCopyAllCodes = () => {
  const text = generatedCodes.value.join('\n')
  navigator.clipboard.writeText(text).then(() => {
    message.success('已复制全部激活码')
  }).catch(() => {
    message.error('复制失败')
  })
}

/** 下载激活码 */
const handleDownloadCodes = () => {
  const text = generatedCodes.value.join('\n')
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `activation_codes_${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  message.success('下载成功')
}

/** 作废激活码 */
const handleRevoke = (record: ActivationCode) => {
  Modal.confirm({
    title: '确认作废',
    content: `确定要作废激活码 "${record.code}" 吗？作废后该激活码将无法使用。`,
    okText: '确认作废',
    okType: 'danger',
    async onOk() {
      try {
        await revokeActivationCode(record.id)
        message.success('已作废')
        fetchData()
      } catch (error) {
        message.error('作废失败')
      }
    },
  })
}

/** 导出激活码 */
const handleExport = () => {
  // 准备导出数据
  let exportData = allCodes.value
  
  // 应用当前筛选
  if (filterForm.planId) {
    exportData = exportData.filter(item => item.plan_id === filterForm.planId)
  }
  if (filterForm.status) {
    exportData = exportData.filter(item => {
      if (filterForm.status === 'used') return item.is_used
      if (filterForm.status === 'expired') return isExpired(item)
      return !item.is_used && !isExpired(item)
    })
  }
  if (filterForm.source) {
    exportData = exportData.filter(item => item.source === filterForm.source)
  }
  if (filterForm.batchNo) {
    exportData = exportData.filter(item => item.batch_no?.includes(filterForm.batchNo))
  }
  
  // 生成CSV内容
  const headers = ['ID', '激活码', '计划名称', '来源', '批次号', '使用者', '使用时间', '到期时间', '状态']
  const rows = exportData.map(item => [
    item.id,
    item.code,
    item.plan_name,
    item.source === 'online' ? '线上销售' : '线下分发',
    item.batch_no || '-',
    item.used_by_name || '-',
    item.used_at ? formatDateTime(item.used_at) : '-',
    item.expire_at ? formatDateTime(item.expire_at) : '永久有效',
    item.is_used ? '已使用' : isExpired(item) ? '已过期' : '未使用',
  ])
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  // 下载文件
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `activation_codes_export_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  message.success(`成功导出 ${exportData.length} 条激活码`)
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchPlans()
  fetchData()
})
</script>

<style scoped lang="less">
.activation-codes-page {
  padding: 24px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }

  .statistics-row {
    margin-bottom: 24px;

    .stat-card {
      text-align: center;

      :deep(.ant-statistic-title) {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.45);
      }

      :deep(.ant-statistic-content) {
        font-size: 24px;
        font-weight: 600;
      }
    }
  }

  .filter-card {
    margin-bottom: 24px;

    :deep(.ant-card-body) {
      padding: 16px 24px;
    }
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

  .table-card {
    :deep(.ant-card-body) {
      padding: 0;
    }

    .ant-table-wrapper {
      padding: 24px;
    }

    .code-text {
      margin-bottom: 0;
      font-family: 'Courier New', monospace;
      font-weight: 600;
      color: #1890ff;

      :deep(.anticon-copy) {
        margin-left: 8px;
        cursor: pointer;

        &:hover {
          color: #40a9ff;
        }
      }
    }

    .empty-text {
      color: rgba(0, 0, 0, 0.25);
    }

    .time-text {
      color: rgba(0, 0, 0, 0.65);
    }
  }

  .result-content {
    .codes-list {
      max-height: 400px;
      overflow-y: auto;
      background: #f6ffed;
      border: 1px solid #b7eb8f;
      border-radius: 4px;
      padding: 16px;

      .generated-code {
        margin-bottom: 8px;
        font-family: 'Courier New', monospace;
        font-weight: 600;
        color: #52c41a;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}
</style>
