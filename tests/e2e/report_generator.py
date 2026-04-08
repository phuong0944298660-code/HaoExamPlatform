"""
测试报告生成器

功能：
- 生成HTML测试报告
- 包含测试覆盖率
- 包含性能指标
- 支持JSON格式导出
"""

import json
import os
import time
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Dict, List, Optional


@dataclass
class TestResult:
    """单个测试结果"""
    name: str
    status: str  # passed, failed, skipped, error
    duration: float
    message: str = ""
    traceback: str = ""
    metadata: Dict = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


@dataclass
class TestSuiteResult:
    """测试套件结果"""
    name: str
    tests: List[TestResult]
    start_time: datetime
    end_time: datetime
    
    @property
    def passed(self) -> int:
        return sum(1 for t in self.tests if t.status == "passed")
    
    @property
    def failed(self) -> int:
        return sum(1 for t in self.tests if t.status == "failed")
    
    @property
    def skipped(self) -> int:
        return sum(1 for t in self.tests if t.status == "skipped")
    
    @property
    def errors(self) -> int:
        return sum(1 for t in self.tests if t.status == "error")
    
    @property
    def total(self) -> int:
        return len(self.tests)
    
    @property
    def duration(self) -> float:
        return (self.end_time - self.start_time).total_seconds()


@dataclass
class CoverageData:
    """覆盖率数据"""
    lines_total: int = 0
    lines_covered: int = 0
    branches_total: int = 0
    branches_covered: int = 0
    functions_total: int = 0
    functions_covered: int = 0
    
    @property
    def line_rate(self) -> float:
        return self.lines_covered / self.lines_total if self.lines_total > 0 else 0
    
    @property
    def branch_rate(self) -> float:
        return self.branches_covered / self.branches_total if self.branches_total > 0 else 0
    
    @property
    def function_rate(self) -> float:
        return self.functions_covered / self.functions_total if self.functions_total > 0 else 0


@dataclass
class PerformanceMetrics:
    """性能指标"""
    api_name: str
    avg_response_time: float
    min_response_time: float
    max_response_time: float
    p50: float
    p95: float
    p99: float
    throughput: float
    error_rate: float
    concurrent_users: int = 0


