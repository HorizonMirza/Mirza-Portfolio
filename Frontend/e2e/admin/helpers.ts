import type { Page } from '@playwright/test'

export const ADMIN_STATE = 'e2e/.auth/admin.json'
export const hasAdminEnv = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD)

// Setiap login memakai IP palsu berbeda agar tes tidak saling memicu rate limit login (5 per 15 menit per IP).
export function uniqueIp() {
  const n = () => Math.floor(Math.random() * 250) + 1
  return `10.${n()}.${n()}.${n()}`
}

export async function login(
  page: Page,
  email = process.env.ADMIN_EMAIL!,
  password = process.env.ADMIN_PASSWORD!,
) {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Masuk' }).click()
}
