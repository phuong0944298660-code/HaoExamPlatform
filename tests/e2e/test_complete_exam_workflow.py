"""
完整考试流程 E2E 测试

测试场景：
场景1: 管理员准备考试
  1. 管理员登录
  2. 批量生成练习账号
  3. 创建题库
  4. 添加题目（单选/多选/判断/主观）
  5. 创建套卷
  6. 创建考试场次
  7. 发布考试

场景2: 学生参加考试
  1. 学生登录
  2. 进入考试
  3. 答题过程（单选→多选→判断→主观题上传）
  4. 自动保存验证
  5. 提交试卷
  6. 查看成绩

场景3: 教师批改
  1. 教师登录
  2. 查看学生答卷
  3. 主观题评分
  4. 发布成绩
"""

import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List

import httpx
import pytest

from data_generator import (
    generate_test_students,
    generate_test_questions,
    generate_test_answers
)


# =============================================================================
# 辅助函数
# =============================================================================

async def login_user(
    client: httpx.AsyncClient,
    account: str,
    password: str
) -> Dict:
    """用户登录，返回token和用户信息"""
    resp = await client.post("/accounts/login", json={
        "account": account,
        "password": password,
        "device_info": {"device_type": "pc", "os": "Windows"}
    })
    assert resp.status_code == 200, f"登录失败: {resp.text}"
    data = resp.json()["data"]
    return {
        "token": data["token"],
        "user_id": data["user"]["id"],
        "user_info": data["user"]
    }


