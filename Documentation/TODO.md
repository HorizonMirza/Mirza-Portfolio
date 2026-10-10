# TODO — Rencana Pengerjaan

Status: **draf v1**. Urutan = prioritas. Tanda `[?]` = bergantung pada keputusan terbuka (lihat `PRD.md` bagian 11). Estimasi memakai patokan Anda: 1 hari per milestone, di luar waktu review.

## Menunggu dari Pemilik

- [x] **CV** (diterima 2026-09-30, ringkasan di `Documentation/CONTENT.md`)
- [ ] Jawaban 10 pertanyaan konten (`Documentation/CONTENT.md` bagian 10) dan pertanyaan referensi (`Documentation/REFERENCES.md` bagian 6)
- [ ] Persetujuan konsep "Horizon" (`Documentation/DESIGN.md` bagian 1)
- [ ] Foto profil, logo/inisial
- [ ] **Data GAAS** (project awal, lihat `Documentation/CONTENT.md` bagian 8). Project lain ditambahkan Mirza lewat admin setelah rilis
- [ ] Teks halaman error dan 404
- [ ] Tautan sosial (LinkedIn, GitHub, email, WhatsApp, Instagram)
- [ ] Jawaban untuk 15 keputusan terbuka (`Documentation/00-discovery.md` bagian 6, ringkasan di `PRD.md` bagian 11)
- [ ] Akun layanan: Neon, Vercel, Cloudinary, Resend, Sentry, uptime monitor (Upstash tidak diperlukan lagi)
- [ ] Domain `.site` (dibimbing pada M5)

## M0 — Pra-Perencanaan dan Dokumen

- [x] Discovery dan keputusan awal (`Documentation/00-discovery.md`)
- [x] PRD, DESIGN, ARCHITECTURE, WORKFLOW, TODO, CLAUDE.md, SKILL.md
- [ ] Review dokumen oleh Mirza, jawab keputusan terbuka
- [ ] Pelajari referensi tambahan (menunggu akses `mnizwa.com` atau screenshot)

## M1 — Setup (≈ 1 hari) — selesai 2026-09-30, kecuali Vercel

- [x] Inisialisasi Next.js 16 (App Router, Turbopack, TypeScript strict), pnpm, `.editorconfig`, `.gitignore`, `.nvmrc`
- [x] Tailwind 4, token desain dari `DESIGN.md` (terang/gelap), font self-host via `next/font/local` (Plus Jakarta Sans, JetBrains Mono)
- [x] Primitif gaya shadcn/ui: Button, Input, Textarea, Label, `components.json`
- [ ] Dialog, Sheet, Toast, DropdownMenu, Tabs → dipindah ke M2 (ditambah saat pertama dipakai, agar tidak ada dependency Radix yang menganggur)
- [x] `next-intl` dengan rute `/id` dan `/en`, deteksi bahasa browser, berkas `Frontend/messages/`, tipe kunci terjemahan ketat
- [x] `next-themes` (terang/gelap/sistem), tersimpan di browser
- [x] ESLint, Prettier, Husky + lint-staged, `tsc --noEmit`, gitleaks (di CI)
- [x] Vitest + Testing Library, Playwright (+ axe) di Chromium desktop dan emulasi HP
- [x] Prisma 7 + PostgreSQL: skema sesuai `ARCHITECTURE.md` bagian 5, migrasi awal, seed idempoten dari CV (GAAS berstatus DRAFT)
- [x] `Frontend/src/lib/env.ts` (validasi Zod), `Frontend/.env.example`
- [x] GitHub Actions `ci.yml` (lint, format, typecheck, unit, audit keamanan, migrasi + cek drift, seed, build, E2E, gitleaks), templat PR. Dependabot update otomatis dimatikan (lihat `WORKFLOW.md` bagian 10a)
- [x] Konfigurasi hosting di repo: `Frontend/vercel.json` (region `sin1`), migrasi hanya di production, Ignored Build Step
- [ ] Koneksi repo ke Vercel dan database Neon Singapura (butuh akun pemilik, langkah di README bagian "Deploy ke Vercel")
- [x] `/api/health`
- [x] README (cara menjalankan lokal dan deploy)
- [x] 404 global dua bahasa (`app/global-not-found.tsx`) dan 404 per bahasa untuk `notFound()`

**Selesai bila:** situs kosong tampil di preview Vercel, CI hijau, migrasi dan seed berjalan.
Status: migrasi, seed, build, 13 tes unit, dan 32 tes E2E lulus di sandbox. CI dan preview Vercel belum terverifikasi (CI berjalan setelah push, Vercel menunggu akun).

## M2 — Auth dan Super Admin (≈ 1 hari)

