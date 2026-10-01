# DESIGN — Portofolio Muhammad Mirza

Status: **draf v1**. Desain dibuat langsung di kode (jawaban 15.1), jadi dokumen ini adalah sumber kebenaran visual. Detail akan disesuaikan setelah CV, foto, dan logo diterima.

## 1. Arah Visual

**Kata kunci:** tenang, presisi, personal. Biru, banyak ruang kosong, tipografi kuat, gerak halus.

**Konsep: "Horizon" (disetujui 2026-09-30, M4).** Pemilik memilih mempertahankan desain tenang yang ada (bukan meniru nuansa ibnuhakim.id) dengan hero canvas "Horizon", tampilan awal **gelap**, dan tombol WhatsApp melayang sebagai pengganti live chat. Referensi utama (ibnuhakim.id) kuat karena punya satu metafora yang mengatur seluruh situs. Metafora Mirza diambil dari identitasnya sendiri: nama merek dan akun GitHub-nya "Horizon" (Horizon Organizer, `HorizonMirza`), dan ceritanya adalah mahasiswa AI yang membangun komunitas sejak SMA dan kini membangun software, menatap ke depan. Detail cerita ada di `Documentation/CONTENT.md` bagian 2.

Bahasa visualnya:
- **Hero:** grid perspektif tipis yang menyempit menuju garis horizon, dengan pita cahaya yang naik pelan di garis itu (kesan fajar/awal karier). Canvas 2D ringan, biru berkontras rendah agar teks tetap fokus. Pada desktop, grid sedikit miring mengikuti kursor. Di HP dan pada `prefers-reduced-motion`, bingkai statis.
- **Pelat status di hero** (terinspirasi pelat status referensi 1): label mono kecil berisi Status (mis. "Terbuka untuk kerja", dapat diubah admin), Lokasi, Kampus, Posisi sekarang, dan tombol Unduh CV, Lihat Project, GitHub. Semua isi dari CV atau admin, tidak ada angka karangan.
- **Perjalanan (`/experience`)** digambar sebagai garis waktu yang naik menuju horizon: `2021 Warnet Mobile → 2023 Horizon Organizer → 2024 BINUS AI → 2025 Ace Padel Club → 2026 PT PGAS Solution`. Ini pengganti "jalur sirkuit" di referensi 1.
- **Project** berupa daftar bernomor (`01`, `02`, …) dengan kategori, tahun, ringkasan satu kalimat, tech stack, dan tautan, dibagi **Software** dan **Komunitas & Bisnis**.
- **Judul bagian** memakai penanda koordinat kecil (`01 — Perjalanan`), bukan gaya huruf kecil bertitik milik referensi 1.
- **Animasi teks per kata** pada judul utama (dengan salinan `sr-only`), *scroll reveal*, dan opsional *sticky stack* di desktop.

**Referensi:** ibnuhakim.id (utama), mnizwa.com, dan dua template Framer dipakai untuk **prinsip**, bukan tata letak, warna, atau teks. Analisis dan batasannya ada di `Documentation/REFERENCES.md`. Tema F1, helm, dan sirkuit tidak dipakai.

### Menghindari kesan "AI slop"
Daftar larangan (jawaban 2.2 dan 14.2):
- Tanpa gradien ungu-pink, tanpa efek neon atau *glow* berlebihan.
- Tanpa kartu kaca (glassmorphism) di mana-mana. Maksimal satu tempat bila perlu.
- Tanpa ikon emoji sebagai dekorasi, tanpa ilustrasi 3D generik.
- Tanpa progress bar skill berpersen. Skill ditampilkan sebagai daftar berkelompok.
- Tanpa slogan klise ("passionate developer", "crafting digital experiences"). Salinan mengikuti CV dan spesifik.
- Tanpa animasi yang menahan pengunjung. Gerak hanya untuk memberi petunjuk atau kesan hidup.
- Tanpa pola "tiga kartu fitur setara" berulang di setiap bagian. Variasikan tata letak sesuai isi.

## 2. Token Desain

Diimplementasikan sebagai CSS variables di `Frontend/src/app/globals.css` dan dipetakan ke Tailwind. **Rasio kontras sudah dihitung** (WCAG 2.2).

### 2.1 Warna

| Token | Terang | Gelap | Catatan |
|---|---|---|---|
| `--bg` | `#F6F9FC` | `#0A0F1C` | Latar halaman |
| `--surface` | `#FFFFFF` | `#111A2E` | Kartu, panel |
| `--surface-2` | `#EAF0F8` | `#18233D` | Latar bertingkat, input |
| `--text` | `#0B1220` | `#E8EEF9` | Teks utama |
| `--text-muted` | `#475569` | `#A3B0C8` | Teks pendukung |
| `--primary` | `#1D4FD7` | `#7BA1FF` | Tombol utama, tautan, fokus |
| `--primary-fg` | `#FFFFFF` | `#0A0F1C` | Teks di atas primary |
| `--border` | `#CBD5E1` | `#33415F` | Garis dekoratif |
| `--border-strong` | `#64748B` | `#6B7A99` | Batas input (butuh ≥ 3:1) |
| `--danger` | `#B42318` | `#FF8A80` | Galat |
| `--success` | `#0B7A3E` | `#5FD394` | Berhasil |
| `--accent` | `#0EA5E9` | `#38BDF8` | Dekoratif saja (grid, garis), bukan teks |

