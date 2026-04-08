const { execSync } = require('child_process');
const fs = require('fs');

const outputFile = '/tmp/student-exam-test-result.json';

try {
  // 运行测试并捕获输出
  const result = execSync(
    'npx playwright test playwright-tests/student-exam.spec.ts --reporter=json --timeout=45000',
    {
      cwd: '/Users/chockg/Documents/trae_projects/Jieli Education Smart Cloud Platform/e2e',
      encoding: 'utf-8',
      timeout: 300000, // 5分钟超时
      stdio: ['pipe', 'pipe', 'pipe']
    }
  );
  
  fs.writeFileSync(outputFile, result);
  console.log('Test completed successfully');
} catch (error) {
  // 即使测试失败也可能有输出
  if (error.stdout) {
    fs.writeFileSync(outputFile, error.stdout);
    console.log('Test completed with failures');
  } else {
    fs.writeFileSync(outputFile, JSON.stringify({ error: error.message }));
    console.log('Test execution error:', error.message);
  }
}
