import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-share-'))
process.env.SHARE_DIR = dir

test('分享快照可建立、讀取，且拒絕不合法的 id', async () => {
  const { createShare, readShare } = await import('../src/services/share/shareStore.js')
  const report = { reportId: 'r1', targetUrl: 'https://example.com', cached: true } as never
  const entry = await createShare(report)
  assert.match(entry.id, /^[A-Za-z0-9_-]{10,32}$/)
  const loaded = await readShare(entry.id)
  assert.equal(loaded?.report.targetUrl, 'https://example.com')
  assert.equal(loaded?.report.cached, false)
  assert.equal(await readShare('../../etc/passwd'), null)
  assert.equal(await readShare('doesnotexist123'), null)
})

test('過期的分享快照會被刪除', async () => {
  const { readShare } = await import('../src/services/share/shareStore.js')
  const id = 'expiredShare01'
  const file = path.join(dir, `${id}.json`)
  fs.writeFileSync(file, JSON.stringify({ id, createdAt: '', expiresAt: '2000-01-01T00:00:00Z', report: {} }))
  assert.equal(await readShare(id), null)
  assert.equal(fs.existsSync(file), false)
})
