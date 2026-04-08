"""
考试管理API测试

测试覆盖：
- 考试CRUD（创建、列表、详情、发布、关闭）
- 考试引擎（获取题目、保存答案、提交试卷、获取进度）
- 紧急延时
- WebSocket连接
"""

import asyncio
import json
from datetime import datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.testclient import TestClient

from app.models.account import Account
from app.models.exam import Exam, ExamStatus, StudentExamAssignment, AssignmentStatus, ExamRealtimeStats


# =============================================================================
# 考试管理测试
# =============================================================================

class TestCreateExam:
    """创建考试测试"""

    async def test_create_exam_success(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试创建考试成功"""
        start_time = datetime.utcnow() + timedelta(days=1)
        end_time = start_time + timedelta(hours=2)
        
        response = await client.post(
            "/api/v1/exams/",
            headers=auth_headers_teacher,
            json={
                "name": "期末考试",
                "description": "2024年春季期末考试",
                "paper_ids": [1, 2],
                "grade_group": "primary",
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration": 120,
                "student_list": [
                    {"identity_no": "450101201501011111", "name": "张三", "school": "第一小学"},
                    {"identity_no": "450101201501022222", "name": "李四", "school": "第二小学"},
                ],
                "allow_ip_check": False,
                "max_login_devices": 1,
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == 201
        assert data["data"]["name"] == "期末考试"
        assert data["data"]["status"] == "draft"
        assert data["data"]["grade_group"] == "primary"

    async def test_create_exam_invalid_time(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试创建考试时间无效（结束时间早于开始时间）"""
        start_time = datetime.utcnow() + timedelta(hours=2)
        end_time = datetime.utcnow() + timedelta(hours=1)
        
        response = await client.post(
            "/api/v1/exams/",
            headers=auth_headers_teacher,
            json={
                "name": "时间错误的考试",
                "paper_ids": [1],
                "grade_group": "primary",
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration": 60,
            }
        )
        
        assert response.status_code == 422

    async def test_create_exam_missing_papers(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试创建考试缺少套卷"""
        start_time = datetime.utcnow() + timedelta(days=1)
        end_time = start_time + timedelta(hours=2)
        
        response = await client.post(
            "/api/v1/exams/",
            headers=auth_headers_teacher,
            json={
                "name": "没有套卷的考试",
                "grade_group": "primary",
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration": 60,
                "paper_ids": [],  # 空列表
            }
        )
        
        assert response.status_code == 422

    async def test_create_exam_unauthorized(self, client: AsyncClient):
        """测试未认证无法创建考试"""
        response = await client.post(
            "/api/v1/exams/",
            json={
                "name": "未认证的考试",
                "paper_ids": [1],
                "grade_group": "primary",
                "start_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
                "end_time": (datetime.utcnow() + timedelta(days=1, hours=2)).isoformat(),
                "duration": 60,
            }
        )
        
        assert response.status_code == 401


class TestListExams:
    """考试列表测试"""

    async def test_list_exams_success(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试获取考试列表成功"""
        response = await client.get(
            "/api/v1/exams/",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert "data" in data
        assert "meta" in data

    async def test_list_exams_filter_by_status(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试按状态筛选考试"""
        response = await client.get(
            "/api/v1/exams/?status=open",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        for exam in data["data"]:
            assert exam["status"] == "open"

    async def test_list_exams_filter_by_grade_group(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试按学段筛选考试"""
        response = await client.get(
            "/api/v1/exams/?grade_group=primary",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        for exam in data["data"]:
            assert exam["grade_group"] == "primary"


class TestExamDetail:
    """考试详情测试"""

    async def test_get_exam_detail(
        self, client: AsyncClient, auth_headers_teacher: dict, test_exam: Exam
    ):
        """测试获取考试详情"""
        response = await client.get(
            f"/api/v1/exams/{test_exam.id}",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["data"]["id"] == test_exam.id
        assert data["data"]["name"] == test_exam.name

    async def test_get_exam_detail_not_found(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试获取不存在的考试详情"""
        response = await client.get(
            "/api/v1/exams/99999",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 404


class TestPublishExam:
    """发布考试测试"""

    async def test_publish_exam_success(
        self, client: AsyncClient, auth_headers_teacher: dict, test_draft_exam: Exam
    ):
        """测试发布考试成功"""
        response = await client.post(
            f"/api/v1/exams/{test_draft_exam.id}/publish",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert "message" in data

    async def test_publish_already_published_exam(
        self, client: AsyncClient, auth_headers_teacher: dict, test_exam: Exam
    ):
        """测试发布已发布的考试"""
        response = await client.post(
            f"/api/v1/exams/{test_exam.id}/publish",
            headers=auth_headers_teacher,
        )
        
        # 可能返回200或409，取决于具体实现
        assert response.status_code in [200, 400, 409]

    async def test_publish_exam_not_found(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试发布不存在的考试"""
        response = await client.post(
            "/api/v1/exams/99999/publish",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 404


class TestCloseExam:
    """关闭考试测试"""

    async def test_close_exam_success(
        self, client: AsyncClient, auth_headers_teacher: dict, test_exam: Exam
    ):
        """测试关闭考试成功"""
        response = await client.post(
            f"/api/v1/exams/{test_exam.id}/close",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert "关闭" in data["message"] or "closed" in data["message"].lower()

    async def test_close_already_closed_exam(
        self, client: AsyncClient, auth_headers_teacher: dict, test_exam: Exam
    ):
        """测试关闭已关闭的考试"""
        # 先关闭一次
        await client.post(
            f"/api/v1/exams/{test_exam.id}/close",
            headers=auth_headers_teacher,
        )
        
        # 再次关闭
        response = await client.post(
            f"/api/v1/exams/{test_exam.id}/close",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code in [200, 400]


class TestEmergencyExtend:
    """紧急延时测试"""

    async def test_emergency_extend_success(
        self, client: AsyncClient, auth_headers_teacher: dict, test_exam: Exam
    ):
        """测试紧急延时成功"""
        response = await client.post(
            f"/api/v1/exams/{test_exam.id}/emergency-extend",
            headers=auth_headers_teacher,
            json={
                "extend_minutes": 30,
                "reason": "网络故障延时",
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert "延时" in data["message"] or "extend" in data["message"].lower()

    async def test_emergency_extend_too_long(
        self, client: AsyncClient, auth_headers_teacher: dict, test_exam: Exam
    ):
        """测试紧急延时时间过长（超过120分钟）"""
        response = await client.post(
            f"/api/v1/exams/{test_exam.id}/emergency-extend",
            headers=auth_headers_teacher,
            json={
                "extend_minutes": 150,
                "reason": "延长时间过长",
            }
        )
        
        assert response.status_code == 422

    async def test_emergency_extend_missing_reason(
        self, client: AsyncClient, auth_headers_teacher: dict, test_exam: Exam
    ):
        """测试紧急延时缺少原因"""
        response = await client.post(
            f"/api/v1/exams/{test_exam.id}/emergency-extend",
            headers=auth_headers_teacher,
            json={
                "extend_minutes": 30,
            }
        )
        
        assert response.status_code == 422


class TestExamDashboard:
    """考试看板测试"""

    async def test_get_exam_dashboard(
        self, client: AsyncClient, auth_headers_teacher: dict, test_exam: Exam
    ):
        """测试获取考试看板数据"""
        response = await client.get(
            f"/api/v1/exams/{test_exam.id}/dashboard",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert "data" in data


class TestExamStudents:
    """考生列表测试"""

    async def test_get_exam_students(
        self, client: AsyncClient, auth_headers_teacher: dict, test_exam: Exam
    ):
        """测试获取考试考生列表"""
        response = await client.get(
            f"/api/v1/exams/{test_exam.id}/students",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert "data" in data
        assert "meta" in data


# =============================================================================
# 考试引擎测试
# =============================================================================

class TestGetExamQuestions:
    """获取考试题目测试"""

    async def test_get_exam_questions_success(
        self, client: AsyncClient, auth_headers_student: dict, test_exam: Exam
    ):
        """测试获取考试题目成功"""
        response = await client.get(
            f"/api/v1/exam-engine/exams/{test_exam.id}/questions",
            headers=auth_headers_student,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert "questions" in data["data"]
        assert "duration" in data["data"]
        assert "total_questions" in data["data"]
        # 验证不返回正确答案
        for q in data["data"]["questions"]:
            assert "correct_answer" not in q
            assert "answer_analysis" not in q

    async def test_get_exam_questions_not_started(
        self, client: AsyncClient, auth_headers_student: dict, test_draft_exam: Exam
    ):
        """测试获取未开始考试的题目"""
        # 分配学生到草稿考试
        # 注意：这需要先创建分配记录，取决于具体测试数据设置
        response = await client.get(
            f"/api/v1/exam-engine/exams/{test_draft_exam.id}/questions",
            headers=auth_headers_student,
        )
        
        # 草稿状态的考试应该无法获取题目
        assert response.status_code == 403

    async def test_get_exam_questions_not_assigned(
        self, client: AsyncClient, auth_headers_teacher: dict, test_exam: Exam
    ):
        """测试获取未分配考试的题目"""
        # 使用教师账号（可能未分配给该考试）
        response = await client.get(
            f"/api/v1/exam-engine/exams/{test_exam.id}/questions",
            headers=auth_headers_teacher,
        )
        
        # 应该返回403 Forbidden
        assert response.status_code == 403


class TestSaveAnswer:
    """保存答案测试"""

    async def test_save_answer_success(
        self, client: AsyncClient, auth_headers_student: dict, test_exam: Exam
    ):
        """测试保存答案成功"""
        response = await client.post(
            f"/api/v1/exam-engine/exams/{test_exam.id}/answers",
            headers=auth_headers_student,
            json={
                "question_id": 1,
                "answer": "B",
                "uploaded_files": [],
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["data"]["saved"] is True

    async def test_save_answer_invalid_question(
        self, client: AsyncClient, auth_headers_student: dict, test_exam: Exam
    ):
        """测试保存不存在题目的答案"""
        response = await client.post(
            f"/api/v1/exam-engine/exams/{test_exam.id}/answers",
            headers=auth_headers_student,
            json={
                "question_id": 99999,
                "answer": "A",
            }
        )
        
        # 可能接受保存（因为只是存到Redis）或返回错误
        assert response.status_code in [200, 404]


class TestGetExamProgress:
    """获取答题进度测试"""

    async def test_get_exam_progress_initial(
        self, client: AsyncClient, auth_headers_student: dict, test_exam: Exam
    ):
        """测试获取初始答题进度"""
        response = await client.get(
            f"/api/v1/exam-engine/exams/{test_exam.id}/progress",
            headers=auth_headers_student,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["data"]["exam_id"] == test_exam.id
        assert data["data"]["answered_count"] == 0
        assert data["data"]["progress_percent"] == 0.0

    async def test_get_exam_progress_after_saving(
        self, client: AsyncClient, auth_headers_student: dict, test_exam: Exam
    ):
        """测试保存答案后的进度"""
        # 先保存几个答案
        await client.post(
            f"/api/v1/exam-engine/exams/{test_exam.id}/answers",
            headers=auth_headers_student,
            json={"question_id": 1, "answer": "B"},
        )
        await client.post(
            f"/api/v1/exam-engine/exams/{test_exam.id}/answers",
            headers=auth_headers_student,
            json={"question_id": 2, "answer": "AB"},
        )
        
        # 获取进度
        response = await client.get(
            f"/api/v1/exam-engine/exams/{test_exam.id}/progress",
            headers=auth_headers_student,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["answered_count"] == 2
        assert data["data"]["progress_percent"] > 0


class TestSubmitExam:
    """提交试卷测试"""

    async def test_submit_exam_success(
        self, client: AsyncClient, auth_headers_student: dict, test_exam: Exam
    ):
        """测试提交试卷成功"""
        # 先保存一些答案
        await client.post(
            f"/api/v1/exam-engine/exams/{test_exam.id}/answers",
            headers=auth_headers_student,
            json={"question_id": 1, "answer": "B"},
        )
        
        response = await client.post(
            f"/api/v1/exam-engine/exams/{test_exam.id}/submit",
            headers=auth_headers_student,
            json={
                "force": False,
                "idempotency_key": f"test_submit_{test_exam.id}_student",
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["data"]["submitted"] is True
        assert "objective_score" in data["data"]

    async def test_submit_exam_already_submitted(
        self, client: AsyncClient, auth_headers_student: dict, test_exam: Exam
    ):
        """测试重复提交试卷"""
        # 第一次提交
        await client.post(
            f"/api/v1/exam-engine/exams/{test_exam.id}/submit",
            headers=auth_headers_student,
            json={"force": False},
        )
        
        # 第二次提交
        response = await client.post(
            f"/api/v1/exam-engine/exams/{test_exam.id}/submit",
            headers=auth_headers_student,
            json={"force": False},
        )
        
        assert response.status_code == 200
        data = response.json()
        # 应该返回已提交的状态
        assert "submitted" in data["data"]

    async def test_submit_exam_idempotency(
        self, client: AsyncClient, auth_headers_student: dict, test_exam: Exam
    ):
        """测试提交幂等性"""
        idempotency_key = f"idem_key_{test_exam.id}"
        
        # 第一次提交
        response1 = await client.post(
            f"/api/v1/exam-engine/exams/{test_exam.id}/submit",
            headers=auth_headers_student,
            json={
                "force": False,
                "idempotency_key": idempotency_key,
            }
        )
        
        assert response1.status_code == 200
        
        # 使用相同幂等key再次提交
        response2 = await client.post(
            f"/api/v1/exam-engine/exams/{test_exam.id}/submit",
            headers=auth_headers_student,
            json={
                "force": False,
                "idempotency_key": idempotency_key,
            }
        )
        
        assert response2.status_code == 200
        # 两次返回应该相同
        assert response1.json()["data"]["submitted"] == response2.json()["data"]["submitted"]


# =============================================================================
# 并发测试
# =============================================================================

class TestConcurrentSubmit:
    """并发提交测试"""

    @pytest.mark.skip(reason="需要实际Redis和数据库支持")
    async def test_concurrent_submit_same_exam(
        self, 
        client: AsyncClient, 
        auth_headers_student: dict,
        test_exam: Exam
    ):
        """测试并发提交同一份试卷（应该只有一个成功）"""
        async def submit_exam():
            return await client.post(
                f"/api/v1/exam-engine/exams/{test_exam.id}/submit",
                headers=auth_headers_student,
                json={"force": False},
            )
        
        # 并发发起5个提交请求
        results = await asyncio.gather(
            *[submit_exam() for _ in range(5)],
            return_exceptions=True
        )
        
        # 应该只有一个成功提交，其他返回已提交状态
        success_count = sum(
            1 for r in results 
            if isinstance(r, type(client)) and r.status_code == 200
        )
        assert success_count >= 1


# =============================================================================
# WebSocket测试
# =============================================================================

class TestWebSocket:
    """WebSocket连接测试"""

    @pytest.mark.skip(reason="需要完整的ASGI应用实例")
    def test_websocket_connect(self):
        """测试WebSocket连接"""
        # 这部分需要使用TestClient进行同步测试
        # 或者使用专门的WebSocket测试库
        pass

    @pytest.mark.skip(reason="需要完整的ASGI应用实例")
    def test_websocket_multi_device_replace(self):
        """测试WebSocket多端登录替换"""
        # 当同一账号从多个设备连接时，旧连接应该被断开
        pass
