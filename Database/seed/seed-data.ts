// Data awal dari CV (Documentation/CONTENT.md). Jangan menambah fakta yang tidak ada di CV atau
// belum dikonfirmasi pemilik. Email dan nomor telepon TIDAK ditulis di sini, tetapi dibaca
// dari environment (SEED_PROFILE_EMAIL, SEED_PROFILE_WHATSAPP) saat seed dijalankan.

type Bilingual = { id: string; en: string };

export type SeedProfile = {
  name: string;
  headline: Bilingual;
  bio: Bilingual;
  city: string;
  socials: Record<string, string>;
  currentRole: Bilingual;
  aboutRoles: Bilingual;
  cardRole: Bilingual;
};

export type SeedExperience = {
  key: string;
  type: "WORK" | "EDUCATION" | "ORGANIZATION";
  organization: string;
  // nama bahasa Inggris bila berbeda (mis. "Bina Nusantara University")
  organizationEn?: string;
  title: Bilingual;
  description: Bilingual;
  startDate: string;
  endDate: string | null;
  location: string;
  employmentType?: "INTERNSHIP" | "VOLUNTEER";
};

export type SeedSkillCategory = {
  key: string;
  name: Bilingual;
  skills: string[];
};

export type SeedProject = {
  slug: string;
  title: Bilingual;
  summary: Bilingual;
  description: Bilingual;
  year: number;
  category: "SOFTWARE" | "COMMUNITY_BUSINESS";
  skills: string[];
};

export const profile: SeedProfile = {
  // TODO(konten): nama tampilan di hero masih ditanyakan (CONTENT.md bagian 10 no. 1)
  name: "Muhammad Mirza Wirya",
  // TODO(konten): kalimat hero masih draf (CONTENT.md bagian 2)
  headline: {
    id: "Mahasiswa AI BINUS yang membangun software dan komunitas.",
    en: "AI student at BINUS who builds software and communities.",
  },
  bio: {
    id: "Mahasiswa Ilmu Komputer di Universitas Bina Nusantara dengan peminatan Artificial Intelligence dan minat besar pada inovasi teknologi. Di usia 20 tahun, saya telah membangun fondasi yang kuat di Full-Stack Development dan teknologi AI, sambil aktif menjelajahi ekosistem kripto. Di luar latar belakang teknis, saya adalah pembangun komunitas yang telah mengembangkan berbagai inisiatif, mulai dari bisnis voucher game digital hingga komunitas padel dengan lebih dari 1.000 anggota.",
    en: "Computer Science student at Bina Nusantara University, specializing in Artificial Intelligence with a deep passion for technological innovation. At 20 years old, I have built a strong foundation in both Full-Stack Development and AI technologies, while actively exploring the cryptocurrency ecosystem. Beyond my technical background, I am a proven community builder who has successfully grown various initiatives, ranging from a digital game voucher business to a padel community with over 1,000 members.",
  },
  city: "Tangerang",
  socials: {
    linkedin: "https://www.linkedin.com/in/muhammad-mirza-wirya",
    github: "https://github.com/HorizonMirza",
  },
  // TODO(konten): nama perusahaan (PT PGAS Solution vs PGN Solution) masih ditanyakan
  currentRole: {
    id: "Fullstack Developer & Asset Management Intern di PT PGAS Solution",
    en: "Fullstack Developer & Asset Management Intern at PT PGAS Solution",
  },
  aboutRoles: {
    id: "Fullstack Developer | Community Manager",
    en: "Fullstack Developer | Community Manager",
  },
  cardRole: { id: "Fullstack Developer", en: "Fullstack Developer" },
};

