import type { DistributionRule, SettlementMode, Shop } from '@/types'

export const monthBounds = (month: string) => {
  const [year, m] = month.split('-').map(Number)
  const start = new Date(Date.UTC(year, m - 1, 1))
  const end = new Date(Date.UTC(year, m, 0))
  return { start, end, startText: start.toISOString().slice(0, 10), endText: end.toISOString().slice(0, 10) }
}

export const isAliveInMonth = (shop: Shop, month: string) => {
  const { startText, endText } = monthBounds(month)
  if (shop.openDate > endText) return false
  if (shop.closeDate && shop.closeDate < startText) return false
  return true
}

export const fallbackRule = (rules: DistributionRule[], shop: Shop) => rules.find(rule =>
  rule.companyId === shop.companyId && rule.agentId === shop.agentId && rule.shopTypeId === shop.shopTypeId && rule.effectiveDate <= shop.openDate && (!rule.expireDate || rule.expireDate >= shop.openDate)
)

export function calculateRent(shop: Shop, month: string, rules: DistributionRule[]) {
  if (!isAliveInMonth(shop, month)) return { rent: 0, mode: shop.mode, reason: '该月无存活天数，不参与结算', ruleVersion: '-' }
  if (shop.mode === 'head_fee' && shop.openDate.slice(0, 7) !== month) return { rent: 0, mode: shop.mode, reason: '砍头模式仅在首月结算', ruleVersion: '-' }
  const rule = fallbackRule(rules, shop)
  return { rent: rule?.amount ?? shop.monthlyRent, mode: rule?.mode ?? shop.mode, reason: rule ? '规则命中的存活店铺' : '使用店铺默认月租', ruleVersion: rule ? 'v' + rule.version : 'default' }
}

export const modeLabel = (mode: SettlementMode) => mode === 'head_fee' ? '砍头' : '按月'
