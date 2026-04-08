<template>
  <a-modal
    v-model:open="modalVisible"
    title="手动新增账号"
    :width="520"
    :confirm-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form :model="formState" :rules="rules" ref="formRef" layout="vertical">
      <a-form-item label="账号类型" name="accountType">
        <a-select v-model:value="formState.accountType" placeholder="请选择账号类型">
          <a-select-option value="PRACTICE">练习账号 (PRACTICE)</a-select-option>
          <a-select-option value="EXAM">考试账号 (EXAM)</a-select-option>
          <a-select-option value="SYSTEM">系统账号 (SYSTEM)</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="用户名 (练习账号使用)" name="username" v-if="formState.accountType !== 'EXAM'">
        <a-input v-model:value="formState.username" placeholder="请输入用户名" />
      </a-form-item>

      <a-form-item label="身份证号 (考试账号使用)" name="identityNo" v-if="formState.accountType === 'EXAM'">
        <a-input v-model:value="formState.identityNo" placeholder="请输入 18 位身份证号" />
      </a-form-item>

      <a-form-item label="姓名" name="name">
        <a-input v-model:value="formState.name" placeholder="请输入真实姓名" />
      </a-form-item>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="对应学段" name="gradeGroup">
            <a-select v-model:value="formState.gradeGroup" placeholder="请选择学段">
              <a-select-option value="PRIMARY">小学组</a-select-option>
              <a-select-option value="JUNIOR">初中组</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="角色" name="role">
            <a-select v-model:value="formState.role" placeholder="请选择角色">
              <a-select-option value="student">学生</a-select-option>
              <a-select-option value="teacher">教师</a-select-option>
              <a-select-option value="admin">管理员</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="初始密码" name="password">
        <a-input-password v-model:value="formState.password" placeholder="推荐 123456" />
      </a-form-item>

      <a-form-item label="所属学校" name="school">
        <a-input v-model:value="formState.school" placeholder="请输入学校全称" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import request from '@/utils/request'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible', 'success'])

const modalVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val)
})

const loading = ref(false)
const formRef = ref<FormInstance>()

const formState = reactive({
  accountType: 'PRACTICE',
  username: '',
  identityNo: '',
  name: '',
  gradeGroup: 'PRIMARY',
  role: 'student',
  password: 'admin123',
  school: ''
})

const rules = {
  accountType: [{ required: true, message: '请选择账号类型' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  identityNo: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { len: 18, message: '身份证号必须为 18 位', trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入初始密码', trigger: 'blur' }]
}

const handleOk = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true
    
    // 构造后端需要的 payload
    // 注意：后端接口可能需要 snake_case 或 specific format
    const payload = {
      account_type: formState.accountType,
      username: formState.accountType === 'EXAM' ? undefined : formState.username,
      identity_no: formState.accountType === 'EXAM' ? formState.identityNo : undefined,
      password: formState.password,
      name: formState.name,
      role: formState.role,
      grade_group: formState.gradeGroup,
      school: formState.school,
      is_active: true
    }

    await request.post('/accounts', payload)
    message.success('新增账号成功')
    emit('success')
    handleCancel()
  } catch (error: any) {
    message.error(error.response?.data?.message || '新增失败')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  emit('update:visible', false)
}

// 重置表单
watch(() => props.visible, (val) => {
  if (val) {
    Object.assign(formState, {
      accountType: 'PRACTICE',
      username: '',
      identityNo: '',
      name: '',
      gradeGroup: 'PRIMARY',
      role: 'student',
      password: 'admin123',
      school: ''
    })
  }
})
</script>
