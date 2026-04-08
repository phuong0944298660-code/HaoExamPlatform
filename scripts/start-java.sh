#!/bin/bash
# =============================================================
# 接力教育智慧云平台 - Java 后端启动脚本
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

# 默认环境
ENV="prod"
BUILD=false

# 帮助信息
show_help() {
    echo -e "${BLUE}接力教育智慧云平台 - Java 后端启动脚本${NC}"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -e, --env       指定环境 (prod/dev/test, 默认: prod)"
    echo "  -b, --build     启动前重新构建镜像"
    echo "  -h, --help      显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 以生产环境启动"
    echo "  $0 -e dev             # 以开发环境启动"
    echo "  $0 -b                 # 重新构建并启动"
    echo "  $0 -e dev -b          # 开发环境重新构建并启动"
}

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENV="$2"
            shift 2
            ;;
        -b|--build)
            BUILD=true
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
echo -e "${BLUE}    接力教育智慧云平台 - Java 后端服务启动${NC}"
echo -e "${BLUE}=============================================================${NC}"
echo ""

# 检查 Docker 和 Docker Compose
echo -e "${YELLOW}[1/5] 检查 Docker 环境...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误: Docker Compose 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker 环境检查通过${NC}"

# 进入项目目录
cd "$PROJECT_DIR"

# 检查必要的配置文件
echo -e "${YELLOW}[2/5] 检查配置文件...${NC}"
if [ ! -f "backend-java/docker-compose.java.yml" ]; then
    echo -e "${RED}错误: backend-java/docker-compose.java.yml 不存在${NC}"
    exit 1
fi

if [ ! -f "nginx-java.conf" ]; then
    echo -e "${RED}错误: nginx-java.conf 不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 配置文件检查通过${NC}"

# 创建必要的目录
echo -e "${YELLOW}[3/5] 创建必要的目录...${NC}"
mkdir -p uploads
mkdir -p backend-java/logs
mkdir -p frontend/dist
echo -e "${GREEN}✓ 目录创建完成${NC}"

# 构建镜像（如果需要）
if [ "$BUILD" = true ]; then
    echo -e "${YELLOW}[4/5] 构建 Docker 镜像...${NC}"
    docker-compose -f backend-java/docker-compose.java.yml build --no-cache
    echo -e "${GREEN}✓ 镜像构建完成${NC}"
else
    echo -e "${YELLOW}[4/5] 跳过构建步骤（使用 -b 参数强制重新构建）${NC}"
fi

# 启动服务
echo -e "${YELLOW}[5/5] 启动服务...${NC}"
echo -e "${BLUE}环境: $ENV${NC}"
echo ""

# 设置环境变量
export SPRING_PROFILES_ACTIVE=$ENV

# 启动服务
docker-compose -f backend-java/docker-compose.java.yml up -d

echo ""
echo -e "${GREEN}=============================================================${NC}"
echo -e "${GREEN}    服务启动成功！${NC}"
echo -e "${GREEN}=============================================================${NC}"
echo ""
echo -e "${BLUE}访问地址:${NC}"
echo -e "  前端应用:    ${YELLOW}http://localhost${NC}"
echo -e "  Java API:    ${YELLOW}http://localhost:8080/api/v1${NC}"
echo -e "  健康检查:    ${YELLOW}http://localhost/api/v1/health${NC}"
echo ""
echo -e "${BLUE}常用命令:${NC}"
echo -e "  查看日志:    ${YELLOW}docker logs -f jieli-backend-java${NC}"
echo -e "  停止服务:    ${YELLOW}$SCRIPT_DIR/stop-java.sh${NC}"
echo -e "  重启服务:    ${YELLOW}docker-compose -f backend-java/docker-compose.java.yml restart${NC}"
echo ""
echo -e "${BLUE}等待服务启动完成...${NC}"
sleep 5

# 检查服务健康状态
echo -e "${YELLOW}检查服务健康状态...${NC}"
if curl -sf http://localhost/api/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Java 后端服务运行正常${NC}"
else
    echo -e "${YELLOW}! 服务正在启动中，请稍后检查日志${NC}"
    echo -e "${YELLOW}  运行: docker logs -f jieli-backend-java${NC}"
fi
