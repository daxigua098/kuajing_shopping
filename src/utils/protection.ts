interface ShopProtectionRecord {
  openDate: string
  protectionPeriodMonths?: number
}

export const protectionMonthDistance = (openDate: string, targetMonth: string) => {
  const [openYear, openMonth] = openDate.slice(0, 7).split('-').map(Number)
  const [targetYear, targetMonthNumber] = targetMonth.split('-').map(Number)
  return (targetYear - openYear) * 12 + (targetMonthNumber - openMonth)
}

export const isShopInProtection = (shop: ShopProtectionRecord, targetMonth: string) => {
  const months = shop.protectionPeriodMonths || 0
  if (months <= 0) return false
  const distance = protectionMonthDistance(shop.openDate, targetMonth)
  return distance >= 0 && distance < months
}