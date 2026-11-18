# Backend

Kode server portofolio: Server Actions, query database (Prisma), autentikasi (Better Auth), email (Resend), unggah (Cloudinary), dan logika route API. Folder ini **bukan server terpisah**: kodenya diimpor aplikasi Next.js di `Frontend/` lewat alias `@backend/*`, dibundel saat `next build`, dan di-deploy bersama sebagai satu aplikasi di Vercel.

| Folder | Isi |
|---|---|
| `features/<domain>/` | `schema.ts` (Zod), `queries.ts`, `actions.ts` (`'use server'`), `public.ts` (data halaman publik) |
| `lib/` | `db`, `auth`, `auth-guard`, `env`, `email`, `cloudinary`, `rate-limit`, `audit`, `admin-i18n`, ... |
| `api/` | Logika route handler. Berkas rute Next di `Frontend/src/app/api/**/route.ts` hanya me-re-export dari sini |
| `emails/` | Template React Email |
| `i18n/routing.ts` | Daftar bahasa situs (`id`, `en`) |
| `scripts/` | `seed.ts` (`pnpm db:seed`), `seed-ids.ts`, `admin-reset-password.ts` |
| `generated/prisma/` | Prisma client hasil `prisma generate` (tidak di-commit) |

Tidak ada `package.json` di sini. Semua perintah dijalankan dari `Frontend/` (`pnpm install`, `pnpm lint`, `pnpm test`, ...). `pnpm install` membuat symlink `Backend/node_modules` ke `Frontend/node_modules` dan meng-generate Prisma client ke `generated/`.

Aturan impor: Backend tidak mengimpor `Frontend/` (kecuali membaca teks bawaan `Frontend/messages/*.json`), dan `lib/` tidak mengimpor `features/`. Dijaga `Frontend/tests/unit/backend-boundary.test.ts`. Penjelasan lengkap: `Documentation/ARCHITECTURE.md` bagian 4.
