<template>
  <div class="activation-plans-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>激活计划管理</h2>
      <a-button type="primary" @click="handleCreate">
        <template #icon><PlusOutlined /></template>
        新建激活计划
      </a-button>
    </div>

    <!-- 表格卡片 -->
    <a-card class="table-card">
      <a-table
        :columns="columns"
        :data-source="planList"
        :loading="loading"
        row-key="id"
        :pagination="{ pageSize: 10 }"
      >
        <!-- 适用对象列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'target'">
            <a-tag v-if="record.target_role === 'teacher'" color="blue">教师</a-tag>
            <a-tag v-else-if="record.target_role === 'student'" color="green">学生</a-tag>
            <a-tag v-else>{{ record.target_role }}</a-tag>
            <span style="margin-left: 8px;">
              <a-tag v-if="record.target_grade_group === 'primary'" color="cyan">小学</a-tag>
              <a-tag v-else-if="record.target_grade_group === 'junior'" color="purple">初中</a-tag>
              <a-tag v-else-if="record.target_grade_group === 'senior'" color="orange">高中</a-tag>
              <a-tag v-else>{{ record.target_grade_group }}</a-tag>
            </span>
          </template>

          <!-- 有效期列 -->
          <template v-if="column.key === 'duration'">
            <span>{{ record.validity_days }} 天</span>
          </template>

          <!-- 价格列 -->
          <template v-if="column.key === 'price'">
            <span v-if="record.price === 0" class="free-text">免费</span>
            <span v-else>¥{{ record.price }}</span>
          </template>

          <!-- 状态列 -->
          <template v-if="column.key === 'status'">
            <a-switch
              :checked="record.is_active"
              @change="() => handleToggleStatus(record)"
              checked-children="启用"
              un-checked-children="禁用"
            />
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-space size="small">
              <a @click="handleViewDetail(record)">
                <EyeOutlined /> 详情
              </a>
              <a-divider type="vertical" />
              <a @click="handleEdit(record)">
                <EditOutlined /> 编辑
              </a>
              <a-divider type="vertical" />
              <a @click="handleAssociateResource(record)">
                <DatabaseOutlined /> 关联资源
              </a>
              <a-divider type="vertical" />
              <a
                :style="{ color: record.is_active ? '#ff4d4f' : '#52c41a' }"
                @click="handleToggleStatus(record)"
              >
                <PoweroffOutlined />
                {{ record.is_active ? '禁用' : '启用' }}
              </a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新建/编辑弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleSubmit"
      :confirm-loading="submitLoading"
      width="600px"
    >
      <a-form layout="vertical">
        <a-form-item label="计划名称" required>
          <a-input
            v-model:value="formData.name"
            placeholder="请输入计划名称"
          />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="目标角色" required>
              <a-select v-model:value="formData.target_role">
                <a-select-option value="teacher">教师</a-select-option>
                <a-select-option value="student">学生</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="适用学段" required>
              <a-select v-model:value="formData.target_grade_group">
                <a-select-option value="primary">小学</a-select-option>
                <a-select-option value="junior">初中</a-select-option>
                <a-select-option value="senior">高中</a-select-option>
                <a-select-option value="university">大学</a-select-option>
                <a-select-option value="other">其他</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="有效期" required>
              <a-input-number
                v-model:value="formState.durationValue"
                :min="1"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="单位">
              <a-select v-model:value="formState.durationUnit">
                <a-select-option value="days">天</a-select-option>
                <a-select-option value="months">月</a-select-option>
                <a-select-option value="years">年</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="价格" required>
              <a-input-number
                v-model:value="formData.price"
                :min="0"
                :precision="2"
                style="width: 100%"
                prefix="¥"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="最大激活次数" required>
              <a-input-number
                v-model:value="formData.max_activations"
                :min="1"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="描述">
          <a-textarea
            v-model:value="formData.description"
            :rows="3"
            placeholder="请输入计划描述"
          />
        </a-form-item>

        <a-form-item label="状态">
          <a-switch
            v-model:checked="formData.is_active"
            checked-children="启用"
            un-checked-children="禁用"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 详情弹窗 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="计划详情"
      :footer="null"
      width="700px"
    >
      <div v-if="currentPlan" class="plan-detail">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="计划名称">{{ currentPlan.name }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="currentPlan.is_active ? 'green' : 'red'">
              {{ currentPlan.is_active ? '启用' : '禁用' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="目标角色">
            {{ currentPlan.target_role === 'teacher' ? '教师' : currentPlan.target_role === 'student' ? '学生' : currentPlan.target_role }}
          </a-descriptions-item>
          <a-descriptions-item label="适用学段">
            {{ currentPlan.target_grade_group === 'primary' ? '小学' : currentPlan.target_grade_group === 'junior' ? '初中' : currentPlan.target_grade_group === 'senior' ? '高中' : currentPlan.target_grade_group }}
          </a-descriptions-item>
          <a-descriptions-item label="有效期">{{ currentPlan.validity_days }} 天</a-descriptions-item>
          <a-descriptions-item label="价格">
            <span v-if="currentPlan.price === 0" class="free-text">免费</span>
            <span v-else>¥{{ currentPlan.price }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="最大激活次数">{{ currentPlan.max_activations }}</a-descriptions-item>
          <a-descriptions-item label="已生成/已使用">
            {{ currentPlan.total_generated || 0 }} / {{ currentPlan.total_used || 0 }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="section-title">权限配置</div>
        <a-list
          :data-source="permissions"
          :loading="permissionLoading"
          bordered
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta
                :title="item.name"
                :description="item.description"
              />
              <template #actions>
                <a-switch v-model:checked="item.enabled" />
              </template>
            </a-list-item>
          </template>
        </a-list>

        <div class="detail-actions">
          <a-button type="primary" @click="handleSavePermissions">保存权限配置</a-button>
        </div>
      </div>
    </a-modal>

    <!-- 关联资源弹窗 -->
    <a-modal
      v-model:open="resourceModalVisible"
      title="关联资源包"
      @ok="handleSaveResources"
      :confirm-loading="resourceLoading"
      width="600px"
    >
      <a-transfer
        v-model:target-keys="targetResourceKeys"
        :data-source="availableResources"
        :render="(item: any) => item.title"
        :titles="['可用资源', '已关联']"
        show-search
        style="height: 400px"
      />
    </a-modal>

  </div>
</template>

<script setup lang="ts">
/**
 * 激活计划管理页面
 * 功能：激活计划列表、新建/编辑计划、权限配置
 */
import { ref, reactive, onMounted, onActivated } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  PoweroffOutlined,
  DatabaseOutlined,
} from '@ant-design/icons-vue'
import {
  getActivationPlans,
  createActivationPlan,
  updateActivationPlan,
  togglePlanStatus,
} from '@/api/activations'
import { getResources } from '@/api/resources'

// ==================== 类型定义 ====================

interface ActivationPlan {
  id?: number
  name: string
  target_role: string
  target_grade_group: string
  validity_days: number
  price: number
  max_activations: number
  total_generated?: number
  total_used?: number
  description?: string
  permissions?: string
  question_bank_ids?: string
  resource_ids?: string
  is_active: boolean
}

interface Permission {
  id: number
  name: string
  description: string
  enabled: boolean
}

// ==================== 表格列配置 ====================

const columns = [
  {
    title: '计划名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '适用对象',
    key: 'target',
    width: 180,
  },
  {
    title: '有效期',
    key: 'duration',
    width: 120,
  },
  {
    title: '价格',
    key: 'price',
    width: 120,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '操作',
    key: 'action',
    width: 300,
    fixed: 'right',
  },
]

const resourceModalVisible = ref(false)
const resourceLoading = ref(false)
const availableResources = ref<any[]>([])
const targetResourceKeys = ref<string[]>([])

// ==================== 数据获取 ====================

const loading = ref(false)
const planList = ref<ActivationPlan[]>([])
const modalVisible = ref(false)
const modalTitle = ref('新建激活计划')
const submitLoading = ref(false)
const isEdit = ref(false)

const formData = reactive<ActivationPlan>({
  name: '',
  target_role: 'teacher',
  target_grade_group: 'primary',
  validity_days: 365,
  price: 0,
  max_activations: 1,
  description: '',
  is_active: true,
})

const formState = reactive({
  durationValue: 365,
  durationUnit: 'days'
})

const detailModalVisible = ref(false)
const currentPlan = ref<ActivationPlan | null>(null)
const permissions = ref<Permission[]>([])
const permissionLoading = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getActivationPlans()
    // 支持多种数据格式
    const list = res.data?.list || res.data?.items || res.data || []
    planList.value = Array.isArray(list) ? list : []
    console.log('[ActivationPlans] 数据加载成功:', planList.value.length, '条记录')
  } catch (error: any) {
    console.error('[ActivationPlans] 获取数据失败:', error)
    // 区分不同类型的错误
    if (error?.response?.status === 401) {
      message.error('登录已过期，请重新登录')
    } else if (error?.response?.status === 403) {
      message.error('无权访问激活计划')
    } else {
      message.error('获取激活计划列表失败，请稍后重试')
    }
    planList.value = []
  } finally {
    loading.value = false
  }
}

// ==================== 事件处理 ====================

const handleCreate = () => {
  isEdit.value = false
  modalTitle.value = '新建激活计划'
  Object.assign(formData, {
    name: '',
    target_role: 'teacher',
    target_grade_group: 'primary',
    validity_days: 365,
    price: 0,
    description: '',
    is_active: true,
  })
  formState.durationValue = 365
  formState.durationUnit = 'days'
  modalVisible.value = true
}

const handleEdit = (record: ActivationPlan) => {
  isEdit.value = true
  modalTitle.value = '编辑激活计划'
  Object.assign(formData, record)
  // 解析有效期
  formState.durationValue = record.validity_days
  formState.durationUnit = 'days'
  modalVisible.value = true
}

const handleSubmit = async () => {
  if (!formData.name) {
    message.error('请输入计划名称')
    return
  }
  if (!formData.target_role) {
    message.error('请选择目标角色')
    return
  }
  if (!formData.target_grade_group) {
    message.error('请选择适用学段')
    return
  }

  // 计算总天数
  if (formState.durationUnit === 'years') {
    formData.validity_days = (formState.durationValue || 0) * 365
  } else if (formState.durationUnit === 'months') {
    formData.validity_days = (formState.durationValue || 0) * 30
  } else {
    formData.validity_days = formState.durationValue || 0
  }

  submitLoading.value = true
  try {
    if (isEdit.value && formData.id) {
      await updateActivationPlan(formData.id, formData)
      message.success('更新成功')
    } else {
      await createActivationPlan(formData)
      message.success('创建成功')
    }
    modalVisible.value = false
    fetchData()
  } catch (error) {
    message.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitLoading.value = false
  }
}

const handleToggleStatus = (record: ActivationPlan) => {
  const action = record.is_active ? '禁用' : '启用'
  Modal.confirm({
    title: `确认${action}`,
    content: `确定要${action}计划 "${record.name}" 吗？`,
    async onOk() {
      try {
        if (record.id) {
          await togglePlanStatus(record.id, !record.is_active)
          message.success(`${action}成功`)
          fetchData()
        }
      } catch (error) {
        message.error(`${action}失败`)
      }
    },
  })
}

// 定义各角色的权限配置范围
const TEACHER_PERMISSIONS: Permission[] = [
  { id: 1, name: '题库访问', description: '可访问和使用题库', enabled: true },
  { id: 2, name: '试卷生成', description: '可生成和导出试卷', enabled: true },
  { id: 3, name: '在线考试', description: '可创建和参与在线考试', enabled: true },
  { id: 4, name: '成绩分析', description: '可查看成绩统计和分析', enabled: true },
  { id: 5, name: '资源下载', description: '可下载教学资源', enabled: false },
  { id: 6, name: '主观题评分', description: '可批改学生主观题答案', enabled: true },
]

const STUDENT_PERMISSIONS: Permission[] = [
  { id: 1, name: '题库访问', description: '可访问和使用题库', enabled: true },
  { id: 3, name: '在线考试', description: '可参与在线考试', enabled: true },
  { id: 4, name: '成绩分析', description: '可查看个人成绩和分析', enabled: true },
  // 学生不包含：试卷生成、资源下载、主观题评分
]

const handleViewDetail = (record: ActivationPlan) => {
  currentPlan.value = record
  detailModalVisible.value = true
  // 根据目标角色加载对应的权限配置
  permissionLoading.value = true
  setTimeout(() => {
    const role = record.target_role?.toLowerCase()
    if (role === 'student') {
      permissions.value = JSON.parse(JSON.stringify(STUDENT_PERMISSIONS))
    } else {
      // 教师或其他角色显示完整权限
      permissions.value = JSON.parse(JSON.stringify(TEACHER_PERMISSIONS))
    }
    permissionLoading.value = false
  }, 500)
}

const handleSavePermissions = () => {
  message.success('权限配置已保存')
}

// ==================== 关联资源处理 ====================

const handleAssociateResource = async (record: ActivationPlan) => {
  currentPlan.value = record
  resourceModalVisible.value = true
  resourceLoading.value = true
  try {
    const res = await getResources({ size: 1000 })
    const items = res.data?.list || res.data?.items || []
    availableResources.value = items.map((item: any) => ({
      key: item.id.toString(),
      title: item.title || item.name || '未命名资源',
      description: item.description
    }))
    
    // 获取已关联的资源
    if (record.resource_ids) {
      try {
        targetResourceKeys.value = JSON.parse(record.resource_ids)
      } catch (e) {
        targetResourceKeys.value = []
      }
    } else {
      targetResourceKeys.value = []
    }
  } catch (error) {
    message.error('获取资源列表失败')
  } finally {
    resourceLoading.value = false
  }
}

const handleSaveResources = async () => {
  if (!currentPlan.value || !currentPlan.value.id) return
  
  resourceLoading.value = true
  try {
    const payload = {
      ...currentPlan.value,
      resource_ids: JSON.stringify(targetResourceKeys.value)
    }
    
    await updateActivationPlan(currentPlan.value.id, payload)
    
    message.success('关联资源成功')
    resourceModalVisible.value = false
    fetchData()
  } catch (error) {
    console.error('Save resources error:', error)
    message.error('保存关联资源失败')
  } finally {
    resourceLoading.value = false
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchData()
})

// 处理 keep-alive 缓存，当组件被激活时重新加载数据
onActivated(() => {
  fetchData()
})
</script>
<style scoped lang="less">
.activation-plans-page {
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

  .table-card {
    :deep(.ant-card-body) {
      padding: 0;
    }

    .ant-table-wrapper {
      padding: 24px;
    }

    .free-text {
      color: #52c41a;
    }
  }

  .plan-detail {
    .section-title {
      margin-top: 24px;
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 600;
    }

    .detail-actions {
      margin-top: 24px;
      text-align: right;
    }

    .free-text {
      color: #52c41a;
    }
  }
}
</style>