**Kontras terhitung:**

| Pasangan | Terang | Gelap | Syarat |
|---|---|---|---|
| Teks / latar | 17,7 : 1 | 16,4 : 1 | ≥ 4,5 |
| Teks / permukaan | 18,7 : 1 | 14,9 : 1 | ≥ 4,5 |
| Muted / latar | 7,2 : 1 | 8,7 : 1 | ≥ 4,5 |
| Muted / permukaan-2 | 6,6 : 1 | 7,1 : 1 | ≥ 4,5 |
| Primary / latar (tautan) | 6,3 : 1 | 7,6 : 1 | ≥ 4,5 |
| Tombol utama (teks / primary) | 6,7 : 1 | 7,6 : 1 | ≥ 4,5 |
| Danger / permukaan | 6,6 : 1 | 7,6 : 1 | ≥ 4,5 |
| Success / permukaan | 5,4 : 1 | 9,3 : 1 | ≥ 4,5 |

`--border` sengaja lembut (1,4 sampai 1,9 : 1) hanya untuk pemisah dekoratif. Elemen interaktif memakai `--border-strong`. `--accent` tidak boleh dipakai untuk teks.

Aturan: **satu warna primer**, aksen sekunder hanya untuk dekorasi. Warna tidak boleh menjadi satu-satunya penanda status (selalu ditambah ikon atau teks).

### 2.2 Tipografi

| Peran | Font | Bobot | Catatan |
|---|---|---|---|
| Judul (`h1`–`h3`) | **Oswald** | 600, 700 | Condensed dan tegas. `h1` dan `h2` huruf kapital lewat CSS (pembaca layar tetap membaca teks asli), tanpa tracking rapat. Self-host subset latin (28 KB), di-preload karena judul hero adalah elemen LCP |
| Isi, navigasi, form | **Inter** | 400, 500, 600 | Netral dan sangat terbaca di layar kecil. Self-host subset latin (48 KB), tidak di-preload |
| Kode, label teknis | **JetBrains Mono** | 400, 500 | Untuk tech stack, tanggal, label kecil. Tidak di-preload (bukan elemen LCP) |

Skala (mobile → desktop), `clamp()` agar mulus:

| Token | Ukuran | Tinggi baris | Pemakaian |
|---|---|---|---|
| `display` | 48 → 80 px | 1 | Kalimat utama di hero |
| `h1` | 37 → 55 | 1,05 | Judul halaman |
| `h2` | 28 → 37 | 1,1 | Judul bagian |
| `h3` | 18 → 22 | 1,3 | Judul kartu |
| `body` | 16 → 18 | 1,65 | Isi |
| `small` | 14 | 1,5 | Metadata |
| `label` | 12, huruf kapital, `tracking-wide`, mono | 1,4 | Label seperti di referensi |

Panjang baris isi maksimal ±68 karakter (`max-w-prose`).

### 2.3 Jarak, Bentuk, Bayangan

- **Jarak:** kelipatan 4 px (skala Tailwind). Jarak antarbagian 64 px (mobile) sampai 120 px (desktop).
- **Kontainer:** maksimal 1200 px, gutter 16 px (mobile), 24 px (tablet), 32 px (desktop).
- **Radius:** `sm` 6, `md` 10, `lg` 16. Kartu memakai `lg`, tombol dan input `md`.
- **Bayangan:** hanya dua tingkat, sangat halus (`shadow-sm` untuk kartu, `shadow-lg` untuk menu/dialog). Mode gelap memakai batas, bukan bayangan.
- **Ikon:** Lucide, ukuran 16/20/24, stroke 1,75.

### 2.4 Gerak

| Token | Nilai |
|---|---|
| Durasi | cepat 150 ms, normal 250 ms, lambat 500 ms |
| Easing | `cubic-bezier(0.22, 1, 0.36, 1)` (keluar halus) |
| Reveal saat scroll | fade + geser 12 px, 400 ms, sekali saja. Hanya elemen yang berada di bawah layar saat halaman dibuka |
| Transisi halaman | fade 150 ms |
| Hero | grid perspektif menuju garis horizon, pita cahaya naik sangat pelan |

**Teknologi gerak (urutan prioritas):**

| Kebutuhan | Teknologi | Beban JS |
|---|---|---|
| Reveal saat scroll | `IntersectionObserver` sekali jalan (`components/site/reveal-observer.tsx`). Versi CSS scroll-driven dibatalkan di M4: elemen yang berhenti di tepi bawah layar tertahan setengah transparan dan gagal uji kontras (axe/Lighthouse) | < 1 KB |
| Lampu menu aktif bergeser antar halaman | React `<ViewTransition name>` (View Transitions bawaan browser), mati pada reduced-motion | 0 KB library |
| Transisi antarhalaman | View Transitions (CSS + dukungan Next.js/React) | 0 KB |
| Muncul/hilang elemen, hover, fokus | CSS `transition` + `@starting-style` | 0 KB |
| Hero "Horizon" | Canvas 2D buatan sendiri (`components/site/horizon-canvas.tsx`) di atas latar CSS statis yang tampil lebih dulu | ±3 KB |
| Menu HP, modal, daftar yang berubah urutan | **Motion**, hanya di komponen tersebut (`'use client'`) | seperlunya |

