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
- [x] GitHub Actions `ci.yml` (lint, format, typecheck, unit, migrasi + cek drift, seed, build, E2E, gitleaks), `dependabot.yml`, templat PR
- [ ] Koneksi repo ke Vercel dan database Neon (butuh akun pemilik, langkah di README bagian "Deploy ke Vercel")
- [x] `/api/health`
- [x] README (cara menjalankan lokal dan deploy)
- [x] 404 global dua bahasa (`app/global-not-found.tsx`) dan 404 per bahasa untuk `notFound()`

**Selesai bila:** situs kosong tampil di preview Vercel, CI hijau, migrasi dan seed berjalan.
Status: migrasi, seed, build, 13 tes unit, dan 32 tes E2E lulus di sandbox. CI dan preview Vercel belum terverifikasi (CI berjalan setelah push, Vercel menunggu akun).

## M2 — Auth dan Super Admin (≈ 1 hari)

- [ ] Better Auth (email + password, `disableSignUp`, adapter Prisma, sesi di database, hash bawaan), halaman `/admin/login`
- [ ] Migrasi skema: tabel Better Auth (`User`, `Session`, `Account`, `Verification`) + `role`, hapus `User.passwordHash`
- [ ] Middleware/proxy melindungi `/admin/*` dan pemeriksaan ulang di setiap action
- [ ] Rate limit login bawaan Better Auth (penyimpanan database)
- [ ] Tabel `RateLimit` + helper `lib/rate-limit.ts` untuk form publik
- [ ] Seed akun admin dari environment, skrip `admin:reset-password`
- [ ] Komponen UI: Dialog, Sheet, Toast, DropdownMenu, Tabs (dari M1)
- [ ] Layout admin (sidebar, responsif) dan dashboard awal. `app/admin/layout.tsx` menjadi root layout kedua (merender `<html>` sendiri)
- [ ] Modul CRUD (pola di `SKILL.md`): Project, Skill + kategori, Experience, Profile/hero
- [ ] Unggah bertanda tangan ke Cloudinary (gambar, foto, CV) dengan alt text dua bahasa
- [ ] Form dua bahasa (tab ID/EN) dengan React Hook Form + Zod, status draf/terbit, urutan (geser)
- [ ] Tabel admin dengan TanStack Table (cari, urut, paginasi, jadi kartu di HP)
- [ ] Editor studi kasus: textarea Markdown + pratinjau (`react-markdown` + `rehype-sanitize`)
- [ ] Grafik kunjungan di dashboard dengan Recharts (shadcn charts), hanya dimuat di `/admin`
- [ ] Impor dari GitHub (`fetch` ke REST API, cache 1 jam) → mengisi form project
- [ ] Kotak masuk pesan (baru/dibaca/arsip)
- [ ] Log audit (tulis pada setiap mutasi) dan halaman peninjau
- [ ] Newsletter di admin: daftar pelanggan, kirim broadcast `[?]`
- [ ] Tes: unit skema dan otorisasi, E2E login dan CRUD project

**Selesai bila:** Mirza bisa login dan mengelola semua konten, semua aksi tercatat di audit.

## M3 — Halaman Publik (≈ 1 hari)

- [ ] Navbar, footer, toggle bahasa dan tema, tautan lewati konten
- [ ] Home (hero + bagian ringkas)
- [ ] About
- [ ] Experience & Education (timeline + filter) `[?]`
- [ ] Skills
- [ ] Projects: daftar, filter teknologi, halaman detail, metadata GitHub. Harus tampil baik dengan 1 project (GAAS): kartu unggulan lebar, filter tersembunyi sampai cukup project, keadaan kosong
- [ ] Kontak: Server Action `submitContact` + `useActionState` (tanpa library form) + email Resend (template React Email ID/EN) + honeypot dan rate limit tabel `RateLimit` `[?]`
- [ ] Unduh CV: `/api/cv` dengan penghitung unduhan
- [ ] Newsletter publik: Server Action `subscribeNewsletter`, route konfirmasi dan unsubscribe `[?]`
- [ ] Kebijakan Privasi, 404, error
- [ ] Revalidate berbasis tag dari aksi admin
- [ ] Statistik pengunjung: `/api/track`, ringkasan di dashboard admin
- [ ] API publik `/api/v1/*` `[?]`
- [ ] Seluruh konten dua bahasa, isi awal dari CV. Seed project hanya GAAS

**Selesai bila:** semua halaman publik tampil dari data database dalam ID dan EN, terang dan gelap.

## M4 — Polish (≈ 1 hari)

- [ ] Hero "Horizon" (canvas 2D ringan, tingkat perangkat, anggaran performa di `DESIGN.md`) dan pelat status `[?]`
- [ ] Animasi reveal (CSS scroll-driven) dan transisi halaman (View Transitions), tanpa JS. Motion hanya untuk menu HP/modal. Dukung `prefers-reduced-motion`
- [ ] Widget live chat lazy `[?]`
- [ ] SEO: metadata, Open Graph (gambar dinamis), sitemap, robots, `hreflang`, data terstruktur `Person`
- [ ] Aksesibilitas: audit axe, uji keyboard dan pembaca layar
- [ ] Performa: optimasi gambar dan font, cek Lighthouse mobile ≥ 90 dan Web Vitals
- [ ] Header keamanan dan CSP (nonce)
- [ ] Tes E2E alur utama pada Chromium, WebKit, Firefox, dan emulasi HP
- [ ] Review kode dan review keamanan

**Selesai bila:** Lighthouse mobile ≥ 90 di semua kategori, axe bersih, semua tes lulus.

## M5 — Deploy (≈ 1 hari)

- [ ] Beli dan hubungkan domain `.site` (pemandu langkah), DNS, HTTPS
- [ ] Verifikasi domain di Resend (SPF/DKIM)
- [ ] Variabel lingkungan production, migrasi production, seed admin
- [ ] Vercel Cron (`Frontend/vercel.json`): ringkas `PageView` ke `PageViewDaily`, hapus `PageView` > 90 hari dan `RateLimit` lama, ganti garam hash harian, dilindungi `CRON_SECRET`
- [ ] Sentry, uptime monitor, Vercel Analytics + Speed Insights, notifikasi email dan Telegram
- [ ] Backup harian terenkripsi (`backup.yml`) dan uji pemulihan
- [ ] Uji rollback Vercel
- [ ] Dokumentasi: README, panduan setup, panduan admin, catatan arsitektur final
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
