<template>
  <div class="dict-page">
    <a-page-header title="字典管理" sub-title="数据字典维护">
      <template #extra>
        <a-button type="primary" @click="handleCreateType">
          <PlusOutlined />新增字典类型
        </a-button>
      </template>
    </a-page-header>
    
    <a-row :gutter="16">
      <!-- 字典类型列表 -->
      <a-col :span="8">
        <a-card title="字典类型" :bordered="false" :loading="typeLoading">
          <a-list :data-source="dictTypeList" :pagination="typePagination">
            <template #renderItem="{ item }">
              <a-list-item 
                :class="{ active: selectedType?.id === item.id }" 
                @click="handleSelectType(item)"
                style="cursor: pointer; padding: 12px; border-radius: 4px;"
              >
                <a-list-item-meta 
                  :title="item.dict_name" 
                  :description="item.dict_type"
                />
                <template #actions>
                  <a-button type="link" size="small" @click.stop="handleEditType(item)">
                    <EditOutlined />
                  </a-button>
                  <a-popconfirm title="确定要删除这个字典类型吗？" @confirm.stop="handleDeleteType(item)">
                    <a-button type="link" size="small" danger>
                      <DeleteOutlined />
                    </a-button>
                  </a-popconfirm>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      
      <!-- 字典数据列表 -->
      <a-col :span="16">
        <a-card :bordered="false" :loading="dataLoading">
          <template #title>
            <span v-if="selectedType">{{ selectedType.dict_name }} - 数据列表</span>
            <span v-else>请选择字典类型</span>
          </template>
          <template #extra>
            <a-button 
              type="primary" 
              size="small" 
              @click="handleCreateData" 
              :disabled="!selectedType"
            >
              <PlusOutlined />新增数据
            </a-button>
          </template>
          
          <a-table 
            :columns="dataColumns" 
            :data-source="dictDataList" 
            row-key="id" 
            size="small"
            :pagination="dataPagination"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-switch 
                  :checked="record.status === 1" 
                  @change="(checked) => handleStatusChange(record, checked)"
                  size="small"
                />
              </template>
              <template v-if="column.key === 'is_default'">
                <a-tag v-if="record.is_default === 1" color="blue">默认</a-tag>
                <span v-else>-</span>
              </template>
              <template v-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="handleEditData(record)">
                    <EditOutlined />编辑
                  </a-button>
                  <a-popconfirm title="确定要删除这条数据吗？" @confirm="handleDeleteData(record)">
                    <a-button type="link" size="small" danger>
                      <DeleteOutlined />删除
                    </a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <!-- 字典类型弹窗 -->
    <a-modal 
      v-model:open="typeModalVisible" 
      :title="typeModalTitle" 
      @ok="handleTypeModalOk"
      :confirmLoading="typeModalLoading"
    >
      <a-form :model="typeForm" :rules="typeRules" ref="typeFormRef" layout="vertical">
        <a-form-item label="字典名称" name="dict_name">
          <a-input v-model:value="typeForm.dict_name" placeholder="请输入字典名称" />
        </a-form-item>
        <a-form-item label="字典类型" name="dict_type">
          <a-input 
            v-model:value="typeForm.dict_type" 
            placeholder="请输入字典类型，如：sys_user_status"
            :disabled="isEditType"
          />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="typeForm.status">
            <a-radio :value="1">启用</a-radio>
            <a-radio :value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="typeForm.remark" :rows="2" placeholder="请输入备注" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 字典数据弹窗 -->
    <a-modal 
      v-model:open="dataModalVisible" 
      :title="dataModalTitle" 
      @ok="handleDataModalOk"
      :confirmLoading="dataModalLoading"
    >
      <a-form :model="dataForm" :rules="dataRules" ref="dataFormRef" layout="vertical">
        <a-form-item label="字典标签" name="dict_label">
          <a-input v-model:value="dataForm.dict_label" placeholder="请输入显示标签" />
        </a-form-item>
        <a-form-item label="字典键值" name="dict_value">
          <a-input v-model:value="dataForm.dict_value" placeholder="请输入存储键值" />
        </a-form-item>
        <a-form-item label="显示排序" name="dict_sort">
          <a-input-number v-model:value="dataForm.dict_sort" :min="0" style="width: 100%" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="是否默认" name="is_default">
              <a-switch :checked="dataForm.is_default === 1" @change="(c) => dataForm.is_default = c ? 1 : 0" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态" name="status">
              <a-switch :checked="dataForm.status === 1" @change="(c) => dataForm.status = c ? 1 : 0" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="dataForm.remark" :rows="2" placeholder="请输入备注" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import type { TablePaginationConfig } from 'ant-design-vue'

import { 
  getDictTypes, createDictType, updateDictType, deleteDictType,
  getDictData, createDictData, updateDictData, deleteDictData 
} from '@/api/system'

const typeLoading = ref(false)
const dataLoading = ref(false)
const dictTypeList = ref<any[]>([])
const dictDataList = ref<any[]>([])
const selectedType = ref<any>(null)

const dataColumns = [
  { title: '标签', dataIndex: 'dict_label', key: 'dict_label', width: 120 },
  { title: '键值', dataIndex: 'dict_value', key: 'dict_value', width: 100 },
  { title: '排序', dataIndex: 'dict_sort', key: 'dict_sort', width: 80 },
  { title: '默认', key: 'is_default', width: 80 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 150 },
]

const typePagination = reactive({ pageSize: 10, current: 1, total: 0 })
const dataPagination = reactive({ pageSize: 10, current: 1, total: 0 })

