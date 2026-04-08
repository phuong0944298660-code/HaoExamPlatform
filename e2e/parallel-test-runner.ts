/**
 * 多Agent并行测试执行器
 * 接力教育智慧云平台 - 像素级UI测试
 * 
 * 使用方法: npx ts-node parallel-test-runner.ts
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// 测试场景定义
const TEST_SCENARIOS = [
  {
    id: 'auth',
    name: '用户认证场景',
    description: '登录、激活、多端互踢',
    specs: ['auth.spec.ts'],
    priority: 'P0',
    estimatedTime: 120,
  },
  {
    id: 'account',
    name: '账号管理场景', 
    description: '批量生成账号、激活码管理',
    specs: ['account-management.spec.ts'],
    priority: 'P0',
    estimatedTime: 180,
  },
  {
    id: 'exam-flow',
    name: '考试流程场景',
    description: '学生考试、教师监控',
    specs: ['exam-flow.spec.ts'],
    priority: 'P0',
    estimatedTime: 300,
  },
  {
    id: 'ui-regression',
    name: 'UI回归测试',
    description: '所有页面视觉回归',
    specs: ['ui-regression.spec.ts'],
    priority: 'P1',
    estimatedTime: 240,
  },
];

// 问题收集器
interface TestIssue {
  scenario: string;
  testName: string;
  type: 'pixel_mismatch' | 'functional_error' | 'performance' | 'layout_break';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  expected?: string;
  actual?: string;
  screenshotPath?: string;
  diffPath?: string;
  timestamp: string;
}

const issues: TestIssue[] = [];

// 运行单个测试场景
async function runScenario(scenario: typeof TEST_SCENARIOS[0]): Promise<void> {
  console.log(`\n🚀 [${scenario.id}] 启动测试场景: ${scenario.name}`);
  console.log(`   描述: ${scenario.description}`);
  console.log(`   优先级: ${scenario.priority}`);
  console.log(`   预计耗时: ${scenario.estimatedTime}秒`);
  console.log(`   测试文件: ${scenario.specs.join(', ')}`);

  const startTime = Date.now();

  for (const spec of scenario.specs) {
    const specPath = path.join(__dirname, 'playwright-tests', spec);
    
    if (!fs.existsSync(specPath)) {
      console.warn(`⚠️ [${scenario.id}] 测试文件不存在: ${specPath}`);
      continue;
    }

    console.log(`\n   ▶ 执行: ${spec}`);

    try {
      const result = await runPlaywrightTest(spec, scenario.id);
      
      if (result.success) {
        console.log(`   ✅ [${scenario.id}] ${spec} 通过`);
      } else {
        console.log(`   ❌ [${scenario.id}] ${spec} 失败`);
        
        // 解析失败结果，收集问题
        if (result.output) {
          parseTestFailures(result.output, scenario.name);
        }
      }
    } catch (error) {
      console.error(`   💥 [${scenario.id}] 执行异常:`, error);
      issues.push({
        scenario: scenario.name,
        testName: spec,
        type: 'functional_error',
        severity: 'critical',
        description: `测试执行异常: ${error}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n⏱️  [${scenario.id}] 耗时: ${duration.toFixed(1)}秒`);
}

// 运行Playwright测试
function runPlaywrightTest(spec: string, scenarioId: string): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const output: string[] = [];
    
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const args = [
      'playwright',
      'test',
      `playwright-tests/${spec}`,
      '--reporter=json',
      `--output=test-results/${scenarioId}`,
    ];

    console.log(`   命令: ${npxCmd} ${args.join(' ')}`);

    const child = spawn(npxCmd, args, {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (data) => {
      const text = data.toString();
      output.push(text);
      // 实时输出关键信息
      if (text.includes('✓') || text.includes('✗') || text.includes('Error')) {
        process.stdout.write(text);
      }
    });

    child.stderr.on('data', (data) => {
      output.push(data.toString());
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output.join(''),
      });
    });
  });
}

// 解析测试失败信息
function parseTestFailures(output: string, scenarioName: string): void {
  // 尝试解析JSON报告
  try {
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('{')) {
        const report = JSON.parse(line);
        if (report.suites) {
          extractFailuresFromReport(report, scenarioName);
        }
      }
    }
  } catch (e) {
    // 如果JSON解析失败，使用正则匹配
    parseFailuresWithRegex(output, scenarioName);
  }
}

// 从JSON报告中提取失败
function extractFailuresFromReport(report: any, scenarioName: string): void {
  const processSuite = (suite: any) => {
    if (suite.suites) {
      suite.suites.forEach(processSuite);
    }
    if (suite.specs) {
      suite.specs.forEach((spec: any) => {
        if (spec.tests) {
          spec.tests.forEach((test: any) => {
            if (test.results) {
              test.results.forEach((result: any) => {
                if (result.status === 'failed' || result.status === 'timedOut') {
                  const issue: TestIssue = {
                    scenario: scenarioName,
                    testName: `${spec.title} > ${test.title}`,
                    type: detectIssueType(result.error || ''),
                    severity: detectSeverity(result.error || ''),
                    description: result.error || '测试失败',
                    timestamp: new Date().toISOString(),
                  };
                  
                  // 提取预期值和实际值
                  if (result.error) {
                    const match = result.error.match(/Expected: (.*?)\n.*?Received: (.*?)(\n|$)/);
                    if (match) {
                      issue.expected = match[1].trim();
                      issue.actual = match[2].trim();
                    }
                  }
                  
                  issues.push(issue);
                }
              });
            }
          });
        }
      });
    }
  };

  report.suites.forEach(processSuite);
}

// 使用正则解析失败
function parseFailuresWithRegex(output: string, scenarioName: string): void {
  // 匹配失败测试名称
  const failureRegex = /✗\s+(.+?)\s+\[.*?\](.*?)(?=✓|✗|$)/gs;
  let match;
  
  while ((match = failureRegex.exec(output)) !== null) {
    issues.push({
      scenario: scenarioName,
      testName: match[1].trim(),
      type: 'functional_error',
      severity: 'high',
      description: match[2].trim().substring(0, 500),
      timestamp: new Date().toISOString(),
    });
  }
}

// 检测问题类型
function detectIssueType(error: string): TestIssue['type'] {
  if (error.includes('screenshot') || error.includes('toHaveScreenshot')) {
    return 'pixel_mismatch';
  }
  if (error.includes('timeout') || error.includes('exceeded')) {
    return 'performance';
  }
  if (error.includes('layout') || error.includes('CSS') || error.includes('style')) {
    return 'layout_break';
  }
  return 'functional_error';
}

// 检测严重级别
function detectSeverity(error: string): TestIssue['severity'] {
  if (error.includes('toHaveScreenshot') || error.includes('Assertion')) {
    return 'high';
  }
  if (error.includes('timeout')) {
    return 'medium';
  }
  return 'medium';
}

// 主执行函数
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('🎯 接力教育智慧云平台 - 多Agent并行测试执行器');
  console.log('='.repeat(60));
  console.log(`\n📋 测试场景数: ${TEST_SCENARIOS.length}`);
  console.log(`⏱️  预计总耗时: ${TEST_SCENARIOS.reduce((sum, s) => sum + s.estimatedTime, 0)}秒`);
  console.log('\n');

  const startTime = Date.now();

  // 串行执行（实际可以并行，但为了日志清晰先串行）
  // 如果要真正并行，可以使用 Promise.all
  for (const scenario of TEST_SCENARIOS) {
    await runScenario(scenario);
  }

  const totalDuration = (Date.now() - startTime) / 1000;

  // 生成报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试执行完成');
  console.log('='.repeat(60));
  console.log(`⏱️  总耗时: ${totalDuration.toFixed(1)}秒`);
  console.log(`🔴 发现问题: ${issues.length}个`);
  console.log(`\n`);

  // 输出问题清单
  if (issues.length > 0) {
    console.log('📋 问题清单:');
    console.log('-'.repeat(60));
    
    const grouped = groupIssuesByType(issues);
    
    for (const [type, typeIssues] of Object.entries(grouped)) {
      console.log(`\n🔸 ${getTypeLabel(type as TestIssue['type'])} (${typeIssues.length}个):`);
      typeIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.testName}`);
        console.log(`      描述: ${issue.description.substring(0, 100)}${issue.description.length > 100 ? '...' : ''}`);
        if (issue.expected && issue.actual) {
          console.log(`      预期: ${issue.expected}`);
          console.log(`      实际: ${issue.actual}`);
        }
      });
    }
  }

  // 保存详细报告
  const reportPath = path.join(__dirname, '..', 'test-reports', 'parallel-test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    duration: totalDuration,
    scenarios: TEST_SCENARIOS.length,
    totalIssues: issues.length,
    issues: issues,
    summary: generateSummary(issues),
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 详细报告已保存: ${reportPath}`);

  // 生成Markdown报告
  generateMarkdownReport(report);

  // 退出码
  process.exit(issues.length > 0 ? 1 : 0);
}

// 按类型分组问题
function groupIssuesByType(issues: TestIssue[]): Record<string, TestIssue[]> {
  return issues.reduce((acc, issue) => {
    acc[issue.type] = acc[issue.type] || [];
    acc[issue.type].push(issue);
    return acc;
  }, {} as Record<string, TestIssue[]>);
}

// 获取类型标签
function getTypeLabel(type: TestIssue['type']): string {
  const labels = {
    pixel_mismatch: '像素不匹配',
    functional_error: '功能错误',
    performance: '性能问题',
    layout_break: '布局断裂',
  };
  return labels[type];
}

// 生成汇总
function generateSummary(issues: TestIssue[]) {
  const bySeverity = issues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byType = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    bySeverity,
    byType,
  };
}

// 生成Markdown报告
function generateMarkdownReport(report: any): void {
  const mdPath = path.join(__dirname, '..', 'test-reports', 'PIXEL_TEST_ISSUES_REPORT.md');
  
  let md = `# 像素级测试问题报告

> 生成时间: ${new Date().toISOString()}
> 总耗时: ${report.duration.toFixed(1)}秒
> 发现问题: ${report.totalIssues}个

## 📊 问题汇总

### 按严重级别
`;

  for (const [severity, count] of Object.entries(report.summary.bySeverity)) {
    md += `- ${severity}: ${count}个\n`;
  }

  md += `\n### 按问题类型
`;

  for (const [type, count] of Object.entries(report.summary.byType)) {
    md += `- ${getTypeLabel(type as TestIssue['type'])}: ${count}个\n`;
  }

  md += `\n## 🔍 详细问题清单\n`;

  const grouped = groupIssuesByType(report.issues);
  
  for (const [type, typeIssues] of Object.entries(grouped)) {
    md += `\n### ${getTypeLabel(type as TestIssue['type'])}\n\n`;
    
    typeIssues.forEach((issue, index) => {
      md += `#### ${index + 1}. ${issue.testName}

- **场景**: ${issue.scenario}
- **严重级别**: ${issue.severity}
- **时间**: ${issue.timestamp}
- **描述**: ${issue.description}
`;
      if (issue.expected && issue.actual) {
        md += `- **预期值**: ${issue.expected}
- **实际值**: ${issue.actual}
`;
      }
      if (issue.screenshotPath) {
        md += `- **截图**: ${issue.screenshotPath}
`;
      }
      md += `\n`;
    });
  }

  md += `\n---
*报告由多Agent并行测试执行器生成*
`;

  fs.writeFileSync(mdPath, md);
  console.log(`📝 Markdown报告已保存: ${mdPath}`);
}

// 执行主函数
main().catch((error) => {
  console.error('执行失败:', error);
  process.exit(1);
});
