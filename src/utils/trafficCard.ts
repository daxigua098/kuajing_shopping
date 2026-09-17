export type TrafficCardStatus = 'unconfigured' | 'missing_expiry' | 'expired' | 'due_soon' | 'active'

interface TrafficCardRecord {
  trafficCardNumber?: string
  trafficCardExpiryDate?: string | null
}

export function daysUntilTrafficExpiry(expiryDate: string | null | undefined, today = new Date().toISOString().slice(0, 10)) {
  if (!expiryDate) return null
  const expiry = Date.parse(expiryDate + 'T00:00:00Z')
  const current = Date.parse(today + 'T00:00:00Z')
  if (Number.isNaN(expiry) || Number.isNaN(current)) return null
  return Math.ceil((expiry - current) / 86400000)
}

export function trafficCardStatus(shop: TrafficCardRecord, today = new Date().toISOString().slice(0, 10)): TrafficCardStatus {
  if (!shop.trafficCardNumber?.trim()) return 'unconfigured'
  if (!shop.trafficCardExpiryDate) return 'missing_expiry'
  const days = daysUntilTrafficExpiry(shop.trafficCardExpiryDate, today)
  if (days === null) return 'missing_expiry'
  if (days < 0) return 'expired'
  if (days <= 7) return 'due_soon'
  return 'active'
}

export function trafficRenewalText(expiryDate: string | null | undefined) {
  if (!expiryDate) return '未设置每月续费日'
  const day = Number(expiryDate.slice(-2))
  return Number.isFinite(day) && day > 0 ? '每月 ' + day + ' 日续费' : '未设置每月续费日'
}