# Database

PostgreSQL 17 (Neon di production). Primary key UUID v7, semua waktu `timestamptz` (UTC, ditampilkan dalam `Asia/Jakarta`). Penjelasan tiap tabel ada di `Documentation/ARCHITECTURE.md` bagian 5.

| Berkas | Isi |
|---|---|
| `schema.prisma` | Skema seluruh tabel. Prisma client di-generate ke `Backend/generated/prisma` (tidak di-commit) |
| `migrations/` | Migrasi SQL yang diterapkan berurutan. Jangan diedit atau dihapus setelah di-commit; perubahan selalu lewat migrasi baru |
| `seed/seed-data.ts` | Data awal dari CV, tanpa email atau nomor telepon (diambil dari environment). Dijalankan oleh `Backend/scripts/seed.ts` |
| `.prettierrc.mjs` | Aturan Prettier untuk `seed/` (sama dengan Frontend, tanpa plugin Tailwind) |

Semua perintah dijalankan dari folder `Frontend/`, karena Prisma CLI dan dependency-nya terpasang di sana (lihat `Frontend/prisma.config.ts`):

```bash
cd Frontend
pnpm db:migrate    # buat/terapkan migrasi saat pengembangan (menulis ke Database/migrations/)
pnpm db:deploy     # terapkan migrasi (CI; production lewat scripts/vercel-build.sh)
pnpm db:seed       # jalankan data seed (idempoten: hanya membuat baris yang belum ada)
pnpm db:studio     # lihat isi database
```

Push ke `main` menjalankan `prisma migrate deploy` di production. Migrasi yang menghapus tabel, kolom, atau data hanya dibuat atas persetujuan eksplisit pemilik.