class TestReportGenerator:
    """测试报告生成器"""
    
    def __init__(self, output_dir: str = "reports"):
        self.output_dir = output_dir
        self.suites: List[TestSuiteResult] = []
        self.coverage: Optional[CoverageData] = None
        self.performance_metrics: List[PerformanceMetrics] = []
        self.start_time = datetime.now()
        
        # 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)
    
    def add_suite(self, suite: TestSuiteResult):
        """添加测试套件结果"""
        self.suites.append(suite)
    
    def set_coverage(self, coverage: CoverageData):
        """设置覆盖率数据"""
        self.coverage = coverage
    
    def add_performance_metric(self, metric: PerformanceMetrics):
        """添加性能指标"""
        self.performance_metrics.append(metric)
    
    def generate_html_report(self, filename: str = "test_report.html") -> str:
        """
        生成HTML测试报告
        
        Returns:
            生成的文件路径
        """
        filepath = os.path.join(self.output_dir, filename)
        
        html_content = self._build_html()
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(html_content)
        
        return filepath
    
    def generate_json_report(self, filename: str = "test_report.json") -> str:
        """
        生成JSON测试报告
        
        Returns:
            生成的文件路径
        """
        filepath = os.path.join(self.output_dir, filename)
        
        report_data = {
            "report_info": {
                "generated_at": datetime.now().isoformat(),
                "duration": (datetime.now() - self.start_time).total_seconds(),
                "generator": "TestReportGenerator v1.0"
            },
            "summary": self._get_summary(),
            "suites": [self._suite_to_dict(s) for s in self.suites],
            "coverage": asdict(self.coverage) if self.coverage else None,
            "performance": [asdict(m) for m in self.performance_metrics]
        }
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        return filepath
    
    def _get_summary(self) -> Dict:
        """获取汇总统计"""
        total_tests = sum(s.total for s in self.suites)
        total_passed = sum(s.passed for s in self.suites)
        total_failed = sum(s.failed for s in self.suites)
        total_skipped = sum(s.skipped for s in self.suites)
        total_errors = sum(s.errors for s in self.suites)
        
        return {
            "total_suites": len(self.suites),
            "total_tests": total_tests,
            "passed": total_passed,
            "failed": total_failed,
            "skipped": total_skipped,
            "errors": total_errors,
            "pass_rate": total_passed / total_tests if total_tests > 0 else 0,
            "total_duration": sum(s.duration for s in self.suites)
        }
    
    def _suite_to_dict(self, suite: TestSuiteResult) -> Dict:
        """将测试套件转换为字典"""
        return {
            "name": suite.name,
            "start_time": suite.start_time.isoformat(),
            "end_time": suite.end_time.isoformat(),
            "duration": suite.duration,
            "summary": {
                "total": suite.total,
                "passed": suite.passed,
                "failed": suite.failed,
                "skipped": suite.skipped,
                "errors": suite.errors
            },
            "tests": [
                {
                    "name": t.name,
                    "status": t.status,
                    "duration": t.duration,
                    "message": t.message,
                    "metadata": t.metadata
                }
                for t in suite.tests
            ]
        }
    
    def _build_html(self) -> str:
        """构建HTML报告内容"""
        summary = self._get_summary()
        
        html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E2E测试报告 - 接力教育智慧云平台</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }}
        
        header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}
        
        header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
        }}
        
        header .subtitle {{
            opacity: 0.9;
            font-size: 1.1em;
        }}
        
        .summary-cards {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .card {{
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.2s;
        }}
        
        .card:hover {{
            transform: translateY(-5px);
        }}
        
        .card .value {{
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 5px;
        }}
        
        .card .label {{
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        
        .card.passed .value {{ color: #28a745; }}
        .card.failed .value {{ color: #dc3545; }}
        .card.skipped .value {{ color: #ffc107; }}
        .card.total .value {{ color: #17a2b8; }}
        .card.duration .value {{ color: #6c757d; }}
        
        .section {{
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        
        .section h2 {{
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #eee;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
        }}
        
        th, td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }}
        
        th {{
            background: #f8f9fa;
            font-weight: 600;
            color: #555;
        }}
        
        tr:hover {{
            background: #f8f9fa;
        }}
        
        .status {{
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 500;
        }}
        
        .status.passed {{
            background: #d4edda;
            color: #155724;
        }}
        
        .status.failed {{
            background: #f8d7da;
            color: #721c24;
        }}
        
        .status.skipped {{
            background: #fff3cd;
            color: #856404;
        }}
        
        .status.error {{
            background: #f5c6cb;
            color: #721c24;
        }}
        
        .progress-bar {{
            width: 100%;
            height: 30px;
            background: #e9ecef;
            border-radius: 15px;
            overflow: hidden;
            display: flex;
        }}
        
        .progress-segment {{
            height: 100%;
            transition: width 0.3s ease;
        }}
        
        .progress-passed {{ background: #28a745; }}
        .progress-failed {{ background: #dc3545; }}
        .progress-skipped {{ background: #ffc107; }}
        
        .coverage-grid {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 20px;
        }}
        
        .coverage-item {{
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }}
        
        .coverage-item .percentage {{
            font-size: 2.5em;
            font-weight: bold;
            color: #28a745;
        }}
        
        .coverage-item .label {{
            color: #666;
            margin-top: 5px;
        }}
        
        .performance-chart {{
            margin-top: 20px;
        }}
        
        .metric-row {{
            display: flex;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }}
        
        .metric-name {{
            width: 200px;
            font-weight: 500;
        }}
        
        .metric-values {{
            flex: 1;
            display: flex;
            gap: 30px;
        }}
        
        .metric-value {{
            text-align: center;
        }}
        
        .metric-value .number {{
            font-size: 1.2em;
            font-weight: bold;
            color: #333;
        }}
        
        .metric-value .label {{
            font-size: 0.8em;
            color: #666;
        }}
        
        footer {{
            text-align: center;
            padding: 30px;
            color: #666;
            font-size: 0.9em;
        }}
        
        @media (max-width: 768px) {{
            .summary-cards {{
                grid-template-columns: repeat(2, 1fr);
            }}
            
            .coverage-grid {{
                grid-template-columns: 1fr;
            }}
            
            .metric-row {{
                flex-direction: column;
                align-items: flex-start;
            }}
            
            .metric-values {{
                margin-top: 10px;
                flex-wrap: wrap;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎓 接力教育智慧云平台</h1>
            <p class="subtitle">端到端(E2E)集成测试报告</p>
            <p class="subtitle">生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </header>
        
        <div class="summary-cards">
            <div class="card total">
                <div class="value">{summary['total_tests']}</div>
                <div class="label">总测试数</div>
            </div>
            <div class="card passed">
                <div class="value">{summary['passed']}</div>
                <div class="label">通过</div>
            </div>
            <div class="card failed">
                <div class="value">{summary['failed']}</div>
                <div class="label">失败</div>
            </div>
            <div class="card skipped">
                <div class="value">{summary['skipped']}</div>
                <div class="label">跳过</div>
            </div>
            <div class="card duration">
                <div class="value">{summary['total_duration']:.2f}s</div>
                <div class="label">总耗时</div>
            </div>
        </div>
        
        <div class="section">
            <h2>📊 通过率概览</h2>
            <div class="progress-bar">
                <div class="progress-segment progress-passed" 
                     style="width: {summary['pass_rate']*100:.1f}%"></div>
                <div class="progress-segment progress-failed" 
                     style="width: {(summary['failed']/summary['total_tests']*100) if summary['total_tests'] > 0 else 0:.1f}%"></div>
                <div class="progress-segment progress-skipped" 
                     style="width: {(summary['skipped']/summary['total_tests']*100) if summary['total_tests'] > 0 else 0:.1f}%"></div>
            </div>
            <p style="margin-top: 15px; text-align: center;">
                通过率: <strong>{summary['pass_rate']*100:.1f}%</strong>
            </p>
        </div>
"""
        
        # 覆盖率部分
        if self.coverage:
            html += f"""
        <div class="section">
            <h2>📈 代码覆盖率</h2>
            <div class="coverage-grid">
                <div class="coverage-item">
                    <div class="percentage">{self.coverage.line_rate*100:.1f}%</div>
                    <div class="label">行覆盖率</div>
                </div>
                <div class="coverage-item">
                    <div class="percentage">{self.coverage.branch_rate*100:.1f}%</div>
                    <div class="label">分支覆盖率</div>
                </div>
                <div class="coverage-item">
                    <div class="percentage">{self.coverage.function_rate*100:.1f}%</div>
                    <div class="label">函数覆盖率</div>
                </div>
            </div>
        </div>
"""
        
        # 性能指标部分
        if self.performance_metrics:
            html += """
        <div class="section">
            <h2>⚡ 性能指标</h2>
            <div class="performance-chart">
"""
            for metric in self.performance_metrics:
                html += f"""
                <div class="metric-row">
                    <div class="metric-name">{metric.api_name}</div>
                    <div class="metric-values">
                        <div class="metric-value">
                            <div class="number">{metric.avg_response_time*1000:.1f}ms</div>
                            <div class="label">平均响应</div>
                        </div>
                        <div class="metric-value">
                            <div class="number">{metric.p95*1000:.1f}ms</div>
                            <div class="label">P95</div>
                        </div>
                        <div class="metric-value">
                            <div class="number">{metric.throughput:.1f}</div>
                            <div class="label">RPS</div>
                        </div>
                        <div class="metric-value">
                            <div class="number">{metric.error_rate*100:.2f}%</div>
                            <div class="label">错误率</div>
                        </div>
                    </div>
                </div>
"""
            html += """
            </div>
        </div>
"""
        
        # 测试套件详情
        for suite in self.suites:
            html += f"""
        <div class="section">
            <h2>📝 {suite.name}</h2>
            <p style="margin-bottom: 15px; color: #666;">
                耗时: {suite.duration:.2f}s | 
                通过: {suite.passed} | 
                失败: {suite.failed} | 
                跳过: {suite.skipped}
            </p>
            <table>
                <thead>
                    <tr>
                        <th>测试名称</th>
                        <th>状态</th>
                        <th>耗时</th>
                        <th>信息</th>
                    </tr>
                </thead>
                <tbody>
"""
            for test in suite.tests:
                html += f"""
                    <tr>
                        <td>{test.name}</td>
                        <td><span class="status {test.status}">{test.status.upper()}</span></td>
                        <td>{test.duration:.3f}s</td>
                        <td>{test.message[:100] if test.message else '-'}</td>
                    </tr>
"""
            html += """
                </tbody>
            </table>
        </div>
"""
        
        html += """
        <footer>
            <p>接力教育智慧云平台 - E2E测试套件 v1.0</p>
            <p>Generated with ❤️ by TestReportGenerator</p>
        </footer>
    </div>
</body>
</html>
"""
        return html


# 便捷函数

def create_simple_report(
    test_results: List[Dict],
    output_dir: str = "reports"
) -> str:
    """
    创建简单测试报告
    
    Args:
        test_results: 测试结果列表
        output_dir: 输出目录
        
    Returns:
        生成的HTML文件路径
    """
    generator = TestReportGenerator(output_dir)
    
    suite = TestSuiteResult(
        name="E2E Tests",
        tests=[
            TestResult(
                name=r.get("name", "Unknown"),
                status=r.get("status", "unknown"),
                duration=r.get("duration", 0),
                message=r.get("message", "")
            )
            for r in test_results
        ],
        start_time=datetime.now(),
        end_time=datetime.now()
    )
    
    generator.add_suite(suite)
    return generator.generate_html_report()


if __name__ == "__main__":
    # 演示报告生成
    print("测试报告生成器演示")
    
    # 创建示例数据
    generator = TestReportGenerator("reports")
    
    suite = TestSuiteResult(
        name="完整考试流程测试",
        tests=[
            TestResult("test_admin_prepare_exam", "passed", 12.5),
            TestResult("test_student_take_exam", "passed", 8.3),
            TestResult("test_teacher_grade", "passed", 5.2),
            TestResult("test_exam_timeout", "skipped", 0, "需要长时间等待"),
        ],
        start_time=datetime.now(),
        end_time=datetime.now()
    )
    
    generator.add_suite(suite)
    
    # 设置覆盖率
    generator.set_coverage(CoverageData(
        lines_total=1000,
        lines_covered=850,
        branches_total=500,
        branches_covered=400,
        functions_total=100,
        functions_covered=90
    ))
    
    # 添加性能指标
    generator.add_performance_metric(PerformanceMetrics(
        api_name="登录接口",
        avg_response_time=0.15,
        min_response_time=0.08,
        max_response_time=0.5,
        p50=0.12,
        p95=0.35,
        p99=0.48,
        throughput=120.5,
        error_rate=0.001,
        concurrent_users=100
    ))
    
    # 生成报告
    html_path = generator.generate_html_report()
    json_path = generator.generate_json_report()
    
    print(f"HTML报告已生成: {html_path}")
    print(f"JSON报告已生成: {json_path}")
