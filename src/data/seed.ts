import type { AppState, AuditLog, SystemSettings, Agent, Company, CompanySettlementConfig, CompanySettlementTemplate, CompanyShopType, ProtectionPeriodTemplate, DistributionRule, OpenTask, Owner, OwnerSubmission, SettlementBatch, SettlementDetail, Shop, ShopExpense, ShopType, UserAccount } from '@/types'

export const users: UserAccount[] = [
  { id: 'u1', name: '林泽宇', username: 'admin', demoPassword: 'Admin@123456', role: 'platform', roleLabel: '平台管理员', initials: '林', language: 'zh' },
  { id: 'u2', name: '周雅雯', username: 'company', demoPassword: 'Company@123456', role: 'company', companyId: 'c1', roleLabel: '公司负责人', initials: '周', language: 'zh' },
  { id: 'u3', name: '陈俊豪', username: 'topagent', demoPassword: 'Top@123456', role: 'top_agent', agentId: 'a1', roleLabel: '顶级代理', initials: '陈', language: 'zh' },
  { id: 'u4', name: 'Aiman', username: 'subagent', demoPassword: 'Sub@123456', role: 'sub_agent', agentId: 'a3', roleLabel: '子代理', initials: 'A', language: 'zh' },
  { id: 'u5', name: 'Alex Lim', username: 'company2', demoPassword: 'Company2@123456', role: 'company', companyId: 'c2', roleLabel: '公司负责人 B', initials: 'AL', language: 'zh' },
]

const companies: Company[] = [
  { id: 'c1', name: '兰卡威优选', region: '马来西亚 · 吉隆坡', shopCodeRule: 'MY-LKW-0001', status: 'active', contact: '周雅雯', createdAt: '2025-11-12' },
  { id: 'c2', name: '海风跨境', region: '马来西亚 · 槟城', shopCodeRule: 'MY-HF-0001', status: 'active', contact: 'Alex Lim', createdAt: '2025-12-03' },
  { id: 'c3', name: '南洋云店', region: '新加坡', shopCodeRule: 'SG-NY-0001', status: 'active', contact: 'Joanne Tan', createdAt: '2026-01-18' },
  { id: 'c4', name: '泰享贸易', region: '泰国 · 曼谷', shopCodeRule: 'TH-TX-0001', status: 'active', contact: 'Narin', createdAt: '2026-03-21' },
  { id: 'c5', name: '越海商服', region: '越南 · 胡志明市', shopCodeRule: 'VN-YH-0001', status: 'pending', contact: 'Minh Anh', createdAt: '2026-07-09' },
]

