<template>
  <!-- 生成激活码弹窗 - 接力教育智慧云平台 -->
  <a-modal
    v-model:open="modalVisible"
    title="批量生成激活码"
    :width="640"
    :confirm-loading="submitLoading"
    :ok-button-props="{ disabled: !canSubmit }"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="generate-code-modal-content">
      <!-- 步骤条 -->
      <a-steps :current="currentStep" class="modal-steps" size="small">
        <a-step title="设置参数" description="配置激活码信息" />
        <a-step title="确认生成" description="生成激活码" />
        <a-step title="完成" description="导出激活码" />
      </a-steps>

      <!-- 步骤1：设置参数 -->
      <div v-if="currentStep === 0" class="step-content">
        <a-alert
          message="激活码说明"
          description="激活码用于新用户注册时的身份验证。四类激活码：小学学生、小学老师、初中学生、初中老师。支持线上（网站/APP）和线下（纸质/现场）两种分发方式。"
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
              <a-form-item label="用户角色" name="userRole" required>
                <a-select
                  v-model:value="formState.userRole"
                  placeholder="请选择角色"
                  style="width: 100%"
                >
                  <a-select-option value="student">
                    <span class="option-with-icon">
                      <UserOutlined /> 学生
                    </span>
                  </a-select-option>
                  <a-select-option value="teacher">
                    <span class="option-with-icon">
                      <TeamOutlined /> 老师
                    </span>
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="分发方式" name="distributionType" required>
            <a-radio-group v-model:value="formState.distributionType">
              <a-radio-button value="online">
                <WifiOutlined /> 线上分发
              </a-radio-button>
              <a-radio-button value="offline">
                <ShopOutlined /> 线下分发
              </a-radio-button>
            </a-radio-group>
            <div class="form-help">
              {{ formState.distributionType === 'online' ? '激活码将通过网站/APP发放给用户' : '激活码将打印在纸质材料上或现场发放' }}
            </div>
          </a-form-item>

          <a-form-item label="生成数量" name="count" required>
            <a-input-number
              v-model:value="formState.count"
              :min="1"
              :max="1000"
              style="width: 100%"
              placeholder="1 ~ 1000"
            />
            <div class="form-help">
              单次最多生成 1000 个激活码，建议根据实际需求适量生成
            </div>
          </a-form-item>

          <a-divider />

          <!-- 生成参数预览 -->
          <div class="params-preview" v-if="formState.gradeGroup && formState.userRole">
            <h4>激活码参数预览</h4>
            <div class="preview-tags">
              <a-tag color="blue">{{ getGradeGroupText(formState.gradeGroup) }}</a-tag>
              <a-tag :color="formState.userRole === 'teacher' ? 'cyan' : 'default'">
                {{ getRoleText(formState.userRole) }}
              </a-tag>
              <a-tag :color="formState.distributionType === 'online' ? 'green' : 'orange'">
                {{ formState.distributionType === 'online' ? '线上' : '线下' }}
              </a-tag>
            </div>
            <div class="code-format">
              激活码格式示例：<code>{{ generatePreviewCode() }}</code>
            </div>
          </div>
        </a-form>
      </div>

      <!-- 步骤2：确认生成 -->
      <div v-if="currentStep === 1" class="step-content">
        <a-alert
          :message="`即将生成 ${formState.count} 个${getGradeGroupText(formState.gradeGroup!)}${getRoleText(formState.userRole!)}激活码`"
          type="warning"
          show-icon
          style="margin-bottom: 16px"
        />

        <a-descriptions bordered :column="2">
          <a-descriptions-item label="学段">
            {{ getGradeGroupText(formState.gradeGroup!) }}
          </a-descriptions-item>
          <a-descriptions-item label="角色">
            {{ getRoleText(formState.userRole!) }}
          </a-descriptions-item>
          <a-descriptions-item label="分发方式">
            <a-tag :color="formState.distributionType === 'online' ? 'green' : 'orange'">
              {{ formState.distributionType === 'online' ? '线上分发' : '线下分发' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="生成数量">
            {{ formState.count }} 个
          </a-descriptions-item>
        </a-descriptions>

        <div class="preview-section">
          <h4>激活码预览</h4>
          <div class="preview-list">
            <a-tag
              v-for="(code, index) in previewCodes"
              :key="index"
              color="blue"
              class="preview-code"
            >
              {{ code }}
            </a-tag>
            <span v-if="formState.count > 5" class="more-codes">
              ... 还有 {{ formState.count - 5 }} 个
            </span>
          </div>
        </div>

        <a-divider />

        <div class="confirm-section">
          <a-checkbox v-model:checked="confirmChecked">
            我已确认以上信息正确，确认生成激活码
          </a-checkbox>
        </div>
      </div>

      <!-- 步骤3：完成 -->
      <div v-if="currentStep === 2" class="step-content">
        <a-result
          status="success"
          title="激活码生成成功"
          :sub-title="`成功生成 ${generatedCodes.length} 个激活码`"
        >
          <template #extra>
            <a-space>
              <a-button type="primary" @click="handleExportExcel">
                <DownloadOutlined />
                导出Excel
              </a-button>
              <a-button @click="handleCopyAll">
                <CopyOutlined />
                复制全部
              </a-button>
              <a-button @click="handleClose">关闭</a-button>
            </a-space>
          </template>
        </a-result>

        <div class="generated-section">
          <h4>生成的激活码列表</h4>
          <div class="codes-container">
            <a-tag
              v-for="(code, index) in generatedCodes.slice(0, 20)"
              :key="index"
              color="green"
              class="generated-code"
            >
              {{ code }}
            </a-tag>
            <span v-if="generatedCodes.length > 20" class="more-hint">
              ... 共 {{ generatedCodes.length }} 个激活码
            </span>
          </div>
        </div>
      </div>

    </div>
    <!-- 底部按钮 -->
    <template #footer>
      <a-space v-if="currentStep < 2">
        <a-button v-if="currentStep > 0" @click="handlePrev">
          <LeftOutlined />
          上一步
        </a-button>
        <a-button v-if="currentStep === 0" type="primary" @click="handleNext" :disabled="!canNext">
          下一步
          <RightOutlined />
        </a-button>
        <a-button
          v-if="currentStep === 1"
          type="primary"
          @click="handleSubmit"
          :loading="submitLoading"
          :disabled="!confirmChecked"
        >
          <CheckOutlined />
          确认生成
        </a-button>
        <a-button @click="handleCancel">取消</a-button>
      </a-space>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 生成激活码弹窗组件
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
  UserOutlined,
  WifiOutlined,
  ShopOutlined,
  DownloadOutlined,
  CopyOutlined,
  LeftOutlined,
  RightOutlined,
  CheckOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { generateActivationCodes } from '@/api/accounts'

// ==================== Props & Emits ====================

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: [codes: string[]]
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
  userRole: undefined as 'student' | 'teacher' | undefined,
  distributionType: 'online' as 'online' | 'offline',
  count: 50,
})