- [x] Better Auth (email + password, `disableSignUp`, adapter Prisma, sesi di database, hash bawaan), halaman `/admin/login`
- [x] Migrasi skema: tabel Better Auth (`User`, `Session`, `Account`, `Verification`) + `role`, hapus `User.passwordHash`
- [x] Middleware/proxy melindungi `/admin/*` dan pemeriksaan ulang di setiap action
- [x] Rate limit login bawaan Better Auth (penyimpanan database)
- [x] Tabel `RateLimit` + helper `lib/rate-limit.ts` untuk form publik
- [x] Seed akun admin dari environment, skrip `admin:reset-password`
- [x] Komponen UI: Dialog, Sheet, Toast, DropdownMenu, Tabs (dari M1). DropdownMenu dan `@radix-ui/react-dropdown-menu` dihapus 2026-10-09 karena tidak pernah dipakai
- [x] Layout admin (sidebar, responsif) dan dashboard awal. `app/admin/layout.tsx` menjadi root layout kedua (merender `<html>` sendiri)
- [x] Modul CRUD (pola di `SKILL.md`): Project, Skill + kategori, Experience, Profile/hero
- [x] Unggah bertanda tangan ke Cloudinary (gambar, foto, CV) dengan alt text dua bahasa. Diuji dengan respons Cloudinary tiruan; uji dengan akun asli menunggu kunci dari pemilik
- [x] Form dua bahasa (tab ID/EN) dengan React Hook Form + Zod, status draf/terbit, urutan lewat tombol naik/turun (bukan seret, agar bisa dengan keyboard). Pengalaman diurutkan otomatis dari tanggal mulai
- [x] Tabel admin dengan TanStack Table (cari, urut, paginasi, jadi kartu di HP)
- [x] Editor studi kasus: textarea Markdown + pratinjau (`react-markdown` + `rehype-sanitize`)
- [x] Grafik kunjungan di dashboard dengan Recharts (shadcn charts), hanya dimuat di `/admin`
- [x] Impor dari GitHub (`fetch` ke REST API, cache 1 jam) → mengisi form project. Diuji dengan `fetch` tiruan (API GitHub dibatasi di sandbox)
- [x] Kotak masuk pesan (baru/dibaca/arsip)
- [x] Log audit (tulis pada setiap mutasi) dan halaman peninjau
- [x] Newsletter di admin: daftar pelanggan dan hapus
- [ ] Kirim broadcast newsletter `[?]` (menunggu keputusan PRD bagian 11, butuh Resend)
- [x] Halaman akun: ganti password (rate limit, sesi lain dicabut)
- [ ] Notifikasi email saat ada login baru (butuh Resend, dikerjakan bersama form kontak di M4)
- [x] Tes: unit skema dan otorisasi, E2E login dan CRUD project

**Selesai bila:** Mirza bisa login dan mengelola semua konten, semua aksi tercatat di audit.

## M3 — Halaman Publik (≈ 1 hari)

Status: selesai 2026-09-30. 146 tes unit dan 88 tes E2E (Chromium + emulasi HP, axe di semua halaman publik dan admin, terang/gelap, ID/EN) lulus di sandbox.

- [x] Navbar (padat saat digulir, tanpa JS), menu HP (`popover` bawaan browser), footer, toggle bahasa dan tema, tautan lewati konten
- [x] Home: hero + pelat status (status, lokasi, kampus, posisi sekarang dari admin), project pilihan, perjalanan terbaru, skill, ajakan kontak, newsletter. Latar "Horizon" versi CSS statis (canvas di M4)
- [x] About: bio Markdown, foto, kontak, CV
- [x] Experience & Education: satu halaman, timeline + filter tanpa JS (keputusan 2026-09-30)
- [x] Skills: dikelompokkan, tanpa persen, tautan ke project yang memakai skill
- [x] Projects: daftar, kartu lebar untuk 1 project, filter kategori/teknologi baru muncul bila ≥ 3 project atau ≥ 2 kategori, keadaan kosong, halaman detail (studi kasus Markdown, galeri, teknologi, metadata GitHub, sebelumnya/berikutnya)
- [x] Kontak: Server Action `submitContact` + `useActionState` (jalan tanpa JS) + honeypot + rate limit 5/jam + notifikasi Resend opsional (keputusan 2026-09-30)
- [x] Unduh CV: `/api/cv` dengan penghitung unduhan
- [x] Newsletter publik: double opt-in, halaman konfirmasi dan berhenti (tombol POST), email React Email ID/EN (keputusan 2026-09-30). Aktif setelah `RESEND_API_KEY` + `EMAIL_FROM` diisi
- [x] Kebijakan Privasi, 404, error
- [x] Revalidate berbasis tag dari aksi admin (perubahan langsung tampil, diuji E2E)
- [x] Statistik pengunjung: `/api/track` tanpa cookie + Vercel Cron harian (ringkasan `PageViewDaily`, hapus data > 90 hari)
- [x] API publik `/api/v1/*` (keputusan 2026-09-30)
- [x] Seluruh konten dua bahasa, isi awal dari CV. Seed project hanya GAAS (masih **draf** sampai izin publikasi dikonfirmasi)
- [ ] Uji email sungguhan (butuh domain terverifikasi di Resend) dan unggah Cloudinary sungguhan (butuh kunci)

