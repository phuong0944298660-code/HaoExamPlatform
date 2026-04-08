# 补充开发计划

> 基于需求对比分析 (REQUIREMENTS_GAP_ANALYSIS.md v2.0) 制定的详细实施方案

---

## 项目概述

| 项目 | 内容 |
|-----|-----|
| 计划名称 | 未完成需求补充开发计划 |
| 计划周期 | 12-17天（含 Phase 0 紧急修复） |
| 优先级 | P-Critical(致命) > P0(高) > P1(中) > P2(低) |
| 目标版本 | v1.1.0 |

> ⚠️ **v2.0 更新**: 代码审查发现3个教师端核心页面和1个学生端页面使用100% Mock假数据，在原有计划前新增 Phase 0 紧急修复。

---

## Phase 0: P-Critical 前端Mock数据替换 + 关键修复 (3-5天)

> **背景**: 代码审查发现教师端 Scores.vue、Resources.vue、ExamDashboard.vue 三个页面**完全使用硬编码假数据运行**，后端API已就绪、前端API封装已存在但从未被调用。学生端 ExamResult.vue 为纯占位。这些问题直接导致系统核心功能不可用。

### 任务0.1: 教师端 Scores.vue 接入真实API (0.5天)

**目标**: 将假数据替换为真实API调用

**具体变更**:

```vue
<!-- 需要移除的Mock代码 -->
- const mockExamList = [...]           // 删除硬编码考试列表
- function generateMockScores() {...}  // 删除随机成绩生成器
- setTimeout(() => { ... }, 500)       // 删除所有模拟延迟

<!-- 需要添加的真实API调用 -->
+ import { getExams } from '@/api/exams'
+ import { getScores, exportScores } from '@/api/scores'
+
+ const fetchExamList = async () => {
+   const res = await getExams({ page: 1, size: 100 })
+   examList.value = res.data
+ }
+
+ const fetchScores = async () => {
+   const res = await getScores({
+     exam_id: selectedExamId.value,
+     page: pagination.current,
+     size: pagination.pageSize
+   })
+   scoreList.value = res.data
+   pagination.total = res.meta.total
+ }
+
+ const handleExport = async (format: string) => {
+   const blob = await exportScores({
+     exam_id: selectedExamId.value,
+     format
+   })
+   // 触发浏览器下载
+   const url = URL.createObjectURL(blob)
+   const link = document.createElement('a')
+   link.href = url
+   link.download = `成绩表.${format === 'excel' ? 'xlsx' : 'csv'}`
+   link.click()
+ }
```

**验收标准**:
- [ ] 考试列表从后端API加载
- [ ] 成绩数据来自真实数据库
- [ ] 统计数据（均分、最高分等）基于真实数据计算
- [ ] Excel/CSV导出触发真实文件下载
- [ ] 分页、搜索、排序功能正常

---

### 任务0.2: 教师端 Resources.vue 接入真实API (1天)

**目标**: 移除全部Mock，对接资源管理API

**具体变更**:
```vue
<!-- 需要移除的Mock代码 -->
- const mockResources = [...]              // 删除硬编码资源列表
- const customUpload = () => {             // 删除模拟上传
-   setInterval(() => { progress++ }, 100)
- }

<!-- 需要添加的真实API调用 -->
+ import { getResources, uploadResource, deleteResource } from '@/api/resources'
+
+ const fetchResources = async () => {
+   const res = await getResources({
+     page: pagination.current,
+     size: pagination.pageSize,
+     name: searchText.value,
+     file_type: selectedType.value
+   })
+   resourceList.value = res.data
+   pagination.total = res.meta.total
+ }
+
+ const customUpload = async ({ file, onProgress, onSuccess, onError }) => {
+   const formData = new FormData()
+   formData.append('file', file)
+   formData.append('category_path', currentCategory.value)
+   try {
+     const res = await uploadResource(formData, {
+       onUploadProgress: (e) => onProgress({ percent: Math.round(e.loaded * 100 / e.total) })
+     })
+     onSuccess(res)
+     message.success('上传成功')
+     fetchResources()
+   } catch (err) {
+     onError(err)
+   }
+ }
```

**验收标准**:
- [ ] 资源列表从后端API加载
- [ ] 文件上传实际提交到服务器
- [ ] 删除操作调用后端API
- [ ] 搜索和类型筛选功能正常
- [ ] 下载按钮置灰并显示"仅支持在线预览"提示

---

