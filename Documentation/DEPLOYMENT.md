# Deployment dan Menjalankan Lokal

Panduan operasional. Gambaran proyek ada di [`README.md`](../README.md); keputusan arsitektur di [`ARCHITECTURE.md`](ARCHITECTURE.md).


## Menjalankan secara lokal

Prasyarat: Node.js 24 LTS (lihat `Frontend/.nvmrc`), pnpm 10 (`corepack enable`), dan PostgreSQL 17 (lokal, Docker, atau branch Neon).
**Semua perintah dijalankan dari folder `Frontend/`.**

```bash
cd Frontend
pnpm install                  # juga: prisma generate ke ../Backend/generated, symlink ../Backend/node_modules
cp .env.example .env.local    # isi DATABASE_URL, BETTER_AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
pnpm db:migrate               # terapkan migrasi di ../Database/migrations
pnpm db:seed                  # isi data awal dari ../Database/seed + akun admin (aman dijalankan berulang)
pnpm dev                      # http://localhost:3000 -> diarahkan ke /id atau /en
```

**Panel admin:** buka `http://localhost:3000/admin` lalu masuk dengan `ADMIN_EMAIL` dan `ADMIN_PASSWORD`. Buat `BETTER_AUTH_SECRET` dengan `openssl rand -base64 32`. Password yang lupa bisa diganti dari terminal: `ADMIN_NEW_PASSWORD=... pnpm admin:reset-password` (semua sesi ikut dicabut). Login dibatasi 5 percobaan per 15 menit per IP.

Variabel lain ada di `Frontend/.env.example` (tanpa nilai). Unggah foto, logo, dan gambar project butuh `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (akun gratis di cloudinary.com). Tanpa kunci ini, bagian unggah menampilkan pesan "belum aktif" dan fitur lain tetap berjalan. `GITHUB_TOKEN` (token *fine-grained* tanpa izin tambahan) **wajib** untuk kalender kontribusi GitHub di beranda dan footer (tanpa token bagian itu tidak tampil). Tidak ada lagi impor repo dari GitHub.

Contoh Postgres lokal dengan Docker:

```bash
docker run -d --name portfolio-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
```

## Perintah (di `Frontend/`)

| Perintah | Fungsi |
|---|---|
| `pnpm dev` | Server pengembangan |
| `pnpm build` / `pnpm start` | Build dan jalankan versi production |
| `pnpm lint` | ESLint (tanpa peringatan) |
| `pnpm format` / `pnpm format:check` | Prettier |
| `pnpm typecheck` | Generate tipe rute Next.js lalu `tsc --noEmit` |
| `pnpm test` | Tes unit (Vitest) |
| `pnpm test:e2e` | Tes E2E + aksesibilitas (Playwright + axe), butuh `pnpm build`, database, dan env admin (tes admin dilewati bila `ADMIN_EMAIL` kosong) |
| `pnpm db:migrate` | Buat/terapkan migrasi (pengembangan) |
| `pnpm db:deploy` | Terapkan migrasi (CI/production) |
| `pnpm db:seed` | Isi data awal |
| `pnpm db:studio` | Prisma Studio |
| `pnpm admin:reset-password` | Ganti password admin dari terminal (`ADMIN_EMAIL`, `ADMIN_NEW_PASSWORD`) |
| `pnpm logos:build` | Buat ulang logo WebP globe skill (`public/skills/`) dari sumber SVG di `scripts/skill-logos/` |

Semua pekerjaan langsung di `main` (tanpa branch lain), dan push ke `main` langsung live. Sebelum push jalankan: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`.
Hook pre-commit (Husky + lint-staged, di `Frontend/.husky`) menjalankan ESLint dan Prettier pada berkas yang di-stage.

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/ke/chrome pnpm test:e2e`.

## Deploy ke Vercel (dilakukan pemilik akun)

Situs sudah live di `mmirza.site`, jadi langkah di bawah hanya diperlukan bila project Vercel dipasang ulang dari nol. Setiap push ke `main` langsung di-deploy otomatis.

Konfigurasi hosting sudah ada di `Frontend/vercel.json`: region server **Singapura (`sin1`)**, build command `pnpm build:vercel`, Ignored Build Step, dan Vercel Cron harian. Deploy production pertama otomatis menjalankan migrasi, lalu mengisi konten dari CV dan membuat akun admin bila database masih kosong. Tidak perlu menjalankan apa pun dari komputer sendiri.

1. **Vercel → Add New → Project → Import** repo `HorizonMirza/Mirza-Portfolio`. Klik **Edit** di Root Directory lalu pilih `Frontend`. Framework terdeteksi Next.js, build command dan region terbaca dari `vercel.json`. Klik **Deploy**. Deploy pertama ini **akan gagal** karena database belum ada, itu wajar.
2. **Storage → Create Database → Neon** (di halaman project): region **Singapore (aws-ap-southeast-1)**, hubungkan ke **Production** dan **Preview**. Integrasi mengisi `DATABASE_URL` dan `DATABASE_URL_UNPOOLED` otomatis.
3. **Settings → Environment Variables**, tambahkan:

   | Nama | Environment | Nilai |
   |---|---|---|
   | `BETTER_AUTH_SECRET` | Production | teks acak minimal 32 karakter |
   | `BETTER_AUTH_SECRET` | Preview | teks acak lain (berbeda dari Production) |
   | `ADMIN_EMAIL` | Production | email untuk login admin |
   | `ADMIN_PASSWORD` | Production | password admin, minimal 8 karakter |
   | `CRON_SECRET` | Production | teks acak minimal 16 karakter |
   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Production, Preview | dari dashboard Cloudinary (opsional, untuk unggah foto dan gambar) |
   | `GITHUB_TOKEN` | Production, Preview | token *fine-grained* tanpa izin tambahan, untuk kalender kontribusi GitHub |

   `BETTER_AUTH_URL` dan `NEXT_PUBLIC_SITE_URL` **dikosongkan dulu**: situs otomatis memakai domain `*.vercel.app` proyek. Isi keduanya (`https://domainanda.site`) setelah domain sendiri terpasang.
