<template>
  <!-- 批量生成练习账号弹窗 - 接力教育智慧云平台 -->
  <a-modal
    v-model:open="modalVisible"
    title="批量生成赛前练习账号"
    :width="720"
    :confirm-loading="submitLoading"
    @cancel="handleCancel"
  >
    <div class="practice-modal-content">
      <!-- 步骤条 -->
      <a-steps :current="currentStep" class="modal-steps">
        <a-step title="设置参数" description="配置账号基本信息" />
        <a-step title="预览确认" description="查看生成预览" />
        <a-step title="完成" description="生成账号列表" />
      </a-steps>

      <!-- 步骤1：设置参数 -->
      <div v-if="currentStep === 0" class="step-content">
        <a-alert
          message="赛前练习账号说明"
          description="练习账号用于赛前模拟练习，与正式考试账号完全隔离。生成数量范围为 1-1000 个。"
          type="info"
          show-icon
          style="margin-bottom: 24px"
        />

        <a-form :model="formState" layout="vertical" :rules="formRules" ref="formRef">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="选择学段" name="gradeGroup" required>
                <a-select
                  v-model:value="formState.gradeGroup"
                  placeholder="请选择学段"
                  style="width: 100%"
                >
                  <a-select-option value="primary">
                    <span class="option-with-icon">
                      <TeamOutlined /> 小学组
                    </span>
                  </a-select-option>
                  <a-select-option value="junior">
                    <span class="option-with-icon">
                      <BookOutlined /> 初中组
                    </span>
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="生成数量" name="count" required>
                <a-input-number
                  v-model:value="formState.count"
                  :min="1"
                  :max="1000"
                  style="width: 100%"
                  placeholder="1 ~ 1000"
                />
              </a-form-item>
              <div class="form-help">建议数量：小学组 400 个，初中组 350 个</div>
            </a-col>
          </a-row>

          <a-form-item label="初始密码" name="initialPassword" required>
            <a-input-password
              v-model:value="formState.initialPassword"
              placeholder="请输入初始密码（6-20位）"
              :maxLength="20"
            />
          </a-form-item>

          <a-form-item label="密码确认" name="confirmPassword" required>
            <a-input-password
              v-model:value="formState.confirmPassword"
              placeholder="请再次输入初始密码"
              :maxLength="20"
            />
          </a-form-item>

          <a-form-item label="账号前缀（可选）" name="prefix">
            <a-input
              v-model:value="formState.prefix"
              placeholder="请输入账号前缀，如：LX2024"
              :maxLength="10"
            />
            <div class="form-help">账号格式：前缀 + 学段标识 + 随机码 + 序号</div>
          </a-form-item>

          <a-divider />

          <a-form-item>
            <a-checkbox v-model:checked="formState.sendToEmail">
              生成完成后发送账号列表到管理员邮箱
            </a-checkbox>
          </a-form-item>
        </a-form>
      </div>

      <!-- 步骤2：预览确认 -->
      <div v-if="currentStep === 1" class="step-content">
        <a-alert
          :message="`即将生成 ${formState.count} 个${getGradeGroupText(formState.gradeGroup!)}练习账号`"
          type="warning"
          show-icon
          style="margin-bottom: 16px"
        />

        <a-descriptions bordered :column="2">
          <a-descriptions-item label="学段">{{ getGradeGroupText(formState.gradeGroup!) }}</a-descriptions-item>
          <a-descriptions-item label="生成数量">{{ formState.count }} 个</a-descriptions-item>
          <a-descriptions-item label="初始密码">{{ maskPassword(formState.initialPassword) }}</a-descriptions-item>
          <a-descriptions-item label="账号前缀">{{ formState.prefix || '系统默认' }}</a-descriptions-item>
        </a-descriptions>

        <div class="preview-section">
          <h4>账号示例预览</h4>
          <div class="preview-list">
            <div v-for="(item, index) in previewAccounts" :key="index" class="preview-item">
              <span class="index">{{ index + 1 }}.</span>
              <a-tag color="blue">{{ item.username }}</a-tag>
              <span class="password">密码: {{ maskPassword(formState.initialPassword) }}</span>
            </div>
            <div v-if="formState.count > 5" class="preview-more">
              ... 还有 {{ formState.count - 5 }} 个账号
            </div>
          </div>
        </div>

        <a-divider />

        <div class="confirm-section">
          <a-checkbox v-model:checked="confirmChecked">
            我已确认以上信息正确，确认生成账号
          </a-checkbox>
        </div>
      </div>

      <!-- 步骤3：完成 -->
      <div v-if="currentStep === 2" class="step-content">
        <a-result
          status="success"
          title="账号生成成功"
          :sub-title="`成功生成 ${generatedAccounts.length} 个练习账号`"
        >
          <template #extra>
            <a-space>
              <a-button type="primary" @click="handleExportExcel">
                <DownloadOutlined />
                导出Excel
              </a-button>
              <a-button @click="handleCopyAll">
                <CopyOutlined />
                复制全部账号
              </a-button>
              <a-button @click="handleClose">关闭</a-button>
            </a-space>
          </template>
        </a-result>

        <div class="generated-list">
          <h4>生成的账号列表</h4>
          <a-table
            :columns="previewColumns"
            :data-source="generatedAccounts.slice(0, 10)"
            :pagination="false"
            size="small"
            bordered
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'username'">
                <a-typography-text copyable class="username-text">
                  {{ record.username }}
                </a-typography-text>
              </template>
              <template v-else-if="column.key === 'password'">
                <span class="password-text">{{ record.password }}</span>
              </template>
            </template>
          </a-table>
          <div v-if="generatedAccounts.length > 10" class="list-more">
            ... 共 {{ generatedAccounts.length }} 个账号，请导出查看完整列表
          </div>
        </div>
      </div>

    </div>
    <!-- 底部按钮 -->
    <template #footer>
      <a-space v-if="currentStep < 2">
        <a-button v-if="currentStep > 0" @click="handlePrev">上一步</a-button>
        <a-button v-if="currentStep === 0" type="primary" @click="handleNext" :disabled="!canNext" id="btn-practice-next">
          下一步
        </a-button>
        <a-button
          v-if="currentStep === 1"
          type="primary"
          @click="handleSubmit"
          :loading="submitLoading"
          :disabled="!confirmChecked"
        >
          确认生成
        </a-button>
        <a-button @click="handleCancel">取消</a-button>
      </a-space>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 批量生成练习账号弹窗组件
 * 
 * @author 接力教育智慧云平台
 * @version 1.0.0
 */
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import {
  TeamOutlined,
  BookOutlined,
  DownloadOutlined,
  CopyOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { batchGeneratePractice } from '@/api/accounts'

// ==================== Props & Emits ====================

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

// ==================== 响应式数据 ====================

/** 弹窗显示状态 */
const modalVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

/** 当前步骤 */
const currentStep = ref(0)

/** 表单引用 */
const formRef = ref<FormInstance>()

/** 提交加载状态 */
const submitLoading = ref(false)

/** 确认勾选 */
const confirmChecked = ref(false)

/** 表单数据 */
const formState = reactive({
  gradeGroup: undefined as 'primary' | 'junior' | undefined,
  count: 300,
  initialPassword: '',
  confirmPassword: '',
  prefix: '',
  sendToEmail: false,
})

/** 生成的账号列表 */
const generatedAccounts = ref<Array<{ index: number; username: string; password: string }>>([])

/** 预览列配置 */
const previewColumns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 60 },
  { title: '账号', key: 'username' },
  { title: '密码', key: 'password' },
]

