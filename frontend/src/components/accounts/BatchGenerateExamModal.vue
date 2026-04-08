<template>
  <!-- 批量生成考试账号弹窗 - 接力教育智慧云平台 -->
  <a-modal
    v-model:open="modalVisible"
    title="批量生成赛中考试账号"
    :width="800"
    :confirm-loading="submitLoading"
    :ok-button-props="{ disabled: !canSubmit }"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="exam-modal-content">
      <!-- 步骤条 -->
      <a-steps :current="currentStep" class="modal-steps" size="small">
        <a-step title="上传名单" description="导入学生信息" />
        <a-step title="数据预览" description="检查学生信息" />
        <a-step title="确认生成" description="生成考试账号" />
        <a-step title="完成" description="导出账号列表" />
      </a-steps>

      <!-- 步骤1：上传名单 -->
      <div v-if="currentStep === 0" class="step-content">
        <a-alert
          message="考试账号说明"
          description="考试账号用于正式比赛，与练习账号完全隔离。账号为学生身份证号，请确保上传的学生名单准确无误。"
          type="warning"
          show-icon
          style="margin-bottom: 24px"
        />

        <a-form :model="formState" layout="vertical">
          <a-form-item label="选择学段" required>
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

          <a-form-item label="初始密码" required>
            <a-input-password
              v-model:value="formState.initialPassword"
              placeholder="请输入初始密码（6-20位）"
              :maxLength="20"
            />
            <div class="form-help">所有考试账号将使用相同的初始密码</div>
          </a-form-item>

          <a-divider />

          <a-form-item label="上传学生名单" required>
            <a-upload-dragger
              v-model:fileList="fileList"
              :before-upload="beforeUpload"
              :custom-request="customRequest"
              accept=".xlsx,.xls,.csv"
              :max-count="1"
              :show-upload-list="{ showRemoveIcon: true }"
              @change="handleFileChange"
              @drop="handleDrop"
            >
              <p class="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p class="ant-upload-hint">
                支持 Excel (.xlsx, .xls) 或 CSV 格式，文件大小不超过 5MB
              </p>
            </a-upload-dragger>
          </a-form-item>

          <!-- Excel 模板说明 -->
          <a-card size="small" title="Excel 模板格式" class="template-card">
            <p class="template-desc">Excel 文件需包含以下列（第一行为表头）：</p>
            <a-table
              :columns="templateColumns"
              :data-source="templateData"
              :pagination="false"
              size="small"
              bordered
            />
            <a-space style="margin-top: 12px">
              <a-button type="link" size="small" @click="downloadTemplate">
                <DownloadOutlined />
                下载模板文件
              </a-button>
            </a-space>
          </a-card>
        </a-form>
      </div>

      <!-- 步骤2：数据预览 -->
      <div v-if="currentStep === 1" class="step-content">
        <a-alert
          :message="`成功解析 ${parsedStudents.length} 条学生记录`"
          :type="parsedStudents.length > 0 ? 'success' : 'error'"
          show-icon
          style="margin-bottom: 16px"
        />

        <div class="preview-stats">
          <a-row :gutter="16">
            <a-col :span="8">
              <a-statistic title="总记录数" :value="parsedStudents.length" />
            </a-col>
            <a-col :span="8">
              <a-statistic title="有效记录" :value="validStudents.length" :value-style="{ color: '#52c41a' }" />
            </a-col>
            <a-col :span="8">
              <a-statistic title="无效记录" :value="invalidStudents.length" :value-style="{ color: invalidStudents.length > 0 ? '#ff4d4f' : undefined }" />
            </a-col>
          </a-row>
        </div>

        <a-divider />

        <!-- 数据预览表格 -->
        <div class="preview-table-container">
          <h4>数据预览（前10条）</h4>
          <a-table
            :columns="previewColumns"
            :data-source="parsedStudents.slice(0, 10)"
            :pagination="false"
            size="small"
            row-key="index"
            :row-class-name="getRowClassName"
            bordered
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.isValid ? 'success' : 'error'">
                  {{ record.isValid ? '有效' : '无效' }}
                </a-tag>
                <span v-if="!record.isValid" class="error-reason">{{ record.error }}</span>
              </template>
              <template v-else-if="column.key === 'identityNo'">
                <span :class="{ 'invalid-field': !record.isValid && record.error?.includes('身份证') }">
                  {{ record.identity_no }}
                </span>
              </template>
              <template v-else-if="column.key === 'name'">
                <span :class="{ 'invalid-field': !record.isValid && record.error?.includes('姓名') }">
                  {{ record.name }}
                </span>
              </template>
            </template>
          </a-table>
          <div v-if="parsedStudents.length > 10" class="more-data-hint">
            ... 还有 {{ parsedStudents.length - 10 }} 条数据
          </div>
        </div>

        <!-- 无效数据提示 -->
        <a-alert
          v-if="invalidStudents.length > 0"
          message="存在无效数据，请检查并重新上传"
          :description="`共发现 ${invalidStudents.length} 条无效记录，请修正后重新上传。常见问题：身份证格式错误、姓名为空。`"
          type="error"
          show-icon
          style="margin-top: 16px"
        />
      </div>

      <!-- 步骤3：确认生成 -->
      <div v-if="currentStep === 2" class="step-content">
        <a-alert
          :message="`即将为 ${validStudents.length} 名学生生成考试账号`"
          type="warning"
          show-icon
          style="margin-bottom: 16px"
        />

        <a-descriptions bordered :column="2">
          <a-descriptions-item label="学段">{{ getGradeGroupText(formState.gradeGroup!) }}</a-descriptions-item>
          <a-descriptions-item label="学生人数">{{ validStudents.length }} 人</a-descriptions-item>
          <a-descriptions-item label="初始密码">{{ maskPassword(formState.initialPassword) }}</a-descriptions-item>
          <a-descriptions-item label="账号规则">身份证号为账号</a-descriptions-item>
        </a-descriptions>

        <a-divider />

        <div class="confirm-notice">
          <h4>⚠️ 重要提示</h4>
          <ul>
            <li>考试账号与练习账号完全隔离，互不影响</li>
            <li>账号生成后，学生可使用身份证号作为用户名登录</li>
            <li>请妥善保管生成的账号列表，建议立即导出备份</li>
            <li>生成操作不可撤销，请确认信息无误后再提交</li>
          </ul>
        </div>

        <a-divider />

        <div class="confirm-section">
          <a-checkbox v-model:checked="confirmChecked">
            我已确认以上信息正确，并了解生成操作不可撤销
          </a-checkbox>
        </div>
      </div>

      <!-- 步骤4：完成 -->
      <div v-if="currentStep === 3" class="step-content">
        <a-result
          status="success"
          title="考试账号生成成功"
          :sub-title="`成功为 ${generatedResults.length} 名学生生成考试账号`"
        >
          <template #extra>
            <a-space>
              <a-button type="primary" @click="handleExportExcel">
                <DownloadOutlined />
                导出Excel
              </a-button>
              <a-button @click="handleExportWithSchools">
                <FileExcelOutlined />
                按学校导出
              </a-button>
              <a-button @click="handleClose">关闭</a-button>
            </a-space>
          </template>
        </a-result>

        <div class="generated-list">
          <h4>生成的账号列表</h4>
          <a-table
            :columns="resultColumns"
            :data-source="generatedResults.slice(0, 10)"
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
          <div v-if="generatedResults.length > 10" class="list-more">
            ... 共 {{ generatedResults.length }} 个账号，请导出查看完整列表
          </div>
        </div>
      </div>

    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <a-space v-if="currentStep === 0">
        <a-button type="primary" @click="handleParseFile" :disabled="!canParse" :loading="parseLoading">
          <FileSearchOutlined />
          解析数据
        </a-button>
        <a-button @click="handleCancel">取消</a-button>
      </a-space>
      
      <a-space v-if="currentStep === 1">
        <a-button @click="handlePrev">
          <LeftOutlined />
          重新上传
        </a-button>
        <a-button 
          type="primary" 
          @click="handleNext" 
          :disabled="validStudents.length === 0"
        >
          下一步
          <RightOutlined />
        </a-button>
        <a-button @click="handleCancel">取消</a-button>
      </a-space>
      
      <a-space v-if="currentStep === 2">
        <a-button @click="handlePrev">
          <LeftOutlined />
          上一步
        </a-button>
        <a-button
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
 * 批量生成考试账号弹窗组件
 * 
 * @author 接力教育智慧云平台
 * @version 1.0.0
 */
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { UploadFile, UploadProps } from 'ant-design-vue'
import {
  TeamOutlined,
  BookOutlined,
  InboxOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  LeftOutlined,
  RightOutlined,
  CheckOutlined,
  FileExcelOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { batchGenerateExam } from '@/api/accounts'

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

/** 提交加载状态 */
const submitLoading = ref(false)

/** 解析加载状态 */
const parseLoading = ref(false)

/** 确认勾选 */
const confirmChecked = ref(false)

/** 表单数据 */
const formState = reactive({
  gradeGroup: undefined as 'primary' | 'junior' | undefined,
  initialPassword: '',
})

/** 文件列表 */
const fileList = ref<UploadFile[]>([])

/** 解析的学生列表 */
interface StudentRecord {
  index: number
  identity_no: string
  name: string
  school?: string
  isValid: boolean
  error?: string
}

const parsedStudents = ref<StudentRecord[]>([])

/** 生成的结果 */
const generatedResults = ref<Array<{ index: number; username: string; password: string; name: string; school?: string }>>([])

// ==================== 表格配置 ====================

const templateColumns = [
  { title: '列名', dataIndex: 'name', key: 'name', width: 120 },
  { title: '说明', dataIndex: 'desc', key: 'desc' },
  { title: '示例', dataIndex: 'example', key: 'example', width: 150 },
]

const templateData = [
  { key: '1', name: '身份证号', desc: '学生的身份证号码，将作为登录账号', example: '110101201001011234' },
  { key: '2', name: '姓名', desc: '学生姓名', example: '张小明' },
  { key: '3', name: '学校', desc: '学生所在学校（可选）', example: '北京市第一小学' },
]

const previewColumns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 60 },
  { title: '身份证号', key: 'identityNo' },
  { title: '姓名', key: 'name', width: 100 },
  { title: '学校', dataIndex: 'school', key: 'school' },
  { title: '状态', key: 'status', width: 150 },
]

