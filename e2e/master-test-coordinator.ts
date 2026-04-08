#!/usr/bin/env tsx
/**
 * 主测试协调器 - 多Agent并行测试
 * 基于 USER_GUIDE_AND_TEST_FLOW.md 执行完整业务流程测试
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// 测试场景配置
const TEST_SCENARIOS = [
  {
    id: 'account-activation',
    name: '账号与激活测试',
    description: '基于需求: 账号生成、激活码配置、登录限制',
    specs: ['agents/account-activation-agent.ts'],
    priority: 0,
    dependsOn: [],
  },
  {
    id: 'exam-flow',
    name: '题库与考试测试',
    description: '基于需求: 题库搭建、场次管理、时间管理',
    specs: ['agents/exam-flow-agent.ts'],
    priority: 0,
    dependsOn: ['account-activation'],
  },
  {
    id: 'scoring',
    name: '答题与评分测试',
    description: '基于需求: 题型操作、自动评分、主观题处理',
    specs: ['agents/scoring-agent.ts'],
    priority: 0,
    dependsOn: ['exam-flow'],
  },
  {
    id: 'score-management',
    name: '成绩管理测试',
    description: '基于需求: 成绩导出、查询、审分配合',
    specs: ['agents/score-management-agent.ts'],
    priority: 1,
    dependsOn: ['scoring'],
  },
  // 保留原有测试作为回归
  {
    id: 'auth',
    name: '用户认证回归',
    description: '原有认证功能回归测试',
    specs: ['auth.spec.ts'],
    priority: 1,
    dependsOn: [],
  },
  {
    id: 'question-bank',
    name: '题库管理回归',
    description: '原有题库功能回归测试',
    specs: ['question-bank.spec.ts'],
    priority: 1,
    dependsOn: [],
  },
  {
    id: 'paper',
    name: '套卷管理回归',
    description: '原有套卷功能回归测试',
    specs: ['paper-management.spec.ts'],
    priority: 1,
    dependsOn: [],
  },
];

// 问题记录
interface TestIssue {
  scenario: string;
  testFile: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  error?: string;
  duration: number;
  screenshot?: string;
  video?: string;
}

interface TestResult {
  scenario: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  issues: TestIssue[];
}

const allResults: TestResult[] = [];

/**
 * 执行单个测试场景
 */
async function runScenario(scenario: typeof TEST_SCENARIOS[0]): Promise<TestResult> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 [${scenario.id}] 启动: ${scenario.name}`);
  console.log(`   ${scenario.description}`);
  console.log(`${'='.repeat(70)}`);

  const startTime = Date.now();
  const issues: TestIssue[] = [];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;

  for (const spec of scenario.specs) {
    // 根据路径前缀确定目录
    const baseDir = spec.startsWith('agents/') ? __dirname : path.join(__dirname, 'playwright-tests');
    const specPath = path.join(baseDir, spec);
    if (!fs.existsSync(specPath)) {
      console.warn(`⚠️  文件不存在: ${specPath}`);
      continue;
    }

    console.log(`\n   ▶ 执行: ${spec}`);
    const result = await executePlaywright(spec, scenario.id);

    totalTests += result.total;
    passedTests += result.passed;
    failedTests += result.failed;
    skippedTests += result.skipped;
    issues.push(...result.issues);
  }

  const duration = Date.now() - startTime;

  console.log(`\n   ${scenario.id} 执行结果:`);
  console.log(`   ✅ 通过: ${passedTests}/${totalTests}`);
  console.log(`   ❌ 失败: ${failedTests}/${totalTests}`);
  console.log(`   ⏭️  跳过: ${skippedTests}/${totalTests}`);
  console.log(`   ⏱️  耗时: ${(duration / 1000).toFixed(2)}s`);

  return {
    scenario: scenario.name,
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    skipped: skippedTests,
    duration,
    issues,
  };
}

/**
 * 执行 Playwright 测试
 */
function executePlaywright(
  spec: string,
  scenarioId: string
): Promise<{
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  issues: TestIssue[];
}> {
  return new Promise((resolve) => {
    const outputDir = path.join(__dirname, 'test-results', scenarioId);
    fs.mkdirSync(outputDir, { recursive: true });

    // 根据路径前缀确定目录
    const specDir = spec.startsWith('agents/') ? '' : 'playwright-tests/';
    const args = [
      'playwright', 'test', `${specDir}${spec}`,
      '--reporter=json',
      `--output=${outputDir}`,
      '--workers=1',
    ];

    console.log(`      命令: npx ${args.join(' ')}`);

    const child = spawn('npx', args, {
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: 'test' },
    });

    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      // 解析测试结果
      const resultFile = path.join(outputDir, 'test-results.json');
      let result = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        issues: [] as TestIssue[],
      };

      if (fs.existsSync(resultFile)) {
        try {
          const data = JSON.parse(fs.readFileSync(resultFile, 'utf-8'));
          result.total = data.stats?.tests || 0;
          result.passed = data.stats?.expected || 0;
          result.failed = data.stats?.unexpected || 0;
          result.skipped = data.stats?.skipped || 0;

          // 解析详细结果
          for (const suite of data.suites || []) {
            for (const spec of suite.specs || []);
            for (const test of spec.tests || []) {
              for (const run of test.results || []) {
                if (run.status !== 'passed') {
                  result.issues.push({
                    scenario: scenarioId,
                    testFile: spec.file,
                    testName: test.title,
                    status: run.status,
                    error: run.error?.message,
                    duration: run.duration,
                    screenshot: run.attachments?.find((a: any) => a.name === 'screenshot')?.path,
                    video: run.attachments?.find((a: any) => a.name === 'video')?.path,
                  });
                }
              }
            }
          }
        } catch (e) {
          console.error('解析测试结果失败:', e);
        }
      }

      resolve(result);
    });
  });
}

/**
 * 生成测试报告
 */
function generateReport() {
  const reportDir = path.join(__dirname, 'test-report');
  fs.mkdirSync(reportDir, { recursive: true });

  const totalTests = allResults.reduce((sum, r) => sum + r.total, 0);
  const totalPassed = allResults.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = allResults.reduce((sum, r) => sum + r.failed, 0);
  const totalSkipped = allResults.reduce((sum, r) => sum + r.skipped, 0);
  const totalDuration = allResults.reduce((sum, r) => sum + r.duration, 0);
  const allIssues = allResults.flatMap((r) => r.issues);

  // Markdown 报告
  const reportContent = `# 多Agent自动化测试报告

