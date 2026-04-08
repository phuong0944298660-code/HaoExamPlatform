<template>
  <div class="users-page">
    <a-page-header title="用户管理" sub-title="系统用户管理">
      <template #extra>
        <a-button type="primary" @click="handleCreate">
          <PlusOutlined />新增用户
        </a-button>
      </template>
    </a-page-header>
    
    <a-card :bordered="false">
      <a-table :columns="columns" :data-source="userList" :loading="loading" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'role'">
            <a-tag color="blue">{{ record.role }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm title="确定要删除这个用户吗？" @confirm="handleDelete(record)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑用户弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleModalOk"
      :confirmLoading="modalLoading"
    >
      <a-form :model="formData" :rules="rules" ref="formRef" layout="vertical">
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="formData.username" placeholder="请输入用户名" :disabled="isEdit" />
        </a-form-item>
        <a-form-item label="昵称" name="nickname">
          <a-input v-model:value="formData.nickname" placeholder="请输入昵称" />
        </a-form-item>
        <a-form-item label="角色" name="role">
          <a-select v-model:value="formData.role" placeholder="请选择角色">
            <a-select-option value="admin">超级管理员</a-select-option>
            <a-select-option value="teacher">教师</a-select-option>
            <a-select-option value="student">学生</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="密码" name="password" :required="!isEdit">
          <a-input-password v-model:value="formData.password" placeholder="请输入密码" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { getUsers, createUser, updateUser, deleteUser } from '@/api/system'

const loading = ref(false)
const userList = ref([])
const modalVisible = ref(false)
const modalLoading = ref(false)
const modalTitle = ref('新增用户')
const isEdit = ref(false)
const formRef = ref()

const columns = [
  { title: '用户ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
  { title: '角色', key: 'role', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '最后登录', dataIndex: 'last_login_time', key: 'last_login_time' },
  { title: '操作', key: 'action', width: 150 },
]

const formData = reactive({
  id: undefined as number | undefined,
  username: '',
  nickname: '',
  role: 'student',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await getUsers({ page: 1, size: 100 })
    userList.value = res.data?.list || []
  } catch {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  isEdit.value = false
  modalTitle.value = '新增用户'
  resetForm()
  modalVisible.value = true
}

function handleEdit(record: any) {
  isEdit.value = true
  modalTitle.value = '编辑用户'
  Object.assign(formData, record)
  formData.password = '' // 不回显密码
  modalVisible.value = true
}

async function handleDelete(record: any) {
  try {
    await deleteUser(record.id)
    message.success('删除成功')
    fetchUsers()
  } catch {
    message.error('删除失败')
  }
}

function resetForm() {
  formData.id = undefined
  formData.username = ''
  formData.nickname = ''
  formData.role = 'student'
  formData.password = ''
}

async function handleModalOk() {
  try {
    await formRef.value.validate()
    modalLoading.value = true
    
    if (isEdit.value) {
      // 实际上 SystemController 里的 updateUserRole 只能更新角色，
      // 这里如果需要更新其他信息，后期需要扩展后端。目前先满足审计需求。
      const updateData = { ...formData }
      if (!updateData.password) delete (updateData as any).password
      await updateUser(formData.id!, updateData)
      message.success('更新成功')
    } else {
      await createUser(formData)
      message.success('创建成功')
    }
    
    modalVisible.value = false
    fetchUsers()
  } catch (error) {
    // 验证失败
  } finally {
    modalLoading.value = false
  }
}

onMounted(fetchUsers)
</script>
