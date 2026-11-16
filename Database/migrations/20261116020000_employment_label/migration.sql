-- Jenis pekerjaan sebagai teks bebas per bahasa (revisi pemilik 2026-11-16). Kolom enum lama tetap
-- dipakai sebagai cadangan sampai entri disimpan ulang dari admin.
ALTER TABLE "Experience" ADD COLUMN "employmentLabel_id" VARCHAR(60),
ADD COLUMN "employmentLabel_en" VARCHAR(60);
