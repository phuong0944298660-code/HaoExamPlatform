#!/bin/bash
# =============================================================================
# 接力教育智慧云平台 - 后端测试运行脚本
# Jieli Education Smart Cloud Platform - Backend Test Runner
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

# 报告目录
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

# 打印横幅
print_banner() {
    echo ""
    echo "============================================================================="
    echo "    后端测试套件 (Backend Test Suite)"
    echo "============================================================================="
    echo ""
}

# 检查 Python 环境
check_python_env() {
    log_info "检查 Python 环境..."
    
    if ! command -v python &> /dev/null; then
        log_error "Python 未安装"
        exit 1
    fi
    
    PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
    log_info "Python 版本: $PYTHON_VERSION"
    
    # 检查是否在虚拟环境中
    if [ -z "$VIRTUAL_ENV" ]; then
        log_warn "未检测到虚拟环境，建议使用虚拟环境"
        log_info "创建虚拟环境: python -m venv venv"
        log_info "激活虚拟环境: source venv/bin/activate"
    else
        log_info "虚拟环境: $VIRTUAL_ENV"
    fi
}

# 安装依赖
install_dependencies() {
    log_info "安装依赖..."
    
    # 安装项目依赖
    pip install -q -e . 2>/dev/null || pip install -q -r requirements.txt
    
    # 安装测试依赖
    pip install -q pytest pytest-asyncio pytest-cov httpx ruff mypy pytest-xdist
    
    log_success "依赖安装完成"
}

# 运行代码检查
run_lint() {
    log_info "========================================"
    log_info "运行代码检查 (Code Linting)"
    log_info "========================================"
    
    # Ruff 检查
    log_info "运行 Ruff 代码检查..."
    if ruff check app/ tests/ --output-format=text 2>&1 | tee "$REPORTS_DIR/ruff-output.txt"; then
        log_success "Ruff 检查通过"
    else
        log_warn "Ruff 发现代码问题"
    fi
    
    # 生成 JUnit XML 报告
    ruff check app/ tests/ --output-format=junit > "$REPORTS_DIR/ruff-report.xml" 2>/dev/null || true
    
    echo ""
}

# 运行类型检查
run_type_check() {
    log_info "========================================"
    log_info "运行类型检查 (Type Checking)"
    log_info "========================================"
    
    log_info "运行 Mypy 类型检查..."
    if mypy app/ --ignore-missing-imports --show-error-codes 2>&1 | tee "$REPORTS_DIR/mypy-output.txt"; then
        log_success "类型检查通过"
    else
        log_warn "发现类型问题"
    fi
    
    # 尝试生成 JUnit 报告
    mypy app/ --ignore-missing-imports --junit-xml "$REPORTS_DIR/mypy-report.xml" 2>/dev/null || true
    
    echo ""
}

# 运行单元测试
run_unit_tests() {
    log_info "========================================"
    log_info "运行单元测试 (Unit Tests)"
    log_info "========================================"
    
    local test_args=""
    local coverage_args=""
    
    # 解析参数
    if [ "$VERBOSE" = "true" ]; then
        test_args="$test_args -v"
    fi
    
    if [ "$FAILFAST" = "true" ]; then
        test_args="$test_args -x"
    fi
    
    if [ -n "$TEST_PATH" ]; then
        test_args="$test_args $TEST_PATH"
    else
        test_args="$test_args tests/"
    fi
    
    # 覆盖率参数
    if [ "$COVERAGE" != "false" ]; then
        coverage_args="--cov=app --cov-report=xml:$REPORTS_DIR/backend-coverage.xml --cov-report=html:$REPORTS_DIR/htmlcov --cov-report=term"
    fi
    
    log_info "运行 pytest..."
    if python -m pytest \
        $test_args \
        --tb=short \
        --junitxml="$REPORTS_DIR/backend-test-report.xml" \
        $coverage_args \
        2>&1 | tee "$REPORTS_DIR/backend-test-output.log"; then
        
        log_success "单元测试通过"
        return 0
    else
        log_error "单元测试失败"
        return 1
    fi
}

# 运行特定测试
run_specific_test() {
    local test_path=$1
    log_info "运行特定测试: $test_path"
    
    python -m pytest "$test_path" -v --tb=short
}

# 显示帮助信息
show_help() {
    cat << EOF
用法: $(basename "$0") [选项] [测试路径]

选项:
    -v, --verbose       显示详细输出
    -x, --failfast      遇到第一个失败时停止
    --no-coverage       不生成覆盖率报告
    --lint-only         仅运行代码检查
    --type-check-only   仅运行类型检查
    --unit-only         仅运行单元测试
    --help              显示帮助信息

示例:
    $(basename "$0")                          # 运行所有后端测试
    $(basename "$0") tests/test_accounts.py   # 运行特定测试文件
    $(basename "$0") -v                       # 详细输出
    $(basename "$0") --lint-only              # 仅运行代码检查
EOF
}

# 主函数
main() {
    print_banner
    
    # 默认配置
    VERBOSE=false
    FAILFAST=false
    COVERAGE=true
    RUN_LINT=true
    RUN_TYPE_CHECK=true
    RUN_UNIT=true
    TEST_PATH=""
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -x|--failfast)
                FAILFAST=true
                shift
                ;;
            --no-coverage)
                COVERAGE=false
                shift
                ;;
            --lint-only)
                RUN_TYPE_CHECK=false
                RUN_UNIT=false
                shift
                ;;
            --type-check-only)
                RUN_LINT=false
                RUN_UNIT=false
                shift
                ;;
            --unit-only)
                RUN_LINT=false
                RUN_TYPE_CHECK=false
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
    check_python_env
    
    # 安装依赖
    install_dependencies
    
    # 创建测试数据库
    log_info "设置测试数据库..."
    python scripts/setup_test_data.py --test-env 2>/dev/null || log_warn "测试数据设置脚本运行失败"
    
    # 运行代码检查
    if [ "$RUN_LINT" = "true" ]; then
        run_lint
    fi
    
    # 运行类型检查
    if [ "$RUN_TYPE_CHECK" = "true" ]; then
        run_type_check
    fi
    
    # 运行单元测试
    if [ "$RUN_UNIT" = "true" ]; then
        run_unit_tests
        TEST_EXIT_CODE=$?
    fi
    
    # 生成摘要
    echo ""
    echo "============================================================================="
    echo "                          测试摘要 (Test Summary)"
    echo "============================================================================="
    echo "代码检查报告:  $REPORTS_DIR/ruff-report.xml"
    echo "类型检查报告:  $REPORTS_DIR/mypy-report.xml"
    echo "测试报告:      $REPORTS_DIR/backend-test-report.xml"
    echo "覆盖率报告:    $REPORTS_DIR/htmlcov/index.html"
    echo "============================================================================="
    echo ""
    
    exit ${TEST_EXIT_CODE:-0}
}

# 执行主函数
main "$@"
