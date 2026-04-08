#!/bin/bash
# =============================================================================
# 接力教育智慧云平台 - E2E 测试运行脚本
# Jieli Education Smart Cloud Platform - E2E Test Runner
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
REPORTS_DIR="$PROJECT_ROOT/reports"
E2E_DIR="$PROJECT_ROOT/e2e"

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
    echo "    E2E 端到端测试套件"
    echo "    Jieli Education Smart Cloud Platform"
    echo "============================================================================="
    echo ""
}

# 检查环境
check_env() {
    log_info "检查 E2E 测试环境..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    log_info "Node.js 版本: $(node --version)"
}

# 检测 E2E 框架
detect_e2e_framework() {
    if [ -f "$E2E_DIR/playwright.config.ts" ] || [ -f "$E2E_DIR/playwright.config.js" ]; then
        echo "playwright"
    elif [ -f "$E2E_DIR/cypress.config.ts" ] || [ -f "$E2E_DIR/cypress.config.js" ]; then
        echo "cypress"
    elif [ -f "$PROJECT_ROOT/frontend/playwright.config.ts" ]; then
        echo "playwright-frontend"
    elif [ -f "$PROJECT_ROOT/frontend/cypress.config.ts" ]; then
        echo "cypress-frontend"
    else
        echo "none"
    fi
}

# 启动测试环境
start_test_env() {
    log_info "启动测试环境..."
    
    # 启动 docker-compose.test.yml
    if [ -f "$PROJECT_ROOT/docker-compose.test.yml" ]; then
        docker-compose -f "$PROJECT_ROOT/docker-compose.test.yml" up -d --build
        
        # 等待服务就绪
        "$PROJECT_ROOT/scripts/wait_for_services.sh"
    fi
    
    log_success "测试环境已启动"
}

# 停止测试环境
stop_test_env() {
    log_info "停止测试环境..."
    
    if [ -f "$PROJECT_ROOT/docker-compose.test.yml" ]; then
        docker-compose -f "$PROJECT_ROOT/docker-compose.test.yml" down -v 2>/dev/null || true
    fi
    
    log_success "测试环境已停止"
}

# 运行 Playwright 测试
run_playwright() {
    log_info "========================================"
    log_info "运行 Playwright E2E 测试"
    log_info "========================================"
    
    local test_dir=$1
    cd "$test_dir"
    
    # 安装依赖
    if [ ! -d "node_modules" ]; then
        log_info "安装 Playwright 依赖..."
        npm ci 2>/dev/null || npm install
        npx playwright install
    fi
    
    local playwright_args=""
    
    # 添加报告配置
    playwright_args="$playwright_args --reporter=list,junit"
    
    # 设置 JUnit 输出
    export PLAYWRIGHT_JUNIT_OUTPUT_FILE="$REPORTS_DIR/e2e-test-report.xml"
    
    if [ "$HEADED" = "true" ]; then
        playwright_args="$playwright_args --headed"
    fi
    
    if [ "$UI" = "true" ]; then
        playwright_args="$playwright_args --ui"
    fi
    
    if [ -n "$TEST_PATH" ]; then
        playwright_args="$playwright_args $TEST_PATH"
    fi
    
    # 运行测试
    if npx playwright test $playwright_args 2>&1 | tee "$REPORTS_DIR/e2e-test-output.log"; then
        log_success "Playwright E2E 测试通过"
        return 0
    else
        log_error "Playwright E2E 测试失败"
        return 1
    fi
}

# 运行 Cypress 测试
run_cypress() {
    log_info "========================================"
    log_info "运行 Cypress E2E 测试"
    log_info "========================================"
    
    local test_dir=$1
    cd "$test_dir"
    
    # 安装依赖
    if [ ! -d "node_modules" ]; then
        log_info "安装 Cypress 依赖..."
        npm ci 2>/dev/null || npm install
    fi
    
    local cypress_args=""
    
    if [ "$HEADED" = "true" ]; then
        cypress_args="$cypress_args --headed"
    else
        cypress_args="$cypress_args --headless"
    fi
    
    if [ -n "$TEST_PATH" ]; then
        cypress_args="$cypress_args --spec '$TEST_PATH'"
    fi
    
    # 运行测试
    if npx cypress run $cypress_args 2>&1 | tee "$REPORTS_DIR/e2e-test-output.log"; then
        log_success "Cypress E2E 测试通过"
        return 0
    else
        log_error "Cypress E2E 测试失败"
        return 1
    fi
}

