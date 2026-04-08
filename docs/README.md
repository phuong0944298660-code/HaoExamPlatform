# 项目文档目录说明

本文档目录按内容类型整理，方便快速查找相关资料。

## 目录结构

```
docs/
├── planning/           # 开发计划和规划文档
│   ├── BASE_PLATFORM_DEVELOPMENT_PLAN.md
│   ├── BASE_PLATFORM_IMPLEMENTATION_PLAN.md
│   ├── BASE_PLATFORM_REQUIREMENTS.md
│   ├── DEVELOPMENT_PLAN.md
│   ├── FUNCTIONALITY_GAP_REPORT.md
│   ├── IMPLEMENTATION_PROGRESS.md
│   ├── IMPLEMENTATION_STATUS.md
│   ├── P0_FIX_PLAN.md
│   └── REQUIREMENTS_GAP_ANALYSIS.md
│
├── reports/            # 各类报告
│   ├── testing/        # 测试相关报告
│   │   ├── BUSINESS_PROCESS_TEST_REPORT.md
│   │   ├── FINAL_TEST_REPORT.md
│   │   ├── PIXEL_TEST_*.md (像素测试相关)
│   │   ├── PRODUCTION_TEST_REPORT.md
│   │   ├── TEST_EXECUTION_REPORT.md
│   │   ├── TEST_REPORT.md
│   │   ├── TESTING.md
│   │   └── UI_TEST_REPORT.md
│   │
│   ├── fixes/          # 修复和问题报告
│   │   ├── COMPLETE_FUNCTIONALITY_CHECK_REPORT.md
│   │   ├── FIX_COMPLETE_REPORT.md
│   │   ├── FIX_REPORT.md
│   │   ├── FIX_REPORT_COMPLETE.md
│   │   └── IMPROVEMENT_REPORT.md
│   │
│   └── project/        # 项目总结报告
│       ├── COMPLETE_SETUP_SUMMARY.md
│       ├── DEMO_DATA_SUMMARY.md
│       ├── FINAL_COMPLETION_REPORT.md
│       ├── FINAL_IMPLEMENTATION_SUMMARY.md
│       ├── PRE_LAUNCH_CHECKLIST.md
│       └── PROJECT_REVIEW_SUMMARY.md
│
├── guides/             # 用户指南和手册
│   ├── LOCAL_DEVELOPMENT_GUIDE.md
│   ├── START_GUIDE.md
│   ├── USER_GUIDE_AND_TEST_FLOW.md
│   └── USER_MANUAL.md
│
├── deployment/         # 部署相关文档
│   ├── DEPLOYMENT_GUIDE.md
│   └── DOCKER_SETUP_GUIDE.md
│
└── requirements/       # 原始需求文档
    ├── Functional Requirements Markdown File
    └── Original Requirements List.xlsx
```

## 根目录保留文件

以下文件保留在项目根目录，因为它们与项目运行直接相关：

- `README.md` - 项目主说明文件
- `CLAUDE.md`, `CLAUDE_CN.md` - AI助手上下文文件
- `Dockerfile` - Docker构建配置
- `docker-compose*.yml` - Docker编排配置
- `nginx.conf`, `nginx-java.conf` - Nginx配置
- `Makefile` - 构建脚本
- `pyproject.toml`, `pytest.ini` - Python项目配置
- `alembic.ini` - 数据库迁移配置
- `requirements.txt` - Python依赖
- `start-local.sh`, `stop-local.sh` - 启动脚本
