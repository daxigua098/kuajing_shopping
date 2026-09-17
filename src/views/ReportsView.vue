<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { agentName, companyName, ownerName, shopName, state, visibleAgents, visibleCompanies, visibleExpenses, visibleOwners, visibleRules, visibleShops } from '@/store'
import { maskAccount, money } from '@/utils/format'
import { downloadRows, type ExportFormat } from '@/utils/export'

type ReportType='shops'|'owners'|'settlement'|'expenses'|'agents'
const type=ref<ReportType>('shops')
const format=ref<ExportFormat>('csv')
const delimiter=ref(',')
const hasHeader=ref(true)
const companyFilter=ref('all')
const from=ref('2026-01-01')
const to=ref('2026-12-31')
const reports:{id:ReportType;title:string;desc:string;icon:string}[]=[
  {id:'shops',title:'店铺档案',desc:'店铺、人头、代理、模式和存活状态',icon:'store'},
  {id:'owners',title:'人头资料',desc:'归属信息与脱敏银行资料',icon:'users'},
  {id:'settlement',title:'月度核算',desc:'店租、杂费、规则和核算说明',icon:'wallet'},
  {id:'expenses',title:'垫付杂费',desc:'按公司、店铺、月份筛选报销明细',icon:'receipt'},
  {id:'agents',title:'代理费用',desc:'代理层级、承接公司与店铺规模',icon:'network'},
]
const headers=computed(()=>{
  if(type.value==='shops')return ['店铺编号','店铺名称','公司','代理','人头','地区','模式','月租','状态','开业日','关店日']
  if(type.value==='owners')return ['姓名','电话','邮箱','公司','代理','状态','银行','银行账号（脱敏）']
  if(type.value==='settlement')return ['月份','店铺编号','店铺','人头','代理','公司','模式','店租','杂费','应结合计','核算说明']
  if(type.value==='expenses')return ['月份','店铺','公司','垫付代理','日期','用途','金额','币种','凭证','状态']
  return ['代理名称','层级','类型','联系人','承接公司','名下店铺','存活店铺','人头数']
})
const rows=computed<(string|number)[][]>(()=>{
  if(type.value==='shops')return visibleShops.value.filter(x=>companyFilter.value==='all'||x.companyId===companyFilter.value).map(shop=>[shop.code,shop.name,companyName(shop.companyId),agentName(shop.agentId),ownerName(shop.ownerId),shop.region,shop.mode==='head_fee'?'砍头':'按月',shop.monthlyRent,shop.status,shop.openDate,shop.closeDate||''])
  if(type.value==='owners')return visibleOwners.value.filter(x=>companyFilter.value==='all'||x.companyId===companyFilter.value).map(owner=>[owner.name,owner.phone,owner.email,companyName(owner.companyId),agentName(owner.agentId),owner.status,owner.bankName,maskAccount(owner.bankAccount)])
  if(type.value==='settlement')return state.settlementDetails.filter(detail=>visibleShops.value.some(shop=>shop.id===detail.shopId)&&(companyFilter.value==='all'||detail.companyId===companyFilter.value)).map(detail=>[detail.batchId,state.shops.find(s=>s.id===detail.shopId)?.code||'',shopName(detail.shopId),ownerName(detail.ownerId),agentName(detail.agentId),companyName(detail.companyId),detail.mode==='head_fee'?'砍头':'按月',detail.rent,detail.expense,detail.rent+detail.expense,detail.reason])
  if(type.value==='expenses')return visibleExpenses.value.filter(x=>companyFilter.value==='all'||x.companyId===companyFilter.value).map(item=>[item.expenseMonth,shopName(item.shopId),companyName(item.companyId),agentName(item.advanceAgentId),item.expenseDate,item.purpose,item.amount,item.currency,item.attachment,item.status])
  return visibleAgents.value.map(agent=>[agent.name,agent.level,agent.agentType==='top'?'顶级代理':'子代理',agent.contact,agent.companyIds.map(companyName).join('、'),visibleShops.value.filter(shop=>shop.agentId===agent.id).length,visibleShops.value.filter(shop=>shop.agentId===agent.id&&shop.status!=='closed').length,visibleOwners.value.filter(owner=>owner.agentId===agent.id).length])
})
function exportReport(){
  const actualDelimiter=delimiter.value==='tab'?'\t':delimiter.value
  downloadRows(type.value+'-'+new Date().toISOString().slice(0,10),headers.value,rows.value,format.value,{delimiter:actualDelimiter,header:hasHeader.value,encoding:'utf-8'})
}
</script>
<template>
  <div>
    <section class="grid-3" style="margin-bottom:15px"><button v-for="report in reports" :key="report.id" class="card card-pad" style="text-align:left" :style="{borderColor:type===report.id?'var(--primary)':'var(--line)'}" @click="type=report.id"><div class="row between center"><span class="stat-icon"><Icon :name="report.icon" :size="17"/></span><Icon name="arrowRight" :size="15"/></div><h3 style="margin:13px 0 4px;font-size:13px">{{ report.title }}</h3><p class="hint" style="margin:0">{{ report.desc }}</p></button></section>
    <article class="card card-pad" style="margin-bottom:15px">
      <div class="card-head"><div><h3>筛选与导出选项</h3><p>正式环境的大数据导出会转为异步任务，当前演示直接在浏览器生成文件。</p></div><button class="btn primary" @click="exportReport"><Icon name="download" :size="15"/>生成并下载</button></div>
      <div class="form-grid three">
        <div class="field"><label>公司范围</label><select v-model="companyFilter" class="select"><option value="all">当前角色全部数据</option><option v-for="company in visibleCompanies" :key="company.id" :value="company.id">{{ company.name }}</option></select></div>
        <div class="field"><label>导出格式</label><select v-model="format" class="select"><option value="csv">CSV（Excel 可直接打开）</option><option value="txt">TXT 文本</option></select></div>
        <div class="field"><label>分隔符</label><select v-model="delimiter" class="select"><option value=",">逗号 ,</option><option value="tab">制表符 Tab</option><option value="|">竖线 |</option></select></div>
        <div class="field"><label>开始日期</label><input v-model="from" class="input" type="date"/></div>
        <div class="field"><label>结束日期</label><input v-model="to" class="input" type="date"/></div>
        <div class="field"><label>文本选项</label><label class="badge info no-dot" style="justify-content:center;height:38px"><input v-model="hasHeader" type="checkbox" style="margin-right:6px"/>包含表头</label></div>
      </div>
      <div class="callout info" style="margin-top:15px"><Icon name="shield" :size="17"/><div><strong>默认脱敏</strong><p>密码完全隐藏；银行卡和身份证部分隐藏；人名和电话保持正常，便于业务核对。</p></div></div>
    </article>
    <article class="card card-pad"><div class="card-head"><div><h3>导出预览 · {{ reports.find(r=>r.id===type)?.title }}</h3><p>共 {{ rows.length }} 行，{{ headers.length }} 列</p></div><span class="badge info no-dot">{{ format==='csv'?'Excel 兼容 CSV':'TXT' }}</span></div><div class="table-wrap" style="box-shadow:none;max-height:430px;overflow:auto"><table class="data-table"><thead><tr><th v-for="header in headers" :key="header">{{header}}</th></tr></thead><tbody><tr v-for="(row,index) in rows.slice(0,30)" :key="index"><td v-for="(cell,col) in row" :key="col">{{cell}}</td></tr><tr v-if="!rows.length"><td :colspan="headers.length"><div class="table-empty">没有可导出的数据</div></td></tr></tbody></table></div></article>
  </div>
</template>
