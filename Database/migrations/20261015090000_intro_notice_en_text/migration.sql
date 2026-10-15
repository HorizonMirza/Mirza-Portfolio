-- Teks Inggris pemberitahuan pembuka dirapikan (revisi pemilik 2026-10-15): susunan kalimat yang
-- celah antarkatanya paling kecil saat rata kiri-kanan di laptop dan HP. Arti sama dengan versi ID.
UPDATE "SiteSetting"
SET
  "introBody_en" = 'I am currently looking for Fullstack Developer opportunities. My resume is the most concise summary of my experience, skills, and background.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 1;
