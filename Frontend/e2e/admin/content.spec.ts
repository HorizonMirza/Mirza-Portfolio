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
  '/admin/education',
  '/admin/education/new',
  '/admin/messages',
  '/admin/pages/intro',
  '/admin/pages/home',
  '/admin/roles',
  '/admin/pages/about',
  '/admin/pages/experience',
  '/admin/pages/projects',
  '/admin/pages/contact',
  '/admin/pages/navbar',
  '/admin/pages/footer',
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

test('CRUD project: buat, tampil di daftar, ubah, dan hapus', async ({ page }, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}`
  const titleId = `Project E2E ${suffix}`
  await page.goto('/admin/projects/new')

  // Ubah langsung di pratinjau halaman detail (DESIGN.md bagian 138). Validasi: galat kedua bahasa
  // tampil di bawah panggung (judul dan ringkasan; deskripsi opsional sejak audit 2026-10-31 GAP-05).
  // Diulang sampai hidrasi selesai. getByRole: hanya yang terlihat (Next menyimpan salinan halaman
  // tersembunyi untuk navigasi kembali).
  await expect(async () => {
    await page.getByRole('button', { name: 'Buat project' }).click()
    await expect(page.getByText('title (Indonesia): Judul wajib diisi')).toBeVisible({
      timeout: 1000,
    })
  }).toPass()
  await expect(page.getByText(/^summary \(Inggris\): /)).toBeVisible()

  const box = (name: string) => page.getByRole('textbox', { name, exact: true })
  await box('Judul (Indonesia)').fill(titleId)
  await box('Ringkasan (Indonesia)').fill('Ringkasan untuk tes E2E.')
  await box('Peran saya (opsional) (Indonesia)').fill('Peran E2E')
  await page.locator('#description_id').fill('Deskripsi **E2E**.')
  // bahasa Inggris lewat tombol EN di panggung; tampilan admin tetap berbahasa Indonesia
  await page
    .getByRole('group', { name: 'Bahasa yang diubah' })
    .getByRole('button', { name: 'EN' })
    .click()
  const titleEn = `E2E project ${suffix}`
  await box('Judul (Inggris)').fill(titleEn)
  await box('Ringkasan (Inggris)').fill('Summary for the E2E test.')
  await page.locator('#description_en').fill('Description.')
  await box('Slug').fill(`e2e-${suffix}`.toLowerCase())
  // tombol detail: demo tampil, GitHub dimatikan Super Admin walau URL-nya diisi
  await box('URL demo (opsional)').fill('https://example.com/demo')
  await box('URL repo (opsional)').fill('https://github.com/example/repo')
  const main = page.getByRole('main')
  const repoButton = main
    .getByRole('group', { name: 'Tombol di halaman detail' })
    .getByRole('button', { name: 'GitHub', exact: true })
  await repoButton.click()
  await expect(repoButton).toHaveAttribute('aria-pressed', 'false')
  // satu skill agar chip teknologi project ikut diuji
  const skill = main.getByRole('button', { name: 'TypeScript', exact: true })
  await skill.click()
  await expect(skill).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Buat project' }).click()
  await expect(page.getByText('Project dibuat.')).toBeVisible()
  await expect(page).toHaveURL(/\/admin\/projects\/[0-9a-f-]{36}$/)

  // Ubah status menjadi terbit (diulang sampai halaman edit terhidrasi)
  await expect(async () => {
    await main.getByRole('button', { name: 'Terbit', exact: true }).click({ timeout: 2000 })
    await expect(main.getByRole('button', { name: 'Terbit', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
      { timeout: 1000 },
    )
  }).toPass()
  await page.getByRole('button', { name: 'Simpan', exact: true }).click()
  await expect(page.getByText('Project disimpan.')).toBeVisible()

  // Project yang terbit setelah build langsung tampil di situs publik (revalidasi + dynamicParams).
  const slug = `e2e-${suffix}`.toLowerCase()
  const detail = await page.goto(`/id/projects/${slug}`)
  expect(detail?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(titleId)
  await expect(page.getByText('Peran E2E')).toBeVisible()
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

  // daftar admin seperti halaman Project situs: judul dalam bahasa admin (Indonesia)
  await page.goto('/admin/projects')
  await expect(page.getByRole('link', { name: titleId })).toBeVisible()
  await expect(page.getByText('Peran E2E').locator('visible=true').first()).toBeVisible()

  // Hapus dengan konfirmasi
  await page.getByRole('button', { name: `Hapus ${titleId}` }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()
  await expect(page.getByText('Project dihapus.')).toBeVisible()
  await expect(page.getByRole('link', { name: titleId })).toHaveCount(0)

  // Status dicek langsung ke server, tanpa cache HTTP browser. Firefox menerapkan
  // stale-while-revalidate juga untuk navigasi, jadi `next start` lokal bisa menyajikan salinan
  // lama dari cache browser. Di Vercel, CDN mengganti Cache-Control ke browser.
  const gone = await page.request.get(`/id/projects/${slug}`)
  expect(gone.status()).toBe(404)

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
  // bagian Keahlian Teknis seperti di beranda; nama kategori diketik langsung (DESIGN.md bagian 134)
  await expect(page.getByRole('heading', { name: 'Keahlian Teknis' })).toBeVisible()
  await expect(
    page.getByRole('textbox', { name: 'Nama kategori (Indonesia)' }).first(),
  ).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Kategori baru' })).toBeVisible()
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
  // Pengaturan disimpan otomatis setiap kontrol diubah (desain 1, DESIGN.md bagian 119)
  const setVolume = async (value: string, other: string) => {
    await page.goto('/admin/settings')
    const slider = page.getByRole('slider', { name: 'Suara tombol' })
    // Isian bisa masuk sebelum React selesai hidrasi. Tiap percobaan mengisi nilai lain dulu: mengisi
    // nilai yang sudah ada tidak memicu event input.
    await expect(async () => {
      await slider.fill(other)
      await slider.fill(value)
      await expect(page.getByText(`${value}%`, { exact: true })).toBeVisible({ timeout: 1000 })
    }).toPass()
    await expect(page.getByText('Tersimpan', { exact: true })).toBeVisible()
    // nilai tersimpan di server, bukan hanya di layar
    await page.reload()
    await expect(page.getByRole('slider', { name: 'Suara tombol' })).toHaveValue(value)
  }
  await setVolume('35', '30')
  // dicek langsung ke server agar cache browser WebKit/Firefox tidak menyajikan halaman lama
  await expect
    .poll(async () => (await page.request.get('/id')).text(), { timeout: ISR_REFRESH_TIMEOUT })
    .toContain('data-sound-volume="35"')
  // kembalikan ke bawaan agar tes lain tidak terpengaruh
  await setVolume('80', '75')
})

test('modul Home: peran di bawah foto diubah, tampil di situs, lalu dikembalikan', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== GLOBAL_MUTATION_PROJECT, globalMutationReason)
  // sejak 2026-11-10 Home hanya mengelola foto profil, foto utama, dan peran (permintaan pemilik).
  // Yang diubah peran bahasa Inggris dan dicek di /en: tes halaman Tentang (/id/about) berjalan
  // bersamaan dan memeriksa peran bahasa Indonesia, jadi keduanya tidak saling mengganggu.
  // peran diketik langsung di pratinjau hero (DESIGN.md bagian 133), bahasa dipilih di panggung
  // getByRole: hanya yang terlihat (Next menyimpan salinan halaman tersembunyi untuk navigasi kembali)
  const roles = page.getByRole('textbox', { name: /^Role \d+ \(English\)$/ })
  // bahasa admin EN disetel lewat cookie sebelum halaman dibuka (sama seperti pilihan tombol bahasa
  // di top bar), agar tidak berpacu dengan hidrasi tombol. Tampilan admin ikut berbahasa Inggris.
  await page
    .context()
    .addCookies([{ name: 'mmirza-admin-lang', value: 'en', url: testInfo.project.use.baseURL! }])
  const openEnglish = async () => {
    await page.goto('/admin/roles')
    // tombol EN baru berfungsi setelah hidrasi: diulang sampai kolom bahasa Inggris tampil
    await expect(async () => {
      await page
        .getByRole('group', { name: 'Language being edited' })
        .getByRole('button', { name: 'EN' })
        .click({ timeout: 2000 })
      await expect(roles.first()).toBeVisible({ timeout: 1000 })
    }).toPass()
  }
  await openEnglish()
  const original = await roles.evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value))
  await roles.nth(0).fill('Test Role One')
  await roles.nth(1).fill('Test Role Two')
  await expect(roles.nth(1)).toHaveValue('Test Role Two')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Roles saved.')).toBeVisible()
  // dicek langsung ke server agar cache browser tidak menyajikan halaman lama
  await expect
    .poll(async () => (await page.request.get('/en')).text(), { timeout: ISR_REFRESH_TIMEOUT })
    .toContain('Test Role Two')

  // kembalikan agar tes lain tidak terpengaruh
  await openEnglish()
  for (const [i, value] of original.entries()) await roles.nth(i).fill(value)
  for (let i = original.length; i < (await roles.count()); i++) await roles.nth(i).fill('')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Roles saved.')).toBeVisible()
  await expect
    .poll(async () => (await page.request.get('/en')).text(), { timeout: ISR_REFRESH_TIMEOUT })
    .not.toContain('Test Role Two')
})

test('modul Home: empat tab selebar panel, foto dan peran di tab masing-masing', async ({
  page,
}) => {
  await page.goto('/admin/pages/home')
  // tanpa deskripsi; empat tab satu baris dengan urutan pilihan pemilik (DESIGN.md bagian 129)
  const tabs = page.getByRole('navigation', { name: 'Bagian halaman' }).getByRole('link')
  await expect(tabs).toHaveText(['Kartu pembuka', 'Foto beranda', 'Peran beranda', 'Skill teknis'])
  await expect(page.getByRole('link', { name: 'Foto beranda' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.locator('main').getByText(/^Beranda: foto profil/)).toHaveCount(0)
  // satu baris: semua tab sejajar di atas
  const tops = await tabs.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top))
  expect(new Set(tops).size).toBe(1)
  // Foto beranda: hero seperti di situs, foto ditekan untuk diganti (DESIGN.md bagian 133)
  for (const label of ['Ganti foto profil', 'Ganti foto utama'])
    await expect(page.getByRole('button', { name: label })).toBeVisible()
  await expect(page.getByRole('textbox', { name: /^Peran ke-1/ })).toHaveCount(0)
  await page.goto('/admin/roles')
  await expect(page.getByRole('textbox', { name: 'Peran ke-1 (Indonesia)' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Peran ke-2 (Indonesia)' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Peran beranda' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await page.goto('/admin/pages/home')
  // armor, judul bagian, dan SEO tidak bisa diubah lagi
  for (const old of ['Armor hero', 'Judul bagian', 'SEO']) {
    await expect(page.getByRole('heading', { name: old, exact: true })).toHaveCount(0)
  }
  // foto utama ditekan: jendela kecil dengan acuan foto bawaan yang bisa diunduh
  await expect(async () => {
    await page.getByRole('button', { name: 'Ganti foto utama' }).click({ timeout: 2000 })
    await expect(page.getByRole('dialog', { name: 'Foto utama' })).toBeVisible({ timeout: 1000 })
  }).toPass()
  await expect(
    page.getByRole('dialog').getByRole('link', { name: 'Unduh foto bawaan sebagai acuan' }),
  ).toHaveCount(1)
  await page.keyboard.press('Escape')
  // foto profil pindah ke Home: tidak dobel di About → Profil
  await page.goto('/admin/profile')
  await expect(page.getByRole('heading', { name: 'Foto profil' })).toHaveCount(0)
  await expect(page.getByLabel('Peran', { exact: true })).toHaveCount(0)
  // Profil: pita halaman Tentang diketik langsung (DESIGN.md bagian 136)
  await expect(page.getByRole('textbox', { name: 'Nama', exact: true })).not.toHaveValue('')
  await expect(page.getByRole('textbox', { name: 'Bio (Indonesia)' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Ganti foto kartu About$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Chip bendera' })).toHaveAttribute(
    'aria-pressed',
    /true|false/,
  )
})

test('Bagian Awal: tab Kartu pembuka di Home, hanya isinya yang bisa diubah', async ({ page }) => {
  await page.goto('/admin/pages/intro')
  // bukan menu sendiri lagi: tab pertama Home, tujuan menu Home (revisi 2026-11-11)
  await expect(page.getByRole('link', { name: 'Kartu pembuka', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByRole('link', { name: 'Foto beranda', exact: true })).toBeVisible()
  // nama halaman di top bar dan menu yang menyala milik Home (Beranda di bahasa admin Indonesia)
  await expect(page.getByRole('banner').getByText('Beranda', { exact: true })).toBeVisible()
  await expect(page.locator('aside a[href="/admin/pages/intro"]')).toHaveAttribute(
    'aria-current',
    'page',
  )
  // tab selebar panel isi sampai tepi kiri-kanan (revisi 2026-11-12, DESIGN.md bagian 131)
  const tabsNav = page.getByRole('navigation', { name: 'Bagian halaman' })
  const widths = await tabsNav.evaluate((nav) => {
    const main = document.querySelector('main')!
    const style = getComputedStyle(main)
    const inner = main.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    return { nav: nav.getBoundingClientRect().width, inner }
  })
  expect(Math.abs(widths.nav - widths.inner)).toBeLessThan(2)

  // kartu tampil seperti di situs dan isinya langsung bisa diketik, tanpa kotak isian, ikon pensil,
  // atau petunjuk (revisi 2026-11-12, DESIGN.md bagian 132); Simpan satu baris penuh
  const save = page.getByRole('button', { name: 'Simpan' })
  await expect(save).toHaveCount(1)
  const saveWidth = (await save.boundingBox())!.width
  expect(Math.abs(saveWidth - widths.inner)).toBeLessThan(2)
  await expect(page.getByText('Informasi Penting', { exact: true })).toBeVisible()
  await expect(page.getByText(/Esc|\*\*teks\*\*/)).toHaveCount(0)
  const body = page.getByLabel('Isi kartu pembuka (Indonesia)')
  await expect(body).toBeVisible()
  expect(await body.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
  const original = await body.inputValue()
  expect(original.length).toBeGreaterThan(0)
  // isi kosong ditolak tanpa tersimpan (diulang sampai hidrasi selesai)
  await expect(async () => {
    await body.fill('')
    await save.click()
    await expect(page.getByText('Wajib diisi')).toBeVisible({ timeout: 1000 })
  }).toPass()
  // bahasa lain lewat tombol EN di kartu, judul ikut berbahasa Inggris
  await page
    .getByRole('group', { name: 'Bahasa yang diubah' })
    .getByRole('button', { name: 'EN' })
    .click()
  await expect(page.getByText('Important Information', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Isi kartu pembuka (Inggris)')).toBeVisible()
  // judul, saklar tampil, label, dan tombol kartu adalah teks tetap
  await expect(page.getByLabel('Judul', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Tampilkan pemberitahuan pembuka')).toHaveCount(0)
})

test('About → Pendidikan: form khusus pendidikan, Experience hanya kerja dan organisasi', async ({
  page,
}) => {
  await page.goto('/admin/education')
  await expect(page.getByRole('link', { name: 'Pendidikan', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  // daftar seperti timeline situs, tambah lewat baris bergaris putus (DESIGN.md bagian 137)
  await expect(page.getByRole('link', { name: 'Tambah pendidikan' })).toHaveAttribute(
    'href',
    '/admin/education/new',
  )
  await page.goto('/admin/education/new')
  // entri baru diketik langsung: sekolah, jenjang, Grade/GPA
  await expect(page.getByRole('textbox', { name: 'Sekolah / kampus', exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Grade / GPA (Indonesia)' })).toBeVisible()
  // jenis tetap Pendidikan dan isian khusus kerja disembunyikan
  for (const label of ['Kerja', 'Organisasi', 'Titik cerita'])
    await expect(page.getByRole('button', { name: label, exact: true })).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: 'Lokasi (opsional)' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Semua pendidikan' })).toHaveAttribute(
    'href',
    '/admin/education',
  )
  // pilihan jenis di Experience tanpa Pendidikan
  await page.goto('/admin/experience/new')
  await expect(page.getByRole('button', { name: 'Kerja', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Organisasi', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pendidikan', exact: true })).toHaveCount(0)
})

test('skeleton shimmer tampil saat pindah menu admin sampai data siap', async ({ page }) => {
  // data halaman tujuan ditahan sebentar setelah kerangkanya diambil lewat prefetch
  await page.goto('/admin', { waitUntil: 'networkidle' })
  await page.route('**/*', async (route) => {
    const h = route.request().headers()
    // hanya permintaan navigasi; prefetch kerangka halaman tujuan dibiarkan lewat
    if (h['rsc'] === '1' && !h['next-router-prefetch'])
      await new Promise((r) => setTimeout(r, 1500))
    await route.continue().catch(() => {})
  })
  const loading = page.getByRole('status').filter({ hasText: 'Memuat halaman…' })
  const tile = page.getByRole('link', { name: 'Pesan baru' })
  await tile.hover()
  await page.waitForLoadState('networkidle')
  await tile.click()
  await expect(loading).toBeAttached()
  await expect(page.getByRole('heading', { name: 'Pesan', level: 1 })).toBeVisible({
    timeout: 15_000,
  })
  await expect(loading).toHaveCount(0)
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
    // nama menu situs berbahasa Indonesia di mode Indonesia (About → Tentang)
    await expect(menu.getByRole('link', { name: 'Tentang' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    // halaman data (profil, project, skill, pengalaman) hanya lewat tab modul, bukan menu sendiri.
    // Dicek lewat alamat: nama menu Projects/Experience di mode Indonesia memang Project/Pengalaman.
    for (const old of ['/admin/profile', '/admin/projects', '/admin/skills', '/admin/experience'])
      await expect(menu.locator(`a[href="${old}"]`)).toHaveCount(0)
  }
})

test('top bar: bahasa admin, tema, dan profil di pojok kanan atas', async ({ page }) => {
  await page.goto('/admin/pages/about')
  const bar = page.getByRole('banner')
  // satu tombol bulat seperti situs publik: kode yang terlihat adalah bahasa tujuan
  const toEnglish = bar.getByRole('button', { name: 'EN, ganti bahasa admin ke English' })
  await expect(toEnglish).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Mode gelap' })).toBeVisible()
  // menu profil: tombol titik tiga di top bar di semua ukuran layar (demo 3, DESIGN.md bagian 128)
  await expect(bar.getByRole('button', { name: 'Menu profil' })).toBeVisible()
  // nama halaman di top bar, huruf Inter biasa (bukan Oswald kapital; DESIGN.md bagian 113)
  const title = bar.getByText('Tentang', { exact: true })
  await expect(title).toHaveCSS('text-transform', 'none')
  expect(await title.evaluate((el) => getComputedStyle(el).fontFamily)).not.toMatch(/oswald/i)
  // logo dan nama panel pindah ke sidebar; Akun hanya di menu profil, Pengaturan kembali ke sidebar,
  // Log audit dan menu Bagian Awal dihapus (revisi 2026-11-11)
  await expect(bar.getByText('Super Admin', { exact: true })).toHaveCount(0)
  const sidebar = page.getByRole('navigation', { name: 'Menu admin' })
  for (const gone of ['Akun', 'Log audit', 'Bagian Awal'])
    await expect(sidebar.getByRole('link', { name: gone })).toHaveCount(0)
  // dicek lewat DOM: di HP sidebar tersembunyi (menunya di laci)
  await expect(page.locator('aside a[href="/admin/settings"]')).toHaveCount(1)

  // bahasa admin menentukan bahasa isi yang diubah di pratinjau (DESIGN.md bagian 135)
  await expect(page.getByRole('textbox', { name: 'Judul (Indonesia)', exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Title (English)', exact: true })).toHaveCount(0)
  // klik sebelum hydration selesai belum berpengaruh; tombol ini bergantian (EN lalu ID), jadi hanya
  // diklik ulang selama masih bertuliskan EN
  await expect(async () => {
    if (await toEnglish.count()) await toEnglish.click()
    // label isian ikut berbahasa Inggris (seluruh tampilan admin, DESIGN.md bagian 115)
    await expect(page.getByRole('textbox', { name: 'Title (English)', exact: true })).toBeVisible({
      timeout: 1000,
    })
  }).toPass()
  await expect(page.getByRole('textbox', { name: 'Judul (Indonesia)', exact: true })).toHaveCount(0)
  // tampilan admin ikut berganti: menu, top bar, judul halaman dari server, dan html lang
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(bar.getByRole('button', { name: 'Appearance' })).toBeAttached()
  await expect(bar.getByRole('button', { name: 'Dark mode' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Page text' })).toBeVisible()
  // isi halaman juga berbahasa Inggris: tombol Simpan; deskripsi halaman tidak ada lagi
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible()
  await expect(page.getByText(/^About page\. Bio/)).toHaveCount(0)
  await expect(page.getByText('Teks halaman', { exact: true })).toHaveCount(0)
  // dimuat ulang tetap berbahasa Inggris (cookie dibaca server)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('link', { name: 'Page text' })).toBeVisible()
  const profileEn = page.getByRole('button', { name: /Profile menu$/ })
  await profileEn.click()
  // urutan tetap pilihan pemilik: Akun, Lihat situs
  await expect(
    page.locator(`[id="${await profileEn.getAttribute('aria-controls')}"]`).locator('a'),
  ).toHaveText(['Account', /^View site/])
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
  await page.keyboard.press('Escape')
  // kembalikan ke Indonesia
  const toIndonesian = bar.getByRole('button', { name: 'ID, switch admin language to Indonesian' })
  await expect(async () => {
    if (await toIndonesian.count()) await toIndonesian.click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'id', { timeout: 1000 })
  }).toPass()
  await expect(page.getByRole('link', { name: 'Teks halaman' })).toBeVisible()

  // menu profil: Akun dan Lihat situs dengan keterangan, lalu Keluar berwarna merah paling bawah
  const profile = bar.getByRole('button', { name: 'Menu profil' })
  await profile.click()
  const panel = page.locator(`[id="${await profile.getAttribute('aria-controls')}"]`)
  // tanpa keterangan di bawah pilihan (revisi pemilik 2026-11-11)
  await expect(panel.locator('a, button')).toHaveText([/^Akun$/, /^Lihat situs/, /^Keluar$/])
  // tanpa wajah kedua: foto dan nama admin hanya di puncak sidebar (revisi 2026-11-11)
  await expect(panel.locator('img')).toHaveCount(0)
  await expect(panel.getByText('Super Admin')).toHaveCount(0)
  // warna yang benar-benar tampil, bukan sekadar nama kelas: Keluar merah, beda dari Akun
  const color = (name: string) =>
    panel
      .getByRole(name === 'Keluar' ? 'button' : 'link', { name })
      .evaluate((el) => getComputedStyle(el).color)
  const danger = await panel.evaluate((el) => {
    const probe = document.createElement('span')
    probe.style.color = 'var(--danger)'
    el.append(probe)
    const value = getComputedStyle(probe).color
    probe.remove()
    return value
  })
  expect(await color('Keluar')).toBe(danger)
  expect(await color('Akun')).not.toBe(danger)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Keluar' })).toHaveCount(0)
})

test('hamburger: sidebar desktop diciutkan jadi ikon dan diingat, di HP membuka laci', async ({
  page,
  isMobile,
}) => {
  // revisi pemilik 2026-11-11 (DESIGN.md bagian 126); tanpa Privasi dan Halaman lain
  await page.goto('/admin')
  const hamburger = page.getByRole('button', { name: 'Menu samping' })
  const menu = page.getByRole('navigation', { name: 'Menu admin' }).locator('visible=true')
  if (isMobile) {
    await hamburger.click()
    await expect(menu.getByRole('link', { name: 'Pesan' })).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Privasi' })).toHaveCount(0)
    await page.keyboard.press('Escape')
    return
  }
  const aside = page.locator('aside[data-collapsed]')
  const width = async () => (await aside.boundingBox())!.width
  await expect(aside).toHaveAttribute('data-collapsed', 'false')
  // nama lengkap tidak terpotong di sidebar lebar
  const identity = aside.getByRole('link', { name: /kembali ke Dashboard$/ })
  const name = identity.locator('span.truncate')
  expect(await name.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await expect(menu.getByRole('link', { name: 'Privasi' })).toHaveCount(0)
  await expect(menu.getByRole('link', { name: 'Halaman lain' })).toHaveCount(0)
  expect(await width()).toBeGreaterThan(225)
  await expect(hamburger).toHaveAttribute('aria-expanded', 'true')

  // ikon tidak melompat saat menciut: posisinya sama di kedua keadaan, hanya tulisan yang memudar
  const icon = menu.locator('a[href="/admin/messages"] svg')
  const iconX = async () => (await icon.boundingBox())!.x
  const xOpen = await iconX()
  const label = menu.locator('a[href="/admin/messages"] span').first()

  await hamburger.click()
  await expect(aside).toHaveAttribute('data-collapsed', 'true')
  await expect(hamburger).toHaveAttribute('aria-expanded', 'false')
  await expect.poll(width).toBeLessThan(90)
  expect(Math.abs((await iconX()) - xOpen)).toBeLessThan(1.5)
  await expect(label).toHaveCSS('opacity', '0')
  // ikon tepat di tengah rel
  const asideBox = (await aside.boundingBox())!
  const iconBox = (await icon.boundingBox())!
  expect(Math.abs(iconBox.x + iconBox.width / 2 - (asideBox.x + asideBox.width / 2))).toBeLessThan(
    1.5,
  )
  // label tetap untuk pembaca layar, nama muncul saat kursor di atas ikon
  await expect(menu.getByRole('link', { name: 'Pesan' })).toHaveAttribute('title', 'Pesan')
  // pilihan diingat setelah dimuat ulang (cookie dibaca server)
  await page.reload()
  await expect(aside).toHaveAttribute('data-collapsed', 'true')
  await hamburger.click()
  await expect(aside).toHaveAttribute('data-collapsed', 'false')
  await expect.poll(width).toBeGreaterThan(225)

  // foto dan nama di puncak sidebar membawa kembali ke Dashboard (revisi 2026-11-11, DESIGN.md bagian 128)
  await page.goto('/admin/pages/about')
  await identity.click()
  await expect(page).toHaveURL(/\/admin$/)
})

test('kerangka admin tetap: hanya isi panel besar yang digulir', async ({
  page,
  browserName,
  isMobile,
}) => {
  // revisi pemilik 2026-11-11 (DESIGN.md bagian 114): top bar dan sidebar diam, isi digulir di dalam
  // form Project baru selalu lebih tinggi dari layar, tidak bergantung pada jumlah data di database
  // (database CI baru dan hampir kosong, CI #287)
  await page.goto('/admin/projects/new')
  const main = page.locator('main')
  const bar = page.getByRole('banner')
  const before = await bar.boundingBox()
  await expect.poll(() => main.evaluate((el) => el.scrollHeight > el.clientHeight + 100)).toBe(true)
  if (browserName === 'webkit' && isMobile) {
    // roda tetikus tidak didukung WebKit mobile di Playwright: gulir panel isi langsung
    await main.evaluate((el) => el.scrollBy(0, 900))
  } else {
    await main.hover()
    await page.mouse.wheel(0, 900)
  }
  await expect.poll(() => main.evaluate((el) => el.scrollTop)).toBeGreaterThan(200)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  expect(await bar.boundingBox()).toEqual(before)
  // pindah menu: isi halaman baru mulai dari atas lagi (di HP lewat laci dari tombol hamburger)
  if (isMobile) await page.getByRole('button', { name: 'Menu samping' }).click()
  await page
    .getByRole('navigation', { name: 'Menu admin' })
    .locator('visible=true')
    .getByRole('link', { name: 'Dashboard' })
    .click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect.poll(() => main.evaluate((el) => el.scrollTop)).toBe(0)
})

test.describe('animasi ganti bahasa admin', () => {
  // tes lain mematikan animasi (reducedMotion); di sini animasi harus berjalan
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('judul dari server dan isi kolom form ikut efek acak huruf', async ({ page }) => {
    // permintaan pemilik 2026-11-11 (DESIGN.md bagian 116): SELURUH teks yang berganti ikut efek,
    // termasuk judul halaman yang baru tiba setelah router.refresh() dan isi kolom form. Halaman About:
    // judul dan kolom pertama langsung terlihat di layar biasa (layar sangat tinggi membuat WebKit
    // berskala 2-3x di sandbox hanya menggambar sekitar 1 frame per detik).
    await page.goto('/admin/pages/about')
    // teks dari server yang terlihat di panel isi: tab aktif (deskripsi halaman dihapus 2026-11-12)
    const idDesc = 'Teks halaman'
    const enDesc = 'Page text'
    const h1 = page.locator('main nav a[aria-current="page"]')
    await expect(h1).toHaveText(idDesc)
    // rekam setiap teks judul dan isi kolom Judul (nilai atau placeholder) yang tampil, tiap frame
    await page.evaluate(() => {
      const seen = { title: new Set<string>(), field: new Set<string>() }
      // waktu terakhir judul halaman (server) dan nama halaman di top bar (client) berubah
      const last = { title: 0, bar: 0 }
      let prev = { title: '', bar: '' }
      Object.assign(window, { __seen: seen, __last: last })
      const tick = () => {
        const now = {
          title: document.querySelector('main nav a[aria-current="page"]')?.textContent ?? '',
          bar: document.querySelector('header p')?.textContent ?? '',
        }
        if (now.title !== prev.title) last.title = performance.now()
        if (now.bar !== prev.bar) last.bar = performance.now()
        prev = now
        seen.title.add(now.title)
        const field = document.querySelector<HTMLInputElement>('#About-title-id, #About-title-en')
        if (field) seen.field.add(field.value || field.placeholder)
        requestAnimationFrame(tick)
      }
      tick()
    })
    const fieldText = async () =>
      page
        .locator('#About-title-id, #About-title-en')
        .evaluate((el: HTMLInputElement) => el.value || el.placeholder)
    const idValue = await fieldText()
    const toEnglish = page.getByRole('button', { name: 'EN, ganti bahasa admin ke English' })
    await expect(async () => {
      if (await toEnglish.count()) await toEnglish.click()
      await expect(page.locator('html')).toHaveAttribute('lang', 'en', { timeout: 1000 })
    }).toPass()
    await expect(h1).toHaveText(enDesc)
    await expect(page.locator('#About-title-en')).toBeVisible()
    // tunggu animasi selesai, lalu ambil teks akhir kolom
    await expect.poll(fieldText).not.toMatch(/^$/)
    await page.waitForTimeout(1200)
    const enValue = await fieldText()
    // ada tulisan antara (huruf acak) selain teks lama dan teks baru; judul dari server diacak setelah
    // teksnya tiba, jadi ditunggu
    const between = (key: 'title' | 'field', known: string[]) =>
      page.evaluate(
        ({ key, known }) => {
          const s = (window as unknown as { __seen: Record<string, Set<string>> }).__seen
          return [...s[key]!].filter((v) => v && !known.includes(v)).length
        },
        { key, known },
      )
    await expect.poll(() => between('title', [idDesc, enDesc])).toBeGreaterThan(0)
    await expect.poll(() => between('field', [idValue, enValue])).toBeGreaterThan(0)
    await expect(h1).toHaveText(enDesc)
    // teks dari server dan dari browser selesai mengetik bersamaan (DESIGN.md bagian 117)
    await expect(page.getByRole('banner').getByText('About', { exact: true })).toBeVisible()
    const last = await page.evaluate(
      () => (window as unknown as { __last: Record<string, number> }).__last,
    )
    expect(Math.abs(last.title! - last.bar!)).toBeLessThan(150)
  })
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
    // isi halaman digulir di dalam panel besar; batang gulirnya juga disembunyikan
    const inner = await page
      .locator('main')
      .evaluate((el: HTMLElement) => el.offsetWidth - el.clientWidth)
    expect(inner, `${path} panel isi masih punya batang gulir`).toBe(0)
  }
})

test('Footer: kartu kontak diketik langsung, nilai salah tidak tersimpan', async ({ page }) => {
  // kartu kontak seperti di footer situs (DESIGN.md bagian 139); hanya validasi agar data kontak
  // yang dipakai tes situs publik tidak berubah
  await page.goto('/admin/pages/footer')
  const whatsapp = page.getByRole('textbox', { name: 'WhatsApp (opsional)' })
  const contacts = page.locator('form').filter({ has: whatsapp })
  await expect(page.getByRole('textbox', { name: 'Link CV (opsional)' })).toBeVisible()
  // diulang sampai hidrasi selesai
  await expect(async () => {
    await whatsapp.fill('nomor-salah')
    await contacts.getByRole('button', { name: 'Simpan' }).click()
    await expect(page.getByText(/^WhatsApp: Nomor WhatsApp/)).toBeVisible({ timeout: 1000 })
  }).toPass()
  await expect(page.getByText('Kontak disimpan.')).toHaveCount(0)
  // ikon kartu Resume CV membuka jendela berkas PDF
  await contacts.getByRole('button', { name: 'Berkas Resume CV' }).click()
  await expect(page.getByRole('dialog', { name: 'Berkas Resume CV' })).toBeVisible()
})
