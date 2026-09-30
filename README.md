# Portofolio Muhammad Mirza

Website portofolio pribadi dua bahasa (ID/EN) dengan panel Super Admin untuk mengelola konten.

**Status:** Milestone 1 (setup) selesai. Halaman publik lengkap dan panel admin menyusul, lihat [`Documentation/TODO.md`](Documentation/TODO.md).

## Stack

Node.js 24 · Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 6 (strict) · Tailwind CSS 4 · next-intl · next-themes · PostgreSQL (Neon) + Prisma 7 · Zod · Vitest · Playwright + axe · pnpm · Vercel · GitHub Actions.
Alasan tiap pilihan: [`Documentation/ARCHITECTURE.md`](Documentation/ARCHITECTURE.md).

## Struktur

| Folder | Isi |
|---|---|
| [`Frontend/`](Frontend) | Aplikasi Next.js: halaman publik, (nanti) panel admin, route handler, tes |
| [`Backend/`](Backend) | Peta lokasi kode server. Backend berjalan di dalam Next.js (Opsi A, tanpa server terpisah) |
| [`Database/`](Database) | Skema Prisma, migrasi SQL, dan data seed dari CV |
| [`Documentation/`](Documentation) | PRD, desain, arsitektur, alur kerja, rencana, konten, referensi |

Di akar repo hanya ada berkas `.md`, ditambah folder tersembunyi `.github/` (CI dan templat PR, wajib di akar) dan `.agents/` (skill untuk agen AI).

## Menjalankan secara lokal

Prasyarat: Node.js 24 LTS (lihat `Frontend/.nvmrc`), pnpm 10 (`corepack enable`), dan PostgreSQL 17 (lokal, Docker, atau branch Neon).
**Semua perintah dijalankan dari folder `Frontend/`.**

```bash
cd Frontend
pnpm install                  # sekaligus menjalankan prisma generate dari ../Database/schema.prisma
cp .env.example .env.local    # isi DATABASE_URL
pnpm db:migrate               # terapkan migrasi di ../Database/migrations
pnpm db:seed                  # isi data awal dari ../Database/seed (aman dijalankan berulang)
pnpm dev                      # http://localhost:3000 -> diarahkan ke /id atau /en
```

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
| `pnpm test:e2e` | Tes E2E + aksesibilitas (Playwright + axe), butuh `pnpm build` dan database |
| `pnpm db:migrate` | Buat/terapkan migrasi (pengembangan) |
| `pnpm db:deploy` | Terapkan migrasi (CI/production) |
| `pnpm db:seed` | Isi data awal |
| `pnpm db:studio` | Prisma Studio |

Sebelum push jalankan: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
Hook pre-commit (Husky + lint-staged, di `Frontend/.husky`) menjalankan ESLint dan Prettier pada berkas yang di-stage.

Bila Playwright tidak bisa mengunduh browser (misalnya di sandbox), arahkan ke Chromium yang terpasang:
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/ke/chrome pnpm test:e2e`.

## Deploy ke Vercel (dilakukan pemilik akun)

Konfigurasi hosting sudah ada di `Frontend/vercel.json`: region server **Singapura (`sin1`)**, build command `pnpm build:vercel`, dan Ignored Build Step. Yang perlu dilakukan di dashboard:

1. **Vercel → Add New → Project → Import** repo `HorizonMirza/Mirza-Portfolio`. Set **Root Directory** ke `Frontend`. Biarkan opsi "Include files outside the Root Directory" aktif agar `Database/` ikut terbaca. Build command dan region terbaca otomatis dari `vercel.json`.
2. **Storage → Marketplace → Neon** di project Vercel: region **Singapore (aws-ap-southeast-1)**, PostgreSQL 17, hubungkan ke Production dan Preview. Integrasi mengisi `DATABASE_URL` (pooled) dan `DATABASE_URL_UNPOOLED` (direct, untuk migrasi) secara otomatis.
3. **Branch database per preview (disarankan):** aktifkan pembuatan branch Neon untuk tiap preview di pengaturan integrasi, beserta penghapusan otomatis branch lama (paket gratis maksimal 10 branch). Setelah aktif, tambahkan env `MIGRATE_ON_BUILD=true` khusus **Preview**. Tanpa branch preview, jangan tambahkan env ini, agar preview tidak mengubah database production.
4. **Environment Variables** tambahan: `NEXT_PUBLIC_SITE_URL` (Production: domain final, Preview: boleh dikosongkan). `DIRECT_URL` tidak perlu bila memakai integrasi.
5. Deploy. Migrasi hanya berjalan di production (`Frontend/scripts/vercel-build.sh`). Commit yang hanya mengubah `Documentation/`, `.github/`, atau berkas `.md` di akar tidak memicu build (`Frontend/scripts/vercel-ignore-build.sh`).
6. Jalankan seed sekali dari komputer lokal (di `Frontend/`) dengan URL database production: `pnpm db:seed`.
7. Cek `https://<domain>/api/health` harus mengembalikan `{"status":"ok","database":"ok"}`.

Setelah deploy (pemilik akun):

- **GitHub → Settings → Rules → Rulesets → New branch ruleset** untuk `main`: aktifkan *Require status checks to pass* (pilih job CI), *Block force pushes*, dan *Restrict deletions*. Tambahkan diri Anda (Repository admin) di *Bypass list* agar commit dokumen tetap bisa langsung ke `main`.
- **UptimeRobot** (gratis): monitor HTTP ke `https://<domain>/api/health` tiap 5 menit, notifikasi ke **email** dan **Telegram**.
- Domain `.site` dihubungkan di Milestone 5.

## Dokumen

[PRD](Documentation/PRD.md) · [Desain](Documentation/DESIGN.md) · [Arsitektur](Documentation/ARCHITECTURE.md) · [Alur kerja](Documentation/WORKFLOW.md) · [Rencana](Documentation/TODO.md) · [Konten](Documentation/CONTENT.md) · [Referensi](Documentation/REFERENCES.md) · [Panduan Claude](CLAUDE.md)

## Lisensi

Kode dan konten milik Muhammad Mirza Wirya, hak cipta dilindungi. Font Plus Jakarta Sans dan JetBrains Mono memakai SIL Open Font License (lihat `Frontend/src/fonts/`).
