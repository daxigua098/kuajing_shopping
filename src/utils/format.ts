export const money = (value: number, currency = 'MYR') => new Intl.NumberFormat('zh-CN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value || 0)
export const number = (value: number) => new Intl.NumberFormat('zh-CN').format(value || 0)
export const dateText = (value?: string | null) => value ? value.replace('T', ' ').slice(0, 16) : '—'
export const timeAgo = (value: string) => {
  const diff = Date.now() - new Date(value).getTime()
  const days = Math.floor(diff / 86400000)
  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 30) return days + ' 天前'
  return value.slice(0, 10)
}
export const maskAccount = (value: string) => value.replace(/(\d{4})(?:[^\d]*)(\d{4})$/, '$1 **** **** $2')
