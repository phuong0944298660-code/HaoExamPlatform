#!/usr/bin/env python3
"""
接力教育智慧云平台 - E2E测试运行脚本

用法:
    python tests/run_all_tests.py [options]

选项:
    --e2e           运行端到端测试
    --performance   运行性能测试
    --concurrent    运行并发测试
    --activation    运行激活码测试
    --all           运行所有测试
    --report        生成HTML报告
    --ci            CI/CD模式（简洁输出）
    -v, --verbose   详细输出

示例:
    python tests/run_all_tests.py --all
    python tests/run_all_tests.py --e2e --report
    python tests/run_all_tests.py --performance --ci
"""

import argparse
import asyncio
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import List, Tuple

# 添加项目根目录到路径
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# 导入报告生成器
try:
    from tests.e2e.report_generator import TestReportGenerator, TestSuiteResult, TestResult, CoverageData
    REPORT_GENERATOR_AVAILABLE = True
except ImportError:
    REPORT_GENERATOR_AVAILABLE = False


# =============================================================================
# 配置
# =============================================================================

TEST_DIR = PROJECT_ROOT / "tests" / "e2e"
REPORT_DIR = PROJECT_ROOT / "reports"

# 测试文件映射
TEST_FILES = {
    "e2e": [
        "test_complete_exam_workflow.py",
        "test_activation_workflow.py",
    ],
    "concurrent": [
        "test_concurrent_exam.py",
    ],
    "performance": [
        "test_performance.py",
    ],
    "activation": [
        "test_activation_workflow.py",
    ],
}

# pytest标记映射
MARKERS = {
    "e2e": "e2e",
    "performance": "performance",
    "concurrent": "concurrent",
    "activation": "activation",
    "exam": "exam",
}


# =============================================================================
# 工具函数
# =============================================================================

