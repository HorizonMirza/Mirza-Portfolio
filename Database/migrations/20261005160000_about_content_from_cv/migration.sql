-- Data: isi halaman Tentang disesuaikan dengan CV terbaru pemilik (2026-10-05). Hanya mengganti teks
-- bawaan seed yang belum diubah lewat admin; yang sudah diedit pemilik tidak disentuh.
UPDATE "Profile" SET "bio_id" = 'Mahasiswa Computer Science di Bina Nusantara University dengan peminatan Artificial Intelligence dan minat besar pada inovasi teknologi. Saya telah membangun fondasi yang kuat di Full-Stack Development dan teknologi AI, sambil aktif menjelajahi ekosistem kripto. Di luar latar belakang teknis, saya adalah pembangun komunitas yang telah mengembangkan berbagai inisiatif, mulai dari bisnis voucher game digital hingga komunitas padel dengan lebih dari 1.000 anggota.'
WHERE "id" = 1 AND "bio_id" = 'Saya mahasiswa Computer Science (Artificial Intelligence) di BINUS University. Saya membangun aplikasi fullstack dan komunitas, dari komunitas gaming dan turnamen hingga komunitas padel dengan lebih dari 1.000 anggota.';

UPDATE "Profile" SET "bio_en" = 'Computer Science student at Bina Nusantara University, specializing in Artificial Intelligence with a deep passion for technological innovation. I have built a strong foundation in both Full-Stack Development and AI technologies, while actively exploring the cryptocurrency ecosystem. Beyond my technical background, I am a proven community builder who has successfully grown various initiatives, ranging from a digital game voucher business to a padel community with over 1,000 members.'
WHERE "id" = 1 AND "bio_en" = 'I am a Computer Science (Artificial Intelligence) student at BINUS University. I build fullstack applications and communities, from gaming communities and tournaments to a padel community with over 1,000 members.';

UPDATE "Experience" SET "description_id" = E'IPK kumulatif (sampai semester 5): 3,41/4,0\n\nMata kuliah relevan: Web Application Development, Artificial Intelligence, Software Engineering.'
WHERE "type" = 'EDUCATION' AND "organization" = 'BINUS University'
  AND "description_id" = 'Mata kuliah relevan: Web Application Development, Artificial Intelligence, Software Engineering.';

UPDATE "Experience" SET "description_en" = E'Cumulative GPA (up to the 5th semester): 3.41/4.0\n\nRelevant coursework: Web Application Development, Artificial Intelligence, Software Engineering.'
WHERE "type" = 'EDUCATION' AND "organization" = 'BINUS University'
  AND "description_en" = 'Relevant coursework: Web Application Development, Artificial Intelligence, Software Engineering.';

-- Data: halaman Tentang menampilkan pendidikan dari entri Pengalaman bertipe Pendidikan. Bila belum ada
-- satu pun entri Pendidikan (mis. sudah dihapus dari admin), tambahkan BINUS dari CV supaya bagian
-- Pendidikan tidak kosong. Bila entri sudah ada (terbit atau draf), tidak ada yang diubah.
INSERT INTO "Experience" ("id", "type", "organization", "title_id", "title_en", "description_id", "description_en", "startDate", "endDate", "location", "order", "status", "updatedAt")
SELECT 'c7fc3861-5c25-590a-9232-5bd55ba4af9f'::uuid, 'EDUCATION', 'BINUS University',
  'S1 Computer Science – Artificial Intelligence', 'Bachelor of Computer Science – Artificial Intelligence',
  E'IPK kumulatif (sampai semester 5): 3,41/4,0\n\nMata kuliah relevan: Web Application Development, Artificial Intelligence, Software Engineering.',
  E'Cumulative GPA (up to the 5th semester): 3.41/4.0\n\nRelevant coursework: Web Application Development, Artificial Intelligence, Software Engineering.',
  DATE '2024-09-01', NULL, 'Tangerang', 99, 'PUBLISHED', now()
WHERE NOT EXISTS (SELECT 1 FROM "Experience" WHERE "type" = 'EDUCATION');
