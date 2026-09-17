export type ShopDateFilterMode = 'all' | 'open' | 'close'

interface ShopDateRecord {
  openDate: string
  closeDate: string | null
}

export function matchesShopDateRange(shop: ShopDateRecord, mode: ShopDateFilterMode, from: string, to: string) {
  const dates = mode === 'open'
    ? [shop.openDate]
    : mode === 'close'
      ? [shop.closeDate]
      : [shop.openDate, shop.closeDate]

  return dates.some(date => Boolean(date) && (!from || String(date) >= from) && (!to || String(date) <= to))
}