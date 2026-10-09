import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { ADMIN_STATE, hasAdminEnv } from './helpers'

test.skip(!hasAdminEnv, 'butuh ADMIN_EMAIL dan ADMIN_PASSWORD')
test.use({ storageState: ADMIN_STATE, contextOptions: { reducedMotion: 'reduce' } })

const PAGES = [
  '/admin',
  '/admin/profile',
  '/admin/projects',
  '/admin/projects/new',
  '/admin/skills',
  '/admin/experience',
  '/admin/experience/new',
  '/admin/highlights',
  '/admin/highlights/new',
  '/admin/messages',
  '/admin/subscribers',
  '/admin/audit',
  '/admin/settings',
  '/admin/account',
]

for (const theme of ['light', 'dark'] as const) {
  test(`halaman admin (${theme}) tanpa pelanggaran aksesibilitas dan CSP`, async ({ page }) => {
    // 11 halaman diperiksa axe dalam satu tes; batas 30 detik terlalu ketat bila data uji menumpuk
    test.setTimeout(90_000)
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
    const failures: string[] = []
    // CSP admin ber-nonce: skrip Next.js dan skrip tema harus tetap jalan
    page.on('console', (m) => {
      if (m.type() === 'error' && /Content Security Policy|CSP/i.test(m.text()))
        failures.push(`CSP: ${m.text()}`)
    })
    for (const path of PAGES) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)
      await expect(page.locator('html')).toHaveClass(new RegExp(theme))
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      failures.push(...results.violations.map((v) => `${path} ${v.id}: ${v.help}`))
    }
    expect(failures).toEqual([])
  })
}

test('halaman admin yang tidak ada mengembalikan 404', async ({ page }) => {
  const response = await page.goto('/admin/belum-ada')
  expect(response?.status()).toBe(404)
})

