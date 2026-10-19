import { expect, test } from '@playwright/test'

import { uniqueIp } from './admin/helpers'

test('beranda: tombol utama terlihat tanpa scroll dan susunan bagian sesuai revisi', async ({
  page,
  isMobile,
}) => {
  await page.goto('/id')
  await expect(page.getByRole('link', { name: 'Lihat project' })).toBeInViewport()
  // hero (revisi 2026-10-19, DESIGN.md bagian 85): nama sebagai h1 terbaca utuh dengan spasi di
  // belakang foto tanpa bingkai yang memakai liquid mask; panel status, angka, CV, dan sosial dihapus
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^\S+( \S+)+$/)
  const portrait = page.locator('section[aria-labelledby="hero-title"] figure img')
  await expect(portrait).toBeInViewport()
  await expect(portrait).toHaveAttribute('alt', /.+/)
  await expect(page.locator('.hero-mask-canvas')).toHaveCount(1)
  const hero = page.locator('section[aria-labelledby="hero-title"]')
  for (const text of [/Terbuka untuk kerja/, /Resume CV/, /^Lokasi$/, /^Kampus$/]) {
    await expect(hero.getByText(text)).toHaveCount(0)
  }
  // Keahlian Teknis dan GitHub (revisi pemilik 2026-10-16): judul di tengah tanpa nomor, tanpa
  // keterangan sumber keyboard, tanpa tautan profil dan baris aktivitas GitHub
  await expect(page.getByRole('heading', { name: 'Keahlian Teknis' })).toBeVisible()
  // bagian GitHub hanya tampil bila data kontribusi tersedia (lokal/CI bisa tanpa akses GitHub)
  const githubTitle = page.locator('#github-title')
  if (await githubTitle.count()) await expect(githubTitle).toHaveText('GitHub')
  for (const text of [/Naresh Khatri/, /Buka profil GitHub/, /Push ke /]) {
    await expect(page.getByRole('main').getByText(text)).toHaveCount(0)
  }
  // Pengalaman (revisi pemilik 2026-10-16, akordion): tanpa nomor dan tanpa tautan "Semua
  // pengalaman", semua tertutup di awal, satu baris bisa dibuka
  const xpHeading = page.getByRole('heading', { name: 'Pengalaman' })
  await expect(xpHeading).toBeVisible()
  await expect(xpHeading.locator('span[aria-hidden="true"]')).toHaveCount(0)
  await expect(page.getByText(/Semua pengalaman/)).toHaveCount(0)
  const xp = page.locator('details.home-xp')
  await expect(xp.first()).not.toHaveAttribute('open', '')
  await xp.nth(1).locator('summary').click()
  await expect(xp.nth(1)).toHaveAttribute('open', '')
  await expect(xp.nth(1).locator('.home-xp-body')).toBeVisible()
  // Project (revisi pemilik 2026-10-16, DESIGN.md bagian 58): judul tanpa nomor di bawah
  // Pengalaman, sampul di pita adalah tautan ke detail, pita tidak berhenti saat disorot
  const projectsHeading = page.getByRole('heading', { name: 'Project', exact: true })
  await expect(projectsHeading).toBeVisible()
  await expect(projectsHeading.locator('span[aria-hidden="true"]')).toHaveCount(0)
  const xpBox = await xpHeading.boundingBox()
  const projectsBox = await projectsHeading.boundingBox()
  expect(projectsBox!.y).toBeGreaterThan(xpBox!.y)
  for (const name of ['Project pilihan', /Semua project/]) {
    await expect(page.getByText(name)).toHaveCount(0)
  }
  const covers = page.getByRole('list', { name: 'Daftar project' }).getByRole('link')
  const firstCover = covers.first()
  await expect(firstCover).toHaveAttribute('href', /\/id\/projects\/.+/)
  // nama project (demo N5): layar sentuh menampilkan nama di bawah sampul, layar dengan kursor
  // menampilkannya di atas sampul saat disorot
  const caption = page.locator('.home-marquee-caption').first()
  if (isMobile) await expect(caption).toBeVisible()
  else await expect(caption).toBeHidden()
  await expect(firstCover).toHaveAccessibleName(/\S/)
  const track = page.locator('.home-marquee-track')
  if (!isMobile) {
    // pita terus bergerak sehingga tidak pernah "stabil" untuk hover(); kursor diarahkan langsung
    const box = (await page.locator('.home-marquee').boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await expect(track).toHaveCSS('animation-play-state', 'running')
  }
  // dihapus atas permintaan pemilik: Perjalanan terbaru, ajakan + newsletter (2026-10-08), Dalam
  // angka dan Dari komunitas ke software (2026-10-16)
  for (const name of [
    'Perjalanan terbaru',
    'Ada yang ingin dibangun?',
    'Dalam angka',
    'Dari komunitas ke software',
  ]) {
    await expect(page.getByRole('heading', { name })).toHaveCount(0)
  }
  // semua nomor bagian ("02 —" dst.) dihapus (revisi pemilik 2026-10-16)
  await expect(page.locator('main h2 > span[aria-hidden="true"]')).toHaveCount(0)
  // terakhir: klik sampul membuka detail project. Diletakkan di akhir agar tidak perlu kembali ke
  // beranda dengan goto (Firefox CI kehilangan halaman pada navigasi ulang, CI 245dde1)
  const href = await firstCover.getAttribute('href')
  // klik lewat event: sampul terus bergerak, klik berdasarkan koordinat bisa mengenai sampul sebelahnya
  await firstCover.dispatchEvent('click')
  await expect(page).toHaveURL(new RegExp(`${href}$`))
})

