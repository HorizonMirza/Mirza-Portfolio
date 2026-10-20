# Backend

Keputusan 2026-09-30: **Opsi A, Next.js full-stack.** Tidak ada server backend terpisah. Logika server berjalan di dalam aplikasi Next.js di `Frontend/`, lalu di-deploy bersama ke Vercel.

Folder ini menjadi peta lokasi kode backend:

| Bagian backend | Lokasi |
|---|---|
| Route handler / API (`/api/health`, `/api/v1/*` read-only, `/api/cv`, `/api/track`, `/api/cron/daily`, `/api/auth/*`) | `Frontend/src/app/api/` |
| Form publik (kontak, konfirmasi/berhenti newsletter) | Server Actions di `Frontend/src/features/<domain>/public-actions.ts` |
| Mutasi admin (Server Actions: validasi Zod, cek `SUPER_ADMIN`, tulis `AuditLog`) | `Frontend/src/features/<domain>/actions.ts` |
| Query data | `Frontend/src/features/<domain>/queries.ts` (admin) dan `public.ts` (situs publik, di-cache) |
| Koneksi database, env, auth, layanan pihak ketiga | `Frontend/src/lib/` |
| Pengalihan bahasa dan perlindungan `/admin` | `Frontend/src/proxy.ts` |
| Skema, migrasi, dan data seed | `Database/` |

Alasan memilih Opsi A dan alternatif yang tidak dipilih (ASP.NET Core seperti GAAS, FastAPI): `Documentation/ARCHITECTURE.md` bagian 12.
