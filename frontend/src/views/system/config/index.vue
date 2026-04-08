<template>
  <div class="config-page">
    <a-page-header title="参数管理" sub-title="系统参数配置">
      <template #extra>
        <a-button type="primary" @click="handleCreate">
          <PlusOutlined />新增参数
        </a-button>
      </template>
    </a-page-header>
    
    <a-card :bordered="false">
      <!-- 搜索栏 -->
      <a-form layout="inline" :model="searchForm" class="search-form">
        <a-form-item label="参数名称">
          <a-input v-model:value="searchForm.config_name" placeholder="请输入参数名称" allow-clear />
        </a-form-item>
        <a-form-item label="参数键名">
          <a-input v-model:value="searchForm.config_key" placeholder="请输入参数键名" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">
            <SearchOutlined />查询
          </a-button>
          <a-button style="margin-left: 8px" @click="handleReset">
            <ReloadOutlined />重置
          </a-button>
        </a-form-item>
      </a-form>

      <!-- 参数表格 -->
      <a-table 
        :columns="columns" 
        :data-source="configList" 
        :loading="loading" 
        row-key="id"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'config_type'">
            <a-tag :color="record.config_type === 'Y' ? 'orange' : 'blue'">
              {{ record.config_type === 'Y' ? '系统内置' : '自定义' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'config_value'">
            <a-tooltip :title="record.config_value">
              <span class="value-ellipsis">{{ record.config_value }}</span>
            </a-tooltip>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button 
                type="link" 
                size="small" 
                @click="handleEdit(record)"
                :disabled="record.config_type === 'Y'"
              >
                <EditOutlined />编辑
              </a-button>
              <a-popconfirm 
                title="确定要删除这个参数吗？" 
                @confirm="handleDelete(record)"
                :disabled="record.config_type === 'Y'"
              >
                <a-button 
                  type="link" 
                  size="small" 
                  danger
                  :disabled="record.config_type === 'Y'"
                >
                  <DeleteOutlined />删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 参数弹窗 -->
    <a-modal 
      v-model:open="modalVisible" 
      :title="modalTitle" 
      @ok="handleModalOk"
      :confirmLoading="modalLoading"
    >
      <a-form :model="formData" :rules="rules" ref="formRef" layout="vertical">
        <a-form-item label="参数名称" name="config_name">
          <a-input v-model:value="formData.config_name" placeholder="请输入参数名称" />
        </a-form-item>
        <a-form-item label="参数键名" name="config_key">
          <a-input 
            v-model:value="formData.config_key" 
            placeholder="请输入参数键名，如：sys.user.initPassword"
            :disabled="isEdit"
          />
        </a-form-item>
        <a-form-item label="参数键值" name="config_value">
          <a-textarea 
            v-model:value="formData.config_value" 
            :rows="3" 
            placeholder="请输入参数键值"
          />
        </a-form-item>
        <a-form-item label="系统内置" name="config_type" v-if="!isEdit">
          <a-radio-group v-model:value="formData.config_type">
            <a-radio value="N">否</a-radio>
            <a-radio value="Y">是</a-radio>
          </a-radio-group>
          <div class="form-help">系统内置参数不可删除</div>
        </a-form-item>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="formData.remark" :rows="2" placeholder="请输入备注" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import type { TablePaginationConfig } from 'ant-design-vue'

import { getConfigs, createConfig, updateConfig, deleteConfig } from '@/api/system'

const loading = ref(false)
const configList = ref<any[]>([])

const columns = [
  { title: '参数名称', dataIndex: 'config_name', key: 'config_name', width: 180 },
  { title: '参数键名', dataIndex: 'config_key', key: 'config_key', width: 220 },
  { title: '参数键值', key: 'config_value', ellipsis: true },
  { title: '系统内置', key: 'config_type', width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  { title: '创建时间', dataIndex: 'create_time', key: 'create_time', width: 170 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
]

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

// 搜索表单
const searchForm = reactive({
  config_name: '',
  config_key: '',
})

// 弹窗
const modalVisible = ref(false)
const modalLoading = ref(false)
const modalTitle = ref('新增参数')
const isEdit = ref(false)
const formRef = ref()

const formData = reactive({
  id: undefined as number | undefined,
  config_name: '',
  config_key: '',
  config_value: '',
  config_type: 'N',
  remark: '',
})

const rules = {
  config_name: [{ required: true, message: '请输入参数名称', trigger: 'blur' }],
  config_key: [{ required: true, message: '请输入参数键名', trigger: 'blur' }],
  config_value: [{ required: true, message: '请输入参数键值', trigger: 'blur' }],
}

// 加载数据
async function fetchConfigs() {
  loading.value = true
  try {
    const res = await getConfigs({
      page: pagination.current,
      size: pagination.pageSize,
      ...searchForm,
    })
    configList.value = res.data?.list || res.data?.items || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    message.error('获取参数列表失败')
  } finally {
    loading.value = false
  }
}

// 表格分页/排序变化
function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1
  pagination.pageSize = pag.pageSize || 10
  fetchConfigs()
}

// 搜索
function handleSearch() {
  pagination.current = 1
  fetchConfigs()
}

// 重置
function handleReset() {
  searchForm.config_name = ''
  searchForm.config_key = ''
  pagination.current = 1
  fetchConfigs()
}

// 创建
function handleCreate() {
  isEdit.value = false
  modalTitle.value = '新增参数'
  Object.assign(formData, {
    id: undefined,
    config_name: '',
    config_key: '',
    config_value: '',
    config_type: 'N',
    remark: '',
  })
  modalVisible.value = true
}

// 编辑
function handleEdit(record: any) {
  if (record.config_type === 'Y') {
    message.warning('系统内置参数不可编辑')
    return
  }
  isEdit.value = true
  modalTitle.value = '编辑参数'
  Object.assign(formData, record)
  modalVisible.value = true
}

// 删除
async function handleDelete(record: any) {
  if (record.config_type === 'Y') {
    message.warning('系统内置参数不可删除')
    return
  }
  try {
    await deleteConfig(record.id)
    message.success('删除成功')
    fetchConfigs()
  } catch (error) {
    message.error('删除失败')
  }
}

// 弹窗确认
async function handleModalOk() {
  try {
    await formRef.value.validate()
    modalLoading.value = true
    
    if (isEdit.value) {
      await updateConfig(formData.id, formData)
      message.success('更新成功')
    } else {
      await createConfig(formData)
      message.success('创建成功')
    }
    
    modalVisible.value = false
    fetchConfigs()
  } catch (error) {
    // 验证失败或请求失败
  } finally {
    modalLoading.value = false
  }
}

onMounted(fetchConfigs)
</script>

<style scoped>
.config-page {
  padding: 24px;
}
.search-form {
  margin-bottom: 16px;
}
.value-ellipsis {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.form-help {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