const agents: Agent[] = [
  { id: 'a1', name: '南洋星链', parentId: null, level: 1, agentType: 'top', companyIds: ['c1', 'c2', 'c3'], contact: '陈俊豪', status: 'active', createdAt: '2025-11-20' },
  { id: 'a2', name: 'WinaTeam', parentId: 'a1', level: 2, agentType: 'sub', companyIds: ['c1', 'c2'], contact: 'Wina', status: 'active', createdAt: '2025-12-10' },
  { id: 'a3', name: 'Aiman Hub', parentId: 'a1', level: 2, agentType: 'sub', companyIds: ['c1', 'c3'], contact: 'Aiman', status: 'active', createdAt: '2026-01-05' },
  { id: 'a4', name: 'Siti Retail', parentId: 'a1', level: 2, agentType: 'sub', companyIds: ['c1'], contact: 'Siti', status: 'active', createdAt: '2026-02-16' },
  { id: 'a5', name: 'Lee Commerce', parentId: 'a2', level: 3, agentType: 'sub', companyIds: ['c1'], contact: 'Lee', status: 'active', createdAt: '2026-03-08' },
  { id: 'a6', name: 'Tan Growth', parentId: 'a2', level: 3, agentType: 'sub', companyIds: ['c1', 'c2'], contact: 'Tan', status: 'active', createdAt: '2026-04-12' },
  { id: 'a7', name: 'Nadia Partners', parentId: 'a3', level: 3, agentType: 'sub', companyIds: ['c1'], contact: 'Nadia', status: 'active', createdAt: '2026-05-19' },
  { id: 'a8', name: 'Iman Shop', parentId: 'a4', level: 3, agentType: 'sub', companyIds: ['c1'], contact: 'Iman', status: 'pending', createdAt: '2026-08-22' },
  { id: 'a9', name: '海纳联盟', parentId: null, level: 1, agentType: 'top', companyIds: ['c2', 'c4'], contact: 'Narin', status: 'active', createdAt: '2026-05-08' },
  { id: 'a10', name: 'Narin Team', parentId: 'a9', level: 2, agentType: 'sub', companyIds: ['c2'], contact: 'Pornchai', status: 'active', createdAt: '2026-05-20' },
  { id: 'a11', name: 'Jesselton Partners', parentId: 'a1', level: 2, agentType: 'sub', companyIds: ['c1', 'c2', 'c3'], contact: 'Jason Lee', status: 'active', createdAt: '2026-03-12' },
  { id: 'a12', name: 'KL Growth Hub', parentId: 'a1', level: 2, agentType: 'sub', companyIds: ['c1'], contact: 'Mei Ling', status: 'active', createdAt: '2026-03-18' },
  { id: 'a13', name: 'Johor Retail Network', parentId: 'a1', level: 2, agentType: 'sub', companyIds: ['c2', 'c3'], contact: 'Hafiz Rahman', status: 'active', createdAt: '2026-04-02' },
  { id: 'a14', name: 'Penang Commerce', parentId: 'a1', level: 2, agentType: 'sub', companyIds: ['c1', 'c3'], contact: 'Wei Jian', status: 'active', createdAt: '2026-04-16' },
  { id: 'a15', name: 'Sabah Digital', parentId: 'a1', level: 2, agentType: 'sub', companyIds: ['c1'], contact: 'Aina Musa', status: 'active', createdAt: '2026-05-03' },
  { id: 'a16', name: 'Melaka Retail Lab', parentId: 'a1', level: 2, agentType: 'sub', companyIds: ['c1', 'c2'], contact: 'Farid Ismail', status: 'active', createdAt: '2026-06-11' },
  { id: 'a17', name: 'Johor Field Team', parentId: 'a13', level: 3, agentType: 'sub', companyIds: ['c2'], contact: 'Nora', status: 'active', createdAt: '2026-06-25' },
]

const shopTypes: ShopType[] = [
  { id: 'st1', name: 'Lazada 本地店', defaultRent: 280, currency: 'MYR' },
  { id: 'st2', name: 'Shopee 跨境店', defaultRent: 320, currency: 'MYR' },
  { id: 'st3', name: 'TikTok Shop', defaultRent: 360, currency: 'MYR' },
  { id: 'st4', name: 'Temu 半托管', defaultRent: 300, currency: 'MYR' },
]

const demoImage = (label: string, color: string) => 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560"><rect width="900" height="560" rx="32" fill="' + color + '"/><rect x="38" y="38" width="824" height="484" rx="22" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.55)" stroke-width="3"/><text x="450" y="270" text-anchor="middle" font-size="46" font-family="Arial" font-weight="700" fill="white">' + label + '</text><text x="450" y="325" text-anchor="middle" font-size="22" font-family="Arial" fill="rgba(255,255,255,.78)">FenFlow Demo Attachment</text></svg>')
const ownerNames = ['Nurul Aisyah', 'Muhammad Hakim', 'Chong Mei Ling', 'Arun Kumar', 'Siti Rahmah', 'Tan Wei Jie', 'Farah Nabila', 'Kelvin Ooi', 'Nguyen Minh', 'Pornchai S.', 'Joanne Lim', 'Hafiz Rahman', 'Ivy Chen', 'Daniel Wong', 'Ahmad Faiz', 'Lim Shu Hui', 'Kavitha R.', 'Mohd Zaki', 'Chloe Ng', 'Rizal Hamzah', 'Preeya S.', 'Vu Minh Duc', 'Sarah Tan', 'Amirul Hakim']
const companyShopTypes: CompanyShopType[] = companies.flatMap((company, companyIndex) => shopTypes.map((type, typeIndex) => ({
  id: company.id + '-' + type.id,
  companyId: company.id,
  name: type.name,
  platformCode: ['LAZADA', 'SHOPEE', 'TIKTOK', 'TEMU'][typeIndex],
  currency: type.currency,
  status: 'active',
  remark: company.name + '运营平台',
  createdAt: '2026-01-01',
})))

const protectionPeriodPresets = [
  { name: '1个月保护期', months: 1, remark: '新店首月保护' },
  { name: '3个月保护期', months: 3, remark: '新店前 3 个月保护' },
  { name: '6个月保护期', months: 6, remark: '新店前 6 个月保护' },
]
const protectionPeriods: ProtectionPeriodTemplate[] = companies.flatMap(company => protectionPeriodPresets.map(preset => ({
  id: 'cpp-' + company.id + '-' + preset.months,
  companyId: company.id,
  name: preset.name,
  months: preset.months,
  status: 'active',
  remark: company.name + ' · ' + preset.remark,
  createdAt: '2026-01-01',
  updatedAt: '2026-09-01 09:00',
})))

