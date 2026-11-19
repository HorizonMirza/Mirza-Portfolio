# DESIGN — Portofolio Muhammad Mirza

Status: **v1 live, keadaan per 2026-11-18**. Desain dibuat langsung di kode (jawaban 15.1), jadi dokumen ini menggambarkan tampilan **yang berlaku sekarang** dan menjadi acuan visual. Setiap revisi tampilan memperbarui bagian terkait di sini, bukan menambah log.

**Riwayat keputusan:** ringkasan per tanggal ada di `TODO.md` (Log Perubahan Rencana). Log lengkap per revisi (dulu bagian 11–190 dokumen ini) dihapus pada 2026-11-18 dan tetap bisa dibaca di riwayat git: `git show 3d0f2f3:Documentation/DESIGN.md`. Rujukan "DESIGN.md bagian 11" ke atas di komentar migrasi database lama mengarah ke versi itu (migrasi yang sudah diterapkan tidak boleh diubah).

## 1. Arah Visual

**Kata kunci:** tenang, presisi, personal. Hitam-putih, banyak ruang kosong, tipografi kuat, gerak halus.

- **Warna:** hitam-putih dengan satu aksen biru Azure (`--note`) yang hanya dipakai untuk catatan kecil: label, nomor, tanggal, titik status, lampu menu, cincin fokus, dan grafik. Tampilan awal **gelap**, tema terang tersedia.
- **Ciri khas beranda:** nama lengkap besar di belakang potret pemilik. Di bawah kursor, lapisan zirah terbuka lewat masker cairan (bagian 2.4). Tidak memakai satu metafora tema penuh; ciri khasnya potret + zirah.
- **Isi dari CV atau admin**, tanpa angka karangan. Salinan spesifik dan personal (bagian 9).
- **Referensi** (ibnuhakim.id, mnizwa.com, dua template Framer) hanya dipakai untuk prinsip, bukan tata letak, warna, atau teks. Prinsip yang diambil: daftar project yang jelas (kategori, tahun, teknologi, tautan), kalimat pembuka spesifik, beberapa jalur kontak (email, WhatsApp, CV, form), animasi teks yang tetap aksesibel (salinan `sr-only`), `prefers-reduced-motion` dan tingkat perangkat sebagai kewajiban, serta token dua tingkat. Yang sengaja tidak diambil: tema F1 dan metafora milik situs lain, hero WebGL berat (three.js, model, tekstur), loader layar penuh, skill dengan angka, emoji sebagai ikon, bahasa tercampur tanpa pilihan, dan chatbot berbayar.

### Menghindari kesan "AI slop"
Daftar larangan (jawaban 2.2 dan 14.2):
- Tanpa gradien ungu-pink, tanpa efek neon atau *glow* berlebihan.
- Kaca (glassmorphism) hanya di panel admin, yang memang dirancang begitu. Situs publik tidak memakainya.
- Tanpa ikon emoji sebagai dekorasi, tanpa ilustrasi 3D generik.
- Tanpa progress bar skill berpersen. Skill ditampilkan sebagai globe logo berkelompok.
- Tanpa slogan klise ("passionate developer", "crafting digital experiences"). Salinan mengikuti CV dan spesifik.
- Tanpa animasi yang menahan pengunjung. Gerak hanya untuk memberi petunjuk atau kesan hidup.
- Tanpa pola "tiga kartu fitur setara" berulang di setiap bagian. Tata letak mengikuti isi.

## 2. Token Desain

Diimplementasikan sebagai CSS variables di `Frontend/src/styles/tokens.css` dan dipetakan ke Tailwind (`@theme`); gaya per area ada di `Frontend/src/styles/`, dirangkai `src/app/globals.css`. Ubah di sana, jangan menaruh warna atau ukuran acak di komponen.

### 2.1 Warna

