# =============================================================================
# Makefile for Jieli Education Smart Cloud Platform
# 接力教育智慧云平台 - 常用命令
# =============================================================================

.PHONY: help install dev-install test test-backend test-frontend test-e2e coverage lint format clean docker-build docker-up docker-down migrate migrate-create shell

# 默认目标
.DEFAULT_GOAL := help

# 变量定义
PYTHON := python3
PIP := pip3
DOCKER_COMPOSE := docker-compose
PROJECT_NAME := jieli-edu-platform

# 颜色定义
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

# =============================================================================
# 帮助
# =============================================================================
help: ## 显示帮助信息
	@echo "$(BLUE)接力教育智慧云平台 - 可用命令$(NC)"
	@echo "========================================"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# =============================================================================
# 安装
# =============================================================================
install: ## 安装生产依赖
	$(PIP) install -r requirements.txt

dev-install: ## 安装开发依赖
	$(PIP) install -r requirements.txt
	$(PIP) install pytest pytest-asyncio pytest-cov httpx ruff mypy

install-frontend: ## 安装前端依赖
	cd frontend && npm install

# =============================================================================
# 测试
# =============================================================================
test: ## 运行所有测试
	@echo "$(BLUE)运行所有测试...$(NC)"
	./scripts/run_tests.sh

test-backend: ## 仅运行后端测试
	@echo "$(BLUE)运行后端测试...$(NC)"
	./scripts/run_backend_tests.sh

test-frontend: ## 仅运行前端测试
	@echo "$(BLUE)运行前端测试...$(NC)"
	./scripts/run_frontend_tests.sh

test-e2e: ## 仅运行 E2E 测试
	@echo "$(BLUE)运行 E2E 测试...$(NC)"
	./scripts/run_e2e_tests.sh

test-unit: ## 运行单元测试
	$(PYTHON) -m pytest tests/ -v -m unit

test-integration: ## 运行集成测试
	$(PYTHON) -m pytest tests/ -v -m integration

test-smoke: ## 运行冒烟测试
	$(PYTHON) -m pytest tests/ -v -m smoke

coverage: ## 生成覆盖率报告
	@echo "$(BLUE)生成覆盖率报告...$(NC)"
	$(PYTHON) -m pytest tests/ --cov=app --cov-report=html --cov-report=term
	@echo "$(GREEN)覆盖率报告已生成: reports/htmlcov/index.html$(NC)"

coverage-xml: ## 生成 XML 覆盖率报告
	$(PYTHON) -m pytest tests/ --cov=app --cov-report=xml

# =============================================================================
# 代码质量
# =============================================================================
lint: ## 运行代码检查
	@echo "$(BLUE)运行代码检查...$(NC)"
	ruff check app/ tests/
	mypy app/ --ignore-missing-imports

lint-fix: ## 自动修复代码问题
	@echo "$(BLUE)自动修复代码问题...$(NC)"
	ruff check app/ tests/ --fix
	ruff format app/ tests/

format: ## 格式化代码
	@echo "$(BLUE)格式化代码...$(NC)"
	ruff format app/ tests/

type-check: ## 运行类型检查
	@echo "$(BLUE)运行类型检查...$(NC)"
	mypy app/ --ignore-missing-imports --show-error-codes

security-check: ## 运行安全检查
	@echo "$(BLUE)运行安全检查...$(NC)"
	pip install safety bandit
	safety check
	bandit -r app/ -f json -o reports/bandit-report.json || true

# =============================================================================
# 开发服务器
# =============================================================================
dev: ## 启动开发服务器（后端）
	@echo "$(BLUE)启动后端开发服务器...$(NC)"
	$(PYTHON) -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## 启动开发服务器（前端）
	@echo "$(BLUE)启动前端开发服务器...$(NC)"
	cd frontend && npm run dev

dev-all: ## 启动所有开发服务器（需要 docker-compose）
	@echo "$(BLUE)启动所有开发服务...$(NC)"
	$(DOCKER_COMPOSE) up -d db redis
	@sleep 5
	make dev &
	make dev-frontend &
	@wait