const owners: Owner[] = ownerNames.map((name, i) => ({
  id: 'o' + (i + 1),
  name,
  phone: '+60 1' + (2 + (i % 8)) + '-3' + String(1000000 + i * 731).slice(-6),
  email: 'owner' + (i + 1) + '@example.my',
  agentId: ['a1', 'a2', 'a3', 'a4', 'a11', 'a12', 'a13', 'a14', 'a15', 'a16', 'a5', 'a7'][i % 12],
  companyId: ['c1', 'c1', 'c1', 'c2', 'c3'][i % 5],
  loginEmail: 'shop' + (i + 1) + '@login.my',
  icNumber: '90010' + String(i % 10) + '-10-' + String(1000 + i * 37).slice(-4),
  bankAccount: '02' + String(950299220 + i * 137911).slice(-9),
  bankCardNumber: '4678' + String(515026000000 + i * 7919).slice(-12),
  bankCvv: String(100 + (i * 37) % 900),
  bankExpiry: String(10 + (i % 3)).padStart(2, '0') + '/' + (30 + (i % 5)),
  bankHolder: name.toUpperCase(),
  bankName: i % 2 ? 'Maybank' : 'CIMB Bank',
  idCardFront: i === 0 ? demoImage('IC CARD · FRONT', '#0d8a7f') : '',
  idCardBack: i === 0 ? demoImage('IC CARD · BACK', '#146b7a') : '',
  bankCardPhoto: i === 0 ? demoImage('BANK CARD · FRONT', '#385b87') : '',
  bankCardBack: i === 0 ? demoImage('BANK CARD · BACK', '#304b70') : '',
  shopOpenProof: i === 0 ? demoImage('SHOP OPENED', '#2f8b62') : '',
  shopCloseProof: i === 0 ? demoImage('SHOP CLOSED', '#8a5b44') : '',
  remark: i % 4 === 0 ? '资料已由代理初步核验，纸质原件留存于运营档案。' : '',
  isInvalid: false,
  status: i === 12 ? 'pending' : 'active',
  createdAt: '2026-0' + (1 + (i % 7)) + '-' + String(4 + i).padStart(2, '0'),
}))

const shops: Shop[] = Array.from({ length: 24 }, (_, i) => {
  const owner = owners[i % owners.length]
  const type = shopTypes[i % shopTypes.length]
  const openMonth = 1 + (i % 8)
  const closed = [6, 7, 12, 19, 21].includes(i)
  const closeMonth = Math.min(12, openMonth + 1 + (i % 2))
  return {
    id: 's' + (i + 1),
    code: (owner.companyId === 'c1' ? 'MY-LKW-' : owner.companyId === 'c2' ? 'MY-HF-' : 'SG-NY-') + String(1001 + i).padStart(4, '0'),
    name: ['海湾生活馆', '南星好物', '槟城热卖', '南洋家居', '热带美妆', '跨境数码', '悠然食品', '城市百货'][i % 8] + ' ' + (i + 1),
    region: ['吉隆坡', '槟城', '新山', '新加坡', '曼谷'][i % 5],
    companyId: owner.companyId,
    ownerId: owner.id,
    agentId: owner.agentId,
    shopTypeId: owner.companyId + '-' + type.id,
    status: closed ? 'closed' : i === 18 ? 'paused' : 'operating',
    openDate: '2026-' + String(openMonth).padStart(2, '0') + '-' + String(3 + (i % 20)).padStart(2, '0'),
    closeDate: closed ? '2026-' + String(closeMonth).padStart(2, '0') + '-' + String(5 + (i % 9)).padStart(2, '0') : null,
    taskId: i < 10 ? 't' + ((i % 3) + 1) : null,
    mode: i % 5 === 0 ? 'head_fee' : 'monthly',
    monthlyRent: type.defaultRent + (i % 4) * 20,
    trafficCardNumber: i % 5 === 0 ? '' : 'MYTC-' + String(8801000 + i),
    trafficCardExpiryDate: i % 5 === 0 ? null : '2026-' + String(9 + (i % 3)).padStart(2, '0') + '-' + String(5 + (i % 20)).padStart(2, '0'),
    protectionPeriodMonths: i % 6 === 0 ? 1 : i % 4 === 0 ? 3 : i % 9 === 0 ? 6 : 0,
    protectionPeriodId: (i % 6 === 0 ? 1 : i % 4 === 0 ? 3 : i % 9 === 0 ? 6 : 0) ? 'cpp-' + owner.companyId + '-' + (i % 6 === 0 ? 1 : i % 4 === 0 ? 3 : 6) : '',
    protectionPeriodName: (i % 6 === 0 ? 1 : i % 4 === 0 ? 3 : i % 9 === 0 ? 6 : 0) ? (i % 6 === 0 ? '1个月保护期' : i % 4 === 0 ? '3个月保护期' : '6个月保护期') : '无保护期',
    createdAt: '2026-01-05',
  }
})