const resultColumns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 60 },
  { title: '账号（身份证号）', key: 'username' },
  { title: '密码', key: 'password', width: 120 },
  { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
  { title: '学校', dataIndex: 'school', key: 'school' },
]

// ==================== 计算属性 ====================

/** 是否可以解析文件 */
const canParse = computed(() => {
  return (
    formState.gradeGroup &&
    formState.initialPassword.length >= 6 &&
    fileList.value.length > 0
  )
})

/** 是否可以提交 */
const canSubmit = computed(() => {
  return validStudents.value.length > 0 && confirmChecked.value
})

/** 有效学生列表 */
const validStudents = computed(() => {
  return parsedStudents.value.filter(s => s.isValid)
})

/** 无效学生列表 */
const invalidStudents = computed(() => {
  return parsedStudents.value.filter(s => !s.isValid)
})

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

/** 获取行样式 */
const getRowClassName = (record: StudentRecord) => {
  return record.isValid ? '' : 'invalid-row'
}

/** 验证身份证号 */
const validateIdentityNo = (identityNo: string): boolean => {
  // 简单验证：15位或18位数字，最后一位可以是X
  const pattern = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return pattern.test(identityNo)
}

// ==================== 文件处理 ====================

/** 上传前检查 */
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isValidType = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                      file.type === 'application/vnd.ms-excel' ||
                      file.type === 'text/csv' ||
                      file.name.endsWith('.csv')
  
  if (!isValidType) {
    message.error('只支持 Excel (.xlsx, .xls) 或 CSV 文件')
    return UploadProps.LIST_IGNORE
  }
  
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    message.error('文件大小不能超过 5MB')
    return UploadProps.LIST_IGNORE
  }
  
  return false // 阻止自动上传
}

