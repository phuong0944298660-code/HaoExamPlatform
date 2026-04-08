"""
JWT认证核心功能测试

测试覆盖：
- 密码加密和验证
- JWT Token生成
- JWT Token解码
- Token过期处理
- Token无效处理
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import patch

import jwt
from fastapi import HTTPException

from app.core.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    get_current_user_id,
    get_optional_user_id,
)


# =============================================================================
# 密码加密测试
# =============================================================================

class TestPasswordHashing:
    """密码加密测试"""

    def test_hash_password_returns_string(self):
        """测试密码哈希返回字符串"""
        password = "testpassword123"
        hashed = hash_password(password)
        
        assert isinstance(hashed, str)
        assert len(hashed) > 0
        # bcrypt哈希通常以$2b$开头
        assert hashed.startswith("$2")

    def test_hash_password_different_salts(self):
        """测试相同密码哈希结果不同（使用不同盐）"""
        password = "samepassword"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        
        assert hash1 != hash2  # 两次哈希结果不同

    def test_verify_password_correct(self):
        """测试验证正确密码"""
        password = "mypassword"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """测试验证错误密码"""
        password = "mypassword"
        wrong_password = "wrongpassword"
        hashed = hash_password(password)
        
        assert verify_password(wrong_password, hashed) is False

    def test_verify_password_empty(self):
        """测试验证空密码"""
        password = ""
        hashed = hash_password("somepassword")
        
        assert verify_password(password, hashed) is False

    def test_verify_password_unicode(self):
        """测试验证包含Unicode字符的密码"""
        password = "密码测试123!@#"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True
        assert verify_password("wrong密码", hashed) is False


# =============================================================================
# JWT Token生成测试
# =============================================================================

class TestTokenCreation:
    """Token生成测试"""

    def test_create_token_returns_string(self):
        """测试Token生成返回字符串"""
        data = {"sub": "123", "role": "student"}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
        # JWT通常包含两个点号
        assert token.count(".") == 2

    def test_create_token_contains_data(self):
        """测试Token包含原始数据"""
        data = {"sub": "456", "role": "teacher", "type": "practice"}
        token = create_access_token(data)
        
        # 解码验证（不验证签名）
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        assert decoded["sub"] == "456"
        assert decoded["role"] == "teacher"
        assert decoded["type"] == "practice"

    def test_create_token_has_expiration(self):
        """测试Token包含过期时间"""
        data = {"sub": "789"}
        token = create_access_token(data)
        
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        assert "exp" in decoded
        assert "iat" in decoded  # 签发时间

    def test_create_token_custom_expiry(self):
        """测试自定义过期时间"""
        data = {"sub": "999"}
        expires = timedelta(hours=2)
        token = create_access_token(data, expires_delta=expires)
        
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        issued_at = datetime.fromtimestamp(decoded["iat"])
        expiration = datetime.fromtimestamp(decoded["exp"])
        
        # 过期时间应该是签发时间后约2小时
        time_diff = expiration - issued_at
        assert 7190 <= time_diff.total_seconds() <= 7200  # 允许小误差

    def test_create_token_default_expiry(self):
        """测试默认过期时间（7天）"""
        data = {"sub": "111"}
        token = create_access_token(data)
        
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        issued_at = datetime.fromtimestamp(decoded["iat"])
        expiration = datetime.fromtimestamp(decoded["exp"])
        
        time_diff = expiration - issued_at
        # 默认7天 = 604800秒
        assert 604700 <= time_diff.total_seconds() <= 604800


# =============================================================================
# JWT Token解码测试
# =============================================================================

class TestTokenDecode:
    """Token解码测试"""

    def test_decode_valid_token(self):
        """测试解码有效Token"""
        original_data = {"sub": "123", "role": "admin"}
        token = create_access_token(original_data)
        
        decoded = decode_access_token(token)
        
        assert decoded["sub"] == "123"
        assert decoded["role"] == "admin"

    def test_decode_expired_token(self):
        """测试解码过期Token"""
        data = {"sub": "456"}
        # 创建一个已过期的token
        expired_time = datetime.utcnow() - timedelta(hours=1)
        expired_token = jwt.encode(
            {**data, "exp": expired_time, "iat": expired_time - timedelta(minutes=1)},
            "test-secret-key-for-testing-only",
            algorithm="HS256"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            decode_access_token(expired_token)
        
        assert exc_info.value.status_code == 401
        assert "过期" in str(exc_info.value.detail) or "expired" in str(exc_info.value.detail).lower()

    def test_decode_invalid_token(self):
        """测试解码无效Token"""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(HTTPException) as exc_info:
            decode_access_token(invalid_token)
        
        assert exc_info.value.status_code == 401

    def test_decode_malformed_token(self):
        """测试解码格式错误的Token"""
        malformed_token = "not.a.valid.jwt.token"
        
        with pytest.raises(HTTPException) as exc_info:
            decode_access_token(malformed_token)
        
        assert exc_info.value.status_code == 401

    def test_decode_wrong_signature(self):
        """测试解码签名错误的Token"""
        data = {"sub": "789"}
        # 用错误的密钥签名
        wrong_token = jwt.encode(data, "wrong-secret-key", algorithm="HS256")
        
        with pytest.raises(HTTPException) as exc_info:
            decode_access_token(wrong_token)
        
        assert exc_info.value.status_code == 401

    def test_decode_empty_token(self):
        """测试解码空Token"""
        with pytest.raises(HTTPException) as exc_info:
            decode_access_token("")
        
        assert exc_info.value.status_code == 401


# =============================================================================
# 获取当前用户ID测试
# =============================================================================

class TestGetCurrentUserId:
    """获取当前用户ID测试"""

    @pytest.mark.asyncio
    async def test_get_user_id_from_valid_token(self):
        """测试从有效Token获取用户ID"""
        token = create_access_token({"sub": "42"})
        
        # 模拟HTTPAuthorizationCredentials
        class MockCredentials:
            def __init__(self, token):
                self.credentials = token
        
        credentials = MockCredentials(token)
        user_id = await get_current_user_id(credentials)
        
        assert user_id == 42

    @pytest.mark.asyncio
    async def test_get_user_id_no_credentials(self):
        """测试无认证信息"""
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_id(None)
        
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_get_user_id_missing_sub(self):
        """测试Token中缺少sub字段"""
        # 创建没有sub的token
        token = jwt.encode(
            {"role": "student"},
            "test-secret-key-for-testing-only",
            algorithm="HS256"
        )
        
        class MockCredentials:
            def __init__(self, token):
                self.credentials = token
        
        credentials = MockCredentials(token)
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_id(credentials)
        
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_get_user_id_expired_token(self):
        """测试使用过期Token"""
        expired_time = datetime.utcnow() - timedelta(hours=1)
        expired_token = jwt.encode(
            {"sub": "123", "exp": expired_time},
            "test-secret-key-for-testing-only",
            algorithm="HS256"
        )
        
        class MockCredentials:
            def __init__(self, token):
                self.credentials = token
        
        credentials = MockCredentials(expired_token)
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_id(credentials)
        
        assert exc_info.value.status_code == 401


# =============================================================================
# 可选用户ID获取测试
# =============================================================================

class TestGetOptionalUserId:
    """可选用户ID获取测试"""

    @pytest.mark.asyncio
    async def test_optional_user_id_with_valid_token(self):
        """测试有效Token获取用户ID"""
        token = create_access_token({"sub": "100"})
        
        class MockCredentials:
            def __init__(self, token):
                self.credentials = token
        
        credentials = MockCredentials(token)
        user_id = await get_optional_user_id(credentials)
        
        assert user_id == 100

    @pytest.mark.asyncio
    async def test_optional_user_id_no_credentials(self):
        """测试无认证信息返回None"""
        user_id = await get_optional_user_id(None)
        
        assert user_id is None

    @pytest.mark.asyncio
    async def test_optional_user_id_expired_token(self):
        """测试过期Token返回None"""
        expired_time = datetime.utcnow() - timedelta(hours=1)
        expired_token = jwt.encode(
            {"sub": "123", "exp": expired_time},
            "test-secret-key-for-testing-only",
            algorithm="HS256"
        )
        
        class MockCredentials:
            def __init__(self, token):
                self.credentials = token
        
        credentials = MockCredentials(expired_token)
        user_id = await get_optional_user_id(credentials)
        
        assert user_id is None

    @pytest.mark.asyncio
    async def test_optional_user_id_invalid_token(self):
        """测试无效Token返回None"""
        class MockCredentials:
            def __init__(self, token):
                self.credentials = token
        
        credentials = MockCredentials("invalid.token")
        user_id = await get_optional_user_id(credentials)
        
        assert user_id is None


# =============================================================================
# 边界情况测试
# =============================================================================

class TestEdgeCases:
    """边界情况测试"""

    def test_hash_very_long_password(self):
        """测试超长密码哈希"""
        long_password = "a" * 1000
        hashed = hash_password(long_password)
        
        assert verify_password(long_password, hashed) is True

    def test_hash_unicode_password(self):
        """测试各种Unicode字符密码"""
        unicode_passwords = [
            "中文字符密码",
            "🎉🎊🎁表情符号",
            "日本語パスワード",
            "العربية",
            "κρυπτογράφηση",
        ]
        
        for pwd in unicode_passwords:
            hashed = hash_password(pwd)
            assert verify_password(pwd, hashed) is True

    def test_token_with_large_user_id(self):
        """测试大用户ID"""
        large_id = 2147483647  # int32 max
        token = create_access_token({"sub": str(large_id)})
        decoded = decode_access_token(token)
        
        assert decoded["sub"] == str(large_id)

    def test_token_with_special_characters_in_data(self):
        """测试数据中包含特殊字符"""
        data = {
            "sub": "123",
            "name": "测试用户<Test>",
            "description": "Line1\nLine2\tTabbed",
        }
        token = create_access_token(data)
        decoded = decode_access_token(token)
        
        assert decoded["name"] == "测试用户<Test>"
        assert decoded["description"] == "Line1\nLine2\tTabbed"

    @pytest.mark.asyncio
    async def test_get_user_id_string_sub(self):
        """测试sub为字符串时正确转换"""
        token = create_access_token({"sub": "999"})
        
        class MockCredentials:
            def __init__(self, token):
                self.credentials = token
        
        credentials = MockCredentials(token)
        user_id = await get_current_user_id(credentials)
        
        assert user_id == 999
        assert isinstance(user_id, int)