| Token | Terang | Gelap | Catatan |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#0A0A0A` | Latar halaman |
| `--surface` | `#F5F5F5` | `#141414` | Kartu, panel |
| `--surface-2` | `#EBEBEB` | `#1F1F1F` | Latar bertingkat, input, level 0 grafik GitHub |
| `--text` | `#0A0A0A` | `#F5F5F5` | Teks utama |
| `--text-muted` | `#525252` | `#A3A3A3` | Teks pendukung |
| `--primary` | `#0A0A0A` | `#F5F5F5` | Tombol utama dan tautan (hitam di terang, putih di gelap) |
| `--primary-fg` | `#FFFFFF` | `#0A0A0A` | Teks di atas primary |
| `--border` | `#E5E5E5` | `#2A2A2A` | Pemisah dekoratif saja |
| `--border-strong` | `#8A8A8A` | `#6B6B6B` | Batas elemen interaktif (≥ 3 : 1) |
| `--danger` | `#B42318` | `#FF8A80` | Galat |
| `--success` | `#0B7A3E` | `#5FD394` | Berhasil |
| `--note` | `#1D5FD0` | `#4DA3FF` | Aksen Azure: label, nomor, tanggal, lampu menu, cincin fokus, grafik |
| `--gh-1` … `--gh-4` | `#B9D2F8` → `#1B4C9C` | `#10294A` → `#4DA3FF` | Level kalender kontribusi GitHub (warna bisa diganti admin, lima pilihan) |

**Kontras terhitung** (WCAG 2.2, dihitung dari nilai di atas):

| Pasangan | Terang | Gelap | Syarat |
|---|---|---|---|
| Teks / latar | 19,8 : 1 | 18,2 : 1 | ≥ 4,5 |
| Teks / permukaan | 18,2 : 1 | 16,9 : 1 | ≥ 4,5 |
| Muted / latar | 7,8 : 1 | 7,8 : 1 | ≥ 4,5 |
| Muted / permukaan-2 | 6,6 : 1 | 6,5 : 1 | ≥ 4,5 |
| Tombol utama (teks / primary) | 19,8 : 1 | 18,2 : 1 | ≥ 4,5 |
| Azure (`--note`) / latar | 5,8 : 1 | 7,5 : 1 | ≥ 4,5 |
| Azure (`--note`) / permukaan | 5,4 : 1 | 7,0 : 1 | ≥ 4,5 |
| Batas input / latar | 3,5 : 1 | 3,7 : 1 | ≥ 3 |
| Danger / permukaan | 6,0 : 1 | 8,1 : 1 | ≥ 4,5 |
| Success / permukaan | 5,0 : 1 | 9,9 : 1 | ≥ 4,5 |

Aturan: **satu warna aksen** (Azure), selebihnya hitam-putih. Warna tidak boleh menjadi satu-satunya penanda status (selalu ditambah ikon atau teks).

### 2.2 Tipografi

| Peran | Font | Bobot | Catatan |
|---|---|---|---|
| Judul (`h1`–`h3`) | **Oswald** | 600, 700 | Condensed dan tegas. `h1` dan `h2` huruf kapital lewat CSS (pembaca layar tetap membaca teks asli). Self-host subset latin, di-preload karena judul hero adalah elemen LCP |
| Isi, navigasi, form, panel admin | **Inter** | 400, 500, 600 | Netral dan terbaca di layar kecil. Self-host, tidak di-preload |
| Kode, label teknis | **JetBrains Mono** | 400, 500 | Tech stack, tanggal, label kecil. Self-host, tidak di-preload |

Font disimpan di `Frontend/src/fonts/` (lisensi OFL disertakan). Skala (mobile → desktop), `clamp()`:

| Token | Ukuran | Tinggi baris | Pemakaian |
|---|---|---|---|
| `display` | 48 → 80 px | 1 | Nama besar di hero |
| `h1` | 37 → 55 | 1,05 | Judul halaman |
| `h2` | 28 → 37 | 1,1 | Judul bagian |
| `h3` | 18 → 22 | 1,3 | Judul kartu |
| `body` | 16 → 18 | 1,65 | Isi |
| `label` | 12, huruf kapital, mono | 1,4 | Label kecil |

Panjang baris isi maksimal ±68 karakter (`max-w-prose`). Mulai lebar 1024 px ukuran dasar 87,5% (14 px bila browser 16 px), jadi teks, jarak, dan tombol berbasis `rem` ikut lebih rapat di desktop; HP tetap 100%.

### 2.3 Jarak, Bentuk, Bayangan