// 类型弹窗
const typeModalVisible = ref(false)
const typeModalLoading = ref(false)
const typeModalTitle = ref('新增字典类型')
const isEditType = ref(false)
const typeFormRef = ref()

const typeForm = reactive({
  id: undefined as number | undefined,
  dict_name: '',
  dict_type: '',
  status: 1,
  remark: '',
})

const typeRules = {
  dict_name: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
  dict_type: [{ required: true, message: '请输入字典类型', trigger: 'blur' }],
}

// 数据弹窗
const dataModalVisible = ref(false)
const dataModalLoading = ref(false)
const dataModalTitle = ref('新增字典数据')
const isEditData = ref(false)
const dataFormRef = ref()

const dataForm = reactive({
  id: undefined as number | undefined,
  dict_type_id: 0,
  dict_label: '',
  dict_value: '',
  dict_sort: 0,
  is_default: 0,
  status: 1,
  remark: '',
})

const dataRules = {
  dict_label: [{ required: true, message: '请输入字典标签', trigger: 'blur' }],
  dict_value: [{ required: true, message: '请输入字典键值', trigger: 'blur' }],
}

// 加载字典类型
async function fetchDictTypes() {
  typeLoading.value = true
  try {
    const res = await getDictTypes({ page: typePagination.current, size: typePagination.pageSize })
    dictTypeList.value = res.data?.list || res.data?.items || []
    typePagination.total = res.data?.total || 0
  } catch (error) {
    message.error('获取字典类型失败')
  } finally {
    typeLoading.value = false
  }
}

// 选择类型
function handleSelectType(item: any) {
  selectedType.value = item
  fetchDictData(item.id)
}

// 加载字典数据
async function fetchDictData(typeId: number) {
  dataLoading.value = true
  try {
    const res = await getDictData(typeId, { page: dataPagination.current, size: dataPagination.pageSize })
    dictDataList.value = res.data?.list || res.data?.items || []
    dataPagination.total = res.data?.total || 0
  } catch (error) {
    message.error('获取字典数据失败')
  } finally {
    dataLoading.value = false
  }
}

// 创建类型
function handleCreateType() {
  isEditType.value = false
  typeModalTitle.value = '新增字典类型'
  Object.assign(typeForm, { id: undefined, dict_name: '', dict_type: '', status: 1, remark: '' })
  typeModalVisible.value = true
}

// 编辑类型
function handleEditType(item: any) {
  isEditType.value = true
  typeModalTitle.value = '编辑字典类型'
  Object.assign(typeForm, item)
  typeModalVisible.value = true
}

// 删除类型
async function handleDeleteType(item: any) {
  try {
    await deleteDictType(item.id)
    message.success('删除成功')
    fetchDictTypes()
    if (selectedType.value?.id === item.id) {
      selectedType.value = null
      dictDataList.value = []
    }
  } catch (error) {
    message.error('删除失败')
  }
}

// 类型弹窗确认
async function handleTypeModalOk() {
  try {
    await typeFormRef.value.validate()
    typeModalLoading.value = true
    
    if (isEditType.value) {
      await updateDictType(typeForm.id, typeForm)
      message.success('更新成功')
    } else {
      await createDictType(typeForm)
      message.success('创建成功')
    }
    
    typeModalVisible.value = false
    fetchDictTypes()
  } catch (error) {
    // 验证失败或请求失败
  } finally {
    typeModalLoading.value = false
  }
}

// 创建数据
function handleCreateData() {
  if (!selectedType.value) return
  isEditData.value = false
  dataModalTitle.value = `新增数据 - ${selectedType.value.dict_name}`
  Object.assign(dataForm, {
    id: undefined,
    dict_type_id: selectedType.value.id,
    dict_label: '',
    dict_value: '',
    dict_sort: 0,
    is_default: 0,
    status: 1,
    remark: '',
  })
  dataModalVisible.value = true
}

// 编辑数据
function handleEditData(record: any) {
  isEditData.value = true
  dataModalTitle.value = '编辑字典数据'
  Object.assign(dataForm, record)
  dataModalVisible.value = true
}

// 删除数据
async function handleDeleteData(record: any) {
  try {
    await deleteDictData(record.id)
    message.success('删除成功')
    if (selectedType.value) {
      fetchDictData(selectedType.value.id)
    }
  } catch (error) {
    message.error('删除失败')
  }
}

// 状态变更
async function handleStatusChange(record: any, checked: boolean) {
  try {
    record.status = checked ? 1 : 0
    await updateDictData(record.id, { status: record.status })
    message.success('状态更新成功')
  } catch (error) {
    message.error('状态更新失败')
    record.status = checked ? 0 : 1
  }
}

// 数据弹窗确认
async function handleDataModalOk() {
  try {
    await dataFormRef.value.validate()
    dataModalLoading.value = true
    
    if (isEditData.value) {
      await updateDictData(dataForm.id, dataForm)
      message.success('更新成功')
    } else {
      await createDictData(dataForm)
      message.success('创建成功')
    }
    
    dataModalVisible.value = false
    if (selectedType.value) {
      fetchDictData(selectedType.value.id)
    }
  } catch (error) {
    // 验证失败或请求失败
  } finally {
    dataModalLoading.value = false
  }
}

onMounted(fetchDictTypes)
</script>

<style scoped>
.dict-page {
  padding: 24px;
}
.active {
  background-color: #e6f7ff;
}
:deep(.ant-list-item) {
  transition: background-color 0.3s;
}
:deep(.ant-list-item:hover) {
  background-color: #f5f5f5;
}
</style>