owners.push({
  id: 'o25',
  name: 'PHANG YI SHENG',
  phone: '0143220688',
  email: 'phangyisheng8484@gmail.com',
  agentId: 'a1',
  companyId: '',
  loginEmail: '',
  icNumber: '000610-13-0495',
  bankAccount: '02950299220',
  bankCardNumber: '4678 5150 2635 8515',
  bankCvv: '656',
  bankExpiry: '11/32',
  bankHolder: 'PHANG YI SHENG',
  bankName: 'Hong Leong Bank',
  idCardFront: '',
  idCardBack: '',
  bankCardPhoto: '',
  bankCardBack: '',
  shopOpenProof: '',
  shopCloseProof: '',
  remark: '待提交给公司开店的完整人头资料。',
  isInvalid: false,
  status: 'active',
  createdAt: '2026-09-17',
}, {
  id: 'o26', name: 'LI WEI MING', phone: '0168888201', email: 'liweiming@example.my', agentId: 'a11', companyId: '', loginEmail: '', icNumber: '950312-14-8821', bankAccount: '02950008821', bankCardNumber: '4678 5150 2635 1001', bankCvv: '221', bankExpiry: '08/32', bankHolder: 'LI WEI MING', bankName: 'Maybank', idCardFront: '', idCardBack: '', bankCardPhoto: '', bankCardBack: '', shopOpenProof: '', shopCloseProof: '', remark: '等待公司审核，审核前可以取消并改投。', isInvalid: false, status: 'active', createdAt: '2026-09-15',
}, {
  id: 'o27', name: 'SITI NURHALIZA', phone: '0177776302', email: 'sitinurhaliza@example.my', agentId: 'a13', companyId: '', loginEmail: '', icNumber: '980821-01-3345', bankAccount: '02950003345', bankCardNumber: '4678 5150 2635 1002', bankCvv: '332', bankExpiry: '09/33', bankHolder: 'SITI NURHALIZA', bankName: 'CIMB Bank', idCardFront: '', idCardBack: '', bankCardPhoto: '', bankCardBack: '', shopOpenProof: '', shopCloseProof: '', remark: '等待公司审核的开店人头。', isInvalid: false, status: 'active', createdAt: '2026-09-16',
}, {
  id: 'o28', name: 'RAJESH KUMAR', phone: '0192224403', email: 'rajeshkumar@example.my', agentId: 'a15', companyId: '', loginEmail: '', icNumber: '910505-10-7788', bankAccount: '02950007788', bankCardNumber: '4678 5150 2635 1003', bankCvv: '443', bankExpiry: '10/34', bankHolder: 'RAJESH KUMAR', bankName: 'RHB Bank', idCardFront: '', idCardBack: '', bankCardPhoto: '', bankCardBack: '', shopOpenProof: '', shopCloseProof: '', remark: '等待公司审核的开店人头。', isInvalid: false, status: 'active', createdAt: '2026-09-16',
})

