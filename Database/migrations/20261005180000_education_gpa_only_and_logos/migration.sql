-- Data: kartu pendidikan BINUS hanya menampilkan IPK, baris "Mata kuliah relevan" dihapus (permintaan
-- pemilik 2026-10-05 malam). Hanya mengubah teks bawaan yang belum diedit lewat admin.
UPDATE "Experience" SET "description_id" = 'IPK kumulatif (sampai semester 5): 3,41/4,0'
WHERE "type" = 'EDUCATION' AND "organization" = 'BINUS University'
  AND "description_id" = E'IPK kumulatif (sampai semester 5): 3,41/4,0\n\nMata kuliah relevan: Web Application Development, Artificial Intelligence, Software Engineering.';

UPDATE "Experience" SET "description_en" = 'Cumulative GPA (up to the 5th semester): 3.41/4.0'
WHERE "type" = 'EDUCATION' AND "organization" = 'BINUS University'
  AND "description_en" = E'Cumulative GPA (up to the 5th semester): 3.41/4.0\n\nRelevant coursework: Web Application Development, Artificial Intelligence, Software Engineering.';

-- Data: logo pendidikan memakai logo yang sudah ada di halaman Pengalaman (permintaan pemilik):
-- SMAS Budi Luhur memakai logo Reader Ambassador (Budi Luhur), BINUS University memakai logo
-- Freshman (Student Support, BINUS University). Hanya mengisi bila logo pendidikan masih kosong.
UPDATE "Experience" AS e SET "logoId" = o."logoId"
FROM "Experience" AS o
WHERE e."type" = 'EDUCATION' AND e."organization" = 'SMAS Budi Luhur' AND e."logoId" IS NULL
  AND o."type" = 'ORGANIZATION' AND o."organization" = 'Budi Luhur' AND o."logoId" IS NOT NULL;

UPDATE "Experience" AS e SET "logoId" = o."logoId"
FROM "Experience" AS o
WHERE e."type" = 'EDUCATION' AND e."organization" = 'BINUS University' AND e."logoId" IS NULL
  AND o."type" = 'ORGANIZATION' AND o."organization" = 'Student Support, BINUS University' AND o."logoId" IS NOT NULL;
