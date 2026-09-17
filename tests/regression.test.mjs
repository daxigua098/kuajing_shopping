import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { seedState } from '../src/data/seed.ts'
import { statusAfterCloseDateChange } from '../src/utils/shop.ts'
import { createShopExportFields, defaultShopExportFieldKeys } from '../src/utils/shopExport.ts'
import { matchesShopDateRange } from '../src/utils/shopDateFilter.ts'
import { daysUntilTrafficExpiry, trafficCardStatus } from '../src/utils/trafficCard.ts'

test('seed exposes enough pending owner submissions for company queries', () => {
  const state = seedState()
  const pending = state.ownerSubmissions.filter(item => item.status === 'pending')
  const ownerIds = new Set(state.owners.map(owner => owner.id))

  assert.ok(pending.length >= 9, `expected at least 9 pending submissions, got ${pending.length}`)
  assert.deepEqual(new Set(pending.map(item => item.companyId)), new Set(['c1', 'c2', 'c3']))

  for (const submission of pending) {
    assert.ok(ownerIds.has(submission.ownerId), `missing owner ${submission.ownerId}`)
    assert.ok(submission.companyId, `missing company for ${submission.id}`)
    assert.ok(submission.shopTypeId.startsWith(submission.companyId + '-'), `shop type mismatch for ${submission.id}`)
  }
})

test('company shop form renders the company as read-only text', async () => {
  const source = await readFile(new URL('../src/views/ShopsView.vue', import.meta.url), 'utf8')

  assert.ok(source.includes(`<div v-if="currentUser?.role==='company'" class="readonly-field">{{ companyLabel(form.companyId) }}</div>`))
  assert.ok(source.includes('<select v-else v-model="form.companyId" class="select">'))
})

test('close date selection links the shop to closed status', () => {
  assert.equal(statusAfterCloseDateChange('2026-09-17'), 'closed')
  assert.equal(statusAfterCloseDateChange(''), 'operating')
  assert.equal(statusAfterCloseDateChange(null), 'operating')
})

test('company shop form separates new-shop and close-shop fields', async () => {
  const source = await readFile(new URL('../src/views/ShopsView.vue', import.meta.url), 'utf8')

  assert.ok(source.includes('v-if="editingId" class="field"><label>关店时间</label>'))
  assert.ok(source.includes('@change="handleCloseDateChange"'))
  assert.ok(source.includes('<div v-if="!editingId" class="readonly-field">开新店</div>'))
  assert.ok(source.includes('v-model.number="form.openingFee"'))
  assert.ok(source.includes('v-model="form.openProof"'))
  assert.ok(source.includes('v-model="form.closeProof"'))
  assert.ok(source.includes('<th>开店日期</th><th>封店日期</th>'))
  assert.ok(source.includes("{{ shop.closeDate || '未封店' }}"))
})
test('shop export selects the requested default fields', () => {
  assert.deepEqual(defaultShopExportFieldKeys, [
    'name',
    'owner',
    'agent',
    'shopType',
    'openDate',
    'settlementMode',
    'closeDate',
  ])

  const fields = createShopExportFields()
  assert.equal(fields.filter(field => field.selected).length, 7)
  for (const field of fields) {
    assert.equal(field.selected, defaultShopExportFieldKeys.includes(field.key))
    assert.equal(field.default, defaultShopExportFieldKeys.includes(field.key))
  }
})

test('shop export opens a field-selection modal', async () => {
  const source = await readFile(new URL('../src/views/ShopsView.vue', import.meta.url), 'utf8')

  assert.ok(source.includes('@click="openExport"'))
  assert.ok(source.includes('title="选择店铺导出字段"'))
  assert.ok(source.includes('@click="resetExportFields"'))
})

test('shop date range filtering supports open and close events', () => {
  const shop = { openDate: '2026-03-15', closeDate: '2026-08-20' }

  assert.equal(matchesShopDateRange(shop, 'open', '2026-03-01', '2026-03-31'), true)
  assert.equal(matchesShopDateRange(shop, 'open', '2026-04-01', '2026-04-30'), false)
  assert.equal(matchesShopDateRange(shop, 'close', '2026-08-01', '2026-08-31'), true)
  assert.equal(matchesShopDateRange(shop, 'close', '2026-09-01', '2026-09-30'), false)
  assert.equal(matchesShopDateRange(shop, 'all', '2026-08-01', '2026-08-31'), true)
  assert.equal(matchesShopDateRange({ openDate: '2026-01-01', closeDate: null }, 'close', '', ''), false)
})

test('shop page exposes date range filters', async () => {
  const source = await readFile(new URL('../src/views/ShopsView.vue', import.meta.url), 'utf8')

  assert.ok(source.includes('v-model="dateFieldFilter"'))
  assert.ok(source.includes('v-model="dateFrom"'))
  assert.ok(source.includes('v-model="dateTo"'))
  assert.ok(source.includes('@click="clearDateFilter"'))
})