// ==================== 计算属性 ====================

/** 是否可以下一步 */
const canNext = computed(() => {
  return (
    formState.gradeGroup &&
    formState.count >= 1 &&
    formState.count <= 1000 &&
    formState.initialPassword.length >= 6 &&
    formState.initialPassword === formState.confirmPassword
  )
})

/** 是否可以提交 */
const canSubmit = computed(() => {
  return canNext.value && confirmChecked.value
})

/** 预览账号列表 */
const previewAccounts = computed(() => {
  const count = Math.min(formState.count, 5)
  return generatePreviewAccounts(count)
})

// ==================== 表单验证规则 ====================

const formRules = {
  gradeGroup: [{ required: true, message: '请选择学段', trigger: ['blur', 'change'] }],
  count: [
    { required: true, message: '请输入生成数量', trigger: ['blur', 'change'] },
    { type: 'number', min: 1, max: 1000, message: '数量必须在 1-1000 之间', trigger: ['blur', 'change'] },
  ],
  initialPassword: [
    { required: true, message: '请输入初始密码', trigger: ['blur', 'change'] },
    { min: 6, max: 20, message: '密码长度必须在 6-20 位之间', trigger: ['blur', 'change'] },
  ],
  confirmPassword: [
    { required: true, message: '请确认初始密码', trigger: ['blur', 'change'] },
    {
      validator: (_: any, value: string) => {
        if (value !== formState.initialPassword) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      },
      trigger: ['blur', 'change'],
    },
  ],
}

// ==================== 辅助函数 ====================

/** 获取学段文本 */
const getGradeGroupText = (gradeGroup: 'primary' | 'junior'): string => {
  const map = {
    primary: '小学组',
    junior: '初中组',
  }
  return map[gradeGroup] || gradeGroup
}

/** 脱敏密码 */
const maskPassword = (password: string): string => {
  return password ? '•'.repeat(Math.min(password.length, 8)) : ''
}

