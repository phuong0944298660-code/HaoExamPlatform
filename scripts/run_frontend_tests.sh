#!/bin/bash
# =============================================================================
# 接力教育智慧云平台 - 前端测试运行脚本
# Jieli Education Smart Cloud Platform - Frontend Test Runner
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
REPORTS_DIR="$PROJECT_ROOT/reports"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 打印横幅
print_banner() {
    echo ""
    echo "============================================================================="
    echo "    前端测试套件 (Frontend Test Suite)"
    echo "============================================================================="
    echo ""
}

# 检查环境
check_env() {
    log_info "检查前端环境..."
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        log_error "前端目录不存在: $FRONTEND_DIR"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    log_info "Node.js 版本: $NODE_VERSION"
    log_info "npm 版本: $NPM_VERSION"
}

# 安装依赖
install_dependencies() {
    log_info "安装前端依赖..."
    
    cd "$FRONTEND_DIR"
    
    # 优先使用 npm ci（如果有 package-lock.json）
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    # 安装测试依赖（如果不存在）
    if ! npm list vitest &>/dev/null 2>&1; then
        log_info "安装 vitest..."
        npm install -D vitest @vue/test-utils happy-dom @vitest/coverage-v8
    fi
    
    if ! npm list @playwright/test &>/dev/null 2>&1 && [ "$E2E" = "true" ]; then
        log_info "安装 Playwright..."
        npm install -D @playwright/test
        npx playwright install
    fi
    
    cd "$PROJECT_ROOT"
    log_success "依赖安装完成"
}

# 运行 Vitest 测试
run_vitest() {
    log_info "========================================"
    log_info "运行 Vitest 单元测试"
    log_info "========================================"
    
    cd "$FRONTEND_DIR"
    
    local vitest_args=""
    
    if [ "$VERBOSE" = "true" ]; then
        vitest_args="$vitest_args --reporter=verbose"
    else
        vitest_args="$vitest_args --reporter=dot"
    fi
    
    if [ "$WATCH" = "true" ]; then
        vitest_args="$vitest_args --watch"
    else
        vitest_args="$vitest_args --run"
    fi
    
    if [ "$COVERAGE" = "true" ]; then
        vitest_args="$vitest_args --coverage"
    fi
    
    if [ -n "$TEST_PATH" ]; then
        vitest_args="$vitest_args $TEST_PATH"
    fi
    
    # 运行测试
    if npx vitest $vitest_args 2>&1 | tee "$REPORTS_DIR/frontend-test-output.log"; then
        log_success "前端单元测试通过"
        return 0
    else
        log_error "前端单元测试失败"
        return 1
    fi
}

# 运行 TypeScript 类型检查
run_type_check() {
    log_info "========================================"
    log_info "运行 TypeScript 类型检查"
    log_info "========================================"
    
    cd "$FRONTEND_DIR"
    
    if npm run type-check 2>&1 | tee "$REPORTS_DIR/frontend-typecheck.log"; then
        log_success "类型检查通过"
        return 0
    else
        log_warn "类型检查发现问题"
        return 1
    fi
}

# 运行 ESLint 检查
run_lint() {
    log_info "========================================"
    log_info "运行 ESLint 代码检查"
    log_info "========================================"
    
    cd "$FRONTEND_DIR"
    
    if npm run lint 2>&1 | tee "$REPORTS_DIR/frontend-lint.log"; then
        log_success "ESLint 检查通过"
        return 0
    else
        log_warn "ESLint 发现问题"
        return 1
    fi
}

# 运行构建测试
run_build_test() {
    log_info "========================================"
    log_info "运行构建测试"
    log_info "========================================"
    
    cd "$FRONTEND_DIR"
    
    if npm run build 2>&1 | tee "$REPORTS_DIR/frontend-build.log"; then
        log_success "构建测试通过"
        return 0
    else
        log_error "构建测试失败"
        return 1
    fi
}