生成时间: ${new Date().toISOString()}

## 汇总

| 指标 | 数值 |
|------|------|
| 总测试数 | ${totalTests} |
| ✅ 通过 | ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%) |
| ❌ 失败 | ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%) |
| ⏭️ 跳过 | ${totalSkipped} (${((totalSkipped / totalTests) * 100).toFixed(1)}%) |
| 总耗时 | ${(totalDuration / 1000).toFixed(2)}s |

## 按场景详细结果

${allResults
  .map(
    (r) => `### ${r.scenario}

- 总计: ${r.total} | ✅ ${r.passed} | ❌ ${r.failed} | ⏭️ ${r.skipped}
- 耗时: ${(r.duration / 1000).toFixed(2)}s
`
  )
  .join('\n')}

## 问题清单 (${allIssues.length}项)

${allIssues.length > 0
      ? allIssues
          .map(
            (issue, i) => `${i + 1}. **${issue.testName}**
   - 场景: ${issue.scenario}
   - 状态: ${issue.status}
   - 错误: ${issue.error || '无详细错误'}
   - 截图: ${issue.screenshot || '无'}
`
          )
          .join('\n')
      : '✅ 所有测试通过，无问题记录'
    }

## 需求覆盖检查

基于 USER_GUIDE_AND_TEST_FLOW.md:

| 需求类别 | 测试场景 | 覆盖状态 |
|---------|---------|---------|
| 账号生成 | account-activation | ${allResults.find((r) => r.scenario === '账号与激活测试')?.failed === 0 ? '✅' : '❌'} |
| 激活码配置 | account-activation | ${allResults.find((r) => r.scenario === '账号与激活测试')?.failed === 0 ? '✅' : '❌'} |
| 题库搭建 | exam-flow | ${allResults.find((r) => r.scenario === '题库与考试测试')?.failed === 0 ? '✅' : '❌'} |
| 场次控制 | exam-flow | ${allResults.find((r) => r.scenario === '题库与考试测试')?.failed === 0 ? '✅' : '❌'} |
| 自动评分 | scoring | ${allResults.find((r) => r.scenario === '答题与评分测试')?.failed === 0 ? '✅' : '❌'} |
| 成绩导出 | score-management | ${allResults.find((r) => r.scenario === '成绩管理测试')?.failed === 0 ? '✅' : '❌'} |
| 审分配合 | score-management | ${allResults.find((r) => r.scenario === '成绩管理测试')?.failed === 0 ? '✅' : '❌'} |
`;

  fs.writeFileSync(path.join(reportDir, 'test-report.md'), reportContent);

  // JSON 报告
  fs.writeFileSync(
    path.join(reportDir, 'test-results.json'),
    JSON.stringify(
      {
        summary: {
          total: totalTests,
          passed: totalPassed,
          failed: totalFailed,
          skipped: totalSkipped,
          duration: totalDuration,
          passRate: ((totalPassed / totalTests) * 100).toFixed(1),
        },
        scenarios: allResults,
        issues: allIssues,
      },
      null,
      2
    )
  );

  console.log(`\n📊 测试报告已生成: ${reportDir}/test-report.md`);
}

/**
 * 主函数
 */
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🎯 多Agent并行测试协调器');
  console.log('   基于 USER_GUIDE_AND_TEST_FLOW.md 执行业务流程测试');
  console.log('='.repeat(70));

  const startTime = Date.now();

  // 按优先级排序
  const sortedScenarios = [...TEST_SCENARIOS].sort((a, b) => a.priority - b.priority);

  // 串行执行（如需真正并行可改为 Promise.all，但需处理依赖关系）
  for (const scenario of sortedScenarios) {
    const result = await runScenario(scenario);
    allResults.push(result);

    // 如果有失败，可以选择是否继续
    if (result.failed > 0 && process.env.FAIL_FAST === 'true') {
      console.log('\n❌ 有测试失败，根据 FAIL_FAST 设置停止执行');
      break;
    }
  }

  const totalDuration = Date.now() - startTime;

  // 生成报告
  generateReport();

  // 输出汇总
  console.log('\n' + '='.repeat(70));
  console.log('📊 测试执行完成');
  console.log('='.repeat(70));

  const totalTests = allResults.reduce((sum, r) => sum + r.total, 0);
  const totalPassed = allResults.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = allResults.reduce((sum, r) => sum + r.failed, 0);

  console.log(`总测试: ${totalTests}`);
  console.log(`✅ 通过: ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);
  console.log(`❌ 失败: ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)`);
  console.log(`⏱️ 总耗时: ${(totalDuration / 1000).toFixed(2)}s`);

  if (totalFailed > 0) {
    console.log('\n❌ 存在失败的测试，请查看详细报告');
    process.exit(1);
  } else {
    console.log('\n✅ 所有测试通过');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('测试协调器出错:', error);
  process.exit(1);
});
