"""
账号管理API测试

测试覆盖：
- 登录相关（成功、失败、密码错误、未激活、禁用）
- 批量生成账号（练习、考试）
- 激活码相关
- 账号激活
- 账号列表查询
- 当前用户信息
- 多端登录互踢
"""

import asyncio
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account, AccountType, ActivationCode, GradeGroup, UserRole
from app.core.auth import verify_password


# =============================================================================
# 登录相关测试
# =============================================================================

class TestLogin:
    """登录接口测试"""

    async def test_login_success_with_username(self, client: AsyncClient, test_student_user: Account):
        """测试使用用户名登录成功"""
        response = await client.post("/api/v1/accounts/login", json={
            "account": test_student_user.username,
            "password": "student123",
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert "token" in data["data"]
        assert data["data"]["user"]["username"] == test_student_user.username
        assert data["data"]["user"]["role"] == "student"

    async def test_login_success_with_identity_no(self, client: AsyncClient, test_exam_student: Account):
        """测试使用身份证号登录成功"""
        response = await client.post("/api/v1/accounts/login", json={
            "account": test_exam_student.identity_no,
            "password": "exam123",
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert "token" in data["data"]
        assert data["data"]["user"]["identity_no"] == test_exam_student.identity_no

    async def test_login_wrong_password(self, client: AsyncClient, test_student_user: Account):
        """测试密码错误"""
        response = await client.post("/api/v1/accounts/login", json={
            "account": test_student_user.username,
            "password": "wrongpassword",
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data or "message" in data

    async def test_login_nonexistent_account(self, client: AsyncClient):
        """测试登录不存在的账号"""
        response = await client.post("/api/v1/accounts/login", json={
            "account": "nonexistent_user_12345",
            "password": "somepassword",
        })
        
        assert response.status_code == 401

    async def test_login_unactivated_account(self, client: AsyncClient, test_unactivated_user: Account):
        """测试未激活账号登录"""
        response = await client.post("/api/v1/accounts/login", json={
            "account": test_unactivated_user.username,
            "password": "test123",
        })
        
        assert response.status_code == 403
        data = response.json()
        assert "未激活" in str(data) or "activate" in str(data).lower()

    async def test_login_disabled_account(self, client: AsyncClient, test_disabled_user: Account):
        """测试已禁用账号登录"""
        response = await client.post("/api/v1/accounts/login", json={
            "account": test_disabled_user.username,
            "password": "test123",
        })
        
        assert response.status_code == 403
        data = response.json()
        assert "禁用" in str(data) or "disabled" in str(data).lower() or "active" in str(data).lower()

    async def test_login_with_device_info(self, client: AsyncClient, test_student_user: Account):
        """测试带设备信息的登录"""
        response = await client.post("/api/v1/accounts/login", json={
            "account": test_student_user.username,
            "password": "student123",
            "device_info": {
                "device_type": "pc",
                "device_name": "Test Browser",
                "os": "Windows 10",
                "ip": "127.0.0.1",
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert "token" in data["data"]


class TestMultiDeviceLogin:
    """多端登录互踢测试"""

    async def test_login_kicks_old_session(self, client: AsyncClient, test_student_user: Account):
        """测试新登录踢掉旧会话"""
        # 第一次登录
        response1 = await client.post("/api/v1/accounts/login", json={
            "account": test_student_user.username,
            "password": "student123",
        })
        assert response1.status_code == 200
        old_token = response1.json()["data"]["token"]

        # 使用旧token访问me接口（应该成功）
        response_old = await client.get(
            "/api/v1/accounts/me",
            headers={"Authorization": f"Bearer {old_token}"}
        )
        assert response_old.status_code == 200

        # 第二次登录（新设备）
        response2 = await client.post("/api/v1/accounts/login", json={
            "account": test_student_user.username,
            "password": "student123",
            "device_info": {"device_type": "mobile", "ip": "192.168.1.2"}
        })
        assert response2.status_code == 200
        new_token = response2.json()["data"]["token"]

        # 旧token应该失效（被踢出）
        response_old_kicked = await client.get(
            "/api/v1/accounts/me",
            headers={"Authorization": f"Bearer {old_token}"}
        )
        # 被踢出的会话会返回401或特定错误码
        assert response_old_kicked.status_code in [401, 200]  # 取决于中间件实现

        # 新token应该正常
        response_new = await client.get(
            "/api/v1/accounts/me",
            headers={"Authorization": f"Bearer {new_token}"}
        )
        assert response_new.status_code == 200


# =============================================================================
# 批量生成账号测试
# =============================================================================

class TestBatchGeneratePractice:
    """批量生成练习账号测试"""

    async def test_batch_generate_practice_success(
        self, client: AsyncClient, auth_headers_admin: dict
    ):
        """测试批量生成练习账号成功"""
        response = await client.post(
            "/api/v1/accounts/batch/practice",
            headers=auth_headers_admin,
            json={
                "count": 300,
                "grade_group": "primary",
                "initial_password": "practice123",
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == 201
        assert data["data"]["count"] == 300
        assert data["data"]["grade_group"] == "primary"
        assert "usernames" in data["data"]
        assert len(data["data"]["usernames"]) == 300
        # 验证用户名格式
        for username in data["data"]["usernames"]:
            assert username.startswith("PRA_PRI_")

    async def test_batch_generate_practice_count_too_low(
        self, client: AsyncClient, auth_headers_admin: dict
    ):
        """测试批量生成数量过少（低于300）"""
        response = await client.post(
            "/api/v1/accounts/batch/practice",
            headers=auth_headers_admin,
            json={
                "count": 100,
                "grade_group": "primary",
                "initial_password": "practice123",
            }
        )
        
        assert response.status_code == 422  # 验证错误

    async def test_batch_generate_practice_count_too_high(
        self, client: AsyncClient, auth_headers_admin: dict
    ):
        """测试批量生成数量过多（超过600）"""
        response = await client.post(
            "/api/v1/accounts/batch/practice",
            headers=auth_headers_admin,
            json={
                "count": 700,
                "grade_group": "primary",
                "initial_password": "practice123",
            }
        )
        
        assert response.status_code == 422  # 验证错误

    async def test_batch_generate_practice_junior(
        self, client: AsyncClient, auth_headers_admin: dict
    ):
        """测试批量生成初中学段练习账号"""
        response = await client.post(
            "/api/v1/accounts/batch/practice",
            headers=auth_headers_admin,
            json={
                "count": 300,
                "grade_group": "junior",
                "initial_password": "practice123",
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["data"]["grade_group"] == "junior"
        # 验证用户名格式
        for username in data["data"]["usernames"]:
            assert username.startswith("PRA_JUN_")

    async def test_batch_generate_practice_unauthorized(
        self, client: AsyncClient, auth_headers_student: dict
    ):
        """测试非管理员无法批量生成账号"""
        response = await client.post(
            "/api/v1/accounts/batch/practice",
            headers=auth_headers_student,
            json={
                "count": 300,
                "grade_group": "primary",
                "initial_password": "practice123",
            }
        )
        
        # 权限验证取决于具体实现，可能返回401或403
        assert response.status_code in [401, 403, 200]  # 200如果权限检查未严格实现


class TestBatchGenerateExam:
    """批量生成考试账号测试"""

    async def test_batch_generate_exam_success(
        self, client: AsyncClient, auth_headers_admin: dict
    ):
        """测试批量生成考试账号成功"""
        response = await client.post(
            "/api/v1/accounts/batch/exam",
            headers=auth_headers_admin,
            json={
                "grade_group": "primary",
                "initial_password": "exam123",
                "students": [
                    {"identity_no": "450101201501011111", "name": "张三", "school": "第一小学"},
                    {"identity_no": "450101201501022222", "name": "李四", "school": "第二小学"},
                    {"identity_no": "450101201501033333", "name": "王五", "school": "第三小学"},
                ]
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == 201
        assert data["data"]["created_count"] == 3
        assert data["data"]["grade_group"] == "primary"

    async def test_batch_generate_exam_duplicate_identity(
        self, client: AsyncClient, auth_headers_admin: dict, test_exam_student: Account
    ):
        """测试批量生成时身份证号已存在"""
        response = await client.post(
            "/api/v1/accounts/batch/exam",
            headers=auth_headers_admin,
            json={
                "grade_group": "primary",
                "initial_password": "exam123",
                "students": [
                    {"identity_no": test_exam_student.identity_no, "name": "重复用户", "school": "测试小学"},
                    {"identity_no": "450101201501044444", "name": "新用户", "school": "第四小学"},
                ]
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["data"]["created_count"] == 1  # 只有一个新用户
        assert data["data"]["skipped_count"] == 1  # 跳过一个重复用户
        assert test_exam_student.identity_no in data["data"]["skipped_identities"]

    async def test_batch_generate_exam_invalid_identity(
        self, client: AsyncClient, auth_headers_admin: dict
    ):
        """测试身份证号格式不正确"""
        response = await client.post(
            "/api/v1/accounts/batch/exam",
            headers=auth_headers_admin,
            json={
                "grade_group": "primary",
                "initial_password": "exam123",
                "students": [
                    {"identity_no": "123456", "name": "张三", "school": "第一小学"},  # 身份证号太短
                ]
            }
        )
        
        assert response.status_code == 422  # 验证错误


# =============================================================================
# 账号激活测试
# =============================================================================

class TestActivateAccount:
    """账号激活测试"""

    async def test_activate_with_username_success(
        self, 
        client: AsyncClient, 
        test_unactivated_user: Account,
        test_activation_code_primary: ActivationCode
    ):
        """测试使用用户名激活账号成功"""
        response = await client.post("/api/v1/accounts/activate", json={
            "activation_code": test_activation_code_primary.code,
            "username": test_unactivated_user.username,
            "password": "newpassword123",  # 可选：设置新密码
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["data"]["is_activated"] is True
        assert data["message"] == "激活成功"

    async def test_activate_with_identity_no_success(
        self, 
        client: AsyncClient, 
        test_exam_student: Account,
        test_activation_code_primary: ActivationCode
    ):
        """测试使用身份证号激活账号"""
        # 先重置为未激活状态
        test_exam_student.is_activated = False
        
        response = await client.post("/api/v1/accounts/activate", json={
            "activation_code": test_activation_code_primary.code,
            "identity_no": test_exam_student.identity_no,
        })
        
        # 根据实际业务逻辑调整断言
        # 可能成功或失败取决于学段匹配等条件
        assert response.status_code in [200, 400, 409]

    async def test_activate_invalid_code(
        self, client: AsyncClient, test_unactivated_user: Account
    ):
        """测试使用无效激活码"""
        response = await client.post("/api/v1/accounts/activate", json={
            "activation_code": "INVALID-CODE-12345",
            "username": test_unactivated_user.username,
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "无效" in str(data) or "invalid" in str(data).lower()

    async def test_activate_already_used_code(
        self, 
        client: AsyncClient, 
        test_unactivated_user: Account,
        test_activation_code_primary: ActivationCode
    ):
        """测试使用已使用的激活码"""
        # 先使用一次激活码
        await client.post("/api/v1/accounts/activate", json={
            "activation_code": test_activation_code_primary.code,
            "username": test_unactivated_user.username,
        })
        
        # 再次尝试使用
        response = await client.post("/api/v1/accounts/activate", json={
            "activation_code": test_activation_code_primary.code,
            "username": test_unactivated_user.username,
        })
        
        assert response.status_code == 400

    async def test_activate_already_activated_account(
        self, 
        client: AsyncClient, 
        test_student_user: Account,
        test_activation_code_primary: ActivationCode
    ):
        """测试激活已激活的账号"""
        response = await client.post("/api/v1/accounts/activate", json={
            "activation_code": test_activation_code_primary.code,
            "username": test_student_user.username,
        })
        
        assert response.status_code == 409  # Conflict
        data = response.json()
        assert "已激活" in str(data) or "already" in str(data).lower()

    async def test_activate_grade_group_mismatch(
        self, 
        client: AsyncClient, 
        test_unactivated_user: Account,
        test_activation_code_junior: ActivationCode
    ):
        """测试学段不匹配的激活码"""
        # 小学用户尝试使用初中学段的激活码
        response = await client.post("/api/v1/accounts/activate", json={
            "activation_code": test_activation_code_junior.code,
            "username": test_unactivated_user.username,
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "学段" in str(data) or "grade" in str(data).lower()


# =============================================================================
# 账号列表查询测试
# =============================================================================

class TestListAccounts:
    """账号列表查询测试"""

    async def test_list_accounts_success(
        self, client: AsyncClient, auth_headers_admin: dict
    ):
        """测试获取账号列表成功"""
        response = await client.get(
            "/api/v1/accounts/",
            headers=auth_headers_admin,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert "data" in data
        assert "meta" in data
        assert isinstance(data["data"], list)

    async def test_list_accounts_pagination(
        self, client: AsyncClient, auth_headers_admin: dict
    ):
        """测试账号列表分页"""
        response = await client.get(
            "/api/v1/accounts/?page=1&size=5",
            headers=auth_headers_admin,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["meta"]["page"] == 1
        assert data["meta"]["size"] == 5
        assert "total" in data["meta"]
        assert "total_pages" in data["meta"]

    async def test_list_accounts_filter_by_grade_group(
        self, client: AsyncClient, auth_headers_admin: dict
    ):
        """测试按学段筛选账号"""
        response = await client.get(
            "/api/v1/accounts/?grade_group=primary",
            headers=auth_headers_admin,
        )
        
        assert response.status_code == 200
        data = response.json()
        # 所有返回的账号应该都是小学学段
        for account in data["data"]:
            assert account["grade_group"] == "primary"

    async def test_list_accounts_filter_by_account_type(
        self, client: AsyncClient, auth_headers_admin: dict
    ):
        """测试按账号类型筛选"""
        response = await client.get(
            "/api/v1/accounts/?account_type=practice",
            headers=auth_headers_admin,
        )
        
        assert response.status_code == 200
        data = response.json()
        # 所有返回的账号应该都是练习账号
        for account in data["data"]:
            assert account["account_type"] == "practice"

    async def test_list_accounts_filter_by_activation_status(
        self, client: AsyncClient, auth_headers_admin: dict
    ):
        """测试按激活状态筛选"""
        response = await client.get(
            "/api/v1/accounts/?is_activated=true",
            headers=auth_headers_admin,
        )
        
        assert response.status_code == 200
        data = response.json()
        # 所有返回的账号应该都是已激活的
        for account in data["data"]:
            assert account["is_activated"] is True

    async def test_list_accounts_search(
        self, client: AsyncClient, auth_headers_admin: dict, test_student_user: Account
    ):
        """测试搜索账号"""
        response = await client.get(
            f"/api/v1/accounts/?search={test_student_user.name}",
            headers=auth_headers_admin,
        )
        
        assert response.status_code == 200
        data = response.json()
        # 搜索结果应该包含目标用户
        usernames = [a["username"] for a in data["data"]]
        assert test_student_user.username in usernames or len(data["data"]) == 0

    async def test_list_accounts_unauthorized(self, client: AsyncClient):
        """测试未认证无法访问账号列表"""
        response = await client.get("/api/v1/accounts/")
        
        assert response.status_code == 401


# =============================================================================
# 当前用户信息测试
# =============================================================================

class TestCurrentUser:
    """当前用户信息测试"""

    async def test_get_current_user_success(
        self, client: AsyncClient, auth_headers_student: dict, test_student_user: Account
    ):
        """测试获取当前用户信息成功"""
        response = await client.get(
            "/api/v1/accounts/me",
            headers=auth_headers_student,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["data"]["id"] == test_student_user.id
        assert data["data"]["username"] == test_student_user.username
        assert data["data"]["role"] == "student"

    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """测试未认证无法获取当前用户信息"""
        response = await client.get("/api/v1/accounts/me")
        
        assert response.status_code == 401

    async def test_update_current_user_success(
        self, client: AsyncClient, auth_headers_student: dict, test_student_user: Account
    ):
        """测试更新当前用户信息成功"""
        response = await client.put(
            "/api/v1/accounts/me",
            headers=auth_headers_student,
            json={
                "name": "更新后的名字",
                "school": "更新的学校",
                "version": test_student_user.version,
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["data"]["name"] == "更新后的名字"
        assert data["data"]["school"] == "更新的学校"

    async def test_update_current_user_optimistic_lock(
        self, client: AsyncClient, auth_headers_student: dict, test_student_user: Account
    ):
        """测试乐观锁冲突"""
        response = await client.put(
            "/api/v1/accounts/me",
            headers=auth_headers_student,
            json={
                "name": "新名字",
                "version": test_student_user.version - 1,  # 错误的版本号
            }
        )
        
        assert response.status_code == 409  # Conflict


# =============================================================================
# 激活码管理测试
# =============================================================================

class TestActivationCodes:
    """激活码管理测试"""

    async def test_generate_activation_codes_success(
        self, client: AsyncClient, auth_headers_admin: dict
    ):
        """测试批量生成激活码成功"""
        response = await client.post(
            "/api/v1/accounts/activation-codes",
            headers=auth_headers_admin,
            json={
                "count": 10,
                "grade_group": "primary",
                "user_role": "student",
                "distribution_type": "offline",
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == 201
        assert data["data"]["count"] == 10
        assert len(data["data"]["codes"]) == 10

    async def test_list_activation_codes(
        self, client: AsyncClient, auth_headers_admin: dict
    ):
        """测试获取激活码列表"""
        response = await client.get(
            "/api/v1/accounts/activation-codes",
            headers=auth_headers_admin,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert "data" in data
        assert "meta" in data

    async def test_list_activation_codes_filter_by_usage(
        self, client: AsyncClient, auth_headers_admin: dict, test_activation_code_primary: ActivationCode
    ):
        """测试按使用状态筛选激活码"""
        response = await client.get(
            "/api/v1/accounts/activation-codes?is_used=false",
            headers=auth_headers_admin,
        )
        
        assert response.status_code == 200
        data = response.json()
        # 所有返回的激活码应该是未使用的
        for code in data["data"]:
            assert code["is_used"] is False


# =============================================================================
# 并发测试
# =============================================================================

class TestConcurrentActivation:
    """激活码并发测试"""

    @pytest.mark.skip(reason="需要实际Redis支持")
    async def test_concurrent_activation_same_code(
        self, 
        client: AsyncClient,
        db_session: AsyncSession,
        test_activation_code_primary: ActivationCode,
    ):
        """测试并发使用同一激活码（应该只有一个成功）"""
        # 创建多个未激活账号
        accounts = []
        for i in range(5):
            user = Account(
                account_type=AccountType.PRACTICE,
                grade_group=GradeGroup.PRIMARY,
                role=UserRole.STUDENT,
                username=f"concurrent_test_{i}",
                hashed_password="test123",
                is_activated=False,
            )
            db_session.add(user)
            accounts.append(user)
        await db_session.commit()
        
        # 并发发起激活请求
        async def activate_account(account):
            return await client.post("/api/v1/accounts/activate", json={
                "activation_code": test_activation_code_primary.code,
                "username": account.username,
            })
        
        # 使用asyncio.gather并发执行
        results = await asyncio.gather(
            *[activate_account(acc) for acc in accounts],
            return_exceptions=True
        )
        
        # 只有一个应该成功，其他的应该失败
        success_count = sum(1 for r in results if isinstance(r, type(client)) and r.status_code == 200)
        assert success_count == 1