const pendingOwnerProfiles = [
  { id: 'o29', name: 'TAN MEI FANG', phone: '0123456789', email: 'tanmeifang@example.my', agentId: 'a2', icNumber: '920418-10-2211', bankAccount: '02950002211', bankCardNumber: '4678 5150 2635 1004', bankCvv: '514', bankExpiry: '12/34', bankName: 'Public Bank', remark: '等待兰卡威优选审核 Shopee 店铺。', createdAt: '2026-09-17' },
  { id: 'o30', name: 'MUHAMMAD IRFAN', phone: '0134567890', email: 'muhammadirfan@example.my', agentId: 'a3', icNumber: '940726-14-5522', bankAccount: '02950005522', bankCardNumber: '4678 5150 2635 1005', bankCvv: '625', bankExpiry: '01/35', bankName: 'Bank Islam', remark: '等待兰卡威优选审核 Temu 店铺。', createdAt: '2026-09-17' },
  { id: 'o31', name: 'GRACE WONG', phone: '0145678901', email: 'gracewong@example.my', agentId: 'a11', icNumber: '960903-10-6633', bankAccount: '02950006633', bankCardNumber: '4678 5150 2635 1006', bankCvv: '736', bankExpiry: '02/35', bankName: 'Hong Leong Bank', remark: '等待海风跨境审核 Lazada 店铺。', createdAt: '2026-09-17' },
  { id: 'o32', name: 'NUR AMIRA', phone: '0156789012', email: 'nuramira@example.my', agentId: 'a4', icNumber: '990115-01-7744', bankAccount: '02950007744', bankCardNumber: '4678 5150 2635 1007', bankCvv: '847', bankExpiry: '03/35', bankName: 'CIMB Bank', remark: '等待兰卡威优选审核 Shopee 店铺。', createdAt: '2026-09-17' },
  { id: 'o33', name: 'VU HOANG NAM', phone: '0167890123', email: 'vuhoangnam@example.vn', agentId: 'a13', icNumber: '930228-13-8855', bankAccount: '02950008855', bankCardNumber: '4678 5150 2635 1008', bankCvv: '958', bankExpiry: '04/35', bankName: 'OCBC Bank', remark: '等待南洋云店审核 Temu 店铺。', createdAt: '2026-09-17' },
  { id: 'o34', name: 'KARTHIK RAJ', phone: '0178901234', email: 'karthikraj@example.my', agentId: 'a15', icNumber: '950612-10-9966', bankAccount: '02950009966', bankCardNumber: '4678 5150 2635 1009', bankCvv: '169', bankExpiry: '05/35', bankName: 'RHB Bank', remark: '等待海风跨境审核 TikTok 店铺。', createdAt: '2026-09-17' },
]
owners.push(...pendingOwnerProfiles.map((profile): Owner => ({
  ...profile,
  companyId: '',
  loginEmail: '',
  bankHolder: profile.name,
  idCardFront: '',
  idCardBack: '',
  bankCardPhoto: '',
  bankCardBack: '',
  shopOpenProof: '',
  shopCloseProof: '',
  isInvalid: false,
  status: 'active',
})))
const ownerSubmissions: OwnerSubmission[] = shops.map((shop, i) => ({
  id: 'os' + (i + 1),
  ownerId: shop.ownerId,
  fromAgentId: shop.agentId,
  companyId: shop.companyId,
  shopTypeId: shop.shopTypeId,
  status: 'approved',
  submittedAt: '2026-0' + (1 + (i % 8)) + '-05',
  reviewedAt: '2026-0' + (1 + (i % 8)) + '-06',
  reviewedBy: companies.find(company => company.id === shop.companyId)?.contact || '公司审核人',
  remark: shop.status === 'closed' ? '已开店后关店，保留历史记录' : '已审核，公司负责开店',
}))
ownerSubmissions.push(
  { id: 'os-p1', ownerId: 'o26', fromAgentId: 'a11', companyId: 'c1', shopTypeId: 'c1-st1', status: 'pending', submittedAt: '2026-09-15 10:20', reviewedAt: null, reviewedBy: null, remark: '等待兰卡威优选审核' },
  { id: 'os-p2', ownerId: 'o27', fromAgentId: 'a13', companyId: 'c1', shopTypeId: 'c1-st3', status: 'pending', submittedAt: '2026-09-16 09:40', reviewedAt: null, reviewedBy: null, remark: '等待兰卡威优选审核 TikTok 店铺' },
  { id: 'os-p3', ownerId: 'o28', fromAgentId: 'a15', companyId: 'c2', shopTypeId: 'c2-st2', status: 'pending', submittedAt: '2026-09-16 15:15', reviewedAt: null, reviewedBy: null, remark: '等待海风跨境审核 Shopee 店铺' },
  { id: 'os-p4', ownerId: 'o29', fromAgentId: 'a2', companyId: 'c1', shopTypeId: 'c1-st2', status: 'pending', submittedAt: '2026-09-17 09:10', reviewedAt: null, reviewedBy: null, remark: '等待兰卡威优选审核 Shopee 店铺' },
  { id: 'os-p5', ownerId: 'o30', fromAgentId: 'a3', companyId: 'c1', shopTypeId: 'c1-st4', status: 'pending', submittedAt: '2026-09-17 09:35', reviewedAt: null, reviewedBy: null, remark: '等待兰卡威优选审核 Temu 店铺' },
  { id: 'os-p6', ownerId: 'o31', fromAgentId: 'a11', companyId: 'c2', shopTypeId: 'c2-st1', status: 'pending', submittedAt: '2026-09-17 10:05', reviewedAt: null, reviewedBy: null, remark: '等待海风跨境审核 Lazada 店铺' },
  { id: 'os-p7', ownerId: 'o32', fromAgentId: 'a4', companyId: 'c1', shopTypeId: 'c1-st2', status: 'pending', submittedAt: '2026-09-17 10:40', reviewedAt: null, reviewedBy: null, remark: '等待兰卡威优选审核 Shopee 店铺' },
  { id: 'os-p8', ownerId: 'o33', fromAgentId: 'a13', companyId: 'c3', shopTypeId: 'c3-st4', status: 'pending', submittedAt: '2026-09-17 11:15', reviewedAt: null, reviewedBy: null, remark: '等待南洋云店审核 Temu 店铺' },
  { id: 'os-p9', ownerId: 'o34', fromAgentId: 'a15', companyId: 'c2', shopTypeId: 'c2-st3', status: 'pending', submittedAt: '2026-09-17 11:45', reviewedAt: null, reviewedBy: null, remark: '等待海风跨境审核 TikTok 店铺' },
)