- **Jarak:** kelipatan 4 px (skala Tailwind). Jarak antarbagian 64 px (mobile) sampai 120 px (desktop).
- **Kontainer:** maksimal 1200 px, gutter 16 px (mobile), 24 px (tablet), 32 px (desktop).
- **Radius:** `md` 10 px (tombol, input), `lg` 16 px (kartu). Tombol bulat dan kapsul memakai `rounded-full`.
- **Bayangan:** sangat halus dan jarang. Mode gelap memakai batas, bukan bayangan.
- **Ikon:** Lucide; logo merek dari Simple Icons (LinkedIn memakai tulisan "in").

### 2.4 Gerak

| Token | Nilai |
|---|---|
| Durasi | cepat 150 ms, normal 250 ms, lambat 500 ms |
| Easing | `cubic-bezier(0.22, 1, 0.36, 1)` (keluar halus) |
| Reveal saat scroll | fade + geser 12 px, 400 ms, sekali saja. Hanya elemen yang berada di bawah layar saat halaman dibuka |
| Transisi halaman | fade 150 ms |
| Hero | potret dengan nama di belakangnya; lapisan zirah terbuka di bawah kursor lewat masker cairan, kursor titik + cincin (bagian 83–89) |

**Teknologi gerak (urutan prioritas):**

| Kebutuhan | Teknologi | Beban JS |
|---|---|---|
| Reveal saat scroll | `IntersectionObserver` sekali jalan (`components/site/reveal-observer.tsx`). Versi CSS scroll-driven dibatalkan di M4: elemen yang berhenti di tepi bawah layar tertahan setengah transparan dan gagal uji kontras (axe/Lighthouse) | < 1 KB |
| Lampu menu aktif bergeser antar halaman | Desktop: React `<ViewTransition name>` (View Transitions bawaan browser). Nav bawah HP: satu elemen lampu yang digeser per kolom lewat `transform`. Mati pada reduced-motion | 0 KB library |
| Transisi antarhalaman | Desktop/laptop (pointer halus): View Transitions (CSS + dukungan Next.js/React). HP/tablet (`(hover: none) and (pointer: coarse)`): View Transitions dimatikan untuk pindah halaman, halaman baru masuk dengan animasi `transform` + `opacity` 320 ms searah urutan menu (`components/site/page-transitions.tsx`). Alasan dan hasil ukur di bagian 40 | < 1 KB |
| Muncul/hilang elemen, hover, fokus | CSS `transition` + `@starting-style` | 0 KB |
| Masker cairan hero | Simulasi cairan WebGL2 buatan sendiri (`components/site/hero-fluid.ts`, `liquid-mask-engine.ts`), cadangan canvas 2D "Kabut" bila WebGL2 tidak tersedia | tanpa library |
| Globe skill, grafik kontribusi GitHub, kotak commit | Canvas 2D buatan sendiri, berhenti saat di luar layar dan saat digulir (`lib/scroll-idle.ts`) | tanpa library |
| Menu HP, modal, daftar yang berubah urutan | CSS `transition` + `@starting-style`; dialog dan panel memakai Radix (shadcn/ui) | 0 KB library animasi |

Aturan: tidak ada library animasi (Motion tidak terpasang, GSAP dan smooth scroll Lenis tidak dipakai); CSS dulu, lalu canvas buatan sendiri. WebGL hanya dipakai untuk masker cairan hero. Browser yang belum mendukung scroll-driven animation atau View Transitions tetap menampilkan konten dengan benar, hanya tanpa animasi.

`prefers-reduced-motion: reduce` → semua gerak dimatikan atau diganti perubahan opasitas instan. Hero menampilkan bingkai statis.

**Anggaran animasi hero:** potret dan nama tampil sebagai gambar dan HTML biasa, jadi LCP tidak menunggu kanvas. Gambar zirah dimuat setelah halaman tenang (±1,2 detik) atau saat pertama disentuh. Masker jejak memakai DPR maksimal 2, simulasi cairan paling besar 1× piksel CSS. Animasi berhenti saat hero di luar layar, tab tidak terlihat, kartu pembuka terbuka, atau halaman sedang digulir. Pada `prefers-reduced-motion` jejak lebih singkat tanpa pusaran. Efek bisa dimatikan di Admin → Pengaturan (`heroAnimation`). Tanpa library.

