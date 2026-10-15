-- Posisi yang dicari tampil di pelat status beranda (audit Home 2026-10-15, PRD F1 "posisi yang
-- dicari"): "Terbuka untuk kerja · Mencari peluang Fullstack Developer". Kalimat diambil dari teks
-- pemberitahuan pembuka milik pemilik. Hanya mengisi kolom yang masih kosong, jadi isian pemilik di
-- Admin → Profil tidak tertimpa.
UPDATE "Profile"
SET
  "availabilityNote_id" = CASE
    WHEN COALESCE(TRIM("availabilityNote_id"), '') = '' THEN 'Mencari peluang Fullstack Developer'
    ELSE "availabilityNote_id"
  END,
  "availabilityNote_en" = CASE
    WHEN COALESCE(TRIM("availabilityNote_en"), '') = '' THEN 'Looking for Fullstack Developer opportunities'
    ELSE "availabilityNote_en"
  END,
  "updatedAt" = CURRENT_TIMESTAMP;
