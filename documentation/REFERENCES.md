# REFERENCES — Analisis Referensi

Tanggal analisis: 2026-09-30. Prioritas: **Referensi 1 (utama)**, lalu 2, 3, 4.
Tujuan: mengambil **prinsip**, bukan menyalin tampilan atau teks. Dokumen `DESIGN.md` dan `PRD.md` belum diubah, menunggu keputusan di bagian 6.

## Cara Analisis dan Batasannya

- Sumber: HTML, CSS, dan JavaScript tiap situs yang diunduh, plus screenshot Chromium.
- **Screenshot Referensi 1 dan 2 tidak dapat diandalkan.** Aset dan CSS-nya gagal dimuat lewat proxy sesi ini (Referensi 1 sendiri menampilkan banner "ASSET FAILED"). Jadi tampilan visual keduanya **belum saya lihat dengan benar**. Yang saya simpulkan berasal dari kode dan teksnya, bukan dari tampilan akhir.
- Screenshot Referensi 3 dan 4 (Framer) dapat dirender, tetapi hanya bagian hero. Gerak dan animasi scroll-nya belum saya amati.
- Yang tidak bisa saya nilai: kehalusan animasi, rasa scroll, dan tampilan mobile nyata. Untuk itu, screenshot atau rekaman dari perangkat Anda sangat membantu.

## 1. Referensi 1 — ibnuhakim.id (utama)

Portofolio Full Stack Developer (Laravel), dirender di server, satu halaman panjang.

### Struktur