### 任务0.3: 教师端 ExamDashboard.vue 接入真实API (1天)

**目标**: 实现真实的考试实时监控

**具体变更**:
```vue
<!-- 需要移除 -->
- function loadExamData() { return hardcodedExam }
- function loadStudents() { return weightedRandom(456) }

<!-- 需要添加 -->
+ import { getExamDetail, getExamDashboard, getExamStudents, emergencyExtend, closeExam } from '@/api/exams'
+ import { forceSubmitExam } from '@/api/exams'  // 如果存在
+
+ const loadExamData = async () => {
+   const [examRes, dashRes] = await Promise.all([
+     getExamDetail(examId),
+     getExamDashboard(examId)
+   ])
+   examInfo.value = examRes.data
+   dashboardStats.value = dashRes.data
+ }
+
+ const loadStudents = async () => {
+   const res = await getExamStudents(examId, {
+     page: pagination.current, size: pagination.pageSize
+   })
+   studentList.value = res.data
+   pagination.total = res.meta.total
+ }
```

**附加功能**:
- 添加"紧急延时"按钮 → 调用 `emergencyExtend` API
- 添加"关闭考试"按钮 → 调用 `closeExam` API
- "强制提交"按钮 → 调用后端提交API（需确认端点）

**验收标准**:
- [ ] 考试信息和统计数据来自真实API
- [ ] 学生列表来自真实数据
- [ ] 自动刷新(10秒)拉取真实数据
- [ ] 强制提交调用后端API
- [ ] 紧急延时/关闭考试按钮可用

---

### 任务0.4: 学生端 ExamResult.vue 实现成绩展示 (1天)

**目标**: 从纯占位改造为完整的考试结果页面

**具体变更**:
```vue
<template>
  <div class="exam-result">
    <a-spin :spinning="loading">
      <!-- 成绩概览 -->
      <a-result v-if="result" :status="resultStatus" :title="resultTitle">
        <template #extra>
          <div class="score-overview">
            <a-statistic title="总分" :value="result.total_score" :precision="2"
              :value-style="{ color: result.total_score >= 60 ? '#3f8600' : '#cf1322' }" />
          </div>
          <a-descriptions bordered :column="2" class="mt-4">
            <a-descriptions-item label="单选题">{{ result.single_choice_score }}分</a-descriptions-item>
            <a-descriptions-item label="多选题">{{ result.multi_choice_score }}分</a-descriptions-item>
            <a-descriptions-item label="判断题">{{ result.judgment_score }}分</a-descriptions-item>
            <a-descriptions-item label="主观题">
              {{ result.subjective_score != null ? result.subjective_score + '分' : '待评分' }}
            </a-descriptions-item>
            <a-descriptions-item label="提交时间">{{ formatTime(result.submitted_at) }}</a-descriptions-item>
            <a-descriptions-item label="考试状态">
              <a-tag :color="statusColor">{{ statusText }}</a-tag>
            </a-descriptions-item>
          </a-descriptions>
          <a-button type="primary" @click="router.push('/student')" class="mt-4">返回首页</a-button>
        </template>
      </a-result>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getStudentScoreDetail } from '@/api/scores'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const result = ref(null)

onMounted(async () => {
  try {
    const examId = route.params.examId
    const accountId = route.params.accountId || 'me'
    const res = await getStudentScoreDetail(examId, accountId)
    result.value = res.data
  } catch (err) {
    // 如果获取失败，显示基本的"已提交"状态
    result.value = { submitted: true }
  } finally {
    loading.value = false
  }
})
</script>
```

**验收标准**:
- [ ] 页面加载时从API获取真实成绩数据
- [ ] 显示总分、各题型分数、提交时间
- [ ] 主观题未评分时显示"待评分"
- [ ] API调用失败时优雅降级为"已提交"状态

---

### 任务0.5: ExamPage.vue 集成 Subjective.vue + 答题恢复 (1天)

**目标**:
1. 修复 `Subjective.vue` 的 broken import
2. 在 `ExamPage.vue` 中用 `<Subjective>` 替换主观题的 `<a-textarea>`
3. 页面加载时调用 `getExamProgress` 恢复已保存答案

**步骤1 — 修复 Subjective.vue**:
```typescript
// 删除不存在的import
- import type { SubjectiveUpload } from '@/layouts/ExamLayout.vue'
// 改为本地定义类型
+ interface SubjectiveAnswer {
+   text: string
+   files: UploadFile[]
+ }
```

