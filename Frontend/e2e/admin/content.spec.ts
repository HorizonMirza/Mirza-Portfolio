import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { ISR_REFRESH_TIMEOUT } from '../wait'
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
  '/admin/messages',
  '/admin/audit',
  '/admin/pages/intro',
  '/admin/pages/home',
  '/admin/pages/about',
  '/admin/pages/experience',
  '/admin/pages/projects',
  '/admin/pages/contact',
  '/admin/pages/navbar',
  '/admin/pages/footer',
  '/admin/pages/privacy',
  '/admin/pages/other',
  '/admin/settings',
  '/admin/account',
]

for (const theme of ['light', 'dark'] as const) {
  test(`halaman admin (${theme}) tanpa pelanggaran aksesibilitas dan CSP`, async ({ page }) => {
    // 22 halaman diperiksa axe dalam satu tes; batas 30 detik terlalu ketat bila data uji menumpuk
    test.setTimeout(150_000)
    await page.addInitScript((value) => localStorage.setItem('mmirza-theme', value), theme)
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

  // Validasi: galat bahasa yang tampil langsung terlihat, galat bahasa lain diberitahukan (judul dan
  // ringkasan; deskripsi opsional sejak audit 2026-10-31 GAP-05). Pengalih bahasa isian hanya di top bar.
  await page.getByRole('button', { name: 'Buat project' }).click()
  await expect(page.getByText('Judul wajib diisi')).toBeVisible()
  await expect(page.getByText('2 galat di isian English.')).toBeVisible()
  await expect(page.getByRole('tab', { name: /Indonesia|English/ })).toHaveCount(0)

  await page.getByLabel('Judul', { exact: true }).fill(titleId)
  await page.getByLabel('Ringkasan', { exact: true }).fill('Ringkasan untuk tes E2E.')
  await page.getByLabel('Peran saya (opsional)').fill('Peran E2E')
  await page.locator('#description_id').fill('Deskripsi **E2E**.')
  await page.getByRole('button', { name: 'Buka isian English' }).click()
  await page.getByLabel('Title', { exact: true }).fill(`E2E project ${suffix}`)
  await page.getByLabel('Summary', { exact: true }).fill('Summary for the E2E test.')
  await page.locator('#description_en').fill('Description.')
  await page.getByLabel('Slug').fill(`e2e-${suffix}`.toLowerCase())
  // tombol detail: demo tampil, GitHub dimatikan Super Admin walau URL-nya diisi
  await page.getByLabel('URL demo (opsional)').fill('https://example.com/demo')
  await page.getByLabel('URL repo (opsional)').fill('https://github.com/example/repo')
  await page.getByLabel('Tampilkan tombol "GitHub" (URL repo)').uncheck()
  // satu skill agar chip teknologi project ikut diuji
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

  // Aksesibilitas halaman publik saat ada project terbit (kartu, chip teknologi, detail).
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

  // Regresi: revalidasi setelah simpan tidak boleh membuat halaman publik menjadi 404. Dicek langsung
  // ke server (seperti status 404 di atas): navigasi Firefox bisa dijawab cache browser dengan 304
  // atau tanpa respons sama sekali (CI 2026-10-20).
  for (const locale of ['id', 'en']) {
    const response = await page.request.get(`/${locale}`)
    expect(response.status(), `/${locale}`).toBe(200)
  }
})

test('kategori skill yang masih berisi tidak bisa dihapus', async ({ page }) => {
  await page.goto('/admin/skills')
  const first = page.getByRole('button', { name: /^Hapus kategori / }).first()
  await first.click()
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()
  await expect(page.getByText(/Kategori masih berisi \d+ skill/)).toBeVisible()
})

// Dua tes di bawah mengubah data global bersama (pengaturan situs dan teks Home), lalu
// mengembalikannya. Bila dijalankan di semua proyek browser sekaligus, satu proyek bisa
// mengembalikan nilai saat proyek lain masih memeriksanya (audit 2026-10-31, BUG-07). Karena itu
// keduanya hanya berjalan di proyek chromium; alur admin ini tidak bergantung pada mesin browser.
const GLOBAL_MUTATION_PROJECT = 'chromium'
const globalMutationReason = 'mengubah data global bersama; satu proyek saja agar tidak balapan'

test('volume suara dari pengaturan dipakai situs publik', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== GLOBAL_MUTATION_PROJECT, globalMutationReason)
  await page.goto('/admin/settings')
  const slider = page.getByLabel('Volume')
  const output = page.locator('output[for="soundVolume"]')
  // Isian bisa masuk sebelum React selesai hidrasi, sehingga label tidak ikut berubah. Tiap
  // percobaan mengisi nilai lain dulu: mengisi nilai yang sudah ada tidak memicu event input.
  await expect(async () => {
    await slider.fill('30')
    await slider.fill('35')
    await expect(output).toHaveText('35%', { timeout: 1000 })
  }).toPass()
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Pengaturan disimpan.')).toBeVisible()
  // dicek langsung ke server agar cache browser WebKit/Firefox tidak menyajikan halaman lama
  await expect
    .poll(async () => (await page.request.get('/id')).text(), { timeout: ISR_REFRESH_TIMEOUT })
    .toContain('data-sound-volume="35"')
  // kembalikan ke bawaan agar tes lain tidak terpengaruh
  await page.goto('/admin/settings')
  await expect(async () => {
    await slider.fill('75')
    await slider.fill('80')
    await expect(output).toHaveText('80%', { timeout: 1000 })
  }).toPass()
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Pengaturan disimpan.')).toBeVisible()
})