test('menu utama berpindah halaman dan menandai halaman aktif', async ({ page, isMobile }) => {
  await page.goto('/id')
  // desktop: kapsul atas berisi teks; HP: kapsul ikon di bawah layar (label untuk pembaca layar)
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' })
  await expect(nav).toHaveCount(1)
  if (isMobile) await expect(nav).toHaveCSS('position', 'fixed')
  await expect(nav.getByRole('link', { name: 'Beranda' })).toHaveAttribute('aria-current', 'page')
  await nav.getByRole('link', { name: 'Pengalaman' }).click()
  await expect(page).toHaveURL(/\/id\/experience$/)
  await expect(nav.getByRole('link', { name: 'Pengalaman' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(nav.getByRole('link', { name: 'Beranda' })).not.toHaveAttribute('aria-current')
})

test.describe('globe skill', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })
  test('logo menampilkan rincian, kategori meredupkan yang lain, bisa dengan keyboard', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/id')
    const globe = page.getByRole('group', { name: 'Globe skill' })
    // globe di tengah layar dulu: bila Playwright harus scroll sebelum klik, scroll itu (> 48 px)
    // melepas pilihan sehingga klik "tekan ulang" malah memilih lagi (viewport Safari lebih pendek)
    await globe.evaluate((el) => el.scrollIntoView({ block: 'center' }))
    // logo yang bisa ditekan (sisi depan, tidak inert); inert dihitung setelah hydration
    const items = globe.locator('.globe-item')
    await expect(globe.locator('.globe-item:not([inert])').first()).toBeVisible()
    const index = await items.evaluateAll((els) => els.findIndex((el) => !el.hasAttribute('inert')))
    expect(index).toBeGreaterThanOrEqual(0)
    const first = items.nth(index)
    const firstName = (await first.locator('.globe-name').textContent()) ?? ''
    await first.click()
    await expect(first).toHaveAttribute('aria-pressed', 'true')
    const panel = page.locator(`[id="${await first.getAttribute('aria-controls')}"]`)
    await expect(panel).toContainText(firstName)
    // tekan ulang logo, Esc, atau tekan di luar logo: pilihan lepas (bola berputar lagi)
    await first.click()
    await expect(first).toHaveAttribute('aria-pressed', 'false')
    await expect(panel).toBeEmpty()
    await first.click()
    await page.keyboard.press('Escape')
    await expect(first).toHaveAttribute('aria-pressed', 'false')
    await first.click()
    await page.getByRole('heading', { name: 'Keahlian Teknis' }).click()
    await expect(first).toHaveAttribute('aria-pressed', 'false')
    await first.click()
    await expect(first).toHaveAttribute('aria-pressed', 'true')
    // panah ke logo berikutnya, juga bila sedang di sisi belakang (diputar ke depan dulu)
    await first.press('ArrowRight')
    const next = items.nth((index + 1) % (await items.count()))
    const nextName = (await next.locator('.globe-name').textContent()) ?? ''
    await expect(next).toBeFocused()
    await expect(next).toHaveAttribute('aria-pressed', 'true')
    await expect(panel).toContainText(nextName)
    await expect(page.getByRole('list', { name: 'Daftar skill' })).toContainText('TypeScript')
    // kategori lewat menu: logo kategori lain diredupkan, Esc menutup menu
    const toggle = page.getByRole('button', { name: /^Kategori/ })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const category = page.getByRole('group', { name: 'Kategori skill' }).getByRole('button', {
      name: /^Frontend/,
    })
    await category.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toContainText('Frontend')
    await toggle.click()
    await expect(category).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toBeFocused()
    await expect(page.locator('.globe-item', { hasText: 'TypeScript' })).toHaveAttribute(
      'data-dim',
      '',
    )
    const react = page.locator('.globe-item', { hasText: 'React' })
    await expect(react).not.toHaveAttribute('data-dim')
    await expect(react).toHaveAttribute('data-hl', '')
    // menekan di luar menu tidak mengubah filter; hanya Semua yang mengembalikannya
    await page.getByRole('heading', { name: 'Keahlian Teknis' }).click()
    await expect(toggle).toContainText('Frontend')
    await toggle.click()
    await page
      .getByRole('group', { name: 'Kategori skill' })
      .getByRole('button', { name: /^Semua/ })
      .click()
    await expect(toggle).toContainText('Semua')
    await expect(page.locator('.globe-item[data-dim]')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})

test('halaman skill lama diarahkan ke bagian skill di beranda', async ({ page }) => {
  await page.goto('/en/skills')
  await expect(page).toHaveURL(/\/en#skills$/)
  await expect(page.getByRole('heading', { name: 'Technical Skills' })).toBeVisible()
})

test('halaman pengalaman: timeline tanpa filter dan tanpa pendidikan', async ({ page }) => {
  await page.goto('/id/experience')
  // revisi pemilik 2026-10-03: tanpa filter, tanpa kalimat pengantar, pendidikan tidak tampil
  await expect(page.locator('ol.xp-tl > li[data-type]').first()).toBeVisible()
  expect(await page.locator('ol.xp-tl > li[data-type]').count()).toBeGreaterThan(1)
  await expect(page.locator('li[data-type="EDUCATION"]')).toHaveCount(0)
  await expect(page.locator('fieldset')).toHaveCount(0)
  // format seperti LinkedIn: instansi · jenis pekerjaan, lalu periode · durasi
  await expect(page.getByText('PT PGAS Solution · Magang')).toBeVisible()
  await expect(page.getByText(/^Jul 2026 - Sekarang · \d+ (Bulan|Tahun)/)).toBeVisible()
})

test('halaman project tanpa project terbit menampilkan keadaan kosong atau kartu', async ({
  page,
}) => {
  const response = await page.goto('/en/projects')
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projects')
})

test('detail project yang tidak ada mengembalikan 404', async ({ page }) => {
  const response = await page.goto('/id/projects/tidak-ada-sama-sekali')
  expect(response?.status()).toBe(404)
  // halaman 404 "hantu" di dalam situs: judul, satu kalimat, dan satu tombol ke beranda
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Boo! Halamannya hilang.')
  await expect(
    page.getByText('Sepertinya halaman ini hantu: dicari ada, dibuka tidak ada.'),
  ).toBeVisible()
  await expect(
    page.locator('main').getByRole('link', { name: 'Beranda', exact: true }),
  ).toHaveAttribute('href', '/id')
})

test.describe('form kontak', () => {
  test.use({ extraHTTPHeaders: { 'x-forwarded-for': uniqueIp() } })

  test('validasi di server tampil per kolom dan isian tidak hilang', async ({ page }) => {
    await page.goto('/id/contact')
    await page.getByLabel('Nama').fill('Tamu E2E')
    await page.getByLabel('Email').fill('bukan-email')
    await page.getByLabel('Pesan').fill('pendek')
    await page.getByRole('button', { name: 'Kirim pesan' }).click()
    await expect(page.getByText('Format email tidak valid')).toBeVisible()
    await expect(page.getByText('Pesan minimal 10 karakter')).toBeVisible()
    await expect(page.getByRole('alert').filter({ hasText: 'Periksa kembali' })).toBeFocused()
    await expect(page.getByLabel('Nama')).toHaveValue('Tamu E2E')
  })

  test('pesan valid tersimpan dan pengunjung mendapat konfirmasi', async ({ page }, testInfo) => {
    await page.goto('/en/contact')
    await page.getByLabel('Name').fill(`E2E visitor ${testInfo.project.name}`)
    await page.getByLabel('Email').fill('visitor@example.com')
    await page.getByLabel('Message').fill('Hello, this is an automated end-to-end test message.')
    await page.getByRole('button', { name: 'Send Message' }).click()
    await expect(page.getByRole('status')).toContainText('Message sent')
  })
})

test('form kontak berfungsi tanpa JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    extraHTTPHeaders: { 'x-forwarded-for': uniqueIp() },
  })
  const page = await context.newPage()
  await page.goto(`${baseURL}/id/contact`)
  await page.getByLabel('Nama').fill('Tanpa JS')
  await page.getByLabel('Email').fill('nojs@example.com')
  await page.getByLabel('Pesan').fill('Pesan ini dikirim tanpa JavaScript.')
  await page.getByRole('button', { name: 'Kirim pesan' }).click()
  await expect(page.getByText('Pesan terkirim')).toBeVisible()
  await context.close()
})