**步骤2 — ExamPage.vue 集成**:
```vue
+ import Subjective from '@/components/exam/Subjective.vue'

<!-- 替换主观题渲染 -->
- <a-textarea v-if="currentQuestion.type === 'subjective'" ... />
+ <Subjective
+   v-if="currentQuestion.type === 'subjective'"
+   v-model:answer="answers[currentQuestion.id]"
+   :question="currentQuestion"
+   @change="saveAnswer"
+ />
```

**步骤3 — 答题恢复**:
```typescript
onMounted(async () => {
  // 加载试题
  await loadQuestions()
  // 恢复已保存的答题进度
  try {
    const progressRes = await getExamProgress(examId)
    if (progressRes.data) {
      answers.value = progressRes.data
    }
  } catch (err) {
    console.warn('恢复答题进度失败:', err)
  }
})
```

**验收标准**:
- [ ] 主观题显示文本输入区 + 文件上传区域
- [ ] 文件上传调用真实上传API
- [ ] 刷新页面后已保存的答案被恢复
- [ ] 组件编译无错误

---

### 任务0.6: 注册 WebSocket 路由 (0.5天)

**目标**: 创建 WebSocket 端点并注册到 FastAPI 应用

**创建文件** `app/websocket/exam_ws.py`:
```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from app.websocket.manager import ws_manager
from app.core.auth import get_current_user_id_from_token

router = APIRouter()

@router.websocket("/ws/exam/{exam_id}")
async def exam_websocket(
    websocket: WebSocket,
    exam_id: int,
    token: str = Query(...),
):
    """考试实时同步 WebSocket 端点"""
    try:
        account_id = await get_current_user_id_from_token(token)
    except Exception:
        await websocket.close(code=4001)
        return

    await ws_manager.connect(websocket, account_id, exam_id)
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            if msg_type == "heartbeat":
                await ws_manager.send_personal_message(account_id, {
                    "type": "heartbeat_ack",
                    "server_time": datetime.utcnow().isoformat()
                })
    except WebSocketDisconnect:
        await ws_manager.disconnect(account_id, reason="client_disconnect")
```

**注册到 main.py**:
```python
from app.websocket.exam_ws import router as ws_router
app.include_router(ws_router)
```

**验收标准**:
- [ ] WebSocket 端点可连接
- [ ] 心跳机制工作
- [ ] 多端登录时旧连接被踢出
- [ ] 断线后自动清理连接

---

**目标**: 实现从压缩包批量导入裁判评分表

**技术方案**:

#### 后端开发

1. **创建模型** (`app/models/grading.py`)
```python
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, UniqueConstraint
from app.core.database import Base
from datetime import datetime

class GradingSheet(Base):
    __tablename__ = "grading_sheets"
    
    id = Column(Integer, primary_key=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), index=True)
    judge_name = Column(String(50), nullable=True)
    judge_order = Column(Integer, default=1)
    file_url = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    is_valid = Column(Boolean, default=True)
    created_by = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('exam_id', 'account_id', 'judge_order', name='uq_grading_sheet'),
    )
```