**Tingkat perangkat** (prinsip dari referensi utama): `mobile` (< 768 px atau layar sentuh): bingkai statis atau gerak minimal. `tablet`: gerak ringan. `desktop`: gerak penuh dan miring mengikuti kursor. `prefers-reduced-motion` dan mode hemat data selalu membekukan gerak.

## 3. Komponen

Berbasis shadcn/ui (Radix) dan disesuaikan dengan token di atas. Semua punya keadaan default, hover, fokus, aktif, nonaktif, memuat, dan galat.

| Komponen | Keadaan sekarang |
|---|---|
| **Topbar situs** | Gaya "tubelight" tiga bagian: foto bulat di kiri (ke beranda), kapsul menu di tengah dengan lampu Azure di atas menu aktif (desktop), tombol bahasa dan tema bulat di kanan. Di HP menu pindah ke kapsul ikon di bawah layar |
| **Tombol bahasa** | Menampilkan kode bahasa tujuan; ganti bahasa dengan efek acak huruf (`lib/text-scramble.ts`) tanpa melompat posisi gulir |
| **Tombol tema** | Satu tombol terang/gelap dengan animasi lingkaran (`lib/circle-reveal.ts`) |
| **Suara antarmuka** | Bunyi pendek pada menu, tema, bahasa, dan beberapa interaksi; volume tiap suara diatur admin (`lib/ui-sounds.ts`) |
| **Button** | Varian utama (isi `--primary`), bergaris, dan `ghost`. Target sentuh ≥ 44 px di HP |
| **Chip / Badge** | Mono kecil untuk teknologi; chip teknologi project memakai logo skill |
| **Form field** | Label selalu terlihat, galat inline dengan `aria-describedby`. Form publik: Server Action + `useActionState` (tanpa library form). Form admin: React Hook Form + Zod |
| **Toast** | Hasil aksi admin (`role="status"`) |
| **Dialog / Sheet** | Radix, fokus terkunci, tutup dengan Esc, latar dikaburkan tipis |
| **Skeleton** | Shimmer sesuai tata letak tiap halaman (situs dan admin), dipakai di `loading.tsx` dan saat pindah halaman |
| **Halaman status** | Satu komponen untuk 11 kode HTTP (`components/ui/status-page.tsx`), bagian 6 |

## 4. Peta Situs dan Navigasi

Menu utama: **Home · About · Experience · Projects · Contact**. Nama menu bisa diubah admin (modul Navbar).

```
/[locale]                  Home (bagian keahlian di /[locale]#skills)
/[locale]/about            About: profil dan pendidikan
/[locale]/experience       Experience: kerja dan organisasi
/[locale]/projects         Daftar project
/[locale]/projects/[slug]  Detail project
/[locale]/contact          Kontak
/[locale]/privacy          Kebijakan privasi
/[locale]/418              Halaman "teapot" (easter egg)
/[locale]/skills           dialihkan (308) ke /[locale]#skills
/admin/login               Masuk Super Admin
/admin                     Dashboard
/admin/pages/intro | roles | skills | github        modul Home (empat tab)
/admin/profile | education                          modul About
/admin/experience                                   modul Experience
/admin/projects, /new, /[id]                        modul Projects
/admin/pages/contact | navbar | footer              modul Contact, Navbar, Footer
/admin/status | messages | settings | account       Halaman Status, Pesan, Pengaturan, Akun
```

URL yang tidak dikenal menampilkan 404 situs dalam bahasa yang sesuai (`[locale]/[...rest]` atau `global-not-found`).

## 5. Halaman

### 5.0 Kerangka bersama
- **Kartu pembuka:** kartu ramping di tengah layar sebelum masuk situs, isi dari admin (ID/EN), latar sama dengan halaman login admin. Frekuensi tampil diatur admin: sekali, tiap kunjungan, atau mingguan.
- **Footer:** kartu tautan WhatsApp, Email, LinkedIn, GitHub, Instagram, dan Resume CV (judul dan teks kecil bisa diubah admin, kartu kosong tidak tampil). Di desktop, kartu yang disorot memunculkan kartu detail di atasnya; kartu GitHub memuat kalender kontribusi. Di bawahnya hak cipta dan tautan Privasi.
- **Tombol WhatsApp melayang:** opsional, dinyalakan admin.
- **Mode perawatan:** pengunjung melihat halaman "Sedang diperbarui", admin tetap bisa bekerja.

