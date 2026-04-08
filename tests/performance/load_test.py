#!/usr/bin/env python3
"""
压力测试脚本 - 支持1000并发请求测试
测试教育平台的API接口稳定性和性能
"""

import asyncio
import aiohttp
import json
import time
import random
import statistics
from datetime import datetime
from typing import List, Dict, Optional
from dataclasses import dataclass
import argparse


@dataclass
class TestResult:
    """测试结果数据类"""
    endpoint: str
    status_code: int
    response_time: float
    success: bool
    error_message: Optional[str] = None


class PerformanceTester:
    """性能测试器"""
    
    def __init__(self, base_url: str, max_concurrent: int = 1000):
        self.base_url = base_url
        self.max_concurrent = max_concurrent
        self.results: List[TestResult] = []
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(timeout=timeout)
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Dict = None,
        headers: Dict = None
    ) -> TestResult:
        """执行单个请求"""
        url = f"{self.base_url}{endpoint}"
        start_time = time.time()
        
        try:
            if method == "GET":
                async with self.session.get(url, headers=headers) as response:
                    await response.text()
                    response_time = time.time() - start_time
                    return TestResult(
                        endpoint=endpoint,
                        status_code=response.status,
                        response_time=response_time,
                        success=200 <= response.status < 300
                    )
            elif method == "POST":
                async with self.session.post(url, json=data, headers=headers) as response:
                    await response.text()
                    response_time = time.time() - start_time
                    return TestResult(
                        endpoint=endpoint,
                        status_code=response.status,
                        response_time=response_time,
                        success=200 <= response.status < 300
                    )
        except Exception as e:
            response_time = time.time() - start_time
            return TestResult(
                endpoint=endpoint,
                status_code=0,
                response_time=response_time,
                success=False,
                error_message=str(e)
            )
    
    async def concurrent_requests(
        self, 
        method: str, 
        endpoint: str, 
        count: int,
        data: Dict = None,
        headers: Dict = None
    ) -> List[TestResult]:
        """执行并发请求"""
        semaphore = asyncio.Semaphore(self.max_concurrent)
        
        async def bounded_request():
            async with semaphore:
                return await self.make_request(method, endpoint, data, headers)
        
        tasks = [bounded_request() for _ in range(count)]
        return await asyncio.gather(*tasks)
    
    def print_statistics(self, results: List[TestResult], test_name: str):
        """打印统计信息"""
        if not results:
            print(f"\n{test_name}: 无结果")
            return
            
        success_count = sum(1 for r in results if r.success)
        fail_count = len(results) - success_count
        success_rate = (success_count / len(results)) * 100
        
        response_times = [r.response_time for r in results]
        avg_time = statistics.mean(response_times)
        min_time = min(response_times)
        max_time = max(response_times)
        
        if len(response_times) > 1:
            p50 = statistics.median(response_times)
            p95 = sorted(response_times)[int(len(response_times) * 0.95)]
            p99 = sorted(response_times)[int(len(response_times) * 0.99)]
        else:
            p50 = p95 = p99 = avg_time
        
        print(f"\n{'='*60}")
        print(f"测试项目: {test_name}")
        print(f"{'='*60}")
        print(f"总请求数: {len(results)}")
        print(f"成功请求: {success_count}")
        print(f"失败请求: {fail_count}")
        print(f"成功率: {success_rate:.2f}%")
        print(f"平均响应时间: {avg_time*1000:.2f}ms")
        print(f"最小响应时间: {min_time*1000:.2f}ms")
        print(f"最大响应时间: {max_time*1000:.2f}ms")
        print(f"P50响应时间: {p50*1000:.2f}ms")
        print(f"P95响应时间: {p95*1000:.2f}ms")
        print(f"P99响应时间: {p99*1000:.2f}ms")
        print(f"{'='*60}\n")


async def run_load_tests(base_url: str, concurrent_users: int = 1000):
    """运行负载测试"""
    print(f"\n🚀 开始压力测试")
    print(f"目标URL: {base_url}")
    print(f"并发用户数: {concurrent_users}")
    print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    async with PerformanceTester(base_url, max_concurrent=concurrent_users) as tester:
        # 测试1: 健康检查端点 (轻量级)
        print("\n📊 测试1: 健康检查端点 - 1000并发")
        results = await tester.concurrent_requests("GET", "/api/health", concurrent_users)
        tester.print_statistics(results, "健康检查端点")
        
        # 测试2: 登录端点 (中量级)
        print("\n📊 测试2: 登录端点 - 500并发")
        login_data = {"username": "admin", "password": "admin123"}
        results = await tester.concurrent_requests(
            "POST", "/api/v1/accounts/login", 500, data=login_data
        )
        tester.print_statistics(results, "登录端点")
        
        # 测试3: 获取可用考试列表 (读取操作)
        print("\n📊 测试3: 获取考试列表 - 800并发")
        results = await tester.concurrent_requests(
            "GET", "/api/v1/exam-engine/available-exams", 800
        )
        tester.print_statistics(results, "获取考试列表")
        
        # 测试4: 仪表盘统计 (频繁访问)
        print("\n📊 测试4: 仪表盘统计 - 600并发")
        results = await tester.concurrent_requests(
            "GET", "/api/v1/dashboard/stats", 600
        )
        tester.print_statistics(results, "仪表盘统计")
        
        # 测试5: 混合场景 - 模拟真实用户行为
        print("\n📊 测试5: 混合场景测试 - 300并发")
        mixed_tasks = []
        
        # 60% 读取操作
        for _ in range(180):
            endpoint = random.choice([
                "/api/health",
                "/api/v1/dashboard/stats",
                "/api/v1/dashboard/recent-exams"
            ])
            mixed_tasks.append(tester.make_request("GET", endpoint))
        
        # 40% 写入操作
        for _ in range(120):
            endpoint = "/api/v1/accounts/login"
            data = {"username": f"user{random.randint(1, 100)}", "password": "test123"}
            mixed_tasks.append(tester.make_request("POST", endpoint, data))
        
        results = await asyncio.gather(*mixed_tasks)
        tester.print_statistics(results, "混合场景测试")
        
    print("\n✅ 压力测试完成")


def main():
    parser = argparse.ArgumentParser(description="教育平台压力测试工具")
    parser.add_argument(
        "--url", 
        default="http://localhost:8080",
        help="目标服务器URL (默认: http://localhost:8080)"
    )
    parser.add_argument(
        "--concurrent", 
        type=int, 
        default=1000,
        help="并发用户数 (默认: 1000)"
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=60,
        help="测试持续时间(秒) (默认: 60)"
    )
    
    args = parser.parse_args()
    
    try:
        asyncio.run(run_load_tests(args.url, args.concurrent))
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试被用户中断")
    except Exception as e:
        print(f"\n❌ 测试出错: {e}")


if __name__ == "__main__":
    main()