2. **创建服务** (`app/services/grading_import_service.py`)
```python
import os
import zipfile
import tarfile
import tempfile
import shutil
from typing import List, Dict
from fastapi import UploadFile
import aiofiles

class GradingImportService:
    def __init__(self, db, storage_service):
        self.db = db
        self.storage = storage_service
    
    async def batch_import_from_archive(
        self,
        exam_id: int,
        archive_file: UploadFile,
        current_user_id: int
    ) -> Dict:
        """从压缩包批量导入评分表"""
        temp_dir = tempfile.mkdtemp()
        
        try:
            # 保存并解压文件
            file_path = os.path.join(temp_dir, archive_file.filename)
            async with aiofiles.open(file_path, 'wb') as f:
                content = await archive_file.read()
                await f.write(content)
            
            extract_dir = os.path.join(temp_dir, "extracted")
            os.makedirs(extract_dir, exist_ok=True)
            
            # 解压文件
            if archive_file.filename.endswith('.zip'):
                with zipfile.ZipFile(file_path, 'r') as zf:
                    zf.extractall(extract_dir)
            elif archive_file.filename.endswith(('.tar.gz', '.tgz')):
                with tarfile.open(file_path, 'r:gz') as tf:
                    tf.extractall(extract_dir)
            elif archive_file.filename.endswith('.rar'):
                import subprocess
                subprocess.run(['unrar', 'x', file_path, extract_dir], check=True)
            
            # 处理解压后的文件
            results = {"success": [], "failed": []}
            
            for student_folder in os.listdir(extract_dir):
                folder_path = os.path.join(extract_dir, student_folder)
                if not os.path.isdir(folder_path):
                    continue
                
                result = await self._process_student_folder(
                    exam_id, student_folder, folder_path, current_user_id
                )
                
                if result["success"]:
                    results["success"].append(result)
                else:
                    results["failed"].append(result)
            
            return results
            
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
    
    async def _process_student_folder(
        self, exam_id: int, identity_no: str, folder_path: str, user_id: int
    ) -> Dict:
        """处理单个学生文件夹"""
        from app.models.account import Account
        from app.models.exam import StudentExamAssignment
        
        # 查找学生
        student = await self.db.query(Account).filter(
            Account.identity_no == identity_no,
            Account.account_type == "exam"
        ).first()
        
        if not student:
            return {"success": False, "identity_no": identity_no, "reason": "未找到学生"}
        
        # 验证考试关联
        assignment = await self.db.query(StudentExamAssignment).filter(
            StudentExamAssignment.exam_id == exam_id,
            StudentExamAssignment.account_id == student.id
        ).first()
        
        if not assignment:
            return {"success": False, "identity_no": identity_no, "reason": "学生未参加此考试"}
        
        # 上传评分表
        sheets = []
        for idx, sheet_file in enumerate(sorted(os.listdir(folder_path)), 1):
            file_path = os.path.join(folder_path, sheet_file)
            if not os.path.isfile(file_path):
                continue
            
            # 上传到存储
            with open(file_path, 'rb') as f:
                url = await self.storage.upload(
                    f"grading_sheets/{exam_id}/{student.id}/{sheet_file}",
                    f.read()
                )
            
            # 创建记录
            sheet = GradingSheet(
                exam_id=exam_id,
                account_id=student.id,
                judge_name=sheet_file.split('.')[0][:50],
                judge_order=idx,
                file_url=url,
                file_name=sheet_file,
                file_size=os.path.getsize(file_path),
                created_by=user_id
            )
            self.db.add(sheet)
            sheets.append({"judge_order": idx, "file_name": sheet_file})
        
        await self.db.commit()
        
        return {
            "success": True,
            "identity_no": identity_no,
            "student_name": student.name,
            "sheets_count": len(sheets)
        }
```

3. **创建API** (`app/api/v1/scores.py` 新增)
```python
from fastapi import APIRouter, UploadFile, File, Depends
from app.services.grading_import_service import GradingImportService

@router.post("/scores/{exam_id}/grading-sheets:batchImport")
async def batch_import_grading_sheets(
    exam_id: int,
    archive_file: UploadFile = File(...),
    current_user: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """批量导入评分表压缩包"""
    service = GradingImportService(db, storage_service)
    results = await service.batch_import_from_archive(
        exam_id, archive_file, current_user.id
    )
    
    return {
        "code": 200,
        "message": f"导入完成: 成功{len(results['success'])}人, 失败{len(results['failed'])}人",
        "data": results
    }
```

#### 前端开发

