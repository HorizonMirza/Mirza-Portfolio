-- Data: IPK kartu pendidikan BINUS diganti 3,5/4,0 (keputusan pemilik 2026-10-19, sesuai PDF portofolio
-- dan LinkedIn). Hanya mengubah isi bawaan 3,41 agar suntingan admin lain tidak tertimpa.
UPDATE "Experience" SET "description_id" = 'IPK kumulatif: 3,5/4,0'
WHERE "type" = 'EDUCATION' AND "description_id" = 'IPK kumulatif: 3,41/4,0';

UPDATE "Experience" SET "description_en" = 'Cumulative GPA: 3.5/4.0'
WHERE "type" = 'EDUCATION' AND "description_en" = 'Cumulative GPA: 3.41/4.0';
