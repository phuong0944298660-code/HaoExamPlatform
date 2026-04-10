<template>
  <div class="notice-page">
    <a-page-header title="通知公告" sub-title="系统公告发布管理">
      <template #extra>
        <a-button type="primary" @click="handleCreate">
          <PlusOutlined />发布公告
        </a-button>
      </template>
    </a-page-header>
    
    <a-card :bordered="false">
      <!-- 搜索栏 -->
      <a-form layout="inline" :model="searchForm" class="search-form">
        <a-form-item label="标题">
          <a-input v-model:value="searchForm.notice_title" placeholder="请输入标题" allow-clear />
        </a-form-item>
        <a-form-item label="类型">
          <a-select v-model:value="searchForm.notice_type" placeholder="请选择类型" allow-clear style="width: 120px">
            <a-select-option value="1">通知</a-select-option>
            <a-select-option value="2">公告</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear style="width: 120px">
            <a-select-option value="0">草稿</a-select-option>
            <a-select-option value="1">已发布</a-select-option>
          </a-select>
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

      <!-- 公告表格 -->
      <a-table 
        :columns="columns" 
        :data-source="noticeList" 
        :loading="loading" 
        row-key="id"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'notice_type'">
            <a-tag :color="record.notice_type === '1' ? 'blue' : 'green'">
              {{ record.notice_type === '1' ? '通知' : '公告' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === '1' ? 'green' : 'default'">
              {{ record.status === '1' ? '已发布' : '草稿' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleView(record)">
                <EyeOutlined />查看
              </a-button>
              <a-button type="link" size="small" @click="handleEdit(record)">
                <EditOutlined />编辑
              </a-button>
              <a-popconfirm title="确定要删除这条公告吗？" @confirm="handleDelete(record)">
                <a-button type="link" size="small" danger>
                  <DeleteOutlined />删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 公告弹窗 -->
    <a-modal 
      v-model:open="modalVisible" 
      :title="modalTitle" 
      @ok="handleModalOk"
      :confirmLoading="modalLoading"
      width="800px"
    >
      <a-form :model="formData" :rules="rules" ref="formRef" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="16">
            <a-form-item label="标题" name="notice_title">
              <a-input v-model:value="formData.notice_title" placeholder="请输入公告标题" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="类型" name="notice_type">
              <a-select v-model:value="formData.notice_type" placeholder="请选择类型">
                <a-select-option value="1">通知</a-select-option>
                <a-select-option value="2">公告</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="内容" name="notice_content">
          <a-textarea 
            v-model:value="formData.notice_content" 
            :rows="8" 
            placeholder="请输入公告内容"
          />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="状态" name="status">
              <a-radio-group v-model:value="formData.status">
                <a-radio value="0">草稿</a-radio>
                <a-radio value="1">立即发布</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 查看公告弹窗 -->
    <a-modal 
      v-model:open="viewModalVisible" 
      title="查看公告" 
      :footer="null"
      width="700px"
    >
      <div class="notice-view">
        <h2>{{ viewData.notice_title }}</h2>
        <div class="notice-meta">
          <a-tag :color="viewData.notice_type === '1' ? 'blue' : 'green'">
            {{ viewData.notice_type === '1' ? '通知' : '公告' }}
          </a-tag>
          <a-tag :color="viewData.status === '1' ? 'green' : 'default'">
            {{ viewData.status === '1' ? '已发布' : '草稿' }}
          </a-tag>
          <span class="create-time">{{ viewData.create_time }}</span>
        </div>
        <div class="notice-content">
          <pre>{{ viewData.notice_content }}</pre>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import type { TablePaginationConfig } from 'ant-design-vue'

import { getNotices, createNotice, updateNotice, deleteNotice } from '@/api/system'

const loading = ref(false)
const noticeList = ref<any[]>([])

const columns = [
  { title: '标题', dataIndex: 'notice_title', key: 'notice_title', ellipsis: true },
  { title: '类型', key: 'notice_type', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建人', dataIndex: 'create_by', key: 'create_by', width: 120 },
  { title: '创建时间', dataIndex: 'create_time', key: 'create_time', width: 170 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' },
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
  notice_title: '',
  notice_type: undefined as string | undefined,
  status: undefined as string | undefined,
})

// 弹窗
const modalVisible = ref(false)
const modalLoading = ref(false)
const modalTitle = ref('发布公告')
const isEdit = ref(false)
const formRef = ref()

const formData = reactive({
  id: undefined as number | undefined,
  notice_title: '',
  notice_type: '1',
  notice_content: '',
  status: '0',
})

const rules = {
  notice_title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  notice_type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  notice_content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
}

// 查看弹窗
const viewModalVisible = ref(false)
const viewData = reactive({
  notice_title: '',
  notice_type: '',
  notice_content: '',
  status: '',
  create_time: '',
})

// 加载数据
async function fetchNotices() {
  loading.value = true
  try {
    const res = await getNotices({
      page: pagination.current,
      size: pagination.pageSize,
      ...searchForm,
    })
    noticeList.value = res.data?.list || res.data?.items || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    message.error('获取公告列表失败')
  } finally {
    loading.value = false
  }
}

// 表格分页/排序变化
function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1
  pagination.pageSize = pag.pageSize || 10
  fetchNotices()
}

// 搜索
function handleSearch() {
  pagination.current = 1
  fetchNotices()
}

// 重置
function handleReset() {
  searchForm.notice_title = ''
  searchForm.notice_type = undefined
  searchForm.status = undefined
  pagination.current = 1
  fetchNotices()
}

// 查看
function handleView(record: any) {
  Object.assign(viewData, record)
  viewModalVisible.value = true
}

// 创建
function handleCreate() {
  isEdit.value = false
  modalTitle.value = '发布公告'
  Object.assign(formData, {
    id: undefined,
    notice_title: '',
    notice_type: '1',
    notice_content: '',
    status: '0',
  })
  modalVisible.value = true
}

// 编辑
function handleEdit(record: any) {
  isEdit.value = true
  modalTitle.value = '编辑公告'
  Object.assign(formData, record)
  modalVisible.value = true
}

// 删除
async function handleDelete(record: any) {
  try {
    await deleteNotice(record.id)
    message.success('删除成功')
    fetchNotices()
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
      await updateNotice(formData.id, formData)
      message.success('更新成功')
    } else {
      await createNotice(formData)
      message.success(formData.status === '1' ? '发布成功' : '保存草稿成功')
    }
    
    modalVisible.value = false
    fetchNotices()
  } catch (error) {
    // 验证失败或请求失败
  } finally {
    modalLoading.value = false
  }
}

onMounted(fetchNotices)
</script>

<style scoped>
.notice-page {
  padding: 24px;
}
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
.notice-view {
  padding: 16px;
}
.notice-view h2 {
  margin-bottom: 16px;
  font-size: 20px;
}
.notice-meta {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.notice-meta .create-time {
  margin-left: 16px;
  color: #999;
}
.notice-content {
  min-height: 200px;
}
.notice-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.8;
  margin: 0;
}
</style>
