import type { ShopStatus } from '@/types'

export const statusAfterCloseDateChange = (closeDate: string | null): ShopStatus => closeDate ? 'closed' : 'operating'
