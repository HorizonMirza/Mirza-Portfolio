# Portofolio Muhammad Mirza

Website portofolio pribadi dua bahasa (ID/EN) dengan panel Super Admin untuk mengelola konten.

**Status:** Milestone 1–3 selesai: situs publik dua bahasa dari database, panel admin di `/admin`, kontak, newsletter, dan API publik. Berikutnya Milestone 4 (polish), lihat [`Documentation/TODO.md`](Documentation/TODO.md).

## Stack

Node.js 24 · Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 6 (strict) · Tailwind CSS 4 · next-intl · next-themes · PostgreSQL (Neon) + Prisma 7 · Zod · Vitest · Playwright + axe · pnpm · Vercel · GitHub Actions.
Alasan tiap pilihan: [`Documentation/ARCHITECTURE.md`](Documentation/ARCHITECTURE.md).

## Struktur

| Folder | Isi |
|---|---|
| [`Frontend/`](Frontend) | Aplikasi Next.js: halaman publik, panel admin `/admin`, route handler (`/api/v1`, `/api/cv`, `/api/track`, `/api/cron`), tes |
| [`Backend/`](Backend) | Peta lokasi kode server. Backend berjalan di dalam Next.js (Opsi A, tanpa server terpisah) |
| [`Database/`](Database) | Skema Prisma, migrasi SQL, dan data seed dari CV |
| [`Documentation/`](Documentation) | PRD, desain, arsitektur, alur kerja, rencana, konten, referensi |

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

Unggah foto, CV, dan gambar project butuh `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (akun gratis di cloudinary.com). Tanpa kunci ini, bagian unggah menampilkan pesan "belum aktif" dan fitur lain tetap berjalan. `GITHUB_TOKEN` (opsional, token *fine-grained* tanpa izin tambahan) menaikkan batas impor dari GitHub.

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
- Commit yang hanya mengubah `Documentation/`, `.github/`, atau berkas `.md` di akar tidak memicu build (`Frontend/scripts/vercel-ignore-build.sh`). Deploy pertama selalu di-build.
- Menjalankan seed manual dari komputer sendiri tetap bisa: `pnpm db:seed` di `Frontend/` dengan `DATABASE_URL` production.

Setelah deploy (pemilik akun):

- **GitHub → Settings → Rules → Rulesets → New branch ruleset** untuk `main`: aktifkan *Block force pushes* dan *Restrict deletions*. Jangan aktifkan *Require a pull request*, karena semua pekerjaan langsung di `main` (tanpa branch lain).
- **UptimeRobot** (gratis): monitor HTTP ke `https://<domain>/api/health` tiap 5 menit, notifikasi ke **email** dan **Telegram**.
- Domain `.site` dihubungkan di Milestone 5.

## Dokumen

[PRD](Documentation/PRD.md) · [Desain](Documentation/DESIGN.md) · [Arsitektur](Documentation/ARCHITECTURE.md) · [Alur kerja](Documentation/WORKFLOW.md) · [Rencana](Documentation/TODO.md) · [Konten](Documentation/CONTENT.md) · [Referensi](Documentation/REFERENCES.md) · [Panduan Claude](CLAUDE.md)

## Lisensi

Kode dan konten milik Muhammad Mirza Wirya, hak cipta dilindungi. Font Plus Jakarta Sans dan JetBrains Mono memakai SIL Open Font License (lihat `Frontend/src/fonts/`).