export const experiences: SeedExperience[] = [
  {
    key: "pgas-solution",
    type: "WORK",
    organization: "PT PGAS Solution",
    title: {
      id: "Fullstack Developer & Asset Management Intern",
      en: "Fullstack Developer & Asset Management Intern",
    },
    description: {
      id: "- Mengembangkan GAAS, aplikasi internal untuk operasional General Affair.\n- Berkontribusi pada SMART, aplikasi manajemen aset dan inventaris.\n- Membantu tim Asset Management dalam audit dan stocktaking inventaris gudang.",
      en: "- Developed GAAS, an internal application for General Affair operations.\n- Contributed to SMART, an asset and inventory management application.\n- Assisted the Asset Management team with warehouse inventory audits and stocktaking.",
    },
    startDate: "2026-07-01",
    endDate: null,
    location: "Jakarta",
    // dikonfirmasi pemilik 2026-10-04
    employmentType: "INTERNSHIP",
  },
  {
    key: "ace-padel-club",
    type: "WORK",
    organization: "Ace Padel Club",
    title: {
      id: "Founder & Community Leader",
      en: "Founder & Community Leader",
    },
    description: {
      id: "- Mencapai 300+ anggota aktif di WhatsApp.\n- Meraih rating 5,0/5,0 di platform Ayo.\n- Mencapai 1.000+ anggota di Reclub.",
      en: "- Reached 300+ active members on WhatsApp.\n- Achieved 5.0/5.0 rating on Ayo platform.\n- Reached 1,000+ members on Reclub.",
    },
    startDate: "2025-05-01",
    endDate: "2026-04-30",
    location: "Tangerang",
  },
  {
    key: "algo-bootcamp",
    type: "WORK",
    organization: "Algo Bootcamp",
    title: { id: "Student Tutor", en: "Student Tutor" },
    description: {
      id: "- Mendaftarkan 30+ siswa ke program bootcamp.\n- Membimbing siswa membangun pemahaman awal materi Ilmu Komputer semester pertama.",
      en: "- Enrolled 30+ students in the bootcamp program.\n- Mentored students in building early understanding of first-semester Computer Science materials.",
    },
    startDate: "2025-07-01",
    endDate: "2025-09-30",
    location: "Tangerang",
  },
  {
    key: "horizon-organizer",
    type: "WORK",
    organization: "Horizon Organizer",
    title: {
      id: "Founder & Tournament Organizer",
      en: "Founder & Tournament Organizer",
    },
    description: {
      id: "- Berhasil menyelenggarakan turnamen dengan 128+ peserta per acara.\n- Mendapatkan kerja sama sponsor tingkat sekolah.",
      en: "- Successfully organized tournaments with 128+ participants per event.\n- Secured school level sponsorship collaborations.",
    },
    startDate: "2023-05-01",
    endDate: "2023-10-31",
    location: "Tangerang",
  },
  {
    key: "warnet-mobile",
    type: "WORK",
    organization: "Warnet Mobile",
    title: { id: "Founder & Admin", en: "Founder & Admin" },
    description: {
      id: "- Mengembangkan komunitas gaming hingga 1.000+ anggota.\n- Memperoleh 1.000+ pelanggan berulang.",
      en: "- Grew the gaming community to 1,000+ members.\n- Acquired 1,000+ repeat customers.",
    },
    startDate: "2021-01-01",
    endDate: "2022-12-31",
    location: "Tangerang",
  },
  {
    key: "binus-student-support",
    type: "ORGANIZATION",
    organization: "Student Support, BINUS University",
    title: {
      id: "Freshmen Partner & Freshman Leader",
      en: "Freshmen Partner & Freshman Leader",
    },
    description: {
      id: "- Sebagai Freshman Partner, mendampingi dan mendukung mahasiswa baru sepanjang tahun akademik pertama (Semester 1–2).\n- Sebagai Freshman Leader, mendampingi dan membimbing mahasiswa baru selama First Year Program (FYP).",
      en: "- As a Freshman Partner to mentor and support new students throughout their first academic year (Semester 1–2).\n- As a Freshman Leader to mentor and guide new students during the First Year Program (FYP).",
    },
    startDate: "2025-08-01",
    endDate: "2026-01-31",
    location: "Tangerang",
  },
  {
    key: "budi-luhur-reader-ambassador",
    type: "ORGANIZATION",
    organization: "Budi Luhur",
    // judul sama di kedua bahasa, tanpa koma (permintaan pemilik 2026-10-07)
    title: {
      id: "Chairman Reader Ambassador",
      en: "Chairman Reader Ambassador",
    },
    description: {
      id: "- Memimpin dan mengoordinasikan tim Reader Ambassador.",
      en: "- Led and coordinated the Reader Ambassador team.",
    },
    startDate: "2022-02-01",
    endDate: "2023-01-31",
    location: "Tangerang",
  },
  {
    key: "smas-budi-luhur",
    type: "EDUCATION",
    organization: "SMAS Budi Luhur",
    organizationEn: "Budi Luhur Senior High School",
    title: {
      id: "SMA, Jurusan IPA",
      en: "Senior High School, Natural Sciences",
    },
    // dari LinkedIn pemilik (2026-10-05): hanya tahun yang diketahui, bulan 07 dan 06 hanya untuk urutan
    description: {
      id: "Nilai: 88,3",
      en: "Grade: 88.3",
    },
    startDate: "2021-07-01",
    endDate: "2024-06-01",
    location: "Tangerang",
  },
  {
    key: "binus-university",
    type: "EDUCATION",
    // "Bina Nusantara", bukan "BINUS" (permintaan pemilik 2026-10-07)
    organization: "Universitas Bina Nusantara",
    organizationEn: "Bina Nusantara University",
    title: {
      id: "S1 Ilmu Komputer – Kecerdasan Buatan",
      en: "Bachelor of Computer Science – Artificial Intelligence",
    },
    // IPK dari CV terbaru pemilik (2026-10-05); keterangan semester dihapus agar satu baris
    description: {
      id: "IPK kumulatif: 3,41/4,0",
      en: "Cumulative GPA: 3.41/4.0",
    },
    startDate: "2024-09-01",
    endDate: null,
    location: "Tangerang",
  },
];

