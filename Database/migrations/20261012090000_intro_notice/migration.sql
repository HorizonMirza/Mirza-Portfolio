-- Pemberitahuan pembuka (pilihan pemilik 2026-10-12, demo 1 "Kartu tengah"): kartu singkat sebelum
-- masuk situs, muncul sekali setiap situs dibuka. Teks ID/EN diubah dari Admin → Pengaturan.
ALTER TABLE "SiteSetting" ADD COLUMN "introEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "introTitle_id" TEXT,
ADD COLUMN "introTitle_en" TEXT,
ADD COLUMN "introBody_id" TEXT,
ADD COLUMN "introBody_en" TEXT;

-- Isi awal dari data profil yang sudah tampil di situs (kampus, posisi sekarang, status kerja).
-- Hanya mengisi kolom yang masih kosong, jadi aman dijalankan pada database yang sudah berisi.
INSERT INTO "SiteSetting" ("id", "updatedAt", "introTitle_id", "introTitle_en", "introBody_id", "introBody_en")
VALUES (
  1,
  CURRENT_TIMESTAMP,
  'Sebelum masuk',
  'Before you enter',
  'Saya mahasiswa **S1 Ilmu Komputer (Kecerdasan Buatan) di BINUS** dan saat ini **Fullstack Developer & Asset Management Intern di PT PGAS Solution**. Saya terbuka untuk peluang kerja. CV saya merangkum pengalaman, pendidikan, dan skill.',
  'I study **Computer Science (Artificial Intelligence) at BINUS** and I am currently a **Fullstack Developer & Asset Management Intern at PT PGAS Solution**. I am open to job opportunities. My CV sums up my experience, education, and skills.'
)
ON CONFLICT ("id") DO UPDATE SET
  "introTitle_id" = COALESCE("SiteSetting"."introTitle_id", EXCLUDED."introTitle_id"),
  "introTitle_en" = COALESCE("SiteSetting"."introTitle_en", EXCLUDED."introTitle_en"),
  "introBody_id" = COALESCE("SiteSetting"."introBody_id", EXCLUDED."introBody_id"),
  "introBody_en" = COALESCE("SiteSetting"."introBody_en", EXCLUDED."introBody_en");
