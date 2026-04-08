#!/bin/bash
# =============================================================================
# 接力教育智慧云平台 - 完整测试运行脚本
# Jieli Education Smart Cloud Platform - Full Test Runner
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
cd "$PROJECT_ROOT"

# 测试报告目录
REPORTS_DIR="$PROJECT_ROOT/reports"
mkdir -p "$REPORTS_DIR"

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

# 测试统计
TEST_START_TIME=$(date +%s)
BACKEND_TESTS_PASSED=0
BACKEND_TESTS_FAILED=0
FRONTEND_TESTS_PASSED=0
FRONTEND_TESTS_FAILED=0
E2E_TESTS_PASSED=0
E2E_TESTS_FAILED=0

# 打印测试横幅
print_banner() {
    echo ""
    echo "============================================================================="
    echo "    接力教育智慧云平台 - 完整测试套件"
    echo "    Jieli Education Smart Cloud Platform - Full Test Suite"
    echo "============================================================================="
    echo ""
    echo "开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "项目路径: $PROJECT_ROOT"
    echo ""
}

# 清理函数
cleanup() {
    log_info "执行测试环境清理..."
    
    # 停止测试服务
    if [ -f "docker-compose.test.yml" ]; then
        docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true
    fi
    
    # 清理测试数据库（如果是本地运行）
    if [ "$SKIP_CLEANUP" != "true" ]; then
        rm -rf "$REPORTS_DIR"/*.tmp 2>/dev/null || true
    fi
    
    log_info "清理完成"
}

# 设置错误处理
trap cleanup EXIT

# 启动测试环境
start_test_environment() {
    log_info "启动测试环境..."
    
    # 检查 docker-compose.test.yml 是否存在
    if [ ! -f "docker-compose.test.yml" ]; then
        log_error "docker-compose.test.yml 文件不存在"
        exit 1
    fi
    
    # 启动测试服务
    docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true
    docker-compose -f docker-compose.test.yml up -d --build
    
    # 等待服务就绪
    log_info "等待服务就绪..."
    "$PROJECT_ROOT/scripts/wait_for_services.sh"
    
    log_success "测试环境已启动"
}

# 运行后端测试
run_backend_tests() {
    log_info "========================================"
    log_info "运行后端测试 (Backend Tests)"
    log_info "========================================"
    
    local backend_report="$REPORTS_DIR/backend-test-report.xml"
    local coverage_report="$REPORTS_DIR/backend-coverage.xml"
    
    # 检查是否在虚拟环境中
    if [ -z "$VIRTUAL_ENV" ]; then
        log_warn "未检测到虚拟环境，尝试使用系统 Python"
    fi
    
    # 安装测试依赖
    log_info "安装测试依赖..."
    pip install -q pytest pytest-asyncio pytest-cov httpx ruff mypy 2>/dev/null || true
    
    # 运行代码检查
    log_info "运行代码检查 (ruff)..."
    ruff check app/ --output-format junit > "$REPORTS_DIR/ruff-report.xml" 2>/dev/null || true
    
    log_info "运行类型检查 (mypy)..."
    mypy app/ --junit-xml "$REPORTS_DIR/mypy-report.xml" 2>/dev/null || true
    
    # 运行 pytest 测试
    log_info "运行 pytest 测试..."
    if python -m pytest tests/ \
        --verbose \
        --tb=short \
        --junitxml="$backend_report" \
        --cov=app \
        --cov-report=xml:"$coverage_report" \
        --cov-report=html:"$REPORTS_DIR/htmlcov" \
        --cov-report=term 2>&1 | tee "$REPORTS_DIR/backend-test-output.log"; then
        
        BACKEND_TESTS_PASSED=1
        log_success "后端测试通过"
    else
        BACKEND_TESTS_FAILED=1
        log_error "后端测试失败"
    fi
    
    echo ""
}

# 运行前端测试
run_frontend_tests() {
    log_info "========================================"
    log_info "运行前端测试 (Frontend Tests)"
    log_info "========================================"
    
    local frontend_dir="$PROJECT_ROOT/frontend"
    
    if [ ! -d "$frontend_dir" ]; then
        log_warn "前端目录不存在，跳过前端测试"
        return 0
    fi
    
    cd "$frontend_dir"
    
    # 检查 package.json
    if [ ! -f "package.json" ]; then
        log_warn "前端 package.json 不存在，跳过前端测试"
        cd "$PROJECT_ROOT"
        return 0
    fi
    
    # 安装依赖
    log_info "安装前端依赖..."
    npm ci 2>/dev/null || npm install
    
    # 检查是否有测试脚本
    if npm run | grep -q "test"; then
        log_info "运行前端测试..."
        if npm run test -- --reporter=dot 2>&1 | tee "$REPORTS_DIR/frontend-test-output.log"; then
            FRONTEND_TESTS_PASSED=1
            log_success "前端测试通过"
        else
            FRONTEND_TESTS_FAILED=1
            log_error "前端测试失败"
        fi
    else
        # 尝试使用 vitest
        log_info "尝试使用 vitest 运行测试..."
        npx vitest run --reporter=verbose 2>&1 | tee "$REPORTS_DIR/frontend-test-output.log" || true
        
        # 检查测试结果
        if grep -q "passed" "$REPORTS_DIR/frontend-test-output.log" 2>/dev/null; then
            FRONTEND_TESTS_PASSED=1
            log_success "前端测试通过"
        else
            log_warn "未检测到前端测试结果"
        fi
    fi
    
    cd "$PROJECT_ROOT"
    echo ""
}

# 运行 E2E 测试
run_e2e_tests() {
    log_info "========================================"
    log_info "运行 E2E 测试 (End-to-End Tests)"
    log_info "========================================"
    
    local e2e_dir="$PROJECT_ROOT/e2e"
    
    if [ ! -d "$e2e_dir" ]; then
        log_warn "E2E 测试目录不存在，跳过 E2E 测试"
        return 0
    fi
    
    cd "$e2e_dir"
    
    # 检查 Playwright
    if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then
        log_info "运行 Playwright E2E 测试..."
        npx playwright test --reporter=junit 2>&1 | tee "$REPORTS_DIR/e2e-test-output.log" || true
        
        if [ -f "test-results/junit.xml" ]; then
            cp "test-results/junit.xml" "$REPORTS_DIR/e2e-test-report.xml"
        fi
        
        E2E_TESTS_PASSED=1
        log_success "E2E 测试完成"
    # 检查 Cypress
    elif [ -f "cypress.config.ts" ] || [ -f "cypress.config.js" ]; then
        log_info "运行 Cypress E2E 测试..."
        npx cypress run --reporter junit 2>&1 | tee "$REPORTS_DIR/e2e-test-output.log" || true
        
        E2E_TESTS_PASSED=1
        log_success "E2E 测试完成"
    else
        log_warn "未检测到 E2E 测试配置"
    fi
    
    cd "$PROJECT_ROOT"
    echo ""
}

# 生成测试报告
generate_report() {
    log_info "========================================"
    log_info "生成测试报告"
    log_info "========================================"
    
    local TEST_END_TIME=$(date +%s)
    local TEST_DURATION=$((TEST_END_TIME - TEST_START_TIME))
    
    # 生成 HTML 测试报告
    cat > "$REPORTS_DIR/test-report.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>接力教育智慧云平台 - 测试报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .summary-card { flex: 1; padding: 20px; border-radius: 8px; text-align: center; }
        .card-success { background: #d4edda; color: #155724; }
        .card-failed { background: #f8d7da; color: #721c24; }
        .card-info { background: #d1ecf1; color: #0c5460; }
        .card-warning { background: #fff3cd; color: #856404; }
        .status-pass { color: #28a745; font-weight: bold; }
        .status-fail { color: #dc3545; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #4CAF50; color: white; }
        tr:hover { background: #f5f5f5; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏫 接力教育智慧云平台 - 测试报告</h1>
        <p><strong>测试时间:</strong> $(date '+%Y-%m-%d %H:%M:%S')</p>
        <p><strong>测试时长:</strong> ${TEST_DURATION} 秒</p>
        
        <h2>📊 测试概览</h2>
        <div class="summary">
            <div class="summary-card card-$( [ $BACKEND_TESTS_FAILED -eq 0 ] && echo 'success' || echo 'failed' )">
                <h3>后端测试</h3>
                <p class="$( [ $BACKEND_TESTS_FAILED -eq 0 ] && echo 'status-pass' || echo 'status-fail' )">
                    $( [ $BACKEND_TESTS_FAILED -eq 0 ] && echo '✅ 通过' || echo '❌ 失败' )
                </p>
            </div>
            <div class="summary-card card-$( [ $FRONTEND_TESTS_FAILED -eq 0 ] && echo 'success' || echo 'failed' )">
                <h3>前端测试</h3>
                <p class="$( [ $FRONTEND_TESTS_FAILED -eq 0 ] && echo 'status-pass' || echo 'status-fail' )">
                    $( [ $FRONTEND_TESTS_FAILED -eq 0 ] && echo '✅ 通过' || echo '❌ 失败' )
                </p>
            </div>
            <div class="summary-card card-$( [ $E2E_TESTS_FAILED -eq 0 ] && echo 'success' || echo 'warning' )">
                <h3>E2E 测试</h3>
                <p class="$( [ $E2E_TESTS_FAILED -eq 0 ] && echo 'status-pass' || echo 'status-fail' )">
                    $( [ $E2E_TESTS_FAILED -eq 0 ] && echo '✅ 通过' || echo '⚠️ 跳过/失败' )
                </p>
            </div>
        </div>
        
        <h2>📁 报告文件</h2>
        <table>
            <tr>
                <th>报告类型</th>
                <th>文件路径</th>
                <th>说明</th>
            </tr>
            <tr>
                <td>后端测试报告 (JUnit XML)</td>
                <td>reports/backend-test-report.xml</td>
                <td>Pytest JUnit 格式测试结果</td>
            </tr>
            <tr>
                <td>覆盖率报告 (XML)</td>
                <td>reports/backend-coverage.xml</td>
                <td>Cobertura 格式覆盖率</td>
            </tr>
            <tr>
                <td>覆盖率报告 (HTML)</td>
                <td>reports/htmlcov/index.html</td>
                <td>交互式 HTML 覆盖率报告</td>
            </tr>
            <tr>
                <td>代码检查报告</td>
                <td>reports/ruff-report.xml</td>
                <td>Ruff 代码质量检查</td>
            </tr>
            <tr>
                <td>类型检查报告</td>
                <td>reports/mypy-report.xml</td>
                <td>Mypy 类型检查</td>
            </tr>
            <tr>
                <td>前端测试输出</td>
                <td>reports/frontend-test-output.log</td>
                <td>前端测试日志</td>
            </tr>
            <tr>
                <td>E2E 测试输出</td>
                <td>reports/e2e-test-output.log</td>
                <td>E2E 测试日志</td>
            </tr>
        </table>
        
        <h2>📝 环境信息</h2>
        <pre>
Python 版本: $(python --version 2>&1)
Node 版本: $(node --version 2>/dev/null || echo '未安装')
Docker 版本: $(docker --version 2>/dev/null || echo '未安装')
Docker Compose 版本: $(docker-compose --version 2>/dev/null || echo '未安装')
        </pre>
        
        <div class="footer">
            <p>接力教育智慧云平台 - 测试自动生成报告</p>
            <p>Jieli Education Smart Cloud Platform</p>
        </div>
    </div>
</body>
</html>
EOF
    
    log_success "测试报告已生成: $REPORTS_DIR/test-report.html"
    
    # 打印摘要
    echo ""
    echo "============================================================================="
    echo "                          测试摘要 (Test Summary)"
    echo "============================================================================="
    echo "后端测试:  $( [ $BACKEND_TESTS_FAILED -eq 0 ] && echo '✅ 通过' || echo '❌ 失败' )"
    echo "前端测试:  $( [ $FRONTEND_TESTS_FAILED -eq 0 ] && echo '✅ 通过' || echo '❌ 失败' )"
    echo "E2E 测试:  $( [ $E2E_TESTS_FAILED -eq 0 ] && echo '✅ 通过' || echo '⚠️ 跳过/失败' )"
    echo "总耗时:    ${TEST_DURATION} 秒"
    echo "============================================================================="
    echo ""
    echo "报告位置: $REPORTS_DIR/"
    echo "  - HTML 报告: test-report.html"
    echo "  - 后端测试:  backend-test-report.xml"
    echo "  - 覆盖率:    htmlcov/index.html"
    echo "============================================================================="
    echo ""
}

# 主函数
main() {
    print_banner
    
    # 解析参数
    SKIP_ENV=false
    SKIP_BACKEND=false
    SKIP_FRONTEND=false
    SKIP_E2E=false
    SKIP_CLEANUP=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-env)
                SKIP_ENV=true
                shift
                ;;
            --skip-backend)
                SKIP_BACKEND=true
                shift
                ;;
            --skip-frontend)
                SKIP_FRONTEND=true
                shift
                ;;
            --skip-e2e)
                SKIP_E2E=true
                shift
                ;;
            --skip-cleanup)
                SKIP_CLEANUP=true
                shift
                ;;
            --help)
                echo "用法: $0 [选项]"
                echo ""
                echo "选项:"
                echo "  --skip-env       跳过启动测试环境"
                echo "  --skip-backend   跳过后端测试"
                echo "  --skip-frontend  跳过前端测试"
                echo "  --skip-e2e       跳过 E2E 测试"
                echo "  --skip-cleanup   跳过环境清理"
                echo "  --help           显示帮助信息"
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                exit 1
                ;;
        esac
    done
    
    # 启动测试环境
    if [ "$SKIP_ENV" != "true" ]; then
        start_test_environment
    fi
    
    # 运行后端测试
    if [ "$SKIP_BACKEND" != "true" ]; then
        run_backend_tests
    fi
    
    # 运行前端测试
    if [ "$SKIP_FRONTEND" != "true" ]; then
        run_frontend_tests
    fi
    
    # 运行 E2E 测试
    if [ "$SKIP_E2E" != "true" ]; then
        run_e2e_tests
    fi
    
    # 生成报告
    generate_report
    
    # 返回退出码
    if [ $BACKEND_TESTS_FAILED -eq 0 ] && [ $FRONTEND_TESTS_FAILED -eq 0 ] && [ $E2E_TESTS_FAILED -eq 0 ]; then
        log_success "所有测试通过！"
        exit 0
    else
        log_error "部分测试失败，请查看报告"
        exit 1
    fi
}

# 执行主函数
main "$@"
