<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '@/components/Icon.vue'
import { currentUser, saveAgentCompanies, state } from '@/store'

const selected=ref<string[]>([])
const currentAgent=computed(()=>state.agents.find(agent=>agent.id===currentUser.value?.agentId))
watch(currentAgent,agent=>{if(agent)selected.value=[...agent.companyIds]},{immediate:true})
const companies=computed(()=>state.companies.filter(company=>company.status==='active'))
const historical=computed(()=>state.companies.filter(company=>(currentAgent.value?.historicalCompanyIds||[]).includes(company.id)))
function submit(){const result=saveAgentCompanies(selected.value);if(!result.ok)window.alert(result.reason)}
</script>
<template>
  <div>
    <div class="callout info" style="margin-bottom:15px"><Icon name="building" :size="18"/><div><strong>合作公司与历史记录</strong><p>选择公司后，顶级代理可以承接该公司新任务。取消合作不会删除历史店铺、人头、结算和财务记录。</p></div></div>
    <section class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">当前合作公司</span><span class="stat-icon"><Icon name="building" :size="16"/></span></div><div class="stat-value">{{selected.length}}</div><div class="stat-foot">可承接新业务</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">平台可用公司</span><span class="stat-icon"><Icon name="check" :size="16"/></span></div><div class="stat-value">{{companies.length}}</div><div class="stat-foot">当前启用中的公司</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">历史合作公司</span><span class="stat-icon"><Icon name="history" :size="16"/></span></div><div class="stat-value">{{historical.length}}</div><div class="stat-foot">历史数据仍然可见</div></article>
    </section>
    <article class="card card-pad">
      <div class="card-head"><div><h3>选择合作公司</h3><p>关联关系修改后会写入操作日志。</p></div><button class="btn primary" @click="submit"><Icon name="check" :size="15"/>保存合作公司</button></div>
      <div class="export-field-grid"><label v-for="company in companies" :key="company.id" class="export-field" :class="{selected:selected.includes(company.id)}"><input v-model="selected" type="checkbox" :value="company.id"/><span>{{company.name}}</span><small>{{company.region}}</small></label></div>
    </article>
    <article class="card card-pad" style="margin-top:15px"><div class="card-head"><div><h3>历史合作公司</h3><p>取消合作后的公司不会出现在新业务选择中，但历史数据仍保留。</p></div></div><div class="table-wrap" style="box-shadow:none"><table class="data-table"><thead><tr><th>公司</th><th>地区</th><th>联系人</th><th>状态</th></tr></thead><tbody><tr v-for="company in historical" :key="company.id"><td class="primary-cell">{{company.name}}</td><td>{{company.region}}</td><td>{{company.contact}}</td><td><span class="badge neutral">历史合作</span></td></tr><tr v-if="!historical.length"><td colspan="4"><div class="table-empty">暂无历史合作公司</div></td></tr></tbody></table></div></article>
  </div>
</template>