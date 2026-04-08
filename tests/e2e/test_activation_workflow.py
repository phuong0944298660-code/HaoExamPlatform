"""
激活码流程 E2E 测试

测试场景：
场景: 账号激活流程
  1. 管理员生成激活码
  2. 学生使用激活码激活账号
  3. 激活后登录验证权限
  4. 多端登录互踢验证
"""

import asyncio
from typing import Dict

import httpx
import pytest

from data_generator import generate_test_students


# =============================================================================
# 辅助函数
# =============================================================================

async def admin_login(client: httpx.AsyncClient, account: str = "admin", password: str = "admin123") -> str:
    """管理员登录，返回token"""
    resp = await client.post("/accounts/login", json={
        "account": account,
        "password": password
    })
    assert resp.status_code == 200
    return resp.json()["data"]["token"]


async def generate_activation_codes(
    client: httpx.AsyncClient,
    token: str,
    count: int = 10,
    grade_group: str = "primary",
    user_role: str = "student"
) -> list:
    """生成激活码"""
    resp = await client.post(
        "/accounts/activation-codes",
        json={
            "count": count,
            "grade_group": grade_group,
            "user_role": user_role,
            "distribution_type": "offline"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 201
    return resp.json()["data"]["codes"]


async def activate_account(
    client: httpx.AsyncClient,
    activation_code: str,
    identity_no: str,
    password: str = None
) -> Dict:
    """激活账号"""
    payload = {
        "activation_code": activation_code,
        "identity_no": identity_no
    }
    if password:
        payload["password"] = password
    
    resp = await client.post("/accounts/activate", json=payload)
    return {
        "status_code": resp.status_code,
        "data": resp.json() if resp.status_code == 200 else None,
        "error": resp.json() if resp.status_code != 200 else None
    }


async def login_with_check(
    client: httpx.AsyncClient,
    account: str,
    password: str,
    device_info: Dict = None
) -> Dict:
    """登录并返回结果"""
    payload = {
        "account": account,
        "password": password
    }
    if device_info:
        payload["device_info"] = device_info
    
    resp = await client.post("/accounts/login", json=payload)
    return {
        "status_code": resp.status_code,
        "data": resp.json() if resp.status_code == 200 else None,
        "token": resp.json()["data"]["token"] if resp.status_code == 200 else None,
        "error": resp.json() if resp.status_code != 200 else None
    }


# =============================================================================
# 测试类
# =============================================================================

@pytest.mark.e2e
@pytest.mark.activation
class TestActivationWorkflow:
    """激活码流程测试"""
    
    @pytest.mark.asyncio
    async def test_complete_activation_workflow(self, async_client: httpx.AsyncClient):
        """
        完整激活流程测试
        
        1. 管理员生成激活码
        2. 学生使用激活码激活
        3. 激活后登录验证
        """
        print("\n=== 完整激活流程测试 ===")
        
        # Step 1: 管理员登录并生成激活码
        print("Step 1: 管理员生成激活码")
        admin_token = await admin_login(async_client)
        codes = await generate_activation_codes(
            async_client, admin_token, count=5, grade_group="primary"
        )
        assert len(codes) == 5
        activation_code = codes[0]
        print(f"  ✓ 成功生成 {len(codes)} 个激活码")
        print(f"  ✓ 使用激活码: {activation_code}")
        
        # Step 2: 生成测试学生
        print("Step 2: 生成测试学生")
        student = generate_test_students(1)[0]
        identity_no = student["identity_no"]
        print(f"  ✓ 测试学生身份证号: {identity_no}")
        
        # Step 3: 学生使用激活码激活
        print("Step 3: 学生激活账号")
        new_password = "NewPass123!"
        result = await activate_account(
            async_client, activation_code, identity_no, new_password
        )
        assert result["status_code"] == 200
        print("  ✓ 账号激活成功")
        
        # Step 4: 使用新密码登录
        print("Step 4: 激活后登录验证")
        login_result = await login_with_check(async_client, identity_no, new_password)
        assert login_result["status_code"] == 200
        assert login_result["token"] is not None
        user_info = login_result["data"]["data"]["user"]
        assert user_info["is_activated"] is True
        print(f"  ✓ 登录成功，账号已激活")
        print(f"  ✓ 用户ID: {user_info['id']}, 角色: {user_info.get('role', 'student')}")
        
        print("\n=== 激活流程测试完成 ===")
    
    @pytest.mark.asyncio
    async def test_activation_code_reuse(self, async_client: httpx.AsyncClient):
        """
        测试激活码重复使用（应该失败）
        """
        print("\n=== 激活码重复使用测试 ===")
        
        # 生成激活码
        admin_token = await admin_login(async_client)
        codes = await generate_activation_codes(async_client, admin_token, count=1)
        activation_code = codes[0]
        
        # 第一个学生激活
        student1 = generate_test_students(1)[0]
        result1 = await activate_account(async_client, activation_code, student1["identity_no"])
        assert result1["status_code"] == 200
        print(f"  ✓ 学生1激活成功")
        
        # 第二个学生尝试使用同一个激活码
        student2 = generate_test_students(1)[0]
        result2 = await activate_account(async_client, activation_code, student2["identity_no"])
        assert result2["status_code"] != 200  # 应该失败
        print(f"  ✓ 学生2激活失败（预期）: 激活码已被使用")
        
        print("\n=== 激活码重复使用测试完成 ===")
    
    @pytest.mark.asyncio
    async def test_invalid_activation_code(self, async_client: httpx.AsyncClient):
        """
        测试无效激活码
        """
        print("\n=== 无效激活码测试 ===")
        
        student = generate_test_students(1)[0]
        result = await activate_account(async_client, "INVALID_CODE", student["identity_no"])
        assert result["status_code"] != 200
        print("  ✓ 无效激活码被拒绝")
        
        print("\n=== 无效激活码测试完成 ===")
    
    @pytest.mark.asyncio
    async def test_multi_device_login_kick(self, async_client: httpx.AsyncClient):
        """
        多端登录互踢验证
        
        1. 学生使用设备A登录
        2. 学生使用设备B登录
        3. 设备A的token应该失效
        """
        print("\n=== 多端登录互踢测试 ===")
        
        # 准备已激活的账号
        admin_token = await admin_login(async_client)
        codes = await generate_activation_codes(async_client, admin_token, count=1)
        activation_code = codes[0]
        
        student = generate_test_students(1)[0]
        identity_no = student["identity_no"]
        password = "TestPass123!"
        
        # 激活账号
        await activate_account(async_client, activation_code, identity_no, password)
        print("  ✓ 账号已激活")
        
        # 设备A登录
        print("Step 1: 设备A登录")
        device_a_login = await login_with_check(
            async_client, identity_no, password,
            device_info={"device_type": "pc", "device_name": "设备A", "os": "Windows"}
        )
        assert device_a_login["status_code"] == 200
        token_a = device_a_login["token"]
        print("  ✓ 设备A登录成功")
        
        # 使用设备A访问（应该成功）
        resp = await async_client.get(
            "/accounts/me",
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert resp.status_code == 200
        print("  ✓ 设备A访问成功")
        
        # 设备B登录
        print("Step 2: 设备B登录")
        device_b_login = await login_with_check(
            async_client, identity_no, password,
            device_info={"device_type": "mobile", "device_name": "设备B", "os": "iOS"}
        )
        assert device_b_login["status_code"] == 200
        token_b = device_b_login["token"]
        print("  ✓ 设备B登录成功")
        
        # 再次使用设备A访问（应该被踢出）
        print("Step 3: 验证设备A已被踢出")
        resp = await async_client.get(
            "/accounts/me",
            headers={"Authorization": f"Bearer {token_a}"}
        )
        # 应该返回401或被踢出提示
        assert resp.status_code in [401, 403]
        print("  ✓ 设备A已被踢出（预期）")
        
        # 设备B仍然可以访问
        resp = await async_client.get(
            "/accounts/me",
            headers={"Authorization": f"Bearer {token_b}"}
        )
        assert resp.status_code == 200
        print("  ✓ 设备B仍然可以访问")
        
        print("\n=== 多端登录互踢测试完成 ===")
    
    @pytest.mark.asyncio
    async def test_concurrent_activation(self, async_client: httpx.AsyncClient):
        """
        并发激活测试
        
        多个学生同时尝试激活（使用不同的激活码）
        """
        print("\n=== 并发激活测试 ===")
        
        # 生成多个激活码
        admin_token = await admin_login(async_client)
        student_count = 10
        codes = await generate_activation_codes(
            async_client, admin_token, count=student_count
        )
        
        # 生成学生
        students = generate_test_students(student_count)
        
        # 并发激活
        async def activate_student(code: str, student: Dict):
            return await activate_account(async_client, code, student["identity_no"], "Pass123!")
        
        print(f"Step 1: {student_count}个学生并发激活")
        tasks = [
            activate_student(codes[i], students[i])
            for i in range(student_count)
        ]
        results = await asyncio.gather(*tasks)
        
        success_count = sum(1 for r in results if r["status_code"] == 200)
        print(f"  ✓ 成功激活: {success_count}/{student_count}")
        
        assert success_count == student_count
        
        # 验证所有学生都可以登录
        print("Step 2: 验证所有学生可以登录")
        login_tasks = [
            login_with_check(async_client, students[i]["identity_no"], "Pass123!")
            for i in range(student_count)
        ]
        login_results = await asyncio.gather(*login_tasks)
        
        login_success = sum(1 for r in login_results if r["status_code"] == 200)
        print(f"  ✓ 成功登录: {login_success}/{student_count}")
        
        assert login_success == student_count
        
        print("\n=== 并发激活测试完成 ===")


@pytest.mark.e2e
@pytest.mark.activation
class TestActivationEdgeCases:
    """激活流程边界情况测试"""
    
    @pytest.mark.asyncio
    async def test_activation_without_identity(self, async_client: httpx.AsyncClient):
        """测试缺少身份证号激活（应该失败）"""
        admin_token = await admin_login(async_client)
        codes = await generate_activation_codes(async_client, admin_token, count=1)
        
        resp = await async_client.post("/accounts/activate", json={
            "activation_code": codes[0]
        })
        assert resp.status_code == 422  # 验证错误
    
    @pytest.mark.asyncio
    async def test_activation_different_grade_groups(self, async_client: httpx.AsyncClient):
        """测试不同学段激活码"""
        admin_token = await admin_login(async_client)
        
        # 生成小学激活码
        primary_codes = await generate_activation_codes(
            async_client, admin_token, count=1, grade_group="primary"
        )
        
        # 生成初中激活码
        junior_codes = await generate_activation_codes(
            async_client, admin_token, count=1, grade_group="junior"
        )
        
        assert primary_codes[0] != junior_codes[0]
        print("  ✓ 不同学段激活码生成成功")
    
    @pytest.mark.asyncio
    async def test_list_activation_codes(self, async_client: httpx.AsyncClient):
        """测试查询激活码列表"""
        admin_token = await admin_login(async_client)
        
        # 生成激活码
        await generate_activation_codes(async_client, admin_token, count=5)
        
        # 查询列表
        resp = await async_client.get(
            "/accounts/activation-codes?page=1&size=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["total"] >= 5
        print(f"  ✓ 查询到 {data['total']} 个激活码")