1. **创建组件** (`frontend/src/components/grading/GradingSheetUploader.vue`)
```vue
<template>
  <div class="grading-sheet-uploader">
    <a-card title="批量导入评分表">
      <a-alert
        message="上传格式说明"
        description="压缩包内需按'身份证号/评分表图片'的结构组织"
        type="info"
        show-icon
        class="mb-4"
      />
      
      <a-upload-dragger
        v-model:fileList="fileList"
        name="archive_file"
        :accept="'.zip,.rar,.tar.gz'"
        :customRequest="handleUpload"
        :beforeUpload="beforeUpload"
      >
        <p class="ant-upload-drag-icon">
          <inbox-outlined />
        </p>
        <p class="ant-upload-text">点击或拖拽上传评分表压缩包</p>
        <p class="ant-upload-hint">
          支持格式：ZIP、RAR、TAR.GZ，单个文件不超过500MB
        </p>
      </a-upload-dragger>
    </a-card>
    
    <!-- 导入进度弹窗 -->
    <a-modal
      v-model:visible="progressVisible"
      title="导入进度"
      :footer="null"
      :maskClosable="false"
      :closable="false"
    >
      <a-progress :percent="progress" :status="progressStatus" />
      <div class="import-stats mt-4">
        <a-tag color="success">成功: {{ successCount }}</a-tag>
        <a-tag color="error">失败: {{ failedCount }}</a-tag>
      </div>
      <a-list
        v-if="failedItems.length > 0"
        size="small"
        :dataSource="failedItems"
        class="mt-4"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <span>{{ item.identity_no }}</span>
            <span class="error-reason">{{ item.reason }}</span>
          </a-list-item>
        </template>
      </a-list>
    </a-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { InboxOutlined } from '@ant-design/icons-vue';
import { uploadGradingSheets } from '@/api/scores';

const props = defineProps({ examId: Number });

const fileList = ref([]);
const progressVisible = ref(false);
const progress = ref(0);
const progressStatus = ref('active');
const successCount = ref(0);
const failedCount = ref(0);
const failedItems = ref([]);

const beforeUpload = (file) => {
  const validTypes = ['application/zip', 'application/x-rar-compressed', 'application/gzip'];
  const isValid = validTypes.includes(file.type) || 
    file.name.endsWith('.zip') || 
    file.name.endsWith('.rar') ||
    file.name.endsWith('.tar.gz');
  
  if (!isValid) {
    message.error('请上传 ZIP、RAR 或 TAR.GZ 格式的压缩包');
    return false;
  }
  
  const isLt500M = file.size / 1024 / 1024 < 500;
  if (!isLt500M) {
    message.error('文件大小不能超过 500MB');
    return false;
  }
  
  return true;
};

const handleUpload = async ({ file, onProgress, onSuccess, onError }) => {
  progressVisible.value = true;
  progress.value = 0;
  progressStatus.value = 'active';
  
  try {
    const formData = new FormData();
    formData.append('archive_file', file);
    
    const result = await uploadGradingSheets(props.examId, formData, {
      onUploadProgress: (progressEvent) => {
        progress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      }
    });
    
    successCount.value = result.data.success.length;
    failedCount.value = result.data.failed.length;
    failedItems.value = result.data.failed;
    progressStatus.value = failedCount.value > 0 ? 'exception' : 'success';
    
    onSuccess(result);
    message.success(`导入完成：成功${successCount.value}人，失败${failedCount.value}人`);
  } catch (error) {
    progressStatus.value = 'exception';
    onError(error);
    message.error('导入失败：' + error.message);
  }
};
</script>
```

**验收标准**:
- [ ] 支持ZIP/RAR格式压缩包上传
- [ ] 正确解压并按文件夹结构匹配学生
- [ ] 显示导入进度和结果统计
- [ ] 失败项显示具体原因

---

### 任务1.2: 成绩查询显示裁判评分表

**目标**: 学生在成绩查询页面可查看3名裁判的评分表图片

#### 后端开发

1. **扩展API** (`app/api/v1/scores.py`)
```python
@router.get("/scores/my-result")
async def get_my_exam_result(
    exam_id: int,
    current_user: User = Depends(get_current_student)
):
    """学生查询本人成绩详情（含评分表）"""
    from app.models.grading import GradingSheet
    from app.models.exam import Exam, StudentExamAssignment
    
    # 检查成绩查询是否开放
    exam = await db.get(Exam, exam_id)
    if not exam or not exam.can_query_score:
        raise HTTPException(403, "成绩查询暂未开放")
    
    # 获取考试记录
    assignment = await db.query(StudentExamAssignment).filter(
        StudentExamAssignment.exam_id == exam_id,
        StudentExamAssignment.account_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(404, "未找到考试记录")
    
    # 获取排名
    rank = await calculate_rank(exam_id, assignment.total_score, assignment.submitted_at)
    
    # 获取评分表
    grading_sheets = await db.query(GradingSheet).filter(
        GradingSheet.exam_id == exam_id,
        GradingSheet.account_id == current_user.id,
        GradingSheet.is_valid == True
    ).order_by(GradingSheet.judge_order).all()
    
    result = {
        "exam_name": exam.name,
        "objective_score": assignment.objective_score,
        "subjective_score": assignment.subjective_score,
        "total_score": assignment.total_score,
        "submitted_at": assignment.submitted_at.isoformat() if assignment.submitted_at else None,
        "rank": rank,
        "grading_sheets": [
            {
                "id": sheet.id,
                "judge_name": sheet.judge_name or f"裁判{sheet.judge_order}",
                "judge_order": sheet.judge_order,
                "image_url": sheet.file_url,
                "uploaded_at": sheet.created_at.isoformat()
            }
            for sheet in grading_sheets
        ]
    }
    
    return {"code": 200, "data": result}
```

#### 前端开发