# =============================================================================
# Docker
# =============================================================================
docker-build: ## 构建 Docker 镜像
	@echo "$(BLUE)构建 Docker 镜像...$(NC)"
	$(DOCKER_COMPOSE) build

docker-up: ## 启动 Docker 服务
	@echo "$(BLUE)启动 Docker 服务...$(NC)"
	$(DOCKER_COMPOSE) up -d

docker-down: ## 停止 Docker 服务
	@echo "$(BLUE)停止 Docker 服务...$(NC)"
	$(DOCKER_COMPOSE) down

docker-logs: ## 查看 Docker 日志
	$(DOCKER_COMPOSE) logs -f

docker-clean: ## 清理 Docker 资源
	@echo "$(BLUE)清理 Docker 资源...$(NC)"
	$(DOCKER_COMPOSE) down -v
	docker system prune -f

# =============================================================================
# 测试环境
# =============================================================================
test-env-up: ## 启动测试环境
	@echo "$(BLUE)启动测试环境...$(NC)"
	docker-compose -f docker-compose.test.yml up -d
	./scripts/wait_for_services.sh

test-env-down: ## 停止测试环境
	@echo "$(BLUE)停止测试环境...$(NC)"
	docker-compose -f docker-compose.test.yml down -v

test-env-logs: ## 查看测试环境日志
	docker-compose -f docker-compose.test.yml logs -f

setup-test-data: ## 设置测试数据
	@echo "$(BLUE)设置测试数据...$(NC)"
	$(PYTHON) scripts/setup_test_data.py setup

cleanup-test-data: ## 清理测试数据
	@echo "$(BLUE)清理测试数据...$(NC)"
	$(PYTHON) scripts/setup_test_data.py cleanup

# =============================================================================
# 数据库
# =============================================================================
migrate: ## 运行数据库迁移
	@echo "$(BLUE)运行数据库迁移...$(NC)"
	alembic upgrade head

migrate-create: ## 创建新的迁移文件
	@read -p "输入迁移信息: " msg; \
	alembic revision --autogenerate -m "$$msg"

migrate-down: ## 回滚数据库迁移
	@echo "$(YELLOW)回滚最后一个迁移...$(NC)"
	alembic downgrade -1

migrate-history: ## 查看迁移历史
	alembic history --verbose

db-reset: ## 重置数据库（危险！）
	@echo "$(RED)警告: 这将删除所有数据！$(NC)"
	@read -p "确定要继续吗? [y/N] " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		alembic downgrade base && alembic upgrade head; \
	else \
		echo "已取消"; \
	fi

# =============================================================================
# 工具
# =============================================================================
shell: ## 进入 Python 交互式 shell
	$(PYTHON) -c "from app.main import app; from app.core.database import get_db; print('App imported successfully')" && $(PYTHON)

requirements: ## 生成 requirements.txt
	@echo "$(BLUE)生成 requirements.txt...$(NC)"
	pip freeze > requirements.txt

clean: ## 清理临时文件
	@echo "$(BLUE)清理临时文件...$(NC)"
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	rm -rf build/ dist/ *.egg-info/

clean-all: clean ## 清理所有生成的文件
	rm -rf reports/
	rm -rf uploads/*

# =============================================================================
# 构建
# =============================================================================
build-frontend: ## 构建前端
	@echo "$(BLUE)构建前端...$(NC)"
	cd frontend && npm run build

build: build-frontend ## 构建项目
	@echo "$(GREEN)项目构建完成$(NC)"

# =============================================================================
# CI/CD
# =============================================================================
ci: lint test coverage ## 运行 CI 流程
	@echo "$(GREEN)CI 流程完成$(NC)"

ci-local: ## 在本地运行 CI 流程
	@echo "$(BLUE)运行本地 CI 流程...$(NC)"
	make test-env-up
	@sleep 10
	-make lint
	-make test
	-make coverage
	make test-env-down
	@echo "$(GREEN)本地 CI 流程完成$(NC)"

# =============================================================================
# 文档
# =============================================================================
docs-serve: ## 启动文档服务器
	@echo "$(YELLOW)文档功能暂未配置$(NC)"

docs-build: ## 构建文档
	@echo "$(YELLOW)文档功能暂未配置$(NC)"
