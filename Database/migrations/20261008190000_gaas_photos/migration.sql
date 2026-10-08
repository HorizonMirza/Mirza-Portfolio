-- Foto GAAS dari pemilik (2026-10-08). Tangkapan layar memakai data uji ("Uji Coba"); nomor telepon dan
-- email di halaman profil sudah disamarkan sebelum disimpan di repo. Foto pertama jadi sampul, sisanya
-- galeri sesuai urutan kiriman. Gambar bawaan repo memakai publicId `local-demo/` sehingga tidak pernah
-- dikirim ke Cloudinary saat diganti/dihapus lewat admin.

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/gaas-dashboard', '/images/projects/gaas-dashboard.jpg', 'IMAGE', 'jpg', 103798, 1518, 823, 'Dashboard GAAS: jumlah transaksi per modul, status transaksi, dan grafik status modul', 'GAAS dashboard: transactions per module, transaction status, and module status chart'
WHERE NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/gaas-dashboard');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/gaas-expedition', '/images/projects/gaas-expedition.jpg', 'IMAGE', 'jpg', 66927, 1533, 822, 'Ringkasan modul Expedition dengan antrean persetujuan dan tahapan dokumen', 'Expedition module overview with the approval queue and document stages'
WHERE NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/gaas-expedition');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/gaas-room-booking', '/images/projects/gaas-room-booking.jpg', 'IMAGE', 'jpg', 118991, 1520, 822, 'Ringkasan Room Booking: daftar ruang dan pesanan terbaru dengan tahapan persetujuan', 'Room Booking overview: rooms and recent bookings with approval stages'
WHERE NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/gaas-room-booking');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/gaas-room-calendar', '/images/projects/gaas-room-calendar.jpg', 'IMAGE', 'jpg', 104539, 1535, 820, 'Kalender ketersediaan ruang per jam untuk semua ruang rapat', 'Hourly room availability calendar for every meeting room'
WHERE NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/gaas-room-calendar');

INSERT INTO "Asset" ("id", "publicId", "url", "kind", "format", "bytes", "width", "height", "alt_id", "alt_en")
SELECT gen_random_uuid(), 'local-demo/projects/gaas-profile', '/images/projects/gaas-profile.jpg', 'IMAGE', 'jpg', 55860, 1535, 821, 'Halaman profil pengguna dalam tema gelap (nomor telepon dan email disamarkan)', 'User profile page in the dark theme (phone number and email hidden)'
WHERE NOT EXISTS (SELECT 1 FROM "Asset" WHERE "publicId" = 'local-demo/projects/gaas-profile');

UPDATE "Project" p SET "coverId" = a."id"
FROM "Asset" a
WHERE p."slug" = 'gaas' AND p."coverId" IS NULL AND a."publicId" = 'local-demo/projects/gaas-dashboard';

INSERT INTO "ProjectImage" ("id", "projectId", "assetId", "order")
SELECT gen_random_uuid(), p."id", a."id", 0 FROM "Project" p, "Asset" a
WHERE p."slug" = 'gaas' AND a."publicId" = 'local-demo/projects/gaas-expedition'
ON CONFLICT ("projectId", "assetId") DO NOTHING;

INSERT INTO "ProjectImage" ("id", "projectId", "assetId", "order")
SELECT gen_random_uuid(), p."id", a."id", 1 FROM "Project" p, "Asset" a
WHERE p."slug" = 'gaas' AND a."publicId" = 'local-demo/projects/gaas-room-booking'
ON CONFLICT ("projectId", "assetId") DO NOTHING;

INSERT INTO "ProjectImage" ("id", "projectId", "assetId", "order")
SELECT gen_random_uuid(), p."id", a."id", 2 FROM "Project" p, "Asset" a
WHERE p."slug" = 'gaas' AND a."publicId" = 'local-demo/projects/gaas-room-calendar'
ON CONFLICT ("projectId", "assetId") DO NOTHING;

INSERT INTO "ProjectImage" ("id", "projectId", "assetId", "order")
SELECT gen_random_uuid(), p."id", a."id", 3 FROM "Project" p, "Asset" a
WHERE p."slug" = 'gaas' AND a."publicId" = 'local-demo/projects/gaas-profile'
ON CONFLICT ("projectId", "assetId") DO NOTHING;