test('global typography applies the configured font boost', async () => {
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
  const shops = await readFile(new URL('../src/views/ShopsView.vue', import.meta.url), 'utf8')

  assert.ok(styles.includes('--font-boost: 2px'))
  assert.ok(styles.includes('font-size: calc(10px + var(--font-boost))'))
  assert.ok(styles.includes('font-size: calc(11px + var(--font-boost))'))
  assert.ok(shops.includes('font-size: calc(21px + var(--font-boost))'))
})

test('traffic cards are unique and statuses are calculated', () => {
  const state = seedState()
  const cardNumbers = state.shops.map(shop => shop.trafficCardNumber).filter(Boolean)
  assert.equal(new Set(cardNumbers).size, cardNumbers.length)
  assert.ok(cardNumbers.length > 0)

  assert.equal(trafficCardStatus({ trafficCardNumber: '', trafficCardExpiryDate: null }, '2026-09-18'), 'unconfigured')
  assert.equal(trafficCardStatus({ trafficCardNumber: 'MYTC-1', trafficCardExpiryDate: null }, '2026-09-18'), 'missing_expiry')
  assert.equal(trafficCardStatus({ trafficCardNumber: 'MYTC-1', trafficCardExpiryDate: '2026-09-17' }, '2026-09-18'), 'expired')
  assert.equal(trafficCardStatus({ trafficCardNumber: 'MYTC-1', trafficCardExpiryDate: '2026-09-21' }, '2026-09-18'), 'due_soon')
  assert.equal(trafficCardStatus({ trafficCardNumber: 'MYTC-1', trafficCardExpiryDate: '2026-10-20' }, '2026-09-18'), 'active')
  assert.equal(daysUntilTrafficExpiry('2026-09-20', '2026-09-18'), 2)
})

test('traffic card management is wired into navigation and shops', async () => {
  const view = await readFile(new URL('../src/views/TrafficCardsView.vue', import.meta.url), 'utf8')
  const router = await readFile(new URL('../src/router.ts', import.meta.url), 'utf8')
  const shell = await readFile(new URL('../src/components/AppShell.vue', import.meta.url), 'utf8')
  const shops = await readFile(new URL('../src/views/ShopsView.vue', import.meta.url), 'utf8')

  assert.ok(view.includes('流量卡管理'))
  assert.ok(view.includes('trafficCardNumber'))
  assert.ok(view.includes('trafficCardExpiryDate'))
  assert.ok(router.includes("name: 'traffic-cards'"))
  assert.ok(shell.includes('流量卡管理'))
  assert.ok(shops.includes('流量卡号码'))
  assert.ok(view.includes('<th>店铺编号</th><th>店铺名称</th><th>人头</th>'))
  assert.ok(view.includes('<td><div class="primary-cell">{{ shop.code }}</div></td>'))
  assert.ok(view.includes('当前流量卡号码'))
  assert.ok(view.includes('当前到期状态'))
  assert.ok(view.includes('当前每月续费日'))
  assert.ok(view.includes('店铺类型'))
})

test('company review can open complete owner audit details', async () => {
  const view = await readFile(new URL('../src/views/SubmissionsView.vue', import.meta.url), 'utf8')

  assert.ok(view.includes('openOwnerDetail'))
  assert.ok(view.includes('人头详细审核资料'))
  assert.ok(view.includes('ownerMediaItems'))
  assert.ok(view.includes('审核提示'))
})

test('image fields remain optional in every image-bearing export', async () => {
  const owners = await readFile(new URL('../src/views/OwnersView.vue', import.meta.url), 'utf8')
  const expenses = await readFile(new URL('../src/views/ExpensesView.vue', import.meta.url), 'utf8')
  const reports = await readFile(new URL('../src/views/ReportsView.vue', import.meta.url), 'utf8')
  const settlement = await readFile(new URL('../src/views/SettlementView.vue', import.meta.url), 'utf8')
  const shopFields = createShopExportFields()

  assert.ok(owners.includes("key:'idCardFront'"))
  assert.ok(owners.includes("key:'bankCardPhoto'"))
  assert.ok(owners.includes("key:'shopCloseProof'"))
  assert.equal(shopFields.find(field => field.key === 'openProof')?.selected, false)
  assert.equal(shopFields.find(field => field.key === 'closeProof')?.selected, false)
  assert.ok(expenses.includes("label:'费用凭证图片',selected:false"))
  assert.ok(reports.includes('图片导出字段（可选）'))
  assert.ok(reports.includes('imageSelections[field.key]'))
  assert.ok(settlement.includes('includeExpenseProof'))
  assert.ok(settlement.includes('导出费用凭证图片'))
})
