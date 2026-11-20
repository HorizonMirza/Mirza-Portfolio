# Backend

Kode server portofolio: Server Actions, query database (Prisma), autentikasi (Better Auth), unggah (Cloudinary), dan logika route API. Folder ini **bukan server terpisah**: kodenya diimpor aplikasi Next.js di `Frontend/` lewat alias `@backend/*`, dibundel saat `next build`, dan di-deploy bersama sebagai satu aplikasi di Vercel.

| Folder | Isi |
|---|---|
| `features/<domain>/` | `schema.ts` (Zod), `queries.ts`, `actions.ts` (`'use server'`), `public.ts` (data halaman publik) |
| `lib/` | `db`, `auth`, `auth-guard`, `env`, `cloudinary`, `rate-limit`, `audit`, `admin-i18n`, ... |
| `api/` | Logika route handler. Berkas rute Next di `Frontend/src/app/api/**/route.ts` hanya me-re-export dari sini |
| `i18n/routing.ts` | Daftar bahasa situs (`id`, `en`) |
| `scripts/` | `seed.ts` (`pnpm db:seed`), `seed-ids.ts`, `admin-reset-password.ts` |
| `generated/prisma/` | Prisma client hasil `prisma generate` (tidak di-commit) |

Tidak ada `package.json` di sini. Semua perintah dijalankan dari `Frontend/` (`pnpm install`, `pnpm lint`, `pnpm test`, ...). `pnpm install` membuat symlink `Backend/node_modules` ke `Frontend/node_modules` dan meng-generate Prisma client ke `generated/`. Konfigurasi `eslint.config.mjs`, `.prettierrc.mjs`, dan `.lintstagedrc.json` di sini memakai aturan yang sama dengan Frontend; hook pre-commit menjalankan lint-staged di folder ini juga.

Kerapian: setiap berkas diawali komentar singkat tentang isinya ("hanya server" untuk berkas dengan `import 'server-only'`), komentar menjelaskan keadaan sekarang (riwayat ada di git dan log `Documentation/TODO.md`), impor dikelompokkan paket luar, `@backend/`, lalu relatif, dan hanya nama yang dipakai berkas lain yang diekspor.

Aturan impor: Backend tidak mengimpor `Frontend/` (kecuali membaca teks bawaan `Frontend/messages/*.json`), dan `lib/` tidak mengimpor `features/`. Dijaga `Frontend/tests/unit/backend-boundary.test.ts`. Penjelasan lengkap: `Documentation/ARCHITECTURE.md` bagian 4.
