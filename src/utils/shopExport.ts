export type ShopExportFieldKey =
  | 'name'
  | 'owner'
  | 'agent'
  | 'shopType'
  | 'openDate'
  | 'settlementMode'
  | 'closeDate'
  | 'shopId'
  | 'code'
  | 'company'
  | 'region'
  | 'status'
  | 'settlementAmount'
  | 'openingFee'
  | 'icNumber'
  | 'bankAccount'
  | 'openProof'
  | 'closeProof'
  | 'trafficCardNumber'
  | 'trafficCardExpiryDate'

export interface ShopExportFieldOption {
  key: ShopExportFieldKey
  label: string
  selected: boolean
  default: boolean
}

export const defaultShopExportFieldKeys: ShopExportFieldKey[] = [
  'name',
  'owner',
  'agent',
  'shopType',
  'openDate',
  'settlementMode',
  'closeDate',
]

const shopExportFieldOptions: Array<Omit<ShopExportFieldOption, 'selected' | 'default'>> = [
  { key: 'name', label: '店铺名称' },
  { key: 'owner', label: '人头' },
  { key: 'agent', label: '代理' },
  { key: 'shopType', label: '店铺类型' },
  { key: 'openDate', label: '开店时间' },
  { key: 'settlementMode', label: '结算模式' },
  { key: 'closeDate', label: '封店日期' },
  { key: 'shopId', label: '店铺ID' },
  { key: 'code', label: '店铺编号' },
  { key: 'company', label: '公司' },
  { key: 'region', label: '地区' },
  { key: 'status', label: '状态' },
  { key: 'settlementAmount', label: '结算金额 / 月租' },
  { key: 'openingFee', label: '开店费' },
  { key: 'icNumber', label: 'IC 卡号' },
  { key: 'bankAccount', label: '银行卡号' },
  { key: 'openProof', label: '开店成功截图' },
  { key: 'closeProof', label: '关店/封店截图' },
  { key: 'trafficCardNumber', label: '流量卡号码' },
  { key: 'trafficCardExpiryDate', label: '流量卡到期续费日期' },
]

export const createShopExportFields = (): ShopExportFieldOption[] => shopExportFieldOptions.map(field => ({
  ...field,
  selected: defaultShopExportFieldKeys.includes(field.key),
  default: defaultShopExportFieldKeys.includes(field.key),
}))