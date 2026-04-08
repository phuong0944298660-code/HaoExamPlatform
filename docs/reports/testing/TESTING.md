# 接力教育智慧云平台 - 测试文档

本文档详细说明了接力教育智慧云平台的测试基础设施和使用方法。

## 目录

- [概述](#概述)
- [测试结构](#测试结构)
- [快速开始](#快速开始)
- [测试脚本](#测试脚本)
- [CI/CD 配置](#cicd-配置)
- [本地开发测试](#本地开发测试)
- [测试环境](#测试环境)
- [测试数据](#测试数据)
- [最佳实践](#最佳实践)

## 概述

### 测试技术栈

| 类别 | 工具 | 用途 |
|------|------|------|
| 后端单元测试 | pytest | Python 测试框架 |
| 后端覆盖率 | pytest-cov | 代码覆盖率分析 |
| 代码检查 | ruff | Python 代码检查 |
| 类型检查 | mypy | Python 类型检查 |
| 前端单元测试 | vitest | Vue 组件测试 |
| E2E 测试 | Playwright | 端到端测试 |
| CI/CD | GitHub Actions | 持续集成 |

### 测试环境配置

- **MySQL 测试数据库**: 端口 3307
- **Redis 测试服务**: 端口 6380
- **后端测试服务**: 端口 8000
- **前端测试服务**: 端口 5173

## 测试结构

```
.
├── tests/                      # 后端测试目录
│   ├── __init__.py
│   ├── conftest.py            # pytest 配置和 fixtures
│   ├── unit/                  # 单元测试
│   │   ├── test_accounts.py
│   │   ├── test_exams.py
│   │   └── test_papers.py
│   ├── integration/           # 集成测试
│   │   ├── test_api.py
│   │   └── test_database.py
│   └── e2e/                   # E2E 测试
│       └── test_workflow.py
├── e2e/                        # Playwright E2E 测试
│   ├── playwright.config.ts
│   └── tests/
├── scripts/                    # 测试脚本
│   ├── run_tests.sh           # 主测试脚本
│   ├── run_backend_tests.sh   # 后端测试
│   ├── run_frontend_tests.sh  # 前端测试
│   ├── run_e2e_tests.sh       # E2E 测试
│   ├── setup_test_data.py     # 测试数据准备
│   └── wait_for_services.sh   # 服务等待
├── reports/                    # 测试报告输出
├── pytest.ini                 # pytest 配置
├── .coveragerc                # 覆盖率配置
└── Makefile                   # 常用命令
```

## 快速开始

### 1. 运行所有测试

```bash
# 使用主测试脚本
./scripts/run_tests.sh

# 或使用 Makefile
make test
```

### 2. 运行特定测试

```bash
# 仅后端测试
make test-backend
# 或
./scripts/run_backend_tests.sh

# 仅前端测试
make test-frontend
# 或
./scripts/run_frontend_tests.sh

# 仅 E2E 测试
make test-e2e
# 或
./scripts/run_e2e_tests.sh
```

### 3. 启动测试环境

```bash
# 启动完整测试环境
docker-compose -f docker-compose.test.yml up -d

# 等待服务就绪
./scripts/wait_for_services.sh

# 设置测试数据
python scripts/setup_test_data.py setup
```

## 测试脚本

### run_tests.sh

完整测试脚本，执行所有测试流程。

**用法:**

```bash
./scripts/run_tests.sh [选项]
```

**选项:**

| 选项 | 说明 |
|------|------|
| `--skip-env` | 跳过启动测试环境 |
| `--skip-backend` | 跳过后端测试 |
| `--skip-frontend` | 跳过前端测试 |
| `--skip-e2e` | 跳过 E2E 测试 |
| `--skip-cleanup` | 跳过环境清理 |

**示例:**

```bash
# 跳过环境启动（假设环境已运行）
./scripts/run_tests.sh --skip-env

# 仅运行后端测试
./scripts/run_tests.sh --skip-frontend --skip-e2e
```

### run_backend_tests.sh

后端专用测试脚本。

**用法:**

```bash
./scripts/run_backend_tests.sh [选项] [测试路径]
```

**选项:**

| 选项 | 说明 |
|------|------|
| `-v, --verbose` | 详细输出 |
| `-x, --failfast` | 遇到第一个失败时停止 |
| `--no-coverage` | 不生成覆盖率报告 |
| `--lint-only` | 仅运行代码检查 |
| `--type-check-only` | 仅运行类型检查 |
| `--unit-only` | 仅运行单元测试 |

**示例:**

```bash
# 运行特定测试文件
./scripts/run_backend_tests.sh tests/test_accounts.py

# 详细输出，遇到失败停止
./scripts/run_backend_tests.sh -v -x

# 仅运行代码检查
./scripts/run_backend_tests.sh --lint-only
```

### run_frontend_tests.sh

前端专用测试脚本。

**用法:**

```bash
./scripts/run_frontend_tests.sh [选项] [测试路径]
```

**选项:**

| 选项 | 说明 |
|------|------|
| `-v, --verbose` | 详细输出 |
| `-w, --watch` | 监视模式 |
| `--no-coverage` | 不生成覆盖率报告 |
| `--type-check` | 运行 TypeScript 类型检查 |
| `--lint` | 运行 ESLint 检查 |
| `--build` | 运行构建测试 |
| `--all` | 运行所有检查 |

### run_e2e_tests.sh

E2E 测试脚本。

**用法:**

```bash
./scripts/run_e2e_tests.sh [选项] [测试路径]
```

**选项:**

| 选项 | 说明 |
|------|------|
| `--headed` | 有头模式运行（显示浏览器） |
| `--ui` | 打开 Playwright UI 模式 |
| `--skip-env` | 跳过启动测试环境 |

## CI/CD 配置

### GitHub Actions 工作流

`.github/workflows/ci.yml` 定义了以下任务:

1. **Backend Code Quality** - 后端代码检查
2. **Backend Tests** - 后端单元测试
3. **Frontend Code Quality** - 前端代码检查
4. **Frontend Tests** - 前端单元测试
5. **Build Test** - 构建测试
6. **Docker Build Test** - Docker 镜像构建测试
7. **Security Scan** - 安全扫描
8. **Test Summary** - 测试报告汇总

### CI 触发条件

- Push 到 `main`, `master`, `develop` 分支
- Pull Request 到上述分支
- 忽略 `**.md` 和 `docs/**` 的变更

### 本地模拟 CI

```bash
# 使用 Makefile 在本地运行完整 CI 流程
make ci-local

# 或手动执行
make test-env-up
make lint
make test
make coverage
make test-env-down
```

## 本地开发测试

### 后端测试

```bash
# 安装测试依赖
pip install pytest pytest-asyncio pytest-cov httpx ruff mypy

# 运行所有测试
pytest tests/ -v

# 运行特定标记的测试
pytest tests/ -v -m unit
pytest tests/ -v -m integration
pytest tests/ -v -m "not slow"

# 生成覆盖率报告
pytest tests/ --cov=app --cov-report=html --cov-report=term

# 代码检查
ruff check app/ tests/
mypy app/ --ignore-missing-imports
```

### 前端测试

```bash
cd frontend

# 安装测试依赖
npm install -D vitest @vue/test-utils happy-dom @vitest/coverage-v8

# 运行测试
npx vitest run

# 监视模式
npx vitest

# 生成覆盖率报告
npx vitest run --coverage
```

### E2E 测试

```bash
cd e2e

# 安装 Playwright
npm install -D @playwright/test
npx playwright install

# 运行测试
npx playwright test

# 有头模式
npx playwright test --headed

# UI 模式
npx playwright test --ui

# 生成报告
npx playwright show-report
```

## 测试环境

### Docker Compose 测试环境

`docker-compose.test.yml` 包含以下服务:

| 服务 | 说明 | 端口 |
|------|------|------|
| mysql-test | MySQL 测试数据库 | 3307 |
| redis-test | Redis 测试服务 | 6380 |
| backend-test | 后端测试服务 | - |
| frontend-test | 前端测试服务 | - |
| celery-worker-test | Celery Worker 测试 | - |
| e2e-test | E2E 测试服务 | - |

### 启动测试环境

```bash
# 启动基础服务（MySQL + Redis）
docker-compose -f docker-compose.test.yml up -d mysql-test redis-test

# 启动完整测试环境
docker-compose -f docker-compose.test.yml --profile full-test up -d

# 启动包含 Celery 的环境
docker-compose -f docker-compose.test.yml --profile with-celery up -d
```

### 环境变量

```bash
# 测试数据库
DATABASE_URL=mysql+aiomysql://root:rootpass@localhost:3307/jieli_edu_test

# 测试 Redis
REDIS_URL=redis://localhost:6380/0

# 测试模式
APP_ENV=testing
TESTING=true
```

## 测试数据

### setup_test_data.py

测试数据准备脚本，支持以下命令:

```bash
# 设置测试数据
python scripts/setup_test_data.py setup

# 清理测试数据
python scripts/setup_test_data.py cleanup

# 重置测试数据
python scripts/setup_test_data.py reset

# 使用自定义数据库 URL
python scripts/setup_test_data.py setup --database-url "mysql+aiomysql://user:pass@host:3306/db"
```

### 默认测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| teacher1 | teacher123 | 教师 |
| student1 | student123 | 学生 |
| student2 | student123 | 学生 |

## 最佳实践

### 编写后端测试

```python
# tests/unit/test_accounts.py
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.unit
@pytest.mark.asyncio
async def test_create_account():
    """测试创建账号"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/v1/accounts", json={
            "username": "test_user",
            "password": "test123",
            "name": "测试用户",
            "account_type": "student"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "test_user"


@pytest.fixture
async def test_db():
    """测试数据库 fixture"""
    # 设置测试数据
    yield
    # 清理测试数据
```

### 编写前端测试

```typescript
// frontend/src/components/__tests__/Button.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '../Button.vue'

describe('Button', () => {
  it('renders properly', () => {
    const wrapper = mount(Button, {
      props: { label: 'Test Button' }
    })
    expect(wrapper.text()).toContain('Test Button')
  })
})
```

### 编写 E2E 测试

```typescript
// e2e/tests/login.spec.ts
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="username"]', 'admin')
  await page.fill('[name="password"]', 'admin123')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('h1')).toContainText('仪表盘')
})
```

### 测试标记使用

```python
# 常用标记
@pytest.mark.unit           # 单元测试
@pytest.mark.integration    # 集成测试
@pytest.mark.e2e           # 端到端测试
@pytest.mark.slow          # 慢速测试
@pytest.mark.smoke         # 冒烟测试

# 运行特定标记的测试
pytest -v -m unit          # 仅单元测试
pytest -v -m "not slow"    # 排除慢速测试
pytest -v -m "unit and not slow"  # 单元测试且非慢速
```

## 故障排除

### 常见问题

1. **MySQL 连接失败**
   ```bash
   # 检查 MySQL 容器状态
   docker-compose -f docker-compose.test.yml ps
   
   # 查看日志
   docker-compose -f docker-compose.test.yml logs mysql-test
   ```

2. **Redis 连接失败**
   ```bash
   # 检查 Redis 容器
   docker-compose -f docker-compose.test.yml logs redis-test
   ```

3. **权限问题**
   ```bash
   # 给脚本添加执行权限
   chmod +x scripts/*.sh
   ```

4. **测试数据冲突**
   ```bash
   # 重置测试数据
   python scripts/setup_test_data.py reset
   ```

## 相关文档

- [CLAUDE.md](CLAUDE.md) - 项目架构文档
- [CLAUDE_CN.md](CLAUDE_CN.md) - 项目架构文档（中文）
- [pytest 文档](https://docs.pytest.org/)
- [Vitest 文档](https://vitest.dev/)
- [Playwright 文档](https://playwright.dev/)
