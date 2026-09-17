<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { companyName, currentUser, state, visibleAgentIds, visibleBatches, visibleCompanies } from '@/store'
import { money } from '@/utils/format'
import { downloadRows } from '@/utils/export'

const selectedBatchId=ref(visibleBatches.value.find(b=>b.month==='2026-08')?.id||visibleBatches.value[0]?.id||'')
const batch=computed(()=>visibleBatches.value.find(item=>item.id===selectedBatchId.value))
const companyRows=computed(()=>visibleCompanies.value.map(company=>{
  const details=state.settlementDetails.filter(detail=>detail.batchId===batch.value?.id&&detail.companyId===company.id&&(currentUser.value?.role==='platform'||visibleAgentIds.value.includes(detail.agentId)))
  const payable=details.reduce((n,d)=>n+d.rent+d.expense,0)
  const paid=batch.value?.status==='paid'?payable:batch.value?.status==='confirmed'?payable*.72:0
  return {company,payable,paid,diff:paid-payable,count:details.length}
}))
const paidTotal=computed(()=>companyRows.value.reduce((n,x)=>n+x.paid,0))
const payableTotal=computed(()=>companyRows.value.reduce((n,x)=>n+x.payable,0))
const rate=computed(()=>Math.round(paidTotal.value/Math.max(1,payableTotal.value)*100))
function exportReconciliation(){if(!batch.value)return;downloadRows('对账-'+batch.value.month,['公司','店铺数','应结','实结','差异','批次状态'],companyRows.value.map(row=>[row.company.name,row.count,row.payable,row.paid,row.diff,batch.value?.status || '']),'csv')}
</script>
<template>
  <div>
    <div class="page-toolbar">
      <select v-model="selectedBatchId" class="select" style="width:210px"><option v-for="item in visibleBatches" :key="item.id" :value="item.id">{{ item.month }} · {{ item.status==='paid'?'已支付':item.status==='confirmed'?'已确认':'草稿' }}</option></select>
      <span class="spacer"/>
      <button class="btn secondary" @click="exportReconciliation"><Icon name="download" :size="15"/>导出对账单</button>
    </div>
    <section v-if="batch" class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">本期公司应结</span><span class="stat-icon"><Icon name="scale" :size="16"/></span></div><div class="stat-value" style="font-size: calc(21px + var(--font-boost))">{{ money(payableTotal) }}</div><div class="stat-foot">{{ batch.month }} 核算批次</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">已登记支付</span><span class="stat-icon"><Icon name="check" :size="16"/></span></div><div class="stat-value" style="font-size: calc(21px + var(--font-boost))">{{ money(paidTotal) }}</div><div class="stat-foot">支付完成率 {{ rate }}%</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">未结差额</span><span class="stat-icon" style="background:var(--warning-soft);color:var(--warning)"><Icon name="alert" :size="16"/></span></div><div class="stat-value" style="font-size: calc(21px + var(--font-boost))">{{ money(Math.max(0,payableTotal-paidTotal)) }}</div><div class="stat-foot">应结减实结</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">状态</span><span class="stat-icon"><Icon name="history" :size="16"/></span></div><div class="stat-value" style="font-size: calc(21px + var(--font-boost))">{{ batch.status==='paid'?'已结清':batch.status==='confirmed'?'待支付':'待确认' }}</div><div class="stat-foot">{{ batch.confirmedAt||'尚未确认' }}</div></article>
    </section>
    <section v-if="batch" class="grid-2">
      <article class="card card-pad"><div class="card-head"><div><h3>公司维度对账</h3><p>本期店租 + 垫付杂费应结与实际支付</p></div><span class="badge" :class="batch.status==='paid'?'success':'warning'">{{ batch.status==='paid'?'已对平':'存在差额' }}</span></div><div class="table-wrap" style="box-shadow:none"><table class="data-table" style="min-width:620px"><thead><tr><th>公司</th><th>明细数</th><th>应结</th><th>实结</th><th>差异</th></tr></thead><tbody><tr v-for="row in companyRows" :key="row.company.id"><td class="primary-cell">{{ row.company.name }}</td><td>{{ row.count }}</td><td class="amount">{{ money(row.payable) }}</td><td class="amount">{{ money(row.paid) }}</td><td class="amount" :class="row.diff<0?'negative':'positive'">{{ money(row.diff) }}</td></tr></tbody></table></div></article>
      <article class="card card-pad"><div class="card-head"><div><h3>对账时间线</h3><p>核算、确认与支付凭证节点</p></div></div><div class="timeline">
        <div class="timeline-item"><strong>核算批次生成</strong><p>{{ batch.shopCount }} 家存活店铺，规则快照 {{ batch.ruleVersion }}</p><small>{{ batch.createdAt }} · {{ batch.createdBy }}</small></div>
        <div class="timeline-item"><strong>核算确认</strong><p>{{ batch.confirmedAt ? '批次已确认，明细已锁定' : '等待所有杂费核实后确认' }}</p><small>{{ batch.confirmedAt||'待处理' }}</small></div>
        <div class="timeline-item"><strong>公司支付</strong><p>{{ batch.paidAt ? '支付记录已登记，杂费同步标记结清' : '确认后由公司登记支付' }}</p><small>{{ batch.paidAt||'待处理' }}</small></div>
      </div></article>
    </section>
    <div v-else class="empty-state card"><Icon name="scale" :size="32"/><h3>没有可对账的批次</h3><p>先生成月度核算批次。</p></div>
  </div>
</template>
