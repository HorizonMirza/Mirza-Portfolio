-- Permintaan pemilik 2026-10-08: terbitkan GAAS (General Affair Application Support). Isi diambil dari
-- dokumentasi repo HorizonMirza/GAAS-GeneralAffairApplicationSupport (README, Documentation/PRD.md)
-- dan CV; tidak memuat angka dampak, isi laporan audit, atau data nyata pengguna.
-- Tanpa foto dulu (pemilik mengirim menyusul, diunggah lewat Admin → Project).
-- Tautan repo diisi, tetapi tombol GitHub dimatikan (showRepo = false) karena README repo menyebut
-- proyek internal; pemilik bisa menyalakannya di admin. Tidak ada demo publik.
INSERT INTO "Project" ("id", "slug", "title_id", "title_en", "summary_id", "summary_en", "role_id", "role_en", "description_id", "description_en", "year", "category", "repoUrl", "githubRepo", "showDemo", "showRepo", "featured", "order", "status", "publishedAt", "updatedAt")
VALUES (gen_random_uuid(), 'gaas', 'GAAS: General Affair Application Support', 'GAAS: General Affair Application Support',
'Aplikasi internal multi-modul untuk operasional General Affair: pengiriman barang, pemesanan ruang dan kendaraan, ATK, perbaikan sarana, dan arsip, dengan persetujuan berjenjang.',
'An internal multi-module app for General Affair operations: shipments, room and vehicle booking, office supplies, facility repairs, and archives, with tiered approvals.',
'Fullstack Developer', 'Fullstack Developer',
'## Tentang project

GAAS adalah aplikasi web internal yang saya kembangkan saat magang di PT PGAS Solution untuk menggantikan proses operasional General Affair yang sebelumnya manual dan berbasis kertas.

## Modul

- Ekspedisi (pengiriman barang)
- Room Booking
- Vehicle Booking
- Office Supplies (permintaan ATK)
- Maintenance (perbaikan sarana)
- Archive (pemindahan arsip fisik)

## Alur dan fitur

- Persetujuan berjenjang sesuai struktur organisasi: Departemen/Divisi, Admin GA, lalu Approval GA, ditambah tahap Mitra untuk Ekspedisi dan Office Supplies.
- Nomor dokumen otomatis per divisi dan bulan, serta riwayat persetujuan di setiap pengajuan.
- Chat real-time per pengajuan dengan mention dan penanda belum dibaca.
- Kalender ketersediaan ruang dan kendaraan dengan deteksi bentrok jadwal.
- Export Excel dan PDF, slip PDF per dokumen, dashboard per peran, dan tema terang/gelap.
- Halaman Super Admin untuk mengelola organisasi dan pengguna.

## Teknologi

ASP.NET Core 8 (C#) dan Entity Framework Core, PostgreSQL, Next.js dan React dengan TypeScript, Tailwind CSS, SignalR, dan GitHub Actions.',
'## About the project

GAAS is an internal web application I built during my internship at PT PGAS Solution to replace General Affair processes that used to run manually on paper.

## Modules

- Expedition (shipments)
- Room Booking
- Vehicle Booking
- Office Supplies
- Maintenance (facility repairs)
- Archive (physical archive relocation)

## Flow and features

- Tiered approvals that follow the organization chart: Department/Division, GA Admin, then GA Approval, plus a partner stage for Expedition and Office Supplies.
- Automatic document numbers per division and month, with an approval history on every request.
- Real-time chat on each request with mentions and unread markers.
- Room and vehicle availability calendars with schedule conflict detection.
- Excel and PDF export, a PDF slip per document, role-based dashboards, and light/dark themes.
- A Super Admin area to manage the organization and users.

## Tech

ASP.NET Core 8 (C#) with Entity Framework Core, PostgreSQL, Next.js and React with TypeScript, Tailwind CSS, SignalR, and GitHub Actions.',
2026, 'SOFTWARE', 'https://github.com/HorizonMirza/GAAS-GeneralAffairApplicationSupport', 'HorizonMirza/GAAS-GeneralAffairApplicationSupport', true, false, true, 0, 'PUBLISHED', now(), now())
ON CONFLICT ("slug") DO UPDATE SET
  "title_id" = EXCLUDED."title_id", "title_en" = EXCLUDED."title_en",
  "summary_id" = EXCLUDED."summary_id", "summary_en" = EXCLUDED."summary_en",
  "role_id" = EXCLUDED."role_id", "role_en" = EXCLUDED."role_en",
  "description_id" = EXCLUDED."description_id", "description_en" = EXCLUDED."description_en",
  "repoUrl" = EXCLUDED."repoUrl", "githubRepo" = EXCLUDED."githubRepo", "showRepo" = EXCLUDED."showRepo",
  "featured" = true, "status" = 'PUBLISHED',
  "publishedAt" = COALESCE("Project"."publishedAt", now()), "updatedAt" = now();

-- Skill yang terverifikasi dipakai di repo GAAS; hanya yang sudah ada di menu Skill yang terhubung.
INSERT INTO "_ProjectToSkill" ("A", "B")
SELECT p."id", sk."id" FROM "Project" p, "Skill" sk
WHERE p."slug" = 'gaas'
  AND sk."name" IN ('TypeScript', 'Next.js', 'React', 'PostgreSQL', 'C#', 'ASP.NET Core', 'Entity Framework Core', 'Tailwind CSS', 'SignalR')
ON CONFLICT DO NOTHING;
