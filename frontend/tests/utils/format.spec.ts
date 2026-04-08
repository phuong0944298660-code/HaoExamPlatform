import { describe, it, expect } from 'vitest'

// 格式化工具函数（如果需要可以添加到项目中）
export function formatDate(date: Date | string | number, format: string = 'YYYY-MM-DD'): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`
  } else {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`
  }
}

export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

export function formatNumber(num: number, decimals: number = 0): string {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatPercentage(num: number, decimals: number = 2): string {
  return (num * 100).toFixed(decimals) + '%'
}

describe('Format Utils', () => {
  describe('formatDate', () => {
    it('应该正确格式化日期', () => {
      const date = new Date('2024-03-15 14:30:00')
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-03-15')
      expect(formatDate(date, 'YYYY/MM/DD')).toBe('2024/03/15')
    })

    it('应该正确格式化时间', () => {
      const date = new Date('2024-03-15 14:30:05')
      expect(formatDate(date, 'HH:mm:ss')).toBe('14:30:05')
      expect(formatDate(date, 'YYYY-MM-DD HH:mm')).toBe('2024-03-15 14:30')
    })

    it('应该处理字符串日期', () => {
      expect(formatDate('2024-01-20', 'YYYY-MM-DD')).toBe('2024-01-20')
    })

    it('应该处理时间戳', () => {
      const timestamp = new Date('2024-03-15').getTime()
      expect(formatDate(timestamp, 'YYYY-MM-DD')).toBe('2024-03-15')
    })

    it('应该补零', () => {
      const date = new Date('2024-01-05 09:05:05')
      expect(formatDate(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2024-01-05 09:05:05')
    })
  })

  describe('formatFileSize', () => {
    it('应该正确格式化字节', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(512)).toBe('512 B')
    })

    it('应该正确格式化 KB', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('应该正确格式化 MB', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
    })

    it('应该正确格式化 GB', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('应该保留两位小数', () => {
      expect(formatFileSize(1234)).toBe('1.21 KB')
    })
  })

  describe('formatDuration', () => {
    it('应该正确格式化秒', () => {
      expect(formatDuration(30)).toBe('30秒')
    })

    it('应该正确格式化分钟', () => {
      expect(formatDuration(60)).toBe('60秒')
      expect(formatDuration(120)).toBe('2分钟')
    })

    it('应该正确格式化分钟和秒', () => {
      expect(formatDuration(90)).toBe('1分30秒')
      expect(formatDuration(125)).toBe('2分5秒')
    })

    it('应该正确格式化小时', () => {
      expect(formatDuration(3600)).toBe('1小时')
      expect(formatDuration(7200)).toBe('2小时')
    })

    it('应该正确格式化小时和分钟', () => {
      expect(formatDuration(3660)).toBe('1小时1分')
      expect(formatDuration(5400)).toBe('1小时30分')
    })
  })

  describe('truncateText', () => {
    it('应该截断长文本', () => {
      const text = '这是一个很长的文本内容'
      expect(truncateText(text, 5)).toBe('这是...')
    })

    it('应该保留短文本', () => {
      const text = '短文本'
      expect(truncateText(text, 10)).toBe('短文本')
    })

    it('应该处理空文本', () => {
      expect(truncateText('', 10)).toBe('')
      expect(truncateText(null as any, 10)).toBe(null as any)
    })

    it('应该使用自定义后缀', () => {
      const text = '这是一个很长的文本内容'
      expect(truncateText(text, 5, '>>>')).toBe('这>>>')
    })

    it('边界情况：文本长度等于最大长度', () => {
      const text = '12345'
      expect(truncateText(text, 5)).toBe('12345')
    })
  })

  describe('formatNumber', () => {
    it('应该添加千位分隔符', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1000000)).toBe('1,000,000')
    })

    it('应该保留指定小数位', () => {
      expect(formatNumber(1234.567, 2)).toBe('1,234.57')
      expect(formatNumber(1234.5, 2)).toBe('1,234.50')
    })

    it('应该处理小数', () => {
      expect(formatNumber(1234.5, 1)).toBe('1,234.5')
    })

    it('应该处理零', () => {
      expect(formatNumber(0)).toBe('0')
      expect(formatNumber(0, 2)).toBe('0.00')
    })
  })

  describe('formatPercentage', () => {
    it('应该正确转换小数', () => {
      expect(formatPercentage(0.25)).toBe('25.00%')
      expect(formatPercentage(0.5)).toBe('50.00%')
      expect(formatPercentage(1)).toBe('100.00%')
    })

    it('应该保留指定小数位', () => {
      expect(formatPercentage(0.3333, 2)).toBe('33.33%')
      expect(formatPercentage(0.3333, 1)).toBe('33.3%')
      expect(formatPercentage(0.3333, 0)).toBe('33%')
    })

    it('应该处理大于1的值', () => {
      expect(formatPercentage(1.5)).toBe('150.00%')
    })

    it('应该处理0', () => {
      expect(formatPercentage(0)).toBe('0.00%')
    })
  })
})