| Urutan | Bagian | Isi |
|---|---|---|
| — | Loader | Logo "IHN" dan bilah progres sebelum konten tampil |
| 1 | **Hero** | Nama, 3D/WebGL di atas potret, pelat status: `developer_001` · "Open to Work" · lokasi · tahun tersedia · angka (Projects 12, Certificates 7, Roles 4, IPK) · tombol *download cv* dan *view work* |
| 2 | Journey (`#season`) | Kalimat pembuka, daftar skill dengan angka (Laravel 95 dan seterusnya), alat AI yang dipakai |
| 3 | Timeline (`#timeline`) | Perjalanan "dari mahasiswa ke shipping", digambar sebagai jalur sirkuit |
| 4 | Selected work (`#paddock`, `#work`) | 12 project bernomor: kategori, tahun, judul, deskripsi satu kalimat, tech stack, tautan *Live Site*/*Documentation* |
| 5 | Personal (`#driver`) | Satu paragraf personal, tiga foto/keterangan di luar pekerjaan |
| 6 | Deck (`#deck`) | PDF 15 slide "semua isi halaman ini" untuk diteruskan ke orang lain |
| 7 | Certificates | Kartu sertifikat dengan modal pratinjau dan unduh |
| 8 | Contact | "let's build something." + email, unduh CV, deck, tesis, dan form |
| — | Footer | Navigasi, CTA CV, sosial (Instagram, GitHub, LinkedIn, TikTok, YouTube) |
| — | Chatbot AI | Tombol melayang, "Ibnu's AI Assistant", saran pertanyaan (Tentang, Projects, Hobi, Kontak), tertulis "Powered by Claude" |

Navigasi: About · Journey · Work · Certificates · Contact, plus tombol **[ Hire Me → ]**.
Tidak ada tombol tema terang/gelap maupun toggle bahasa yang saya temukan di kodenya. Bahasa tercampur (ID dan EN).

### Gaya visual (dari CSS)

- **Metafora tunggal:** seluruh situs bertema balap F1 (`season`, `paddock`, `driver`, sirkuit, bendera kotak-kotak, `developer_001` seperti nomor pembalap). Metafora ini yang membuatnya berkesan, bukan efek tunggal.
- **Warna:** tinta gelap (`#090A0B`, `#0E0F14`), es terang (`#F7FAFB`), aksen **cyan `#02D2E3`**, aksen kedua **oranye `#FF6B00`** (dipakai untuk pesan penting/galat).
- **Font:** Oswald (judul, kondensed, huruf besar) dan Space Grotesk (isi).
- **Bentuk:** tepi tegas dengan sudut terpotong, tanpa bayangan lembut, banyak garis dan grid.
- **Judul bagian** huruf kecil dengan titik beraksen: "selected work.", "the certificates."
- **Token dua tingkat:** warna dan ukuran mentah (`--raw-*`) lalu token semantik. Praktik yang baik.
- **Breakpoint:** 640, 768, 1024, 1280 px, plus penanganan layar pendek (`max-height: 500px`) dan `hover: hover`.

### Teknis (dari JavaScript)

- **three.js dan Lenis** (scroll halus) adalah satu-satunya kode luar. Pegas (spring), ticker bersama, pemicu scroll, animasi teks, dan sticky stack **ditulis sendiri**.
- **Hero WebGL:** helm 3D (glTF terkompresi Draco) di atas foto, area terbuka mengikuti kursor, peta kontur di latar. Komentar kodenya menyebut desainnya diadaptasi dari situs lain, jadi konsepnya turunan, bukan orisinal.
- **Tier perangkat:** ponsel, tablet, desktop punya DPR maksimum, jumlah sampel, dan antialias yang berbeda. Hemat energi (`saveData`, memori ≤ 2 GB) membekukan adegan. `prefers-reduced-motion` juga dipatuhi.
- **Sticky stack:** bagian sebelumnya mengecil dan menggelap saat bagian berikutnya naik. Dimatikan di ponsel.
- **Animasi teks per kata/huruf** dengan salinan `sr-only` untuk pembaca layar.
- **Data** disuntik server sebagai satu blok JSON. Form kontak dan chatbot memakai `fetch` dengan token CSRF.
- **Bobot yang terukur:** `site.js` ±59 KB (terkirim), foto hero `person.webp` ±279 KB, tekstur `noise.webp` ±10 KB. three.js diambil dari CDN (modul utama >100 KB, belum termasuk modul inti dan model helm). Total tepatnya tidak saya ukur.

### Yang layak diambil (prinsip)

1. **Satu metafora yang konsisten** membentuk seluruh bahasa desain dan tulisan.
2. **Pelat status di hero:** "Open to Work", lokasi, ketersediaan, angka ringkas, dan tombol CV. Menjawab pertanyaan recruiter dalam 30 detik.
3. **Daftar project bernomor** dengan kategori, tahun, tech stack, dan tautan jelas.
4. **Kalimat pembuka spesifik:** "Saya membangun aplikasi Laravel yang dipakai sungguhan", bukan slogan umum.
5. **Deck PDF** ringkasan untuk diteruskan (cocok untuk pencari kerja).
6. **Blok kontak** dengan beberapa jalur: email, CV, deck, form.
7. **Modal sertifikat** dengan unduh.
8. **Animasi teks yang tetap aksesibel** (salinan `sr-only`).
9. **Tier performa perangkat dan `prefers-reduced-motion`** sebagai kewajiban, bukan tambahan.
10. **Token dua tingkat** untuk warna dan ukuran.

### Yang tidak diambil, dan alasannya

| Hal | Alasan |
|---|---|
| Tema F1, helm, kotak-kotak, sirkuit | Konsep milik situs itu (dan turunan dari situs lain). Mirza perlu metafora sendiri |
| Hero WebGL berat (three.js + model + tekstur) | Berbenturan dengan target Lighthouse ≥ 90 dan mayoritas pengunjung dari HP |
| Loader layar penuh di awal | Menunda konten dan LCP, dan bisa membingungkan bila aset lambat |
| Skill dengan angka (95, 90, …) | Subjektif dan sulit dipertanggungjawabkan. Di `DESIGN.md` sudah dilarang |
| Emoji sebagai ikon (🤖 💼 🎓) | Terkesan generik ("AI slop") |
| Bahasa tercampur, tanpa toggle | Anda meminta ID/EN dengan pilihan |
| Tanpa mode gelap | Anda meminta terang dan gelap |
| Chatbot dengan biaya API | Perlu keputusan biaya dan batas (lihat bagian 6) |

## 2. Referensi 2 — mnizwa.com (Next.js)

"Muhammad Nizwa — AI/ML Researcher". Bukan portofolio pencari kerja murni, tetapi pusat pengetahuan.

- **Navigasi:** Home · Armory · Sessions · Articles · Research · Books · Links, plus toggle tema dan menu.
- **Bagian:** hero (nama + kalimat + "Discover More"), penjelasan bidang, lima "kartu" kegiatan (Armory = artefak model, Sessions = konsultasi 1-lawan-1, Articles, Research, Books, Links), Recent Additions, kutipan motivasi, **Resume ATS**, Direct Mail.
- **Token:** terang memakai biru-teal tua (`hsl(200 85% 30%)`) dengan aksen hijau-teal. Gelap memakai **abu-abu netral** dengan primer hampir putih. Font Manrope (judul) dan Inter.
- **Yang layak diambil:** blok **Resume ATS** sebagai CTA tersendiri (CV polos yang ramah sistem rekrutmen), mode gelap netral yang tenang, dan kartu ringkas yang menjelaskan tiap bagian situs.
- **Tidak relevan untuk v1:** Articles, Research, Books, Links, Sessions (sesuai jawaban Anda, blog belum termasuk).
- Screenshot yang Anda kirim sebelumnya (kartu "Informasi Penting" dengan tombol Resume ATS / Projects / Home dan latar mesh) tetap menjadi acuan prinsip "satu pesan, satu aksi utama".

## 3. Referensi 3 — Portavia (template Framer)

Template portofolio desainer.

- **Navbar:** pil melayang di tengah dengan avatar, tautan, dan tombol Contact berlatar gelap.
- **Hero:** tulisan raksasa kondensed huruf besar ("DIGITAL DESIGNER", font Antonio) mengapit kartu potret berujung membulat, dengan gelembung "Hi" beraksen.
- **Bagian:** Hero → What I can do (empat layanan bernomor) → About me dengan angka berjalan (tahun, proyek, klien) → My Story → Featured Projects → Blogs → Contact.
- **Warna:** teks `#303030` di latar putih, aksen indigo/biru.
- **Layak diambil:** navbar pil, tipografi hero yang berani dengan potret di tengah, penomoran layanan. **Hati-hati:** angka berjalan (counter) dan "layanan" berlebihan bagi pencari kerja.

## 4. Referensi 4 — Folioblox (template Framer)

Template portofolio kreatif.

- **Hero:** panel gelap dengan sudut bawah sangat membulat. "Hey, I'm a" beraksen oranye, kata besar "Brand Designer", satu kalimat sikap, empat layanan bernomor `#01–#04`.
- **Navbar:** wordmark ("®"), tautan, dan tombol pil "Get in touch" dengan titik oranye.
- **Bagian:** Hero → Trusted by (logo) → Behind the Designs → Featured Projects (kartu dengan "View") → CTA "Let's Build Something Meaningful Together".
- **Warna:** hitam `#0D0D0D`, putih, aksen oranye `#FF5E00`, font sans geometris.
- **Layak diambil:** sudut panel yang membulat besar sebagai penanda hero, penomoran `#01`, satu kalimat sikap di bawah judul, tombol pil dengan titik aksen. **Hati-hati:** bagian "Trusted by" hanya cocok bila Anda punya logo klien atau perusahaan.

## 5. Ringkasan Perbandingan

| Aspek | Ref 1 | Ref 2 | Ref 3 | Ref 4 | Rencana Mirza saat ini |
|---|---|---|---|---|---|
| Halaman | Satu halaman | Multi-halaman | Multi-halaman | Multi-halaman | Multi-halaman |
| Hero | WebGL + pelat status | Teks + foto | Tipografi raksasa + potret | Panel gelap membulat | Animasi layar penuh ("Blueprint") |
| Tema | Terang + gelap tinta, cyan | Terang biru-teal, gelap netral | Terang | Gelap + oranye | Biru, terang + gelap |
| Bahasa | ID/EN campur | EN | EN | EN | ID/EN dengan toggle |
| Tema tunggal/metafora | F1 | Lab AI | Tidak ada | Tidak ada | **Belum ada** |
| Chatbot | Ya (Claude) | Tidak | Tidak | Tidak | "Live chat" belum jelas |

## 6. Pertanyaan untuk Anda

1. **Apa yang Anda sukai dari Referensi 1?** Hero 3D/animasinya, tema-nya yang berkarakter, pelat status di hero, animasi teks, sticky stack, chatbot, atau hal lain? Pilih 2–3 hal utama.
2. **Metafora Mirza.** Referensi 1 kuat karena punya satu konsep. Apa yang ingin diwakili situs Anda? Contoh arah: *Blueprint/skema sistem* (sudah ada di rencana), *Ruang kontrol/terminal*, *Peta/atlas perjalanan*. Atau ada minat/latar personal yang bisa dijadikan tema (jawaban 2.1: "ada hal yang tidak ada di website orang lain").
3. **Berapa berat hero yang Anda terima?** Hero 3D seperti Referensi 1 sulit menembus Lighthouse ≥ 90 di HP. Usulan: tampilan kaya di desktop (dimuat lazy), versi ringan/statis di HP, dan bingkai statis untuk `prefers-reduced-motion`. Setuju, atau Anda lebih memilih hero ringan di semua perangkat?
4. **"Live chat" yang Anda minta, apakah maksudnya asisten AI seperti Referensi 1?** Bila ya, ada biaya API per pesan dan risiko disalahgunakan, padahal anggaran Anda hanya domain. Bisa dibatasi (batas harian, rate limit) atau diganti widget chat manusia / tombol WhatsApp.
5. **Sertifikat, deck PDF, dan blok "Resume ATS".** Ketiganya ada di referensi dan cocok untuk pencari kerja. Ingin dimasukkan ke v1? (Sertifikat sebelumnya tidak Anda pilih.)
6. **Pelat status di hero** ("Open to Work", lokasi, ketersediaan) yang bisa diubah dari admin. Ingin dipakai?
7. **Halaman tunggal atau multi-halaman?** Referensi 1 satu halaman panjang, rencana kita multi-halaman (jawaban 10.1). Tetap multi-halaman?

## 7. Dampak yang Diusulkan (setelah Anda menjawab)

- `DESIGN.md`: tambahkan metafora dan hero yang dipilih, pelat status, gaya judul bagian, aturan tier performa, modal sertifikat bila diminta.
- `PRD.md`: tambah fitur (pelat status admin-editable, deck/Resume ATS, sertifikat, chatbot) hanya bila dipilih.
- `ARCHITECTURE.md`: tambah model `Certificate`, `Document` (CV ATS, deck), pengaturan `availability`, serta layanan chatbot bila dipilih.
- `TODO.md`: sesuaikan milestone.