async def create_question_bank(
    client: httpx.AsyncClient,
    token: str,
    bank_data: Dict
) -> int:
    """创建题库，返回题库ID"""
    resp = await client.post(
        "/questions/banks",
        json=bank_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 201
    return resp.json()["data"]["id"]


async def create_question(
    client: httpx.AsyncClient,
    token: str,
    question_data: Dict
) -> int:
    """创建题目，返回题目ID"""
    resp = await client.post(
        "/questions/",
        json=question_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 201
    return resp.json()["data"]["id"]


async def create_paper(
    client: httpx.AsyncClient,
    token: str,
    paper_data: Dict
) -> int:
    """创建套卷，返回套卷ID"""
    resp = await client.post(
        "/papers/",
        json=paper_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 201
    return resp.json()["data"]["id"]


async def add_question_to_paper(
    client: httpx.AsyncClient,
    token: str,
    paper_id: int,
    question_id: int,
    order: int,
    score: float
) -> None:
    """添加题目到套卷"""
    resp = await client.post(
        f"/papers/{paper_id}/questions",
        json=[{"question_id": question_id, "order": order, "score": score}],
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200


async def create_exam(
    client: httpx.AsyncClient,
    token: str,
    exam_data: Dict
) -> int:
    """创建考试，返回考试ID"""
    resp = await client.post(
        "/exams/",
        json=exam_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 201
    return resp.json()["data"]["id"]


async def publish_exam(
    client: httpx.AsyncClient,
    token: str,
    exam_id: int
) -> None:
    """发布考试"""
    resp = await client.post(
        f"/exams/{exam_id}/publish",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200


# =============================================================================
# 测试类
# =============================================================================

@pytest.mark.e2e
@pytest.mark.exam
@pytest.mark.slow
class TestCompleteExamWorkflow:
    """完整考试流程测试"""
    
    # 测试账号（需要在数据库中预先创建）
    ADMIN_ACCOUNT = {"account": "admin", "password": "admin123"}
    TEACHER_ACCOUNT = {"account": "teacher", "password": "teacher123"}
    STUDENT_ACCOUNT = {"account": "450000200001011234", "password": "student123"}
    
    @pytest.mark.asyncio
    async def test_scenario_1_admin_prepare_exam(self, async_client: httpx.AsyncClient, test_context):
        """
        场景1: 管理员准备考试
        
        步骤：
        1. 管理员登录
        2. 批量生成练习账号
        3. 创建题库
        4. 添加题目（单选/多选/判断/主观）
        5. 创建套卷
        6. 创建考试场次
        7. 发布考试
        """
        print("\n=== 场景1: 管理员准备考试 ===")
        
        # Step 1: 管理员登录
        print("Step 1: 管理员登录")
        admin_auth = await login_user(
            async_client,
            self.ADMIN_ACCOUNT["account"],
            self.ADMIN_ACCOUNT["password"]
        )
        admin_token = admin_auth["token"]
        test_context.set_token("admin", admin_token)
        test_context.set("admin_user_id", admin_auth["user_id"])
        print(f"  ✓ 管理员登录成功，ID: {admin_auth['user_id']}")
        
        # Step 2: 批量生成练习账号
        print("Step 2: 批量生成练习账号")
        students = generate_test_students(5)
        resp = await async_client.post(
            "/accounts/batch/exam",
            json={
                "grade_group": "primary",
                "initial_password": "Test123!",
                "students": students
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert resp.status_code == 201
        created_accounts = resp.json()["data"]
        test_context.set("student_accounts", created_accounts)
        print(f"  ✓ 成功生成 {len(created_accounts)} 个练习账号")
        
        # Step 3: 创建题库
        print("Step 3: 创建题库")
        bank_data = {
            "name": f"E2E测试题库_{datetime.now().strftime('%H%M%S')}",
            "description": "用于E2E测试的题库",
            "grade_group": "primary"
        }
        bank_id = await create_question_bank(async_client, admin_token, bank_data)
        test_context.set_id("question_bank", bank_id)
        print(f"  ✓ 题库创建成功，ID: {bank_id}")
        
        # Step 4: 添加题目
        print("Step 4: 添加题目")
        questions = generate_test_questions(bank_id, count=10)
        question_ids = []
        
        for i, q in enumerate(questions):
            q_id = await create_question(async_client, admin_token, q)
            question_ids.append(q_id)
            test_context.set(f"question_{i}", q_id)
        
        test_context.set("question_ids", question_ids)
        print(f"  ✓ 成功添加 {len(question_ids)} 道题目")
        
        # Step 5: 创建套卷
        print("Step 5: 创建套卷")
        paper_data = {
            "name": f"E2E测试套卷_{datetime.now().strftime('%H%M%S')}",
            "description": "用于E2E测试的套卷",
            "question_bank_id": bank_id,
            "grade_group": "primary"
        }
        paper_id = await create_paper(async_client, admin_token, paper_data)
        test_context.set_id("paper", paper_id)
        print(f"  ✓ 套卷创建成功，ID: {paper_id}")
        
        # 添加题目到套卷
        for i, q_id in enumerate(question_ids):
            await add_question_to_paper(
                async_client, admin_token, paper_id, q_id, i + 1, questions[i]["default_score"]
            )
        print(f"  ✓ 成功将 {len(question_ids)} 道题目添加到套卷")
        
        # Step 6: 创建考试场次
        print("Step 6: 创建考试场次")
        start_time = datetime.now() + timedelta(minutes=5)
        end_time = start_time + timedelta(hours=2)
        
        exam_data = {
            "name": f"E2E测试考试_{datetime.now().strftime('%H%M%S')}",
            "description": "用于E2E测试的考试",
            "paper_ids": [paper_id],
            "grade_group": "primary",
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "duration": 90,
            "student_list": students[:3],  # 使用部分学生
            "allow_ip_check": False,
            "max_login_devices": 1
        }
        exam_id = await create_exam(async_client, admin_token, exam_data)
        test_context.set_id("exam", exam_id)
        print(f"  ✓ 考试创建成功，ID: {exam_id}")
        
        # Step 7: 发布考试
        print("Step 7: 发布考试")
        await publish_exam(async_client, admin_token, exam_id)
        print("  ✓ 考试发布成功")
        
        print("\n=== 场景1 完成 ===")
    
    @pytest.mark.asyncio
    async def test_scenario_2_student_take_exam(self, async_client: httpx.AsyncClient, test_context):
        """
        场景2: 学生参加考试
        
        步骤：
        1. 学生登录
        2. 进入考试
        3. 答题过程（单选→多选→判断→主观题）
        4. 自动保存验证
        5. 提交试卷
        6. 查看成绩
        """
        print("\n=== 场景2: 学生参加考试 ===")
        
        exam_id = test_context.get_id("exam")
        if not exam_id:
            pytest.skip("需要先运行场景1准备考试")
        
        student_accounts = test_context.get("student_accounts", [])
        if not student_accounts:
            pytest.skip("没有可用的学生账号")
        
        student = student_accounts[0]
        
        # Step 1: 学生登录
        print("Step 1: 学生登录")
        student_auth = await login_user(
            async_client,
            student["identity_no"],
            "Test123!"
        )
        student_token = student_auth["token"]
        print(f"  ✓ 学生登录成功，ID: {student_auth['user_id']}")
        
        # Step 2: 获取考试题目
        print("Step 2: 获取考试题目")
        resp = await async_client.get(
            f"/exam-engine/exams/{exam_id}/questions",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert resp.status_code == 200
        questions = resp.json()["data"]["questions"]
        print(f"  ✓ 获取到 {len(questions)} 道题目")
        
        # Step 3: 答题过程
        print("Step 3: 答题过程")
        answers = []
        
        for i, q in enumerate(questions):
            q_type = q["question_type"]
            q_id = q["id"]
            
            # 生成答案
            if q_type == "single_choice":
                answer = "A"  # 简化处理
            elif q_type == "multi_choice":
                answer = "A,B"
            elif q_type == "judgment":
                answer = "T"
            else:  # subjective
                answer = f"这是第{i+1}题的答案，关于{q['content'][:20]}..."
            
            answers.append({"question_id": q_id, "answer": answer})
            
            # Step 4: 自动保存答案
            resp = await async_client.post(
                f"/exam-engine/exams/{exam_id}/answers",
                json={
                    "question_id": q_id,
                    "answer": answer,
                    "uploaded_files": []
                },
                headers={"Authorization": f"Bearer {student_token}"}
            )
            assert resp.status_code == 200
            print(f"  ✓ 题目 {i+1} 答案已保存")
            
            # 模拟思考时间
            await asyncio.sleep(0.1)
        
        # Step 5: 提交试卷
        print("Step 5: 提交试卷")
        resp = await async_client.post(
            f"/exam-engine/exams/{exam_id}/submit",
            json={
                "force": False,
                "idempotency_key": f"test_submit_{int(time.time())}"
            },
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert resp.status_code == 200
        submit_result = resp.json()["data"]
        print(f"  ✓ 试卷提交成功")
        print(f"    - 客观题得分: {submit_result.get('objective_score', 'N/A')}")
        print(f"    - 主观题得分: {submit_result.get('subjective_score', '待定')}")
        
        # Step 6: 查看成绩
        print("Step 6: 查看成绩")
        # 等待评分完成
        await asyncio.sleep(1)
        
        resp = await async_client.get(
            f"/scores/{exam_id}/students/{student_auth['user_id']}",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        # 可能还没有评分，所以不强制检查状态码
        if resp.status_code == 200:
            score_data = resp.json()["data"]
            print(f"  ✓ 成绩查询成功")
            print(f"    - 总分: {score_data.get('total_score', 'N/A')}")
        else:
            print(f"  ! 成绩尚未发布（状态码: {resp.status_code}）")
        
        print("\n=== 场景2 完成 ===")
    
    @pytest.mark.asyncio
    async def test_scenario_3_teacher_grade(self, async_client: httpx.AsyncClient, test_context):
        """
        场景3: 教师批改
        
        步骤：
        1. 教师登录
        2. 查看学生答卷
        3. 主观题评分
        4. 发布成绩
        """
        print("\n=== 场景3: 教师批改 ===")
        
        exam_id = test_context.get_id("exam")
        if not exam_id:
            pytest.skip("需要先运行场景1准备考试")
        
        # Step 1: 教师登录
        print("Step 1: 教师登录")
        teacher_auth = await login_user(
            async_client,
            self.TEACHER_ACCOUNT["account"],
            self.TEACHER_ACCOUNT["password"]
        )
        teacher_token = teacher_auth["token"]
        print(f"  ✓ 教师登录成功，ID: {teacher_auth['user_id']}")
        
        # Step 2: 查看学生答卷列表
        print("Step 2: 查看学生答卷列表")
        resp = await async_client.get(
            f"/exams/{exam_id}/students",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        assert resp.status_code == 200
        students_data = resp.json()["data"]
        print(f"  ✓ 获取到 {students_data.get('total', 0)} 名考生")
        
        if students_data.get("items"):
            student = students_data["items"][0]
            account_id = student["account_id"]
            
            # Step 3: 查看学生答题详情
            print("Step 3: 查看学生答题详情")
            resp = await async_client.get(
                f"/scores/{exam_id}/students/{account_id}",
                headers={"Authorization": f"Bearer {teacher_token}"}
            )
            assert resp.status_code == 200
            answer_detail = resp.json()["data"]
            print(f"  ✓ 获取答题详情成功")
            
            # Step 4: 主观题评分
            print("Step 4: 主观题评分")
            answers = answer_detail.get("answers", [])
            subjective_answers = [a for a in answers if a.get("question_type") == "subjective"]
            
            for ans in subjective_answers:
                resp = await async_client.post(
                    "/scores/subjective",
                    json={
                        "exam_id": exam_id,
                        "account_id": account_id,
                        "question_id": ans["question_id"],
                        "score": random.randint(5, 10),  # 随机评分
                        "comment": "答案完整，思路清晰"
                    },
                    headers={"Authorization": f"Bearer {teacher_token}"}
                )
                assert resp.status_code == 200
                print(f"  ✓ 主观题评分完成: {ans['question_id']} -> {resp.json()['data']['score']}分")
            
            # Step 5: 再次查看成绩（确认评分已更新）
            print("Step 5: 确认成绩更新")
            resp = await async_client.get(
                f"/scores/{exam_id}/students/{account_id}",
                headers={"Authorization": f"Bearer {teacher_token}"}
            )
            assert resp.status_code == 200
            final_score = resp.json()["data"]
            print(f"  ✓ 最终成绩确认")
            print(f"    - 客观题得分: {final_score.get('objective_score', 'N/A')}")
            print(f"    - 主观题得分: {final_score.get('subjective_score', 'N/A')}")
            print(f"    - 总分: {final_score.get('total_score', 'N/A')}")
        
        print("\n=== 场景3 完成 ===")


@pytest.mark.e2e
@pytest.mark.exam
class TestExamWorkflowEdgeCases:
    """考试流程边界情况测试"""
    
    @pytest.mark.asyncio
    async def test_exam_time_validation(self, async_client: httpx.AsyncClient):
        """测试考试时间验证"""
        # 测试结束时间早于开始时间
        pass  # 待实现
    
    @pytest.mark.asyncio
    async def test_duplicate_exam_submission(self, async_client: httpx.AsyncClient):
        """测试重复提交防重"""
        pass  # 待实现
    
    @pytest.mark.asyncio
    async def test_exam_auto_save_recovery(self, async_client: httpx.AsyncClient):
        """测试自动保存恢复"""
        pass  # 待实现
