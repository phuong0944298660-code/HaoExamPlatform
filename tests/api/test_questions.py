"""
题库管理API测试

测试覆盖：
- 题库CRUD（创建、列表、详情、更新、删除）
- 题目CRUD（创建4种题型、列表、更新、删除）
- 题目筛选和搜索
- 批量导入
"""

import io
from datetime import datetime

import openpyxl
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.question import Question, QuestionBank, QuestionType, DifficultyLevel


# =============================================================================
# 题库CRUD测试
# =============================================================================

class TestQuestionBankCreate:
    """创建题库测试"""

    async def test_create_question_bank_success(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试创建题库成功"""
        response = await client.post(
            "/api/v1/questions/banks",
            headers=auth_headers_teacher,
            json={
                "name": "新建测试题库",
                "description": "这是一个新建的测试题库",
                "grade_group": "primary",
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == 201
        assert data["data"]["name"] == "新建测试题库"
        assert data["data"]["grade_group"] == "primary"
        assert data["data"]["status"] == "draft"

    async def test_create_question_bank_missing_name(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试创建题库缺少名称"""
        response = await client.post(
            "/api/v1/questions/banks",
            headers=auth_headers_teacher,
            json={
                "description": "没有名称的题库",
                "grade_group": "primary",
            }
        )
        
        assert response.status_code == 422

    async def test_create_question_bank_invalid_grade_group(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试创建题库使用无效学段"""
        response = await client.post(
            "/api/v1/questions/banks",
            headers=auth_headers_teacher,
            json={
                "name": "无效学段题库",
                "grade_group": "invalid_grade",
            }
        )
        
        assert response.status_code == 422

    async def test_create_question_bank_unauthorized(self, client: AsyncClient):
        """测试未认证无法创建题库"""
        response = await client.post(
            "/api/v1/questions/banks",
            json={
                "name": "未认证题库",
                "grade_group": "primary",
            }
        )
        
        assert response.status_code == 401


class TestQuestionBankList:
    """题库列表测试"""

    async def test_list_question_banks_success(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试获取题库列表成功"""
        response = await client.get(
            "/api/v1/questions/banks",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert "data" in data
        assert "meta" in data
        assert isinstance(data["data"], list)

    async def test_list_question_banks_pagination(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试题库列表分页"""
        response = await client.get(
            "/api/v1/questions/banks?page=1&size=10",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["meta"]["page"] == 1
        assert data["meta"]["size"] == 10

    async def test_list_question_banks_filter_by_grade_group(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试按学段筛选题库"""
        response = await client.get(
            "/api/v1/questions/banks?grade_group=primary",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        for bank in data["data"]:
            assert bank["grade_group"] == "primary"

    async def test_list_question_banks_filter_by_status(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试按状态筛选题库"""
        response = await client.get(
            "/api/v1/questions/banks?status=published",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        for bank in data["data"]:
            assert bank["status"] == "published"

    async def test_list_question_banks_search(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_bank: QuestionBank
    ):
        """测试搜索题库"""
        response = await client.get(
            f"/api/v1/questions/banks?search={test_question_bank.name}",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        # 搜索结果应该包含目标题库
        bank_names = [b["name"] for b in data["data"]]
        assert test_question_bank.name in bank_names or len(data["data"]) == 0


class TestQuestionBankDetail:
    """题库详情测试"""

    async def test_get_question_bank_detail(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_bank: QuestionBank
    ):
        """测试获取题库详情"""
        response = await client.get(
            f"/api/v1/questions/banks/{test_question_bank.id}",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["data"]["id"] == test_question_bank.id
        assert data["data"]["name"] == test_question_bank.name
        assert "stats" in data["data"]  # 包含统计数据

    async def test_get_question_bank_detail_not_found(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试获取不存在的题库详情"""
        response = await client.get(
            "/api/v1/questions/banks/99999",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 404


class TestQuestionBankUpdate:
    """更新题库测试"""

    async def test_update_question_bank_success(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_bank: QuestionBank
    ):
        """测试更新题库成功"""
        response = await client.put(
            f"/api/v1/questions/banks/{test_question_bank.id}",
            headers=auth_headers_teacher,
            json={
                "name": "更新后的题库名称",
                "description": "更新后的描述",
                "status": "published",
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["data"]["name"] == "更新后的题库名称"
        assert data["data"]["description"] == "更新后的描述"
        assert data["data"]["status"] == "published"

    async def test_update_question_bank_invalid_status(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_bank: QuestionBank
    ):
        """测试使用无效状态更新题库"""
        response = await client.put(
            f"/api/v1/questions/banks/{test_question_bank.id}",
            headers=auth_headers_teacher,
            json={
                "status": "invalid_status",
            }
        )
        
        assert response.status_code == 422

    async def test_update_question_bank_not_found(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试更新不存在的题库"""
        response = await client.put(
            "/api/v1/questions/banks/99999",
            headers=auth_headers_teacher,
            json={
                "name": "不存在的题库",
            }
        )
        
        assert response.status_code == 404


class TestQuestionBankDelete:
    """删除题库测试"""

    async def test_delete_question_bank_success(
        self, client: AsyncClient, auth_headers_teacher: dict, db_session: AsyncSession
    ):
        """测试删除空题库成功"""
        # 创建一个新的空题库
        bank = QuestionBank(
            name="待删除的空题库",
            grade_group="primary",
            created_by=1,
        )
        db_session.add(bank)
        await db_session.commit()
        await db_session.refresh(bank)
        
        response = await client.delete(
            f"/api/v1/questions/banks/{bank.id}",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200

    async def test_delete_question_bank_with_questions(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_bank: QuestionBank
    ):
        """测试删除包含题目的题库"""
        response = await client.delete(
            f"/api/v1/questions/banks/{test_question_bank.id}",
            headers=auth_headers_teacher,
        )
        
        # 应该返回409 Conflict，因为题库中还有题目
        assert response.status_code == 409

    async def test_delete_question_bank_not_found(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试删除不存在的题库"""
        response = await client.delete(
            "/api/v1/questions/banks/99999",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 404


# =============================================================================
# 题目CRUD测试
# =============================================================================

class TestQuestionCreate:
    """创建题目测试"""

    async def test_create_single_choice_question(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_bank: QuestionBank
    ):
        """测试创建单选题"""
        response = await client.post(
            "/api/v1/questions/",
            headers=auth_headers_teacher,
            json={
                "content": "1 + 1 等于多少？",
                "question_type": "single_choice",
                "options": [
                    {"label": "A", "content": "1"},
                    {"label": "B", "content": "2"},
                    {"label": "C", "content": "3"},
                    {"label": "D", "content": "4"},
                ],
                "correct_answer": "B",
                "default_score": 2.0,
                "difficulty": "easy",
                "tags": ["数学", "基础"],
                "question_bank_id": test_question_bank.id,
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == 201
        assert data["data"]["content"] == "1 + 1 等于多少？"
        assert data["data"]["question_type"] == "single_choice"
        assert data["data"]["correct_answer"] == "B"

    async def test_create_multi_choice_question(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_bank: QuestionBank
    ):
        """测试创建多选题"""
        response = await client.post(
            "/api/v1/questions/",
            headers=auth_headers_teacher,
            json={
                "content": "以下哪些是前端框架？",
                "question_type": "multi_choice",
                "options": [
                    {"label": "A", "content": "Vue"},
                    {"label": "B", "content": "React"},
                    {"label": "C", "content": "Django"},
                    {"label": "D", "content": "Angular"},
                ],
                "correct_answer": "ABD",
                "scoring_rules": {
                    "full_score": 3.0,
                    "partial_score": 1.0,
                    "wrong_score": 0,
                    "partial_mode": "fixed",
                },
                "default_score": 3.0,
                "difficulty": "medium",
                "tags": ["前端", "框架"],
                "question_bank_id": test_question_bank.id,
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == 201
        assert data["data"]["question_type"] == "multi_choice"
        assert data["data"]["correct_answer"] == "ABD"
        assert data["data"]["scoring_rules"]["partial_mode"] == "fixed"

    async def test_create_judgment_question(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_bank: QuestionBank
    ):
        """测试创建判断题"""
        response = await client.post(
            "/api/v1/questions/",
            headers=auth_headers_teacher,
            json={
                "content": "Python是一种解释型语言。",
                "question_type": "judgment",
                "correct_answer": "T",
                "default_score": 1.0,
                "difficulty": "easy",
                "tags": ["Python", "基础"],
                "question_bank_id": test_question_bank.id,
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == 201
        assert data["data"]["question_type"] == "judgment"
        assert data["data"]["correct_answer"] == "T"

    async def test_create_subjective_question(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_bank: QuestionBank
    ):
        """测试创建主观题"""
        response = await client.post(
            "/api/v1/questions/",
            headers=auth_headers_teacher,
            json={
                "content": "请描述面向对象编程的三大特性。",
                "question_type": "subjective",
                "default_score": 10.0,
                "difficulty": "medium",
                "tags": ["编程", "面向对象"],
                "answer_analysis": "封装、继承、多态",
                "question_bank_id": test_question_bank.id,
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == 201
        assert data["data"]["question_type"] == "subjective"
        # 主观题不需要选项和正确答案
        assert data["data"]["options"] is None

    async def test_create_question_missing_content(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_bank: QuestionBank
    ):
        """测试创建题目缺少内容"""
        response = await client.post(
            "/api/v1/questions/",
            headers=auth_headers_teacher,
            json={
                "question_type": "single_choice",
                "correct_answer": "A",
                "question_bank_id": test_question_bank.id,
            }
        )
        
        assert response.status_code == 422

    async def test_create_choice_question_missing_options(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_bank: QuestionBank
    ):
        """测试创建选择题缺少选项"""
        response = await client.post(
            "/api/v1/questions/",
            headers=auth_headers_teacher,
            json={
                "content": "没有选项的选择题",
                "question_type": "single_choice",
                "correct_answer": "A",
                "question_bank_id": test_question_bank.id,
            }
        )
        
        assert response.status_code == 422

    async def test_create_choice_question_insufficient_options(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_bank: QuestionBank
    ):
        """测试创建选择题选项不足"""
        response = await client.post(
            "/api/v1/questions/",
            headers=auth_headers_teacher,
            json={
                "content": "选项不足的选择题",
                "question_type": "single_choice",
                "options": [
                    {"label": "A", "content": "只有A"},
                ],
                "correct_answer": "A",
                "question_bank_id": test_question_bank.id,
            }
        )
        
        assert response.status_code == 422

    async def test_create_judgment_question_invalid_answer(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_bank: QuestionBank
    ):
        """测试创建判断题使用无效答案"""
        response = await client.post(
            "/api/v1/questions/",
            headers=auth_headers_teacher,
            json={
                "content": "这是一个判断题",
                "question_type": "judgment",
                "correct_answer": "C",  # 判断题只能是T或F
                "question_bank_id": test_question_bank.id,
            }
        )
        
        assert response.status_code == 422

    async def test_create_question_nonexistent_bank(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试创建题目到不存在的题库"""
        response = await client.post(
            "/api/v1/questions/",
            headers=auth_headers_teacher,
            json={
                "content": "题库不存在的题目",
                "question_type": "single_choice",
                "options": [
                    {"label": "A", "content": "A"},
                    {"label": "B", "content": "B"},
                ],
                "correct_answer": "A",
                "question_bank_id": 99999,
            }
        )
        
        assert response.status_code == 404


class TestQuestionList:
    """题目列表测试"""

    async def test_list_questions_success(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试获取题目列表成功"""
        response = await client.get(
            "/api/v1/questions/",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert "data" in data
        assert "meta" in data

    async def test_list_questions_filter_by_bank(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_bank: QuestionBank
    ):
        """测试按题库筛选题目"""
        response = await client.get(
            f"/api/v1/questions/?bank_id={test_question_bank.id}",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        for question in data["data"]:
            assert question["question_bank_id"] == test_question_bank.id

    async def test_list_questions_filter_by_type(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试按题型筛选题目"""
        response = await client.get(
            "/api/v1/questions/?question_type=single_choice",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        for question in data["data"]:
            assert question["question_type"] == "single_choice"

    async def test_list_questions_filter_by_difficulty(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试按难度筛选题目"""
        response = await client.get(
            "/api/v1/questions/?difficulty=easy",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        for question in data["data"]:
            assert question["difficulty"] == "easy"

    async def test_list_questions_filter_by_tags(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试按标签筛选题目"""
        response = await client.get(
            "/api/v1/questions/?tags=数学",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        for question in data["data"]:
            assert "数学" in question["tags"]

    async def test_list_questions_search(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试搜索题目"""
        response = await client.get(
            "/api/v1/questions/?search=Python",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        # 搜索结果应该包含关键词
        for question in data["data"]:
            assert "Python" in question["content"] or "python" in question["content"].lower()


class TestQuestionDetail:
    """题目详情测试"""

    async def test_get_question_detail(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_single: Question
    ):
        """测试获取题目详情"""
        response = await client.get(
            f"/api/v1/questions/{test_question_single.id}",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["data"]["id"] == test_question_single.id
        assert data["data"]["content"] == test_question_single.content

    async def test_get_question_detail_not_found(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试获取不存在的题目详情"""
        response = await client.get(
            "/api/v1/questions/99999",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 404


class TestQuestionUpdate:
    """更新题目测试"""

    async def test_update_question_success(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_single: Question
    ):
        """测试更新题目成功"""
        response = await client.put(
            f"/api/v1/questions/{test_question_single.id}",
            headers=auth_headers_teacher,
            json={
                "content": "更新后的题目内容",
                "default_score": 3.0,
                "version": test_question_single.version,
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["data"]["content"] == "更新后的题目内容"
        assert data["data"]["default_score"] == 3.0

    async def test_update_question_change_type(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_single: Question
    ):
        """测试修改题目类型"""
        response = await client.put(
            f"/api/v1/questions/{test_question_single.id}",
            headers=auth_headers_teacher,
            json={
                "question_type": "judgment",
                "correct_answer": "T",
                "version": test_question_single.version,
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["question_type"] == "judgment"

    async def test_update_question_optimistic_lock(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_single: Question
    ):
        """测试乐观锁冲突"""
        response = await client.put(
            f"/api/v1/questions/{test_question_single.id}",
            headers=auth_headers_teacher,
            json={
                "content": "乐观锁测试",
                "version": test_question_single.version - 1,  # 错误的版本号
            }
        )
        
        assert response.status_code == 409

    async def test_update_question_not_found(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试更新不存在的题目"""
        response = await client.put(
            "/api/v1/questions/99999",
            headers=auth_headers_teacher,
            json={
                "content": "不存在的题目",
                "version": 1,
            }
        )
        
        assert response.status_code == 404


class TestQuestionDelete:
    """删除题目测试"""

    async def test_delete_question_success(
        self, client: AsyncClient, auth_headers_teacher: dict, db_session: AsyncSession
    ):
        """测试删除题目成功"""
        # 创建一个新题目用于删除
        from app.models.question import QuestionBank
        result = await db_session.execute(
            "SELECT id FROM question_banks WHERE is_deleted = 0 LIMIT 1"
        )
        bank_id = result.scalar()
        
        question = Question(
            content="待删除的题目",
            question_type=QuestionType.SINGLE_CHOICE,
            options=[{"label": "A", "content": "A"}, {"label": "B", "content": "B"}],
            correct_answer="A",
            question_bank_id=bank_id or 1,
            created_by=1,
        )
        db_session.add(question)
        await db_session.commit()
        await db_session.refresh(question)
        
        response = await client.delete(
            f"/api/v1/questions/{question.id}",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 200

    async def test_delete_question_not_found(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试删除不存在的题目"""
        response = await client.delete(
            "/api/v1/questions/99999",
            headers=auth_headers_teacher,
        )
        
        assert response.status_code == 404


# =============================================================================
# 批量导入测试
# =============================================================================

class TestBatchImport:
    """批量导入题目测试"""

    def create_test_excel(self) -> bytes:
        """创建测试Excel文件"""
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "题目"
        
        # 写入表头
        headers = ["题目内容", "题型", "选项A", "选项B", "选项C", "选项D", "正确答案", "分值", "难度", "标签", "解析"]
        ws.append(headers)
        
        # 写入测试数据
        ws.append(["测试单选题", "单选", "选项A", "选项B", "选项C", "选项D", "B", 2, "简单", "数学,基础", "解析内容"])
        ws.append(["测试多选题", "多选", "选项A", "选项B", "选项C", "选项D", "AB", 3, "中等", "计算机", ""])
        ws.append(["测试判断题", "判断", "", "", "", "", "T", 1, "简单", "常识", ""])
        
        # 保存到内存
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return output.getvalue()

    async def test_batch_import_questions_success(
        self, client: AsyncClient, auth_headers_teacher: dict, test_question_bank: QuestionBank
    ):
        """测试批量导入题目成功"""
        excel_content = self.create_test_excel()
        
        files = {
            "file": ("test_questions.xlsx", io.BytesIO(excel_content), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        }
        data = {
            "question_bank_id": str(test_question_bank.id),
        }
        
        response = await client.post(
            "/api/v1/questions/import",
            headers=auth_headers_teacher,
            data=data,
            files=files,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["data"]["success_count"] > 0

    async def test_batch_import_invalid_bank(
        self, client: AsyncClient, auth_headers_teacher: dict
    ):
        """测试批量导入到不存在的题库"""
        excel_content = self.create_test_excel()
        
        files = {
            "file": ("test_questions.xlsx", io.BytesIO(excel_content), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        }
        data = {
            "question_bank_id": "99999",
        }
        
        response = await client.post(
            "/api/v1/questions/import",
            headers=auth_headers_teacher,
            data=data,
            files=files,
        )
        
        assert response.status_code == 404