Aturan: jangan memakai Motion untuk efek yang bisa dibuat dengan CSS. Browser yang belum mendukung scroll-driven animation atau View Transitions tetap menampilkan konten dengan benar, hanya tanpa animasi. GSAP, WebGL, dan smooth scroll (Lenis) tidak dipakai.

`prefers-reduced-motion: reduce` → semua gerak dimatikan atau diganti perubahan opasitas instan. Hero menampilkan bingkai statis.

**Anggaran animasi hero ("Horizon"):** canvas 2D, garis grid 24 (HP, bingkai statis bila hemat data/energi) / 48 (desktop), DPR maksimal 2 (1 di HP), berhenti saat tab tidak terlihat atau hero keluar layar, diinisialisasi setelah LCP (`requestIdleCallback`), tanpa library tambahan (< 4 KB). Teks dan pelat status tampil sebagai HTML biasa, jadi LCP tidak menunggu canvas. Tanpa WebGL, tanpa loader layar penuh.

**Tingkat perangkat** (prinsip dari referensi utama): `mobile` (< 768 px atau layar sentuh): bingkai statis atau gerak minimal. `tablet`: gerak ringan. `desktop`: gerak penuh dan miring mengikuti kursor. `prefers-reduced-motion` dan mode hemat data selalu membekukan gerak.

## 3. Komponen

Berbasis shadcn/ui, disesuaikan dengan token di atas. Semua punya keadaan: default, hover, fokus, aktif, nonaktif, memuat, galat.

| Komponen | Catatan |
|---|---|
| **Button** | Varian `primary` (isi biru), `secondary` (bergaris), `ghost`. Tinggi minimal 44 px (target sentuh). Tiga tingkat hierarki seperti pada referensi |
| **Link** | Bergaris bawah pada hover dan fokus, warna `--primary` |
| **Navbar** | Kapsul melayang di atas (gaya "tubelight"): foto profil bulat (inisial bila belum ada foto), menu teks dengan lampu di atas menu aktif, tombol bahasa bulat (menampilkan kode bahasa tujuan), tombol tema bulat (satu tombol terang/gelap), tombol Unduh CV bila ada. Di HP: kapsul atas hanya foto, bahasa, tema; menu jadi kapsul ikon tetap di bawah layar dengan label untuk pembaca layar |
| **Language toggle** | Kontrol segmen "ID / EN" dengan `aria-label` |
| **Theme toggle** | Terang / Gelap / Sistem |
| **Card project** | Cover, judul, ringkasan, chip tech stack, metadata GitHub |
| **Chip / Badge** | Mono, kecil, untuk teknologi |
| **Timeline item** | Garis vertikal, titik, periode, peran, instansi, uraian |
| **Skill group** | Judul kategori + daftar chip |
| **Form field** | Label selalu terlihat, teks bantuan, galat inline dengan `aria-describedby`. Form publik: Server Action + `useActionState` (tanpa library form). Form admin: React Hook Form |
| **Toast** | Untuk hasil aksi admin (`role="status"`) |
| **Dialog / Sheet** | Fokus terkunci, tutup dengan Esc |
| **Table (admin)** | TanStack Table: pengurutan, pencarian, paginasi, ubah jadi kartu di HP |
| **Empty / Error state** | Pesan jelas dan aksi lanjutan |
| **Skeleton** | Untuk data yang dimuat |

## 4. Peta Situs dan Navigasi

Navigasi di atas. Urutan: **Home · About · Experience · Skills · Projects · Contact**, di kanan: toggle bahasa, toggle tema, tombol "Unduh CV".

```
/[locale]                 Home
/[locale]/about           About
/[locale]/experience      Pengalaman & Pendidikan
/[locale]/skills          Skills
/[locale]/projects        Daftar project
/[locale]/projects/[slug] Detail project
/[locale]/contact         Kontak
/[locale]/privacy         Kebijakan Privasi
/[locale]/not-found       404
/admin                    Dashboard (login di /admin/login)
/admin/projects | skills | experience | profile | messages | newsletter | audit
```

Footer: tautan sosial, hak cipta, Privasi, toggle bahasa.

## 5. Wireframe

Kotak kasar, belum visual final. **M** = mobile (≈ 390 px), **D** = desktop.

### 5.1 Home