/** 自定义上传 */
const customRequest: UploadProps['customRequest'] = () => {
  // 阻止默认上传行为
}

/** 文件变化 */
const handleFileChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
  fileList.value = newFileList
}

/** 拖拽上传 */
const handleDrop: UploadProps['onDrop'] = (e) => {
  console.log('Dropped files', e.dataTransfer.files)
}

/** 解析CSV文件 */
const parseCSV = async (file: File): Promise<StudentRecord[]> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.trim().split('\n')
      const records: StudentRecord[] = []
      
      // 跳过表头
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        
        const [identity_no, name, school] = line.split(',').map(s => s.trim())
        const record: StudentRecord = {
          index: i,
          identity_no: identity_no || '',
          name: name || '',
          school: school || '',
          isValid: true,
        }
        
        // 验证数据
        if (!record.identity_no) {
          record.isValid = false
          record.error = '身份证号为空'
        } else if (!validateIdentityNo(record.identity_no)) {
          record.isValid = false
          record.error = '身份证格式错误'
        } else if (!record.name) {
          record.isValid = false
          record.error = '姓名为空'
        }
        
        records.push(record)
      }
      
      resolve(records)
    }
    reader.readAsText(file)
  })
}

/** 解析Excel文件（模拟） */
const parseExcel = async (file: File): Promise<StudentRecord[]> => {
  // 在实际项目中，这里应该使用 xlsx.js 等库解析 Excel
  // 这里简化为返回模拟数据
  return new Promise((resolve) => {
    setTimeout(() => {
      const records: StudentRecord[] = []
      const count = Math.floor(Math.random() * 50) + 20 // 20-70条随机数据
      const schools = ['北京市第一小学', '北京市第二小学', '北京市第三实验学校']
      
      for (let i = 1; i <= count; i++) {
        const identity_no = `110101${2000 + Math.floor(Math.random() * 10)}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
        
        records.push({
          index: i,
          identity_no,
          name: `学生${i}`,
          school: schools[Math.floor(Math.random() * schools.length)],
          isValid: true,
        })
      }
      
      // 随机添加几条无效数据
      if (Math.random() > 0.5) {
        records[5].identity_no = 'invalid'
        records[5].isValid = false
        records[5].error = '身份证格式错误'
      }
      
      resolve(records)
    }, 800)
  })
}

/** 下载模板 */
const downloadTemplate = () => {
  const headers = ['身份证号', '姓名', '学校']
  const exampleData = [
    ['110101201001011234', '张小明', '北京市第一小学'],
    ['110101201002021234', '李小红', '北京市第一小学'],
    ['110101201003031234', '王小华', '北京市第二小学'],
  ]
  
  const csvContent = [headers, ...exampleData]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '学生名单模板.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  message.success('模板下载成功')
}

// ==================== 事件处理 ====================

/** 解析文件 */
const handleParseFile = async () => {
  if (!fileList.value.length) {
    message.error('请先上传文件')
    return
  }
  
  parseLoading.value = true
  
  try {
    const file = fileList.value[0].originFileObj || fileList.value[0]
    
    if (file.name.endsWith('.csv')) {
      parsedStudents.value = await parseCSV(file as File)
    } else {
      parsedStudents.value = await parseExcel(file as File)
    }
    
    currentStep.value = 1
    
    if (invalidStudents.value.length > 0) {
      message.warning(`解析完成，发现 ${invalidStudents.value.length} 条无效记录`)
    } else {
      message.success(`成功解析 ${parsedStudents.value.length} 条记录`)
    }
  } catch (error) {
    message.error('文件解析失败，请检查文件格式')
  } finally {
    parseLoading.value = false
  }
}

/** 下一步 */
const handleNext = () => {
  if (currentStep.value === 1) {
    currentStep.value = 2
  }
}

/** 上一步 */
const handlePrev = () => {
  if (currentStep.value === 2) {
    currentStep.value = 1
    confirmChecked.value = false
  } else if (currentStep.value === 1) {
    currentStep.value = 0
    parsedStudents.value = []
    confirmChecked.value = false
  }
}

/** 提交生成 */
const handleSubmit = async () => {
  submitLoading.value = true
  
  try {
    // 调用真实API
    const res = await batchGenerateExam({
      grade_group: formState.gradeGroup!.toUpperCase(),
      initial_password: formState.initialPassword,
      students: validStudents.value.map(s => ({
        identity_no: s.identity_no,
        name: s.name,
        school: s.school || '',
      })),
    })
    
    // 使用后端返回的结果或本地生成的
    generatedResults.value = res.data?.accounts || validStudents.value.map((student, index) => ({
      index: index + 1,
      username: student.identity_no,
      password: formState.initialPassword,
      name: student.name,
      school: student.school,
    }))
    
    currentStep.value = 3
    message.success(`成功生成 ${generatedResults.value.length} 个考试账号`)
    emit('success')
  } catch (error: any) {
    message.error(error.message || '生成失败，请重试')
  } finally {
    submitLoading.value = false
  }
}

/** 导出Excel */
const handleExportExcel = () => {
  const headers = ['序号', '账号（身份证号）', '密码', '姓名', '学校', '学段']
  const rows = generatedResults.value.map(item => [
    item.index,
    item.username,
    item.password,
    item.name,
    item.school || '-',
    getGradeGroupText(formState.gradeGroup!),
  ])
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `考试账号_${formState.gradeGroup}_${dayjs().format('YYYYMMDD')}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  message.success('导出成功')
}

/** 按学校导出 */
const handleExportWithSchools = () => {
  // 按学校分组导出
  const schoolsMap = new Map<string, typeof generatedResults.value>()
  
  generatedResults.value.forEach(item => {
    const school = item.school || '未分配学校'
    if (!schoolsMap.has(school)) {
      schoolsMap.set(school, [])
    }
    schoolsMap.get(school)!.push(item)
  })
  
  // 生成包含所有学校的工作表
  let allContent = `考试账号列表 - ${getGradeGroupText(formState.gradeGroup!)}\n\n`
  
  schoolsMap.forEach((students, school) => {
    allContent += `【${school}】\n`
    allContent += '序号,账号,密码,姓名\n'
    students.forEach(item => {
      allContent += `${item.index},${item.username},${item.password},${item.name}\n`
    })
    allContent += '\n'
  })
  
  const blob = new Blob(['\ufeff' + allContent], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `考试账号_按学校分组_${dayjs().format('YYYYMMDD')}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  message.success('按学校导出成功')
}

/** 取消/关闭 */
const handleCancel = () => {
  if (currentStep.value === 3) {
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
    formState.initialPassword = ''
    fileList.value = []
    parsedStudents.value = []
    generatedResults.value = []
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
.exam-modal-content {
  .modal-steps {
    margin-bottom: 24px;
  }

  .step-content {
    min-height: 400px;
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

  .template-card {
    margin-top: 16px;
    background: #f6ffed;
    border-color: #b7eb8f;

    .template-desc {
      margin-bottom: 12px;
      color: rgba(0, 0, 0, 0.65);
    }
  }

  .preview-stats {
    padding: 16px;
    background: #f6ffed;
    border-radius: 4px;
    margin-bottom: 16px;
  }

  .preview-table-container {
    h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .invalid-row {
      background-color: #fff1f0;
    }

    .invalid-field {
      color: #ff4d4f;
      text-decoration: line-through;
    }

    .error-reason {
      margin-left: 8px;
      color: #ff4d4f;
      font-size: 12px;
    }

    .more-data-hint {
      text-align: center;
      color: rgba(0, 0, 0, 0.45);
      padding: 8px;
      font-size: 13px;
    }
  }

  .confirm-notice {
    background: #fff7e6;
    border: 1px solid #ffd591;
    border-radius: 4px;
    padding: 16px;

    h4 {
      color: #fa8c16;
      margin-bottom: 12px;
    }

    ul {
      margin: 0;
      padding-left: 20px;
      color: rgba(0, 0, 0, 0.65);

      li {
        margin-bottom: 4px;

        &:last-child {
          margin-bottom: 0;
        }
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
