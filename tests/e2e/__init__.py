"""
接力教育智慧云平台 - E2E端到端测试套件

本测试套件覆盖以下核心业务流程：
1. 完整考试流程（管理员准备→学生参加→教师批改）
2. 激活码流程（生成→激活→多端互踢）
3. 并发考试场景（多学生同时考试）
4. 性能和压力测试

运行方式：
    python tests/run_all_tests.py
    pytest tests/e2e/ -v

目录结构：
    tests/e2e/
    ├── __init__.py              # 测试包初始化
    ├── conftest.py              # pytest fixtures和配置
    ├── docker-compose.test.yml  # 测试环境Docker配置
    ├── data_generator.py        # 测试数据生成器
    ├── report_generator.py      # 测试报告生成器
    ├── test_complete_exam_workflow.py  # 完整考试流程测试
    ├── test_activation_workflow.py     # 激活码流程测试
    ├── test_concurrent_exam.py         # 并发考试测试
    └── test_performance.py             # 性能测试
"""

__version__ = "1.0.0"
__author__ = "Test Team"

# 导出常用组件
from .data_generator import (
    TestDataGenerator,
    QuestionDataGenerator,
    AnswerDataGenerator,
    generate_test_students,
    generate_test_questions,
    generate_test_answers
)

try:
    from .report_generator import (
        TestReportGenerator,
        TestResult,
        TestSuiteResult,
        CoverageData,
        PerformanceMetrics
    )
except ImportError:
    pass  # 报告生成器依赖可选

__all__ = [
    "TestDataGenerator",
    "QuestionDataGenerator",
    "AnswerDataGenerator",
    "generate_test_students",
    "generate_test_questions",
    "generate_test_answers",
]
