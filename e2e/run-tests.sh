#!/bin/bash
# 多Agent自动化测试执行脚本

echo "=================================="
echo "接力教育智慧云平台 - 自动化测试"
echo "=================================="
echo ""

# 检查参数
if [ -z "$1" ]; then
  echo "使用方法:"
  echo "  ./run-tests.sh all           # 运行所有测试"
  echo "  ./run-tests.sh agents        # 运行所有Agent测试"
  echo "  ./run-tests.sh account       # 运行账号与激活测试"
  echo "  ./run-tests.sh exam          # 运行题库与考试测试"
  echo "  ./run-tests.sh scoring       # 运行答题与评分测试"
  echo "  ./run-tests.sh score         # 运行成绩管理测试"
  echo "  ./run-tests.sh specs         # 运行专项测试"
  echo "  ./run-tests.sh regression    # 运行回归测试"
  echo ""
  exit 1
fi

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

case "$1" in
  all)
    echo -e "${YELLOW}运行所有测试...${NC}"
    npx playwright test
    ;;
  agents)
    echo -e "${YELLOW}运行多Agent测试...${NC}"
    npx tsx master-test-coordinator.ts
    ;;
  account)
    echo -e "${YELLOW}运行账号与激活测试...${NC}"
    npx playwright test agents/account-activation-agent.ts --workers=1
    ;;
  exam)
    echo -e "${YELLOW}运行题库与考试测试...${NC}"
    npx playwright test agents/exam-flow-agent.ts --workers=1
    ;;
  scoring)
    echo -e "${YELLOW}运行答题与评分测试...${NC}"
    npx playwright test agents/scoring-agent.ts --workers=1
    ;;
  score)
    echo -e "${YELLOW}运行成绩管理测试...${NC}"
    npx playwright test agents/score-management-agent.ts --workers=1
    ;;
  specs)
    echo -e "${YELLOW}运行专项测试...${NC}"
    npx playwright test specs/ --workers=1
    ;;
  regression)
    echo -e "${YELLOW}运行回归测试...${NC}"
    npx playwright test playwright-tests/ --workers=1
    ;;
  *)
    echo -e "${RED}未知命令: $1${NC}"
    echo "使用方法: ./run-tests.sh [all|agents|account|exam|scoring|score|specs|regression]"
    exit 1
    ;;
esac

echo ""
echo "=================================="
if [ $? -eq 0 ]; then
  echo -e "${GREEN}测试执行完成${NC}"
else
  echo -e "${RED}测试执行失败${NC}"
fi
echo "=================================="
