<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { state } from '@/store'
import { downloadRows } from '@/utils/export'

const search=ref('')
const action=ref('all')
const filtered=computed(()=>state.auditLogs.filter(log=>{const k=search.value.trim().toLowerCase();return (!k||[log.action,log.target,log.operator,log.detail].some(v=>v.toLowerCase().includes(k)))&&(action.value==='all'||log.action===action.value)}))
function exportLogs(){downloadRows('操作日志-'+new Date().toISOString().slice(0,10),['时间','操作','对象','操作人','角色','详情'],filtered.value.map(log=>[log.createdAt,log.action,log.target,log.operator,log.role,log.detail]),'csv')}
</script>
<template>
  <div>
    <div class="page-toolbar"><div class="filter-search"><Icon name="search" :size="15"/><input v-model="search" class="input" placeholder="搜索操作、对象、操作人"/></div><select v-model="action" class="select" style="width:150px"><option value="all">全部操作</option><option v-for="item in [...new Set(state.auditLogs.map(l=>l.action))]" :key="item" :value="item">{{item}}</option></select><span class="spacer"/><button class="btn secondary" @click="exportLogs"><Icon name="download" :size="15"/>导出日志</button></div>
    <div class="callout info" style="margin-bottom:15px"><Icon name="shield" :size="18"/><div><strong>审计不可关闭</strong><p>登录、规则修改、状态变更、核算确认、支付和导出操作都应记录严格的操作人、时间、前后值与来源 IP。</p></div></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>时间</th><th>操作</th><th>业务对象</th><th>操作人</th><th>角色</th><th>详情</th></tr></thead><tbody><tr v-for="log in filtered" :key="log.id"><td>{{log.createdAt}}</td><td><span class="badge info no-dot">{{log.action}}</span></td><td class="primary-cell">{{log.target}}</td><td>{{log.operator}}</td><td>{{log.role}}</td><td style="color:var(--muted)">{{log.detail}}</td></tr><tr v-if="!filtered.length"><td colspan="6"><div class="table-empty"><Icon name="history" :size="30"/><div>没有匹配的日志</div></div></td></tr></tbody></table></div>
  </div>
</template>