const companySettlementTemplates: CompanySettlementTemplate[] = companies.flatMap((company, companyIndex) => shopTypes.flatMap(type => [
  {
    id: 'cst-' + company.id + '-' + type.id + '-one',
    companyId: company.id,
    name: type.name + ' · 一次性标准',
    mode: 'one_time',
    amount: type.defaultRent * 3 + 180 + companyIndex * 120,
    currency: type.currency,
    status: 'active',
    remark: company.name + '独立的一次性开店结算分类',
    createdAt: '2026-01-10',
    updatedAt: '2026-09-01 09:00',
    createdBy: company.contact,
  },
  {
    id: 'cst-' + company.id + '-' + type.id + '-monthly',
    companyId: company.id,
    name: type.name + ' · 按月标准',
    mode: 'monthly',
    amount: type.defaultRent - 20 + companyIndex * 10,
    currency: type.currency,
    status: 'active',
    remark: company.name + '独立的按月结算分类',
    createdAt: '2026-01-10',
    updatedAt: '2026-09-01 09:00',
    createdBy: company.contact,
  },
]))

const companySettlementConfigs: CompanySettlementConfig[] = shops.map((shop, i) => {
  const type = companyShopTypes.find(item => item.id === shop.shopTypeId)!
  const oneTime = i % 4 === 0
  const template = companySettlementTemplates.find(item => item.companyId === shop.companyId && item.mode === (oneTime ? 'one_time' : 'monthly') && item.name.startsWith(type.name))
  return {
    id: 'csc' + (i + 1),
    companyId: shop.companyId,
    shopId: shop.id,
    templateId: template?.id || '',
    templateName: template?.name || '',
    mode: template?.mode || (oneTime ? 'one_time' : 'monthly'),
    amount: template?.amount || (oneTime ? 900 : 300),
    currency: type.currency,
    effectiveMonth: shop.openDate.slice(0, 7),
    status: 'active',
    remark: oneTime ? '公司一次性开店结算' : '公司按月结算',
    updatedAt: '2026-09-01 09:00',
    updatedBy: companies.find(company => company.id === shop.companyId)?.contact || '公司负责人',
  }
})

const tasks: OpenTask[] = [
  { id: 't1', title: 'Lazada 马来西亚本地店 · 8月批次', companyId: 'c1', shopTypeId: 'st1', quantity: 20, region: '吉隆坡/槟城', reward: 320, mode: 'monthly', deadline: '2026-10-15', status: 'claimed', claimedBy: 'a1', completed: 13, createdAt: '2026-09-01' },
  { id: 't2', title: 'TikTok Shop 美妆类目开店', companyId: 'c1', shopTypeId: 'st3', quantity: 12, region: '新山', reward: 480, mode: 'head_fee', deadline: '2026-09-28', status: 'claimed', claimedBy: 'a3', completed: 7, createdAt: '2026-08-26' },
  { id: 't3', title: 'Shopee 跨境店扩量', companyId: 'c2', shopTypeId: 'st2', quantity: 30, region: '马来西亚', reward: 350, mode: 'monthly', deadline: '2026-10-31', status: 'open', claimedBy: null, completed: 0, createdAt: '2026-09-08' },
  { id: 't4', title: '新加坡 Temu 半托管店', companyId: 'c3', shopTypeId: 'c3-st4', quantity: 8, region: '新加坡', reward: 520, mode: 'monthly', deadline: '2026-10-10', status: 'open', claimedBy: null, completed: 2, createdAt: '2026-09-10' },
]

