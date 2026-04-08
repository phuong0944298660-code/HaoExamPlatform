<template>
  <div class="exam-detail-page">
    <!-- 页面标题 -->
    <a-page-header
      :title="isEdit ? '编辑考试' : '创建考试'"
      :sub-title="isEdit ? '修改考试信息' : '配置新的考试'"
      @back="handleBack"
    >
      <template #extra>
        <a-space>
          <a-button :loading="saving" @click="handleSave">保存草稿</a-button>
          <a-button type="primary" @click="handleOpenSelector">选择参与学生并发布</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <!-- 考试基本信息 -->
      <a-card title="基本信息" :bordered="false" class="form-card">
        <a-form
          :model="formState"
          :rules="rules"
          ref="formRef"
          :label-col="{ span: 3 }"
          :wrapper-col="{ span: 18 }"
        >
          <a-form-item label="考试名称" name="name">
            <a-input
              v-model:value="formState.name"
              placeholder="请输入考试名称"
              maxlength="100"
              show-count
            />
          </a-form-item>

          <a-form-item label="选择套卷" name="paperIds">
            <a-select
              v-model:value="formState.paperIds"
              mode="multiple"
              placeholder="请选择套卷"
              :options="paperOptions"
              :field-names="{ label: 'name', value: 'id' }"
              :loading="loadingPapers"
            />
          </a-form-item>

          <a-form-item label="学段" name="gradeGroup">
            <a-select v-model:value="formState.gradeGroup" placeholder="请选择学段">
              <a-select-option value="primary">小学</a-select-option>
              <a-select-option value="junior">初中</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="考试时间" name="timeRange">
            <a-range-picker
              v-model:value="formState.timeRange"
              show-time
              format="YYYY-MM-DD HH:mm"
              :placeholder="['开始时间', '结束时间']"
              style="width: 100%"
            />
          </a-form-item>

          <a-form-item label="考试时长" name="duration">
            <a-input-number
              v-model:value="formState.duration"
              :min="10"
              :max="300"
              style="width: 200px"
            >
              <template #addonAfter>分钟</template>
            </a-input-number>
          </a-form-item>

          <a-form-item label="考试说明" name="description">
            <a-textarea
              v-model:value="formState.description"
              placeholder="请输入考试说明（选填）"
              :rows="4"
              maxlength="1000"
              show-count
            />
          </a-form-item>
        </a-form>
      </a-card>

      <!-- 考试设置 -->
      <a-card title="考试设置" :bordered="false" class="form-card">
        <a-form :label-col="{ span: 3 }" :wrapper-col="{ span: 18 }">
          <a-form-item label="IP白名单">
            <a-switch v-model:checked="formState.allowIpCheck" />
            <span class="form-hint">开启后只允许白名单内的IP参加考试</span>
          </a-form-item>

          <a-form-item label="IP列表" v-if="formState.allowIpCheck">
            <a-textarea
              v-model:value="ipListText"
              placeholder="请输入IP地址，每行一个"
              :rows="3"
            />
          </a-form-item>

          <a-form-item label="最大设备数">
            <a-input-number
              v-model:value="formState.maxLoginDevices"
              :min="1"
              :max="5"
              style="width: 200px"
            >
              <template #addonAfter>台</template>
            </a-input-number>
            <span class="form-hint">允许同时登录的最大设备数量</span>
          </a-form-item>

          <a-form-item label="成绩查询">
            <a-switch v-model:checked="formState.scoreQuery.isOpen" />
            <span class="form-hint">开启后学生可查询成绩</span>
          </a-form-item>

          <a-form-item label="查询时间窗口" v-if="formState.scoreQuery.isOpen">
            <a-range-picker
              v-model:value="formState.scoreQuery.timeRange"
              show-time
              format="YYYY-MM-DD HH:mm"
              :placeholder="['开始时间', '结束时间']"
              style="width: 100%"
            />
            <span class="form-hint">留空表示不限时间</span>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- 按钮区域 -->
      <div class="action-bar">
        <a-space>
          <a-button size="large" @click="handleBack">取消</a-button>
          <a-button size="large" :loading="saving" @click="handleSave">保存草稿</a-button>
          <a-button type="primary" size="large" @click="handleOpenSelector">
            选择参与学生并发布
          </a-button>
        </a-space>
      </div>
    </a-spin>

    <!-- 学生选择器弹窗 -->
    <StudentSelectorModal
      v-model:visible="selectorVisible"
      :grade-group="formState.gradeGroup"
      @confirm="handleSelectStudents"
      @cancel="handleSelectorCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import StudentSelectorModal from '@/components/exam/StudentSelectorModal.vue'
import { getExam, createExam, updateExam, publishExam, updateScoreQueryConfig } from '@/api/exams'
import { getPapers } from '@/api/papers'

