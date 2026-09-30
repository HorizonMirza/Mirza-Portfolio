import fs from 'node:fs'
import path from 'node:path'

import { expect, test as setup } from '@playwright/test'

import { ADMIN_STATE, hasAdminEnv, login, uniqueIp } from './helpers'

setup('login admin sekali untuk semua tes admin', async ({ browser }) => {
  fs.mkdirSync(path.dirname(ADMIN_STATE), { recursive: true })
  if (!hasAdminEnv) {
    // Tanpa ADMIN_EMAIL/ADMIN_PASSWORD tes admin dilewati; file kosong agar konfigurasi tetap valid.
    fs.writeFileSync(ADMIN_STATE, JSON.stringify({ cookies: [], origins: [] }))
    return
  }
  const context = await browser.newContext({ extraHTTPHeaders: { 'x-forwarded-for': uniqueIp() } })
  const page = await context.newPage()
  await login(page)
  await expect(page).toHaveURL(/\/admin$/)
  await context.storageState({ path: ADMIN_STATE })
  await context.close()
})