const rules: DistributionRule[] = [
  { id: 'r1', companyId: 'c1', agentId: 'a1', shopTypeId: 'st1', amount: 280, currency: 'MYR', mode: 'monthly', effectiveDate: '2026-01-01', expireDate: null, version: 12, remark: '2026 年店租标准' },
  { id: 'r2', companyId: 'c1', agentId: 'a2', shopTypeId: 'st1', amount: 240, currency: 'MYR', mode: 'monthly', effectiveDate: '2026-01-01', expireDate: null, version: 8, remark: '顶级代理 → WinaTeam' },
  { id: 'r3', companyId: 'c1', agentId: 'a3', shopTypeId: 'st1', amount: 210, currency: 'MYR', mode: 'monthly', effectiveDate: '2026-02-01', expireDate: null, version: 5, remark: '顶级代理 → Aiman Hub' },
  { id: 'r4', companyId: 'c1', agentId: 'a5', shopTypeId: 'st1', amount: 180, currency: 'MYR', mode: 'monthly', effectiveDate: '2026-03-01', expireDate: null, version: 4, remark: 'WinaTeam → Lee Commerce' },
  { id: 'r5', companyId: 'c1', agentId: 'a3', shopTypeId: 'st3', amount: 480, currency: 'MYR', mode: 'head_fee', effectiveDate: '2026-08-01', expireDate: null, version: 2, remark: '砍头模式，仅首月' },
  { id: 'r6', companyId: 'c2', agentId: 'a2', shopTypeId: 'st2', amount: 300, currency: 'MYR', mode: 'monthly', effectiveDate: '2026-04-01', expireDate: null, version: 3, remark: '海风跨境标准' },
]

const expenses: ShopExpense[] = [
  { id: 'e1', shopId: 's1', companyId: 'c1', advanceAgentId: 'a1', expenseDate: '2026-08-03', expenseMonth: '2026-08', purpose: '店铺认证服务费', amount: 86, currency: 'MYR', attachment: '认证凭证.pdf', status: 'pending', remark: '' },
  { id: 'e2', shopId: 's2', companyId: 'c1', advanceAgentId: 'a1', expenseDate: '2026-08-07', expenseMonth: '2026-08', purpose: '商标授权材料', amount: 240, currency: 'MYR', attachment: '发票-240.pdf', status: 'pending', remark: '等待公司确认' },
  { id: 'e3', shopId: 's3', companyId: 'c1', advanceAgentId: 'a2', expenseDate: '2026-08-12', expenseMonth: '2026-08', purpose: '店铺装修素材', amount: 120, currency: 'MYR', attachment: '设计费.jpg', status: 'settled', remark: '' },
  { id: 'e4', shopId: 's4', companyId: 'c1', advanceAgentId: 'a3', expenseDate: '2026-08-16', expenseMonth: '2026-08', purpose: '物流保证金', amount: 500, currency: 'MYR', attachment: '保证金回执.pdf', status: 'pending', remark: '大额凭证待复核' },
  { id: 'e5', shopId: 's5', companyId: 'c1', advanceAgentId: 'a1', expenseDate: '2026-07-21', expenseMonth: '2026-07', purpose: '平台认证费', amount: 95, currency: 'MYR', attachment: '认证.pdf', status: 'settled', remark: '' },
  { id: 'e6', shopId: 's6', companyId: 'c2', advanceAgentId: 'a2', expenseDate: '2026-08-19', expenseMonth: '2026-08', purpose: '产品拍摄', amount: 360, currency: 'MYR', attachment: '拍摄发票.pdf', status: 'pending', remark: '' },
]

