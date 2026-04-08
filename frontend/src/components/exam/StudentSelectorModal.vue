<template>
  <a-modal
    :open="visible"
    title="选择参与学生"
    :width="900"
    :confirm-loading="confirmLoading"
    @ok="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="student-selector">
      <!-- 搜索和筛选 -->
      <div class="selector-header">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-input
              v-model:value="searchKeyword"
              placeholder="搜索学生姓名/学号"
              allow-clear
              @pressEnter="handleSearch"
            >
              <template #prefix><SearchOutlined /></template>
            </a-input>
          </a-col>
          <a-col :span="6">
            <a-select
              v-model:value="gradeFilter"
              placeholder="选择年级"
              style="width: 100%"
              allow-clear
              @change="handleSearch"
            >
              <a-select-option value="高一">高一</a-select-option>
              <a-select-option value="高二">高二</a-select-option>
              <a-select-option value="高三">高三</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="6">
            <a-select
              v-model:value="classFilter"
              placeholder="选择班级"
              style="width: 100%"
              allow-clear
              @change="handleSearch"
            >
              <a-select-option value="1班">1班</a-select-option>
              <a-select-option value="2班">2班</a-select-option>
              <a-select-option value="3班">3班</a-select-option>
              <a-select-option value="4班">4班</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="4">
            <a-button type="primary" @click="handleSearch">查询</a-button>
          </a-col>
        </a-row>

        <!-- 统计信息 -->
        <div class="selector-stats">
          <span class="stat-item">
            共 <strong>{{ studentList.length }}</strong> 名学生
          </span>
          <span class="stat-item">
            已选 <strong style="color: #1890ff;">{{ selectedRowKeys.length }}</strong> 人
          </span>
          <a-button type="link" size="small" @click="handleSelectAll">
            全选当前页
          </a-button>
          <a-button type="link" size="small" @click="handleClear">
            清空选择
          </a-button>
        </div>
      </div>

      <!-- 学生列表 -->
      <a-table
        :columns="columns"
        :data-source="filteredStudentList"
        :row-selection="rowSelection"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="student-name">
              <a-avatar :size="28" style="background-color: #1890ff; margin-right: 8px;">
                {{ record.name.charAt(0) }}
              </a-avatar>
              {{ record.name }}
            </div>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.is_activated ? 'success' : 'warning'">
              {{ record.is_activated ? '已激活' : '未激活' }}
            </a-tag>
          </template>
        </template>
      </a-table>

      <!-- 已选学生标签 -->
      <div v-if="selectedStudents.length > 0" class="selected-tags">
        <div class="tags-title">已选学生：</div>
        <div class="tags-container">
          <a-tag
            v-for="student in selectedStudents.slice(0, 10)"
            :key="student.id"
            closable
            @close="handleRemoveStudent(student.id)"
          >
            {{ student.name }}
          </a-tag>
          <a-tag v-if="selectedStudents.length > 10">
            +{{ selectedStudents.length - 10 }} 人
          </a-tag>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { SearchOutlined } from '@ant-design/icons-vue'
import type { TablePaginationConfig } from 'ant-design-vue'

// ──  Props & Emits  ──
interface Student {
  id: number
  name: string
  student_no: string
  grade: string
  class_name: string
  is_activated: boolean
}

const props = defineProps<{
  visible: boolean
  gradeGroup?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', students: Student[]): void
  (e: 'cancel'): void
}>()

// ──  搜索和筛选状态  ──
const searchKeyword = ref('')
const gradeFilter = ref('')
const classFilter = ref('')
const loading = ref(false)
const confirmLoading = ref(false)