# 生成测试报告
generate_report() {
    log_info "生成 E2E 测试报告..."
    
    # 复制 Playwright 报告
    if [ -d "$E2E_DIR/playwright-report" ]; then
        cp -r "$E2E_DIR/playwright-report" "$REPORTS_DIR/e2e-html-report" 2>/dev/null || true
    elif [ -d "$PROJECT_ROOT/frontend/playwright-report" ]; then
        cp -r "$PROJECT_ROOT/frontend/playwright-report" "$REPORTS_DIR/e2e-html-report" 2>/dev/null || true
    fi
    
    # 复制测试产物
    if [ -d "$E2E_DIR/test-results" ]; then
        cp -r "$E2E_DIR/test-results" "$REPORTS_DIR/e2e-test-results" 2>/dev/null || true
    fi
    
    log_success "E2E 报告已生成"
}

# 显示帮助信息
show_help() {
    cat << EOF
用法: $(basename "$0") [选项] [测试路径]

选项:
    --headed            有头模式运行（显示浏览器）
    --ui                打开 Playwright UI 模式
    --skip-env          跳过启动测试环境
    --framework         指定 E2E 框架 (playwright|cypress)
    --help              显示帮助信息

示例:
    $(basename "$0")                          # 运行所有 E2E 测试
    $(basename "$0") tests/login.spec.ts      # 运行特定测试文件
    $(basename "$0") --headed                 # 有头模式运行
    $(basename "$0") --ui                     # 打开 UI 模式
EOF
}

# 主函数
main() {
    print_banner
    
    # 默认配置
    HEADED=false
    UI=false
    SKIP_ENV=false
    FRAMEWORK=""
    TEST_PATH=""
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --headed)
                HEADED=true
                shift
                ;;
            --ui)
                UI=true
                shift
                ;;
            --skip-env)
                SKIP_ENV=true
                shift
                ;;
            --framework)
                FRAMEWORK="$2"
                shift 2
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
    
    # 创建报告目录
    mkdir -p "$REPORTS_DIR"
    
    # 启动测试环境
    if [ "$SKIP_ENV" != "true" ]; then
        start_test_env
        trap stop_test_env EXIT
    fi
    
    # 检测 E2E 框架
    if [ -z "$FRAMEWORK" ]; then
        FRAMEWORK=$(detect_e2e_framework)
    fi
    
    log_info "检测到 E2E 框架: $FRAMEWORK"
    
    local EXIT_CODE=0
    
    case $FRAMEWORK in
        playwright)
            run_playwright "$E2E_DIR" || EXIT_CODE=1
            ;;
        playwright-frontend)
            run_playwright "$PROJECT_ROOT/frontend" || EXIT_CODE=1
            ;;
        cypress)
            run_cypress "$E2E_DIR" || EXIT_CODE=1
            ;;
        cypress-frontend)
            run_cypress "$PROJECT_ROOT/frontend" || EXIT_CODE=1
            ;;
        none)
            log_warn "未检测到 E2E 测试框架"
            log_info "支持的框架: Playwright, Cypress"
            EXIT_CODE=1
            ;;
    esac
    
    # 生成报告
    generate_report
    
    # 打印摘要
    echo ""
    echo "============================================================================="
    echo "                          E2E 测试摘要"
    echo "============================================================================="
    echo "测试输出:  $REPORTS_DIR/e2e-test-output.log"
    echo "测试报告:  $REPORTS_DIR/e2e-test-report.xml"
    echo "HTML 报告: $REPORTS_DIR/e2e-html-report/"
    echo "============================================================================="
    echo ""
    
    exit $EXIT_CODE
}

# 执行主函数
main "$@"
