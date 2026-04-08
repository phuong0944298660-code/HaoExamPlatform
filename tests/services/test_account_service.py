"""
账号服务层单元测试

测试覆盖：
- 批量生成练习账号
- 批量生成考试账号
- 账号激活
- 登录/登出
- 用户信息查询和更新
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException

from app.services.account_service import AccountService
from app.models.account import Account, AccountType, ActivationCode, GradeGroup, UserRole
from app.schemas.account import (
    BatchGeneratePracticeRequest,
    BatchGenerateExamRequest,
    ActivateAccountRequest,
    LoginRequest,
    AccountUpdateRequest,
)


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def mock_db():
    """模拟数据库会话"""
    db = AsyncMock()
    return db


@pytest.fixture
def account_service(mock_db):
    """创建账号服务实例"""
    return AccountService(mock_db)


@pytest.fixture
def sample_practice_request():
    """示例批量生成练习账号请求"""
    return BatchGeneratePracticeRequest(
        count=300,
        grade_group="primary",
        initial_password="test123",
    )


@pytest.fixture
def sample_exam_request():
    """示例批量生成考试账号请求"""
    from app.schemas.account import ExamStudentItem
    return BatchGenerateExamRequest(
        grade_group="primary",
        initial_password="test123",
        students=[
            ExamStudentItem(identity_no="450101201501011111", name="张三", school="第一小学"),
            ExamStudentItem(identity_no="450101201501022222", name="李四", school="第二小学"),
        ]
    )


# =============================================================================
# 批量生成练习账号测试
# =============================================================================

class TestBatchGeneratePractice:
    """批量生成练习账号测试"""

    async def test_generate_primary_accounts(self, account_service, mock_db, sample_practice_request):
        """测试生成小学练习账号"""
        # 模拟查询最大用户名
        mock_result = MagicMock()
        mock_result.scalar.return_value = None  # 没有现有账号
        mock_db.execute.return_value = mock_result
        
        result = await account_service.batch_generate_practice_accounts(
            sample_practice_request, created_by=1
        )
        
        assert result["count"] == 300
        assert result["grade_group"] == "primary"
        assert len(result["usernames"]) == 300
        # 验证用户名格式
        assert result["usernames"][0].startswith("PRA_PRI_")
        assert result["usernames"][-1] == "PRA_PRI_000300"
        
        # 验证数据库调用
        assert mock_db.add.call_count == 300
        mock_db.commit.assert_called()

    async def test_generate_junior_accounts(self, account_service, mock_db):
        """测试生成初中练习账号"""
        request = BatchGeneratePracticeRequest(
            count=300,
            grade_group="junior",
            initial_password="test123",
        )
        
        mock_result = MagicMock()
        mock_result.scalar.return_value = None
        mock_db.execute.return_value = mock_result
        
        result = await account_service.batch_generate_practice_accounts(request, created_by=1)
        
        assert result["grade_group"] == "junior"
        # 验证用户名格式
        assert all(u.startswith("PRA_JUN_") for u in result["usernames"])

    async def test_generate_continue_sequence(self, account_service, mock_db, sample_practice_request):
        """测试继续已有的流水号"""
        # 模拟已有账号
        mock_result = MagicMock()
        mock_result.scalar.return_value = "PRA_PRI_000100"
        mock_db.execute.return_value = mock_result
        
        result = await account_service.batch_generate_practice_accounts(
            sample_practice_request, created_by=1
        )
        
        # 应该从101开始
        assert result["usernames"][0] == "PRA_PRI_000101"
        assert result["usernames"][-1] == "PRA_PRI_000400"


# =============================================================================
# 批量生成考试账号测试
# =============================================================================

class TestBatchGenerateExam:
    """批量生成考试账号测试"""

    async def test_generate_exam_accounts_success(self, account_service, mock_db, sample_exam_request):
        """测试生成考试账号成功"""
        # 模拟没有重复身份证号
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        result = await account_service.batch_generate_exam_accounts(
            sample_exam_request, created_by=1
        )
        
        assert result["created_count"] == 2
        assert result["skipped_count"] == 0
        assert result["grade_group"] == "primary"
        mock_db.commit.assert_called()

    async def test_generate_with_duplicates(self, account_service, mock_db, sample_exam_request):
        """测试生成时遇到重复身份证号"""
        # 第一个身份证号已存在
        existing_account = MagicMock(spec=Account)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.side_effect = [existing_account, None]
        mock_db.execute.return_value = mock_result
        
        result = await account_service.batch_generate_exam_accounts(
            sample_exam_request, created_by=1
        )
        
        assert result["created_count"] == 1
        assert result["skipped_count"] == 1
        assert "450101201501011111" in result["skipped_identities"]


# =============================================================================
# 账号激活测试
# =============================================================================

class TestActivateAccount:
    """账号激活测试"""

    async def test_activate_success_with_username(self, account_service, mock_db):
        """测试使用用户名激活成功"""
        # 模拟激活码
        activation_code = ActivationCode(
            id=1,
            code="ACT-PRI-TEST01",
            grade_group=GradeGroup.PRIMARY,
            user_role=UserRole.STUDENT,
            is_used=False,
        )
        
        # 模拟账号
        account = Account(
            id=1,
            username="testuser",
            grade_group=GradeGroup.PRIMARY,
            is_activated=False,
            hashed_password="old_hash",
        )
        
        # 设置mock返回值
        code_result = MagicMock()
        code_result.scalar_one_or_none.return_value = activation_code
        
        account_result = MagicMock()
        account_result.scalar_one_or_none.return_value = account
        
        mock_db.execute.side_effect = [code_result, account_result]
        
        request = ActivateAccountRequest(
            activation_code="ACT-PRI-TEST01",
            username="testuser",
            password="newpassword",
        )
        
        result = await account_service.activate_account(request)
        
        assert result["is_activated"] is True
        assert result["username"] == "testuser"
        assert account.is_activated is True
        assert activation_code.is_used is True
        mock_db.commit.assert_called()

    async def test_activate_invalid_code(self, account_service, mock_db):
        """测试无效激活码"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        request = ActivateAccountRequest(
            activation_code="INVALID-CODE",
            username="testuser",
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await account_service.activate_account(request)
        
        assert exc_info.value.status_code == 400

    async def test_activate_already_activated(self, account_service, mock_db):
        """测试激活已激活的账号"""
        activation_code = ActivationCode(
            id=1,
            code="ACT-PRI-TEST01",
            grade_group=GradeGroup.PRIMARY,
            user_role=UserRole.STUDENT,
            is_used=False,
        )
        
        account = Account(
            id=1,
            username="testuser",
            grade_group=GradeGroup.PRIMARY,
            is_activated=True,  # 已激活
        )
        
        code_result = MagicMock()
        code_result.scalar_one_or_none.return_value = activation_code
        
        account_result = MagicMock()
        account_result.scalar_one_or_none.return_value = account
        
        mock_db.execute.side_effect = [code_result, account_result]
        
        request = ActivateAccountRequest(
            activation_code="ACT-PRI-TEST01",
            username="testuser",
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await account_service.activate_account(request)
        
        assert exc_info.value.status_code == 409

    async def test_activate_grade_mismatch(self, account_service, mock_db):
        """测试学段不匹配"""
        activation_code = ActivationCode(
            id=1,
            code="ACT-JUN-TEST01",  # 初中激活码
            grade_group=GradeGroup.JUNIOR,
            user_role=UserRole.STUDENT,
            is_used=False,
        )
        
        account = Account(
            id=1,
            username="testuser",
            grade_group=GradeGroup.PRIMARY,  # 小学账号
            is_activated=False,
        )
        
        code_result = MagicMock()
        code_result.scalar_one_or_none.return_value = activation_code
        
        account_result = MagicMock()
        account_result.scalar_one_or_none.return_value = account
        
        mock_db.execute.side_effect = [code_result, account_result]
        
        request = ActivateAccountRequest(
            activation_code="ACT-JUN-TEST01",
            username="testuser",
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await account_service.activate_account(request)
        
        assert exc_info.value.status_code == 400
        assert "学段" in exc_info.value.detail


# =============================================================================
# 登录测试
# =============================================================================

class TestLogin:
    """登录测试"""

    async def test_login_success(self, account_service, mock_db):
        """测试登录成功"""
        from app.core.auth import hash_password
        
        account = Account(
            id=1,
            username="testuser",
            hashed_password=hash_password("correctpass"),
            is_activated=True,
            is_active=True,
            is_deleted=False,
        )
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = account
        mock_db.execute.return_value = mock_result
        
        # Mock Redis
        with patch("app.services.account_service.redis_client") as mock_redis:
            mock_redis.setex = AsyncMock()
            
            request = LoginRequest(
                account="testuser",
                password="correctpass",
            )
            
            result = await account_service.login(request)
            
            assert "token" in result
            assert result["user"]["username"] == "testuser"
            mock_db.commit.assert_called()

    async def test_login_wrong_password(self, account_service, mock_db):
        """测试密码错误"""
        from app.core.auth import hash_password
        
        account = Account(
            id=1,
            username="testuser",
            hashed_password=hash_password("correctpass"),
            is_activated=True,
            is_active=True,
            is_deleted=False,
        )
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = account
        mock_db.execute.return_value = mock_result
        
        request = LoginRequest(
            account="testuser",
            password="wrongpass",
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await account_service.login(request)
        
        assert exc_info.value.status_code == 401

    async def test_login_account_not_found(self, account_service, mock_db):
        """测试账号不存在"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        request = LoginRequest(
            account="nonexistent",
            password="somepass",
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await account_service.login(request)
        
        assert exc_info.value.status_code == 401

    async def test_login_account_disabled(self, account_service, mock_db):
        """测试账号被禁用"""
        from app.core.auth import hash_password
        
        account = Account(
            id=1,
            username="testuser",
            hashed_password=hash_password("correctpass"),
            is_activated=True,
            is_active=False,  # 禁用
            is_deleted=False,
        )
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = account
        mock_db.execute.return_value = mock_result
        
        request = LoginRequest(
            account="testuser",
            password="correctpass",
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await account_service.login(request)
        
        assert exc_info.value.status_code == 403

    async def test_login_not_activated(self, account_service, mock_db):
        """测试账号未激活"""
        from app.core.auth import hash_password
        
        account = Account(
            id=1,
            username="testuser",
            hashed_password=hash_password("correctpass"),
            is_activated=False,  # 未激活
            is_active=True,
            is_deleted=False,
        )
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = account
        mock_db.execute.return_value = mock_result
        
        request = LoginRequest(
            account="testuser",
            password="correctpass",
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await account_service.login(request)
        
        assert exc_info.value.status_code == 403


# =============================================================================
# 用户信息测试
# =============================================================================

class TestGetCurrentUser:
    """获取当前用户测试"""

    async def test_get_current_user_success(self, account_service, mock_db):
        """测试获取当前用户成功"""
        account = Account(
            id=1,
            username="testuser",
            name="测试用户",
            school="测试学校",
            grade_group=GradeGroup.PRIMARY,
            role=UserRole.STUDENT,
        )
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = account
        mock_db.execute.return_value = mock_result
        
        result = await account_service.get_current_user(1)
        
        assert result["id"] == 1
        assert result["username"] == "testuser"
        assert result["name"] == "测试用户"

    async def test_get_current_user_not_found(self, account_service, mock_db):
        """测试获取不存在的用户"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        with pytest.raises(HTTPException) as exc_info:
            await account_service.get_current_user(999)
        
        assert exc_info.value.status_code == 404


class TestUpdateAccount:
    """更新账号测试"""

    async def test_update_account_success(self, account_service, mock_db):
        """测试更新账号成功"""
        account = Account(
            id=1,
            username="testuser",
            name="旧名字",
            school="旧学校",
            version=1,
            is_deleted=False,
        )
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = account
        mock_db.execute.return_value = mock_result
        
        request = AccountUpdateRequest(
            name="新名字",
            school="新学校",
            version=1,
        )
        
        result = await account_service.update_account(1, request)
        
        assert result["name"] == "新名字"
        assert result["school"] == "新学校"
        assert account.version == 2  # 版本号增加
        mock_db.commit.assert_called()

    async def test_update_account_optimistic_lock(self, account_service, mock_db):
        """测试乐观锁冲突"""
        account = Account(
            id=1,
            username="testuser",
            name="旧名字",
            version=2,  # 当前版本是2
            is_deleted=False,
        )
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = account
        mock_db.execute.return_value = mock_result
        
        request = AccountUpdateRequest(
            name="新名字",
            version=1,  # 请求版本是1，不匹配
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await account_service.update_account(1, request)
        
        assert exc_info.value.status_code == 409
