export type SettlementExportFieldKey =
  | 'shopCode'
  | 'shopName'
  | 'ownerName'
  | 'openDate'
  | 'shopStatus'
  | 'closeDate'
  | 'company'
  | 'region'
  | 'protectionPeriod'
  | 'settlementMode'
  | 'rent'
  | 'expense'
  | 'payable'
  | 'agent'
  | 'billingReason'

export interface SettlementExportFieldOption {
  key: SettlementExportFieldKey
  label: string
  selected: boolean
  default: boolean
}

export const defaultSettlementExportFieldKeys: SettlementExportFieldKey[] = [
  'shopCode',
  'shopName',
  'ownerName',
  'openDate',
  'shopStatus',
]

const options: Array<Omit<SettlementExportFieldOption, 'selected' | 'default'>> = [
  { key: 'shopCode', label: '店铺编号' },
  { key: 'shopName', label: '店铺名称' },
  { key: 'ownerName', label: '人头名字' },
  { key: 'openDate', label: '开店日期' },
  { key: 'shopStatus', label: '状态' },
  { key: 'closeDate', label: '封店日期' },
  { key: 'company', label: '公司' },
  { key: 'region', label: '地区' },
  { key: 'protectionPeriod', label: '店铺保护期' },
  { key: 'settlementMode', label: '结算模式' },
  { key: 'rent', label: '店租' },
  { key: 'expense', label: '杂费' },
  { key: 'payable', label: '应结金额' },
  { key: 'agent', label: '代理' },
  { key: 'billingReason', label: '计费口径' },
]

export const createSettlementExportFields = (): SettlementExportFieldOption[] => options.map(field => ({
  ...field,
  selected: defaultSettlementExportFieldKeys.includes(field.key),
  default: defaultSettlementExportFieldKeys.includes(field.key),
}))