test('CRUD project: buat, tampil di daftar, ubah, hapus, dan tercatat di audit', async ({
  page,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}`
  const titleId = `Project E2E ${suffix}`
  await page.goto('/admin/projects/new')

  // Validasi: galat tampil dan dihitung per tab bahasa
  await page.getByRole('button', { name: 'Buat project' }).click()
  await expect(page.getByRole('tab', { name: /Indonesia/ })).toContainText('3')
  await expect(page.getByText('Judul wajib diisi')).toBeVisible()

  await page.getByLabel('Judul', { exact: true }).fill(titleId)
  await page.getByLabel('Ringkasan', { exact: true }).fill('Ringkasan untuk tes E2E.')
  await page.getByLabel('Peran saya (opsional)').fill('Peran E2E')
  await page.locator('#description_id').fill('Deskripsi **E2E**.')
  await page.getByRole('tab', { name: /English/ }).click()
  await page.getByLabel('Title', { exact: true }).fill(`E2E project ${suffix}`)
  await page.getByLabel('Summary', { exact: true }).fill('Summary for the E2E test.')
  await page.locator('#description_en').fill('Description.')
  await page.getByLabel('Slug').fill(`e2e-${suffix}`.toLowerCase())
  // tombol detail: demo tampil, GitHub dimatikan Super Admin walau URL-nya diisi
  await page.getByLabel('URL demo (opsional)').fill('https://example.com/demo')
  await page.getByLabel('URL repo (opsional)').fill('https://github.com/example/repo')
  await page.getByLabel('Tampilkan tombol "GitHub" (URL repo)').uncheck()
  // satu skill agar halaman Skill publik menampilkan tautan "Dipakai di"
  await page
    .locator('fieldset')
    .filter({ hasText: 'Bahasa Pemrograman' })
    .getByText('TypeScript', { exact: true })
    .click()
  await page.getByRole('button', { name: 'Buat project' }).click()
  await expect(page.getByText('Project dibuat.')).toBeVisible()
  await expect(page).toHaveURL(/\/admin\/projects\/[0-9a-f-]{36}$/)

  // Ubah status menjadi terbit
  await page.getByLabel('Status').selectOption('PUBLISHED')
  await page.getByRole('button', { name: 'Simpan', exact: true }).click()
  await expect(page.getByText('Project disimpan.')).toBeVisible()

  // Project yang terbit setelah build langsung tampil di situs publik (revalidasi + dynamicParams).
  const slug = `e2e-${suffix}`.toLowerCase()
  const detail = await page.goto(`/id/projects/${slug}`)
  expect(detail?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(titleId)
  await expect(page.getByText('Peran E2E')).toBeVisible()
  const main = page.getByRole('main')
  await expect(main.getByRole('link', { name: /Lihat aplikasi/ })).toHaveAttribute(
    'href',
    'https://example.com/demo',
  )
  await expect(main.getByRole('link', { name: /GitHub/ })).toHaveCount(0)
  await page.goto('/en/projects')
  await expect(page.getByRole('link', { name: `E2E project ${suffix}` })).toBeVisible()

  // Aksesibilitas halaman publik saat ada project terbit (kartu, tautan "Dipakai di", detail).
  const publicFailures: string[] = []
  for (const path of ['/en/projects', '/id', `/id/projects/${slug}`]) {
    await page.goto(path)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    publicFailures.push(...results.violations.map((v) => `${path} ${v.id}: ${v.help}`))
  }
  expect(publicFailures).toEqual([])

  await page.goto('/admin/projects')
  await page.getByRole('searchbox', { name: 'Cari project' }).fill(suffix)
  const item = page.getByText(titleId).locator('visible=true').first()
  await expect(item).toBeVisible()

  // Hapus dengan konfirmasi
  await page
    .getByRole('button', { name: `Hapus ${titleId}` })
    .locator('visible=true')
    .first()
    .click()
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()
  await expect(page.getByText('Project dihapus.')).toBeVisible()
  await expect(page.getByText(titleId)).toHaveCount(0)

  // Status dicek langsung ke server, tanpa cache HTTP browser. Firefox menerapkan
  // stale-while-revalidate juga untuk navigasi, jadi `next start` lokal bisa menyajikan salinan
  // lama dari cache browser. Di Vercel, CDN mengganti Cache-Control ke browser.
  const gone = await page.request.get(`/id/projects/${slug}`)
  expect(gone.status()).toBe(404)

  await page.goto('/admin/audit?entity=Project')
  await expect(page.locator('main ol > li').first()).toContainText('hapus')

  // Regresi: revalidasi setelah simpan tidak boleh membuat halaman publik menjadi 404.
  for (const locale of ['id', 'en']) {
    const response = await page.goto(`/${locale}`)
    expect(response?.status(), `/${locale}`).toBe(200)
  }
})

test('CRUD angka beranda: buat, tampil di beranda, hapus, dan tercatat di audit', async ({
  page,
}, testInfo) => {
  const label = `angka E2E ${testInfo.project.name}-${Date.now()}`
  // angka acak per tes: proyek browser berjalan paralel dan berbagi satu database, angka yang sama
  // akan muncul dua kali di beranda
  const value = 10_000 + Math.floor(Math.random() * 89_999)
  const idText = `${new Intl.NumberFormat('id-ID').format(value)}+`
  const enText = `${new Intl.NumberFormat('en-US').format(value)}+`
  await page.goto('/admin/highlights/new')
  await page.getByRole('button', { name: 'Tambah angka' }).click()
  await expect(page.getByText('Keterangan wajib diisi')).toBeVisible()

  await page.getByLabel('Angka', { exact: true }).fill(String(value))
  await page.getByLabel('Keterangan (ID)').fill(label)
  await page.getByLabel('Keterangan (EN)').fill(`${label} en`)
  await page.getByLabel('Urutan').fill('999')
  await page.getByRole('button', { name: 'Tambah angka' }).click()
  await expect(page.getByText('Angka ditambahkan.')).toBeVisible()
  await expect(page).toHaveURL(/\/admin\/highlights\/[0-9a-f-]{36}$/)

  // Proyek browser berjalan paralel dan berbagi satu database: penghapusan angka oleh proyek lain
  // bisa memicu render ulang beranda dengan data yang dibaca sebelum angka ini tersimpan, sehingga
  // satu kali muat bisa masih lama. Muat ulang sampai angka baru tampil (tetap gagal bila tidak
  // pernah tampil).
  const stats = page.getByRole('region', { name: 'Dalam angka' })
  await expect(async () => {
    await page.goto('/id')
    await expect(stats.getByText(label)).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 15_000 })
  await expect(stats.getByText(idText)).toBeVisible()
  await expect(async () => {
    await page.goto('/en')
    await expect(page.getByText(enText)).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 15_000 })

  await page.goto('/admin/highlights')
  await page
    .getByRole('button', { name: `Hapus ${idText} ${label}` })
    .locator('visible=true')
    .first()
    .click()
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()
  await expect(page.getByText('Angka dihapus.')).toBeVisible()

  // dicek langsung ke server: Firefox/WebKit bisa menyajikan beranda lama dari cache browser
  // (lihat catatan serupa di tes CRUD project)
  await expect.poll(async () => (await page.request.get('/id')).text()).not.toContain(label)
  await page.goto('/admin/audit?entity=Highlight')
  await expect(page.locator('main ol > li').first()).toContainText('hapus')
})

test('kategori skill yang masih berisi tidak bisa dihapus', async ({ page }) => {
  await page.goto('/admin/skills')
  const first = page.getByRole('button', { name: /^Hapus kategori / }).first()
  await first.click()
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()
  await expect(page.getByText(/Kategori masih berisi \d+ skill/)).toBeVisible()
})

test('volume suara dari pengaturan dipakai situs publik', async ({ page }) => {
  await page.goto('/admin/settings')
  const slider = page.getByLabel('Volume')
  const output = page.locator('output[for="soundVolume"]')
  // Safari iPhone kadang menerima isian sebelum React selesai hidrasi, sehingga label tidak ikut
  // berubah; ulangi sampai form benar-benar membaca nilainya
  await expect(async () => {
    await slider.fill('35')
    await expect(output).toHaveText('35%', { timeout: 1000 })
  }).toPass()
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Pengaturan disimpan.')).toBeVisible()
  // dicek langsung ke server agar cache browser WebKit/Firefox tidak menyajikan halaman lama
  await expect
    .poll(async () => (await page.request.get('/id')).text())
    .toContain('data-sound-volume="35"')
  // kembalikan ke bawaan agar tes lain tidak terpengaruh
  await page.goto('/admin/settings')
  await expect(async () => {
    await page.getByLabel('Volume').fill('80')
    await expect(output).toHaveText('80%', { timeout: 1000 })
  }).toPass()
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Pengaturan disimpan.')).toBeVisible()
})
