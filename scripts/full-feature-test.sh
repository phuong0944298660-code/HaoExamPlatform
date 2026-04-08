#!/bin/bash
# 全功能自动化测试脚本

BASE_URL="http://localhost:8083/api/v1"
FRONTEND_URL="http://localhost:5173"

echo "======================================"
echo "  考试系统全功能自动化测试"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 统计变量
TOTAL=0
PASSED=0
FAILED=0

# 测试函数
run_test() {
    local test_name=$1
    local test_cmd=$2

    TOTAL=$((TOTAL + 1))
    echo -e "${BLUE}[测试 $TOTAL]${NC} $test_name"

    if eval "$test_cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ 通过${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}  ✗ 失败${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# ==================== Phase 1: 基础设施测试 ====================
echo -e "\n${YELLOW}▶ Phase 1: 基础设施测试${NC}"
echo "--------------------------------------"

run_test "后端健康检查" "curl -s $BASE_URL/health | grep -q 'OK'"
run_test "前端服务可用" "curl -s $FRONTEND_URL | grep -q 'doctype html'"
run_test "API文档可用" "curl -s $BASE_URL/swagger-ui.html | grep -q 'swagger'"

# ==================== Phase 2: 认证系统测试 ====================
echo -e "\n${YELLOW}▶ Phase 2: 认证系统测试${NC}"
echo "--------------------------------------"

# 管理员登录
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/accounts/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}  ✓${NC} 管理员登录成功"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}  ✗${NC} 管理员登录失败"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# 教师登录
TEACHER_LOGIN=$(curl -s -X POST "$BASE_URL/accounts/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"teacher2","password":"teacher123"}')
TEACHER_TOKEN=$(echo $TEACHER_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TEACHER_TOKEN" ]; then
    echo -e "${GREEN}  ✓${NC} 教师登录成功"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}  ✗${NC} 教师登录失败"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# 无效登录测试
run_test "无效密码拒绝" "curl -s -X POST '$BASE_URL/accounts/login' -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"wrong\"}' | grep -q '400'"

# ==================== Phase 3: 账号管理测试 ====================
echo -e "\n${YELLOW}▶ Phase 3: 账号管理测试${NC}"
echo "--------------------------------------"

run_test "获取账号列表" "curl -s '$BASE_URL/accounts?page=1&size=10' -H 'Authorization: Bearer $ADMIN_TOKEN' | grep -q '200'"
run_test "获取学校列表" "curl -s '$BASE_URL/accounts/schools' -H 'Authorization: Bearer $ADMIN_TOKEN' | grep -q '200'"

# 创建新教师
NEW_TEACHER=$(curl -s -X POST "$BASE_URL/accounts" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"username":"autoteacher","password":"teacher123","name":"Auto Teacher","role":"TEACHER","account_type":"PRACTICE","grade_group":"JUNIOR"}')

if echo "$NEW_TEACHER" | grep -q '"code":200'; then
    echo -e "${GREEN}  ✓${NC} 创建教师账号成功"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}  ✗${NC} 创建教师账号失败: $(echo $NEW_TEACHER | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# ==================== Phase 4: 题库管理测试 ====================
echo -e "\n${YELLOW}▶ Phase 4: 题库管理测试${NC}"
echo "--------------------------------------"

run_test "获取题库列表" "curl -s '$BASE_URL/question-banks' -H 'Authorization: Bearer $ADMIN_TOKEN' | grep -q '200'"

# 创建题库
NEW_BANK=$(curl -s -X POST "$BASE_URL/question-banks" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"name":"自动化测试题库","grade_group":"JUNIOR","description":"用于自动化测试的题库"}')

BANK_ID=$(echo $NEW_BANK | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$BANK_ID" ]; then
    echo -e "${GREEN}  ✓${NC} 创建题库成功 (ID: $BANK_ID)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}  ✗${NC} 创建题库失败"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# 创建题目
if [ -n "$BANK_ID" ]; then
    NEW_QUESTION=$(curl -s -X POST "$BASE_URL/questions" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "{\"question_bank_id\":$BANK_ID,\"question_type\":\"single_choice\",\"content\":\"测试题目 \$x^2\$\",\"options\":[{\"label\":\"A\",\"content\":\"选项1 \$\\sqrt{2}\$\"},{\"label\":\"B\",\"content\":\"选项2\"}],\"correct_answer\":\"A\",\"default_score\":3}")

    if echo "$NEW_QUESTION" | grep -q '"code":200'; then
        echo -e "${GREEN}  ✓${NC} 创建题目成功 (支持LaTeX公式)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}  ✗${NC} 创建题目失败"
        FAILED=$((FAILED + 1))
    fi
    TOTAL=$((TOTAL + 1))
fi

run_test "获取题目列表" "curl -s '$BASE_URL/questions' -H 'Authorization: Bearer $ADMIN_TOKEN' | grep -q '200'"

# ==================== Phase 5: 试卷管理测试 ====================
echo -e "\n${YELLOW}▶ Phase 5: 试卷管理测试${NC}"
echo "--------------------------------------"

run_test "获取试卷列表" "curl -s '$BASE_URL/papers' -H 'Authorization: Bearer $ADMIN_TOKEN' | grep -q '200'"

# 创建试卷
NEW_PAPER=$(curl -s -X POST "$BASE_URL/papers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"name":"自动化测试试卷","grade_group":"JUNIOR","description":"测试用试卷","total_score":100,"duration":60}')

PAPER_ID=$(echo $NEW_PAPER | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$PAPER_ID" ]; then
    echo -e "${GREEN}  ✓${NC} 创建试卷成功 (ID: $PAPER_ID)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}  ✗${NC} 创建试卷失败"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# ==================== Phase 6: 考试管理测试 ====================
echo -e "\n${YELLOW}▶ Phase 6: 考试管理测试${NC}"
echo "--------------------------------------"

run_test "获取考试列表" "curl -s '$BASE_URL/exams' -H 'Authorization: Bearer $ADMIN_TOKEN' | grep -q '200'"

# 创建考试
if [ -n "$PAPER_ID" ]; then
    NEW_EXAM=$(curl -s -X POST "$BASE_URL/exams" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "{\"name\":\"自动化测试考试\",\"paper_id\":$PAPER_ID,\"start_time\":\"2026-04-03T16:00:00\",\"end_time\":\"2026-04-03T18:00:00\",\"duration\":60,\"max_screen_switches\":3}")

    EXAM_ID=$(echo $NEW_EXAM | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

    if [ -n "$EXAM_ID" ]; then
        echo -e "${GREEN}  ✓${NC} 创建考试成功 (ID: $EXAM_ID)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}  ✗${NC} 创建考试失败"
        FAILED=$((FAILED + 1))
    fi
    TOTAL=$((TOTAL + 1))
fi

# ==================== Phase 7: 系统管理测试 ====================
echo -e "\n${YELLOW}▶ Phase 7: 系统管理测试${NC}"
echo "--------------------------------------"

run_test "获取菜单列表" "curl -s '$BASE_URL/system/menus' -H 'Authorization: Bearer $ADMIN_TOKEN' | grep -q '200'"
run_test "获取角色列表" "curl -s '$BASE_URL/system/roles' -H 'Authorization: Bearer $ADMIN_TOKEN' | grep -q '200'"
run_test "获取用户列表" "curl -s '$BASE_URL/system/users' -H 'Authorization: Bearer $ADMIN_TOKEN' | grep -q '200'"
run_test "获取导航菜单" "curl -s '$BASE_URL/system/menus/nav' -H 'Authorization: Bearer $ADMIN_TOKEN' | grep -q '200'"

# ==================== Phase 8: 班级管理测试 ====================
echo -e "\n${YELLOW}▶ Phase 8: 班级管理测试${NC}"
echo "--------------------------------------"

run_test "获取班级列表(教师)" "curl -s '$BASE_URL/classes' -H 'Authorization: Bearer $TEACHER_TOKEN' | grep -q '200'"

# ==================== Phase 9: 仪表盘测试 ====================
echo -e "\n${YELLOW}▶ Phase 9: 仪表盘测试${NC}"
echo "--------------------------------------"

run_test "获取仪表盘统计" "curl -s '$BASE_URL/dashboard/stats' -H 'Authorization: Bearer $ADMIN_TOKEN' | grep -q '200'"

# ==================== 测试报告 ====================
echo -e "\n======================================"
echo -e "${YELLOW}  测试报告${NC}"
echo "======================================"
echo "总测试数: $TOTAL"
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo "通过率: $((PASSED * 100 / TOTAL))%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！系统运行正常${NC}"
    exit 0
else
    echo -e "${RED}✗ 发现 $FAILED 个失败项${NC}"
    exit 1
fi