test('rate limit kontak: pesan ke-6 dalam satu jam ditolak', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ extraHTTPHeaders: { 'x-forwarded-for': uniqueIp() } })
  const page = await context.newPage()
  for (let i = 0; i < 6; i++) {
    await page.goto(`${baseURL}/id/contact`)
    await page.getByLabel('Nama').fill(`Rate ${i}`)
    await page.getByLabel('Email').fill('rate@example.com')
    await page.getByLabel('Pesan').fill('Pesan uji rate limit nomor ' + i)
    await page.getByRole('button', { name: 'Kirim pesan' }).click()
    if (i < 5) await expect(page.getByText('Pesan terkirim')).toBeVisible()
  }
  await expect(page.getByText('Terlalu banyak pesan dari jaringan ini')).toBeVisible()
  await context.close()
})

test('tautan konfirmasi newsletter tidak langsung mengubah data dan token palsu ditolak', async ({
  page,
}) => {
  await page.goto('/id/newsletter/confirm?token=token-palsu-yang-cukup-panjang-12345')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Konfirmasi langganan' }).click()
  await expect(page.getByText('Tautan tidak berlaku')).toBeVisible()
})

test.describe('route handler publik', () => {
  test('API v1 read-only dengan kontrak { data, meta } dan CORS', async ({ request }) => {
    for (const path of [
      '/api/v1/projects',
      '/api/v1/skills?locale=en',
      '/api/v1/profile?locale=id',
    ]) {
      const res = await request.get(path)
      expect(res.status(), path).toBe(200)
      expect(res.headers()['access-control-allow-origin']).toBe('*')
      expect(res.headers()['cache-control']).toContain('s-maxage')
      const body = await res.json()
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('meta')
    }
    const profile = await (await request.get('/api/v1/profile')).json()
    expect(profile.data).not.toHaveProperty('email')
    expect(profile.data).not.toHaveProperty('whatsapp')
    const missing = await request.get('/api/v1/projects/tidak-ada')
    expect(missing.status()).toBe(404)
    expect(await missing.json()).toEqual({
      error: { code: 'NOT_FOUND', message: expect.any(String) },
    })
    const write = await request.post('/api/v1/projects', { data: {} })
    expect(write.status()).toBe(405)
  })

  test('beacon kunjungan menerima permintaan situs sendiri dan menolak isi aneh', async ({
    request,
  }) => {
    const ok = await request.post('/api/track', {
      headers: { 'sec-fetch-site': 'same-origin', 'user-agent': 'Mozilla/5.0 Chrome/140' },
      data: { path: '/projects', locale: 'id', referrer: null },
    })
    expect(ok.status()).toBe(204)
    const bad = await request.post('/api/track', {
      headers: { 'sec-fetch-site': 'same-origin', 'user-agent': 'Mozilla/5.0 Chrome/140' },
      data: { path: '<script>alert(1)</script>', locale: 'id' },
    })
    expect(bad.status()).toBe(400)
  })

  test('cron harian menolak tanpa CRON_SECRET', async ({ request }) => {
    const res = await request.get('/api/cron/daily')
    expect(res.status()).toBe(401)
  })

  test('unduh CV tanpa berkas diarahkan ke halaman Tentang', async ({ request }) => {
    const res = await request.get('/api/cv?locale=en', { maxRedirects: 0 })
    expect([302, 303]).toContain(res.status())
  })
})