const settlementMonths = ['2026-08', '2026-07', '2026-06', '2026-05', '2026-04']
const monthEndText = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number)
  return month + '-' + String(new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()).padStart(2, '0')
}
const monthDistance = (openDate: string, targetMonth: string) => {
  const [openYear, openMonth] = openDate.slice(0, 7).split('-').map(Number)
  const [targetYear, targetMonthNumber] = targetMonth.split('-').map(Number)
  return (targetYear - openYear) * 12 + (targetMonthNumber - openMonth)
}
const settlementDetails: SettlementDetail[] = settlementMonths.flatMap((month, monthIndex) => shops.map((shop, shopIndex) => {
  const monthStart = month + '-01'
  const monthEnd = monthEndText(month)
  const alive = shop.openDate <= monthEnd && (!shop.closeDate || shop.closeDate >= monthStart)
  const headFeePaused = shop.mode === 'head_fee' && shop.openDate.slice(0, 7) !== month
  const expense = expenses.filter(item => item.shopId === shop.id && item.expenseMonth === month).reduce((sum, item) => sum + item.amount, 0)
  const inProtection = (shop.protectionPeriodMonths || 0) > 0 && monthDistance(shop.openDate, month) >= 0 && monthDistance(shop.openDate, month) < (shop.protectionPeriodMonths || 0)
  const latestDraft = month === '2026-08'
  const hasPendingExpense = expenses.some(item => item.shopId === shop.id && item.expenseMonth === month && ['pending', 'rejected'].includes(item.status))
  return {
    id: 'd' + month.replace('-', '') + '-' + shop.id,
    batchId: 'b' + month.replace('-', ''),
    shopId: shop.id,
    companyId: shop.companyId,
    agentId: shop.agentId,
    ownerId: shop.ownerId,
    mode: shop.mode,
    rent: alive && !headFeePaused ? shop.monthlyRent : 0,
    expense,
    status: latestDraft ? (hasPendingExpense ? 'draft' : 'confirmed') : 'paid',
    reason: !alive ? month + ' 无存活天数' : headFeePaused ? '砍头模式，仅开店首月结算' : inProtection ? '保护期内店铺' : '按存活店铺核算',
  }
}))

const settlementBatches: SettlementBatch[] = settlementMonths.map((month, index) => {
  const details = settlementDetails.filter(item => item.batchId === 'b' + month.replace('-', ''))
  const expenseTotal = details.reduce((sum, item) => sum + item.expense, 0)
  const rentTotal = details.reduce((sum, item) => sum + item.rent, 0)
  const isLatest = month === '2026-08'
  return {
    id: 'b' + month.replace('-', ''),
    month,
    createdAt: isLatest ? '2026-09-10 08:00' : month + '-10 08:00',
    createdBy: '系统调度',
    status: isLatest ? 'draft' : 'paid',
    shopCount: details.filter(item => item.rent > 0 || item.expense > 0).length,
    rentTotal,
    expenseTotal,
    payableTotal: rentTotal + expenseTotal,
    ruleVersion: 'v' + Math.max(8, 12 - index),
    confirmedAt: isLatest ? null : month + '-10 10:22',
    paidAt: isLatest ? null : month + '-12 15:08',
    note: isLatest ? '月度核算草稿，等待确认' : '已全部支付',
  }
})

const auditLogs: AuditLog[] = [
  { id: 'l1', action: '生成核算批次', target: '2026-08 月度核算', operator: '系统调度', role: '系统', createdAt: '2026-09-10 08:00:01', detail: '生成 24 条店铺明细，规则快照 v12' },
  { id: 'l2', action: '发布开店任务', target: 'TikTok Shop 美妆类目开店', operator: '周雅雯', role: '公司负责人', createdAt: '2026-09-08 14:34:21', detail: '任务量 12，奖励 RM480/店' },
  { id: 'l3', action: '调整分配规则', target: 'Aiman Hub · 砍头模式', operator: '陈俊豪', role: '顶级代理', createdAt: '2026-09-06 11:17:03', detail: '新版本 v2，生效日期 2026-08-01' },
  { id: 'l4', action: '确认杂费', target: '店铺 MY-LKW-1003', operator: '周雅雯', role: '公司负责人', createdAt: '2026-09-05 09:42:18', detail: '金额 RM120.00，凭证已核验' },
]

const systemSettings: SystemSettings = {
  systemName: 'FenFlow',
  logoUrl: '',
  defaultLanguage: 'zh',
  defaultTheme: 2,
  updatedAt: '2026-09-01 09:00',
  updatedBy: '平台管理员',
}

export const seedState = (): AppState => ({
  currentUserId: null,
  language: systemSettings.defaultLanguage,
  theme: systemSettings.defaultTheme,
  systemSettings,
  companies,
  agents,
  owners,
  ownerSubmissions,
  shopTypes,
  companyShopTypes,
  shops,
  companySettlementConfigs,
  companySettlementTemplates,
  protectionPeriods,
  tasks,
  rules,
  expenses,
  settlementBatches,
  settlementDetails,
  auditLogs,
})