1. **创建页面** (`frontend/src/views/student/ScoreResult.vue`)
```vue
<template>
  <div class="score-result-page">
    <!-- 成绩概览卡片 -->
    <a-card class="score-overview-card">
      <div class="score-header">
        <h2>{{ result.exam_name }}</h2>
        <a-tag :color="rankColor">第 {{ result.rank }} 名</a-tag>
      </div>
      
      <div class="score-content">
        <div class="total-score">
          <div class="score-number">{{ result.total_score }}</div>
          <div class="score-label">总分</div>
        </div>
        
        <a-divider type="vertical" class="score-divider" />
        
        <div class="score-details">
          <div class="detail-item">
            <span class="detail-label">客观题</span>
            <span class="detail-value">{{ result.objective_score }}分</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">主观题</span>
            <span class="detail-value">{{ result.subjective_score }}分</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">提交时间</span>
            <span class="detail-value">{{ formatTime(result.submitted_at) }}</span>
          </div>
        </div>
      </div>
    </a-card>
    
    <!-- 裁判评分表 -->
    <a-card title="裁判评分表" class="grading-sheets-card">
      <a-empty v-if="!result.grading_sheets?.length" description="暂无评分表" />
      
      <div v-else class="grading-sheets-grid">
        <div
          v-for="sheet in result.grading_sheets"
          :key="sheet.id"
          class="grading-sheet-item"
        >
          <div class="sheet-header">
            <span class="judge-name">{{ sheet.judge_name }}</span>
            <a-tag size="small">第{{ sheet.judge_order }}裁判</a-tag>
          </div>
          
          <a-image
            :src="sheet.image_url"
            :alt="sheet.judge_name"
            class="sheet-image"
          />
          
          <div class="sheet-footer">
            上传于 {{ formatTime(sheet.uploaded_at) }}
          </div>
        </div>
      </div>
    </a-card>
    
    <!-- 操作提示 -->
    <a-alert
      message="成绩质疑处理"
      description="如对成绩有疑议，请先仔细核对评分表和提交内容。如有问题请联系赛事组委会。"
      type="info"
      show-icon
      class="mt-4"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { getMyExamResult } from '@/api/scores';

const route = useRoute();
const result = ref({});

const rankColor = computed(() => {
  const rank = result.value.rank;
  if (rank <= 3) return 'gold';
  if (rank <= 10) return 'blue';
  return 'default';
});

const formatTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-';
};

const fetchResult = async () => {
  try {
    const examId = route.params.examId;
    const res = await getMyExamResult(examId);
    result.value = res.data;
  } catch (error) {
    message.error('获取成绩失败：' + error.message);
  }
};

onMounted(fetchResult);
</script>

<style scoped>
.score-overview-card {
  margin-bottom: 24px;
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.score-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

.total-score {
  text-align: center;
  min-width: 120px;
}

.score-number {
  font-size: 48px;
  font-weight: bold;
  color: #1890ff;
  line-height: 1;
}

.score-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.score-divider {
  height: 80px;
}

.score-details {
  flex: 1;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
}

.detail-item:last-child {
  border-bottom: none;
}

.grading-sheets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.grading-sheet-item {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.sheet-header {
  padding: 12px;
  background: #f5f5f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.judge-name {
  font-weight: 500;
}

.sheet-image {
  width: 100%;
  min-height: 200px;
  object-fit: contain;
}

.sheet-footer {
  padding: 8px 12px;
  font-size: 12px;
  color: #999;
  text-align: right;
}
</style>
```

**验收标准**:
- [ ] 学生可在成绩查询页面查看评分表
- [ ] 3名裁判评分表按顺序展示
- [ ] 评分表图片支持放大预览
- [ ] 仅本人可查看自己的评分表

---

## Phase 2: P1 中优先级需求 (4-5天)

### 任务2.1: 成绩查询时间段控制

**目标**: 支持配置成绩查询开放时间窗口

**技术方案**:

1. **数据库迁移**
```sql
-- 扩展exams表
ALTER TABLE exams 
ADD COLUMN is_score_query_open BOOLEAN DEFAULT FALSE,
ADD COLUMN score_query_start_time DATETIME NULL,
ADD COLUMN score_query_end_time DATETIME NULL;
```