// ──  表格列定义  ──
const columns = [
  {
    title: '姓名',
    key: 'name',
    width: 120,
  },
  {
    title: '学号',
    dataIndex: 'student_no',
    width: 120,
  },
  {
    title: '年级',
    dataIndex: 'grade',
    width: 80,
  },
  {
    title: '班级',
    dataIndex: 'class_name',
    width: 80,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
]

// ──  模拟学生数据  ──
const mockStudentList: Student[] = [
  { id: 1, name: '张三', student_no: '202401001', grade: '高一', class_name: '1班', is_activated: true },
  { id: 2, name: '李四', student_no: '202401002', grade: '高一', class_name: '1班', is_activated: true },
  { id: 3, name: '王五', student_no: '202401003', grade: '高一', class_name: '1班', is_activated: true },
  { id: 4, name: '赵六', student_no: '202401004', grade: '高一', class_name: '2班', is_activated: true },
  { id: 5, name: '孙七', student_no: '202401005', grade: '高一', class_name: '2班', is_activated: false },
  { id: 6, name: '周八', student_no: '202401006', grade: '高一', class_name: '2班', is_activated: true },
  { id: 7, name: '吴九', student_no: '202401007', grade: '高一', class_name: '3班', is_activated: true },
  { id: 8, name: '郑十', student_no: '202401008', grade: '高一', class_name: '3班', is_activated: true },
  { id: 9, name: '钱十一', student_no: '202402001', grade: '高二', class_name: '1班', is_activated: true },
  { id: 10, name: '冯十二', student_no: '202402002', grade: '高二', class_name: '1班', is_activated: true },
  { id: 11, name: '陈十三', student_no: '202402003', grade: '高二', class_name: '2班', is_activated: true },
  { id: 12, name: '褚十四', student_no: '202402004', grade: '高二', class_name: '2班', is_activated: false },
  { id: 13, name: '卫十五', student_no: '202403001', grade: '高三', class_name: '1班', is_activated: true },
  { id: 14, name: '蒋十六', student_no: '202403002', grade: '高三', class_name: '1班', is_activated: true },
  { id: 15, name: '沈十七', student_no: '202403003', grade: '高三', class_name: '2班', is_activated: true },
]

const studentList = ref<Student[]>([...mockStudentList])

// ──  筛选后的列表  ──
const filteredStudentList = computed(() => {
  return studentList.value.filter(student => {
    const matchKeyword = !searchKeyword.value || 
      student.name.includes(searchKeyword.value) || 
      student.student_no.includes(searchKeyword.value)
    const matchGrade = !gradeFilter.value || student.grade === gradeFilter.value
    const matchClass = !classFilter.value || student.class_name === classFilter.value
    return matchKeyword && matchGrade && matchClass
  })
})

// ──  分页配置  ──
const pagination = ref<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: studentList.value.length,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

// ──  行选择配置  ──
const selectedRowKeys = ref<number[]>([])

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: number[]) => {
    selectedRowKeys.value = keys
  },
}))

// ──  已选学生  ──
const selectedStudents = computed(() => {
  return studentList.value.filter(s => selectedRowKeys.value.includes(s.id))
})

// ──  方法  ──
function handleSearch() {
  pagination.value.current = 1
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
}

function handleSelectAll() {
  const currentPageIds = filteredStudentList.value
    .slice((pagination.value.current! - 1) * pagination.value.pageSize!, 
           pagination.value.current! * pagination.value.pageSize!)
    .map(s => s.id)
  
  // 合并已选和当前页
  selectedRowKeys.value = [...new Set([...selectedRowKeys.value, ...currentPageIds])]
}

function handleClear() {
  selectedRowKeys.value = []
}

function handleRemoveStudent(id: number) {
  selectedRowKeys.value = selectedRowKeys.value.filter(key => key !== id)
}

function handleConfirm() {
  confirmLoading.value = true
  setTimeout(() => {
    emit('confirm', selectedStudents.value)
    emit('update:visible', false)
    confirmLoading.value = false
    selectedRowKeys.value = []
  }, 300)
}

function handleCancel() {
  emit('cancel')
  emit('update:visible', false)
}

// ──  监听visible变化  ──
watch(() => props.visible, (newVal) => {
  if (newVal && props.gradeGroup) {
    gradeFilter.value = props.gradeGroup
  }
})
</script>

<style scoped lang="less">
.student-selector {
  .selector-header {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .selector-stats {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 16px;

    .stat-item {
      color: #666;
      font-size: 14px;

      strong {
        font-size: 16px;
        margin: 0 4px;
      }
    }
  }

  .student-name {
    display: flex;
    align-items: center;
  }

  .selected-tags {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;

    .tags-title {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      max-height: 100px;
      overflow-y: auto;
    }
  }
}
</style>
