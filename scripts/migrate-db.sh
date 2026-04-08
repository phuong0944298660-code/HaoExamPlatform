#!/bin/bash
# =============================================================
# 接力教育智慧云平台 - 数据库迁移脚本
# 支持：Flyway、Liquibase、原生 SQL 脚本
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

# 默认配置
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="jieli_edu"
DB_USER="root"
DB_PASS="rootpass"
ACTION="migrate"

# 帮助信息
show_help() {
    echo -e "${BLUE}接力教育智慧云平台 - 数据库迁移脚本${NC}"
    echo ""
    echo "用法: $0 [选项] [命令]"
    echo ""
    echo "命令:"
    echo "  migrate         执行数据库迁移（默认）"
    echo "  validate        验证迁移脚本"
    echo "  info            显示迁移信息"
    echo "  baseline        设置基线版本"
    echo "  repair          修复迁移元数据"
    echo "  clean           清理数据库（危险操作！）"
    echo "  reset           重置数据库（清理+重新迁移）"
    echo "  export          导出数据库结构"
    echo "  import          导入初始数据"
    echo ""
    echo "选项:"
    echo "  -h, --host      数据库主机（默认: localhost）"
    echo "  -P, --port      数据库端口（默认: 3306）"
    echo "  -d, --database  数据库名称（默认: jieli_edu）"
    echo "  -u, --user      数据库用户（默认: root）"
    echo "  -p, --password  数据库密码（默认: rootpass）"
    echo "  --help          显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                          # 执行默认迁移"
    echo "  $0 migrate                  # 执行数据库迁移"
    echo "  $0 reset                    # 重置数据库"
    echo "  $0 -h mysql -p secret info  # 指定连接信息"
}

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            DB_HOST="$2"
            shift 2
            ;;
        -P|--port)
            DB_PORT="$2"
            shift 2
            ;;
        -d|--database)
            DB_NAME="$2"
            shift 2
            ;;
        -u|--user)
            DB_USER="$2"
            shift 2
            ;;
        -p|--password)
            DB_PASS="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        migrate|validate|info|baseline|repair|clean|reset|export|import)
            ACTION="$1"
            shift
            ;;
        *)
            echo -e "${RED}错误: 未知参数 $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

echo -e "${BLUE}=============================================================${NC}"
echo -e "${BLUE}    接力教育智慧云平台 - 数据库迁移${NC}"
echo -e "${BLUE}=============================================================${NC}"
echo ""
echo -e "${BLUE}数据库配置:${NC}"
echo -e "  主机:     ${YELLOW}$DB_HOST:$DB_PORT${NC}"
echo -e "  数据库:   ${YELLOW}$DB_NAME${NC}"
echo -e "  用户:     ${YELLOW}$DB_USER${NC}"
echo -e "  操作:     ${YELLOW}$ACTION${NC}"
echo ""

# 检查 MySQL 连接
check_mysql_connection() {
    echo -e "${YELLOW}[1/3] 检查数据库连接...${NC}"
    
    # 检查是否在 Docker 环境中运行
    if docker ps | grep -q "jieli-mysql"; then
        echo -e "${GREEN}✓ MySQL Docker 容器正在运行${NC}"
        # 使用 Docker 执行 MySQL 命令
        MYSQL_CMD="docker exec -i jieli-mysql mysql -u$DB_USER -p$DB_PASS"
    else
        # 检查本地 MySQL 客户端
        if ! command -v mysql &> /dev/null; then
            echo -e "${RED}错误: MySQL 客户端未安装${NC}"
            exit 1
        fi
        MYSQL_CMD="mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASS"
    fi
    
    # 测试连接
    if $MYSQL_CMD -e "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 数据库连接成功${NC}"
    else
        echo -e "${RED}✗ 无法连接到数据库${NC}"
        echo -e "${YELLOW}请检查:"
        echo -e "  - 数据库服务是否启动"
        echo -e "  - 连接参数是否正确"
        echo -e "  - 网络是否可达${NC}"
        exit 1
    fi
}

# 创建数据库（如果不存在）
create_database() {
    echo -e "${YELLOW}[2/3] 检查数据库...${NC}"
    
    DB_EXISTS=$($MYSQL_CMD -e "SHOW DATABASES LIKE '$DB_NAME'" 2>/dev/null | grep -c "$DB_NAME" || true)
    
    if [ "$DB_EXISTS" -eq 0 ]; then
        echo -e "${YELLOW}数据库 $DB_NAME 不存在，正在创建...${NC}"
        $MYSQL_CMD -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        echo -e "${GREEN}✓ 数据库创建成功${NC}"
    else
        echo -e "${GREEN}✓ 数据库已存在${NC}"
    fi
}