```
D ┌──────────────────────────────────────────────────────────────┐
  │ MM        Home About Experience Skills Projects Contact  ID|EN ◐ [Unduh CV] │
  │                                                              │
  │   (latar: grid perspektif menuju garis horizon + pita cahaya) │
  │                                                              │
  │   LABEL MONO: 01 — MUHAMMAD MIRZA                            │
  │   Display: kalimat hero (lihat CONTENT.md)                   │
  │   Satu kalimat pendukung (2 baris maks)                      │
  │                                                              │
  │   ┌ pelat status ───────────────────────────┐                │
  │   │ STATUS  ● Terbuka untuk kerja           │                │
  │   │ LOKASI  Tangerang · KAMPUS BINUS (AI)   │                │
  │   │ SEKARANG Fullstack Intern, PT PGAS Sol. │                │
  │   └─────────────────────────────────────────┘                │
  │   [ Unduh CV ]   [ Lihat Project ]   ⌥ GitHub                │
  │                                                              │
  │  ─────────────── garis horizon ──────────────  ⌄ gulir       │
  └──────────────────────────────────────────────────────────────┘
  ┌──────────────────────────────────────────────────────────────┐
  │ 02 — Project pilihan   (daftar bernomor, tata letak bervariasi)│
  │ ┌───────────────┐ ┌──────────┐ ┌──────────┐                  │
  │ │  cover besar  │ │  cover   │ │  cover   │   [Semua project]│
  │ └───────────────┘ └──────────┘ └──────────┘                  │
  ├──────────────────────────────────────────────────────────────┤
  │ Pengalaman terbaru (2–3 entri ringkas)         [Selengkapnya]│
  ├──────────────────────────────────────────────────────────────┤
  │ Tech stack (chip berkelompok)                                │
  ├──────────────────────────────────────────────────────────────┤
  │ Ajakan: "Ada yang ingin dibangun?"  [Kirim pesan] [WhatsApp] │
  │ Newsletter: [email] [Berlangganan]                           │
  └──────────────────────────────────────────────────────────────┘

M ┌────────────────────┐
  │ MM              ☰  │
  │  (latar bergerak)  │
  │ LABEL              │
  │ Display (3 baris)  │
  │ Kalimat personal   │
  │ [   Unduh CV     ] │
  │ [ Lihat Project  ] │
  │ ⌥ GitHub           │
  └────────────────────┘
```

Tombol "Unduh CV" harus terlihat tanpa scroll di 360 × 640 px.

### 5.2 About

```
┌───────────────────────────────┐
│ h1 Tentang saya               │
│ ┌──────────┐  Bio personal    │
│ │  foto    │  (3–4 paragraf)  │
│ └──────────┘  Kota · Email · WhatsApp · Sosial │
│ Nilai kerja / cara saya bekerja (daftar singkat) │
│ [Unduh CV]                    │
└───────────────────────────────┘
```

### 5.3 Experience

```
h1 Pengalaman & Pendidikan       Filter: [Semua] [Kerja] [Pendidikan]
  │
  ●─ 2024 – sekarang   Peran · Instansi · Kota
  │   • uraian singkat
  ●─ 2022 – 2024       ...
  │
  ●─ 2018 – 2022       Pendidikan · Universitas
```

### 5.4 Skills

```
h1 Skills
Frontend   [chip] [chip] [chip]
Backend    [chip] [chip]
Database   [chip] [chip]
Tools/DevOps [chip] [chip]
```

### 5.5 Projects

```
h1 Projects        Filter teknologi: [Semua] [Next.js] [Node] ...
┌────────┐ ┌────────┐
│ cover  │ │ cover  │   (D: 2–3 kolom, M: 1 kolom)
│ judul  │ │ judul  │
│ ringkas│ │ ringkas│
│ chip   │ │ chip   │
│ ★12 · TS · update 3 hari lalu │
└────────┘ └────────┘
```

**Saat peluncuran hanya ada 1 project (GAAS).** Halaman harus tetap terasa utuh, bukan kosong:
- Satu project tampil sebagai **kartu unggulan lebar** (bukan satu kartu kecil di grid kosong). Grid 2–3 kolom baru dipakai mulai 2 project ke atas.
- Filter teknologi dan kategori **disembunyikan** sampai ada cukup project untuk difilter (≥ 3, atau ≥ 2 kategori berisi).
- Di bawah kartu, satu baris ajakan ringan: "Project lain sedang dalam pengerjaan" dengan tautan ke GitHub dan halaman Perjalanan (bukan janji kosong atau `Lorem ipsum`).
- Pada Home, bagian "Project pilihan" memakai tata letak 1 kartu yang sama.
- Bila belum ada project terbit sama sekali: keadaan kosong dengan teks jelas, tanpa error.

### 5.6 Detail Project

```
← Semua project
h1 Judul            tahun · status
[Demo] [Repo]
Galeri (carousel, alt text, keyboard)
Ringkasan
Studi kasus: Masalah → Pendekatan → Hasil (markdown)
Tech stack (chip)   Metadata GitHub
← Sebelumnya | Berikutnya →
```

### 5.7 Contact

```
h1 Hubungi saya
┌ Form ──────────────┐   Tautan langsung:
│ Nama               │   Email · WhatsApp · LinkedIn · GitHub · Instagram
│ Email              │   Kota
│ Subjek             │
│ Pesan              │
│ (honeypot tersembunyi)│
│ [Kirim]            │   Status: berhasil / gagal (aria-live)
└────────────────────┘
```

