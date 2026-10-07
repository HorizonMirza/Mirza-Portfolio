-- Data: judul pengalaman sesuai permintaan pemilik (2026-10-07). Hanya mengubah teks bawaan yang belum
-- diedit lewat admin.

-- "(Volunteer)" / "(Relawan)" dihapus dari judul Freshmen Partner (jenis pekerjaan tetap tampil di baris instansi).
UPDATE "Experience" SET
  "title_en" = regexp_replace("title_en", '\s*\((Volunteer|Relawan)\)\s*$', ''),
  "title_id" = regexp_replace("title_id", '\s*\((Volunteer|Relawan)\)\s*$', '')
WHERE "organization" = 'Student Support, BINUS University'
  AND ("title_en" ~ '\((Volunteer|Relawan)\)\s*$' OR "title_id" ~ '\((Volunteer|Relawan)\)\s*$');

-- "Chairman, Reader Ambassador" sama di kedua bahasa: tidak diterjemahkan saat ganti bahasa.
UPDATE "Experience" SET "title_id" = "title_en"
WHERE "organization" = 'Budi Luhur' AND "type" = 'ORGANIZATION'
  AND "title_en" = 'Chairman, Reader Ambassador' AND "title_id" = 'Ketua Reader Ambassador';
