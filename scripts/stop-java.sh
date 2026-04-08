#!/bin/bash
# =============================================================
# 接力教育智慧云平台 - Java 后端停止脚本
# =============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 帮助信息
show_help() {
    echo -e "${BLUE}接力教育智慧云平台 - Java 后端停止脚本${NC}"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -v, --volumes   同时删除数据卷（清理所有数据）"
    echo "  -h, --help      显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0              # 停止服务但保留数据"
    echo "  $0 -v           # 停止服务并清理数据"
}

# 解析参数
REMOVE_VOLUMES=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--volumes)
            REMOVE_VOLUMES=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}错误: 未知参数 $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

echo -e "${BLUE}=============================================================${NC}"
echo -e "${BLUE}    接力教育智慧云平台 - Java 后端服务停止${NC}"
echo -e "${BLUE}=============================================================${NC}"
echo ""

# 进入项目目录
cd "$PROJECT_DIR"

# 检查配置文件是否存在
if [ ! -f "backend-java/docker-compose.java.yml" ]; then
    echo -e "${RED}错误: backend-java/docker-compose.java.yml 不存在${NC}"
    exit 1
fi

# 停止服务
echo -e "${YELLOW}[1/2] 正在停止服务...${NC}"
docker-compose -f backend-java/docker-compose.java.yml down

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 服务已停止${NC}"
else
    echo -e "${YELLOW}! 服务停止过程中出现问题${NC}"
fi

# 清理数据卷（如果需要）
if [ "$REMOVE_VOLUMES" = true ]; then
    echo -e "${YELLOW}[2/2] 正在清理数据卷...${NC}"
    docker volume rm jieli_java_mysql_data jieli_java_redis_data jieli_java_logs 2>/dev/null || true
    echo -e "${GREEN}✓ 数据卷已清理${NC}"
else
    echo -e "${YELLOW}[2/2] 保留数据卷（使用 -v 参数清理数据）${NC}"
fi

echo ""
echo -e "${GREEN}=============================================================${NC}"
echo -e "${GREEN}    Java 后端服务已停止${NC}"
echo -e "${GREEN}=============================================================${NC}"
echo ""

if [ "$REMOVE_VOLUMES" = false ]; then
    echo -e "${BLUE}数据保留在 Docker 卷中:${NC}"
    echo -e "  MySQL 数据:  ${YELLOW}jieli_java_mysql_data${NC}"
    echo -e "  Redis 数据:  ${YELLOW}jieli_java_redis_data${NC}"
    echo -e "  应用日志:    ${YELLOW}jieli_java_logs${NC}"
    echo ""
fi

echo -e "${BLUE}重新启动:${NC}"
echo -e "  ${YELLOW}$SCRIPT_DIR/start-java.sh${NC}"
echo ""