def print_header(text: str):
    """打印标题"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)


def print_section(text: str):
    """打印小节标题"""
    print(f"\n{'─' * 50}")
    print(f"  {text}")
    print("─" * 50)


def check_dependencies() -> bool:
    """检查依赖是否安装"""
    try:
        import httpx
        import pytest
        import pytest_asyncio
        return True
    except ImportError as e:
        print(f"错误: 缺少依赖 - {e}")
        print("请运行: pip install httpx pytest pytest-asyncio")
        return False


def check_services() -> bool:
    """检查测试服务是否可用"""
    import httpx
    
    try:
        response = httpx.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✓ 后端服务运行正常")
            return True
    except Exception:
        pass
    
    print("⚠ 警告: 后端服务未检测到")
    print("  请确保服务已启动: docker-compose up -d")
    print("  或使用测试环境: docker-compose -f tests/e2e/docker-compose.test.yml up -d")
    return False


def run_pytest(
    markers: List[str],
    verbose: bool = False,
    ci_mode: bool = False,
    junit_xml: str = None
) -> Tuple[int, str]:
    """
    运行pytest测试
    
    Returns:
        (returncode, output)
    """
    cmd = ["python", "-m", "pytest", "-v"] if verbose else ["python", "-m", "pytest"]
    
    # 添加标记筛选
    if markers:
        marker_expr = " or ".join(markers)
        cmd.extend(["-m", marker_expr])
    
    # 添加测试目录
    cmd.append(str(TEST_DIR))
    
    # CI模式
    if ci_mode:
        cmd.extend(["--tb=short", "-q"])
    
    # JUnit XML输出
    if junit_xml:
        cmd.extend(["--junitxml", junit_xml])
    
    # 捕获输出
    print(f"执行命令: {' '.join(cmd)}")
    
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=str(PROJECT_ROOT)
    )
    
    return result.returncode, result.stdout + result.stderr


def parse_pytest_output(output: str) -> dict:
    """解析pytest输出，提取测试结果"""
    results = {
        "passed": 0,
        "failed": 0,
        "skipped": 0,
        "error": 0,
        "total": 0,
        "duration": 0
    }
    
    # 解析结果行 (例如: "50 passed, 2 failed, 3 skipped")
    for line in output.split("\n"):
        if "passed" in line or "failed" in line or "skipped" in line:
            parts = line.split(",")
            for part in parts:
                part = part.strip()
                if "passed" in part:
                    results["passed"] = int(part.split()[0])
                elif "failed" in part:
                    results["failed"] = int(part.split()[0])
                elif "skipped" in part:
                    results["skipped"] = int(part.split()[0])
                elif "error" in part:
                    results["error"] = int(part.split()[0])
    
    results["total"] = results["passed"] + results["failed"] + results["skipped"] + results["error"]
    
    return results


def generate_report_from_output(output: str, duration: float) -> str:
    """从pytest输出生成报告"""
    if not REPORT_GENERATOR_AVAILABLE:
        return None
    
    # 解析输出中的测试结果
    test_results = []
    current_test = None
    
    for line in output.split("\n"):
        # 匹配测试结果行 (例如: "tests/e2e/test_xxx.py::test_name PASSED [ 50%]")
        if "::" in line and ("PASSED" in line or "FAILED" in line or "SKIPPED" in line):
            parts = line.split()
            test_name = parts[0].split("::")[-1]
            status = "passed" if "PASSED" in line else "failed" if "FAILED" in line else "skipped"
            
            test_results.append({
                "name": test_name,
                "status": status,
                "duration": 0,
                "message": ""
            })
    
    # 创建报告生成器
    generator = TestReportGenerator(str(REPORT_DIR))
    
    suite = TestSuiteResult(
        name="E2E Test Suite",
        tests=[
            TestResult(
                name=r["name"],
                status=r["status"],
                duration=r["duration"]
            )
            for r in test_results
        ],
        start_time=datetime.now(),
        end_time=datetime.now()
    )
    
    generator.add_suite(suite)
    
    return generator.generate_html_report()


# =============================================================================
# 主函数
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="接力教育智慧云平台 E2E测试运行脚本",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s --all                    # 运行所有测试
  %(prog)s --e2e --report           # 运行E2E测试并生成报告
  %(prog)s --performance --ci       # 性能测试CI模式
  %(prog)s --activation -v          # 激活码测试详细模式
        """
    )
    
    parser.add_argument("--e2e", action="store_true", help="运行端到端测试")
    parser.add_argument("--performance", action="store_true", help="运行性能测试")
    parser.add_argument("--concurrent", action="store_true", help="运行并发测试")
    parser.add_argument("--activation", action="store_true", help="运行激活码测试")
    parser.add_argument("--all", action="store_true", help="运行所有测试")
    parser.add_argument("--report", action="store_true", help="生成HTML报告")
    parser.add_argument("--ci", action="store_true", help="CI/CD模式")
    parser.add_argument("-v", "--verbose", action="store_true", help="详细输出")
    parser.add_argument("--check-only", action="store_true", help="仅检查环境，不运行测试")
    parser.add_argument("--setup-env", action="store_true", help="启动测试环境")
    parser.add_argument("--teardown-env", action="store_true", help="停止测试环境")
    
    args = parser.parse_args()
    
    # 如果没有指定任何选项，显示帮助
    if not any([
        args.e2e, args.performance, args.concurrent, args.activation,
        args.all, args.check_only, args.setup_env, args.teardown_env
    ]):
        parser.print_help()
        return 0
    
    print_header("接力教育智慧云平台 - E2E测试套件")
    
    # 环境管理
    if args.setup_env:
        print_section("启动测试环境")
        compose_file = TEST_DIR / "docker-compose.test.yml"
        result = subprocess.run(
            ["docker-compose", "-f", str(compose_file), "up", "-d"],
            cwd=str(PROJECT_ROOT)
        )
        if result.returncode == 0:
            print("✓ 测试环境已启动")
            print("  等待服务就绪...")
            time.sleep(10)  # 等待服务启动
        return result.returncode
    
    if args.teardown_env:
        print_section("停止测试环境")
        compose_file = TEST_DIR / "docker-compose.test.yml"
        result = subprocess.run(
            ["docker-compose", "-f", str(compose_file), "down"],
            cwd=str(PROJECT_ROOT)
        )
        if result.returncode == 0:
            print("✓ 测试环境已停止")
        return result.returncode
    
    # 检查依赖
    if not check_dependencies():
        return 1
    
    # 检查服务
    if not args.check_only:
        check_services()
    
    if args.check_only:
        print("✓ 环境检查完成")
        return 0
    
    # 确定要运行的测试
    markers = []
    if args.all:
        markers = list(MARKERS.values())
    else:
        if args.e2e:
            markers.append(MARKERS["e2e"])
        if args.performance:
            markers.append(MARKERS["performance"])
        if args.concurrent:
            markers.append(MARKERS["concurrent"])
        if args.activation:
            markers.append(MARKERS["activation"])
    
    if not markers:
        print("请指定要运行的测试类型")
        return 1
    
    # 运行测试
    print_section(f"运行测试: {', '.join(markers)}")
    
    start_time = time.time()
    
    junit_xml = str(REPORT_DIR / "junit.xml") if args.ci else None
    returncode, output = run_pytest(
        markers=markers,
        verbose=args.verbose,
        ci_mode=args.ci,
        junit_xml=junit_xml
    )
    
    duration = time.time() - start_time
    
    # 输出结果
    if not args.ci or returncode != 0:
        print(output)
    
    # 解析结果
    results = parse_pytest_output(output)
    
    print_section("测试结果汇总")
    print(f"  总测试数: {results['total']}")
    print(f"  通过: {results['passed']} ✓")
    print(f"  失败: {results['failed']} ✗")
    print(f"  跳过: {results['skipped']} ⊘")
    print(f"  错误: {results['error']} ⚠")
    print(f"  耗时: {duration:.2f}s")
    print(f"  通过率: {results['passed']/results['total']*100:.1f}%" if results['total'] > 0 else "  通过率: N/A")
    
    # 生成报告
    if args.report and REPORT_GENERATOR_AVAILABLE:
        print_section("生成测试报告")
        REPORT_DIR.mkdir(exist_ok=True)
        report_path = generate_report_from_output(output, duration)
        if report_path:
            print(f"✓ HTML报告已生成: {report_path}")
        
        # 同时生成JUnit XML报告
        if junit_xml:
            print(f"✓ JUnit XML报告已生成: {junit_xml}")
    
    # 返回状态码
    if returncode == 0:
        print("\n✓ 所有测试通过!")
        return 0
    else:
        print("\n✗ 部分测试失败")
        return 1


# =============================================================================
# 异步测试入口
# =============================================================================

async def run_async_tests():
    """异步运行测试（用于直接调用）"""
    print("异步测试运行器")
    print("使用 pytest 命令行运行测试")
    return 0


if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n测试被中断")
        sys.exit(130)
    except Exception as e:
        print(f"\n错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