# 执行迁移
execute_migration() {
    echo -e "${YELLOW}[3/3] 执行数据库操作: $ACTION${NC}"
    
    case $ACTION in
        migrate)
            # 检查是否有 Flyway/Liquibase 配置
            if [ -f "$BACKEND_DIR/pom.xml" ] && grep -q "flyway" "$BACKEND_DIR/pom.xml" 2>/dev/null; then
                echo -e "${BLUE}使用 Flyway 执行迁移...${NC}"
                cd "$BACKEND_DIR"
                mvn flyway:migrate -Dflyway.url=jdbc:mysql://$DB_HOST:$DB_PORT/$DB_NAME \
                                   -Dflyway.user=$DB_USER \
                                   -Dflyway.password=$DB_PASS
            elif [ -f "$BACKEND_DIR/pom.xml" ] && grep -q "liquibase" "$BACKEND_DIR/pom.xml" 2>/dev/null; then
                echo -e "${BLUE}使用 Liquibase 执行迁移...${NC}"
                cd "$BACKEND_DIR"
                mvn liquibase:update \
                    -Dliquibase.url=jdbc:mysql://$DB_HOST:$DB_PORT/$DB_NAME \
                    -Dliquibase.username=$DB_USER \
                    -Dliquibase.password=$DB_PASS
            else
                echo -e "${BLUE}执行 SQL 脚本...${NC}"
                execute_sql_scripts
            fi
            ;;
            
        validate)
            echo -e "${BLUE}验证数据库结构...${NC}"
            $MYSQL_CMD $DB_NAME -e "SHOW TABLES;"
            ;;
            
        info)
            echo -e "${BLUE}数据库信息:${NC}"
            echo -e "\n${YELLOW}表列表:${NC}"
            $MYSQL_CMD $DB_NAME -e "SHOW TABLE STATUS;"
            ;;
            
        clean)
            echo -e "${RED}警告: 这将删除数据库 $DB_NAME 中的所有数据！${NC}"
            read -p "确定要继续吗? (yes/no): " confirm
            if [ "$confirm" = "yes" ]; then
                $MYSQL_CMD -e "DROP DATABASE IF EXISTS $DB_NAME;"
                echo -e "${GREEN}✓ 数据库已清理${NC}"
            else
                echo -e "${YELLOW}操作已取消${NC}"
            fi
            ;;
            
        reset)
            echo -e "${RED}警告: 这将重置数据库 $DB_NAME！${NC}"
            read -p "确定要继续吗? (yes/no): " confirm
            if [ "$confirm" = "yes" ]; then
                $MYSQL_CMD -e "DROP DATABASE IF EXISTS $DB_NAME;"
                $MYSQL_CMD -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
                execute_sql_scripts
                echo -e "${GREEN}✓ 数据库已重置${NC}"
            else
                echo -e "${YELLOW}操作已取消${NC}"
            fi
            ;;
            
        export)
            echo -e "${BLUE}导出数据库结构...${NC}"
            mysqldump -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASS --no-data $DB_NAME > "$PROJECT_DIR/db_schema_$(date +%Y%m%d).sql"
            echo -e "${GREEN}✓ 结构已导出到 db_schema_$(date +%Y%m%d).sql${NC}"
            ;;
            
        import)
            echo -e "${BLUE}导入初始数据...${NC}"
            if [ -f "$BACKEND_DIR/scripts/init.sql" ]; then
                $MYSQL_CMD $DB_NAME < "$BACKEND_DIR/scripts/init.sql"
                echo -e "${GREEN}✓ 初始数据导入成功${NC}"
            else
                echo -e "${YELLOW}警告: 未找到 init.sql 文件${NC}"
            fi
            ;;
            
        *)
            echo -e "${RED}错误: 未知操作 $ACTION${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 执行 SQL 脚本
execute_sql_scripts() {
    SQL_DIR="$BACKEND_DIR/src/main/resources/db/migration"
    
    if [ -d "$SQL_DIR" ]; then
        echo -e "${BLUE}执行迁移脚本...${NC}"
        for sql_file in $(ls -v "$SQL_DIR"/*.sql 2>/dev/null); do
            echo -e "  执行: ${YELLOW}$(basename $sql_file)${NC}"
            $MYSQL_CMD $DB_NAME < "$sql_file"
        done
        echo -e "${GREEN}✓ SQL 脚本执行完成${NC}"
    else
        echo -e "${YELLOW}警告: 未找到 SQL 迁移目录${NC}"
    fi
}

# 主流程
check_mysql_connection
create_database
execute_migration

echo ""
echo -e "${GREEN}=============================================================${NC}"
echo -e "${GREEN}    数据库操作完成${NC}"
echo -e "${GREEN}=============================================================${NC}"
echo ""