4. **Deployments → titik tiga pada deploy terakhir → Redeploy**. Di log build akan terlihat "All migrations have been successfully applied", "Akun admin dibuat", dan "Seed selesai".
5. Buka `https://<proyek>.vercel.app/api/health` → harus `{"status":"ok","database":"ok"}`. Lalu masuk ke `https://<proyek>.vercel.app/admin` dengan `ADMIN_EMAIL` dan `ADMIN_PASSWORD`.
6. Setelah bisa masuk: **hapus** env `ADMIN_PASSWORD` dari Vercel (akun sudah tersimpan di database), lalu ganti password lewat `/admin/account` bila perlu. Mengganti `ADMIN_EMAIL` nanti tidak membuat akun admin kedua.
7. Isi dari admin langsung tampil di situs. Perubahan di luar admin (misalnya langsung di database) tampil paling lambat 10 menit kemudian.

Catatan:
- Migrasi dan pengisian awal hanya berjalan di **production** (`Frontend/scripts/vercel-build.sh`), jadi preview tidak pernah mengubah database production. Bila preview memakai branch database Neon sendiri (opsi di pengaturan integrasi Neon), tambahkan `MIGRATE_ON_BUILD=true` khusus Preview.
- Pengisian awal (`Backend/scripts/seed.ts --bootstrap`) hanya mengisi konten bila belum ada profil, jadi data yang Anda hapus lewat admin tidak muncul lagi di deploy berikutnya.
- Commit yang hanya mengubah `Documentation/`, `.github/`, atau berkas `.md` di akar tidak memicu build; perubahan di `Frontend/`, `Backend/`, atau `Database/` selalu di-build (`Frontend/scripts/vercel-ignore-build.sh`). Deploy pertama dan Redeploy commit yang sama (misalnya setelah mengubah Environment Variables) selalu di-build.
- Menjalankan seed manual dari komputer sendiri tetap bisa: `pnpm db:seed` di `Frontend/` dengan `DATABASE_URL` production.
- Domain `mmirza.site` (Hostinger) sudah terhubung: A `@` dan CNAME `www` ke Vercel, `www` dialihkan ke `mmirza.site`.

## Pemantauan dan Pemulihan

- **Vercel Speed Insights** aktif di project Vercel: skripnya hanya dimuat di Vercel (`components/site/vercel-insights.tsx`) dan query string dibuang sebelum dikirim.
- **`/api/health`** memeriksa koneksi database (dipakai untuk mengecek setiap deploy).
- **Pesan kontak** tidak dikirim lewat email: semuanya dibaca di Admin → Pesan.
- **Data rusak:** pulihkan lewat fitur bawaan Neon (Neon Console → Restore ke titik waktu tertentu). Kesalahan kode dikembalikan dengan Vercel Instant Rollback ke deployment sebelumnya.