### 5.8 Admin

```
┌ Sidebar ┐ ┌ Konten ──────────────────────────────────────────┐
│Dashboard│ │ Kartu ringkas: Pesan baru · Kunjungan 7 hari ·    │
│Projects │ │ Unduhan CV · Pelanggan                            │
│Skills   │ │ Grafik kunjungan (garis, 30 hari)                 │
│Experience│ │ Pesan terbaru (5)                                 │
│Profile  │ └───────────────────────────────────────────────────┘
│Messages │
│Newsletter│  Halaman daftar: tabel + cari + [Tambah]
│Audit    │  Halaman form: tab [ID] [EN], pratinjau, [Simpan] [Terbitkan]
└─────────┘  (di HP sidebar menjadi menu geser)
```

## 6. Halaman Error dan Kosong

- **404:** kalimat singkat personal, tautan ke Home dan Projects.
- **500/error:** pesan sopan, tombol "Coba lagi", tanpa detail teknis.
- **Form gagal:** pesan inline dan cara alternatif (email/WhatsApp), data yang diisi tidak hilang.
- **Kosong:** contoh "Belum ada project di kategori ini", disertai tombol reset filter.
Teks lengkap menunggu bahan dari pemilik (jawaban 9.3).

## 7. Rencana Responsif

Mobile-first. Mayoritas pengunjung memakai HP.

| Titik | Lebar | Perubahan utama |
|---|---|---|
| base | < 640 px | Satu kolom, menu layar penuh, tombol selebar penuh |
| `sm` | ≥ 640 | Tombol berdampingan |
| `md` | ≥ 768 | Grid 2 kolom, navbar penuh mulai `lg` |
| `lg` | ≥ 1024 | Navbar horizontal, grid 3 kolom, sidebar admin tetap |
| `xl` | ≥ 1280 | Kontainer 1200 px, jarak lebih longgar |

Aturan lain: target sentuh ≥ 44 × 44 px, tidak ada scroll horizontal, area aman (safe-area) di iOS, teks bisa diperbesar sampai 200% tanpa kehilangan fungsi.

## 8. Rencana Aksesibilitas (WCAG 2.2 AA)

- Kontras sesuai tabel bagian 2.1. Status tidak hanya bergantung warna.
- Navigasi keyboard penuh, urutan fokus logis, indikator fokus jelas (cincin 2 px `--primary`, offset 2 px).
- Tautan **"Lewati ke konten utama"** di awal halaman.
- Struktur semantik: `header`, `nav`, `main`, `footer`, satu `h1` per halaman, urutan heading benar.
- Alt text dua bahasa untuk semua gambar bermakna. Gambar dekoratif `alt=""`.
- Form: label eksplisit, galat dibacakan (`aria-live`), tidak memakai placeholder sebagai label.
- Atribut `lang` mengikuti locale. Toggle bahasa memakai `hreflang`.
- Animasi menghormati `prefers-reduced-motion`. Tidak ada konten berkedip.
- Canvas hero bersifat dekoratif (`aria-hidden`), tidak menerima fokus.
- Pengujian: axe otomatis di Playwright, pemeriksaan manual dengan keyboard dan pembaca layar (VoiceOver/TalkBack) sebelum rilis.

## 9. Pedoman Tulisan (Copy)

- Bahasa personal, orang pertama ("saya"), kalimat pendek, spesifik dan dapat dibuktikan.
- Hasil di atas jargon. Contoh: "Membangun API yang melayani 2.000 permintaan per hari" mengalahkan "Passionate backend developer".
- Setiap project menjawab: masalah, peran saya, teknologi, hasil.
- Judul dan tombol berupa kata kerja atau nama yang jelas ("Unduh CV", "Lihat project").
- Terjemahan EN ditulis wajar, bukan terjemahan kata per kata.
- Sumber isi awal: CV pemilik.

## 10. Hal yang Ditunggu

- Foto profil, logo/inisial, dan data GAAS (project awal). Project lain menyusul lewat admin.
- Konfirmasi konsep "Horizon" (bagian 1), atau arah lain.
- Setelah bahan tiba, sesuaikan kalimat hero, pilih foto, dan uji kontras ulang jika warna berubah.

## 11. Keputusan M4 (2026-09-30)

- Desain tetap tenang seperti M3, tidak digeser ke nuansa ibnuhakim.id (pilihan pemilik).
- Tema awal **gelap**; pengunjung tetap bisa memilih Terang/Sistem dan pilihannya tersimpan.
- Hero "Horizon": canvas 2D. Tingkat perangkat: HP 24 garis, DPR 1, 30 fps tanpa miring kursor; tablet 32 garis; desktop 48 garis, DPR ≤ 2, miring mengikuti kursor. Bingkai statis bila `prefers-reduced-motion`, `saveData`, atau memori ≤ 2 GB. Berhenti saat tab tersembunyi atau hero keluar layar. Diinisialisasi saat idle.
- Live chat diganti **tombol WhatsApp melayang** (tanpa skrip pihak ketiga), hanya tampil bila nomor WhatsApp diisi di admin.
- Transisi halaman memakai `<ViewTransition>` React (fade 150 ms), dimatikan pada reduced-motion.