### 5.1 Home
1. **Hero:** nama lengkap besar di belakang potret, peran di bawah foto (diatur admin, ID/EN), lapisan zirah terbuka di bawah kursor (masker cairan), kursor titik + cincin. Di tablet kecil foto rata bawah dengan wajah diperbesar.
2. **Pengalaman:** akordeon ringkas entri pengalaman, dibuka satu per satu.
3. **Project:** pita sampul project yang berjalan (marquee), tautan ke semua project.
4. **Keahlian Teknis** (`#skills`): globe logo skill dengan menu kategori; logo bisa ditekan.
5. **GitHub:** kalender kontribusi 2D/3D ("skyline") dengan statistik, warna dari pilihan admin.

### 5.2 About
Satu halaman: kartu foto yang miring mengikuti kursor, nama dan peran About, bio, lalu kartu pendidikan (dengan badge kampus dan bendera yang bisa dinyalakan admin).

### 5.3 Experience
Timeline tengah "fokus aktif": entri kerja dan organisasi dari yang terbaru, entri yang sedang di tengah layar menyala. Tiap entri punya instansi, jenis pekerjaan, periode, uraian, dan foto yang bisa diperbesar (lightbox).

### 5.4 Projects
Judul di tengah tanpa filter. Daftar "lampu sorot": project aktif disorot besar, sisanya berupa baris. Urutan diatur admin.

### 5.5 Detail Project
Tata letak belah dua: galeri foto dalam bingkai jendela browser (bilah alamat berisi tautan demo atau alamat halaman ini, foto bisa diperbesar) dan uraian dengan peran, tahun, chip teknologi, serta tombol demo dan repo bila ada. Tautan kembali ke daftar project beranimasi.

### 5.6 Contact
Judul dengan kartu ID bertali (canvas: kaca, logam, pita bertulis, foto dari admin) di sampingnya, lalu form kontak. Setelah terkirim muncul tiket ringkasan. Bila admin menutup form, tampil keterangan form ditutup dan jalur kontak lain.

### 5.7 Privacy
Teks kebijakan privasi per bagian (data kunjungan, kontak, CV, layanan pihak ketiga, hak pengunjung, kredit), masa simpan kunjungan mengikuti pengaturan admin.

### 5.8 Panel Admin
- **Tampilan:** kaca hitam-putih (kaca bisa diatur lewat "Atur kaca": latar dan kepekatan). Top bar berisi nama halaman, Atur kaca, bahasa tampilan admin ID/EN (seluruh teks admin ikut berganti), tema, dan menu profil (titik tiga). Sidebar bisa diciutkan; di HP menu dibuka dari panel geser.
- **Ubah langsung di pratinjau:** setiap modul tampil seperti halaman situsnya dan diketik di tempat. Bagian yang bisa diubah bergaris putus-putus; pilihan ID/EN dan tombol Simpan ada di bawah. Foto ditekan untuk unggah langsung dengan pemotong gambar.
- **Dashboard "Ringkas":** kotak angka (Pengunjung, Tayangan Halaman, Unduhan CV, Pesan Masuk) dengan pilihan periode, grafik Kunjungan Harian SVG (tayangan dan pengunjung bergaris putus), Pesan Terbaru, dan tabel Rincian Perhari.
- **Pesan:** kotak masuk pesan kontak: tandai dibaca atau belum dibaca, arsipkan dan keluarkan dari arsip.
- **Pengaturan:** daftar berkelompok (tema awal, bahasa awal, kartu pembuka, animasi hero, tombol WhatsApp, form kontak dan batas per jam, hitung kunjungan dan masa simpan, volume tiap suara, mode perawatan); tersimpan otomatis.
- **Akun:** gaya profil WhatsApp: foto, nama, email, dan password diganti lewat dialog dengan konfirmasi password; perangkat yang masuk dan riwayat masuk.
- **Halaman Status:** pratinjau 11 halaman status (bagian 6).
- **Login:** latar sama dengan kartu pembuka, galat ditandai di isian.

