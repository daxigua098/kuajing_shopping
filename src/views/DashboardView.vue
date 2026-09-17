<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'
import { activeShopCount, agentName, companyName, currentUser, dashboardMetrics, ownerBusinessStatus, ownerName, state, unresolvedExpenses, visibleAgents, visibleBatches, visibleOwners, visibleShops, visibleTaskList } from '@/store'
import { money, number } from '@/utils/format'
import { downloadRows } from '@/utils/export'

const router = useRouter()
const metrics = computed(() => dashboardMetrics.value)
const isSubAgent = computed(() => currentUser.value?.role === 'sub_agent')
const recentOwners = computed(() => visibleOwners.value.slice(0, 6))
const subOwnerCounts = computed(() => ({ total: visibleOwners.value.length, notOpened: visibleOwners.value.filter(owner => ownerBusinessStatus(owner) === 'not_opened').length, opened: visibleOwners.value.filter(owner => ownerBusinessStatus(owner) === 'opened').length, dead: visibleOwners.value.filter(owner => ownerBusinessStatus(owner) === 'dead_shop').length }))
const points = '0,82 42,76 84,62 126,67 168,43 210,48 252,31 294,37 336,22 378,29 420,14 462,20 504,8'
const area = '0,100 ' + points + ' 504,100'
const recentShops = computed(() => visibleShops.value.slice(0, 5))
const recentDetails = computed(() => state.settlementDetails.filter(detail => detail.batchId === visibleBatches.value[0]?.id).slice(0, 5))
const tasks = computed(() => visibleTaskList.value.filter(task => task.status !== 'completed').slice(0, 3))
const title = computed(() => {
  if (currentUser.value?.role === 'platform') return '全平台经营健康'
  if (currentUser.value?.role === 'company') return companyName(currentUser.value?.companyId || '') + ' · 月度概览'
  if (currentUser.value?.role === 'top_agent') return agentName(currentUser.value.agentId || '') + ' · 团队与分账'
  return agentName(currentUser.value?.agentId || '') + ' · 人头管理概览'
})
const healthStyle = computed(() => ({ background: 'conic-gradient(var(--primary) 0 ' + metrics.value.health + '%, var(--surface-2) ' + metrics.value.health + '% 100%)' }))
const topAgents = computed(() => visibleAgents.value.slice(0, 5).map((agent, i) => ({ ...agent, shops: visibleShops.value.filter(shop => shop.agentId === agent.id).length, profit: 6800 - i * 930 })))
function quickExport() {
  downloadRows('月度经营概览-2026-08', ['月份', '店铺数', '存活数', '店租', '待报销杂费', '公司应结'], [['2026-08', metrics.value.shops, metrics.value.alive, metrics.value.rent, metrics.value.expense, metrics.value.total]], 'csv')
}
</script>
<template>
  <div>
    <section class="dashboard-hero">
      <div class="row between center" style="position:relative;z-index:2;gap:24px;flex-wrap:wrap">
        <div>
          <div class="eyebrow" style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;opacity:.8">2026 年 9 月 17 日 · 当前结算月 2026-08</div>
          <h2>{{ title }}</h2>
          <p v-if="isSubAgent">只管理自己的人头资料，查看未开店、已开店和挂店状态；提交人头后由顶级代理分配公司。</p>
          <p v-else-if="unresolvedExpenses.length">有 {{ unresolvedExpenses.length }} 笔垫付杂费待确认；确认后会合并进入本月公司应结。</p>
          <p v-else>当前没有待处理杂费，月度核算链路运行正常。</p>
        </div>
        <div class="hero-actions">
          <template v-if="isSubAgent"><button class="btn" @click="router.push({name:'submissions'})"><Icon name="send" :size="16" />添加/提交人头</button><button class="btn solid" @click="router.push({name:'owners'})"><Icon name="users" :size="16" />查看人头档案</button></template>
          <template v-else><button class="btn" @click="router.push({name:'settlement'})"><Icon name="wallet" :size="16" />进入核算中心</button><button class="btn solid" @click="quickExport"><Icon name="download" :size="16" />导出概览</button></template>
        </div>
      </div>
    </section>

    <section v-if="isSubAgent" class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">我的人头总数</span><span class="stat-icon"><Icon name="users" :size="16"/></span></div><div class="stat-value">{{ subOwnerCounts.total }}</div><div class="stat-foot">当前代理树下全部人头</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">未开店</span><span class="stat-icon"><Icon name="alert" :size="16"/></span></div><div class="stat-value">{{ subOwnerCounts.notOpened }}</div><div class="stat-foot">可以提交给顶级代理</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">已开店</span><span class="stat-icon"><Icon name="store" :size="16"/></span></div><div class="stat-value">{{ subOwnerCounts.opened }}</div><div class="stat-foot">店铺正常或暂停</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">挂店</span><span class="stat-icon" style="background:var(--danger-soft);color:var(--danger)"><Icon name="x" :size="16"/></span></div><div class="stat-value">{{ subOwnerCounts.dead }}</div><div class="stat-foot">已关店或死店</div></article>
    </section>
    <section v-else class="stats-grid">
      <article class="stat-card">
        <div class="stat-top"><span class="stat-label">本月预估应结</span><span class="stat-icon"><Icon name="money" :size="16" /></span></div>
        <div class="stat-value">{{ money(metrics.total) }}</div>
        <div class="stat-foot"><span class="trend-up">店租 + 待报销杂费</span> · 规则已匹配</div>
        <div class="mini-progress"><i style="width:82%" /></div>
      </article>
      <article class="stat-card">
        <div class="stat-top"><span class="stat-label">可视范围内店铺</span><span class="stat-icon"><Icon name="store" :size="16" /></span></div>
        <div class="stat-value">{{ number(metrics.shops) }}</div>
        <div class="stat-foot"><span class="trend-up">{{ metrics.alive }} 家存活</span> · {{ metrics.shops - metrics.alive }} 家关店</div>
        <div class="mini-progress"><i :style="{width: metrics.health + '%'}" /></div>
      </article>
      <article class="stat-card">
        <div class="stat-top"><span class="stat-label">人头档案</span><span class="stat-icon"><Icon name="users" :size="16" /></span></div>
        <div class="stat-value">{{ number(metrics.owners) }}</div>
        <div class="stat-foot">归属、店铺、公司一一对应</div>
        <div class="mini-progress"><i style="width:76%" /></div>
      </article>
      <article class="stat-card">
        <div class="stat-top"><span class="stat-label">待处理事项</span><span class="stat-icon" style="background:var(--warning-soft);color:var(--warning)"><Icon name="alert" :size="16" /></span></div>
        <div class="stat-value">{{ unresolvedExpenses.length + tasks.length }}</div>
        <div class="stat-foot"><span class="trend-warn">{{ unresolvedExpenses.length }} 笔杂费</span> · {{ tasks.length }} 个任务待推进</div>
        <div class="mini-progress"><i style="width:43%;background:var(--warning)" /></div>
      </article>
    </section>

    <section v-if="!isSubAgent" class="grid-2">
      <article class="card card-pad">
        <div class="card-head">
          <div><h3>结算与经营趋势</h3><p>近 6 个月店租、存活店铺与杂费变化</p></div>
          <div class="chart-legend"><span><i style="background:var(--primary)" />店租/应结</span><span><i style="background:var(--accent)" />杂费</span></div>
        </div>
        <svg class="sparkline" viewBox="0 0 504 105" preserveAspectRatio="none" style="height:170px">
          <defs><linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--primary)" stop-opacity=".22"/><stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/></linearGradient></defs>
          <polygon :points="area" fill="url(#chartArea)"/>
          <polyline :points="points" class="line"/>
          <polyline points="0,94 42,88 84,92 126,78 168,84 210,72 252,80 294,68 336,74 378,58 420,63 462,45 504,53" class="line2"/>
        </svg>
        <div class="row between tiny muted" style="font-size:9px"><span>3月</span><span>4月</span><span>5月</span><span>6月</span><span>7月</span><span>8月</span></div>
      </article>
      <article class="card card-pad">
        <div class="card-head"><div><h3>店铺健康度</h3><p>按当前数据权限范围计算</p></div><span class="badge success">稳定</span></div>
        <div class="health-ring" :style="healthStyle"><strong>{{ metrics.health }}%</strong><small>存活率</small></div>
        <div class="health-legend">
          <span><span>正常经营</span><b>{{ metrics.alive }}</b></span>
          <span><span>已关店</span><b>{{ metrics.shops - metrics.alive }}</b></span>
          <span><span>待处理杂费</span><b>{{ unresolvedExpenses.length }}</b></span>
          <span><span>规则覆盖</span><b>92%</b></span>
        </div>
      </article>
    </section>

    <section v-if="!isSubAgent" class="grid-2">
      <article class="card card-pad">
        <div class="card-head"><div><h3>结算链路</h3><p>公司付款后按代理规则逐级分配</p></div><button class="btn ghost small" @click="router.push({name:'settlement'})">查看明细 <Icon name="arrowRight" :size="14" /></button></div>
        <div class="settlement-route">
          <div class="route-node active">公司</div>
          <div class="route-line"><span>{{ money(metrics.total) }}</span></div>
          <div class="route-node active">顶级</div>
          <div class="route-line"><span>{{ money(metrics.total * .82) }}</span></div>
          <div class="route-node">子代理</div>
          <div class="route-line"><span>{{ money(metrics.total * .63) }}</span></div>
          <div class="route-node">人头</div>
        </div>
        <div class="callout info" style="margin-top:18px">
          <Icon name="shield" :size="18" />
          <div><strong>财务数据留痕已启用</strong><p>规则、存活快照、批次确认和支付操作都会记录操作人与时间；已确认批次不可直接覆盖。</p></div>
        </div>
      </article>
      <article class="card card-pad">
        <div class="card-head"><div><h3>待办提醒</h3><p>优先处理会影响核算的事项</p></div><span class="badge warning">{{ unresolvedExpenses.length + tasks.length }} 项</span></div>
        <div class="activity-list">
          <div v-for="expense in unresolvedExpenses.slice(0,2)" :key="expense.id" class="activity-item">
            <div class="activity-icon" style="background:var(--warning-soft);color:var(--warning)"><Icon name="receipt" :size="15" /></div>
            <div style="flex:1"><strong>{{ expense.purpose }}</strong><p>{{ companyName(expense.companyId) }} · {{ agentName(expense.advanceAgentId) }}垫付</p><small>{{ money(expense.amount) }} · {{ expense.expenseMonth }}</small></div>
            <button class="btn secondary small" @click="router.push({name:'expenses'})">处理</button>
          </div>
          <div v-for="task in tasks.slice(0,2)" :key="task.id" class="activity-item">
            <div class="activity-icon"><Icon name="briefcase" :size="15" /></div>
            <div style="flex:1"><strong>{{ task.title }}</strong><p>{{ task.completed }} / {{ task.quantity }} 家已完成</p><small>截止 {{ task.deadline }}</small></div>
            <button class="btn secondary small" @click="router.push({name:'tasks'})">查看</button>
          </div>
          <div v-if="!unresolvedExpenses.length && !tasks.length" class="empty-state"><Icon name="check" :size="28" /><h3>今日已清</h3><p>没有影响结算的待办事项。</p></div>
        </div>
      </article>
    </section>

    <section class="grid-2">
      <article class="card card-pad">
        <div class="card-head"><div><h3>最近店铺</h3><p>按当前数据权限展示</p></div><button class="btn ghost small" @click="router.push({name:'shops'})">全部店铺</button></div>
        <div class="table-wrap" style="box-shadow:none">
          <table class="data-table" style="min-width:620px">
            <thead><tr><th>店铺</th><th>归属</th><th>模式</th><th>月租</th><th>状态</th></tr></thead>
            <tbody><tr v-for="shop in recentShops" :key="shop.id">
              <td><div class="primary-cell">{{ shop.code }}</div><div class="secondary-line">{{ shop.name }}</div></td>
              <td><div>{{ ownerName(shop.ownerId) }}</div><div class="secondary-line">{{ agentName(shop.agentId) }}</div></td>
              <td><span class="mode-chip" :class="{head:shop.mode==='head_fee'}">{{ shop.mode === 'head_fee' ? '砍头' : '按月' }}</span></td>
              <td class="amount">{{ money(shop.monthlyRent) }}</td>
              <td><span class="badge" :class="shop.status==='operating'?'success':shop.status==='paused'?'warning':'neutral'">{{ shop.status==='operating'?'经营中':shop.status==='paused'?'暂停':'已关店' }}</span></td>
            </tr></tbody>
          </table>
        </div>
      </article>
      <article v-if="!isSubAgent" class="card card-pad">
        <div class="card-head"><div><h3>代理收益排行</h3><p>演示数据按可视代理范围统计</p></div><button class="btn ghost small" @click="router.push({name:'agents'})">代理树</button></div>
        <div v-for="(agent,index) in topAgents" :key="agent.id" style="margin:12px 0">
          <div class="row between center" style="font-size:10px"><span><b style="display:inline-grid;place-items:center;width:20px;height:20px;border-radius:6px;background:var(--surface-2);margin-right:7px">{{ index+1 }}</b>{{ agent.name }}</span><span class="amount">{{ money(agent.profit) }}</span></div>
          <div class="progress-track" style="height:6px;margin-top:7px"><i :style="{width:(90-index*13)+'%'}"/></div>
          <div class="secondary-line" style="margin-top:4px">{{ agent.shops }} 家店铺 · 层级 {{ agent.level }}</div>
        </div>
      </article>
      <article v-if="isSubAgent" class="card card-pad">
        <div class="card-head"><div><h3>我的人头资料</h3><p>查看归属、业务状态和联系方式</p></div><button class="btn ghost small" @click="router.push({name:'owners'})">全部人头</button></div>
        <div class="table-wrap" style="box-shadow:none"><table class="data-table" style="min-width:420px"><thead><tr><th>人头</th><th>业务状态</th><th>联系方式</th></tr></thead><tbody><tr v-for="owner in recentOwners" :key="owner.id"><td><div class="primary-cell">{{ owner.name }}</div><div class="secondary-line">{{ owner.icNumber || '未填写 IC' }}</div></td><td><span class="badge" :class="ownerBusinessStatus(owner)==='opened'?'success':ownerBusinessStatus(owner)==='dead_shop'?'danger':'neutral'">{{ ownerBusinessStatus(owner)==='opened'?'已开店':ownerBusinessStatus(owner)==='dead_shop'?'挂店':ownerBusinessStatus(owner)==='invalid'?'无效人头':'未开店' }}</span></td><td>{{ owner.phone || '—' }}<div class="secondary-line">{{ owner.email || '未填写邮箱' }}</div></td></tr></tbody></table></div>
      </article>
    </section>
  </div>
</template>