**Selesai bila:** semua halaman publik tampil dari data database dalam ID dan EN, terang dan gelap.

## M4 — Polish (≈ 1 hari)

Status: selesai 2026-09-30 kecuali uji manual pembaca layar di perangkat nyata. Keputusan pemilik: desain tetap, hero canvas, WhatsApp, tema awal gelap.

- [x] Hero "Horizon" canvas 2D (tingkat perangkat, idle init, berhenti saat tidak terlihat, statis pada reduced-motion/hemat data) di atas latar CSS statis. Pelat status sudah ada sejak M3
- [x] Reveal sekali jalan (IntersectionObserver, < 1 KB) dan transisi halaman (`<ViewTransition>`), header padat saat digulir (CSS). Menu HP memakai `popover` bawaan, tanpa Motion. Semua menghormati `prefers-reduced-motion`
- [x] Tombol WhatsApp melayang menggantikan live chat (keputusan 2026-09-30)
- [x] Tema awal gelap (keputusan 2026-09-30)
- [x] SEO: metadata + canonical + hreflang per halaman, Open Graph dinamis (umum dan per project), sitemap, robots (preview tidak diindeks), JSON-LD `Person`
- [x] Aksesibilitas: axe bersih di semua halaman publik dan admin (terang/gelap, ID/EN, desktop/HP), Lighthouse Accessibility 100
- [ ] Uji manual keyboard dan pembaca layar (VoiceOver/TalkBack) di perangkat nyata, dilakukan pemilik setelah deploy
- [x] Performa: subset font latin saja (−22 KB) dan font mono tidak di-preload. Lighthouse mobile (lokal, throttling simulasi): Performance 94–99, Accessibility 100, Best Practices 100, SEO 100 di 5 halaman. LCP terukur 0,2 s; LCP simulasi 2,1–3,1 s karena JS kerangka Next/React (±190 KB). Web Vitals lapangan dicek dengan Speed Insights setelah deploy
- [x] Header keamanan dan CSP (tanpa nonce untuk publik, nonce untuk admin), notifikasi email login baru
- [x] Tes E2E Chromium + emulasi HP lokal (96 lulus); Firefox, WebKit, dan iPhone di CI (`E2E_ALL_BROWSERS=1`) hijau sejak commit 452c1ce
- [x] Review kode dan keamanan mandiri (temuan diperbaiki: notifikasi login di serverless memakai `after()`, CSP `upgrade-insecure-requests` hanya di Vercel)

**Selesai bila:** Lighthouse mobile ≥ 90 di semua kategori, axe bersih, semua tes lulus.

## M5 — Deploy (≈ 1 hari)

- [x] Domain `mmirza.site` (Hostinger): A `@` dan CNAME `www` ke Vercel, `www` dialihkan 308 ke `mmirza.site`, HTTPS aktif, `NEXT_PUBLIC_SITE_URL` dan `BETTER_AUTH_URL` diisi (2026-10-01)
- [ ] Verifikasi domain di Resend (SPF/DKIM)
- [x] Variabel lingkungan production, Neon Singapura, migrasi production, seed admin (deploy pertama 2026-10-01)
- [x] Vercel Cron (`Frontend/vercel.json`): ringkas `PageView` ke `PageViewDaily`, hapus `PageView` > 90 hari dan `RateLimit` lama, ganti garam hash harian, dilindungi `CRON_SECRET` (dibuat di M3)
- [x] Kode: laporan error server ke Sentry tanpa SDK (`src/instrumentation.ts`), Vercel Analytics + Speed Insights (hanya di Vercel, tanpa query string)
- [ ] Pemilik: aktifkan Analytics dan Speed Insights di Vercel, buat project Sentry lalu isi `SENTRY_DSN`, UptimeRobot (monitor `/api/health` tiap 5 menit, notifikasi email + Telegram)
- [ ] GitHub ruleset untuk `main`: CI wajib hijau, blokir force push dan hapus branch, admin di bypass list
- [x] Backup harian terenkripsi (`backup.yml`) dengan uji pemulihan otomatis di setiap run (diuji lokal: dump → gpg → pulih → cek isi)
- [ ] Pemilik: isi secret `BACKUP_DATABASE_URL` dan `BACKUP_PASSPHRASE`, jalankan Backup sekali lewat Actions
- [ ] Uji rollback Vercel
- [ ] Dokumentasi: panduan admin, catatan arsitektur final. README sudah diperbarui 2026-10-11 (tautan situs, tangkapan layar halaman awal, daftar fitur), panduan setup ada di README
- [ ] Daftar periksa rilis (`WORKFLOW.md` bagian 7), uji di HP nyata
- [ ] Kirim situs ke Search Console, cek preview link di WhatsApp dan LinkedIn