## 6. Halaman Status, Error, dan Kosong

- **Halaman status bersama** untuk 200, 301, 400, 401, 403, 404, 418, 429, 500, 502, dan 503 (`components/ui/status-page.tsx`), bisa dipratinjau di Admin → Halaman Status. 401/403 admin lewat `unauthorized()`/`forbidden()`.
- **404:** "hantu" (`components/ui/ghost-404-page.tsx`), satu bahasa sesuai alamat, tautan ke Home.
- **Error:** pesan sopan, tombol "Coba Lagi", tanpa detail teknis.
- **Form gagal:** pesan per kolom, isian tidak hilang, jalur alternatif (email/WhatsApp).
- **Kosong:** keterangan singkat (mis. belum ada project), tanpa ruang kosong yang membingungkan.

## 7. Rencana Responsif

Mobile-first. Mayoritas pengunjung memakai HP. Diuji di 360 px, 768 px, dan desktop; tidak ada yang digeser menyamping atau terpotong.

| Titik | Lebar | Perubahan utama |
|---|---|---|
| base | < 640 px | Satu kolom, menu ikon di bawah layar, tombol selebar penuh |
| `sm` | ≥ 640 | Tombol berdampingan |
| `md` | ≥ 768 | Grid 2 kolom |
| `lg` | ≥ 1024 | Kapsul menu di atas, ukuran dasar 87,5%, sidebar admin tetap |
| `xl` | ≥ 1280 | Kontainer 1200 px, jarak lebih longgar |

Aturan lain: target sentuh ≥ 44 × 44 px di HP (desktop ≥ 38 px karena ukuran dasar 87,5%), area aman (safe-area) iOS, `scroll-padding-bottom` agar fokus tidak tertutup menu bawah, teks bisa diperbesar sampai 200% tanpa kehilangan fungsi.

## 8. Rencana Aksesibilitas (WCAG 2.2 AA)

- Kontras sesuai tabel bagian 2.1. Status tidak hanya bergantung warna.
- Navigasi keyboard penuh, urutan fokus logis, cincin fokus 2 px `--note`.
- Tautan **"Lewati ke Konten Utama"** di awal halaman.
- Struktur semantik: `header`, `nav`, `main`, `footer`, satu `h1` per halaman, urutan heading benar.
- Alt text dua bahasa untuk gambar bermakna; gambar dekoratif `alt=""`.
- Form: label eksplisit, galat dibacakan (`aria-live`), placeholder bukan pengganti label.
- Atribut `lang` mengikuti locale, `hreflang` di setiap halaman.
- Animasi menghormati `prefers-reduced-motion`. Tidak ada konten berkedip.
- Canvas dekoratif (hero, kartu ID) `aria-hidden` dan tidak menerima fokus; informasinya tersedia sebagai teks.
- Pengujian: axe otomatis di Playwright untuk semua halaman publik di kedua tema dan bahasa; pemeriksaan manual keyboard dan pembaca layar di perangkat nyata oleh pemilik.

## 9. Pedoman Tulisan (Copy)

- Bahasa personal, orang pertama ("saya"), kalimat pendek, spesifik dan dapat dibuktikan.
- Hasil di atas jargon. Contoh: "Membangun API yang melayani 2.000 permintaan per hari" mengalahkan "Passionate backend developer".
- Setiap project menjawab: masalah, peran saya, teknologi, hasil.
- Judul dan tombol memakai Title Case, berupa kata kerja atau nama yang jelas ("Unduh CV", "Lihat Project").
- Terjemahan EN ditulis wajar, bukan terjemahan kata per kata.
- Sumber isi: CV pemilik dan isian admin (`Documentation/CONTENT.md`).

## 10. Hal yang Ditunggu

- Jawaban pertanyaan konten yang masih terbuka di `CONTENT.md` bagian 10 (izin publikasi GAAS, penyebutan bantuan AI, status pemakaian GAAS, usaha voucher game, peran di dua project pribadi).
- Tugas akun pemilik di `TODO.md` bagian "Menunggu dari Pemilik".
