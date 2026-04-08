#!/bin/bash
# =============================================================================
# 接力教育智慧云平台 - 服务等待脚本
# Jieli Education Smart Cloud Platform - Service Wait Script
# 
# 等待 MySQL 和 Redis 服务就绪
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
MYSQL_HOST="${MYSQL_HOST:-localhost}"
MYSQL_PORT="${MYSQL_PORT:-3307}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-rootpass}"
MYSQL_DATABASE="${MYSQL_DATABASE:-jieli_edu_test}"

REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"

BACKEND_HOST="${BACKEND_HOST:-localhost}"
BACKEND_PORT="${BACKEND_PORT:-8000}"

# 超时设置
TIMEOUT="${TIMEOUT:-120}"
INTERVAL="${INTERVAL:-2}"

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

# 等待 MySQL
wait_for_mysql() {
    log_info "等待 MySQL 服务 ($MYSQL_HOST:$MYSQL_PORT)..."
    
    local start_time=$(date +%s)
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -ge $TIMEOUT ]; then
            log_error "等待 MySQL 超时 (${TIMEOUT}秒)"
            return 1
        fi
        
        # 尝试连接 MySQL
        if mysqladmin ping -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --silent 2>/dev/null; then
            log_success "MySQL 服务已就绪"
            return 0
        fi
        
        # 使用 nc 检查端口
        if command -v nc &> /dev/null; then
            if nc -z "$MYSQL_HOST" "$MYSQL_PORT" 2>/dev/null; then
                # 端口开放，再检查 MySQL 是否接受连接
                if mysqladmin ping -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --silent 2>/dev/null; then
                    log_success "MySQL 服务已就绪"
                    return 0
                fi
            fi
        fi
        
        echo -n "."
        sleep $INTERVAL
    done
}

# 等待 Redis
wait_for_redis() {
    log_info "等待 Redis 服务 ($REDIS_HOST:$REDIS_PORT)..."
    
    local start_time=$(date +%s)
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -ge $TIMEOUT ]; then
            log_error "等待 Redis 超时 (${TIMEOUT}秒)"
            return 1
        fi
        
        # 尝试连接 Redis
        if command -v redis-cli &> /dev/null; then
            if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>/dev/null | grep -q "PONG"; then
                log_success "Redis 服务已就绪"
                return 0
            fi
        fi
        
        # 使用 nc 检查端口
        if command -v nc &> /dev/null; then
            if nc -z "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null; then
                # 端口开放，尝试 PING
                if printf "PING\r\n" | nc -q 1 "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null | grep -q "PONG"; then
                    log_success "Redis 服务已就绪"
                    return 0
                fi
            fi
        fi
        
        echo -n "."
        sleep $INTERVAL
    done
}

# 等待后端服务
wait_for_backend() {
    log_info "等待后端服务 ($BACKEND_HOST:$BACKEND_PORT)..."
    
    local start_time=$(date +%s)
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -ge $TIMEOUT ]; then
            log_error "等待后端服务超时 (${TIMEOUT}秒)"
            return 1
        fi
        
        # 尝试连接后端服务
        if command -v curl &> /dev/null; then
            if curl -s "http://$BACKEND_HOST:$BACKEND_PORT/api/v1/health" 2>/dev/null | grep -q "ok\|healthy"; then
                log_success "后端服务已就绪"
                return 0
            fi
        fi
        
        # 使用 nc 检查端口
        if command -v nc &> /dev/null; then
            if nc -z "$BACKEND_HOST" "$BACKEND_PORT" 2>/dev/null; then
                # 端口开放，尝试 HTTP 请求
                if curl -s "http://$BACKEND_HOST:$BACKEND_PORT/" 2>/dev/null > /dev/null || \
                   curl -s "http://$BACKEND_HOST:$BACKEND_PORT/api/v1/" 2>/dev/null > /dev/null; then
                    log_success "后端服务已就绪"
                    return 0
                fi
            fi
        fi
        
        echo -n "."
        sleep $INTERVAL
    done
}

