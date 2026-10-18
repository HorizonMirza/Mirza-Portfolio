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
| 2026-10-15 | Audit Home: catatan ketersediaan berisi posisi yang dicari (migrasi `20261015100000`), Project pilihan kembali sebagai pita sampul datar berjalan (pita 3D sempat dipasang lalu diganti karena berat), nomor bagian beranda otomatis, PRD F1/F17/U7 diperbarui dan F19 (pemberitahuan pembuka) ditambah. Masih menunggu: Vercel Web Analytics diaktifkan pemilik (skrip 404). Sisi kanan hero diisi foto potret (demo 1, DESIGN.md bagian 55) |
| 2026-10-16 | Nama tombol CV seragam: "Resume CV" (ID dan EN) di hero, kartu pembuka, dan footer; ikon hero menjadi ikon dokumen (DESIGN.md bagian 56) |
| 2026-10-16 | Revisi beranda: Resume CV di kartu pembuka langsung menutup kartu dan pindah ke Beranda; Dalam angka dan Dari komunitas ke software dihapus (DESIGN.md bagian 57). Pengalaman masuk beranda sebagai akordion (demo E3); About tidak ditambahkan |
| 2026-10-16 | Project di beranda: tanpa nomor, judul di tengah, tanpa "Semua project" dan deretan nama, sampul pita bisa diklik ke detail dan tidak berhenti saat disorot, letak di bawah Pengalaman (DESIGN.md bagian 58) |
| 2026-10-16 | Pengalaman di beranda: tanpa nomor dan tautan "Semua pengalaman", judul di tengah, semua tertutup, tanpa ikon +/× dan garis bawah (DESIGN.md bagian 58) |
| 2026-10-16 | Pengalaman di beranda: logo berbingkai "bayangan lembut" (B5) dan suara blip digital saat baris dibuka dan ditutup (S9) (DESIGN.md bagian 58) |
| 2026-10-16 | Project di beranda: nama project muncul di tengah sampul saat disorot, di layar sentuh di bawah sampul (demo N5, DESIGN.md bagian 58) |
| 2026-10-16 | Pengalaman beranda: animasi buka/tutup di semua browser termasuk HP, detail sejajar judul di HP, huruf sama dengan halaman Pengalaman. Chip teknologi project langsung berwarna di layar sentuh (DESIGN.md bagian 58) |
| 2026-10-16 | Resume CV kartu pembuka hanya membuka Drive (kartu tetap terbuka); semua nomor bagian beranda dihapus; Keahlian Teknis dan GitHub di tengah, tanpa kredit (dipindah ke Privasi), tanpa tautan profil dan ticker GitHub (DESIGN.md bagian 59). |
| 2026-10-16 | Transisi antarbagian beranda T3 "judul tirai": judul naik dari balik batasnya, isi menyusul memudar (DESIGN.md bagian 60) |
| 2026-10-16 | Grafik kontribusi GitHub: statistik mode 3D pindah ke baris di bawah grafik seperti mode 2D, tanpa garis kotak (DESIGN.md bagian 61) |
| 2026-10-16 | Grafik kontribusi GitHub: font mengikuti situs, 3D lebih besar di HP, legenda Less/More rapat, petunjuk hover/orbit dihapus (DESIGN.md bagian 62) |
| 2026-10-16 | Grafik kontribusi GitHub memakai biru situs (W1) menggantikan hijau (DESIGN.md bagian 63) |
| 2026-10-16 | Grafik kontribusi GitHub: default 2D, kotak bergaris seperti GitHub di sekitar grafik dan legenda, judul jumlah kontribusi lebih besar, label statistik Inter (DESIGN.md bagian 64) |
| 2026-10-16 | Grafik kontribusi GitHub: label statistik huruf besar, statistik menjadi pita bersekat di dalam kotak grafik (demo S5, DESIGN.md bagian 65) |
| 2026-10-16 | Grafik kontribusi GitHub: total setahun dihapus dari statistik (tinggal 3), judul satu baris di HP, 2D bisa digeser di HP dan dibuka di minggu terbaru (DESIGN.md bagian 66). |
| 2026-10-16 | Grafik kontribusi GitHub: format statistik F10 minimal (label, angka besar, tanggal ringkas), angka sejajar di HP (DESIGN.md bagian 67) |
| 2026-10-16 | Grafik kontribusi GitHub: tanggal statistik dengan nama bulan lengkap di layar lebar, singkat di HP, pemisah " - " berspasi (DESIGN.md bagian 68) |
| 2026-10-16 | Grafik kontribusi GitHub di HP: scrollbar disembunyikan, morph 2D/3D tidak patah (kanvas tetap lebar selama morph, DESIGN.md bagian 69) |
| 2026-10-18 | Halaman 404: sesuai bahasa URL (catch-all `[locale]/[...rest]`), tanpa terjemahan dan penjelasan 404, satu tombol Beranda/Home, kalimat satu baris di layar lebar, isi di tengah (DESIGN.md bagian 70) |
| 2026-10-18 | Pengalaman: entri teratas aktif saat halaman dibuka (garis baca). Grafik GitHub: suara B2 "gelombang klik" saat berpindah 2D/3D (DESIGN.md bagian 71) |
| 2026-10-18 | Grafik GitHub: suara morph dihapus; judul jumlah kontribusi dan label statistik satu baris di HP (DESIGN.md bagian 72) |
| 2026-10-18 | Keahlian Teknis: keyboard Spline diganti globe skill (S4 Globe + warna kategori S7) tanpa library; `@splinetool/runtime`, aset `public/spline/`, dan `'unsafe-eval'` CSP publik dihapus; kredit Naresh Khatri dihapus (DESIGN.md bagian 73) |
| 2026-10-18 | Keahlian Teknis: 34 skill pilihan pemilik dalam 5 kategori (migrasi `20261018120000_skills_owner_list`), semua dengan logo; logo mengecil sesuai jumlah, logo tertutup dibuat inert (DESIGN.md bagian 74) |
| 2026-10-18 | Globe skill: semua logo memakai logo asli berwarna penuh (`public/skills`, Devicon + sumber resmi), logo hitam dibalik di tema gelap (DESIGN.md bagian 75) |
| 2026-10-18 | Chip teknologi di halaman Project memakai logo asli berwarna penuh yang sama dengan globe skill (DESIGN.md bagian 75) |
| 2026-10-18 | Keahlian Teknis: NestJS, MongoDB, Docker dihapus, total 31 skill (migrasi `20261018130000_skills_remove_three`, DESIGN.md bagian 76) |
| 2026-10-18 | Globe skill: teks ajakan dihapus; setelah logo dipilih, scroll, tekan ulang, tekan di mana saja, atau Esc membuat bola berputar lagi (DESIGN.md bagian 77) |
| 2026-10-18 | Globe skill: semua lingkaran dan garis biru situs (B7 seragam); fokus tidak lagi memilih logo dan semua logo inert sampai hydration (perbaikan CI WebKit, DESIGN.md bagian 78) |
| 2026-10-18 | Globe skill: tombol kategori diganti menu "Kategori: Semua" (pilihan C5, DESIGN.md bagian 79) |
| 2026-10-18 | Globe skill: menu kategori ke bawah, kategori terpilih menonjol dan lainnya hampir hilang, tekan apa saja kembali ke Semua, "Dipakai di" dihapus (DESIGN.md bagian 80) |
| 2026-10-18 | Globe skill: filter kategori tetap sampai Semua dipilih; setelah logo dilepas atau Semua dipilih, kemiringan bola kembali ke posisi awal (DESIGN.md bagian 81) |
| 2026-10-18 | Globe skill: menu kategori lebih kecil dan tidak melewati garis bagian, angka jumlah skill huruf Oswald; pengaman geser untuk WebKit (DESIGN.md bagian 82) |
