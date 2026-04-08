"""
示例测试文件
演示如何编写测试用例
"""

import asyncio

import pytest


@pytest.mark.unit
class TestExample:
    """示例测试类"""
    
    def test_simple_assertion(self):
        """简单断言测试"""
        assert True
        assert 1 + 1 == 2
    
    def test_string_operations(self):
        """字符串操作测试"""
        text = "Hello, World!"
        assert text.startswith("Hello")
        assert "World" in text
        assert len(text) == 13
    
    def test_list_operations(self):
        """列表操作测试"""
        items = [1, 2, 3, 4, 5]
        assert len(items) == 5
        assert sum(items) == 15
        assert max(items) == 5


@pytest.mark.unit
@pytest.mark.asyncio
async def test_async_example():
    """异步测试示例"""
    # 模拟异步操作
    await asyncio.sleep(0.001)
    assert True
