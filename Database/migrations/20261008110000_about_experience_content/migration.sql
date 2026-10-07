-- Data: isi halaman Pengalaman dan Tentang sesuai teks yang dikirim pemilik (2026-10-07 malam).
-- Teks ini permintaan langsung pemilik, jadi menimpa isi sekarang. Dicocokkan lewat nama instansi
-- dan jenis; entri yang namanya sudah diganti di admin tidak tersentuh.

-- Pengalaman
UPDATE "Experience" SET
  "description_en" = E'- Reached 300+ active members on WhatsApp.\n- Achieved 5.0/5.0 rating on Ayo platform.\n- Reached 1,000+ members on Reclub.',
  "description_id" = E'- Mencapai 300+ anggota aktif di WhatsApp.\n- Meraih rating 5,0/5,0 di platform Ayo.\n- Mencapai 1.000+ anggota di Reclub.'
WHERE "organization" = 'Ace Padel Club' AND "type" = 'WORK';

UPDATE "Experience" SET
  "description_en" = E'- Enrolled 30+ students in the bootcamp program.\n- Mentored students in building early understanding of first-semester Computer Science materials.',
  "description_id" = E'- Mendaftarkan 30+ siswa ke program bootcamp.\n- Membimbing siswa membangun pemahaman awal materi Ilmu Komputer semester pertama.'
WHERE "organization" = 'Algo Bootcamp' AND "type" = 'WORK';

UPDATE "Experience" SET
  "description_en" = E'- Successfully organized tournaments with 128+ participants per event.\n- Secured school level sponsorship collaborations.',
  "description_id" = E'- Berhasil menyelenggarakan turnamen dengan 128+ peserta per acara.\n- Mendapatkan kerja sama sponsor tingkat sekolah.'
WHERE "organization" = 'Horizon Organizer' AND "type" = 'WORK';

UPDATE "Experience" SET
  "description_en" = E'- As a Freshman Partner to mentor and support new students throughout their first academic year (Semester 1–2).\n- As a Freshman Leader to mentor and guide new students during the First Year Program (FYP).',
  "description_id" = E'- Sebagai Freshman Partner, mendampingi dan mendukung mahasiswa baru sepanjang tahun akademik pertama (Semester 1–2).\n- Sebagai Freshman Leader, mendampingi dan membimbing mahasiswa baru selama First Year Program (FYP).'
WHERE "organization" = 'Student Support, BINUS University' AND "type" = 'ORGANIZATION';

UPDATE "Experience" SET
  "title_en" = 'Chairman Reader Ambassador',
  "title_id" = 'Chairman Reader Ambassador',
  "description_en" = E'- Led and coordinated the Reader Ambassador team.',
  "description_id" = E'- Memimpin dan mengoordinasikan tim Reader Ambassador.'
WHERE "organization" = 'Budi Luhur' AND "type" = 'ORGANIZATION';

-- Pendidikan: nama instansi dan jurusan per bahasa, IPK tanpa keterangan semester
UPDATE "Experience" SET
  "organization_en" = 'Budi Luhur Senior High School',
  "title_id" = 'SMA, Jurusan IPA',
  "title_en" = 'Senior High School, Natural Sciences'
WHERE "organization" = 'SMAS Budi Luhur' AND "type" = 'EDUCATION';

UPDATE "Experience" SET
  "organization" = 'Universitas Bina Nusantara',
  "organization_en" = 'Bina Nusantara University',
  "title_id" = 'S1 Ilmu Komputer – Kecerdasan Buatan',
  "title_en" = 'Bachelor of Computer Science – Artificial Intelligence',
  "description_id" = 'IPK kumulatif: 3,41/4,0',
  "description_en" = 'Cumulative GPA: 3.41/4.0'
WHERE "organization" = 'BINUS University' AND "type" = 'EDUCATION';

-- Tentang saya
UPDATE "Profile" SET
  "bio_en" = 'Computer Science student at Bina Nusantara University, specializing in Artificial Intelligence with a deep passion for technological innovation. At 20 years old, I have built a strong foundation in both Full-Stack Development and AI technologies, while actively exploring the cryptocurrency ecosystem. Beyond my technical background, I am a proven community builder who has successfully grown various initiatives, ranging from a digital game voucher business to a padel community with over 1,000 members.',
  "bio_id" = 'Mahasiswa Ilmu Komputer di Universitas Bina Nusantara dengan peminatan Artificial Intelligence dan minat besar pada inovasi teknologi. Di usia 20 tahun, saya telah membangun fondasi yang kuat di Full-Stack Development dan teknologi AI, sambil aktif menjelajahi ekosistem kripto. Di luar latar belakang teknis, saya adalah pembangun komunitas yang telah mengembangkan berbagai inisiatif, mulai dari bisnis voucher game digital hingga komunitas padel dengan lebih dari 1.000 anggota.'
WHERE "id" = 1;
