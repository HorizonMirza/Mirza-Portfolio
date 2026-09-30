# Backend

Keputusan 2026-09-30: **Opsi A, Next.js full-stack.** Tidak ada server backend terpisah. Logika server berjalan di dalam aplikasi Next.js di `frontend/`, lalu di-deploy bersama ke Vercel.

Folder ini menjadi peta lokasi kode backend:

| Bagian backend | Lokasi |
|---|---|
| Route handler / API (`/api/health`, `/api/contact`, `/api/v1/*`, ...) | `frontend/src/app/api/` |
| Mutasi admin (Server Actions: validasi Zod, cek `SUPER_ADMIN`, tulis `AuditLog`) | `frontend/src/features/<domain>/actions.ts` (mulai M2) |
| Query data | `frontend/src/features/<domain>/queries.ts` (mulai M2) |
| Koneksi database, env, auth, layanan pihak ketiga | `frontend/src/lib/` |
| Pengalihan bahasa dan perlindungan `/admin` | `frontend/src/proxy.ts` |
| Skema, migrasi, dan data seed | `database/` |

Alasan memilih Opsi A dan alternatif yang tidak dipilih (ASP.NET Core seperti GAAS, FastAPI): `documentation/ARCHITECTURE.md` bagian 12.