# 等待前端服务
wait_for_frontend() {
    log_info "等待前端服务 ($FRONTEND_HOST:$FRONTEND_PORT)..."
    
    local start_time=$(date +%s)
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -ge $TIMEOUT ]; then
            log_warn "等待前端服务超时 (${TIMEOUT}秒)，继续执行..."
            return 0
        fi
        
        # 尝试连接前端服务
        if command -v curl &> /dev/null; then
            if curl -s "http://$FRONTEND_HOST:$FRONTEND_PORT" 2>/dev/null > /dev/null; then
                log_success "前端服务已就绪"
                return 0
            fi
        fi
        
        # 使用 nc 检查端口
        if command -v nc &> /dev/null; then
            if nc -z "$FRONTEND_HOST" "$FRONTEND_PORT" 2>/dev/null; then
                log_success "前端服务端口已开放"
                return 0
            fi
        fi
        
        echo -n "."
        sleep $INTERVAL
    done
}

# 显示帮助信息
show_help() {
    cat << EOF
用法: $(basename "$0") [选项]

选项:
    --mysql-only        仅等待 MySQL
    --redis-only        仅等待 Redis
    --backend-only      仅等待后端服务
    --all               等待所有服务 (默认)
    --timeout N         设置超时时间（秒，默认: 120）
    --interval N        设置检查间隔（秒，默认: 2）
    --help              显示帮助信息

环境变量:
    MYSQL_HOST          MySQL 主机 (默认: localhost)
    MYSQL_PORT          MySQL 端口 (默认: 3307)
    MYSQL_USER          MySQL 用户 (默认: root)
    MYSQL_PASSWORD      MySQL 密码 (默认: rootpass)
    REDIS_HOST          Redis 主机 (默认: localhost)
    REDIS_PORT          Redis 端口 (默认: 6379)
    BACKEND_HOST        后端服务主机 (默认: localhost)
    BACKEND_PORT        后端服务端口 (默认: 8000)
    TIMEOUT             超时时间（秒）
    INTERVAL            检查间隔（秒）

示例:
    $(basename "$0")                    # 等待所有服务
    $(basename "$0") --mysql-only       # 仅等待 MySQL
    $(basename "$0") --timeout 60       # 设置 60 秒超时
EOF
}

# 主函数
main() {
    # 默认等待所有服务
    WAIT_MYSQL=true
    WAIT_REDIS=true
    WAIT_BACKEND=true
    WAIT_FRONTEND=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --mysql-only)
                WAIT_MYSQL=true
                WAIT_REDIS=false
                WAIT_BACKEND=false
                WAIT_FRONTEND=false
                shift
                ;;
            --redis-only)
                WAIT_MYSQL=false
                WAIT_REDIS=true
                WAIT_BACKEND=false
                WAIT_FRONTEND=false
                shift
                ;;
            --backend-only)
                WAIT_MYSQL=false
                WAIT_REDIS=false
                WAIT_BACKEND=true
                WAIT_FRONTEND=false
                shift
                ;;
            --all)
                WAIT_MYSQL=true
                WAIT_REDIS=true
                WAIT_BACKEND=true
                WAIT_FRONTEND=false
                shift
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --interval)
                INTERVAL="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    echo ""
    echo "============================================================================="
    echo "    等待服务就绪"
    echo "============================================================================="
    echo ""
    
    local EXIT_CODE=0
    
    # 等待 MySQL
    if [ "$WAIT_MYSQL" = "true" ]; then
        if ! wait_for_mysql; then
            EXIT_CODE=1
        fi
        echo ""
    fi
    
    # 等待 Redis
    if [ "$WAIT_REDIS" = "true" ]; then
        if ! wait_for_redis; then
            EXIT_CODE=1
        fi
        echo ""
    fi
    
    # 等待后端服务
    if [ "$WAIT_BACKEND" = "true" ]; then
        if ! wait_for_backend; then
            EXIT_CODE=1
        fi
        echo ""
    fi
    
    # 等待前端服务
    if [ "$WAIT_FRONTEND" = "true" ]; then
        wait_for_frontend || true
        echo ""
    fi
    
    echo "============================================================================="
    if [ $EXIT_CODE -eq 0 ]; then
        log_success "所有服务已就绪！"
    else
        log_error "部分服务未就绪"
    fi
    echo "============================================================================="
    echo ""
    
    exit $EXIT_CODE
}

# 执行主函数
main "$@"