export const skillCategories: SeedSkillCategory[] = [
  {
    key: "languages",
    name: { id: "Bahasa Pemrograman", en: "Programming Languages" },
    skills: ["TypeScript", "JavaScript", "Python", "C++", "HTML", "CSS"],
  },
  {
    key: "frameworks-tools",
    name: { id: "Framework & Tools", en: "Frameworks & Tools" },
    skills: ["React", "Next.js", "PostgreSQL", "Git"],
  },
  {
    key: "other",
    name: { id: "Lainnya", en: "Other" },
    skills: [
      "Project Management",
      "Community Management",
      "Digital Marketing",
      "MS Office",
    ],
  },
];

// Seed membuat GAAS sebagai DRAFT bila belum ada. Versi terbit (isi lengkap, peran, repo) dibuat oleh
// migrasi 20261008180000_publish_gaas atas permintaan pemilik 2026-10-08.
export const projects: SeedProject[] = [
  {
    slug: "gaas",
    title: {
      id: "GAAS: General Affair Application Support",
      en: "GAAS: General Affair Application Support",
    },
    summary: {
      id: "Platform internal multi-modul untuk operasional General Affair: pengiriman barang, pemesanan ruang dan kendaraan, permintaan ATK, perbaikan sarana, dan pemindahan arsip, dengan persetujuan berjenjang dan chat real-time di tiap pengajuan.",
      en: "An internal multi-module platform for General Affair operations: shipments, room and vehicle booking, office-supply requests, facility repairs, and archive relocation, with tiered approvals and per-request real-time chat.",
    },
    description: {
      id: "Aplikasi web internal yang menggantikan proses manual untuk enam kebutuhan operasional kantor. Setiap pengajuan melewati persetujuan berjenjang sesuai struktur organisasi, punya riwayat persetujuan, nomor dokumen otomatis, dan bisa diekspor ke Excel atau PDF.",
      en: "An internal web application that replaces manual processes for six office operations. Every request goes through tiered approvals that follow the organization chart, with an approval history, automatic document numbering, and Excel or PDF export.",
    },
    year: 2026,
    category: "SOFTWARE",
    // hanya skill yang ada di CV dan terverifikasi dipakai di repo GAAS
    skills: ["TypeScript", "Next.js", "React", "PostgreSQL"],
  },
];