## Perawatan Setelah Dibekukan

Kode dibekukan sejak **2026-11-22** (finalisasi). Situs berjalan tanpa perubahan kode; yang perlu dijaga hanya akun dan layanan di luar repo. Semua langkah di bawah dikerjakan lewat dashboard, tanpa commit.

| Kapan | Yang dicek | Di mana |
|---|---|---|
| Mingguan | Pesan masuk dan angka kunjungan | Admin → Pesan, Admin → Dashboard |
| Bulanan | `https://mmirza.site/api/health` berisi `"status":"ok"` dan `"database":"ok"` | Browser |
| Bulanan | Cron harian `/api/cron/daily` (01.00 WIB) sukses, log runtime tanpa error berulang | Vercel → Project → Settings → Cron Jobs, dan Logs |
| Bulanan | Peringatan keamanan dependency | GitHub → repo → Security → Dependabot alerts |
| Bulanan | Kalender GitHub tampil di beranda. Bila hilang, token kedaluwarsa (lihat di bawah) | Beranda situs |
| Triwulan | Kuota paket gratis: Vercel (bandwidth, function), Neon (penyimpanan, compute), Cloudinary (kredit) | Vercel → Usage, Neon Console → Usage, Cloudinary → Dashboard |
| Tahunan | Perpanjangan domain `mmirza.site` (nyalakan perpanjangan otomatis) | Hostinger → Domains |
| Tahunan | Teks yang menua: usia di bio About, isi kartu pembuka | Admin → Tentang, Admin → Beranda |
| Tahunan | Ganti password admin, keluarkan perangkat yang tidak dikenal | Admin → Akun |

Sertifikat SSL diperbarui otomatis oleh Vercel selama DNS domain tetap mengarah ke Vercel. Tahun hak cipta di footer dihitung otomatis.

### Mengganti `GITHUB_TOKEN`

Kalender kontribusi GitHub di beranda dan footer hilang (tanpa error) bila token kedaluwarsa atau dicabut.

1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token. Repository access: **Public repositories**, tanpa izin tambahan. Pilih masa berlaku terpanjang dan catat tanggalnya.
2. Vercel → Project → Settings → Environment Variables → `GITHUB_TOKEN` (Production dan Preview) → Edit → tempel token baru.
3. Deployments → deploy terakhir → titik tiga → **Redeploy**. Kalender tampil lagi paling lambat 6 jam kemudian (cache).

### Bila Situs Bermasalah

1. **Situs tidak terbuka:** buka `/api/health`. Bila `"database":"error"`, cek Neon Console (compute, kuota, status layanan). Bila domain tidak terbuka, cek Vercel → Settings → Domains (harus Valid) dan DNS di Hostinger (A `@` dan CNAME `www` ke Vercel).
2. **Error setelah deploy:** Vercel → Deployments → deploy sukses sebelumnya → **Instant Rollback**.
3. **Data terhapus atau rusak:** Neon Console → Restore ke titik waktu sebelum kejadian (dalam jangka riwayat paket Neon).
4. **Lupa password admin:** dari komputer pengembang, `ADMIN_NEW_PASSWORD=... pnpm admin:reset-password` di `Frontend/` dengan `DATABASE_URL` production (semua sesi ikut dicabut).
5. **Form kontak penuh spam:** Admin → Pengaturan → turunkan Batas Pesan per Jam, atau matikan Terima Pesan dari Form Kontak sementara.

### Kapan Commit Darurat Boleh Dilakukan

Hanya bila salah satu terjadi:
- Dependabot alert atau advisory tingkat **high/critical** pada paket yang ikut ke production (`next`, `react`, `better-auth`, `@prisma/client`, dan sejenisnya).
- Situs rusak karena perubahan di luar repo (misalnya API pihak ketiga berubah) dan tidak bisa dipulihkan lewat dashboard.

Ikuti `WORKFLOW.md` bagian 4 dan 10a: satu commit kecil, versi perbaikan saja, semua pemeriksaan (lint, typecheck, test, build, E2E) hijau sebelum push, lalu CI hijau.