## 12. Ganti font (2026-10-01)

Pemilik memilih pilihan 14 dari demo 15 font: **Oswald** (judul, huruf kapital untuk `h1`/`h2`) + **Inter** (isi), label tetap **JetBrains Mono**. Plus Jakarta Sans tidak dipakai lagi. Ukuran `display`, `h1`, dan `h2` dinaikkan sekitar 15–20% karena Oswald condensed. Kalimat hero dibatasi 3 baris di laptop (`max-w-5xl`) agar tombol utama tetap terlihat tanpa scroll (PRD U1). Lighthouse mobile beranda 90–91 (sebelumnya 94) karena file Inter lebih besar, halaman lain 91–97, aksesibilitas tetap 100.

## 13. Topbar "tubelight" (2026-10-01)

Permintaan pemilik berdasarkan komponen Tubelight Navbar (21st.dev). Diterapkan tanpa `framer-motion`: animasi lampu memakai View Transitions bawaan browser, jadi tidak ada tambahan JavaScript (skor kecepatan beranda sudah tipis di 90–91). Pilihan "Sistem" pada tema dihapus karena tombol tema kini satu tombol terang/gelap. Panel menu HP (popover) diganti kapsul ikon di bawah layar, dan tombol WhatsApp dinaikkan di HP agar tidak menutupi menu.

## 14. Halaman login admin (2026-10-01)

Permintaan pemilik berdasarkan komponen Interactive Neural Vortex dan sign-in-card-2 (21st.dev):
- Latar: shader WebGL "neural vortex" (`components/admin/neural-vortex-background.tsx`), cahaya mengikuti kursor, DPR maks 1,5, berhenti saat tab tersembunyi, satu bingkai diam pada reduced-motion. Tanpa WebGL: latar hitam polos.
- Halaman login **selalu hitam**, tidak mengikuti tema terang/gelap panel admin (warna ditulis langsung, bukan token tema).
- Kartu login kaca **diam** (tanpa efek miring/geser 3D). Garis cahaya di tepi kartu memakai CSS, disembunyikan pada reduced-motion. Tanpa `framer-motion`.
- Bagian contoh yang tidak dipakai karena fiturnya tidak ada: "Remember me", "Forgot password", "Sign in with Google", dan "Sign up" (satu admin, pendaftaran publik dimatikan). Ditambah tombol "Lihat sandi".

Revisi 2026-10-01 (pemilik): teks halaman login berbahasa Inggris ("Welcome Back King!", tombol "Login" tanpa panah, contoh email `mirzaganteng@gmail.com`), kolom email dan password diberi kilau berjalan mengelilingi kotak (gradien conic + `@property`, diam pada reduced-motion), lingkaran logo diganti foto pemilik.

## 15. Foto profil bawaan (2026-10-01)

Foto dari pemilik disimpan di `Frontend/src/assets/` (800×800 untuk halaman Tentang, potongan wajah 256×256 untuk lingkaran kecil), metadata kamera dibuang. Dipakai di topbar, halaman Tentang, login admin, dan JSON-LD selama belum ada foto yang diunggah lewat admin. Foto dari admin (Cloudinary) selalu didahulukan.

## 16. Warna hitam-putih + Azure (2026-10-01)

Pilihan pemilik nomor 6 (Azure) dari demo 10 biru. Seluruh situs dan panel admin hitam-putih: latar `#0a0a0a`/`#ffffff`, teks `#f5f5f5`/`#0a0a0a`, tombol utama dan tautan ikut warna teks. Biru `--note` hanya untuk catatan kecil: label mono (STATUS, LOKASI, eyebrow halaman), nomor bagian, tanggal pengalaman, titik status, titik timeline, lampu menu, cincin fokus, garis horizon, dan grafik admin.

| Token | Tema gelap | Tema terang | Kontras teks kecil |
|---|---|---|---|
| `--note` | `#4da3ff` | `#1d5fd0` | 7,5:1 di hitam, 5,8:1 di putih |
| `--text-muted` | `#a3a3a3` | `#525252` | ≥ 7:1 |
| `--border-strong` | `#6b6b6b` | `#8a8a8a` | ≥ 3:1 (batas kolom form) |

`--danger` dan `--success` tetap merah/hijau untuk pesan galat dan status di admin. Bagian 2.1 (palet lama biru tua) digantikan bagian ini.

## 17. Revisi topbar dan login (2026-10-01)

