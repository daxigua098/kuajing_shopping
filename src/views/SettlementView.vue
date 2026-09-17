<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { agentName, can, companyName, confirmSettlement, currentUser, generateSettlement, ownerName, paySettlement, shopName, state, visibleAgentIds, visibleBatches, visibleCompanies, visibleExpenses } from '@/store'
import type { SettlementBatch, SettlementDetail } from '@/types'
import { isShopInProtection } from '@/utils/protection'
import { isAliveInMonth, modeLabel } from '@/utils/settlement'
import { money, number } from '@/utils/format'
import { downloadRows } from '@/utils/export'

const month=ref('2026-08')
const viewMode=ref<'rent'|'expense'>('rent')
const includeExpenseProof=ref(false)
const showProtectionPeriod=ref(false)
const statusFilter=ref('all')
const expenseStatusFilter=ref('all')
const search=ref('')
const activeBatch=computed<SettlementBatch|undefined>(()=>visibleBatches.value.find(batch=>batch.month===month.value))
const baseDetails=computed<SettlementDetail[]>(()=>state.settlementDetails.filter(detail=>detail.batchId===activeBatch.value?.id&&(currentUser.value?.role==='platform'||(currentUser.value?.role==='company'?detail.companyId===currentUser.value.companyId:visibleAgentIds.value.includes(detail.agentId)))&&(!search.value.trim()||[shopName(detail.shopId),ownerName(detail.ownerId),agentName(detail.agentId),state.shops.find(shop=>shop.id===detail.shopId)?.code||''].some(v=>v.toLowerCase().includes(search.value.trim().toLowerCase())))))
const isProtectedDetail=(detail:SettlementDetail)=>{const shop=state.shops.find(item=>item.id===detail.shopId);return shop?isShopInProtection(shop,month.value):false}
const details=computed<SettlementDetail[]>(()=>baseDetails.value.filter(detail=>(statusFilter.value==='all'||detail.status===statusFilter.value)&&(showProtectionPeriod.value?isProtectedDetail(detail):!isProtectedDetail(detail))))
const expenseRows=computed(()=>visibleExpenses.value.filter(item=>item.expenseMonth===month.value&&baseDetails.value.some(detail=>detail.shopId===item.shopId)&&(!search.value.trim()||[shopName(item.shopId),item.purpose,agentName(item.advanceAgentId),item.remark].some(v=>v.toLowerCase().includes(search.value.trim().toLowerCase())))&&(expenseStatusFilter.value==='all'||item.status===expenseStatusFilter.value)))
const rentSummaryRows=computed(()=>{
  const map=new Map<string,{agentId:string;agent:string;companies:Set<string>;shops:Set<string>;alive:number;monthly:number;head:number;rent:number}>()
  details.value.forEach(detail=>{
    const key=detail.agentId
    const row=map.get(key)||{agentId:detail.agentId,agent:agentName(detail.agentId),companies:new Set<string>(),shops:new Set<string>(),alive:0,monthly:0,head:0,rent:0}
    row.companies.add(companyName(detail.companyId));row.shops.add(detail.shopId);if(detail.rent>0)row.alive+=1;if(detail.mode==='head_fee')row.head+=1;else row.monthly+=1;row.rent+=detail.rent;map.set(key,row)
  })
  return [...map.values()].map(row=>({...row,companyList:[...row.companies].join('、'),shopCount:row.shops.size}))
})
const expenseSummaryRows=computed(()=>{
  const map=new Map<string,{key:string;company:string;agent:string;count:number;pending:number;settled:number;rejected:number;amount:number}>()
  expenseRows.value.forEach(item=>{
    const key=item.companyId+'|'+item.advanceAgentId
    const row=map.get(key)||{key,company:companyName(item.companyId),agent:agentName(item.advanceAgentId),count:0,pending:0,settled:0,rejected:0,amount:0}
    row.count+=1;row.amount+=item.amount;if(item.status==='pending')row.pending+=1;else if(item.status==='settled')row.settled+=1;else row.rejected+=1;map.set(key,row)
  })
  return [...map.values()]
})
const isCompanyUser=computed(()=>currentUser.value?.role==='company')
function monthDistance(openDate:string,targetMonth:string){const [oy,om]=openDate.slice(0,7).split('-').map(Number);const [ty,tm]=targetMonth.split('-').map(Number);return (ty-oy)*12+(tm-om)}
function companyRentBilling(detail:SettlementDetail){const shop=state.shops.find(item=>item.id===detail.shopId);if(!shop)return {billable:false,reason:'店铺不存在',amount:0,mode:null as null|string};const config=state.companySettlementConfigs.find(item=>item.shopId===shop.id&&item.companyId===detail.companyId&&item.status==='active');if(!config)return {billable:false,reason:'未设置公司结算模式',amount:0,mode:null as null|string};if(config.mode==='one_time'){return config.effectiveMonth===month.value?{billable:true,reason:'一次性开店结算',amount:config.amount,mode:config.mode}:{billable:false,reason:'一次性金额已过生效月份',amount:0,mode:config.mode}}if(isShopInProtection(shop,month.value))return {billable:true,reason:'按月·保护期内',amount:config.amount,mode:config.mode};if(isAliveInMonth(shop,month.value))return {billable:true,reason:'按月·上月存活',amount:config.amount,mode:config.mode};return {billable:false,reason:'未存活且不在保护期',amount:0,mode:config.mode}}
function monthEndText(targetMonth:string){const [year,m]=targetMonth.split('-').map(Number);return new Date(Date.UTC(year,m,0)).toISOString().slice(0,10)}
function survivalDays(openDate:string,closeDate:string|null,targetMonth:string){const start=new Date(openDate+'T00:00:00Z').getTime();const end=new Date((closeDate||monthEndText(targetMonth))+'T00:00:00Z').getTime();return Math.max(0,Math.floor((end-start)/86400000)+1)}
function periodText(days:number){if(days<=0)return '0天';const months=Math.floor(days/30);const remain=days%30;return months?months+'个月'+remain+'天':remain+'天'}
const companyRentRows=computed(()=>details.value.map(detail=>{const shop=state.shops.find(item=>item.id===detail.shopId);const days=shop?survivalDays(shop.openDate,shop.closeDate,month.value):0;return {detail,shop,billing:companyRentBilling(detail),survivalDays:days,survivalText:periodText(days)}}).filter(row=>row.shop&&row.billing.billable))
const companyRentSummary=computed(()=>visibleCompanies.value.map(company=>{const rows=companyRentRows.value.filter(row=>row.detail.companyId===company.id);const avgDays=rows.length?Math.round(rows.reduce((sum,row)=>sum+row.survivalDays,0)/rows.length):0;return {company,oneTime:rows.filter(row=>row.billing.reason==='一次性开店结算').length,alive:rows.filter(row=>row.billing.reason==='按月·上月存活').length,protected:rows.filter(row=>row.billing.reason==='按月·保护期内').length,count:rows.length,rent:rows.reduce((sum,row)=>sum+row.billing.amount,0),averageSurvival:periodText(avgDays)}}))
const companyRentTotal=computed(()=>companyRentSummary.value.reduce((sum,row)=>sum+row.rent,0))
const viewTotal=computed(()=>viewMode.value==='rent'?(isCompanyUser.value?companyRentTotal.value:details.value.reduce((sum,item)=>sum+item.rent,0)):expenseRows.value.reduce((sum,item)=>sum+item.amount,0))
const viewCount=computed(()=>viewMode.value==='rent'?(isCompanyUser.value?companyRentRows.value.length:details.value.filter(item=>item.rent>0).length):expenseRows.value.length)
const pendingExpenseCount=computed(()=>visibleExpenses.value.filter(item=>item.expenseMonth===month.value&&item.status==='pending').length)
const progress=computed(()=>activeBatch.value?.status==='paid'?100:activeBatch.value?.status==='confirmed'?78:pendingExpenseCount.value?48:65)
const companyTotals=computed(()=>visibleCompanies.value.map(company=>{
  const rows=state.settlementDetails.filter(detail=>detail.batchId===activeBatch.value?.id&&detail.companyId===company.id&&(currentUser.value?.role==='platform'||visibleAgentIds.value.includes(detail.agentId)))
  return {company,count:rows.length,amount:rows.reduce((sum,row)=>sum+row.rent+row.expense,0),expense:rows.reduce((sum,row)=>sum+row.expense,0)}
}))
function recalculate(){
  if(!window.confirm('将按当前店铺存活、规则和历史杂费重新生成 '+month.value+' 批次。已支付批次不会被覆盖。')) return
  generateSettlement(month.value)
}
function confirmBatch(){if(activeBatch.value&&pendingExpenseCount.value===0)confirmSettlement(activeBatch.value.id);else window.alert('仍有待确认杂费，请先在垫付杂费模块处理。')}
function payBatch(){if(activeBatch.value){paySettlement(activeBatch.value.id)}}
function exportBatch(){
  if(!activeBatch.value)return
  if(viewMode.value==='rent' && isCompanyUser.value) downloadRows('公司店租明细-'+activeBatch.value.month,['店铺编号','店铺','公司','地区','开店日期','关店日期','存活周期','店铺保护期','计费口径','月租'],companyRentRows.value.map(row=>[row.shop?.code||'',row.shop?.name||'',companyName(row.detail.companyId),row.shop?.region||'',row.shop?.openDate||'',row.shop?.closeDate||'未关店',row.survivalText,row.shop?.protectionPeriodMonths?(row.shop.protectionPeriodName||row.shop.protectionPeriodMonths+'个月保护期'):'无保护期',row.billing.reason,row.billing.amount]),'csv')
  else if(viewMode.value==='rent') downloadRows('店租明细-'+activeBatch.value.month,['店铺编号','店铺','人头','代理','公司','结算模式','店租','状态','核算说明'],details.value.filter(item=>item.rent>0).map(detail=>[state.shops.find(s=>s.id===detail.shopId)?.code||'',shopName(detail.shopId),ownerName(detail.ownerId),agentName(detail.agentId),companyName(detail.companyId),modeLabel(detail.mode),detail.rent,detail.status,detail.reason]),'csv')
  else {
    const headers=['店铺编号','店铺','人头','代理','公司','垫付代理','用途','金额','币种','凭证状态','状态',...(includeExpenseProof.value?['费用凭证图片']:[])]
    const rows=expenseRows.value.map(item=>[state.shops.find(s=>s.id===item.shopId)?.code||'',shopName(item.shopId),ownerName(state.shops.find(s=>s.id===item.shopId)?.ownerId||''),agentName(state.shops.find(s=>s.id===item.shopId)?.agentId||''),companyName(item.companyId),agentName(item.advanceAgentId),item.purpose,item.amount,item.currency,item.attachment?'已上传截图':'无',item.status,...(includeExpenseProof.value?[item.attachment||'']:[])])
    downloadRows('杂费明细-'+activeBatch.value.month,headers,rows,'csv')
  }
}
function exportSummary(){
  if(!activeBatch.value)return
  if(viewMode.value==='rent' && isCompanyUser.value) downloadRows('公司店租汇总报表-'+activeBatch.value.month,['公司','一次性店','上月存活店','保护期内店','计费店数','平均存活周期','公司应付店租'],companyRentSummary.value.map(row=>[row.company.name,row.oneTime,row.alive,row.protected,row.count,row.averageSurvival,row.rent]),'csv')
  else if(viewMode.value==='rent') downloadRows('店租汇总报表-'+activeBatch.value.month,['代理','承接公司','店铺数','存活/计费店','按月店','砍头店','店租合计'],rentSummaryRows.value.map(row=>[row.agent,row.companyList,row.shopCount,row.alive,row.monthly,row.head,row.rent]),'csv')
  else downloadRows('杂费汇总报表-'+activeBatch.value.month,['公司','垫付代理','费用笔数','待确认','已结清','已驳回','杂费合计'],expenseSummaryRows.value.map(row=>[row.company,row.agent,row.count,row.pending,row.settled,row.rejected,row.amount]),'csv')
}
</script>
<template>
  <div>
    <div class="page-toolbar">
      <input v-model="month" class="input" type="month" style="width:155px"/>
      <div class="segmented"><button :class="{active:viewMode==='rent'}" @click="viewMode='rent'">店租</button><button :class="{active:viewMode==='expense'}" @click="viewMode='expense'">杂费</button></div>
      <div v-if="viewMode==='rent'" class="segmented"><button v-for="tab in [{v:'all',t:'全部明细'},{v:'draft',t:'待确认'},{v:'confirmed',t:'已确认'},{v:'paid',t:'已支付'}]" :key="tab.v" :class="{active:statusFilter===tab.v}" @click="statusFilter=tab.v">{{tab.t}}</button></div>
      <div v-else class="segmented"><button v-for="tab in [{v:'all',t:'全部'},{v:'pending',t:'待确认'},{v:'settled',t:'已结清'},{v:'rejected',t:'已驳回'}]" :key="tab.v" :class="{active:expenseStatusFilter===tab.v}" @click="expenseStatusFilter=tab.v">{{tab.t}}</button></div>
      <label v-if="viewMode==='expense'" class="badge info no-dot" style="cursor:pointer"><input v-model="includeExpenseProof" type="checkbox" style="margin-right:5px"/>导出费用凭证图片</label>
      <label v-if="isCompanyUser && viewMode==='rent'" class="badge info no-dot" style="cursor:pointer"><input v-model="showProtectionPeriod" type="checkbox" style="margin-right:5px"/>店铺保护期</label>
      <span class="spacer"/>
      <button class="btn secondary" @click="exportBatch"><Icon name="download" :size="15"/>导出批次明细</button>
      <button v-if="can('manageAgents')" class="btn secondary" @click="recalculate"><Icon name="history" :size="15"/>重新核算</button>
      <button v-if="activeBatch?.status==='draft' && can('companyPayment')" class="btn primary" @click="confirmBatch"><Icon name="check" :size="15"/>确认核算批次</button>
      <button v-if="activeBatch?.status==='confirmed' && can('companyPayment')" class="btn primary" @click="payBatch"><Icon name="wallet" :size="15"/>登记支付</button>
    </div>
    <section v-if="activeBatch" class="dashboard-hero" style="background:linear-gradient(115deg,var(--surface),var(--surface-2));color:var(--ink);box-shadow:var(--shadow);border:1px solid var(--line)">
      <div class="row between center" style="position:relative;z-index:2;gap:20px;flex-wrap:wrap">
        <div><div class="badge" :class="activeBatch.status==='paid'?'success':activeBatch.status==='confirmed'?'info':'warning'">{{ activeBatch.status==='paid'?'已支付':activeBatch.status==='confirmed'?'已确认待支付':'草稿待确认' }}</div><h2 style="font-size: calc(24px + var(--font-boost));margin:10px 0 5px">{{ activeBatch.month }} {{ viewMode==='rent'?'店租':'杂费' }}汇总 · {{ money(viewTotal) }}</h2><p style="color:var(--muted)">规则快照 {{ activeBatch.ruleVersion }} · 当前视图 {{ viewCount }} 条 · 生成于 {{ activeBatch.createdAt }}</p></div>
        <div class="stat-inline"><div><span>{{ viewMode==='rent'?'店租合计':'杂费合计' }}</span><strong>{{ money(viewTotal) }}</strong></div><div v-if="viewMode==='rent'"><template v-if="isCompanyUser"><span>一次性 / 存活 / 保护</span><strong>{{ companyRentSummary.reduce((n,r)=>n+r.oneTime,0) }} / {{ companyRentSummary.reduce((n,r)=>n+r.alive,0) }} / {{ companyRentSummary.reduce((n,r)=>n+r.protected,0) }}</strong></template><template v-else><span>按月 / 砍头</span><strong>{{ details.filter(d=>d.rent>0&&d.mode==='monthly').length }} / {{ details.filter(d=>d.rent>0&&d.mode==='head_fee').length }}</strong></template></div><div v-else><span>待公司确认</span><strong :style="{color:pendingExpenseCount?'var(--warning)':'var(--success)'}">{{ expenseRows.filter(e=>e.status==='pending').length }} 笔</strong></div></div>
      </div>
    </section>
    <div v-else class="empty-state card"><Icon name="wallet" :size="34"/><h3>该月份还没有核算批次</h3><p>点击“重新核算”按店铺存活和规则生成。</p></div>
    <template v-if="activeBatch">
      <section class="grid-3" style="margin-bottom:15px">
        <article class="card card-pad"><div class="card-head"><div><h3>核算进度</h3><p>从快照生成到支付完成</p></div><strong style="font-size: calc(21px + var(--font-boost))">{{ progress }}%</strong></div><div class="progress-track"><i :style="{width:progress+'%'}"/></div><div class="pipeline" style="margin-top:18px"><div class="pipeline-node"><strong>存活快照</strong><span>已完成</span></div><div class="pipeline-node"><strong>规则匹配</strong><span>{{ activeBatch.ruleVersion }}</span></div><div class="pipeline-node"><strong>凭证确认</strong><span>{{ pendingExpenseCount?pendingExpenseCount+' 笔待办':'已完成' }}</span></div><div class="pipeline-node"><strong>支付登记</strong><span>{{ activeBatch.status==='paid'?'已完成':'待处理' }}</span></div></div></article>
        <article class="card card-pad"><div class="card-head"><div><h3>{{ viewMode==='rent'?(isCompanyUser?'公司应付店租':'店租代理汇总'):'杂费公司汇总' }}</h3><p>{{ viewMode==='rent'?(isCompanyUser?'仅按存活和店铺保护期计算':'按代理汇总店租与店铺模式'):'按公司和垫付代理汇总报销' }}</p></div><Icon :name="viewMode==='rent'?'building':'receipt'" :size="18"/></div><template v-if="viewMode==='rent' && isCompanyUser"><div v-for="row in companyRentSummary" :key="row.company.id" class="key-value"><span>{{ row.company.name }} · {{ row.count }} 家计费店</span><strong>{{ money(row.rent) }}</strong></div></template><template v-else-if="viewMode==='rent'"><div v-for="row in rentSummaryRows.slice(0,5)" :key="row.agentId" class="key-value"><span>{{ row.agent }} · {{ row.shopCount }} 店</span><strong>{{ money(row.rent) }}</strong></div></template><template v-else><div v-for="row in expenseSummaryRows.slice(0,5)" :key="row.key" class="key-value"><span>{{ row.company }} · {{ row.agent }}</span><strong>{{ money(row.amount) }}</strong></div></template></article>
        <article v-if="pendingExpenseCount" class="card card-pad"><div class="callout warning"><Icon name="alert" :size="18"/><div><strong>{{ pendingExpenseCount }} 笔杂费待确认</strong><p>为避免报销金额未核实，批次含待确认杂费时不能执行确认。</p></div></div><div style="margin-top:14px"><div class="stat-label">待确认金额</div><div class="stat-value" style="font-size: calc(21px + var(--font-boost))">{{ money(visibleExpenses.filter(e=>e.expenseMonth===month&&e.status==='pending').reduce((n,e)=>n+e.amount,0)) }}</div></div></article>
        <article v-else class="card card-pad"><div class="callout info"><Icon name="shield" :size="18"/><div><strong>批次可以确认</strong><p>所有杂费已核实。确认后明细锁定，修正需走调整单或重新生成流程。</p></div></div><button v-if="can('companyPayment')" class="btn primary block" style="margin-top:15px" @click="confirmBatch">确认 {{ activeBatch.month }} 批次</button></article>
      </section>
      <article class="card card-pad" style="margin-bottom:15px">
        <div class="card-head"><div><h3>{{ viewMode==='rent'?'店租汇总报表':'杂费汇总报表' }}</h3><p>{{ viewMode==='rent'?'按代理汇总店铺数、存活计费店、模式和店租':'按公司、垫付代理汇总费用笔数和报销状态' }}</p></div><button class="btn primary" @click="exportSummary"><Icon name="download" :size="15"/>导出汇总报表</button></div>
        <div v-if="viewMode==='rent'" class="table-wrap" style="box-shadow:none"><table v-if="isCompanyUser" class="data-table"><thead><tr><th>公司</th><th>一次性店</th><th>上月存活店</th><th>保护期内店</th><th>计费店数</th><th>平均存活周期</th><th>公司应付店租</th></tr></thead><tbody><tr v-for="row in companyRentSummary" :key="row.company.id"><td class="primary-cell">{{ row.company.name }}</td><td class="amount" style="color:var(--accent)">{{ row.oneTime }}</td><td class="amount positive">{{ row.alive }}</td><td class="amount" style="color:var(--primary)">{{ row.protected }}</td><td>{{ row.count }}</td><td><span class="badge info no-dot">{{ row.averageSurvival }}</span></td><td class="amount">{{ money(row.rent) }}</td></tr><tr v-if="!companyRentSummary.length"><td colspan="7"><div class="table-empty">没有公司店租数据</div></td></tr></tbody></table><table v-else class="data-table"><thead><tr><th>代理</th><th>承接公司</th><th>店铺数</th><th>存活/计费店</th><th>按月店</th><th>砍头店</th><th>店租合计</th></tr></thead><tbody><tr v-for="row in rentSummaryRows" :key="row.agentId"><td class="primary-cell">{{ row.agent }}</td><td>{{ row.companyList }}</td><td>{{ row.shopCount }}</td><td class="amount positive">{{ row.alive }}</td><td>{{ row.monthly }}</td><td>{{ row.head }}</td><td class="amount">{{ money(row.rent) }}</td></tr><tr v-if="!rentSummaryRows.length"><td colspan="7"><div class="table-empty">没有店租汇总数据</div></td></tr></tbody></table></div>
        <div v-else class="table-wrap" style="box-shadow:none"><table class="data-table"><thead><tr><th>公司</th><th>垫付代理</th><th>费用笔数</th><th>待确认</th><th>已结清</th><th>已驳回</th><th>杂费合计</th></tr></thead><tbody><tr v-for="row in expenseSummaryRows" :key="row.key"><td class="primary-cell">{{ row.company }}</td><td>{{ row.agent }}</td><td>{{ row.count }}</td><td class="amount" style="color:var(--warning)">{{ row.pending }}</td><td class="amount positive">{{ row.settled }}</td><td class="amount negative">{{ row.rejected }}</td><td class="amount">{{ money(row.amount) }}</td></tr><tr v-if="!expenseSummaryRows.length"><td colspan="7"><div class="table-empty">没有杂费汇总数据</div></td></tr></tbody></table></div>
      </article>
      <div class="page-toolbar"><div class="filter-search"><Icon name="search" :size="15"/><input v-model="search" class="input" placeholder="搜索店铺、人头、代理、用途"/></div><span class="spacer"/><button class="btn secondary" @click="exportBatch"><Icon name="download" :size="15"/>导出当前明细</button><span class="hint">共 {{ viewMode==='rent' ? (isCompanyUser ? companyRentRows.length : details.filter(d=>d.rent>0).length) : expenseRows.length }} 条明细</span></div>
      <div v-if="viewMode==='rent'" class="table-wrap"><table v-if="isCompanyUser" class="data-table"><thead><tr><th>店铺</th><th>公司</th><th>地区</th><th>开店日期</th><th>关店日期</th><th>存活周期</th><th>店铺保护期</th><th>计费口径</th><th>公司应付店租</th></tr></thead><tbody><tr v-for="row in companyRentRows" :key="row.detail.id"><td><div class="primary-cell">{{ row.shop?.code }}</div><div class="secondary-line">{{ row.shop?.name }}</div></td><td>{{ companyName(row.detail.companyId) }}</td><td>{{ row.shop?.region }}</td><td>{{ row.shop?.openDate }}</td><td>{{ row.shop?.closeDate||'未关店' }}</td><td><span class="badge info no-dot">{{ row.survivalText }}</span></td><td>{{ row.shop?.protectionPeriodMonths ? (row.shop?.protectionPeriodName || row.shop?.protectionPeriodMonths+'个月保护期') : '无保护期' }}<div class="secondary-line">{{ row.shop?.protectionPeriodMonths || 0 }} 个月</div></td><td><span class="badge" :class="row.billing.reason==='按月·上月存活'?'success':row.billing.reason==='一次性开店结算'?'warning':'info'">{{ row.billing.reason }}</span></td><td class="amount">{{ money(row.billing.amount) }}</td></tr><tr v-if="!companyRentRows.length"><td colspan="9"><div class="table-empty">没有公司店租明细</div></td></tr></tbody></table><table v-else class="data-table"><thead><tr><th>店铺</th><th>人头 / 代理</th><th>公司</th><th>模式</th><th>店租</th><th>核算说明</th><th>状态</th></tr></thead><tbody><tr v-for="detail in details.filter(d=>d.rent>0)" :key="detail.id"><td><div class="primary-cell">{{ state.shops.find(s=>s.id===detail.shopId)?.code }}</div><div class="secondary-line">{{ shopName(detail.shopId) }}</div></td><td>{{ ownerName(detail.ownerId) }}<div class="secondary-line">{{ agentName(detail.agentId) }}</div></td><td>{{ companyName(detail.companyId) }}</td><td><span class="mode-chip" :class="{head:detail.mode==='head_fee'}">{{ modeLabel(detail.mode) }}</span></td><td class="amount">{{ money(detail.rent) }}</td><td style="max-width:220px;color:var(--muted)">{{ detail.reason }}</td><td><span class="badge" :class="detail.status==='paid'?'success':detail.status==='confirmed'?'info':'warning'">{{ detail.status==='paid'?'已支付':detail.status==='confirmed'?'已确认':'待确认' }}</span></td></tr><tr v-if="!details.some(d=>d.rent>0)"><td colspan="7"><div class="table-empty">没有店租明细</div></td></tr></tbody></table></div>
      <div v-else class="table-wrap"><table class="data-table"><thead><tr><th>店铺</th><th>人头 / 代理</th><th>公司</th><th>垫付代理</th><th>用途</th><th>金额</th><th>凭证</th><th>状态</th></tr></thead><tbody><tr v-for="item in expenseRows" :key="item.id"><td><div class="primary-cell">{{ state.shops.find(s=>s.id===item.shopId)?.code }}</div><div class="secondary-line">{{ shopName(item.shopId) }}</div></td><td>{{ ownerName(state.shops.find(s=>s.id===item.shopId)?.ownerId||'') }}<div class="secondary-line">{{ agentName(state.shops.find(s=>s.id===item.shopId)?.agentId||'') }}</div></td><td>{{ companyName(item.companyId) }}</td><td>{{ agentName(item.advanceAgentId) }}</td><td>{{ item.purpose }}</td><td class="amount">{{ money(item.amount,item.currency) }}</td><td>{{ item.attachment?'已上传截图':'无凭证' }}</td><td><span class="badge" :class="item.status==='settled'?'success':item.status==='rejected'?'danger':'warning'">{{ item.status==='settled'?'已结清':item.status==='rejected'?'已驳回':'待确认' }}</span></td></tr><tr v-if="!expenseRows.length"><td colspan="8"><div class="table-empty">没有杂费明细</div></td></tr></tbody></table></div>
      <div class="callout info" style="margin-top:15px"><Icon name="shield" :size="18"/><div><strong>{{ isCompanyUser ? '公司计费口径' : '核算原则' }}</strong><p v-if="isCompanyUser">公司只按上月存活店铺及每家店铺实际选择的保护期计算店租；代理内部如何分配给子代理、人头与公司无关，不在公司页面展示。</p><p v-else>上月任一天存活即算整月；关店后次月停止结算；砍头模式仅首月支付；杂费由顶级代理垫付后公司全额报销。</p></div></div>
    </template>
  </div>
</template>
