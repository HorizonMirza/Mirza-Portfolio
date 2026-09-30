# Database

PostgreSQL 16. Isi folder ini:

| Berkas | Isi |
|---|---|
| `schema.prisma` | Skema seluruh tabel (acuan: `documentation/ARCHITECTURE.md` bagian 5) |
| `migrations/` | Migrasi SQL yang diterapkan berurutan. Jangan diedit setelah di-commit, buat migrasi baru |
| `seed/seed-data.ts` | Data awal dari CV, tanpa email atau nomor telepon (diambil dari environment) |

Semua perintah dijalankan dari folder `frontend/`, karena Prisma CLI dan dependency-nya terpasang di sana (lihat `frontend/prisma.config.ts`):

```bash
cd frontend
pnpm db:migrate    # buat/terapkan migrasi saat pengembangan (menulis ke database/migrations/)
pnpm db:deploy     # terapkan migrasi di CI/production
pnpm db:seed       # jalankan data seed (idempoten)
pnpm db:studio     # lihat isi database
```

Backend berjalan di dalam Next.js (Opsi A), jadi Prisma tetap menjadi pengelola skema dan migrasi.