- Topbar tiga bagian: foto bulat di kiri, kapsul menu di tengah (desktop), tombol bahasa dan tema di kanan, masing-masing lingkaran sendiri. HP: menu tetap kapsul ikon di bawah layar.
- Lampu menu aktif hitam/putih mengikuti warna teks tema (bukan Azure), latar menu aktif `--surface-2`.
- Tombol tema: ikon matahari/bulan beranimasi (garis digambar ulang + skala, CSS dari komponen AnimatedThemeToggle tanpa framer-motion). Pergantian tema meluas melingkar dari tombol (View Transitions API + animasi `clip-path`); tanpa dukungan browser atau dengan reduced-motion langsung ganti. `disableTransitionOnChange` next-themes tetap aktif (warna tidak beranimasi saat tema dipasang; tanpa opsi ini uji kontras WebKit gagal); state next-themes baru diperbarui setelah animasi ikon selesai agar animasinya tidak terpotong.
- Tombol bahasa: kode bahasa berputar keluar saat ditekan dan berputar masuk di halaman baru.
- Foto lingkaran dipotong lebih jauh (kepala dan bahu).
- Login: lingkaran foto diberi kilau berjalan yang sama dengan kolom, warna latar isi otomatis (autofill) browser dinetralkan, label "Super Admin" dan judul dirapikan (Inter berjarak lebar + Oswald semibold).

## 18. Animasi lingkaran tema dan bahasa (2026-10-01)

- Lingkaran foto di topbar diberi bingkai seperti tombol bahasa dan tema (foto di dalam lingkaran berbingkai).
- Ganti tema dan ganti bahasa memakai transisi yang sama: tampilan baru meluas melingkar **mulai dari ukuran tombol yang ditekan** sampai menutup layar, 750 ms (`lib/circle-reveal.ts`). Pencampuran `plus-lighter` bawaan dimatikan selama animasi agar tulisan lama dan baru tidak bertumpuk.
- Tema: `document.startViewTransition` dijalankan sendiri.
- Bahasa: React/Next mengambil alih transisi pada navigasi biasa, jadi tombol bahasa memuat halaman bahasa baru penuh dan browser menampilkannya lewat transisi antar-dokumen (`@view-transition { navigation: auto }` + skrip statis `pagereveal` di layout publik). Pemuatan penuh lain dilewati (`pageswap`). Browser tanpa dukungan (mis. Firefox saat ini) atau reduced-motion: navigasi biasa tanpa lingkaran.
- Kode bahasa di tombol berubah seperti kata yang berganti (memudar, mengabur, mengecil keluar, lalu menajam masuk).

## 19. Keyboard skill 3D (2026-10-01)

Permintaan pemilik: bagian skill seperti keyboard 3D pada video referensi (portofolio Abhijit Zende, keyboard dari scene Spline). Repo referensi tidak berlisensi dan memakai Spline + three.js (lebih dari 1 MB JS), jadi yang diambil hanya prinsipnya. Tidak ada aset, scene, atau teks yang disalin.

- Keyboard dibuat dengan CSS 3D murni (`.kb-*` di `globals.css`, `features/skills/components/skill-keyboard.tsx`). Pelat dimiringkan dengan transform 2D (`scaleY(0.643) rotate(-34deg)`, proyeksi ortografis dari rotateX(50deg) rotateZ(-34deg)); tebal tombol berupa empat bayangan padat yang memendek saat ditekan. Versi yang lebih berat (transform 3D, bayangan blur besar, `@property`) membuat halaman WebKit di CI crash, jadi tidak dipakai. Tidak ada dependency baru.
- Satu tombol untuk satu skill dari database, urutan sesuai kategori dan urutan admin. **Warna tombol = warna brand** (keputusan pemilik, pengecualian dari palet hitam-putih). Warna logo hitam atau putih, mana yang kontrasnya lebih tinggi. Skill tanpa logo brand (non-teknis) memakai tombol netral `#262626` dengan ikon lucide atau singkatan.
- Logo dari Simple Icons (CC0) disalin ke `features/skills/brand-icons.ts`, hanya diimpor di server. Ikon dicari dari kolom `icon` (slug Simple Icons), lalu dari nama skill dan alias. Ikon berlisensi NC/SA tidak dipakai. Logo Git (CC BY 3.0, Jason Long) diberi atribusi di halaman Skill.
- Interaksi: arahkan kursor, fokus, atau tekan tombol untuk menampilkan kategori, nama skill (besar, miring searah keyboard di desktop), dan project yang memakainya (keputusan pemilik: hanya data yang sudah ada, tanpa deskripsi karangan). Keyboard fisik: panah berpindah tombol, huruf melompat ke skill berawalan huruf itu.
- Dipasang di halaman Skill (di atas daftar per kategori) dan di bagian skill Home (menggantikan chip).
- Aksesibilitas: tiap tombol `<button>` bernama "skill, kategori", tombol aktif `aria-current`, fokus terlihat (garis Azure di tutup tombol), reduced-motion mematikan transisi.
- Belum dikerjakan: keyboard yang ikut berpindah antar-bagian saat scroll seperti di video. Itu perubahan besar di seluruh halaman dan butuh library 3D, jadi menunggu keputusan pemilik.

## 20. Keyboard skill 3D asli dari Spline (2026-10-01)