# 运行 E2E 测试
run_e2e() {
    log_info "========================================"
    log_info "运行 E2E 测试"
    log_info "========================================"
    
    cd "$FRONTEND_DIR"
    
    if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then
        log_info "运行 Playwright E2E 测试..."
        npx playwright test --reporter=list 2>&1 | tee "$REPORTS_DIR/frontend-e2e.log"
        return $?
    else
        log_warn "未找到 Playwright 配置，跳过 E2E 测试"
        return 0
    fi
}

# 生成测试报告
generate_report() {
    log_info "生成前端测试报告..."
    
    cd "$FRONTEND_DIR"
    
    # 生成 HTML 报告（如果 vitest 支持）
    if [ -d "html" ]; then
        cp -r html "$REPORTS_DIR/frontend-html-report" 2>/dev/null || true
    fi
    
    # 复制覆盖率报告
    if [ -d "coverage" ]; then
        cp -r coverage "$REPORTS_DIR/frontend-coverage" 2>/dev/null || true
    fi
    
    log_success "报告已生成"
}

# 显示帮助信息
show_help() {
    cat << EOF
用法: $(basename "$0") [选项] [测试路径]

选项:
    -v, --verbose       显示详细输出
    -w, --watch         监视模式（持续运行）
    --no-coverage       不生成覆盖率报告
    --type-check        运行 TypeScript 类型检查
    --lint              运行 ESLint 检查
    --build             运行构建测试
    --e2e               运行 E2E 测试
    --all               运行所有检查
    --help              显示帮助信息

示例:
    $(basename "$0")                          # 运行前端单元测试
    $(basename "$0") src/components           # 测试特定目录
    $(basename "$0") -v                       # 详细输出
    $(basename "$0") --all                    # 运行所有检查
EOF
}

# 主函数
main() {
    print_banner
    
    # 默认配置
    VERBOSE=false
    WATCH=false
    COVERAGE=true
    RUN_TYPE_CHECK=false
    RUN_LINT=false
    RUN_BUILD=false
    E2E=false
    TEST_PATH=""
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -w|--watch)
                WATCH=true
                shift
                ;;
            --no-coverage)
                COVERAGE=false
                shift
                ;;
            --type-check)
                RUN_TYPE_CHECK=true
                shift
                ;;
            --lint)
                RUN_LINT=true
                shift
                ;;
            --build)
                RUN_BUILD=true
                shift
                ;;
            --e2e)
                E2E=true
                shift
                ;;
            --all)
                RUN_TYPE_CHECK=true
                RUN_LINT=true
                RUN_BUILD=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            -*)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
            *)
                TEST_PATH="$1"
                shift
                ;;
        esac
    done
    
    # 检查环境
    check_env
    
    # 安装依赖
    install_dependencies
    
    # 创建报告目录
    mkdir -p "$REPORTS_DIR"
    
    local EXIT_CODE=0
    
    # 运行类型检查
    if [ "$RUN_TYPE_CHECK" = "true" ]; then
        run_type_check || EXIT_CODE=1
    fi
    
    # 运行 ESLint
    if [ "$RUN_LINT" = "true" ]; then
        run_lint || EXIT_CODE=1
    fi
    
    # 运行构建测试
    if [ "$RUN_BUILD" = "true" ]; then
        run_build_test || EXIT_CODE=1
    fi
    
    # 运行单元测试
    run_vitest || EXIT_CODE=1
    
    # 运行 E2E 测试
    if [ "$E2E" = "true" ]; then
        run_e2e || EXIT_CODE=1
    fi
    
    # 生成报告
    generate_report
    
    # 打印摘要
    echo ""
    echo "============================================================================="
    echo "                          前端测试摘要"
    echo "============================================================================="
    echo "测试日志:      $REPORTS_DIR/frontend-test-output.log"
    echo "覆盖率报告:    $REPORTS_DIR/frontend-coverage/"
    echo "============================================================================="
    echo ""
    
    exit $EXIT_CODE
}

# 执行主函数
main "$@"
