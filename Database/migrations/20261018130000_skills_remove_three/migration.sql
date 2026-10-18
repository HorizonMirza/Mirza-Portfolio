-- Permintaan pemilik 2026-10-18: hapus NestJS, MongoDB, dan Docker dari Keahlian Teknis (34 jadi 31 skill).
-- Kaitan project ke skill ini ikut terhapus (ON DELETE CASCADE); tidak ada project terbit yang memakainya.
DELETE FROM "Skill" WHERE "name" IN ('NestJS', 'MongoDB', 'Docker');