Pemilik meminta bagian skill **sama persis** dengan repo referensi (Abhiz2411/3D-interactive-portfolio). Keyboard di repo itu adalah scene Spline milik **Naresh Khatri** (github.com/Naresh-Khatri/3d-portfolio). README Naresh menyatakan "Free to use! This portfolio is open source" dengan lisensi MIT dan meminta kredit, jadi scene-nya dipakai dengan atribusi (`THIRD_PARTY_NOTICES.md`, baris kredit di halaman Skill). Cakupan: bagian skill saja (Home dan halaman Skill), keyboard tidak ikut bergerak saat scroll.

- `features/skills/components/skill-keyboard-3d.tsx` memuat `public/spline/skills-keyboard.spline` dengan `@splinetool/runtime` 1.12.0 (versi yang sama dengan repo asli).
- **Semua 24 tombol scene tampil seperti aslinya** (keputusan pemilik, 2026-10-01): JS, TS, HTML, CSS, React, Vue, Next.js, Tailwind, Node.js, Express, PostgreSQL, MongoDB, Git, GitHub, Prettier, npm, Firebase, WordPress, Linux, Docker, Nginx, AWS, Vim, Vercel. Versi awal menyembunyikan tombol yang skill-nya tidak ada di database; pemilik meminta semuanya ditampilkan. Saat disorot, tombol menampilkan nama skill; kategori ikut tampil bila skill itu ada di database (menambah skill di admin melengkapinya).
- Teks di scene (`heading`, `desc`) diisi nama skill dan, bila ada di database, kategorinya (dua bahasa) saat tombol disorot atau ditekan. Deskripsi lucu dari repo asli tidak dipakai.
- Semua aset di-host sendiri: URL Google Fonts di dalam scene diganti path lokal dengan panjang yang sama (`/spline/*.ttf`, Inter dan Archivo Black, OFL); `process.wasm` dari `@splinetool/modelling-wasm` 1.12.0 di `/spline` (`wasmPath`). Tidak ada permintaan ke unpkg atau Google.
- Performa: runtime (~1,5 MB) baru dimuat bila bagian skill hampir terlihat **dan** pengunjung sudah berinteraksi (kursor, sentuh, scroll, tombol). Sebelum itu, juga tanpa JavaScript, tanpa WebGL, atau dengan reduced-motion, keyboard CSS (bagian 19) yang tampil. Tinggi area sama, jadi tidak ada pergeseran tata letak. Lighthouse mobile tidak memicu muatan 3D; biaya nyata di ponsel setelah interaksi tetap ada.
- CSP publik ditambah `'unsafe-eval'`: runtime memakai `new Function` (msgpackr) dan WebAssembly. Admin tetap ber-nonce tanpa eval (ARCHITECTURE ADR 20).
- Aksesibilitas: canvas `aria-hidden`, daftar skill tersedia untuk pembaca layar; di halaman Skill daftar per kategori tetap ada.

## 21. Animasi ganti bahasa: acak huruf (2026-10-01)

Pemilik memilih animasi nomor 1 dari lima demo (acak huruf, gulung baris, papan bandara, ketik ulang, kabur per kata). Ganti bahasa tidak lagi memakai lingkaran yang meluas (bagian 18); lingkaran kini hanya untuk ganti tema.

- Tombol bahasa berpindah lewat navigasi biasa next-intl (tanpa memuat ulang halaman). Sebelum pindah, tombol mencatat teks yang sedang terlihat di `sessionStorage`.
- `LanguageScramble` di layout publik, setelah halaman tampil dalam bahasa baru, mengacak teks yang terlihat di layar lalu menguraikannya menjadi teks bahasa baru dari kiri ke kanan (650 ms, berurutan per teks). Teks yang sama di kedua bahasa (nama, kota, GitHub) tidak diacak. Spasi dan tanda baca tetap, jadi susunan kata tidak melompat.
- Hanya `nodeValue` node teks yang diubah dan nilai akhirnya selalu teks asli; bila React mengganti teks di tengah animasi, nilai React yang dipakai. Wilayah `aria-live`, isian form, dan teks tak terlihat tidak disentuh.
- Reduced-motion: tanpa animasi. Skrip `pagereveal` dan `@view-transition` untuk bahasa dihapus.

## 22. Suara tombol tema dan bahasa (2026-10-01)

Pemilik memilih dari dua demo berisi masing-masing 10 suara: tema nomor 5 (desir angin), bahasa nomor 2 (acak digital).

- `lib/ui-sounds.ts`, dibuat langsung dengan Web Audio: tanpa berkas audio, tanpa library, tanpa permintaan jaringan. Satu `AudioContext` dibuat saat tombol pertama kali ditekan.
- Tema: derau tersaring yang menyapu turun saat ke gelap dan naik saat ke terang (0,38 detik).
- Bahasa: 12 bip acak selama huruf diacak lalu satu nada penutup (sekitar 0,7 detik, selaras dengan animasi acak huruf). Ke English sedikit lebih tinggi.
- Hanya berbunyi dari klik pengguna, volume pelan (0,4). Browser tanpa Web Audio atau yang menolaknya: tombol tetap bekerja tanpa suara. Belum ada tombol untuk mematikan suara (menunggu keputusan pemilik).