test('modul Home: peran di bawah foto diubah, tampil di situs, lalu dikembalikan', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== GLOBAL_MUTATION_PROJECT, globalMutationReason)
  // sejak 2026-11-10 Home hanya mengelola foto profil, foto utama, dan peran (permintaan pemilik)
  const field = () => page.getByLabel('Peran', { exact: true })
  await page.goto('/admin/pages/home')
  const original = await field().inputValue()
  await expect(async () => {
    await field().fill('Peran Uji Otomatis | Peran Kedua Uji')
    await expect(field()).toHaveValue('Peran Uji Otomatis | Peran Kedua Uji', { timeout: 1000 })
  }).toPass()
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Peran disimpan.')).toBeVisible()
  // dicek langsung ke server agar cache browser tidak menyajikan halaman lama
  await expect
    .poll(async () => (await page.request.get('/id')).text(), { timeout: ISR_REFRESH_TIMEOUT })
    .toContain('Peran Kedua Uji')

  // kembalikan agar tes lain tidak terpengaruh
  await page.goto('/admin/pages/home')
  await expect(async () => {
    await field().fill(original)
    await expect(field()).toHaveValue(original, { timeout: 1000 })
  }).toPass()
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Peran disimpan.')).toBeVisible()
  await expect
    .poll(async () => (await page.request.get('/id')).text(), { timeout: ISR_REFRESH_TIMEOUT })
    .not.toContain('Peran Kedua Uji')
})

test('modul Home hanya berisi foto profil, foto utama, dan peran', async ({ page }) => {
  await page.goto('/admin/pages/home')
  for (const title of ['Foto profil', 'Foto utama', 'Peran di bawah foto']) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
  }
  // armor, judul bagian, dan SEO tidak bisa diubah lagi
  for (const old of ['Armor hero', 'Judul bagian', 'SEO']) {
    await expect(page.getByRole('heading', { name: old, exact: true })).toHaveCount(0)
  }
  // belum ada unggahan: foto utama bawaan bisa diunduh sebagai acuan
  await expect(page.getByRole('link', { name: 'Unduh foto bawaan sebagai acuan' })).toHaveCount(1)
  // foto profil pindah ke Home: tidak dobel di About → Profil
  await page.goto('/admin/profile')
  await expect(page.getByRole('heading', { name: 'Foto profil' })).toHaveCount(0)
  await expect(page.getByLabel('Peran', { exact: true })).toHaveCount(0)
})