2. **后端实现**
```python
# app/models/exam.py

class Exam(Base):
    # ... 现有字段 ...
    
    is_score_query_open = Column(Boolean, default=False)
    score_query_start_time = Column(DateTime, nullable=True)
    score_query_end_time = Column(DateTime, nullable=True)
    
    @property
    def can_query_score(self) -> bool:
        """检查当前是否可以查询成绩"""
        if not self.is_score_query_open:
            return False
        
        now = datetime.utcnow()
        if self.score_query_start_time and now < self.score_query_start_time:
            return False
        if self.score_query_end_time and now > self.score_query_end_time:
            return False
        
        return True

# API
@router.put("/exams/{exam_id}/score-query-config")
async def config_score_query(
    exam_id: int,
    config: ScoreQueryConfig,
    current_user: User = Depends(get_current_admin)
):
    """配置成绩查询时间"""
    exam = await db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(404, "考试不存在")
    
    exam.is_score_query_open = config.is_open
    exam.score_query_start_time = config.start_time
    exam.score_query_end_time = config.end_time
    
    await db.commit()
    
    return {"code": 200, "message": "配置成功"}
```

3. **定时任务**
```python
# app/tasks/score_query_tasks.py

@celery_app.task
def auto_toggle_score_query():
    """自动开启/关闭成绩查询"""
    now = datetime.utcnow()
    
    # 自动开启
    db.execute(
        update(Exam)
        .where(
            Exam.is_score_query_open == False,
            Exam.score_query_start_time <= now,
            or_(Exam.score_query_end_time > now, Exam.score_query_end_time.is_(None))
        )
        .values(is_score_query_open=True)
    )
    
    # 自动关闭
    db.execute(
        update(Exam)
        .where(
            Exam.is_score_query_open == True,
            Exam.score_query_end_time <= now
        )
        .values(is_score_query_open=False)
    )
    
    db.commit()

# celery beat配置
celery_app.conf.beat_schedule['auto-toggle-score-query'] = {
    'task': 'app.tasks.score_query_tasks.auto_toggle_score_query',
    'schedule': 60.0,  # 每分钟检查一次
}
```

---

### 任务2.2: 资源中心下载按钮置灰

**目标**: 禁用资源下载功能，仅允许在线预览

**技术方案**:

```python
# app/api/v1/resources.py

@router.get("/resources/{resource_id}/download")
async def download_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user)
):
    """【已禁用】禁止下载资源"""
    raise HTTPException(
        403, 
        {
            "code": 403001,
            "message": "资源仅支持在线预览，禁止下载",
            "detail": "如需离线使用，请联系管理员"
        }
    )
```

```vue
<!-- ResourceDetail.vue -->
<template>
  <div class="resource-detail">
    <a-page-header
      :title="resource.name"
      :sub-title="resource.description"
    >
      <template #extra>
        <!-- 下载按钮置灰 -->
        <a-tooltip title="资源仅支持在线预览">
          <a-button disabled>
            <template #icon><download-outlined /></template>
            下载
          </a-button>
        </a-tooltip>
      </template>
    </a-page-header>
    
    <!-- 预览区域 -->
    <div class="preview-container">
      <iframe v-if="isOffice" :src="previewUrl" class="preview-iframe" />
      <video v-else-if="isVideo" :src="previewUrl" controls class="preview-video" />
      <a-image v-else-if="isImage" :src="previewUrl" class="preview-image" />
    </div>
    
    <!-- 权限提示 -->
    <a-alert
      message="版权保护提示"
      description="该资源受版权保护，仅支持在线预览，禁止下载、截图或传播。"
      type="warning"
      show-icon
      class="mt-4"
    />
  </div>
</template>
```

---

### 任务2.3: 赛事反馈收集机制

**目标**: 实现赛事反馈表单和管理后台

**数据库模型**:
```python
# app/models/feedback.py

class FeedbackCategory(enum.Enum):
    BUG = "bug"
    FEATURE = "feature"
    PERFORMANCE = "performance"
    UI = "ui"
    OTHER = "other"

class FeedbackPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class FeedbackStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    RESOLVED = "resolved"
    REJECTED = "rejected"

class EventFeedback(Base):
    __tablename__ = "event_feedbacks"
    
    id = Column(Integer, primary_key=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    
    reporter_name = Column(String(50), nullable=False)
    reporter_contact = Column(String(100))
    reporter_role = Column(String(20), default="organizer")
    
    category = Column(Enum(FeedbackCategory))
    priority = Column(Enum(FeedbackPriority), default=FeedbackPriority.MEDIUM)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    screenshots = Column(JSON, default=list)
    
    status = Column(Enum(FeedbackStatus), default=FeedbackStatus.PENDING)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    resolution = Column(Text)
    resolved_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

---

## Phase 3: P2 低优先级需求 (2-3天)

### 任务3.1: 密码生成策略调整

```python
# app/services/account_service.py

