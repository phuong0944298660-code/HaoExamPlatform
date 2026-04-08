#!/bin/bash
# API健康检查脚本

BASE_URL="http://localhost:8083/api/v1"
FRONTEND_URL="http://localhost:5173"
REPORT_FILE="api-test-report.txt"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 初始化报告
echo "=== 考试系统API健康检查报告 ===" > $REPORT_FILE
echo "测试时间: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# 统计变量
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_api() {
    local method=$1
    local endpoint=$2
    local expected_code=$3
    local auth_header=$4
    local description=$5

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [ -n "$auth_header" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" -H "Authorization: Bearer $auth_header" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" 2>/dev/null)
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓${NC} $description ($method $endpoint) - HTTP $http_code"
        echo "✓ $description ($method $endpoint) - HTTP $http_code" >> $REPORT_FILE
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $description ($method $endpoint) - 期望 $expected_code, 实际 $http_code"
        echo "✗ $description ($method $endpoint) - 期望 $expected_code, 实际 $http_code" >> $REPORT_FILE
        if [ -n "$body" ]; then
            echo "  响应: $body" >> $REPORT_FILE
        fi
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo "=== 开始API健康检查 ==="
echo ""

# Phase 1: 公开API测试
echo "【Phase 1: 公开API测试】"
echo "" >> $REPORT_FILE
echo "=== Phase 1: 公开API测试 ===" >> $REPORT_FILE

test_api "GET" "/health" "200" "" "健康检查"
test_api "POST" "/accounts/login" "400" "" "登录接口(无参数)"

# 获取Token进行后续测试
echo ""
echo "获取管理员Token..."
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/accounts/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')
ADMIN_TOKEN=$(echo $LOGIN_RESP | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}✓${NC} 管理员登录成功"
    echo "✓ 管理员登录成功" >> $REPORT_FILE
else
    echo -e "${RED}✗${NC} 管理员登录失败"
    echo "✗ 管理员登录失败: $LOGIN_RESP" >> $REPORT_FILE
    echo "无法继续测试，退出"
    exit 1
fi

# 教师Token
echo "获取教师Token..."
TEACHER_LOGIN=$(curl -s -X POST "$BASE_URL/accounts/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"teacher","password":"teacher123"}')
TEACHER_TOKEN=$(echo $TEACHER_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TEACHER_TOKEN" ]; then
    echo -e "${GREEN}✓${NC} 教师登录成功"
    echo "✓ 教师登录成功" >> $REPORT_FILE
else
    echo -e "${YELLOW}!${NC} 教师登录失败 (可能未创建教师账户)"
    echo "! 教师登录失败: $TEACHER_LOGIN" >> $REPORT_FILE
fi

# 学生Token
echo "获取学生Token..."
STUDENT_LOGIN=$(curl -s -X POST "$BASE_URL/accounts/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"student","password":"student123"}')
STUDENT_TOKEN=$(echo $STUDENT_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$STUDENT_TOKEN" ]; then
    echo -e "${GREEN}✓${NC} 学生登录成功"
    echo "✓ 学生登录成功" >> $REPORT_FILE
else
    echo -e "${YELLOW}!${NC} 学生登录失败 (可能未创建学生账户)"
    echo "! 学生登录失败: $STUDENT_LOGIN" >> $REPORT_FILE
fi

# Phase 2: 管理员API测试
echo ""
echo "【Phase 2: 管理员API测试】"
echo "" >> $REPORT_FILE
echo "=== Phase 2: 管理员API测试 ===" >> $REPORT_FILE

test_api "GET" "/accounts" "200" "$ADMIN_TOKEN" "获取账号列表"
test_api "GET" "/accounts/schools" "200" "$ADMIN_TOKEN" "获取学校列表"
test_api "GET" "/question-banks" "200" "$ADMIN_TOKEN" "获取题库列表"
test_api "GET" "/questions" "200" "$ADMIN_TOKEN" "获取题目列表"
test_api "GET" "/papers" "200" "$ADMIN_TOKEN" "获取试卷列表"
test_api "GET" "/exams" "200" "$ADMIN_TOKEN" "获取考试列表"
test_api "GET" "/scores" "200" "$ADMIN_TOKEN" "获取成绩列表"
test_api "GET" "/dashboard/stats" "200" "$ADMIN_TOKEN" "获取仪表盘统计"

# Phase 3: 系统管理API测试
echo ""
echo "【Phase 3: 系统管理API测试】"
echo "" >> $REPORT_FILE
echo "=== Phase 3: 系统管理API测试 ===" >> $REPORT_FILE

test_api "GET" "/system/menus" "200" "$ADMIN_TOKEN" "获取菜单列表"
test_api "GET" "/system/menus/nav" "200" "$ADMIN_TOKEN" "获取导航菜单"
test_api "GET" "/system/roles" "200" "$ADMIN_TOKEN" "获取角色列表"
test_api "GET" "/system/users" "200" "$ADMIN_TOKEN" "获取用户列表"

# Phase 4: 教师API测试（如果有教师Token）
if [ -n "$TEACHER_TOKEN" ]; then
    echo ""
    echo "【Phase 4: 教师API测试】"
    echo "" >> $REPORT_FILE
    echo "=== Phase 4: 教师API测试 ===" >> $REPORT_FILE

    test_api "GET" "/classes" "200" "$TEACHER_TOKEN" "获取班级列表"
    test_api "GET" "/question-banks" "200" "$TEACHER_TOKEN" "教师获取题库"
fi

# Phase 5: 学生API测试（如果有学生Token）
if [ -n "$STUDENT_TOKEN" ]; then
    echo ""
    echo "【Phase 5: 学生API测试】"
    echo "" >> $REPORT_FILE
    echo "=== Phase 5: 学生API测试 ===" >> $REPORT_FILE

    test_api "GET" "/practice/banks" "200" "$STUDENT_TOKEN" "获取练习题库"
fi

# 生成报告摘要
echo ""
echo "【测试摘要】"
echo "=================="
echo "总测试数: $TOTAL_TESTS"
echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败: ${RED}$FAILED_TESTS${NC}"
echo "通过率: $((PASSED_TESTS * 100 / TOTAL_TESTS))%"
echo ""

echo "" >> $REPORT_FILE
echo "=== 测试摘要 ===" >> $REPORT_FILE
echo "总测试数: $TOTAL_TESTS" >> $REPORT_FILE
echo "通过: $PASSED_TESTS" >> $REPORT_FILE
echo "失败: $FAILED_TESTS" >> $REPORT_FILE
echo "通过率: $((PASSED_TESTS * 100 / TOTAL_TESTS))%" >> $REPORT_FILE

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}所有API测试通过!${NC}"
    echo "所有API测试通过!" >> $REPORT_FILE
    exit 0
else
    echo -e "${RED}发现 $FAILED_TESTS 个失败的API测试${NC}"
    echo "发现 $FAILED_TESTS 个失败的API测试" >> $REPORT_FILE
    exit 1
fi
