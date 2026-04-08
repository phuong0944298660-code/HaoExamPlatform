<template>
  <div class="menus-page">
    <a-page-header title="菜单管理" sub-title="系统菜单与权限配置">
      <template #extra>
        <a-button type="primary" @click="handleCreate">
          <PlusOutlined />新增菜单
        </a-button>
      </template>
    </a-page-header>
    
    <a-card :bordered="false">
      <a-table :columns="columns" :data-source="menuList" :loading="loading" row-key="id" 
               :pagination="false" :default-expand-all-rows="true">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'parent_name'">
            {{ getParentName(record.parent_id) }}
          </template>
          <template v-if="column.key === 'icon'">
            <a-space>
              <component :is="record.icon" v-if="record.icon && record.icon !== '#' && record.icon.includes('Outlined')" />
              <span v-else>{{ record.icon || '-' }}</span>
            </a-space>
          </template>
          <template v-if="column.key === 'menu_type'">
            <a-tag :color="getMenuTypeColor(record.menu_type)">
              {{ getMenuTypeText(record.menu_type) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'visible'">
            <a-tag :color="record.visible === 1 ? 'blue' : 'default'">
              {{ record.visible === 1 ? '显示' : '隐藏' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleAddChild(record)">添加</a-button>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm title="确定要删除这个菜单吗？" @confirm="handleDelete(record)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 创建/编辑菜单弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleModalOk" :confirmLoading="modalLoading">
      <a-form :model="formData" :rules="rules" ref="formRef" layout="vertical">
        <a-form-item label="上级菜单" name="parent_id">
          <a-tree-select
            v-model:value="formData.parent_id"
            :tree-data="menuTreeData"
            :field-names="{ label: 'menu_name', value: 'id', children: 'children' }"
            placeholder="请选择上级菜单"
            allow-clear
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="菜单类型" name="menu_type">
          <a-radio-group v-model:value="formData.menu_type">
            <a-radio value="M">目录</a-radio>
            <a-radio value="C">菜单</a-radio>
            <a-radio value="F">按钮</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="菜单名称" name="menu_name">
          <a-input v-model:value="formData.menu_name" placeholder="请输入菜单名称" />
        </a-form-item>
        <a-form-item label="路由地址" name="path" v-if="formData.menu_type !== 'F'">
          <a-input v-model:value="formData.path" placeholder="请输入路由地址" />
        </a-form-item>
        <a-form-item label="组件路径" name="component" v-if="formData.menu_type === 'C'">
          <a-input v-model:value="formData.component" placeholder="请输入组件路径，如：system/user/index" />
        </a-form-item>
        <a-form-item label="权限标识" name="perms" v-if="formData.menu_type !== 'M'">
          <a-input v-model:value="formData.perms" placeholder="请输入权限标识，如：system:user:list" />
        </a-form-item>
        <a-form-item label="菜单图标" name="icon" v-if="formData.menu_type !== 'F'">
          <a-input v-model:value="formData.icon" placeholder="请输入图标" />
        </a-form-item>
        <a-form-item label="显示顺序" name="order_num">
          <a-input-number v-model:value="formData.order_num" :min="0" style="width: 100%" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="菜单状态" name="status">
              <a-radio-group v-model:value="formData.status">
                <a-radio :value="1">启用</a-radio>
                <a-radio :value="0">禁用</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="显示状态" name="visible" v-if="formData.menu_type !== 'F'">
              <a-radio-group v-model:value="formData.visible">
                <a-radio :value="1">显示</a-radio>
                <a-radio :value="0">隐藏</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, SettingOutlined, UserOutlined, SolutionOutlined, MenuOutlined, ClusterOutlined, ContactsOutlined, BarcodeOutlined, CalendarOutlined, TeamOutlined, CloudServerOutlined, DatabaseOutlined, FileTextOutlined, ReconciliationOutlined, FormOutlined } from '@ant-design/icons-vue'
import { getMenus, createMenu, updateMenu, deleteMenu } from '@/api/system'

const loading = ref(false)
const menuList = ref<any[]>([])
const menuTreeData = ref<any[]>([])

const columns = [
  { title: '菜单名称', dataIndex: 'menu_name', key: 'menu_name', width: 180 },
  { title: '上级菜单', key: 'parent_name', width: 120 },
  { title: '图标', key: 'icon', width: 80 },
  { title: '类型', key: 'menu_type', width: 100 },
  { title: '路由地址', dataIndex: 'path', key: 'path' },
  { title: '组件路径', dataIndex: 'component', key: 'component' },
  { title: '权限标识', dataIndex: 'perms', key: 'perms' },
  { title: '排序', dataIndex: 'order_num', key: 'order_num', width: 80 },
  { title: '状态', key: 'status', width: 80 },
  { title: '可见', key: 'visible', width: 80 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' },
]

// 获取上级菜单名称
function getParentName(parentId: number) {
  if (parentId === 0) return '主目录'
  const findName = (list: any[]): string | undefined => {
    for (const item of list) {
      if (item.id === parentId) return item.menu_name
      if (item.children) {
        const name = findName(item.children)
        if (name) return name
      }
    }
  }
  return findName(menuList.value) || '-'
}

// 弹窗相关
const modalVisible = ref(false)
const modalLoading = ref(false)
const modalTitle = ref('新增菜单')
const isEdit = ref(false)
const formRef = ref()

const formData = reactive({
  id: undefined as number | undefined,
  parent_id: 0,
  menu_name: '',
  menu_type: 'M',
  path: '',
  component: '',
  perms: '',
  icon: '#',
  order_num: 0,
  status: 1,
  visible: 1,
})

const rules = {
  menu_name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
}

// 获取菜单类型颜色
function getMenuTypeColor(type: string) {
  const colors: Record<string, string> = { M: 'blue', C: 'green', F: 'orange' }
  return colors[type] || 'default'
}

// 获取菜单类型文本
function getMenuTypeText(type: string) {
  const texts: Record<string, string> = { M: '目录', C: '菜单', F: '按钮' }
  return texts[type] || type
}

// 获取菜单列表
async function fetchMenus() {
  loading.value = true
  try {
    const res = await getMenus()
    menuList.value = res.data || []
    menuTreeData.value = [{ id: 0, menu_name: '主目录', children: res.data || [] }]
  } catch (error) {
    message.error('获取菜单列表失败')
  } finally {
    loading.value = false
  }
}

// 创建
function handleCreate() {
  isEdit.value = false
  modalTitle.value = '新增菜单'
  resetForm()
  modalVisible.value = true
}

// 添加子菜单
function handleAddChild(record: any) {
  isEdit.value = false
  modalTitle.value = `添加子菜单 - ${record.menu_name}`
  resetForm()
  formData.parent_id = record.id
  modalVisible.value = true
}

// 编辑
function handleEdit(record: any) {
  isEdit.value = true
  modalTitle.value = '编辑菜单'
  Object.assign(formData, record)
  modalVisible.value = true
}

// 删除
async function handleDelete(record: any) {
  try {
    await deleteMenu(record.id)
    message.success('删除成功')
    fetchMenus()
  } catch (error) {
    message.error('删除失败')
  }
}

// 重置表单
function resetForm() {
  formData.id = undefined
  formData.parent_id = 0
  formData.menu_name = ''
  formData.menu_type = 'M'
  formData.path = ''
  formData.component = ''
  formData.perms = ''
  formData.icon = '#'
  formData.order_num = 0
  formData.status = 1
  formData.visible = 1
}

// 弹窗确认
async function handleModalOk() {
  try {
    await formRef.value.validate()
    modalLoading.value = true
    
    if (isEdit.value) {
      await updateMenu(formData.id!, formData)
      message.success('更新成功')
    } else {
      await createMenu(formData)
      message.success('创建成功')
    }
    
    modalVisible.value = false
    fetchMenus()
  } catch (error) {
    // 验证失败或请求失败
  } finally {
    modalLoading.value = false
  }
}

onMounted(fetchMenus)
</script>
