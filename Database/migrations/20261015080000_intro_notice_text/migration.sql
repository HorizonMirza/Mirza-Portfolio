-- Teks pemberitahuan pembuka baru (revisi pemilik 2026-10-15): judul "Informasi Penting" dan isi
-- tentang peluang Fullstack Developer. Tetap bisa diubah dari Admin → Pengaturan.
UPDATE "SiteSetting"
SET
  "introTitle_id" = 'Informasi Penting',
  "introTitle_en" = 'Important Information',
  "introBody_id" = 'Saat ini saya sedang mencari peluang di bidang Fullstack Developer. Resume saya memberikan ringkasan paling padat tentang pengalaman, keahlian, dan latar belakang saya.',
  "introBody_en" = 'I am currently looking for opportunities as a Fullstack Developer. My resume gives the most concise summary of my experience, skills, and background.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 1;
