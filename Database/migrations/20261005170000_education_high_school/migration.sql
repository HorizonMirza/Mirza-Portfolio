-- Data: SMA pemilik dari LinkedIn (2026-10-05): SMAS Budi Luhur, SMA IPA, 2021-2024, nilai 88,3.
-- Hanya tahun yang diketahui; bulan pada tanggal hanya untuk urutan dan tidak ditampilkan.
-- Tidak menambah bila entri Pendidikan dengan instansi yang sama sudah ada.
INSERT INTO "Experience" ("id", "type", "organization", "title_id", "title_en", "description_id", "description_en", "startDate", "endDate", "location", "order", "status", "updatedAt")
SELECT 'f13e36cc-0867-5170-8be3-362dc68436de'::uuid, 'EDUCATION', 'SMAS Budi Luhur',
  'SMA IPA', 'Senior High School, SMA IPA',
  'Nilai: 88,3', 'Grade: 88.3',
  DATE '2021-07-01', DATE '2024-06-01', 'Tangerang', 98, 'PUBLISHED', now()
WHERE NOT EXISTS (SELECT 1 FROM "Experience" WHERE "type" = 'EDUCATION' AND "organization" = 'SMAS Budi Luhur');
