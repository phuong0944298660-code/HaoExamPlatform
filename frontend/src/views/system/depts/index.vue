<template>
  <div class="depts-page">
    <a-page-header title="部门管理" sub-title="组织架构管理">
      <template #extra>
        <a-button type="primary" @click="handleCreate">
          <PlusOutlined />新增部门
        </a-button>
      </template>
    </a-page-header>
    
    <a-card :bordered="false">
      <a-table :columns="columns" :data-source="deptList" :loading="loading" row-key="id" 
               :pagination="false" :default-expand-all-rows="true">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleAddChild(record)">添加下级</a-button>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm title="确定要删除这个部门吗？" @confirm="handleDelete(record)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 创建/编辑部门弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleModalOk" :confirmLoading="modalLoading">
      <a-form :model="formData" :rules="rules" ref="formRef" layout="vertical">
        <a-form-item label="上级部门" name="parent_id">
          <a-tree-select
            v-model:value="formData.parent_id"
            :tree-data="deptTreeData"
            :field-names="{ label: 'dept_name', value: 'id', children: 'children' }"
            placeholder="请选择上级部门"
            allow-clear
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="部门名称" name="dept_name">
          <a-input v-model:value="formData.dept_name" placeholder="请输入部门名称" />
        </a-form-item>
        <a-form-item label="显示顺序" name="order_num">
          <a-input-number v-model:value="formData.order_num" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="负责人" name="leader">
          <a-input v-model:value="formData.leader" placeholder="请输入负责人" />
        </a-form-item>
        <a-form-item label="联系电话" name="phone">
          <a-input v-model:value="formData.phone" placeholder="请输入联系电话" />
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="formData.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="formData.status">
            <a-radio :value="1">启用</a-radio>
            <a-radio :value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { getDepts, createDept, updateDept, deleteDept } from '@/api/system'

const loading = ref(false)
const deptList = ref([])
const deptTreeData = ref([])

const columns = [
  { title: '部门名称', dataIndex: 'dept_name', key: 'dept_name', width: 250 },
  { title: '负责人', dataIndex: 'leader', key: 'leader' },
  { title: '联系电话', dataIndex: 'phone', key: 'phone' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '排序', dataIndex: 'order_num', key: 'order_num', width: 80 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 250, fixed: 'right' },
]

// 弹窗相关
const modalVisible = ref(false)
const modalLoading = ref(false)
const modalTitle = ref('新增部门')
const isEdit = ref(false)
const formRef = ref()

const formData = reactive({
  id: undefined as number | undefined,
  parent_id: 0,
  dept_name: '',
  order_num: 0,
  leader: '',
  phone: '',
  email: '',
  status: 1,
})

const rules = {
  dept_name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
}

// 获取部门列表
async function fetchDepts() {
  loading.value = true
  try {
    const res = await getDepts()
    deptList.value = res.data || []
    deptTreeData.value = [{ id: 0, dept_name: '顶级部门', children: res.data || [] }]
  } catch (error) {
    message.error('获取部门列表失败')
  } finally {
    loading.value = false
  }
}

// 创建
function handleCreate() {
  isEdit.value = false
  modalTitle.value = '新增部门'
  resetForm()
  modalVisible.value = true
}

// 添加下级
function handleAddChild(record: any) {
  isEdit.value = false
  modalTitle.value = `添加下级部门 - ${record.dept_name}`
  resetForm()
  formData.parent_id = record.id
  modalVisible.value = true
}

// 编辑
function handleEdit(record: any) {
  isEdit.value = true
  modalTitle.value = '编辑部门'
  Object.assign(formData, record)
  modalVisible.value = true
}

// 删除
async function handleDelete(record: any) {
  try {
    await deleteDept(record.id)
    message.success('删除成功')
    fetchDepts()
  } catch (error) {
    message.error('删除失败')
  }
}

// 重置表单
function resetForm() {
  formData.id = undefined
  formData.parent_id = 0
  formData.dept_name = ''
  formData.order_num = 0
  formData.leader = ''
  formData.phone = ''
  formData.email = ''
  formData.status = 1
}

// 弹窗确认
async function handleModalOk() {
  try {
    await formRef.value.validate()
    modalLoading.value = true
    
    if (isEdit.value) {
      await updateDept(formData.id!, formData)
      message.success('更新成功')
    } else {
      await createDept(formData)
      message.success('创建成功')
    }
    
    modalVisible.value = false
    fetchDepts()
  } catch (error) {
    // 验证失败或请求失败
  } finally {
    modalLoading.value = false
  }
}

onMounted(fetchDepts)
</script>
