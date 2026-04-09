/**
 * 组件自动扫描模块
 * 自动扫描 views 目录下的所有 .vue 文件并生成组件映射表
 * 命名规则：目录前缀 + PascalCase文件名，防止同名冲突
 */

// Vite 的 import.meta.glob 自动扫描
const viewModules = import.meta.glob<{ default: any }>('@/views/**/*.vue', { eager: false })

// ==================== 组件别名映射 ====================
// 用于处理后端配置的组件名与前端实际组件名不匹配的情况
// 键：后端配置的组件名，值：前端实际的组件名
const componentAliasMap: Record<string, string> = {
  // 账号管理相关
  'AdminAccounts': 'AdminAccountManager',
  'AdminAccount': 'AdminAccountManager',
  'AdminAccountList': 'AdminAccountManager',
  'AdminAccountDetail': 'AdminAccountManager',

  // 题库管理相关
  'AdminQuestionBanks': 'AdminQuestionBankList',
  'AdminQuestionBank': 'AdminQuestionBankList',
  'AdminQuestions': 'AdminQuestionBankList',

  // 试卷管理相关
  'AdminPapers': 'AdminPaperManager',
  'AdminPaper': 'AdminPaperManager',

  // 考试管理相关
  'AdminExams': 'AdminExamManager',
  'AdminExam': 'AdminExamManager',

  // 成绩管理相关
  'AdminScores': 'AdminScoreManager',
  'AdminScore': 'AdminScoreManager',

  // 资源管理相关
  'AdminResources': 'AdminResourceManager',
  'AdminResource': 'AdminResourceManager',

  // 反馈管理相关
  'AdminFeedbacks': 'AdminFeedbackManager',
  'AdminFeedback': 'AdminFeedbackManager',

  // 激活码相关
  'AdminActivation': 'AdminActivationCodes',
  'AdminActivationCode': 'AdminActivationCodes',
  'AdminActivationCodes1': 'AdminActivationCodes',
  'AdminActivationCodes': 'AdminActivationCodes',
  'AdminActivationPlan': 'AdminActivationPlans',
}

/**
 * 获取组件实际名称（处理别名映射）
 * @param configName 后端配置的组件名
 * @returns 前端实际的组件名
 */
export function resolveComponentName(configName: string): string {
  return componentAliasMap[configName] || configName
}

/**
 * 组件信息接口
 */
export interface ComponentInfo {
  name: string
  path: string
  loader: () => Promise<{ default: any }>
  folder: string
  fileName: string
}

/**
 * 扫描所有组件
 * @returns 组件信息列表
 */
export function scanComponents(): ComponentInfo[] {
  const components: ComponentInfo[] = []

  for (const [path, loader] of Object.entries(viewModules)) {
    const info = parseComponentPath(path)
    if (info) {
      components.push({
        ...info,
        loader: loader as () => Promise<{ default: any }>,
      })
    }
  }

  // 按名称排序，方便查看
  return components.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * 生成组件映射表（用于动态路由）
 * @returns Record<组件名, 加载函数>
 */
export function generateComponentMap(): Record<string, () => Promise<{ default: any }>> {
  const components = scanComponents()
  const map: Record<string, () => Promise<{ default: any }>> = {}

  for (const comp of components) {
    // 检查名称冲突
    if (map[comp.name]) {
      console.warn(`[ComponentScanner] 组件名称冲突: ${comp.name}`)
      console.warn(`  - 已存在: ${comp.path}`)
      console.warn(`  - 被忽略: ${comp.path}`)
      continue
    }
    map[comp.name] = comp.loader
  }

  return map
}

/**
 * 解析组件路径，生成组件信息
 * @param path 文件路径，如：@/views/admin/DataScreen.vue 或 /src/views/admin/DataScreen.vue
 * @returns 组件信息
 */
function parseComponentPath(path: string): Omit<ComponentInfo, 'loader'> | null {
  // 匹配路径：@/views/{folder}/{filePath}.vue 或 /src/views/{folder}/{filePath}.vue
  const match = path.match(/(?:@|\/src)\/views\/(\w+)\/(.*?)\.vue$/)
  if (!match) {
    // 尝试匹配根目录下的文件
    const rootMatch = path.match(/(?:@|\/src)\/views\/(\w+)\.vue$/)
    if (rootMatch) {
      const fileName = rootMatch[1]
      return {
        name: fileName,
        path,
        folder: 'root',
        fileName,
      }
    }
    return null
  }

  const [, folder, filePath] = match

  // 处理文件名
  // 1. index.vue → 使用目录名
  // 2. sub/index.vue → 使用 sub_Index
  // 3. other.vue → 使用 Other
  let fileName: string
  if (filePath === 'index') {
    fileName = folder
  } else if (filePath.endsWith('/index')) {
    fileName = filePath.replace('/index', '').replace(/\//g, '_')
  } else {
    fileName = filePath.replace(/\//g, '_')
  }

  // 生成组件名：目录前缀 + PascalCase文件名
  // 如：admin/DataScreen.vue → AdminDataScreen
  const componentName = toPascalCase(folder) + toPascalCase(fileName)

  return {
    name: componentName,
    path,
    folder,
    fileName,
  }
}

/**
 * 转换为 PascalCase
 * @param str 输入字符串
 * @returns PascalCase 格式
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toUpperCase() : word.toUpperCase()
    })
    .replace(/\s+/g, '')
}

/**
 * 获取可用组件列表（用于后台下拉选择）
 * @returns 组件列表，包含名称和路径
 */
export function getAvailableComponents(): Array<{ name: string; path: string; folder: string }> {
  const components = scanComponents()
  return components.map(c => ({
    name: c.name,
    path: c.path,
    folder: c.folder,
  }))
}

/**
 * 根据组件名获取加载函数
 * @param name 组件名
 * @returns 加载函数或 undefined
 */
export function getComponentLoader(
  name: string
): (() => Promise<{ default: any }>) | undefined {
  const map = generateComponentMap()
  return map[name]
}

/**
 * 打印所有可用组件（调试用）
 */
export function logAvailableComponents(): void {
  const components = scanComponents()
  console.group('[ComponentScanner] 可用组件列表')
  const grouped = components.reduce((acc, comp) => {
    if (!acc[comp.folder]) acc[comp.folder] = []
    acc[comp.folder].push(comp.name)
    return acc
  }, {} as Record<string, string[]>)

  for (const [folder, names] of Object.entries(grouped)) {
    console.group(folder)
    names.forEach(name => console.log(`  - ${name}`))
    console.groupEnd()
  }
  console.groupEnd()
}

// 开发环境下打印组件列表
if (import.meta.env.DEV) {
  logAvailableComponents()
}
