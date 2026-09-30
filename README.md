# Portofolio Muhammad Mirza

Website portofolio pribadi dua bahasa (ID/EN) dengan panel Super Admin untuk mengelola konten.

**Status:** Milestone 1 (setup) selesai. Halaman publik lengkap dan panel admin menyusul, lihat [`documentation/TODO.md`](documentation/TODO.md).

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind CSS 4 · next-intl · next-themes · PostgreSQL (Neon) + Prisma 7 · Zod · Vitest · Playwright + axe · pnpm · Vercel · GitHub Actions.
Alasan tiap pilihan: [`documentation/ARCHITECTURE.md`](documentation/ARCHITECTURE.md).

## Struktur

| Folder | Isi |
|---|---|
| [`frontend/`](frontend) | Aplikasi Next.js: halaman publik, (nanti) panel admin, route handler, tes |
| [`backend/`](backend) | Disiapkan untuk API terpisah (stack seperti GAAS, menunggu keputusan) |
| [`database/`](database) | Skema Prisma, migrasi SQL, dan data seed dari CV |
| [`documentation/`](documentation) | PRD, desain, arsitektur, alur kerja, rencana, konten, referensi |

Di akar repo hanya ada berkas `.md`, ditambah `.github/` (CI, Dependabot) dan `.claude/` (skill Claude Code) yang wajib berada di akar.

## Menjalankan secara lokal

Prasyarat: Node.js 22 (lihat `frontend/.nvmrc`), pnpm 10 (`corepack enable`), dan PostgreSQL 16 (lokal, Docker, atau branch Neon).
**Semua perintah dijalankan dari folder `frontend/`.**

```bash
cd frontend
pnpm install                  # sekaligus menjalankan prisma generate dari ../database/schema.prisma
cp .env.example .env.local    # isi DATABASE_URL
pnpm db:migrate               # terapkan migrasi di ../database/migrations
pnpm db:seed                  # isi data awal dari ../database/seed (aman dijalankan berulang)
pnpm dev                      # http://localhost:3000 -> diarahkan ke /id atau /en
```

Contoh Postgres lokal dengan Docker:

```bash
docker run -d --name portfolio-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
```

## Perintah (di `frontend/`)

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
Hook pre-commit (Husky + lint-staged, di `frontend/.husky`) menjalankan ESLint dan Prettier pada berkas yang di-stage.

Bila Playwright tidak bisa mengunduh browser (misalnya di sandbox), arahkan ke Chromium yang terpasang:
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/ke/chrome pnpm test:e2e`.

## Deploy ke Vercel (dilakukan pemilik akun)

1. Buat database di [Neon](https://neon.tech): project baru, region Singapore, lalu salin connection string **pooled** dan **direct**.
2. Di Vercel: **Add New → Project → Import** repo `HorizonMirza/Mirza-Portfolio`. Set **Root Directory** ke `frontend` (framework terdeteksi sebagai Next.js). Biarkan opsi "Include files outside the Root Directory" aktif agar `database/` ikut terbaca.
3. **Build Command:** `pnpm build:vercel` (menjalankan `prisma migrate deploy` sebelum `next build`).
4. **Environment Variables** (Production dan Preview): `DATABASE_URL` (pooled), `DIRECT_URL` (direct), `NEXT_PUBLIC_SITE_URL`. Sebaiknya Preview memakai branch Neon terpisah.
5. Setelah deploy pertama, jalankan seed sekali dari komputer lokal (di `frontend/`) dengan `DATABASE_URL` production: `pnpm db:seed`.
6. Cek `https://<domain>/api/health` harus mengembalikan `{"status":"ok","database":"ok"}`.

Domain `.site` dihubungkan di Milestone 5.

## Dokumen

[PRD](documentation/PRD.md) · [Desain](documentation/DESIGN.md) · [Arsitektur](documentation/ARCHITECTURE.md) · [Alur kerja](documentation/WORKFLOW.md) · [Rencana](documentation/TODO.md) · [Konten](documentation/CONTENT.md) · [Referensi](documentation/REFERENCES.md) · [Panduan Claude](CLAUDE.md)

## Lisensi

Kode dan konten milik Muhammad Mirza Wirya, hak cipta dilindungi. Font Plus Jakarta Sans dan JetBrains Mono memakai SIL Open Font License (lihat `frontend/src/fonts/`).