// ── 路由实例 ──
const route = useRoute()
const router = useRouter()

// ── 判断是否为编辑模式 ──
const examId = computed(() => route.params.examId as string)
const isEdit = computed(() => !!examId.value && examId.value !== 'create' && route.path.includes('/edit'))

// ── 加载状态 ──
const loading = ref(false)
const saving = ref(false)
const loadingPapers = ref(false)

// ── 表单引用 ──
const formRef = ref<FormInstance>()

// ── 学生选择器状态 ──
const selectorVisible = ref(false)

// ── 套卷选项 ──
const paperOptions = ref<{ id: number; name: string }[]>([])

// ── IP列表文本 ──
const ipListText = ref('')

// ── 考试版本号（乐观锁）──
const examVersion = ref(1)

// ── 表单状态 ──
interface FormState {
  name: string
  paperIds: number[]
  gradeGroup: string
  timeRange: [Dayjs, Dayjs] | null
  duration: number
  description: string
  allowIpCheck: boolean
  maxLoginDevices: number
  scoreQuery: {
    isOpen: boolean
    timeRange: [Dayjs, Dayjs] | null
  }
}

const formState = reactive<FormState>({
  name: '',
  paperIds: [],
  gradeGroup: '',
  timeRange: null,
  duration: 120,
  description: '',
  allowIpCheck: false,
  maxLoginDevices: 1,
  scoreQuery: {
    isOpen: false,
    timeRange: null,
  },
})

// ── 表单校验规则 ──
const rules = {
  name: [
    { required: true, message: '请输入考试名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' },
  ],
  paperIds: [
    { required: true, message: '请选择至少一个套卷', trigger: 'change', type: 'array' as const },
  ],
  gradeGroup: [
    { required: true, message: '请选择学段', trigger: 'change' },
  ],
  timeRange: [
    { required: true, message: '请选择考试时间', trigger: 'change', type: 'array' as const },
  ],
  duration: [
    { required: true, message: '请设置考试时长', trigger: 'change', type: 'number' as const },
  ],
}

// ── 加载套卷列表 ──
async function loadPaperOptions() {
  loadingPapers.value = true
  try {
    const res = await getPapers({ page: 1, size: 200, status: 'published' })
    if (res.code === 200 && res.data) {
      const items = Array.isArray(res.data) ? res.data : (res.data as any).items || []
      paperOptions.value = items.map((p: any) => ({ id: p.id, name: p.name }))
    }
  } catch {
    console.warn('加载套卷列表失败，使用空列表')
  } finally {
    loadingPapers.value = false
  }
}

// ── 加载考试数据（编辑模式）──
async function loadExamData() {
  if (!isEdit.value) return

  loading.value = true
  try {
    const res = await getExam(Number(examId.value))
    if (res.code === 200 && res.data) {
      const data = res.data

      formState.name = data.name || ''
      formState.paperIds = data.paperIds || data.paper_ids || []
      formState.gradeGroup = data.gradeGroup || data.grade_group || ''
      formState.duration = data.duration || 120
      formState.description = data.description || ''
      formState.allowIpCheck = data.allowIpCheck || data.allow_ip_check || false
      formState.maxLoginDevices = data.maxLoginDevices || data.max_login_devices || 1
      examVersion.value = data.version || 1

      // 考试时间
      const startTime = data.startTime || data.start_time
      const endTime = data.endTime || data.end_time
      if (startTime && endTime) {
        formState.timeRange = [
          dayjs(startTime),
          dayjs(endTime),
        ]
      }

      // IP白名单
      const allowedIps = data.allowedIps || data.allowed_ips
      if (allowedIps && allowedIps.length > 0) {
        ipListText.value = allowedIps.join('\n')
      }

      // 成绩查询配置
      formState.scoreQuery.isOpen = data.isScoreQueryOpen || data.is_score_query_open || false
      const sqStartTime = data.scoreQueryStartTime || data.score_query_start_time
      const sqEndTime = data.scoreQueryEndTime || data.score_query_end_time
      if (sqStartTime && sqEndTime) {
        formState.scoreQuery.timeRange = [
          dayjs(sqStartTime),
          dayjs(sqEndTime),
        ]
      }
    }
  } catch {
    message.error('加载考试数据失败')
  } finally {
    loading.value = false
  }
}

// ── 构建请求体 ──
function buildRequestData() {
  const allowedIps = formState.allowIpCheck
    ? ipListText.value.split('\n').map(ip => ip.trim()).filter(Boolean)
    : []

  return {
    name: formState.name,
    paper_ids: formState.paperIds,
    grade_group: formState.gradeGroup,
    start_time: formState.timeRange?.[0]?.toISOString() || '',
    end_time: formState.timeRange?.[1]?.toISOString() || '',
    duration: formState.duration,
    description: formState.description || undefined,
    allow_ip_check: formState.allowIpCheck,
    allowed_ips: allowedIps,
    max_login_devices: formState.maxLoginDevices,
    student_list: [],
  }
}

