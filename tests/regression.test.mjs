import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { seedState } from '../src/data/seed.ts'
import { statusAfterCloseDateChange } from '../src/utils/shop.ts'
import { createShopExportFields, defaultShopExportFieldKeys } from '../src/utils/shopExport.ts'

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
