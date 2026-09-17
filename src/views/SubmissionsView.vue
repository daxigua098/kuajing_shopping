<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'
import MediaField from '@/components/MediaField.vue'
import Modal from '@/components/Modal.vue'
import { agentName, assignOwnerSubmissionToCompany, cancelOwnerSubmission, can, companyName, currentUser, ownerBusinessStatus, ownerBusinessStatusLabel, reviewOwnerSubmission, saveOwner, shopTypeName, state, submitOwnerToCompany, submitOwnerToTop, visibleAgents, visibleCompanies, visibleOwners, visibleShops, visibleSubmissions } from '@/store'
import type { Owner, OwnerBusinessStatus, OwnerSubmission } from '@/types'
import { parseOwnerIntake, type ParsedOwnerIntake } from '@/utils/ownerParser'

type AgentStatusFilter = 'all' | OwnerBusinessStatus | 'pending_review'
const router = useRouter()
const isCompanyView = computed(() => currentUser.value?.role === 'company')
const statusFilter = ref<AgentStatusFilter>('all')
const submissionStatusFilter = ref('all')
const shopTypeFilter = ref('all')
const search = ref('')
const reviewOpen = ref(false)
const reviewSubmission = ref<OwnerSubmission | null>(null)
const reviewDecision = ref<'approved' | 'rejected'>('approved')
const reviewRemark = ref('')
const submitOpen = ref(false)
const splitSubmission = ref<OwnerSubmission | null>(null)
const submitOwnerTarget = ref<Owner | null>(null)
const submissionCompanyId = ref('')
const submissionShopTypeId = ref('st1')
const submissionRemark = ref('')
const intakeOpen = ref(false)
const preview = ref<{ label: string; url: string } | null>(null)
const smartText = ref('')
const smartResult = ref<ParsedOwnerIntake | null>(null)
const smartExample = 'PHANG YI SHENG\nic 000610-13-0495\nemail.phangyisheng8484@\\gmail.com\nbank kad 4678 5150 2635 8515\ncctv 656\nvaild thru 11/32\nacc 02950299220 hong leong bank\nno.0143220688'
const intakeForm = reactive<Owner>({
  id:'', name:'', phone:'', email:'', agentId:'', companyId:'', loginEmail:'', icNumber:'', bankAccount:'', bankCardNumber:'', bankCvv:'', bankExpiry:'', bankHolder:'', bankName:'Hong Leong Bank',
  idCardFront:'', idCardBack:'', bankCardPhoto:'', bankCardBack:'', shopOpenProof:'', shopCloseProof:'', remark:'', isInvalid:false, status:'active', createdAt:'',
})
const statusMeta: Record<OwnerSubmission['status'], { label: string; cls: string }> = {
  pending_top: { label: '待顶级代理分配', cls: 'warning' },
  pending: { label: '待公司审核', cls: 'warning' },
  approved: { label: '已通过', cls: 'success' },
  rejected: { label: '已驳回', cls: 'danger' },
  cancelled: { label: '已取消', cls: 'neutral' },
}
const businessMeta: Record<'not_opened' | 'opened' | 'dead_shop' | 'invalid' | 'pending_review', { label: string; cls: string }> = {
  not_opened: { label: '未开店', cls: 'neutral' },
  opened: { label: '已开店', cls: 'success' },
  dead_shop: { label: '挂店', cls: 'danger' },
  invalid: { label: '无效人头', cls: 'warning' },
  pending_review: { label: '待审核', cls: 'warning' },
}
function ownerSubmissions(ownerId: string) { return visibleSubmissions.value.filter(item => item.ownerId === ownerId) }
function pendingSubmission(ownerId: string) { return ownerSubmissions(ownerId).find(item => ['pending_top', 'pending'].includes(item.status)) }
function latestSubmission(ownerId: string) { return ownerSubmissions(ownerId)[0] }
function effectiveStatus(owner: Owner): keyof typeof businessMeta { return pendingSubmission(owner.id) ? 'pending_review' : ownerBusinessStatus(owner) }
function ownerTypes(ownerId: string) {
  const typeIds = new Set<string>()
  visibleShops.value.filter(shop => shop.ownerId === ownerId).forEach(shop => typeIds.add(shop.shopTypeId))
  ownerSubmissions(ownerId).filter(item => item.status !== 'cancelled').forEach(item => typeIds.add(item.shopTypeId))
  return [...typeIds].map(shopTypeName)
}
function ownerCompany(ownerId: string) {
  return ownerSubmissions(ownerId).find(item => item.status === 'approved' && item.companyId)?.companyId || ownerSubmissions(ownerId).find(item => item.status === 'pending' && item.companyId)?.companyId || ''
}
const agentRows = computed(() => visibleOwners.value.filter(owner => {
  const keyword = search.value.trim().toLowerCase()
  const submission = pendingSubmission(owner.id)
  const typeIds = new Set<string>([
    ...visibleShops.value.filter(shop => shop.ownerId === owner.id).map(shop => shop.shopTypeId),
    ...ownerSubmissions(owner.id).filter(item => item.status !== 'cancelled').map(item => item.shopTypeId),
  ])
  return (!keyword || [owner.name, owner.icNumber || '', owner.phone, owner.email].some(value => (value || '').toLowerCase().includes(keyword)))
    && (shopTypeFilter.value === 'all' || typeIds.has(shopTypeFilter.value))
    && (statusFilter.value === 'all' || effectiveStatus(owner) === statusFilter.value)
}))
const companySubmissions = computed(() => visibleSubmissions.value.filter(item => {
  const keyword = search.value.trim().toLowerCase()
  return item.companyId && (!keyword || [ownerName(item.ownerId), companyName(item.companyId), shopTypeName(item.shopTypeId), agentName(item.fromAgentId)].some(value => value.toLowerCase().includes(keyword))) && (submissionStatusFilter.value === 'all' || item.status === submissionStatusFilter.value) && (shopTypeFilter.value === 'all' || item.shopTypeId === shopTypeFilter.value)
}))
function ownerName(id: string) { return state.owners.find(owner => owner.id === id)?.name || id }
const agentCounts = computed(() => ({
  opened: agentRows.value.filter(owner => effectiveStatus(owner) === 'opened').length,
  dead: agentRows.value.filter(owner => effectiveStatus(owner) === 'dead_shop').length,
  notOpened: agentRows.value.filter(owner => effectiveStatus(owner) === 'not_opened').length,
  pending: agentRows.value.filter(owner => effectiveStatus(owner) === 'pending_review').length,
}))
function resetSmartImport() { smartText.value=''; smartResult.value=null }
function applySmartText() {
  if (!smartText.value.trim()) return
  const parsed = parseOwnerIntake(smartText.value)
  smartResult.value = parsed
  if (parsed.name) intakeForm.name = parsed.name
  if (parsed.icNumber) intakeForm.icNumber = parsed.icNumber
  if (parsed.email) intakeForm.email = parsed.email
  if (parsed.phone) intakeForm.phone = parsed.phone
  if (parsed.bankCardNumber) intakeForm.bankCardNumber = parsed.bankCardNumber
  if (parsed.bankCvv) intakeForm.bankCvv = parsed.bankCvv
  if (parsed.bankExpiry) intakeForm.bankExpiry = parsed.bankExpiry
  if (parsed.bankAccount) intakeForm.bankAccount = parsed.bankAccount
  if (parsed.bankName) intakeForm.bankName = parsed.bankName
}
function handleSmartPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') || ''
  if (!text) return
  event.preventDefault(); smartText.value = text; nextTick(applySmartText)
}
function loadSmartExample() { smartText.value = smartExample; nextTick(applySmartText) }
function openIntake() {
  resetSmartImport()
  Object.assign(intakeForm, {
    id:'o'+Date.now(), name:'', phone:'', email:'', agentId:currentUser.value?.agentId || visibleAgents.value[0]?.id || '', companyId:'', loginEmail:'', icNumber:'', bankAccount:'', bankCardNumber:'', bankCvv:'', bankExpiry:'', bankHolder:'', bankName:'Hong Leong Bank',
    idCardFront:'', idCardBack:'', bankCardPhoto:'', bankCardBack:'', shopOpenProof:'', shopCloseProof:'', remark:'', isInvalid:false, status:'active' as const, createdAt:new Date().toISOString().slice(0,10),
  })
  submissionCompanyId.value = visibleCompanies.value[0]?.id || ''
  submissionShopTypeId.value = 'st1'
  submissionRemark.value = ''
  intakeOpen.value = true
}
function saveAndSubmit() {
  if (!intakeForm.name.trim() || !intakeForm.agentId) return
  const owner = JSON.parse(JSON.stringify(intakeForm)) as Owner
  saveOwner(owner)
  let result = { ok: true, reason: '' }
  if (currentUser.value?.role === 'sub_agent') {
    result = submitOwnerToTop(owner.id, submissionShopTypeId.value, submissionRemark.value)
  } else {
    if (!submissionCompanyId.value) { window.alert('请选择目标公司'); return }
    result = submitOwnerToCompany(owner.id, submissionCompanyId.value, submissionShopTypeId.value, submissionRemark.value)
  }
  if (!result.ok) { window.alert(result.reason); return }
  intakeOpen.value = false
}
function openSubmit(owner: Owner) {
  submitOwnerTarget.value = owner
  splitSubmission.value = pendingSubmission(owner.id)?.status === 'pending_top' ? pendingSubmission(owner.id) || null : null
  const existing = latestSubmission(owner.id)
  submissionCompanyId.value = ownerCompany(owner.id) || visibleCompanies.value[0]?.id || ''
  submissionShopTypeId.value = splitSubmission.value?.shopTypeId || existing?.shopTypeId || 'st1'
  submissionRemark.value = ''
  submitOpen.value = true
}
function submitFromPage() {
  if (!submitOwnerTarget.value) return
  let result = { ok: true, reason: '' }
  if (currentUser.value?.role === 'sub_agent') {
    result = submitOwnerToTop(submitOwnerTarget.value.id, submissionShopTypeId.value, submissionRemark.value)
  } else if (splitSubmission.value) {
    result = assignOwnerSubmissionToCompany(splitSubmission.value.id, submissionCompanyId.value, submissionRemark.value)
  } else {
    result = submitOwnerToCompany(submitOwnerTarget.value.id, submissionCompanyId.value, submissionShopTypeId.value, submissionRemark.value)
  }
  if (!result.ok) { window.alert(result.reason); return }
  submitOpen.value = false
}
function openReview(item: OwnerSubmission, decision: 'approved' | 'rejected') {
  reviewSubmission.value = item; reviewDecision.value = decision
  reviewRemark.value = decision === 'rejected' ? '资料不符合开店要求，请补充后重新提交。' : '资料审核通过，可安排开店。'
  reviewOpen.value = true
}
function confirmReview() {
  if (!reviewSubmission.value) return
  reviewOwnerSubmission(reviewSubmission.value.id, reviewDecision.value, reviewRemark.value)
  reviewOpen.value = false
}
function goCreateShop(item: OwnerSubmission) {
  router.push({ name: 'shops', query: { ownerId: item.ownerId, shopTypeId: item.shopTypeId, submissionId: item.id, create: '1' } })
}
</script>
<template>
  <div>
    <div class="page-toolbar">
      <div class="filter-search"><Icon name="search" :size="15"/><input v-model="search" class="input" placeholder="搜索人头、IC、公司或店铺类型"/></div>
      <select v-model="shopTypeFilter" class="select" style="width:170px"><option value="all">全部店铺类型</option><option v-for="type in state.shopTypes" :key="type.id" :value="type.id">{{ type.name }}</option></select>
      <select v-if="isCompanyView" v-model="submissionStatusFilter" class="select" style="width:145px"><option value="all">全部审核状态</option><option value="pending">待公司审核</option><option value="approved">已通过</option><option value="rejected">已驳回</option><option value="cancelled">已取消</option></select>
      <select v-else v-model="statusFilter" class="select" style="width:145px"><option value="all">全部业务状态</option><option value="opened">已开店</option><option value="dead_shop">挂店</option><option value="not_opened">未开店</option><option value="pending_review">待审核</option><option value="invalid">无效人头</option></select>
      <span class="spacer"/>
      <button v-if="!isCompanyView && can('manageOwners')" class="btn primary" @click="openIntake"><Icon name="plus" :size="15"/>添加人头并提交</button>
    </div>

    <section v-if="!isCompanyView" class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">已开店</span><span class="stat-icon"><Icon name="store" :size="16"/></span></div><div class="stat-value">{{ agentCounts.opened }}</div><div class="stat-foot">当前筛选范围内的已开店人头</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">挂店</span><span class="stat-icon" style="background:var(--danger-soft);color:var(--danger)"><Icon name="x" :size="16"/></span></div><div class="stat-value">{{ agentCounts.dead }}</div><div class="stat-foot">已关店或死店</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">未开店</span><span class="stat-icon"><Icon name="users" :size="16"/></span></div><div class="stat-value">{{ agentCounts.notOpened }}</div><div class="stat-foot">可以继续提交给公司</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">待审核</span><span class="stat-icon" style="background:var(--warning-soft);color:var(--warning)"><Icon name="alert" :size="16"/></span></div><div class="stat-value">{{ agentCounts.pending }}</div><div class="stat-foot">待顶级代理分配或待公司审核</div></article>
    </section>

    <section v-else class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">待公司审核</span><span class="stat-icon" style="background:var(--warning-soft);color:var(--warning)"><Icon name="alert" :size="16"/></span></div><div class="stat-value">{{ visibleSubmissions.filter(item=>item.status==='pending').length }}</div><div class="stat-foot">当前公司待处理</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">审核通过</span><span class="stat-icon"><Icon name="check" :size="16"/></span></div><div class="stat-value">{{ visibleSubmissions.filter(item=>item.status==='approved').length }}</div><div class="stat-foot">可安排开店</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">已驳回</span><span class="stat-icon" style="background:var(--danger-soft);color:var(--danger)"><Icon name="x" :size="16"/></span></div><div class="stat-value">{{ visibleSubmissions.filter(item=>item.status==='rejected').length }}</div><div class="stat-foot">代理可补充后重新提交</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">当前角色</span><span class="stat-icon"><Icon name="shield" :size="16"/></span></div><div class="stat-value" style="font-size: calc(20px + var(--font-boost))">{{ currentUser?.roleLabel }}</div><div class="stat-foot">公司审核与开店权限</div></article>
    </section>

    <div v-if="!isCompanyView" class="table-wrap"><table class="data-table"><thead><tr><th>人头</th><th>业务状态</th><th>店铺类型</th><th>提交/公司</th><th>归属代理</th><th>操作</th></tr></thead><tbody>
      <tr v-for="owner in agentRows" :key="owner.id">
        <td><div class="primary-cell">{{ owner.name }}</div><div class="secondary-line">{{ owner.icNumber || '未填写 IC' }} · {{ owner.phone || '未填写电话' }}</div></td>
        <td><span class="badge" :class="businessMeta[effectiveStatus(owner)].cls">{{ businessMeta[effectiveStatus(owner)].label }}</span></td>
        <td><span v-if="ownerTypes(owner.id).length" class="badge info no-dot">{{ ownerTypes(owner.id).join('、') }}</span><span v-else class="muted">未选择</span></td>
        <td><span v-if="pendingSubmission(owner.id)" class="badge warning">{{ statusMeta[pendingSubmission(owner.id)!.status].label }}</span><span v-else-if="latestSubmission(owner.id)" class="badge" :class="statusMeta[latestSubmission(owner.id)!.status].cls">{{ statusMeta[latestSubmission(owner.id)!.status].label }}</span><span v-else class="muted">尚未提交</span><div class="secondary-line">{{ ownerCompany(owner.id) ? companyName(ownerCompany(owner.id)) : '未分配公司' }}</div></td>
        <td>{{ agentName(owner.agentId) }}<div class="secondary-line">{{ currentUser?.role==='top_agent' && owner.agentId===currentUser.agentId ? '本人直管' : '代理树' }}</div></td>
        <td><div class="row-actions">
          <button v-if="!owner.isInvalid && !pendingSubmission(owner.id)" class="btn primary small" @click="openSubmit(owner)"><Icon name="send" :size="13"/>{{ currentUser?.role==='sub_agent' ? '提交人头' : '提交公司' }}</button>
          <button v-if="pendingSubmission(owner.id)?.status==='pending_top' && currentUser?.role==='top_agent'" class="btn primary small" @click="openSubmit(owner)"><Icon name="send" :size="13"/>分配公司</button>
          <button v-if="pendingSubmission(owner.id) && (currentUser?.role==='sub_agent' || currentUser?.role==='top_agent')" class="btn ghost small" @click="cancelOwnerSubmission(pendingSubmission(owner.id)!.id)">取消提交</button>
        </div></td>
      </tr>
      <tr v-if="!agentRows.length"><td colspan="6"><div class="table-empty"><Icon name="users" :size="30"/><div>没有匹配的人头提交信息</div></div></td></tr>
    </tbody></table></div>

    <div v-else class="table-wrap"><table class="data-table"><thead><tr><th>人头</th><th>提交公司</th><th>店铺类型</th><th>提交代理</th><th>提交时间</th><th>审核信息</th><th>状态</th><th>操作</th></tr></thead><tbody>
      <tr v-for="item in companySubmissions" :key="item.id"><td><div class="primary-cell">{{ ownerName(item.ownerId) }}</div><div class="secondary-line">{{ state.owners.find(owner=>owner.id===item.ownerId)?.icNumber || '未填写 IC' }}</div></td><td>{{ companyName(item.companyId) }}</td><td><span class="badge info no-dot">{{ shopTypeName(item.shopTypeId) }}</span></td><td>{{ agentName(item.fromAgentId) }}</td><td>{{ item.submittedAt }}</td><td style="max-width:220px;color:var(--muted)">{{ item.reviewedBy || '—' }}<div class="secondary-line">{{ item.remark || '无备注' }}</div></td><td><span class="badge" :class="statusMeta[item.status].cls">{{ statusMeta[item.status].label }}</span></td><td><div class="row-actions"><button v-if="item.status==='pending'" class="btn danger small" @click="openReview(item,'rejected')">驳回</button><button v-if="item.status==='pending'" class="btn primary small" @click="openReview(item,'approved')">审核通过</button><button v-if="item.status==='approved'" class="btn primary small" @click="goCreateShop(item)">去开店</button></div></td></tr>
      <tr v-if="!companySubmissions.length"><td colspan="8"><div class="table-empty"><Icon name="file" :size="30"/><div>没有匹配的人头提交记录</div></div></td></tr>
    </tbody></table></div>

    <Modal :open="intakeOpen" title="添加人头并提交" width="960px" @close="intakeOpen=false">
      <template #subtitle><p>顶级代理可直接选择公司提交；子代理选择店铺类型后先提交给顶级代理分配。</p></template>
      <section class="smart-import"><div class="card-head" style="margin:0 0 9px"><div><h3>智能粘贴识别</h3><p>支持直接粘贴姓名、IC、邮箱、银行卡和电话资料。</p></div><Icon name="sparkles" :size="20"/></div><textarea v-model="smartText" class="textarea smart-textarea" @paste="handleSmartPaste"></textarea><div class="row" style="gap:8px;margin-top:8px"><button class="btn primary" @click="applySmartText">自动识别并填入</button><button class="btn secondary" @click="loadSmartExample">载入示例</button><span v-if="smartResult" class="badge success no-dot">已识别 {{ smartResult.matched.length }} 个字段</span></div></section>
      <div class="form-grid three" style="margin-top:14px">
        <div class="field"><label>姓名 <b>*</b></label><input v-model="intakeForm.name" class="input"/></div><div class="field"><label>IC 卡号</label><input v-model="intakeForm.icNumber" class="input"/></div><div class="field"><label>联系电话</label><input v-model="intakeForm.phone" class="input"/></div>
        <div class="field"><label>邮箱</label><input v-model="intakeForm.email" class="input"/></div><div class="field"><label>银行名称</label><input v-model="intakeForm.bankName" class="input"/></div><div class="field"><label>银行账号 ACC</label><input v-model="intakeForm.bankAccount" class="input"/></div>
        <div class="field"><label>银行卡号</label><input v-model="intakeForm.bankCardNumber" class="input"/></div><div class="field"><label>CVV</label><input v-model="intakeForm.bankCvv" class="input"/></div><div class="field"><label>Valid Thru</label><input v-model="intakeForm.bankExpiry" class="input"/></div>
        <div class="field"><label>归属代理</label><select v-model="intakeForm.agentId" class="select"><option v-for="agent in visibleAgents" :key="agent.id" :value="agent.id">{{ agent.name }}</option></select></div>
        <div class="field"><label>店铺类型 <b>*</b></label><select v-model="submissionShopTypeId" class="select"><option v-for="type in state.shopTypes" :key="type.id" :value="type.id">{{ type.name }}</option></select></div>
        <div v-if="currentUser?.role!=='sub_agent'" class="field"><label>提交公司 <b>*</b></label><select v-model="submissionCompanyId" class="select"><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select></div>
      </div>
      <div class="media-grid" style="margin-top:14px"><MediaField v-model="intakeForm.idCardFront" label="身份证正面" @preview="preview=$event"/><MediaField v-model="intakeForm.idCardBack" label="身份证反面" @preview="preview=$event"/><MediaField v-model="intakeForm.bankCardPhoto" label="银行卡正面" @preview="preview=$event"/><MediaField v-model="intakeForm.bankCardBack" label="银行卡反面" @preview="preview=$event"/></div>
      <div class="field" style="margin-top:14px"><label>备注</label><textarea v-model="submissionRemark" class="textarea"></textarea></div>
      <template #footer><button class="btn secondary" @click="intakeOpen=false">取消</button><button class="btn primary" @click="saveAndSubmit"><Icon name="send" :size="15"/>保存并提交</button></template>
    </Modal>

    <Modal :open="submitOpen" :title="splitSubmission ? '分配公司' : (currentUser?.role==='sub_agent' ? '提交人头给顶级代理' : '提交人头给公司')" width="680px" @close="submitOpen=false">
      <template #subtitle><p>{{ submitOwnerTarget?.name }}</p></template>
      <div class="form-grid">
        <div v-if="currentUser?.role!=='sub_agent'" class="field"><label>目标公司</label><select v-model="submissionCompanyId" class="select"><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select></div>
        <div class="field"><label>店铺类型</label><select v-model="submissionShopTypeId" class="select" :disabled="Boolean(splitSubmission)"><option v-for="type in state.shopTypes" :key="type.id" :value="type.id">{{ type.name }}</option></select></div>
        <div class="field full"><label>提交备注</label><textarea v-model="submissionRemark" class="textarea"></textarea></div>
      </div>
      <template #footer><button class="btn secondary" @click="submitOpen=false">取消</button><button class="btn primary" @click="submitFromPage"><Icon name="send" :size="15"/>确认提交</button></template>
    </Modal>

    <Modal :open="reviewOpen" :title="reviewDecision==='approved'?'审核通过人头提交':'驳回头人提交'" @close="reviewOpen=false"><div class="field"><label>审核备注</label><textarea v-model="reviewRemark" class="textarea"></textarea></div><template #footer><button class="btn secondary" @click="reviewOpen=false">取消</button><button class="btn" :class="reviewDecision==='approved'?'primary':'danger'" @click="confirmReview">确认</button></template></Modal>
    <Teleport to="body"><div v-if="preview" class="media-lightbox" @click.self="preview=null"><div class="media-lightbox-panel"><div class="media-lightbox-head"><strong>{{ preview.label }}</strong><button class="icon-btn" @click="preview=null"><Icon name="x"/></button></div><img :src="preview.url"/></div></div></Teleport>
  </div>
</template>