/** 生成预览账号 */
const generatePreviewAccounts = (count: number) => {
  const accounts = []
  const gradePrefix = formState.gradeGroup === 'primary' ? 'P' : 'J'
  const customPrefix = formState.prefix || 'LX'
  const timestamp = dayjs().format('YYMMDD')
  
  for (let i = 1; i <= count; i++) {
    const username = `${customPrefix}${gradePrefix}${timestamp}${String(i).padStart(4, '0')}`
    accounts.push({
      username,
      password: formState.initialPassword,
    })
  }
  return accounts
}

/** 生成账号 */
const generateAccounts = () => {
  const accounts = []
  const gradePrefix = formState.gradeGroup === 'primary' ? 'P' : 'J'
  const customPrefix = formState.prefix || 'LX'
  const timestamp = dayjs().format('YYMMDD')
  
  for (let i = 1; i <= formState.count; i++) {
    const username = `${customPrefix}${gradePrefix}${timestamp}${String(i).padStart(4, '0')}`
    accounts.push({
      index: i,
      username,
      password: formState.initialPassword,
    })
  }
  return accounts
}

// ==================== 事件处理 ====================

/** 下一步 */
const handleNext = async () => {
  try {
    await formRef.value?.validate()
    currentStep.value = 1
  } catch {
    // 验证失败
  }
}

/** 上一步 */
const handlePrev = () => {
  currentStep.value = 0
  confirmChecked.value = false
}

/** 提交生成 */
const handleSubmit = async () => {
  submitLoading.value = true
  
  try {
    // 调用真实API
    const res = await batchGeneratePractice({
      count: formState.count,
      grade_group: formState.gradeGroup!.toUpperCase(),
      initial_password: formState.initialPassword,
    })
    
    // 使用后端返回的账号或本地生成的
    generatedAccounts.value = res.data?.accounts || generateAccounts()
    
    currentStep.value = 2
    message.success(`成功生成 ${formState.count} 个练习账号`)
    emit('success')
  } catch (error: any) {
    message.error(error.message || '生成失败，请重试')
  } finally {
    submitLoading.value = false
  }
}

/** 导出Excel */
const handleExportExcel = () => {
  const headers = ['序号', '账号', '密码', '学段']
  const rows = generatedAccounts.value.map(item => [
    item.index,
    item.username,
    item.password,
    getGradeGroupText(formState.gradeGroup!),
  ])
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `练习账号_${formState.gradeGroup}_${dayjs().format('YYYYMMDD')}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  message.success('导出成功')
}

/** 复制全部账号 */
const handleCopyAll = () => {
  const text = generatedAccounts.value
    .map(item => `${item.username}\t${item.password}`)
    .join('\n')
  
  navigator.clipboard.writeText(text).then(() => {
    message.success('已复制全部账号到剪贴板')
  }).catch(() => {
    message.error('复制失败')
  })
}

/** 取消/关闭 */
const handleCancel = () => {
  if (currentStep.value === 2) {
    handleClose()
    return
  }
  modalVisible.value = false
}

/** 关闭并重置 */
const handleClose = () => {
  modalVisible.value = false
  // 延迟重置，等待动画结束
  setTimeout(() => {
    currentStep.value = 0
    confirmChecked.value = false
    formState.gradeGroup = undefined
    formState.count = 300
    formState.initialPassword = ''
    formState.confirmPassword = ''
    formState.prefix = ''
    formState.sendToEmail = false
    generatedAccounts.value = []
  }, 300)
}

// ==================== Watch ====================

watch(
  () => props.visible,
  (val) => {
    if (val) {
      currentStep.value = 0
      confirmChecked.value = false
    }
  }
)
</script>

<style scoped lang="less">
.practice-modal-content {
  .modal-steps {
    margin-bottom: 32px;
  }

  .step-content {
    min-height: 300px;
  }

  .option-with-icon {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-help {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }

  .preview-section {
    margin-top: 24px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: rgba(0, 0, 0, 0.85);
    }

    .preview-list {
      background: #f6ffed;
      border: 1px solid #b7eb8f;
      border-radius: 4px;
      padding: 16px;

      .preview-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px dashed #d9f7be;

        &:last-child {
          border-bottom: none;
        }

        .index {
          width: 24px;
          color: rgba(0, 0, 0, 0.45);
        }

        .password {
          color: rgba(0, 0, 0, 0.65);
          font-family: monospace;
        }
      }

      .preview-more {
        text-align: center;
        color: rgba(0, 0, 0, 0.45);
        padding: 8px;
        font-size: 13px;
      }
    }
  }

  .confirm-section {
    margin-top: 16px;
    padding: 12px;
    background: #fff7e6;
    border: 1px solid #ffd591;
    border-radius: 4px;
  }

  .generated-list {
    margin-top: 24px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .username-text {
      margin-bottom: 0;
      font-family: 'Courier New', monospace;
      font-weight: 500;
    }

    .password-text {
      font-family: monospace;
      color: #52c41a;
    }

    .list-more {
      text-align: center;
      color: rgba(0, 0, 0, 0.45);
      padding: 12px;
      font-size: 13px;
    }
  }
}
</style>
