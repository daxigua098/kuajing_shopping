<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '@/components/Icon.vue'
import MediaField from '@/components/MediaField.vue'
import Modal from '@/components/Modal.vue'
import { agentName, can, cancelOwnerSubmission, companyName, currentUser, deleteOwner, ownerBusinessStatus, ownerBusinessStatusLabel, saveOwner, shopTypeName, state, submitOwnerToCompany, validateOwnerSubmission, visibleAgents, visibleCompanies, visibleOwners, visibleShops, visibleSubmissions } from '@/store'
import type { Owner, OwnerBusinessStatus, OwnerSubmission } from '@/types'
import { downloadRows } from '@/utils/export'
import { maskAccount } from '@/utils/format'
import { parseOwnerIntake, type ParsedOwnerIntake } from '@/utils/ownerParser'

const route = useRoute()
const search = ref(String(route.query.q || ''))
const filterAgent = ref('all')
const statusFilter = ref<'all' | OwnerBusinessStatus | 'pending_review'>('all')
const exportOpen = ref(false)
type ExportFieldKey = 'name' | 'icNumber' | 'bankCard' | 'shop' | 'phone' | 'email' | 'businessStatus' | 'agent' | 'company' | 'shopType' | 'bankName' | 'bankAccount' | 'bankCvv' | 'bankExpiry' | 'attachmentCount' | 'idCardFront' | 'idCardBack' | 'bankCardPhoto' | 'bankCardBack' | 'shopOpenProof' | 'shopCloseProof' | 'remark'
const exportFields = reactive<{ key: ExportFieldKey; label: string; selected: boolean }[]>([
  { key:'name', label:'人头姓名', selected:true },
  { key:'icNumber', label:'IC 卡号', selected:true },
  { key:'bankCard', label:'银行卡', selected:true },
  { key:'shop', label:'店铺', selected:true },
  { key:'phone', label:'联系电话', selected:false },
  { key:'email', label:'邮箱', selected:false },
  { key:'businessStatus', label:'业务状态', selected:false },
  { key:'agent', label:'人头归属代理', selected:false },
  { key:'company', label:'提交公司', selected:false },
  { key:'shopType', label:'店铺类型', selected:false },
  { key:'bankName', label:'开户银行', selected:false },
  { key:'bankAccount', label:'银行账号 ACC', selected:false },
  { key:'bankCvv', label:'CVV', selected:false },
  { key:'bankExpiry', label:'有效期', selected:false },
  { key:'attachmentCount', label:'图片数量', selected:false },
  { key:'idCardFront', label:'身份证正面图片', selected:false },
  { key:'idCardBack', label:'身份证反面图片', selected:false },
  { key:'bankCardPhoto', label:'银行卡正面图片', selected:false },
  { key:'bankCardBack', label:'银行卡反面图片', selected:false },
  { key:'shopOpenProof', label:'开店成功截图', selected:false },
  { key:'shopCloseProof', label:'关店/封店截图', selected:false },
  { key:'remark', label:'备注', selected:false },
])
const modalOpen = ref(false)
const detailOpen = ref(false)
const submitOpen = ref(false)
const editingId = ref<string | null>(null)
const selected = ref<Owner | null>(null)
const submittingOwner = ref<Owner | null>(null)
const preview = ref<{ label: string; url: string } | null>(null)
const submissionCompanyId = ref('')
const submissionShopTypeId = ref('st1')
const submissionRemark = ref('')
const smartText = ref('')
const smartResult = ref<ParsedOwnerIntake | null>(null)
const smartExample = 'PHANG YI SHENG\nic 000610-13-0495\nemail.phangyisheng8484@\\gmail.com\nbank kad 4678 5150 2635 8515\ncctv 656\nvaild thru 11/32\nacc 02950299220 hong leong bank\nno.0143220688'
const form = reactive<Owner>({
  id:'', name:'', phone:'', email:'', agentId:'', companyId:'', loginEmail:'', icNumber:'', bankAccount:'', bankCardNumber:'', bankCvv:'', bankExpiry:'', bankHolder:'', bankName:'Maybank',
  idCardFront:'', idCardBack:'', bankCardPhoto:'', bankCardBack:'', shopOpenProof:'', shopCloseProof:'', remark:'', isInvalid:false, status:'active', createdAt:'',
})
const statusMeta: Record<OwnerBusinessStatus, { label: string; cls: string }> = {
  not_opened: { label:'未开店', cls:'neutral' },
  opened: { label:'已开店', cls:'success' },
  dead_shop: { label:'死店', cls:'danger' },
  invalid: { label:'无效人头', cls:'warning' },
}
const filtered = computed(() => visibleOwners.value.filter(owner => {
  const keyword = search.value.trim().toLowerCase()
  const businessStatus = ownerBusinessStatus(owner)
  return (!keyword || [owner.name,owner.phone,owner.email,owner.loginEmail,owner.bankHolder,owner.icNumber || '',owner.bankAccount,owner.bankCardNumber || ''].some(v=>(v || '').toLowerCase().includes(keyword))) && (filterAgent.value==='all' || owner.agentId===filterAgent.value) && (statusFilter.value==='all' || (statusFilter.value==='pending_review' ? hasPendingSubmission(owner.id) : businessStatus===statusFilter.value))
}))
const shopOf = (id:string) => visibleShops.value.find(shop => shop.ownerId===id)
const canViewFullSensitive = computed(() => currentUser.value?.role !== 'company')
function hasPendingSubmission(ownerId: string) { return visibleSubmissions.value.some(item => item.ownerId === ownerId && ['pending_top', 'pending'].includes(item.status)) }
function ownerAgentLabel(id: string) { return agentName(id) + (currentUser.value?.role === 'top_agent' && id === currentUser.value?.agentId ? '（本人直管）' : '') }
function parentAgentLabel(agentId: string) { const agent = visibleAgents.value.find(item => item.id === agentId); return agent?.parentId ? agentName(agent.parentId) : '平台 / 顶级代理直签' }
function ownerCompanyName(ownerId: string) { const submission = latestSubmission(ownerId); return submission?.companyId ? companyName(submission.companyId) : '未分配公司' }
function ownerSubmissions(ownerId: string) { return visibleSubmissions.value.filter(item => item.ownerId === ownerId) }
function latestSubmission(ownerId: string): OwnerSubmission | undefined { return ownerSubmissions(ownerId)[0] }
function submissionLabel(ownerId: string) {
  const latest = latestSubmission(ownerId)
  if (!latest) return '未提交'
  return { pending_top:'待顶级代理分配', pending:'待公司审核', approved:'已通过', rejected:'已驳回', cancelled:'已取消' }[latest.status]
}
function submissionClass(ownerId: string) {
  const latest = latestSubmission(ownerId)
  if (!latest) return 'neutral'
  return { pending_top:'warning', pending:'warning', approved:'success', rejected:'danger', cancelled:'neutral' }[latest.status]
}
function resetSmartImport() { smartText.value=''; smartResult.value=null }
function applySmartText() {
  if (!smartText.value.trim()) return
  const parsed = parseOwnerIntake(smartText.value)
  smartResult.value = parsed
  if (parsed.name) form.name = parsed.name
  if (parsed.icNumber) form.icNumber = parsed.icNumber
  if (parsed.email) form.email = parsed.email
  if (parsed.phone) form.phone = parsed.phone
  if (parsed.bankCardNumber) form.bankCardNumber = parsed.bankCardNumber
  if (parsed.bankCvv) form.bankCvv = parsed.bankCvv
  if (parsed.bankExpiry) form.bankExpiry = parsed.bankExpiry
  if (parsed.bankAccount) form.bankAccount = parsed.bankAccount
  if (parsed.bankName) form.bankName = parsed.bankName
}
function handleSmartPaste(event: ClipboardEvent) {
  const pasted = event.clipboardData?.getData('text') || ''
  if (!pasted) return
  event.preventDefault()
  smartText.value = pasted
  nextTick(() => applySmartText())
}
function loadSmartExample() { smartText.value = smartExample; nextTick(() => applySmartText()) }
let smartTimer: ReturnType<typeof setTimeout> | undefined
watch(smartText, value => {
  if (smartTimer) clearTimeout(smartTimer)
  if (value.trim().length < 20) return
  smartTimer = setTimeout(() => applySmartText(), 350)
})
function openCreate() {
  editingId.value=null
  resetSmartImport()
  const defaultAgent = currentUser.value?.role === 'sub_agent' ? currentUser.value.agentId : visibleAgents.value[0]?.id
  Object.assign(form,{id:'o'+Date.now(),name:'',phone:'',email:'',agentId:defaultAgent||'',companyId:'',loginEmail:'',icNumber:'',bankAccount:'',bankCardNumber:'',bankCvv:'',bankExpiry:'',bankHolder:'',bankName:'Hong Leong Bank',idCardFront:'',idCardBack:'',bankCardPhoto:'',bankCardBack:'',shopOpenProof:'',shopCloseProof:'',remark:'',isInvalid:false,status:'active' as const,createdAt:new Date().toISOString().slice(0,10)})
  modalOpen.value=true
}
function openEdit(owner:Owner) { editingId.value=owner.id; resetSmartImport(); Object.assign(form,JSON.parse(JSON.stringify(owner))); modalOpen.value=true }
function openDetail(owner:Owner) { selected.value=owner; detailOpen.value=true }
function openSubmit(owner:Owner) {
  submittingOwner.value=owner
  submissionCompanyId.value=visibleCompanies.value[0]?.id || ''
  submissionShopTypeId.value='st1'
  submissionRemark.value=''
  submitOpen.value=true
}
function submit(){ if(!form.name.trim()||!form.agentId)return; saveOwner({...form}); modalOpen.value=false }
function submitToCompany() {
  if (!submittingOwner.value) return
  const result=submitOwnerToCompany(submittingOwner.value.id,submissionCompanyId.value,submissionShopTypeId.value,submissionRemark.value)
  if (!result.ok) { window.alert(result.reason); return }
  submitOpen.value=false
}
watch(() => [route.query.create, route.query.agentId], () => {
  if (String(route.query.create) !== '1') return
  openCreate()
  const agentId = String(route.query.agentId || '')
  if (visibleAgents.value.some(agent => agent.id === agentId)) form.agentId = agentId
}, { immediate: true })
function remove(owner:Owner){ if(window.confirm('确定删除人头「'+owner.name+'」吗？已有公司提交或店铺记录时正式环境应采用无效标记，不建议物理删除。')) deleteOwner(owner.id) }
function validationFor(owner:Owner) { return validateOwnerSubmission(owner.id, submissionCompanyId.value, submissionShopTypeId.value) }
function mediaItems(owner:Owner) {
  return [
    { label:'身份证正面', url:owner.idCardFront || '' },
    { label:'身份证反面', url:owner.idCardBack || '' },
    { label:'银行卡正面', url:owner.bankCardPhoto || '' },
    { label:'银行卡反面', url:owner.bankCardBack || '' },
    { label:'开店成功截图', url:owner.shopOpenProof || '' },
    { label:'关店截图', url:owner.shopCloseProof || '' },
  ]
}
function openExport() { exportOpen.value = true }
function selectAllExportFields() { exportFields.forEach(field => field.selected = true) }
function resetExportFields() { exportFields.forEach(field => field.selected = ['name', 'icNumber', 'bankCard', 'shop'].includes(field.key)) }
function exportValue(owner: Owner, key: ExportFieldKey) {
  const shop = shopOf(owner.id)
  const latest = latestSubmission(owner.id)
  if (key === 'name') return owner.name
  if (key === 'icNumber') return owner.icNumber || ''
  if (key === 'bankCard') return canViewFullSensitive.value ? owner.bankCardNumber || '' : maskAccount(owner.bankCardNumber || '')
  if (key === 'shop') return shop ? shop.code + ' / ' + shop.name : '未开店'
  if (key === 'phone') return owner.phone || ''
  if (key === 'email') return owner.email || ''
  if (key === 'businessStatus') return ownerBusinessStatusLabel(owner)
  if (key === 'agent') return agentName(owner.agentId)
  if (key === 'company') return latest?.companyId ? companyName(latest.companyId) : '未提交'
  if (key === 'shopType') return latest ? shopTypeName(latest.shopTypeId) : ''
  if (key === 'bankName') return owner.bankName || ''
  if (key === 'bankAccount') return canViewFullSensitive.value ? owner.bankAccount || '' : maskAccount(owner.bankAccount || '')
  if (key === 'bankCvv') return canViewFullSensitive.value ? owner.bankCvv || '' : '已隐藏'
  if (key === 'bankExpiry') return owner.bankExpiry || ''
  if (key === 'attachmentCount') return mediaItems(owner).filter(item => item.url).length
  if (key === 'idCardFront') return owner.idCardFront || ''
  if (key === 'idCardBack') return owner.idCardBack || ''
  if (key === 'bankCardPhoto') return owner.bankCardPhoto || ''
  if (key === 'bankCardBack') return owner.bankCardBack || ''
  if (key === 'shopOpenProof') return owner.shopOpenProof || ''
  if (key === 'shopCloseProof') return owner.shopCloseProof || ''
  return owner.remark || ''
}
function exportOwners() {
  const fields = exportFields.filter(field => field.selected)
  if (!fields.length) { window.alert('请至少选择一个导出字段'); return }
  downloadRows('人头档案-' + new Date().toISOString().slice(0,10), fields.map(field => field.label), filtered.value.map(owner => fields.map(field => exportValue(owner, field.key))), 'csv')
  exportOpen.value = false
}
</script>
<template>
  <div>
    <div class="page-toolbar">
      <div class="filter-search"><Icon name="search" :size="15"/><input v-model="search" class="input" placeholder="搜索姓名、IC、银行卡、邮箱"/></div>
      <select v-model="statusFilter" class="select" style="width:140px"><option value="all">全部业务状态</option><option value="pending_review">待审核</option><option value="not_opened">未开店</option><option value="opened">已开店</option><option value="dead_shop">死店</option><option value="invalid">无效人头</option></select>
      <select v-model="filterAgent" class="select" style="width:170px"><option value="all">全部代理</option><option v-for="agent in visibleAgents" :key="agent.id" :value="agent.id">{{ agent.name }}{{ currentUser?.role==='top_agent' && agent.id===currentUser.agentId ? '（本人直管）' : '' }}</option></select>
      <span class="spacer"/>
      <button class="btn secondary" @click="openExport"><Icon name="download" :size="15"/>导出档案</button>
      <button v-if="can('manageOwners')" class="btn primary" @click="openCreate"><Icon name="plus" :size="15"/>录入人头资料</button>
    </div>
    <section class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">未开店</span><span class="stat-icon"><Icon name="users" :size="16"/></span></div><div class="stat-value">{{ visibleOwners.filter(o=>ownerBusinessStatus(o)==='not_opened').length }}</div><div class="stat-foot">可提交给公司使用</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">已开店</span><span class="stat-icon"><Icon name="store" :size="16"/></span></div><div class="stat-value">{{ visibleOwners.filter(o=>ownerBusinessStatus(o)==='opened').length }}</div><div class="stat-foot">店铺正常经营或暂停</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">死店</span><span class="stat-icon" style="background:var(--danger-soft);color:var(--danger)"><Icon name="x" :size="16"/></span></div><div class="stat-value">{{ visibleOwners.filter(o=>ownerBusinessStatus(o)==='dead_shop').length }}</div><div class="stat-foot">已有店铺但全部关店</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">待审核</span><span class="stat-icon" style="background:var(--warning-soft);color:var(--warning)"><Icon name="alert" :size="16"/></span></div><div class="stat-value">{{ visibleOwners.filter(o=>hasPendingSubmission(o.id)).length }}</div><div class="stat-foot">待顶级代理分配或待公司审核</div></article>
    </section>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>人头</th><th>业务状态</th><th>IC / 银行卡</th><th>人头归属 / 开店公司</th><th>提交状态</th><th>店铺</th><th>图片资料</th><th style="width:145px">操作</th></tr></thead>
        <tbody><tr v-for="owner in filtered" :key="owner.id">
          <td><div class="person-cell"><span class="avatar role-sub_agent">{{ owner.name.slice(0,1) }}</span><span><strong>{{ owner.name }}</strong><small>{{ owner.phone || '未填写电话' }} · {{ owner.email || '未填写邮箱' }}</small></span></div></td>
          <td><span class="badge" :class="statusMeta[ownerBusinessStatus(owner)].cls">{{ statusMeta[ownerBusinessStatus(owner)].label }}</span></td>
          <td><div>{{ owner.icNumber || '未填写 IC' }}</div><div class="secondary-line">{{ canViewFullSensitive ? owner.bankCardNumber || '未填写银行卡号' : maskAccount(owner.bankCardNumber || owner.bankAccount) }}</div></td>
          <td><div><b>{{ ownerAgentLabel(owner.agentId) }}</b></div><div class="secondary-line">上级：{{ parentAgentLabel(owner.agentId) }}</div><div class="secondary-line">开店公司：{{ ownerCompanyName(owner.id) }}</div></td>
          <td><span class="badge" :class="submissionClass(owner.id)">{{ submissionLabel(owner.id) }}</span></td>
          <td><span v-if="shopOf(owner.id)"><b>{{ shopOf(owner.id)?.code }}</b><div class="secondary-line">{{ shopOf(owner.id)?.name }}</div></span><span v-else class="badge neutral">未开店</span></td>
          <td><span class="badge info no-dot">{{ mediaItems(owner).filter(item=>item.url).length }} / 6 张</span></td>
          <td><div class="row-actions"><button class="row-action" title="详情" @click="openDetail(owner)"><Icon name="eye" :size="15"/></button><button v-if="can('submitOwnerToCompany')" class="row-action" title="提交公司" @click="openSubmit(owner)"><Icon name="send" :size="15"/></button><button v-if="can('manageOwners')" class="row-action" title="编辑" @click="openEdit(owner)"><Icon name="edit" :size="15"/></button><button v-if="can('manageOwners')" class="row-action danger" title="删除" @click="remove(owner)"><Icon name="trash" :size="15"/></button></div></td>
        </tr>
        <tr v-if="!filtered.length"><td colspan="8"><div class="table-empty"><Icon name="users" :size="30"/><div>没有匹配的人头档案</div></div></td></tr></tbody>
      </table>
    </div>

    <Modal :open="modalOpen" :title="editingId?'编辑人头资料':'录入人头资料'" width="940px" @close="modalOpen=false">
      <template #subtitle><p>顶级代理和代理都可以录入。新录入人头默认业务状态为“未开店”。</p></template>
      <section class="smart-import">
        <div class="card-head" style="margin:0 0 10px"><div><h3>智能粘贴识别</h3><p>直接粘贴整段人头资料，自动识别姓名、IC、邮箱、电话、银行卡、CVV、有效期和银行账号。</p></div><Icon name="sparkles" :size="20"/></div>
        <textarea v-model="smartText" class="textarea smart-textarea" placeholder="粘贴示例：&#10;PHANG YI SHENG&#10;ic 000610-13-0495&#10;email.phangyisheng8484@gmail.com&#10;bank kad 4678 5150 2635 8515&#10;cctv 656&#10;vaild thru 11/32&#10;acc 02950299220 hong leong bank&#10;no.0143220688" @paste="handleSmartPaste"></textarea>
        <div class="row" style="gap:8px;margin-top:9px;flex-wrap:wrap"><button class="btn primary" @click="applySmartText"><Icon name="sparkles" :size="15"/>自动识别并填入</button><button class="btn secondary" @click="loadSmartExample">载入用户示例</button><span v-if="smartResult" class="badge success no-dot">已识别 {{ smartResult.matched.length }} 个字段</span></div>
        <div v-if="smartResult" class="smart-results">
          <span v-for="field in smartResult.matched" :key="field.key" class="smart-chip"><b>{{ field.label }}</b>{{ field.value }}</span>
        </div>
        <div v-if="smartResult?.unparsed.length" class="callout warning" style="margin-top:10px"><Icon name="alert" :size="16"/><div><strong>有 {{ smartResult.unparsed.length }} 行未自动识别</strong><p>{{ smartResult.unparsed.join(' / ') }}</p></div></div>
      </section>
      <div class="card-head" style="margin:18px 0 12px"><div><h3>基础资料</h3><p>可先智能识别，再人工修改或补充图片资料。“人头归属代理”表示谁负责管理这条人头，不是开店公司；顶级代理可选择“南洋星链（本人直管）”录入自己开发的人头，具体开店公司会在提交时选择。</p></div></div>
      <div class="form-grid three">
        <div class="field"><label>姓名 <b>*</b></label><input v-model="form.name" class="input" placeholder="例如：PHANG YI SHENG"/></div>
        <div class="field"><label>联系电话</label><input v-model="form.phone" class="input" placeholder="例如：0143220688"/></div>
        <div class="field"><label>邮箱</label><input v-model="form.email" class="input" type="email" placeholder="name@example.com"/></div>
        <div class="field"><label>IC 卡号</label><input v-model="form.icNumber" class="input" placeholder="000610-13-0495"/></div>
        <div class="field"><label>人头归属代理 <b>*</b></label><select v-model="form.agentId" class="select"><option v-for="agent in visibleAgents" :key="agent.id" :value="agent.id">{{ agent.name }}{{ currentUser?.role==='top_agent' && agent.id===currentUser.agentId ? '（本人直管）' : '' }}</option></select></div>
        <div class="field"><label>业务标记</label><label class="badge no-dot" style="height:38px;justify-content:center;background:var(--surface-2)"><input v-model="form.isInvalid" type="checkbox" style="margin-right:7px"/>标记为无效人头</label></div>
        <div class="field"><label>开户银行</label><input v-model="form.bankName" class="input" placeholder="Hong Leong Bank"/></div>
        <div class="field"><label>开户人</label><input v-model="form.bankHolder" class="input"/></div>
        <div class="field"><label>银行账号 ACC</label><input v-model="form.bankAccount" class="input" placeholder="02950299220"/></div>
        <div class="field"><label>银行卡号</label><input v-model="form.bankCardNumber" class="input" placeholder="4678 5150 2635 8515"/></div>
        <div class="field"><label>CVV / CCTV</label><input v-model="form.bankCvv" class="input" placeholder="656"/></div>
        <div class="field"><label>Valid Thru</label><input v-model="form.bankExpiry" class="input" placeholder="11/32"/></div>
        <div class="field"><label>店铺登录邮箱</label><input v-model="form.loginEmail" class="input"/></div>
      </div>
      <div class="card-head" style="margin:20px 0 12px"><div><h3>身份证与银行卡图片</h3><p>身份证正反面、银行卡正反面均为非必填；有上传即可在档案和店铺详情中查看。</p></div></div>
      <div class="media-grid">
        <MediaField v-model="form.idCardFront" label="身份证正面" @preview="preview=$event" />
        <MediaField v-model="form.idCardBack" label="身份证反面" @preview="preview=$event" />
        <MediaField v-model="form.bankCardPhoto" label="银行卡正面" @preview="preview=$event" />
        <MediaField v-model="form.bankCardBack" label="银行卡反面" @preview="preview=$event" />
      </div>
      <div class="card-head" style="margin:20px 0 12px"><div><h3>开店凭证</h3><p>开店成功截图和关店截图可在公司开店后补充。</p></div></div>
      <div class="media-grid">
        <MediaField v-model="form.shopOpenProof" label="开店成功截图" @preview="preview=$event" />
        <MediaField v-model="form.shopCloseProof" label="关店截图" @preview="preview=$event" />
      </div>
      <div class="field full" style="margin-top:14px"><label>备注说明</label><textarea v-model="form.remark" class="textarea" placeholder="填写文字说明材料、证件核验情况或补充备注"/></div>
      <template #footer><button class="btn secondary" @click="modalOpen=false">取消</button><button class="btn primary" @click="submit"><Icon name="check" :size="15"/>保存人头档案</button></template>
    </Modal>

    <Modal :open="submitOpen" title="提交人头给公司使用" width="680px" @close="submitOpen=false">
      <template #subtitle><p>{{ submittingOwner?.name }} · 提交后进入公司待审核状态，审核前可以取消并改选其他公司。</p></template>
      <div v-if="submittingOwner" class="form-grid">
        <div class="field"><label>目标公司</label><select v-model="submissionCompanyId" class="select"><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select></div>
        <div class="field"><label>店铺类型</label><select v-model="submissionShopTypeId" class="select"><option v-for="type in state.shopTypes" :key="type.id" :value="type.id">{{ type.name }}</option></select></div>
        <div class="field full"><label>提交备注</label><textarea v-model="submissionRemark" class="textarea" placeholder="说明希望公司开店的类型、地区或其他要求"/></div>
      </div>
      <div v-if="submittingOwner && !validationFor(submittingOwner).ok" class="callout danger" style="margin-top:14px"><Icon name="alert" :size="17"/><div><strong>当前不可提交</strong><p>{{ validationFor(submittingOwner).reason }}</p></div></div>
      <div v-else class="callout info" style="margin-top:14px"><Icon name="shield" :size="17"/><div><strong>提交规则</strong><p>已提交给 A 公司并通过后，不能再改提其他公司；同一店铺类型只能提交一次，不同店铺类型不受影响。</p></div></div>
      <template #footer><button class="btn secondary" @click="submitOpen=false">取消</button><button class="btn primary" :disabled="submittingOwner ? !validationFor(submittingOwner).ok : true" @click="submitToCompany"><Icon name="send" :size="15"/>提交公司审核</button></template>
    </Modal>

    <Modal :open="detailOpen" title="人头完整档案" width="960px" @close="detailOpen=false">
      <div v-if="selected">
        <div class="row between center"><div class="person-cell"><span class="avatar role-sub_agent" style="width:46px;height:46px;font-size: calc(16px + var(--font-boost))">{{ selected.name.slice(0,1) }}</span><span><strong style="font-size: calc(15px + var(--font-boost))">{{ selected.name }}</strong><small>{{ selected.phone || '未填写电话' }} · {{ selected.email || '未填写邮箱' }}</small></span></div><span class="badge" :class="statusMeta[ownerBusinessStatus(selected)].cls" style="height:28px;padding:0 11px">{{ statusMeta[ownerBusinessStatus(selected)].label }}</span></div>
        <div class="detail-list" style="margin-top:20px">
          <div class="detail-item"><label>IC 卡号</label><strong>{{ selected.icNumber || '未填写' }}</strong></div><div class="detail-item"><label>人头归属代理</label><strong>{{ ownerAgentLabel(selected.agentId) }}</strong></div><div class="detail-item"><label>上级代理</label><strong>{{ parentAgentLabel(selected.agentId) }}</strong></div><div class="detail-item"><label>开店公司</label><strong>{{ ownerCompanyName(selected.id) }}</strong></div>
          <div class="detail-item"><label>开户银行</label><strong>{{ selected.bankName || '未填写' }}</strong></div><div class="detail-item"><label>开户人</label><strong>{{ selected.bankHolder || '未填写' }}</strong></div>
          <div class="detail-item"><label>银行账号 ACC</label><strong>{{ canViewFullSensitive ? selected.bankAccount || '未填写' : maskAccount(selected.bankAccount) }}</strong></div><div class="detail-item"><label>银行卡号</label><strong>{{ canViewFullSensitive ? selected.bankCardNumber || '未填写' : maskAccount(selected.bankCardNumber || '') }}</strong></div>
          <div class="detail-item"><label>CVV / CCTV</label><strong>{{ canViewFullSensitive ? selected.bankCvv || '未填写' : '已隐藏' }}</strong></div><div class="detail-item"><label>Valid Thru</label><strong>{{ selected.bankExpiry || '未填写' }}</strong></div>
          <div class="detail-item full"><label>备注说明</label><strong>{{ selected.remark || '暂无备注' }}</strong></div>
        </div>
        <div class="card-head" style="margin:20px 0 12px"><div><h3>提交与店铺状态</h3><p>记录提交公司、店铺类型、审核状态和历史处理结果。</p></div></div>
        <div v-if="ownerSubmissions(selected.id).length" class="timeline">
          <div v-for="item in ownerSubmissions(selected.id)" :key="item.id" class="timeline-item"><strong>{{ companyName(item.companyId) }} · {{ shopTypeName(item.shopTypeId) }}</strong><p>{{ item.status==='pending_top'?'待顶级代理分配公司':item.status==='pending'?'待公司审核':item.status==='approved'?'审核通过':item.status==='rejected'?'公司已驳回':'提交已取消' }} · {{ item.remark || '无备注' }}</p><small>{{ item.submittedAt }} · 提交代理 {{ agentName(item.fromAgentId) }}</small></div>
        </div>
        <div v-else class="callout info"><Icon name="send" :size="17"/><div><strong>尚未提交公司</strong><p>当前业务状态为“未开店”，顶级代理可以选择公司提交使用。</p></div></div>
        <div class="card-head" style="margin:20px 0 12px"><div><h3>身份证与银行卡图片</h3><p>点击有内容的图片可以查看原图。</p></div></div>
        <div class="media-gallery">
          <template v-for="item in mediaItems(selected)" :key="item.label">
            <button v-if="item.url" class="media-gallery-item" @click="preview=item"><img :src="item.url" :alt="item.label"/><div class="media-caption">{{ item.label }}</div></button>
            <div v-else class="media-gallery-item empty-item">{{ item.label }}<br/>未上传</div>
          </template>
        </div>
      </div>
      <template #footer><button class="btn secondary" @click="detailOpen=false">关闭</button><button v-if="selected && ['pending_top', 'pending'].includes(latestSubmission(selected.id)?.status || '') && can('submitOwnerToCompany')" class="btn danger" @click="cancelOwnerSubmission(latestSubmission(selected.id)!.id);detailOpen=false">取消待审核提交</button><button v-if="selected && can('submitOwnerToCompany')" class="btn primary" @click="openSubmit(selected)"><Icon name="send" :size="15"/>提交公司</button><button v-if="can('manageOwners')" class="btn secondary" @click="selected && openEdit(selected)">编辑资料</button></template>
    </Modal>

    <Modal :open="exportOpen" title="选择人头导出字段" width="760px" @close="exportOpen=false">
      <template #subtitle><p>默认只导出人头姓名、IC 卡号、银行卡和店铺；其他字段勾选后才会导出。</p></template>
      <div class="row between center" style="margin-bottom:12px"><span class="hint">已选择 {{ exportFields.filter(field=>field.selected).length }} 个字段</span><div class="row" style="gap:7px"><button class="btn ghost small" @click="selectAllExportFields">全选</button><button class="btn secondary small" @click="resetExportFields">恢复默认</button></div></div>
      <div class="export-field-grid"><label v-for="field in exportFields" :key="field.key" class="export-field" :class="{ selected: field.selected }"><input v-model="field.selected" type="checkbox"/><span>{{ field.label }}</span><b v-if="['name','icNumber','bankCard','shop'].includes(field.key)">默认</b></label></div>
      <div class="callout info" style="margin-top:14px"><Icon name="shield" :size="17"/><div><strong>敏感字段权限</strong><p>平台、顶级代理和所属子代理可导出完整银行卡资料；公司端仍然自动脱敏。</p></div></div>
      <template #footer><button class="btn secondary" @click="exportOpen=false">取消</button><button class="btn primary" @click="exportOwners"><Icon name="download" :size="15"/>导出已选字段</button></template>
    </Modal>

    <Teleport to="body">
      <div v-if="preview" class="media-lightbox" @click.self="preview=null">
        <div class="media-lightbox-panel">
          <div class="media-lightbox-head"><strong>{{ preview.label }}</strong><button class="icon-btn" @click="preview=null"><Icon name="x"/></button></div>
          <img :src="preview.url" :alt="preview.label"/>
        </div>
      </div>
    </Teleport>
  </div>
</template>