/** 生成的激活码列表 */
const generatedCodes = ref<string[]>([])

// ==================== 计算属性 ====================

/** 是否可以下一步 */
const canNext = computed(() => {
  return (
    formState.gradeGroup &&
    formState.userRole &&
    formState.count >= 1 &&
    formState.count <= 1000
  )
})

/** 是否可以提交 */
const canSubmit = computed(() => {
  return canNext.value && confirmChecked.value
})

/** 预览激活码列表 */
const previewCodes = computed(() => {
  const count = Math.min(formState.count, 5)
  return generateCodes(count)
})

// ==================== 表单验证规则 ====================

const formRules = {
  gradeGroup: [{ required: true, message: '请选择学段', trigger: 'change' }],
  userRole: [{ required: true, message: '请选择角色', trigger: 'change' }],
  distributionType: [{ required: true, message: '请选择分发方式', trigger: 'change' }],
  count: [
    { required: true, message: '请输入生成数量', trigger: 'blur' },
    { type: 'number', min: 1, max: 1000, message: '数量必须在 1-1000 之间', trigger: 'blur' },
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

/** 获取角色文本 */
const getRoleText = (role: 'student' | 'teacher'): string => {
  const map = {
    student: '学生',
    teacher: '老师',
  }
  return map[role] || role
}

/** 生成激活码 */
const generateCode = (index: number): string => {
  const gradePrefix = formState.gradeGroup === 'primary' ? 'P' : 'J'
  const rolePrefix = formState.userRole === 'student' ? 'S' : 'T'
  const distPrefix = formState.distributionType === 'online' ? 'O' : 'F'
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 排除容易混淆的字符
  
  let code = `${gradePrefix}${rolePrefix}${distPrefix}-`
  
  // 添加时间戳部分（4位）
  const timestamp = dayjs().format('MMDD')
  code += timestamp
  
  // 添加随机字符（6位）
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return code
}

/** 生成预览激活码 */
const generatePreviewCode = (): string => {
  return generateCode(1)
}

/** 生成多个激活码 */
const generateCodes = (count: number): string[] => {
  const codes: string[] = []
  const usedCodes = new Set<string>()
  
  let attempts = 0
  while (codes.length < count && attempts < count * 10) {
    const code = generateCode(codes.length + 1)
    if (!usedCodes.has(code)) {
      usedCodes.add(code)
      codes.push(code)
    }
    attempts++
  }
  
  return codes
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
    const res = await generateActivationCodes({
      count: formState.count,
      grade_group: formState.gradeGroup!.toUpperCase(),
      user_role: formState.userRole!.toUpperCase(),
      distribution_type: formState.distributionType.toUpperCase(),
    })
    
    // 使用后端返回的激活码或本地生成的
    generatedCodes.value = res.data?.codes || generateCodes(formState.count)
    
    currentStep.value = 2
    message.success(`成功生成 ${formState.count} 个激活码`)
    emit('success', generatedCodes.value)
  } catch (error: any) {
    message.error(error.message || '生成失败，请重试')
  } finally {
    submitLoading.value = false
  }
}

/** 导出Excel */
const handleExportExcel = () => {
  const headers = ['激活码', '学段', '角色', '分发方式', '生成时间']
  const rows = generatedCodes.value.map(code => [
    code,
    getGradeGroupText(formState.gradeGroup!),
    getRoleText(formState.userRole!),
    formState.distributionType === 'online' ? '线上' : '线下',
    dayjs().format('YYYY-MM-DD HH:mm:ss'),
  ])
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `激活码_${formState.gradeGroup}_${formState.userRole}_${dayjs().format('YYYYMMDD')}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  message.success('导出成功')
}

/** 复制全部激活码 */
const handleCopyAll = () => {
  const text = generatedCodes.value.join('\n')
  
  navigator.clipboard.writeText(text).then(() => {
    message.success('已复制全部激活码到剪贴板')
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
  setTimeout(() => {
    currentStep.value = 0
    confirmChecked.value = false
    formState.gradeGroup = undefined
    formState.userRole = undefined
    formState.distributionType = 'online'
    formState.count = 50
    generatedCodes.value = []
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
.generate-code-modal-content {
  .modal-steps {
    margin-bottom: 24px;
  }

  .step-content {
    min-height: 350px;
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

  .params-preview {
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    border-radius: 4px;
    padding: 16px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: rgba(0, 0, 0, 0.85);
    }

    .preview-tags {
      margin-bottom: 12px;

      .ant-tag {
        margin-right: 8px;
      }
    }

    .code-format {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.65);

      code {
        background: #fff;
        padding: 2px 8px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        color: #1890ff;
        font-weight: 600;
      }
    }
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

      .preview-code {
        margin-right: 8px;
        margin-bottom: 8px;
        font-family: 'Courier New', monospace;
        font-weight: 500;
      }

      .more-codes {
        color: rgba(0, 0, 0, 0.45);
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

  .generated-section {
    margin-top: 24px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .codes-container {
      max-height: 200px;
      overflow-y: auto;
      background: #f6ffed;
      border: 1px solid #b7eb8f;
      border-radius: 4px;
      padding: 16px;

      .generated-code {
        margin-right: 8px;
        margin-bottom: 8px;
        font-family: 'Courier New', monospace;
        font-weight: 500;
      }

      .more-hint {
        display: block;
        margin-top: 8px;
        color: rgba(0, 0, 0, 0.45);
        font-size: 13px;
      }
    }
  }
}
</style>
