export type Role = 'platform' | 'company' | 'top_agent' | 'sub_agent'
export type Status = 'active' | 'disabled' | 'pending'
export type ShopStatus = 'operating' | 'paused' | 'closed' | 'preparing'
export type SettlementMode = 'monthly' | 'head_fee'
export type CompanySettlementMode = 'one_time' | 'monthly'
export type ThemeId = 1 | 2 | 3 | 4
export type Language = 'zh' | 'en' | 'ms' | 'th' | 'vi'

export interface UserAccount {
  id: string
  name: string
  username: string
  demoPassword: string
  role: Role
  companyId?: string
  agentId?: string
  roleLabel: string
  initials: string
  language: Language
}

export interface Company {
  id: string
  name: string
  region: string
  shopCodeRule: string
  status: Status
  contact: string
  createdAt: string
}

export interface Agent {
  id: string
  name: string
  parentId: string | null
  level: number
  agentType: 'top' | 'sub'
  companyIds: string[]
  contact: string
  status: Status
  createdAt: string
}

export type OwnerBusinessStatus = 'not_opened' | 'opened' | 'dead_shop' | 'invalid'
export type OwnerSubmissionStatus = 'pending_top' | 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Owner {
  id: string
  name: string
  phone: string
  email: string
  agentId: string
  companyId: string
  loginEmail: string
  icNumber?: string
  bankAccount: string
  bankCardNumber?: string
  bankCvv?: string
  bankExpiry?: string
  bankHolder: string
  bankName: string
  idCardFront?: string
  idCardBack?: string
  bankCardPhoto?: string
  bankCardBack?: string
  shopOpenProof?: string
  shopCloseProof?: string
  remark?: string
  isInvalid?: boolean
  status: Status
  createdAt: string
}

export interface OwnerSubmission {
  id: string
  ownerId: string
  fromAgentId: string
  companyId: string
  shopTypeId: string
  status: OwnerSubmissionStatus
  submittedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  remark: string
}

export interface CompanyShopType {
  id: string
  companyId: string
  name: string
  platformCode: string
  currency: string
  status: 'active' | 'disabled'
  remark: string
  createdAt: string
}

export interface ShopType {
  id: string
  name: string
  defaultRent: number
  currency: string
}

export interface Shop {
  id: string
  code: string
  name: string
  region: string
  companyId: string
  ownerId: string
  agentId: string
  shopTypeId: string
  status: ShopStatus
  openDate: string
  closeDate: string | null
  taskId: string | null
  mode: SettlementMode
  monthlyRent: number
  openingFee?: number
  openProof?: string
  closeProof?: string
  trafficCardNumber?: string
  trafficCardExpiryDate?: string | null
  protectionPeriodId?: string
  protectionPeriodName?: string
  protectionPeriodMonths?: number
  createdAt: string
}

export interface ProtectionPeriodTemplate {
  id: string
  companyId: string
  name: string
  months: number
  status: 'active' | 'disabled'
  remark: string
  createdAt: string
  updatedAt: string
}

export interface CompanySettlementTemplate {
  id: string
  companyId: string
  name: string
  mode: CompanySettlementMode
  amount: number
  currency: string
  status: 'active' | 'disabled'
  remark: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface CompanySettlementConfig {
  id: string
  companyId: string
  shopId: string
  mode: CompanySettlementMode
  amount: number
  currency: string
  templateId: string
  templateName: string
  effectiveMonth: string
  status: 'active' | 'disabled'
  remark: string
  updatedAt: string
  updatedBy: string
}

export interface OpenTask {
  id: string
  title: string
  companyId: string
  shopTypeId: string
  quantity: number
  region: string
  reward: number
  mode: SettlementMode
  deadline: string
  status: 'open' | 'claimed' | 'completed'
  claimedBy: string | null
  completed: number
  createdAt: string
}

export interface DistributionRule {
  id: string
  companyId: string
  agentId: string
  shopTypeId: string
  amount: number
  currency: string
  mode: SettlementMode
  effectiveDate: string
  expireDate: string | null
  version: number
  remark: string
}

export interface ShopExpense {
  id: string
  shopId: string
  companyId: string
  advanceAgentId: string
  expenseDate: string
  expenseMonth: string
  purpose: string
  amount: number
  currency: string
  attachment: string
  status: 'pending' | 'settled' | 'rejected'
  remark: string
}

export interface SettlementBatch {
  id: string
  month: string
  createdAt: string
  createdBy: string
  status: 'draft' | 'confirmed' | 'paid'
  shopCount: number
  rentTotal: number
  expenseTotal: number
  payableTotal: number
  ruleVersion: string
  confirmedAt: string | null
  paidAt: string | null
  note: string
}

export interface SettlementDetail {
  id: string
  batchId: string
  shopId: string
  companyId: string
  agentId: string
  ownerId: string
  mode: SettlementMode
  rent: number
  expense: number
  status: 'draft' | 'confirmed' | 'paid'
  reason: string
}

export interface AuditLog {
  id: string
  action: string
  target: string
  operator: string
  role: string
  createdAt: string
  detail: string
}

export interface AppState {
  currentUserId: string | null
  language: Language
  theme: ThemeId
  companies: Company[]
  agents: Agent[]
  owners: Owner[]
  ownerSubmissions: OwnerSubmission[]
  shopTypes: ShopType[]
  companyShopTypes: CompanyShopType[]
  shops: Shop[]
  companySettlementConfigs: CompanySettlementConfig[]
  companySettlementTemplates: CompanySettlementTemplate[]
  protectionPeriods: ProtectionPeriodTemplate[]
  tasks: OpenTask[]
  rules: DistributionRule[]
  expenses: ShopExpense[]
  settlementBatches: SettlementBatch[]
  settlementDetails: SettlementDetail[]
  auditLogs: AuditLog[]
}