test('Bagian Awal: hanya isi kartu pembuka yang bisa diubah', async ({ page }) => {
  await page.goto('/admin/pages/intro')
  await expect(page.getByRole('button', { name: 'Simpan' })).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Isi kartu pembuka' })).toBeVisible()
  await expect(page.getByLabel('Isi', { exact: true })).toBeVisible()
  // judul, saklar tampil, label, dan tombol kartu adalah teks tetap
  await expect(page.getByLabel('Judul', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Tampilkan pemberitahuan pembuka')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Teks di kartu' })).toHaveCount(0)
})

test('tiap topik satu menu: data profil dan project ada sebagai tab modul, bukan menu kedua', async ({
  page,
  isMobile,
}) => {
  await page.goto('/admin/profile')
  await expect(page.getByRole('link', { name: 'Teks halaman' })).toHaveAttribute(
    'href',
    '/admin/pages/about',
  )
  await expect(page.getByRole('link', { name: 'Profil', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  if (!isMobile) {
    const menu = page.getByRole('navigation', { name: 'Menu admin' })
    await expect(menu.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page')
    for (const old of ['Profil', 'Project', 'Skill', 'Pengalaman'])
      await expect(menu.getByRole('link', { name: old, exact: true })).toHaveCount(0)
  }
})

test('top bar: bahasa isian, tema, dan profil di pojok kanan atas', async ({ page }) => {
  await page.goto('/admin/pages/about')
  const bar = page.getByRole('banner')
  // satu tombol bulat seperti situs publik: kode yang terlihat adalah bahasa tujuan
  await expect(bar.getByRole('button', { name: 'EN, ganti bahasa isian ke English' })).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Mode gelap' })).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Menu profil' })).toBeVisible()

  // bahasa isian menentukan kolom yang tampil di form dua bahasa
  await expect(page.getByLabel('Judul (Indonesia)', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Judul (English)', { exact: true })).toHaveCount(0)
  // klik sebelum hydration selesai belum berpengaruh; tombol ini bergantian (EN lalu ID), jadi hanya
  // diklik ulang selama masih bertuliskan EN
  const toEnglish = bar.getByRole('button', { name: 'EN, ganti bahasa isian ke English' })
  await expect(async () => {
    if (await toEnglish.count()) await toEnglish.click()
    await expect(page.getByLabel('Judul (English)', { exact: true })).toBeVisible({ timeout: 1000 })
  }).toPass()
  await expect(page.getByLabel('Judul (Indonesia)', { exact: true })).toHaveCount(0)
  // kembalikan agar tes lain tidak terpengaruh (pilihan tersimpan di browser)
  await expect(toEnglish).toHaveCount(0)
  await bar.getByRole('button', { name: 'ID, ganti bahasa isian ke Indonesia' }).click()

  await bar.getByRole('button', { name: 'Menu profil' }).click()
  await expect(page.getByRole('link', { name: 'Akun' }).last()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Keluar' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Keluar' })).toHaveCount(0)
})

test('admin tanpa tulisan biru dan tanpa batang gulir', async ({ page }) => {
  for (const path of ['/admin', '/admin/pages/home', '/admin/profile', '/admin/messages']) {
    await page.goto(path)
    const blue = await page.evaluate(() => {
      const found: string[] = []
      for (const el of document.querySelectorAll('main *, header *, aside *')) {
        if (!(el.textContent ?? '').trim() || el.children.length > 0) continue
        const m = getComputedStyle(el)
          .color.match(/\d+(\.\d+)?/g)
          ?.map(Number)
        if (m && m[2]! > m[0]! + 50 && m[2]! > m[1]! + 25)
          found.push(`${el.tagName} ${el.textContent!.trim().slice(0, 30)}`)
      }
      return found
    })
    expect(blue, `${path} berisi tulisan biru`).toEqual([])
    // batang gulir menyisakan selisih lebar; disembunyikan berarti selisihnya nol
    const gutter = await page.evaluate(
      () => window.innerWidth - document.documentElement.clientWidth,
    )
    expect(gutter, `${path} masih punya batang gulir`).toBe(0)
  }
})
