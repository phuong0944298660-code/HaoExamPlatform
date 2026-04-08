#!/bin/bash
# =============================================================
# 接力教育智慧云平台 - Java 后端构建脚本
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
BACKEND_DIR="$PROJECT_DIR/backend-java"

# 构建模式
SKIP_TESTS=false
DOCKER_BUILD=false
CLEAN=false

# 帮助信息
show_help() {
    echo -e "${BLUE}接力教育智慧云平台 - Java 后端构建脚本${NC}"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -s, --skip-tests    跳过单元测试"
    echo "  -d, --docker        构建 Docker 镜像"
    echo "  -c, --clean         清理并重新构建"
    echo "  -a, --all           执行完整构建（清理+构建+Docker镜像）"
    echo "  -h, --help          显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                  # 本地构建"
    echo "  $0 -s               # 跳过测试构建"
    echo "  $0 -d               # 构建 Docker 镜像"
    echo "  $0 -a               # 完整构建流程"
}

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -d|--docker)
            DOCKER_BUILD=true
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -a|--all)
            SKIP_TESTS=true
            DOCKER_BUILD=true
            CLEAN=true
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
echo -e "${BLUE}    接力教育智慧云平台 - Java 后端构建${NC}"
echo -e "${BLUE}=============================================================${NC}"
echo ""

# 检查后端目录
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}错误: 后端目录不存在 $BACKEND_DIR${NC}"
    exit 1
fi

# 检查 Maven
if ! command -v mvn &> /dev/null; then
    echo -e "${YELLOW}警告: Maven 未安装，尝试使用 Docker 构建...${NC}"
    DOCKER_BUILD=true
fi

cd "$BACKEND_DIR"

# 清理操作
if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}[1/4] 清理构建目录...${NC}"
    rm -rf target/
    if command -v mvn &> /dev/null; then
        mvn clean -q
    fi
    echo -e "${GREEN}✓ 清理完成${NC}"
else
    echo -e "${YELLOW}[1/4] 跳过清理步骤${NC}"
fi

# 本地 Maven 构建
if command -v mvn &> /dev/null; then
    echo -e "${YELLOW}[2/4] 执行 Maven 构建...${NC}"
    
    MVN_CMD="mvn clean package"
    
    if [ "$SKIP_TESTS" = true ]; then
        MVN_CMD="$MVN_CMD -DskipTests"
        echo -e "${BLUE}模式: 跳过测试${NC}"
    fi
    
    $MVN_CMD -B
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Maven 构建成功${NC}"
    else
        echo -e "${RED}✗ Maven 构建失败${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}[2/4] 跳过本地 Maven 构建${NC}"
fi

# Docker 构建
echo -e "${YELLOW}[3/4] 构建 Docker 镜像...${NC}"
cd "$PROJECT_DIR"

if [ "$DOCKER_BUILD" = true ]; then
    docker-compose -f backend-java/docker-compose.java.yml build --no-cache
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Docker 镜像构建成功${NC}"
    else
        echo -e "${RED}✗ Docker 镜像构建失败${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}跳过 Docker 构建（使用 -d 参数构建镜像）${NC}"
fi

# 构建结果
echo -e "${YELLOW}[4/4] 检查构建产物...${NC}"
if [ -f "$BACKEND_DIR/target/*.jar" ]; then
    JAR_FILE=$(ls -t $BACKEND_DIR/target/*.jar | head -1)
    JAR_SIZE=$(du -h "$JAR_FILE" | cut -f1)
    echo -e "${GREEN}✓ 构建产物: $JAR_FILE (${JAR_SIZE})${NC}"
fi

echo ""
echo -e "${GREEN}=============================================================${NC}"
echo -e "${GREEN}    Java 后端构建完成${NC}"
echo -e "${GREEN}=============================================================${NC}"
echo ""
echo -e "${BLUE}后续操作:${NC}"
echo -e "  启动服务:    ${YELLOW}$SCRIPT_DIR/start-java.sh${NC}"
echo -e "  停止服务:    ${YELLOW}$SCRIPT_DIR/stop-java.sh${NC}"
echo -e "  数据库迁移:  ${YELLOW}$SCRIPT_DIR/migrate-db.sh${NC}"
echo ""
