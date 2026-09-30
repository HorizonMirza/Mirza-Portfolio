# Backend

Folder ini disiapkan untuk API terpisah.

**Status:** belum ada kode. Pemilik ingin memakai stack seperti GAAS (ASP.NET Core Web API + Entity Framework Core + PostgreSQL + JWT di cookie httpOnly). Keputusan yang masih ditunggu:

- versi .NET (usulan: .NET 10 LTS, karena .NET 8 berakhir dukungannya November 2026)
- hosting backend (Render atau Koyeb, karena Vercel tidak menjalankan .NET)

Sampai backend ini dibuat, logika server yang ada (misalnya `/api/health`) masih berjalan di dalam Next.js, yaitu `frontend/src/app/api/`. Skema database ada di `database/`.

Rencana lengkap: [`documentation/ARCHITECTURE.md`](../documentation/ARCHITECTURE.md) dan [`documentation/TODO.md`](../documentation/TODO.md).