def generate_initial_password(account_type: str, identity_no: str = None) -> str:
    """
    生成初始密码
    - 考试账号：身份证后8位（如果提供）
    - 练习账号：默认123456
    """
    if account_type == AccountType.EXAM and identity_no and len(identity_no) >= 8:
        return identity_no[-8:]
    return "123456"
```

### 任务3.2: 成绩排名导出

```python
# 在导出服务中添加排名计算
async def export_simplified_scores_with_rank(exam_id: int) -> str:
    """导出简化版成绩表（含排名）"""
    
    assignments = await db.execute(
        select(StudentExamAssignment, Account)
        .join(Account)
        .where(
            StudentExamAssignment.exam_id == exam_id,
            StudentExamAssignment.status.in_(["submitted", "timeout"])
        )
        .order_by(
            StudentExamAssignment.total_score.desc(),
            StudentExamAssignment.submitted_at.asc()
        )
    )
    
    data = []
    for rank, (assignment, account) in enumerate(assignments, 1):
        data.append({
            "序号": rank,
            "排名": rank,
            "地区": account.region,
            "学生姓名": account.name,
            "所在学校": account.school,
            "总分": assignment.total_score,
        })
    
    # 导出Excel...
    return file_path
```

---

## 数据库迁移脚本汇总

```sql
-- 20240324_add_grading_sheets.sql

-- 1. 评分表表
CREATE TABLE grading_sheets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    exam_id INT NOT NULL,
    account_id INT NOT NULL,
    judge_name VARCHAR(50),
    judge_order INT DEFAULT 1,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uq_grading_sheet (exam_id, account_id, judge_order),
    INDEX idx_exam_id (exam_id),
    INDEX idx_account_id (account_id),
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='评分表存储表';

-- 2. 成绩查询时间控制
ALTER TABLE exams 
ADD COLUMN is_score_query_open BOOLEAN DEFAULT FALSE,
ADD COLUMN score_query_start_time DATETIME NULL,
ADD COLUMN score_query_end_time DATETIME NULL;

-- 3. 赛事反馈表
CREATE TABLE event_feedbacks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    exam_id INT NOT NULL,
    reporter_name VARCHAR(50) NOT NULL,
    reporter_contact VARCHAR(100),
    reporter_role VARCHAR(20) DEFAULT 'organizer',
    category ENUM('bug', 'feature', 'performance', 'ui', 'other'),
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    screenshots JSON,
    status ENUM('pending', 'processing', 'resolved', 'rejected') DEFAULT 'pending',
    assigned_to INT,
    resolution TEXT,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_exam_id (exam_id),
    INDEX idx_status (status),
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='赛事反馈表';
```

---

## 总结

| 阶段 | 需求 | 预计工时 | 关键交付物 |
|-----|-----|---------|-----------|
| **P-Critical** | 教师端 Scores.vue 接入真实API | 0.5天 | 真实成绩列表/统计/导出 |
| **P-Critical** | 教师端 Resources.vue 接入真实API | 1天 | 真实资源上传/列表/删除 |
| **P-Critical** | 教师端 ExamDashboard.vue 接入真实API | 1天 | 真实考试监控/强制提交 |
| **P-Critical** | 学生端 ExamResult.vue 成绩展示 | 1天 | 成绩详情页 |
| **P-Critical** | ExamPage 集成Subjective + 答题恢复 | 1天 | 主观题上传/进度恢复 |
| **P-Critical** | WebSocket路由注册 | 0.5天 | 实时同步端点 |
| P0 | 评分表批量上传 | 2天 | GradingImportService |
| P0 | 成绩查询评分表展示 | 1.5天 | ScoreResult.vue |
| P1 | 成绩查询时间段控制 | 1.5天 | 定时任务配置 |
| P1 | 资源下载禁用 | 1天 | 权限控制 |
| P1 | 赛事反馈系统 | 2天 | Feedback模型+界面 |
| P2 | 密码生成策略 | 0.5天 | 账号生成逻辑 |
| P2 | 成绩排名导出 | 1天 | 导出模板 |

**总计**: 14-17天（含 Phase 0 的3-5天）

---

*文档版本: v2.0（新增 Phase 0 紧急修复）*
*最后更新: 2026-03-24*
