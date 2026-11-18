# Database

PostgreSQL 17. Primary key UUID v7, semua waktu `timestamptz` (UTC, ditampilkan dalam `Asia/Jakarta`). Isi folder ini:

| Berkas | Isi |
|---|---|
| `schema.prisma` | Skema seluruh tabel (acuan: `Documentation/ARCHITECTURE.md` bagian 5) |
| `migrations/` | Migrasi SQL yang diterapkan berurutan. Jangan diedit setelah di-commit, buat migrasi baru |
| `seed/seed-data.ts` | Data awal dari CV, tanpa email atau nomor telepon (diambil dari environment). Skrip yang menjalankannya: `Backend/scripts/seed.ts` |

Semua perintah dijalankan dari folder `Frontend/`, karena Prisma CLI dan dependency-nya terpasang di sana (lihat `Frontend/prisma.config.ts`):

```bash
cd Frontend
pnpm db:migrate    # buat/terapkan migrasi saat pengembangan (menulis ke Database/migrations/)
pnpm db:deploy     # terapkan migrasi di CI/production
pnpm db:seed       # jalankan data seed (idempoten)
pnpm db:studio     # lihat isi database
```

Prisma client di-generate ke `Backend/generated/prisma` (tidak di-commit) dan dipakai kode server di `Backend/`. Backend tetap berjalan di dalam aplikasi Next.js (Opsi A, satu deploy), jadi Prisma menjadi pengelola skema dan migrasi.
