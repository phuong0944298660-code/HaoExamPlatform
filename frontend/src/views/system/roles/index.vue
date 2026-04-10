<template>
  <div class="roles-page">
    <a-page-header title="角色管理" sub-title="系统角色与权限配置">
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <PlusOutlined />新增角色
        </a-button>
      </template>
    </a-page-header>
    
    <a-card :bordered="false">
      <!-- 搜索栏 -->
      <a-form layout="inline" :model="searchForm" class="search-form">
        <a-form-item label="角色名称">
          <a-input v-model:value="searchForm.role_name" placeholder="请输入角色名称" allow-clear />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear style="width: 120px">
            <a-select-option :value="1">启用</a-select-option>
            <a-select-option :value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-form-item>
      </a-form>

      <!-- 数据表格 -->
      <a-table :columns="columns" :data-source="roleList" :loading="loading" row-key="id" :pagination="pagination">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'data_scope'">
            <a-tag>{{ getDataScopeText(record.data_scope) }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-button type="link" size="small" @click="handleAssignMenu(record)">分配权限</a-button>
              <a-popconfirm title="确定要删除这个角色吗？" @confirm="handleDelete(record)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 创建/编辑角色弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleModalOk" :confirmLoading="modalLoading" width="800px">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="basic" tab="基本信息">
          <a-form :model="formData" :rules="rules" ref="formRef" layout="vertical" style="padding-top: 16px">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="角色名称" name="role_name">
                  <a-input v-model:value="formData.role_name" placeholder="请输入角色名称" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="角色标识" name="role_key">
                  <a-input v-model:value="formData.role_key" placeholder="请输入角色标识" :disabled="isEdit" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="显示顺序" name="role_sort">
                  <a-input-number v-model:value="formData.role_sort" :min="0" style="width: 100%" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="状态" name="status">
                  <a-radio-group v-model:value="formData.status" button-style="solid">
                    <a-radio-button :value="1">启用</a-radio-button>
                    <a-radio-button :value="0">禁用</a-radio-button>
                  </a-radio-group>
                </a-form-item>
              </a-col>
              <a-col :span="24">
                <a-form-item label="数据范围" name="data_scope">
                  <a-select v-model:value="formData.data_scope" placeholder="请选择数据范围">
                    <a-select-option value="1">全部数据权限</a-select-option>
                    <a-select-option value="2">本部门数据权限</a-select-option>
                    <a-select-option value="3">本部门及以下数据权限</a-select-option>
                    <a-select-option value="4">仅本人数据权限</a-select-option>
                    <a-select-option value="5">自定义数据权限</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="24">
                <a-form-item label="备注" name="remark">
                  <a-textarea v-model:value="formData.remark" :rows="2" placeholder="请输入备注" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-tab-pane>
        <a-tab-pane key="permission" tab="分配权限">
          <div style="border: 1px solid #f0f0f0; border-radius: 4px; padding: 12px; max-height: 400px; overflow-y: auto; margin-top: 16px">
            <div style="margin-bottom: 8px">
              <a-checkbox v-model:checked="treeExpandAll" @change="handleExpandAll">展开/折叠</a-checkbox>
              <a-checkbox v-model:checked="treeCheckAll" @change="handleCheckAll">全选/全不选</a-checkbox>
            </div>
            <a-tree
              v-model:checkedKeys="checkedMenuKeys"
              :tree-data="menuTreeData"
              checkable
              :field-names="{ title: 'menu_name', key: 'id', children: 'children' }"
              :expanded-keys="expandedKeys"
              @expand="onExpand"
            >
              <template #title="{ menu_name, menu_type }">
                <span>{{ menu_name }}</span>
                <a-tag v-if="menu_type === 'F'" size="small" color="orange" style="margin-left: 8px">按钮</a-tag>
                <a-tag v-else-if="menu_type === 'M'" size="small" color="blue" style="margin-left: 8px">目录</a-tag>
              </template>
            </a-tree>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { getRoles, createRole, updateRole, deleteRole, getMenus, getRoleMenus } from '@/api/system'
import type { TablePaginationConfig } from 'ant-design-vue'

const loading = ref(false)
const roleList = ref<any[]>([])
const menuTreeData = ref([])
const activeTab = ref('basic')

// 搜索表单
const searchForm = reactive({
  role_name: '',
  status: undefined as number | undefined,
})

// 表格列
const columns = [
  { title: '角色ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '角色名称', dataIndex: 'role_name', key: 'role_name' },
  { title: '角色标识', dataIndex: 'role_key', key: 'role_key' },
  { title: '显示顺序', dataIndex: 'role_sort', key: 'role_sort', width: 100 },
  { title: '数据范围', key: 'data_scope' },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'create_time', key: 'create_time' },
  { title: '操作', key: 'action', width: 180 },
]

// 分页
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

// 弹窗相关
const modalVisible = ref(false)
const modalLoading = ref(false)
const modalTitle = ref('新增角色')
const isEdit = ref(false)
const formRef = ref()

const formData = reactive({
  id: undefined as number | undefined,
  role_name: '',
  role_key: '',
  role_sort: 0,
  data_scope: '1',
  status: 1,
  remark: '',
})

const rules = {
  role_name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  role_key: [{ required: true, message: '请输入角色标识', trigger: 'blur' }],
}

// 权限树相关
const checkedMenuKeys = ref<any[]>([])
const expandedKeys = ref<any[]>([])
const treeExpandAll = ref(true)
const treeCheckAll = ref(false)
const allMenuIds = ref<number[]>([])

// 获取角色列表
async function fetchRoles() {
  loading.value = true
  try {
    const res = await getRoles({
      page: pagination.current,
      size: pagination.pageSize,
      ...searchForm,
    })
    roleList.value = res.data?.list || res.data?.items || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    message.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

// 转换菜单树
function buildMenuTree(menus: any[]) {
  allMenuIds.value = menus.map(m => m.id)
  const map: any = {}
  menus.forEach(item => {
    map[item.id] = { ...item, children: [] }
  })
  const tree: any[] = []
  menus.forEach(item => {
    if (item.parent_id && map[item.parent_id]) {
      map[item.parent_id].children.push(map[item.id])
    } else {
      tree.push(map[item.id])
    }
  })
  return tree
}

// 获取菜单树
async function fetchMenus() {
  try {
    const res = await getMenus()
    const flatMenus = res.data || []
    menuTreeData.value = buildMenuTree(flatMenus)
    if (treeExpandAll.value) {
      expandedKeys.value = [...allMenuIds.value]
    }
  } catch (error) {
    message.error('获取菜单列表失败')
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchRoles()
}

const handleReset = () => {
  searchForm.role_name = ''
  searchForm.status = undefined
  handleSearch()
}

const handleAdd = () => {
  isEdit.value = false
  modalTitle.value = '新增角色'
  activeTab.value = 'basic'
  Object.assign(formData, {
    id: undefined,
    role_name: '',
    role_key: '',
    role_sort: 0,
    data_scope: '1',
    status: 1,
    remark: '',
  })
  checkedMenuKeys.value = []
  modalVisible.value = true
}

const handleEdit = async (record: any) => {
  isEdit.value = true
  modalTitle.value = '编辑角色'
  activeTab.value = 'basic'
  Object.assign(formData, record)
  
  // 加载角色的权限
  try {
    const res = await getRoleMenus(record.id)
    checkedMenuKeys.value = res.data || []
    modalVisible.value = true
  } catch (error) {
    message.error('获取权限失败')
  }
}

const handleAssignMenu = (record: any) => {
  handleEdit(record).then(() => {
    activeTab.value = 'permission'
  })
}

const handleModalOk = async () => {
  try {
    await formRef.value.validate()
    modalLoading.value = true
    
    // 组合数据，包含权限ID
    // 处理 a-tree 的 checkedKeys 返回结果 (如果是 checked/halfChecked 对象则取 checked)
    const keys = Array.isArray(checkedMenuKeys.value) 
      ? checkedMenuKeys.value 
      : (checkedMenuKeys.value as any).checked || []

    const submitData = {
      ...formData,
      menu_ids: keys
    }
    
    if (isEdit.value) {
      await updateRole(formData.id!, submitData)
      message.success('更新成功')
    } else {
      await createRole(submitData)
      message.success('创建成功')
    }
    
    modalVisible.value = false
    fetchRoles()
  } catch (error: any) {
    if (error.errorFields) activeTab.value = 'basic'
  } finally {
    modalLoading.value = false
  }
}

const handleDelete = async (record: any) => {
  try {
    await deleteRole(record.id)
    message.success('删除成功')
    fetchRoles()
  } catch (error) {
    message.error('删除失败')
  }
}

const handleExpandAll = () => {
  expandedKeys.value = treeExpandAll.value ? [...allMenuIds.value] : []
}

const handleCheckAll = () => {
  checkedMenuKeys.value = treeCheckAll.value ? [...allMenuIds.value] : []
}

const onExpand = (keys: any[]) => {
  expandedKeys.value = keys
}

function getDataScopeText(scope: string) {
  const map: Record<string, string> = {
    '1': '全部', '2': '本部门', '3': '本部门及以下', '4': '仅本人', '5': '自定义',
  }
  return map[scope] || scope
}

onMounted(() => {
  fetchRoles()
  fetchMenus()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 16px;
}
.search-form :deep(.ant-form-item) {
  margin-bottom: 0;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}
.search-form :deep(.ant-form-item-label) {
  padding-right: 4px;
}
:deep(.ant-tabs-nav) { margin-bottom: 0; }
</style>