test('halaman Tentang menampilkan judul, nama, peran, bio, dan pendidikan', async ({ page }) => {
  await page.goto('/id/about')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tentang Saya')
  await expect(page.getByRole('heading', { name: 'Muhammad Mirza Wirya', level: 2 })).toBeVisible()
  await expect(
    page.getByRole('main').getByText('Fullstack Developer | Community Manager'),
  ).toBeVisible()
  await expect(page.getByText(/Universitas Bina Nusantara dengan peminatan/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pendidikan', level: 2 })).toBeVisible()
  // nama instansi dan jurusan mengikuti bahasa (organization / organization_en)
  await expect(
    page.getByRole('heading', { name: 'Universitas Bina Nusantara', level: 3 }),
  ).toBeVisible()
  await expect(page.getByText('S1 Ilmu Komputer – Kecerdasan Buatan')).toBeVisible()
  await expect(page.getByText('IPK kumulatif: 3,41/4,0')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'SMAS Budi Luhur', level: 3 })).toBeVisible()
  await expect(page.getByText('Nilai: 88,3')).toBeVisible()
  await expect(page.getByText('2021 – 2024')).toBeVisible()
  await expect(page.getByText('2024 – Sekarang')).toBeVisible()
  // label semester dihapus (revisi pemilik 2026-10-08)
  await expect(page.getByText(/^Semester \d+$/)).toHaveCount(0)
  // tombol CV dihapus dari halaman ini (CV tetap ada di footer bila diisi)
  await expect(page.getByRole('main').getByRole('link', { name: /Resume CV/ })).toHaveCount(0)
  await page.goto('/en/about')
  await expect(
    page.getByRole('heading', { name: 'Budi Luhur Senior High School', level: 3 }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Bina Nusantara University', level: 3 }),
  ).toBeVisible()
  await expect(page.getByText('Cumulative GPA: 3.41/4.0')).toBeVisible()
  await expect(page.getByText('Grade: 88.3')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('About Me')
  await expect(page.getByRole('heading', { name: 'Education', level: 2 })).toBeVisible()
})

test('header keamanan ada dan tidak ada pelanggaran CSP di halaman publik', async ({
  page,
  request,
}) => {
  const res = await request.get('/id')
  const h = res.headers()
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(h['x-content-type-options']).toBe('nosniff')
  expect(h['strict-transport-security']).toContain('max-age=')
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')

  const violations: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy|CSP/i.test(m.text()))
      violations.push(m.text())
  })
  for (const path of ['/id', '/en/about', '/id/experience', '/en/projects', '/id/contact']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle').catch(() => undefined)
  }
  expect(violations).toEqual([])
})

test('sitemap, robots, dan gambar Open Graph tersedia', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  const xml = await sitemap.text()
  expect(xml).toContain('/id/experience')
  expect(xml).toContain('hreflang="en"')
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toContain('Disallow: /admin')
  const og = await request.get('/en/opengraph-image')
  expect(og.status()).toBe(200)
  expect(og.headers()['content-type']).toContain('image/png')
})

test('beranda memuat data terstruktur Person tanpa email atau WhatsApp', async ({ page }) => {
  await page.goto('/id')
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent()
  const data = JSON.parse(raw ?? '{}')
  expect(data['@type']).toBe('Person')
  expect(JSON.stringify(data)).not.toMatch(/whatsapp|mailto|@gmail/i)
})

test('tema awal gelap untuk pengunjung baru', async ({ page }) => {
  await page.goto('/id')
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('halaman privasi memuat kredit logo', async ({ page }) => {
  // dipindah dari beranda (revisi pemilik 2026-10-16) agar lisensi CC BY logo Git tetap dipenuhi
  await page.goto('/id/privacy')
  await expect(page.getByRole('heading', { name: 'Kredit' })).toBeVisible()
  await expect(page.getByText(/Simple Icons.*Jason Long, CC BY 3\.0/)).toBeVisible()
})