// ── 保存草稿 ──
async function handleSave() {
  try {
    await formRef.value?.validate()
  } catch (error: any) {
    if (error?.errorFields) {
      message.error('请检查表单填写是否正确')
    }
    return
  }

  saving.value = true
  try {
    const data = buildRequestData()

    if (isEdit.value) {
      // 更新已有考试
      const updateData = { ...data, version: examVersion.value }
      const res = await updateExam(Number(examId.value), updateData)
      if (res.code === 200) {
        examVersion.value = res.data?.version || examVersion.value + 1
        message.success('保存成功')

        // 保存成绩查询配置
        await saveScoreQueryConfig()
      } else {
        message.error(res.message || '保存失败')
      }
    } else {
      // 创建新考试
      const res = await createExam(data)
      if (res.code === 201 || res.code === 200) {
        message.success('考试创建成功')

        // 如果返回了考试ID，跳转到编辑页面
        if (res.data?.id) {
          await saveScoreQueryConfigForExam(res.data.id)
          router.replace(`/teacher/exams/${res.data.id}`)
        } else {
          router.back()
        }
      } else {
        message.error(res.message || '创建失败')
      }
    }
  } catch (err: any) {
    const errMsg = err?.response?.data?.detail || err?.message || '保存失败'
    message.error(errMsg)
  } finally {
    saving.value = false
  }
}

// ── 保存成绩查询配置 ──
async function saveScoreQueryConfig() {
  if (!isEdit.value) return
  await saveScoreQueryConfigForExam(Number(examId.value))
}

async function saveScoreQueryConfigForExam(eid: number) {
  try {
    const startTime = formState.scoreQuery.timeRange?.[0]?.toISOString() || null
    const endTime = formState.scoreQuery.timeRange?.[1]?.toISOString() || null
    await updateScoreQueryConfig(eid, {
      is_open: formState.scoreQuery.isOpen,
      start_time: startTime,
      end_time: endTime,
    })
  } catch {
    console.warn('保存成绩查询配置失败')
  }
}

// ── 打开学生选择器 ──
function handleOpenSelector() {
  formRef.value?.validate().then(() => {
    if (!formState.gradeGroup) {
      message.error('请先选择学段')
      return
    }
    selectorVisible.value = true
  }).catch(() => {
    message.error('请检查表单填写是否正确')
  })
}

// ── 选择学生后发布 ──
async function handleSelectStudents(students: any[]) {
  if (students.length === 0) {
    message.error('请至少选择一名学生')
    return
  }

  saving.value = true
  try {
    const data = buildRequestData()
    // 添加学生名单
    data.student_list = students.map((s: any) => ({
      identity_no: s.identity_no,
      name: s.name,
      school: s.school || '',
    }))

    let targetExamId: number

    if (isEdit.value) {
      // 先更新考试信息
      const updateData = { ...data, version: examVersion.value }
      const updateRes = await updateExam(Number(examId.value), updateData)
      if (updateRes.code !== 200) {
        message.error(updateRes.message || '更新考试失败')
        return
      }
      targetExamId = Number(examId.value)
    } else {
      // 先创建考试
      const createRes = await createExam(data)
      if (createRes.code !== 201 && createRes.code !== 200) {
        message.error(createRes.message || '创建考试失败')
        return
      }
      targetExamId = createRes.data?.id
    }

    // 发布考试
    const publishRes = await publishExam(targetExamId)
    if (publishRes.code === 200) {
      // 保存成绩查询配置
      await saveScoreQueryConfigForExam(targetExamId)
      message.success(`考试发布成功，共分配 ${students.length} 名学生`)
      router.push('/teacher/exams')
    } else {
      message.error(publishRes.message || '发布失败')
    }
  } catch (err: any) {
    const errMsg = err?.response?.data?.detail || err?.message || '发布失败'
    message.error(errMsg)
  } finally {
    saving.value = false
  }
}

// ── 取消选择 ──
function handleSelectorCancel() {
  // 用户取消选择
}

// ── 返回 ──
function handleBack() {
  router.back()
}

// ── 初始化 ──
onMounted(() => {
  loadPaperOptions()
  loadExamData()
})
</script>

<style scoped lang="less">
.exam-detail-page {
  max-width: 1200px;
  margin: 0 auto;
}

.form-card {
  margin-top: 16px;
}

.form-hint {
  margin-left: 12px;
  color: #999;
  font-size: 14px;
}

.action-bar {
  margin-top: 24px;
  padding: 16px 0;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}
</style>