**Selesai bila:** situs live di domain `.site`, monitoring aktif, backup teruji.

## Backlog (v2 dan sesudah)

- [ ] Blog dan artikel
- [ ] Sertifikat, testimoni
- [ ] Pratinjau draf sebelum terbit (A10 di PRD)
- [ ] Terjemahan otomatis sebagai bantuan (bukan pengganti)
- [ ] Studi kasus dengan komponen interaktif (MDX)
- [ ] Pencarian dalam situs
- [ ] Asisten AI "Tanya tentang Mirza" (menjawab dari data CV/project, batas pemakaian harian). Usulan pengganti live chat, berbiaya per pemakaian, **belum diputuskan**

## Log Perubahan Rencana

| Tanggal | Perubahan |
|---|---|
| 2026-09-30 | Dokumen awal dibuat |
| 2026-09-30 | M1 selesai (kecuali Vercel/Neon). Komponen Dialog dan sejenisnya dipindah ke M2 |
| 2026-09-30 | Repo dirapikan: `Frontend/`, `Backend/`, `Database/`, `Documentation/`, akar hanya `.md`. Commit memakai awalan `[CLAUDIA]` |
| 2026-09-30 | Pindah ke repo baru `HorizonMirza/Mirza-Portfolio`, branch `main`, satu commit awal atas nama Horizon Mirza |
| 2026-09-30 | Stack dikunci: Opsi A (Next.js full-stack). Stack GAAS (ASP.NET Core) tidak dipakai, lihat ARCHITECTURE bagian 12 |
| 2026-09-30 | Folder diganti menjadi `Frontend/`, `Backend/`, `Database/`, `Documentation/`. Skill dipindah ke `.agents/skill/SKILL.md` |
| 2026-09-30 | Dasar dinaikkan: Node 22 → 24 LTS, TypeScript 5.9 → 6.0, ESLint 9 → 10 (+ `@eslint/compat`), @types/node 20 → 24. pnpm tetap 10 |
| 2026-09-30 | Frontend: animasi utama pindah ke CSS bawaan (Motion seperlunya), form publik ke Server Actions tanpa library form, ditambah rencana TanStack Table, Recharts, editor Markdown untuk M2 |
| 2026-09-30 | Backend: Auth.js → Better Auth (hash bawaan), Upstash → tabel `RateLimit` di Postgres, Octokit → `fetch`, tambah React Email dan Vercel Cron |
| 2026-09-30 | Database: PostgreSQL 17, UUID v7, `timestamptz`, tabel `PageViewDaily`, migrasi awal dibuat ulang, Neon via integrasi Vercel |
| 2026-09-30 | Dependabot update otomatis dihapus (alerts tetap). Update dependency manual bulanan. GitHub Actions dinaikkan, `pnpm audit` masuk CI, `overrides` untuk mysql2 dan deepmerge-ts (celah di Prisma CLI) |
| 2026-09-30 | Hosting: Vercel Hobby + Neon Free di Singapura (`sin1`), `vercel.json`, migrasi hanya di production, Ignored Build Step, ruleset `main`, UptimeRobot + Telegram |
| 2026-09-30 | M2 selesai: Better Auth, panel admin (dashboard, profil, project, skill, pengalaman, pesan, pelanggan, audit, akun), unggah Cloudinary, 120 tes unit, 59 tes E2E. Broadcast dan notifikasi login ditunda. UI admin hanya bahasa Indonesia |
| 2026-09-30 | Alur kerja: semua langsung di `main`, tanpa branch lain dan tanpa PR (permintaan pemilik). `feat/m2-admin` disatukan ke `main` (fast-forward), templat PR dihapus |
| 2026-09-30 | M3 selesai: halaman publik dari database, kontak, newsletter double opt-in, CV, statistik tanpa cookie + cron, API v1. Keputusan PRD 11 no. 1, 4 (opt-in), 5, 10 dikonfirmasi. Ditemukan dan diperbaiki: `dynamicParams = false` di layout locale membuat halaman publik 404 setelah revalidasi |
| 2026-09-30 | M4 selesai: hero canvas, reveal, transisi, WhatsApp, tema gelap, SEO, CSP + header keamanan, notifikasi login, tes lintas browser di CI. PRD 11 no. 3 dan 14 dikonfirmasi |
| 2026-10-01 | Font diganti: Oswald (judul) + Inter (isi) + JetBrains Mono (label), pilihan pemilik dari demo |
