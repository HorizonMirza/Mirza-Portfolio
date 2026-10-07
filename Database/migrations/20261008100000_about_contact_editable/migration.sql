-- Revisi pemilik 2026-10-07 malam: teks peran di halaman Tentang dan kartu ID Kontak bisa diubah
-- dari admin, dan nama instansi bisa berbeda per bahasa.
ALTER TABLE "Profile" ADD COLUMN "aboutRoles_id" TEXT,
ADD COLUMN "aboutRoles_en" TEXT,
ADD COLUMN "cardRole_id" TEXT,
ADD COLUMN "cardRole_en" TEXT;

ALTER TABLE "Experience" ADD COLUMN "organization_en" TEXT;

-- Isi awal sama dengan teks yang tampil sekarang, supaya langsung terlihat di form admin.
UPDATE "Profile" SET
  "aboutRoles_id" = 'Fullstack Developer | Community Manager',
  "aboutRoles_en" = 'Fullstack Developer | Community Manager',
  "cardRole_id" = 'Fullstack Developer',
  "cardRole_en" = 'Fullstack Developer'
WHERE "aboutRoles_id" IS NULL AND "cardRole_id" IS NULL;
