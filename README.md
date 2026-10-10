# Portofolio Muhammad Mirza

Website portofolio pribadi dua bahasa (ID/EN) dengan panel Super Admin untuk mengelola konten.

**Live:** [mmirza.site](https://mmirza.site) · [Bahasa Indonesia](https://mmirza.site/id) · [English](https://mmirza.site/en)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="Documentation/screenshots/home-dark.webp">
  <img src="Documentation/screenshots/home-light.webp" alt="Halaman awal mmirza.site: judul besar Mahasiswa AI BINUS yang membangun software dan komunitas, pelat status, tombol Unduh CV dan Lihat project, dengan latar garis cakrawala biru" width="100%">
</picture>

<p align="center">
  <img src="Documentation/screenshots/home-mobile.webp" alt="Halaman awal mmirza.site di HP, mode gelap, dengan menu ikon di bawah layar" width="270">
</p>

<sub>Tangkapan layar halaman awal (10 Oktober 2026). Gambar besar mengikuti tema GitHub Anda: gelap atau terang.</sub>

**Status:** live di `mmirza.site` sejak 1 Oktober 2026 (Vercel + Neon Singapura). Milestone 1–4 selesai, Milestone 5 tinggal tugas akun pemilik (Resend, UptimeRobot, ruleset, Search Console, secret backup) dan uji akhir rilis. Lihat [`Documentation/TODO.md`](Documentation/TODO.md).

## Fitur

**Situs publik** (semua teks dua bahasa, tema gelap dan terang, mobile-first)
- **Beranda:** hero "Horizon" (canvas), pelat status, angka ringkas, aktivitas GitHub, ajakan kontak.
- **Tentang:** bio, pendidikan, kartu foto yang bisa dimiringkan.
- **Pengalaman:** timeline yang menyorot entri di tengah layar saat digulir.
- **Project:** daftar "lampu sorot" (project di tengah layar menyala, sisanya redup), gambar dalam bingkai browser yang terbang ke halaman detail. Detail berisi peran, tombol View App/GitHub yang dipilih admin, dan galeri foto.
- **Kontak:** form dengan rate limit dan honeypot, tombol WhatsApp, newsletter double opt-in.
- **Lainnya:** halaman privasi, 404 "hantu", SEO (sitemap, Open Graph dinamis, JSON-LD), API publik `/api/v1`, suara antarmuka yang volumenya diatur admin.

**Panel Super Admin** (`/admin`): profil, project (impor dari GitHub, unggah Cloudinary, urutan, draf/terbit), skill, pengalaman, sorotan beranda, kotak masuk pesan, pelanggan newsletter, log audit, pengaturan, dan akun. Semua aksi divalidasi Zod di server, memeriksa role `SUPER_ADMIN`, dan dicatat di log audit.

**Kualitas:** WCAG 2.2 AA (axe bersih di semua halaman, terang/gelap, ID/EN, desktop/HP), `prefers-reduced-motion` dihormati, CSP ketat, backup database harian terenkripsi.

## Stack

Node.js 24 · Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 6 (strict) · Tailwind CSS 4 · next-intl · next-themes · PostgreSQL (Neon) + Prisma 7 · Better Auth · Zod · Cloudinary · Resend · Vitest · Playwright + axe · pnpm · Vercel · GitHub Actions.
Alasan tiap pilihan: [`Documentation/ARCHITECTURE.md`](Documentation/ARCHITECTURE.md).

## Struktur

| Folder | Isi |
|---|---|
| [`Frontend/`](Frontend) | Aplikasi Next.js: halaman publik, panel admin `/admin`, route handler (`/api/v1`, `/api/cv`, `/api/track`, `/api/cron`), tes |
| [`Backend/`](Backend) | Peta lokasi kode server. Backend berjalan di dalam Next.js (Opsi A, tanpa server terpisah) |
| [`Database/`](Database) | Skema Prisma, migrasi SQL, dan data seed dari CV |
| [`Documentation/`](Documentation) | PRD, desain, arsitektur, alur kerja, rencana, konten, referensi, tangkapan layar README |

Di akar repo hanya ada berkas `.md`, ditambah folder tersembunyi `.github/` (CI, wajib di akar) dan `.agents/` (skill untuk agen AI).

## Menjalankan secara lokal

Prasyarat: Node.js 24 LTS (lihat `Frontend/.nvmrc`), pnpm 10 (`corepack enable`), dan PostgreSQL 17 (lokal, Docker, atau branch Neon).
**Semua perintah dijalankan dari folder `Frontend/`.**

```bash
cd Frontend
pnpm install                  # sekaligus menjalankan prisma generate dari ../Database/schema.prisma
cp .env.example .env.local    # isi DATABASE_URL, BETTER_AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
pnpm db:migrate               # terapkan migrasi di ../Database/migrations
pnpm db:seed                  # isi data awal dari ../Database/seed + akun admin (aman dijalankan berulang)
pnpm dev                      # http://localhost:3000 -> diarahkan ke /id atau /en
```

**Panel admin:** buka `http://localhost:3000/admin` lalu masuk dengan `ADMIN_EMAIL` dan `ADMIN_PASSWORD`. Buat `BETTER_AUTH_SECRET` dengan `openssl rand -base64 32`. Password yang lupa bisa diganti dari terminal: `ADMIN_NEW_PASSWORD=... pnpm admin:reset-password` (semua sesi ikut dicabut). Login dibatasi 5 percobaan per 15 menit per IP.

Variabel lain ada di `Frontend/.env.example` (tanpa nilai). Unggah foto, CV, dan gambar project butuh `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (akun gratis di cloudinary.com). Tanpa kunci ini, bagian unggah menampilkan pesan "belum aktif" dan fitur lain tetap berjalan. `GITHUB_TOKEN` (opsional, token *fine-grained* tanpa izin tambahan) menaikkan batas impor dari GitHub.

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

Semua pekerjaan langsung di `main` (tanpa branch lain), dan push ke `main` langsung live. Sebelum push jalankan: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`.
Hook pre-commit (Husky + lint-staged, di `Frontend/.husky`) menjalankan ESLint dan Prettier pada berkas yang di-stage.

Bila Playwright tidak bisa mengunduh browser (misalnya di sandbox), arahkan ke Chromium yang terpasang:
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
   | `ADMIN_PASSWORD` | Production | password admin, minimal 12 karakter |
   | `CRON_SECRET` | Production | teks acak minimal 16 karakter |
   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Production, Preview | dari dashboard Cloudinary (opsional, untuk unggah foto/CV/gambar) |
   | `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_TO_EMAIL` | Production | opsional, untuk email kontak dan newsletter. `EMAIL_FROM` harus di domain yang terverifikasi di Resend |

   `BETTER_AUTH_URL` dan `NEXT_PUBLIC_SITE_URL` **dikosongkan dulu**: situs otomatis memakai domain `*.vercel.app` proyek. Isi keduanya (`https://domainanda.site`) setelah domain sendiri terpasang.
4. **Deployments → titik tiga pada deploy terakhir → Redeploy**. Di log build akan terlihat "All migrations have been successfully applied", "Akun admin dibuat", dan "Seed selesai".
5. Buka `https://<proyek>.vercel.app/api/health` → harus `{"status":"ok","database":"ok"}`. Lalu masuk ke `https://<proyek>.vercel.app/admin` dengan `ADMIN_EMAIL` dan `ADMIN_PASSWORD`.
6. Setelah bisa masuk: **hapus** env `ADMIN_PASSWORD` dari Vercel (akun sudah tersimpan di database), lalu ganti password lewat `/admin/account` bila perlu. Mengganti `ADMIN_EMAIL` nanti tidak membuat akun admin kedua.
7. Isi dari admin langsung tampil di situs. Perubahan di luar admin (misalnya langsung di database) tampil paling lambat 10 menit kemudian.

Catatan:
- Migrasi dan pengisian awal hanya berjalan di **production** (`Frontend/scripts/vercel-build.sh`), jadi preview tidak pernah mengubah database production. Bila preview memakai branch database Neon sendiri (opsi di pengaturan integrasi Neon), tambahkan `MIGRATE_ON_BUILD=true` khusus Preview.
- Pengisian awal (`scripts/seed.ts --bootstrap`) hanya mengisi konten bila belum ada profil, jadi data yang Anda hapus lewat admin tidak muncul lagi di deploy berikutnya.
- Commit yang hanya mengubah `Documentation/`, `.github/`, atau berkas `.md` di akar tidak memicu build (`Frontend/scripts/vercel-ignore-build.sh`). Deploy pertama dan Redeploy commit yang sama (misalnya setelah mengubah Environment Variables) selalu di-build.
- Menjalankan seed manual dari komputer sendiri tetap bisa: `pnpm db:seed` di `Frontend/` dengan `DATABASE_URL` production.

Setelah deploy (pemilik akun):

- **GitHub → Settings → Rules → Rulesets → New branch ruleset** untuk `main`: aktifkan *Block force pushes* dan *Restrict deletions*. Jangan aktifkan *Require a pull request*, karena semua pekerjaan langsung di `main` (tanpa branch lain).
- **UptimeRobot** (gratis): monitor HTTP ke `https://<domain>/api/health` tiap 5 menit, notifikasi ke **email** dan **Telegram**.
- Domain `mmirza.site` (Hostinger) sudah terhubung: A `@` dan CNAME `www` ke Vercel, `www` dialihkan ke `mmirza.site`.

## Pemantauan dan Backup (Milestone 5)

**Vercel Web Analytics dan Speed Insights.** Di project Vercel: tab **Analytics → Enable** dan tab **Speed Insights → Enable** (paket Hobby gratis). Skrip hanya dimuat di Vercel (`components/site/vercel-insights.tsx`) dan query string dibuang sebelum dikirim, jadi token newsletter tidak ikut tercatat.

**Sentry (error server).** Buat project Sentry (platform Next.js), salin **DSN**, lalu tambahkan `SENTRY_DSN` di Vercel (Production, tipe Config). Error dikirim dari `src/instrumentation.ts` lewat HTTP tanpa SDK, tanpa header, cookie, IP, atau query string. Tanpa `SENTRY_DSN` tidak ada yang dikirim.

**Backup harian** (`.github/workflows/backup.yml`, 02.30 WIB): `pg_dump` → enkripsi AES-256 (gpg) → artifact 30 hari → langsung diuji pulih ke Postgres sementara (jumlah Profile, Super Admin, dan migrasi dicek). Isi dua secret di **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Isi |
|---|---|
| `BACKUP_DATABASE_URL` | connection string Neon **tanpa pooler** (Neon Console → Connect → matikan *Connection pooling*) |
| `BACKUP_PASSPHRASE` | kalimat sandi panjang (≥ 32 karakter). **Simpan juga di password manager**: tanpa ini backup tidak bisa dibuka |

Jalankan sekali lewat **Actions → Backup → Run workflow** untuk memastikan hijau.

**Memulihkan backup** (bila data production rusak):

```bash
# 1. Unduh artifact dari Actions → Backup → run terakhir, ekstrak backup.dump.gpg
gpg --decrypt --output restore.dump backup.dump.gpg       # minta BACKUP_PASSPHRASE
# 2. Paling aman: pulihkan ke branch Neon baru dulu, cek isinya, baru arahkan aplikasi ke sana.
#    Untuk menimpa database yang sedang dipakai (data di dalamnya diganti isi backup):
pg_restore --clean --if-exists --no-owner --no-acl --dbname "<URL Neon tanpa pooler>" restore.dump
rm restore.dump
```

Neon juga punya pemulihan bawaan ke titik waktu tertentu (Neon Console → Restore), sebagai lapis kedua.

**Rollback aplikasi:** Vercel → Deployments → deploy yang sehat → **Instant Rollback**. Bila deploy yang dibatalkan membawa migrasi database, pulihkan juga dari backup.

## Dokumen

[PRD](Documentation/PRD.md) · [Desain](Documentation/DESIGN.md) · [Arsitektur](Documentation/ARCHITECTURE.md) · [Alur kerja](Documentation/WORKFLOW.md) · [Rencana](Documentation/TODO.md) · [Konten](Documentation/CONTENT.md) · [Referensi](Documentation/REFERENCES.md) · [Panduan Claude](CLAUDE.md)

## Lisensi

Kode dan konten milik Muhammad Mirza Wirya, hak cipta dilindungi. Font Oswald, Inter, dan JetBrains Mono memakai SIL Open Font License (lihat `Frontend/src/fonts/`).
