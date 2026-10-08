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
| Lampu menu aktif bergeser antar halaman | Desktop: React `<ViewTransition name>` (View Transitions bawaan browser). Nav bawah HP: satu elemen lampu yang digeser per kolom lewat `transform`. Mati pada reduced-motion | 0 KB library |
| Transisi antarhalaman | Desktop/laptop (pointer halus): View Transitions (CSS + dukungan Next.js/React). HP/tablet (`(hover: none) and (pointer: coarse)`): View Transitions dimatikan untuk pindah halaman, halaman baru masuk dengan animasi `transform` + `opacity` 320 ms searah urutan menu (`components/site/page-transitions.tsx`). Alasan dan hasil ukur di bagian 40 | < 1 KB |
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
| **Navbar** | Kapsul melayang di atas (gaya "tubelight"): foto profil bulat (inisial bila belum ada foto), menu teks dengan lampu di atas menu aktif, tombol bahasa bulat (menampilkan kode bahasa tujuan), tombol tema bulat (satu tombol terang/gelap). Tombol Unduh CV di topbar dihapus pemilik 2026-10-03 (CV tetap di hero, Tentang, dan footer). Di HP: kapsul atas hanya foto, bahasa, tema; menu jadi kapsul ikon tetap di bawah layar dengan label untuk pembaca layar |
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

Navigasi di atas. Urutan: **Home · About · Experience · Projects · Contact** (5 menu sejak 2026-10-01; Skills menjadi bagian beranda), di kanan: toggle bahasa, toggle tema (tombol "Unduh CV" di topbar dihapus 2026-10-03).

```
/[locale]                 Home
/[locale]/about           About
/[locale]/experience      Pengalaman (kerja + organisasi)
/[locale]/skills          dialihkan (308) ke /[locale]#skills
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

Rancangan C sejak 2026-10-05 (bagian 39):

```
┌──────────────────────────────────────────────┐
│ ████ pita hitam ████████████████████████████ │
│ ████ ┌────────┐ TENTANG SAYA ███████████████ │
│ ████ │ kartu  │ MUHAMMAD MIRZA █████████████ │
│ ████ │ foto   │ headline · [Unduh CV] ██████ │
│ ─────│        │───────────────────────────── │
│      └────────┘ PENDIDIKAN                    │
│ TENTANG SAYA    ┌─────────┐ ┌─────────┐       │
│ bio             │ SMA     │ │ BINUS   │       │
│                 └─────────┘ └─────────┘       │
└──────────────────────────────────────────────┘
```

### 5.3 Experience

```
h1 Pengalaman                    Filter: [Semua] [Kerja] [Organisasi]
                     │
   Peran · Instansi (logo) [foto kegiatan]
   • uraian       ───(L)───  2026
                     │
        2025  ───(L)─── Peran · Instansi
                     │   • uraian
   (timeline tengah, bergantian kiri-kanan; lihat bagian 38)
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

Aturan lain: target sentuh ≥ 44 × 44 px di HP (desktop ≥ 38 px karena ukuran dasar 87,5%, bagian 27), tidak ada scroll horizontal, area aman (safe-area) di iOS, teks bisa diperbesar sampai 200% tanpa kehilangan fungsi.

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
- Live chat diganti **tombol WhatsApp melayang** (tanpa skrip pihak ketiga), hanya tampil bila nomor WhatsApp diisi di admin. Dihapus pemilik 2026-10-03; WhatsApp cukup lewat kartu footer dan halaman kontak.
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
- Hanya berbunyi dari klik pengguna. Volume utama diatur di admin (bagian 31; awalnya tetap 0,4). Browser tanpa Web Audio atau yang menolaknya: tombol tetap bekerja tanpa suara. Belum ada tombol untuk mematikan suara (menunggu keputusan pemilik).

## 23. Navbar lima menu (2026-10-01)

- Halaman Skill dihapus: skill cukup tampil di bagian "Yang saya pakai" di beranda (`#skills`, keyboard 3D). URL lama `/id/skills` dan `/en/skills` dialihkan permanen (308) ke `/id#skills` dan `/en#skills`; sitemap tidak lagi memuatnya.
- Menu utama tinggal lima: Beranda, Tentang, Pengalaman, Project, Kontak, tetap di tengah.
- Topbar lebar penuh tanpa batas kontainer 1200 px: foto profil di pojok kiri, tombol bahasa dan tema di pojok kanan (jarak tepi 12 px di HP, 20 px di desktop).
- Baris kredit keyboard 3D (Naresh Khatri, Simple Icons, logo Git) pindah ke bawah bagian skill di beranda.

## 24. Suara menu utama (2026-10-01)

Pemilik memilih nomor 2 dari lima demo: **tik kaca** (dua sinus 2600 Hz dan 3950 Hz, 0,12 detik, lebih pelan dari suara tema dan bahasa karena menu paling sering ditekan). `playNavSound` di `lib/ui-sounds.ts`, dipanggil dari menu atas (desktop) dan menu bawah (HP). Menu yang sedang aktif tidak berbunyi karena halamannya tidak berpindah (diganti bagian 31: menu aktif kini berbunyi dan menggulir ke atas).

## 25. Animasi pindah halaman dan ikon menu HP (2026-10-01)

Pilihan pemilik dari demo: animasi nomor 1 (**geser searah**), ikon Beranda 1, Tentang 1, Pengalaman 2, Project 3, Kontak 1.

- Menu utama memberi tipe transisi lewat `transitionTypes` pada Link (Next.js 16): `nav-forward` bila menu tujuan berada di kanan menu aktif, `nav-back` bila di kiri. `<ViewTransition update={...}>` di layout publik memetakan tipe itu ke kelas `.nav-forward` dan `.nav-back` (globals.css): halaman lama keluar 48 px ke arah berlawanan sambil memudar (150 ms), halaman baru masuk dari sisi menu tujuan (360 ms, muncul setelah 120 ms). Navigasi lain (tautan biasa, ganti bahasa, tombol mundur browser) tetap pudar 150 ms. Mati pada reduced-motion.
- Ikon menu bawah HP: Beranda `House`, Tentang `User`, Pengalaman `BriefcaseBusiness`, Project `Code`, Kontak `Mail` (lucide).

## 26. Kartu ID bertali di kontak, sosial di footer (2026-10-01)

- Tombol bahasa memakai huruf yang sama dengan menu utama (Inter semibold), bukan mono.
- Halaman kontak (desktop): kartu ID bertali di kiri form (`components/site/id-lanyard.tsx`), prinsip dari portofolio ibnuhakim.id (tidak ada aset atau teks yang disalin). Isi kartu dari profil: foto, nama, peran saat ini, status ketersediaan, barcode hiasan, dan host situs. Kartu bisa ditarik lalu berayun dan diam lagi (pegas teredam, tanpa library); ayunan kecil saat halaman dibuka. Tali dan label status memakai Azure versi gelap karena kartu selalu gelap. Kartu adalah hiasan (`aria-hidden`); reduced-motion mematikan ayunan dan tarikan. Di HP kartu tidak tampil. (Tampilan dan fisika diganti di bagian 36.)
- Tautan sosial (GitHub, LinkedIn, Instagram, situs) pindah dari halaman kontak ke footer sebagai tombol ikon bulat (diganti kartu tautan di bagian 29). Logo GitHub dan Instagram dari Simple Icons; LinkedIn tidak ada di Simple Icons sehingga memakai tulisan "in"; situs memakai ikon globe. Halaman kontak tinggal kontak langsung (email, WhatsApp, kota).

## 27. Ukuran lebih rapat di desktop, foto profil ke beranda (2026-10-01)

- Pemilik menilai teks dan elemen terlalu besar (pembanding: ibnuhakim.id). Ukuran dasar `html` di desktop (≥ 1024 px) kini 87,5% (14 px bila browser 16 px), sehingga semua ukuran berbasis rem (teks, jarak, tombol) mengecil seragam 12,5%. Persen agar pengaturan ukuran huruf pengguna tetap berlaku. HP tetap 100%: teks terbaca dan isian form tidak memicu zoom iOS; target sentuh di HP tetap 44 px.
- Foto profil di topbar (`HomeAvatarLink`): kembali ke beranda dengan suara tik kaca dan geser mundur seperti menu Beranda; di beranda tidak berbunyi.

## 28. Kalender kontribusi GitHub di beranda (2026-10-01, tampilan diganti di bagian 44)

- Permintaan pemilik: kotak-kotak hijau seperti di profil GitHub, di beranda setelah bagian skill (nomor 05, ajakan kontak menjadi 06).
- Data dari GitHub GraphQL API (`contributionsCollection.contributionCalendar`) memakai `GITHUB_TOKEN` di server, disimpan 6 jam (`unstable_cache`). Nama pengguna diambil dari tautan GitHub di profil admin. Tanpa token, tanpa tautan GitHub, atau bila GitHub gagal, bagian ini tidak tampil sama sekali.
- Digambar sebagai SVG di server, tanpa JavaScript klien. Kotak 11 px dengan jarak 3 px, sudut 2 px; di desktop SVG melebar mengisi kartu, di HP tetap ukuran asli dan bisa digulir dengan posisi awal di minggu terbaru (trik `direction: rtl`).
- Warna level 1–4 memakai hijau khas GitHub (token `--gh-1` sampai `--gh-4`, versi terang dan gelap); level 0 memakai `--surface-2`. Ini pengecualian dari palet hitam-putih karena pemilik meminta tampilan seperti GitHub.
- Label bulan (singkatan sesuai bahasa) dan hari Senin/Rabu/Jumat lewat `Intl`. Label bulan pertama yang hanya terlihat sebagian dibuang bila menabrak bulan berikutnya.
- Aksesibilitas: SVG `aria-hidden`; pembaca layar mendapat ringkasan "N kontribusi dalam setahun terakhir". Tiap kotak punya `<title>` (jumlah dan tanggal) sebagai tooltip kursor. Tautan "Buka profil GitHub" membuka tab baru dengan keterangan untuk pembaca layar.

## 29. Footer kartu tautan (2026-10-03)

- Pilihan pemilik dari lima demo: nomor 2, kartu tautan (prinsip dari portofolio nickh-portofolio.vercel.app; tidak ada aset atau teks yang disalin). Footer berisi judul "Hubungi saya" lalu kartu WhatsApp, Email, LinkedIn, GitHub, Instagram, situs (bila diisi), dan Resume CV, dengan urutan tetap. Di bawahnya hak cipta. Keterangan stack, tautan Kebijakan Privasi, dan kalimat "Pilih jalur yang paling nyaman" dihapus pemilik 2026-10-03 (halaman privasi tetap ada, ditautkan dari form kontak dan tercantum di sitemap).
- Tiap kartu: ikon, nama, dan nilai (nomor, alamat, nama akun dari URL profil, atau host), panah ↗. Grid 1 kolom di HP, 2 di tablet, 3 di desktop. Kartu biasa `--surface` dengan border; hover menguatkan border dan naik 2 px (hanya bila gerak tidak dikurangi). Kartu CV disorot dengan warna `--primary` (hitam di tema terang, putih di tema gelap).
- Data dari admin; kartu yang kosong tidak tampil, dan bila semuanya kosong hanya baris hak cipta yang tampil. Tautan luar membuka tab baru dengan keterangan untuk pembaca layar; email membuka jendela tulis pesan Gmail di web (`mail.google.com/mail/?view=cm`, revisi 2026-10-03; sebelumnya `mailto:`).
- Ikon WhatsApp, GitHub, Instagram, dan Google Drive dari Simple Icons (CC0); LinkedIn memakai tulisan "in"; email, situs, dan CV selain Google Drive memakai ikon lucide.
- Resume CV: kolom baru `Profile.cvUrl` ("Link CV" di admin, mis. Google Drive). Bila diisi, `/api/cv` (dipakai semua tombol CV: topbar, beranda, tentang, footer) mengarah ke link itu dan tetap mencatat jumlah unduhan; bila kosong, memakai PDF yang di-upload. Keterangan kartu: "Google Drive", host link lain, atau "PDF".

## 30. Tanda salah di login admin dan garis keliling kartu (2026-10-03)

- Pilihan pemilik dari lima demo: nomor 1, pesan di bawah kolom. Kolom yang salah mendapat bingkai dan kilau merah (`.login-field-bad`), ikon kolom ikut merah, dan pesan singkat berikon tepat di bawah kolom. Satu wilayah `role="alert"` tersembunyi membacakan pesan untuk pembaca layar; tiap kolom memakai `aria-invalid` dan `aria-describedby`.
- Email diperiksa di browser saat kolom ditinggalkan dan saat dikirim: kosong, format salah, atau domain berbeda dari domain email Super Admin di database ("Use your @gmail.com address."). Email yang salah tidak dikirim ke server sehingga tidak menghabiskan jatah 5 percobaan per 15 menit. Domain diambil dari database (bukan ditulis mati) agar lingkungan lokal/CI dan penggantian email admin tetap jalan; hanya domain yang dikirim ke browser.
- Bila server menolak, kolom password yang ditandai ("Incorrect password."). Server sengaja tidak membedakan email tak terdaftar dan password salah, jadi tanda ini muncul setiap kali login ditolak dengan email yang formatnya benar. Batas percobaan dan galat lain tampil di bawah form.
- Teks tombol "Login", "Logging in…" saat menunggu, lalu "Logged in" dengan centang sebelum pindah ke panel. Judul tab "Login · Admin". Sempat diganti "Sign in", dikembalikan ke "Login" atas permintaan pemilik 2026-10-03: tidak ada kata "Sign in" di halaman login.
- Garis cahaya di tepi kartu kini satu bingkai gradien conic berputar yang dipotong mask (`.login-card::before`), sehingga mengikuti lengkung keempat sudut. Sebelumnya empat garis lurus yang terpotong di sudut (terlihat siku di Safari iPhone). Diam pada reduced-motion.

## 31. Volume suara di admin, gulir ke atas, ganti bahasa tanpa melompat (2026-10-03)

- Volume suara tombol tema, bahasa, dan menu diatur Super Admin di `/admin/settings` (penggeser 0–100, langkah 5, tombol "Coba suara"; 0 = tanpa suara). Disimpan di tabel `SiteSetting` (satu baris), dikirim ke halaman publik lewat `<html data-sound-volume>` dan dibaca `lib/ui-sounds.ts` setiap kali berbunyi. Bawaan 80 (dua kali volume lama 0,4). Kompresor di ujung rantai audio menjaga suara tidak pecah di volume tinggi.
- Suara menu (tik kaca) dibuat lebih keras: puncak 0,32 dan 0,16 (sebelumnya 0,12 dan 0,06), sedikit lebih panjang.
- Menekan menu yang halamannya sedang dibuka, atau foto profil saat di beranda, menggulir ke bagian paling atas halaman itu (halus; langsung bila gerak dikurangi) dan tetap berbunyi. Hash seperti `#skills` dibuang. Halaman turunan (detail project) tetap pindah ke halaman menu.
- Ganti bahasa tidak lagi melompat ke atas: tautan bahasa memakai `scroll={false}` sehingga posisi gulir tetap.
- Footer: kartu WhatsApp mengubah nomor berawalan 0 menjadi 62 (wa.me menolak awalan 0); kartu email membuka Gmail. Tombol WhatsApp melayang dan tombol Unduh CV di topbar dihapus.

## 32. Halaman kontak: kartu ID di samping judul (2026-10-03)

- Pilihan pemilik dari sepuluh demo: nomor 1 tanpa tombol cepat. Kartu ID bertali di kolom kiri (desktop), sedangkan judul "Hubungi saya", pengantar, dan form di kolom kanan, sehingga kartu tergantung sejajar dengan judul.
- Daftar "Atau langsung" (email, WhatsApp, kota) di bawah form dihapus karena kontak langsung, sosial, dan CV sudah ada di footer kartu tautan (bagian 29). Pesan galat form kini menunjuk ke tautan di bagian bawah halaman.
- Di HP kartu tetap tidak tampil; urutan judul, pengantar, lalu form.

## 33. Kilau di kolom form kontak (2026-10-03)

- Permintaan pemilik: kolom nama, email, subjek, dan pesan di halaman kontak diberi kilau berjalan mengelilingi kotak seperti login admin. Bedanya, warnanya ikut tema: kilau terang di tema gelap, kilau gelap di tema terang (`color-mix` dari `--text`). Saat kolom aktif kilau lebih tegas; saat salah kilau memakai `--danger`.
- Dibuat sebagai bingkai bermask di atas border kolom (`.field-shine::after`, prop `shine` di `PublicField`), jadi border dan tanda salah bawaan tetap ada. Tiap kolom berselang 1,1 detik agar tidak bergerak serempak. Diam pada reduced-motion.
- Kalimat "Data Anda hanya dipakai untuk membalas pesan ini. Kebijakan Privasi" di bawah form dihapus atas permintaan pemilik. Halaman `/privacy` tetap ada dan tercantum di sitemap.
- Di HP `html` memakai `scroll-padding-bottom` setinggi menu ikon bawah, sehingga elemen yang digulir ke layar (fokus keyboard, tombol kirim, tautan #anchor) berhenti di atas menu dan tidak tertutup (WCAG 2.4.11). Ditemukan lewat tes E2E form kontak tanpa JavaScript.

## 34. Judul kontak, tombol kirim, dan pesan terima kasih (2026-10-03)

- Judul pilihan pemilik: EN "Let’s work together" dengan pengantar "Let’s build something impactful together." lalu lanjutan yang menyebut tawaran kerja, project freelance, atau ide komunitas. ID memakai terjemahannya ("Mari bekerja sama", "Mari bangun sesuatu yang berdampak bersama."). Lanjutan kalimat ditulis sendiri, tidak disalin dari situs lain, dan tidak menjanjikan waktu balas.
- Tombol kirim (demo nomor 5): bergaris dengan kilau berputar yang warnanya ikut tema, terisi saat disentuh. Saat mengirim menyusut jadi lingkaran berpemutar. (Fase hijau mengkilap dan kotak terima kasih diganti tiket ringkasan, bagian 35.)
- Sekitar 1 detik kemudian form menyusut dan muncul kotak "Terima kasih, {nama}." dengan "Pesan sudah masuk. Coba lagi". "Coba lagi" memasang ulang form kosong (tanpa JavaScript: memuat ulang halaman). Urutan animasi murni CSS sehingga sama dengan atau tanpa JavaScript; dengan reduced-motion kotak langsung tampil.
- Tanda salah seperti login admin: bingkai dan kilau merah dengan cincin tipis, pesan berikon di bawah kolom, dan tanda hilang begitu kolom diketik ulang. Ringkasan galat untuk pembaca layar tetap ada.

## 35. Tiket ringkasan setelah pesan terkirim (2026-10-03)

- Pilihan pemilik dari lima demo: nomor 3. Setelah terkirim, form memudar dan menyusut, lalu tiket terbuka dari atas: judul "Pesan terkirim" dengan lencana "Masuk", garis putus-putus dan lekukan di kedua sisi, lalu baris Dari, Balasan ke, Subjek (bila diisi), Pesan (maks. 3 baris), dan Waktu (WIB, zona Mirza, agar server dan browser menulis hal yang sama). Di bawahnya "Tulis pesan lain" untuk form kosong baru.
- Pengantar kontak dipersingkat menjadi "Mari bangun sesuatu yang berdampak bersama. Saya balas ke email yang Anda tulis." dan tombol EN menjadi "Send Message".
- Urutan animasi murni CSS sehingga sama dengan atau tanpa JavaScript; dengan reduced-motion tiket langsung tampil.
- Revisi pemilik: ringkasan "Periksa kembali isian yang ditandai" tidak lagi terlihat (tetap dibacakan pembaca layar dan menerima fokus); tanda per kolom sudah cukup. Galat lain (batas kiriman, gagal simpan) tetap terlihat. Kotak kartu ID dinaikkan ke 42rem agar kartu yang tergantung tidak menempel ke footer saat isi di sampingnya pendek.

- Revisi pemilik: di desktop kotak tiket selebar kalimat pengantar di atasnya, sehingga ujung kanannya sejajar dengan akhir kalimat (kolom `contact-col` menjadi `fit-content` saat terkirim; tiket memakai `contain: inline-size` agar tidak ikut menentukan lebar). Form sebelum terkirim dan tampilan HP tidak berubah.

## 36. Kartu ID kanvas: kaca, logam, dan pita bertulis (2026-10-03)

- Pilihan pemilik dari sepuluh demo: tema gelap memakai kartu kaca (demo 5: isi tembus pandang, garis tepi terang, kilau yang bergeser saat kartu miring); tema terang memakai kartu logam (demo 6: gradasi abu tua ke hitam). Tali di kedua tema berupa pita bertulis seperti demo 10 dengan host situs berulang: pita putih bertulisan hitam di tema gelap, pita hitam bertulisan putih di tema terang. Tema dibaca dari kelas `dark` di `html` dan kanvas digambar ulang saat tema berganti.
- Fisika: atas permintaan pemilik memakai fisika standar, bukan fisika melayang demo 10. Tali tidak melar (rantai titik verlet), gravitasi 2100, redaman 0,992, pantulan 0,55. Kartu bisa ditarik dan dilempar, berayun, berputar semu 3D dari kecepatan sudutnya, memantul dari keempat tepi kanvas, lalu diam sendiri. Titik kartu diberi jarak setengah lebar kartu dari tepi agar sudutnya tidak terpotong. Ayunan pembuka dibuat kecil agar kartu tidak menutupi form saat halaman dibuka.
- Ditulis sendiri di `components/site/id-lanyard.tsx` dengan Canvas 2D, tanpa library. Referensi (portofolio ihyaabrar, tanpa lisensi) hanya dipakai sebagai prinsip; tidak ada kode, aset, atau teks yang disalin.
- Kanvas lebih lebar dari kolom agar kartu bebas berayun, tetapi `pointer-events: none`; tarikan dideteksi lewat event pointer di `window` dengan uji kena pada badan kartu, sehingga klik di luar kartu (termasuk kolom form di sampingnya) tetap berfungsi.
- Hemat daya: perulangan berhenti saat kartu diam dan saat kanvas di luar layar (IntersectionObserver). Reduced-motion: kartu digambar diam, tanpa ayunan dan tarikan. Tetap hiasan (`aria-hidden`) dan tidak tampil di HP.
- Revisi pemilik: kartu sempat diam miring di laptop. Penyebabnya kotak kartu bertinggi 42rem, yang menyusut ke 588 px karena ukuran dasar desktop 87,5%, sehingga ujung bawah kartu menyentuh lantai kanvas. Tinggi kotak kini dihitung dalam px dari tali + kartu + jarak tepi (660 px), memberi ruang lebih di bawah kartu. Perulangan juga baru berhenti setelah kartu diam sekitar 0,5 detik berturut-turut, agar tidak membeku di puncak ayunan. Awal tali sejajar puncak huruf judul (jarak atas judul + sekitar 0,2 ukuran huruf `--text-h1`).
- Revisi pemilik: jarak form kontak ke footer dirapatkan (kotak kartu 640 px, `pb-12` di halaman kontak). Garis gelap di bawah kartu yang muncul di Chrome Windows berasal dari bayangan `ctx.filter = blur()`; bayangan kini memakai `shadowBlur` (didukung semua browser, termasuk Safari yang tidak mengenal `ctx.filter`), dan titik kartu berjarak setengah lebar kartu + 28 px dari tepi agar kartu dan bayangannya tidak pernah terpotong tepi kanvas.

## 37. Isi kartu ID dan suara tarik (2026-10-03)

- Pemilik tetap memakai desain kartu dan tali bagian 36 (kaca/logam + pita bertulis), dengan isi baru: nama lengkap satu baris (huruf mengecil otomatis bila tidak muat), di bawahnya "FULLSTACK DEVELOPER" (`Contact.cardRole`), lalu barcode hiasan dan host situs. Label status ketersediaan dihapus dari kartu. Foto dibuat lebih tinggi (132 → 160 px).
- Suara tarik: pilihan pemilik dari sepuluh demo, nomor 6 "Pegas" (`playLanyardSound` di `lib/ui-sounds.ts`). Saat kartu diambil terdengar nada naik singkat; saat dilepas terdengar getaran pegas yang melambat. Ikut volume Super Admin (0 = senyap) dan hanya diputar dari tarikan pengguna.

## 38. Halaman Pengalaman: timeline tengah "fokus aktif" (2026-10-03)

- Pilihan pemilik dari sepuluh variasi timeline tengah: nomor 9 "Fokus aktif". Pendidikan tidak lagi tampil di halaman Pengalaman maupun di bagian perjalanan beranda; filter tinggal Semua, Kerja, Organisasi. Judul menjadi "Pengalaman" / "Experience". Data pendidikan tetap ada di admin dan dipakai halaman Tentang.
- Tata letak (`.xp-tl` di globals.css): di layar >= 768 px garis di tengah, isi bergantian kiri-kanan, simpul di garis berisi logo instansi (atau inisial bila belum ada logo, mis. "PS" untuk PT PGAS Solution), dan sisi seberang berisi foto kegiatan (atau tahun mulai + durasi bila belum ada foto). Kolom kiri rata kanan dengan penanda poin di ujung kalimat. Saat filter dipakai, kiri-kanan dihitung ulang dari entri yang terlihat (`:nth-child(... of [data-type])`), jadi tetap bergantian. Di HP garis pindah ke kiri, foto di bawah teks, dan tahun besar disembunyikan karena tanggal sudah ada di atas judul.
- Fokus aktif (`FocusTimeline`, komponen klien kecil): entri yang paling dekat dengan tengah layar diberi `data-active`; logonya membesar (1,18) dengan garis Azure. Revisi pemilik: dibuat persis seperti demo 9, jadi simpul logo berbentuk persegi bersudut tumpul (radius 12 px), bukan bulat, dan seluruh entri yang tidak aktif meredup abu-abu dengan logo dan foto berbuka 0,35. Satu perbedaan sengaja dari demo: teks yang redup memakai warna campuran 85% `--text-muted`, bukan opacity, agar kontras tetap AA (WCAG 2.2, juga diperiksa tes axe). Di dasar halaman entri terakhir dianggap aktif. Tanpa JavaScript semua entri tampil penuh; reduced-motion mematikan transisinya.
- Logo dan foto diunggah dari admin per pengalaman (halaman ubah pengalaman, slot "Logo instansi" maks. 2 MB dan "Foto kegiatan" maks. 5 MB, teks alternatif dua bahasa wajib) lewat alur Cloudinary yang sama dengan foto profil. Logo diberi latar putih bulat agar logo gelap tetap terbaca di tema gelap. Kolom baru: `Experience.photoId` (migrasi `experience_photo`); `logoId` sudah ada.
- Koreksi catatan sebelumnya: garis timeline lama yang tampak memanjang di tangkapan layar bukan bug; entri di bawah layar masih menunggu animasi reveal.
- Revisi pemilik (2026-10-03 malam): kalimat pengantar dan filter (Semua/Kerja/Organisasi) dihapus; halaman ini hitam-putih tanpa Azure (tanggal, titik "sekarang", dan penanda poin memakai warna teks). Kotak logo yang aktif memakai kilau berputar di tepinya seperti kartu login, putih di tema gelap dan hitam di tema terang. Logo yang diunggah memenuhi kotak (object-cover, tanpa latar putih dan jarak dalam).
- Revisi pemilik (2026-10-04): judul "Pengalaman" di tengah (`PageIntro align="center"`); label jenis (Kerja/Organisasi) di samping tanggal dihapus; urutan berdasarkan bulan selesai menjabat, terbaru di atas, yang masih berjalan paling atas (`sortByLatest`, juga dipakai bagian perjalanan beranda). Contoh: Ace Padel Club (selesai Apr 2026) di atas Freshmen Partner (selesai Jan 2026).
- Revisi pemilik (2026-10-04 malam): judul rata tengah hanya mulai 768 px, di HP kembali rata kiri. Isi tiap entri memakai format LinkedIn: peran, lalu "Instansi · Jenis pekerjaan" (mis. "PT PGAS Solution · Internship" / "Magang"), lalu "Mulai - Selesai · Durasi" (mis. "Jul 2026 - Present · 4 mos"). Lokasi dan titik "sekarang" tidak ditampilkan lagi. Jenis pekerjaan adalah kolom baru opsional `Experience.employmentType` (Full-time, Part-time, Self-employed, Freelance, Contract, Internship, Apprenticeship, Seasonal, Volunteer) yang dipilih di admin; PT PGAS Solution diisi Internship lewat migrasi karena dikonfirmasi pemilik, entri lain kosong sampai diisi.
- Efek pilihan pemilik (2026-10-05, demo efek timeline): A5 bingkai logam perak di foto kegiatan (`.xp-frame`); B9 cahaya di garis yang berpusat di logo entri aktif dan bergeser saat entri berganti (`.xp-tl::after`, posisi `--xp-fill` dari `FocusTimeline`); C1 kilau abu menyapu judul entri aktif (dihapus pada revisi 2026-10-05: judul tanpa efek); D10 logo aktif hanya membesar (kilau di dalam kotak logo dihapus); E4 entri tidak aktif buram 2 px lalu tajam saat aktif. Reduced-motion mematikan kilau dan transisinya.
- Revisi pemilik (2026-10-05 sore): judul tanpa efek kilau; durasi bahasa Inggris selalu "yrs" (contoh "1 yrs", permintaan pemilik); durasi di bawah tahun besar dihapus (durasi tetap di baris tanggal); garis tidak lagi tampak menembus kotak logo (entri berada di atas garis, redup hanya pada isi kotak, latar kotak tetap pekat); bingkai foto lebih tipis (2,5 px).
- Logo C10 (pilihan pemilik 2026-10-05): kilau putih menyapu logo satu kali saat entri menjadi aktif. Kotak logo memakai garis tepi 1 px yang redup dan menyala saat entri aktif (demo garis logo nomor 3). Tepi digambar sebagai lapisan `::before` di atas gambar (bukan `border`) agar tidak ada celah hitam-putih di sudut. Bingkai foto mode terang didominasi hitam (revisi pemilik). Sisi atas foto dan kotak logo sejajar satu baris di layar lebar (padding atas sisi foto dihapus, logo aktif membesar ke bawah dari sisi atasnya). Warnanya mengikuti garis timeline (revisi pemilik): saat redup sama dengan garis dasar (`--border`), saat aktif sama dengan inti cahaya garis (`--xp-line-core`, putih di gelap dan hitam di terang) setebal 2 px dengan pendar `--xp-line-glow`, dan garis timeline menyentuh kotak logo tanpa celah (cincin latar 6 px dihapus). Mode terang hanya mengganti warna, desain sama dengan mode gelap: garis inti `#171717` berpendar abu muda (A4), bingkai foto perak gelap (B1). Warna ada di variabel `--xp-line-core`, `--xp-line-glow`, dan `--xp-silver`.
- Revisi pemilik (2026-10-07): (1) **penanda titik di sisi teks dihapus** di kedua sisi (kiri dan kanan) pada desktop, sesuai saran: titik di ujung kalimat rata kanan terasa janggal, dan di halaman hitam-putih ini tidak menambah informasi. (2) Poin deskripsi dibatasi `max-width: 27rem`, dibagi seimbang (`text-wrap: balance`), rata kiri-kanan (`text-align: justify`), dan menempel ke sisi garis tengah, sehingga poin PGAS (GAAS, SMART, audit gudang) masing-masing **dua baris** dengan jumlah kata hampir sama, baik di EN maupun ID. Baris terakhir mengikuti sisi garis. (3) Label durasi memakai kata penuh: ID "Bulan" / "Tahun", EN "Month(s)" / "Year(s)" dengan bentuk jamak yang benar ("1 Year", "4 Months"), menggantikan "mos"/"yrs". (4) Judul **Freshman** menjadi "Freshmen Partner & Freshman Leader" (tanpa "(Volunteer)"; jenis pekerjaan Volunteer tetap tampil di baris instansi). (5) Judul Budi Luhur "Chairman, Reader Ambassador" kini sama di ID dan EN (tidak diterjemahkan). Data produksi: migrasi `20261007100000_experience_titles` hanya mengubah judul yang belum diedit pemilik di admin.
- Revisi pemilik (2026-10-07 malam): (1) poin deskripsi **tidak lagi rata kiri-kanan**; rata ke sisi garis tengah dengan baris seimbang (`text-wrap: balance`), karena spasi antarkata terlalu lebar. (2) Isi poin Ace Padel Club, Algo Bootcamp, Horizon Organizer, dan Freshman diganti teks dari pemilik (EN persis, ID diterjemahkan); judul Budi Luhur menjadi **"Chairman Reader Ambassador"** (tanpa koma, sama di ID dan EN). (3) Semua entri bisa diubah dan ditambah dari admin (Pengalaman), termasuk nama instansi bahasa Inggris (opsional). (4) Navigasi bawah HP **hanya ikon** (28 px); nama menu tetap terbaca pembaca layar.
- Suara (pilihan pemilik 2026-10-08, demo A3 "Bip digital"): bip kotak 1250 Hz, 45 ms, pelan, setiap kali entri aktif berganti **karena digulir** (bukan saat halaman dibuka atau ukuran jendela berubah). Seperti suara lain, browser baru mengizinkannya setelah pengunjung menekan atau menyentuh halaman, jadi gulir pertama sebelum interaksi apa pun bisa sunyi. Volume mengikuti pengaturan suara di admin.


## 39. Halaman Tentang: rancangan C (2026-10-05)

- Pilihan pemilik dari 50 demo dan 5 gabungan (nomor 7 Lembar CV dan 36 Dua kartu pendidikan): **C**. Isi halaman hanya tiga hal: bio, pendidikan (SMA dan kuliah), dan tombol Unduh CV. Daftar kontak (email, WhatsApp, sosial, kota) dan tautan "Lihat pengalaman" dihapus dari halaman ini; kontak tetap ada di halaman Kontak dan footer.
- **Pita hitam** (`.ab-band`): latar `--text` dan teks `--bg`, jadi otomatis putih di tema gelap. Berisi label "Tentang saya", nama (h1), headline, dan tombol Unduh CV (`.ab-cv`, terbalik dari pita). Tombol hanya tampil bila CV sudah diunggah atau tautannya diisi di admin.
- **Kartu foto menggantung** (`.ab-pc`, komponen `AboutPhotoCard`): bingkai gelap 3 px dengan cincin terang di luar supaya terlihat di atas pita dan di bawahnya, siku bidik di empat sudut, chip kampus di sudut atas kanan (logo dan nama), pil semester di bawah, dan chip bendera Indonesia (hiasan, `aria-hidden`). Foto dari admin (Cloudinary) didahulukan, bila belum ada dipakai foto bawaan.
- **Pendidikan** (`.ab-edu`): kartu besar berisi logo, nama instansi, jurusan atau program, dan periode. Datanya dari entri Pengalaman bertipe **Pendidikan** (tidak ada tabel baru): urut dari yang paling lama ke terbaru, jadi SMA lalu kuliah. Tambah SMA lewat admin: Pengalaman baru, tipe Pendidikan, isi instansi dan program, unggah logo.
- **Chip kampus dan pil semester** diambil dari pendidikan yang masih berjalan (bila tidak ada, yang terbaru, dan pilnya disembunyikan). Nomor semester **dihitung otomatis** dari bulan mulai (`semesterNumber`, 6 bulan per semester): Sep 2024 pada Okt 2026 menjadi "Semester 5" / "5th semester". Ini perkiraan, bukan data resmi kampus.
- Mobile (di bawah 860 px): kartu foto berada di dalam pita tanpa menggantung, bio dan kartu pendidikan bertumpuk.
- Revisi pemilik (2026-10-05 sore): (1) judul besar "Tentang saya" / "About me" di atas halaman rata tengah di desktop seperti halaman Pengalaman (`PageIntro`), jadi nama di pita menjadi h2; (2) label kecil "Tentang saya" di dalam pita dihapus; (3) baris peran diganti **"Fullstack Developer | Community Manager"** (teks tetap di `messages/*.json`, kunci `About.roles`; headline profil di beranda tidak berubah); (4) kolom bio dan pendidikan sejajar, judul "Tentang saya" dan "Pendidikan" berada di baris yang sama.
- Isi mengikuti CV terbaru pemilik: bio dari bagian SUMMARY CV (kalimat "At 20 years old" tidak dipakai karena usia berubah), kartu pendidikan BINUS menampilkan IPK 3,41/4,0 (sampai semester 5) dan mata kuliah relevan dari kolom deskripsi entri Pendidikan (markdown). SMA tidak ada di CV, jadi belum tampil; tambahkan lewat admin bila ingin.
- Data produksi: migrasi `20261005160000_about_content_from_cv` mengganti bio dan deskripsi bawaan seed hanya bila belum diubah pemilik, dan menambah entri BINUS bila belum ada satu pun entri Pendidikan.
- Revisi pemilik (2026-10-05 malam): SMA ditambahkan dari LinkedIn pemilik, **SMAS Budi Luhur**, SMA IPA, 2021–2024, nilai 88,3, sebagai entri Pendidikan (migrasi `20261005170000_education_high_school` dan seed). Periode pendidikan di halaman Tentang ditampilkan **hanya tahun** ("2021 – 2024", "2024 – sekarang") karena bulan SMA tidak diketahui; bulan di tanggal entri hanya untuk urutan dan hitungan semester. Nilai SMA dan IPK kuliah ada di kolom deskripsi tiap entri.
- Revisi pemilik (2026-10-05 malam, 2): (1) mode terang: bingkai foto diberi cincin hitam tipis di luar dan bayangan, chip kampus dan bendera diberi garis hitam 2 px, karena foto berlatar terang menyatu dengan halaman; mode gelap tidak berubah. (2) Kartu foto naik (padding atas pita 24 px) dan diperkecil menjadi 260 px. (3) Judul "Tentang saya" dan "Pendidikan" memakai font display (Oswald) 28 px, bukan label mono. (4) Teks bio rata kiri-kanan (`text-align: justify`, `hyphens: auto`) dengan kolom bio 340 px agar jarak antarkata wajar. (5) Baris "Mata kuliah relevan" dihapus dari kartu BINUS; hanya IPK. (6) Logo pendidikan memakai logo yang sudah ada di Pengalaman: SMAS Budi Luhur memakai logo Reader Ambassador (Budi Luhur), BINUS University memakai logo Freshman (Student Support, BINUS University); disalin lewat migrasi `20261005180000_education_gpa_only_and_logos`, dan bisa diganti dari admin.
- Revisi pemilik (2026-10-06): kotak Tentang di **tema terang** berbingkai hitam **3 px** (pita dan bagian bawah satu bingkai; pilihan B dari lima demo), sama tebal dengan bingkai foto, karena bagian bawah yang putih dengan garis abu 1 px menyatu dengan halaman. **Tema gelap tidak diubah** (garis tipis `--border`): sempat dicoba berbingkai putih 3 px, tetapi pemilik menilai tampilan sebelumnya lebih bagus.
- Revisi pemilik (2026-10-07): (1) judul "Tentang saya" dan "Pengalaman" **rata tengah di semua ukuran layar**, termasuk HP (`PageIntro align="center"`); di HP blok nama dan peran di pita Tentang juga di tengah. (2) Navigasi bawah di HP dibesarkan seperti tab bar aplikasi GitHub: lima kolom sama lebar, tinggi tombol 60 px, ikon 24 px, label tampil di bawah ikon (11 px, dipotong bila sempit; diuji di 360 px), lebar maksimal 28 rem, dan jarak bawah halaman `pb-28` agar isi tidak tertutup. Varian atas (desktop) tidak berubah.
- Revisi pemilik (2026-10-07 malam): (1) tombol **Unduh CV dihapus** dari pita; nama dan baris peran berada di **tengah** pita (tengah vertikal dan horizontal kolom teks). CV tetap ada di kartu footer. (2) Baris peran ("Fullstack Developer | Community Manager") kini **diatur dari admin** (Profil, kolom "Peran di halaman Tentang", dua bahasa); teks di `messages/*.json` hanya cadangan bila kosong. (3) Bio diganti teks dari pemilik (versi CV lengkap, termasuk "At 20 years old"). Kolom bio dilebarkan menjadi 400 px karena bio lebih panjang. (4) Nama instansi pendidikan **mengikuti bahasa** lewat kolom baru `Experience.organization_en`: "SMAS Budi Luhur" / "Budi Luhur Senior High School", "Universitas Bina Nusantara" / "Bina Nusantara University" (bukan "BINUS"). Chip kampus di kartu foto ikut. Jurusan juga per bahasa: "SMA, Jurusan IPA" / "Senior High School, Natural Sciences", "S1 Ilmu Komputer – Kecerdasan Buatan" / "Bachelor of Computer Science – Artificial Intelligence". (5) Kartu pendidikan **satu per baris** (logo di kiri, isi di kanan), sehingga jurusan dan IPK muat satu baris di desktop, dan jenjang baru (mis. S2) otomatis tampil paling bawah (urut dari yang terlama). Di HP teks tetap boleh turun baris. (6) "sekarang" menjadi **"Sekarang"** / "Present". (7) IPK tanpa "(sampai semester 5)". (8) **Kartu foto bisa dimiringkan** seperti video contoh pemilik (`PhotoTilt`): kartu miring 3D sampai 12° mengikuti kursor, cahaya lembut ikut bergerak di atas foto, chip kampus, pil semester, dan bendera melayang lebih dekat (`translateZ`), kursor tangan ("grab"), dan kartu mengecil 3% saat ditekan. Saat kursor keluar kartu kembali tegak dalam 700 ms. Di layar sentuh kartu bereaksi saat disentuh atau digeser ke samping; geser atas-bawah tetap menggulir halaman. Hanya `transform` (GPU), mati pada reduced-motion. Data produksi: migrasi `20261008100000_about_contact_editable` (kolom baru) dan `20261008110000_about_experience_content` (isi).
- Revisi pemilik (2026-10-08): (1) nama dan peran **rata kiri** di pita desktop (tetap di tengah tinggi pita); di HP tetap di tengah, dan peran dipecah per baris di tanda "|" ("Fullstack Developer" / "Community Manager") tanpa garis pemisah. (2) Pil **"5th semester" dihapus** beserta hitungan semesternya. (3) **Bingkai foto tebal dihapus** (garis 3 px dan cincin luar); tersisa tepi tipis samar (warna halaman 35%) dan bayangan lembut. (4) **Chip kampus dan bendera kaca gelap agak bening** seperti contoh pemilik: latar hitam 55% + `backdrop-filter: blur`, garis putih tipis, teks mono putih, ubin logo putih, sama di kedua tema; nama kampus selalu satu baris. (5) HP lebih rapi: logo pendidikan tidak ikut menyempit (52 px), judul instansi lebih kecil, bio rata kiri tanpa pemenggalan kata. (6) **Suara kilau** (demo B1) saat kursor masuk ke kartu foto dan terus selama kursor bergeser di atasnya, paling sering tiap 250 ms dan hanya bila kursor berpindah minimal 16 px; di HP saat foto disentuh.
- Revisi pemilik (2026-10-08, 2): (1) chip kampus dan bendera memakai **font aplikasi** (Inter semibold, bukan mono), **warnanya ikut tema** (gelap di tema gelap, terang di tema terang; latar `--bg` 82%), dan lebih pekat (82%, sebelumnya 55%). Ubin logo putih diberi garis tipis. (2) **Siku bidik di empat sudut foto dihapus.** (3) Suara foto **lebih lambat dan halus**: satu nada sinus lembut (dua sinus berselisih 4 sen, naik 30 ms, hilang 0,7 s) tiap 190 ms selama kursor bergeser minimal 6 px. Tiap nada **melanjutkan** urutan nada naik-turun (E6–D7), tidak mulai dari awal.
- Revisi pemilik (2026-10-08, 3): bip timeline Pengalaman **lebih keras** (volume 0,07 menjadi 0,2, 60 ms). Di HP foto halaman Tentang **tepat di tengah** pita (jarak kartu kiri-kanan sama, chip kampus dan bendera menonjol sama jauh), dan bio kembali **rata kiri-kanan seperti desktop** dengan pemenggalan kata otomatis (termasuk `-webkit-hyphens` untuk Safari iPhone).

## 40. Performa gerak di HP, ganti bahasa, dan tombol tema (2026-10-07 malam)

- Keluhan pemilik: pindah halaman di HP patah-patah (di laptop mulus); ganti bahasa dan ganti tema tersendat hanya pada klik pertama.
- Ukur (Playwright, emulasi Pixel 7, CPU 4x lebih lambat, build produksi, jeda frame terburuk per navigasi): dengan View Transitions 117–400 ms dan long task sampai 290 ms; tanpa View Transitions 33–133 ms. Mematikan snapshot root tidak membantu. Penyebabnya, View Transitions mengambil snapshot halaman lama dan baru serta menjalankan commit React secara sinkron dalam satu task panjang.
- Perbaikan pindah halaman: di perangkat sentuh `document.startViewTransition` ditutup (`page-transitions.tsx`), sehingga React memakai jalur bawaannya untuk browser tanpa View Transitions: DOM langsung diganti, lalu `#main` masuk dengan geser 40 px + pudar 320 ms (Web Animations, `transform`/`opacity`, dikerjakan GPU) searah urutan menu. Hasil ukur sesudahnya: 33–117 ms dan umumnya tanpa long task. Desktop tidak berubah. Lampu nav bawah HP digeser dengan `transform` (bukan View Transitions). Kapsul nav bawah tidak lagi memakai `backdrop-blur` (latar 95% pekat): blur di elemen fixed dihitung ulang tiap frame saat halaman bergerak di belakangnya.
- Ganti bahasa pertama kali: tombol bahasa adalah `<Link locale>` dari next-intl yang **tidak bisa di-prefetch**, jadi klik pertama menunggu server. Sekarang halaman yang sama dalam bahasa lain diambil di belakang layar saat browser senggang (`router.prefetch(pathname, { locale })`). Cookie bahasa tidak berubah oleh prefetch (next-intl hanya memperbaruinya pada permintaan dokumen). Jeda klik pertama: 150 ms menjadi 50 ms.
- Klik pertama yang berbunyi (tema, bahasa, menu) sebelumnya juga membuat `AudioContext` saat itu juga. Sekarang dibuat pada sentuhan/klik pertama di mana pun (`warmUpAudio`). Tombol tema tetap memakai efek lingkaran (View Transitions asli, `lib/view-transition.ts`). Sisa bebannya (snapshot layar sekitar 60–80 ms pada CPU 4x lebih lambat) terjadi di setiap klik, bukan hanya klik pertama. Belum diverifikasi di HP fisik pemilik.

## 41. Footer: kartu kontak dengan kartu detail saat disorot, judul tab bertitik (2026-10-08)

- Permintaan pemilik (komponen ContactCards yang dikirim pemilik): **footer tetap seperti sebelumnya** (daftar kartu WhatsApp, Email, LinkedIn, GitHub, Instagram, Resume CV; kartu CV disorot). Yang baru hanya **saat sebuah kartu disorot** (atau difokus keyboard): kartu detailnya muncul di atas kartu itu, dan berpindah antarkartu menggeser isinya searah gerakan (masuk/keluar 64 px dengan blur) sementara wadahnya berubah ukuran dan posisi (400 ms). Kartu detail tidak menangkap kursor sehingga tidak menghalangi kartu di bawahnya, dan tidak keluar dari tepi daftar. Hanya untuk perangkat dengan hover; HP tidak berubah. Reduced-motion mematikan animasinya. Versi pertama (satu baris ikon + tombol salin email) dibatalkan pemilik.
- Isi kartu detail: WhatsApp dan Email (nilai + keterangan), LinkedIn (pita, foto profil, nama, peran dari admin), **GitHub (foto, nama akun, jumlah kontribusi setahun, grafik kontribusi** dengan keterangan per hari, warna sama dengan kalender beranda), Instagram, Resume CV (Google Drive/PDF).
- Data GitHub dari server (`getGithubContributions`, sama dengan beranda, butuh `GITHUB_TOKEN`), bukan diambil browser dari API pihak ketiga seperti komponen aslinya (juga akan diblokir CSP). Tanpa token kartu GitHub hanya menampilkan nama akun.
- Komponen: `components/ui/contact-cards.tsx` (klien, tanpa dependency baru); warna memakai token tema, animasi di globals.css (`.cc-in`, `.cc-out`, `.cc-day`).
- Judul tab: pemisah **"—" diganti "·"** di semua halaman publik, sama dengan admin ("Login · Admin"), termasuk teks alternatif gambar Open Graph project. Judul halaman Tentang memakai huruf kapital di awal tiap kata: **"About Me"** / **"Tentang Saya"** (permintaan pemilik).

## 42. Halaman Project: judul tengah, tanpa pengantar dan filter (2026-10-08)

- Revisi pemilik: judul "Project" / "Projects" **di tengah** (seperti Tentang dan Pengalaman), kalimat pengantar ("Software yang saya bangun...") **dihapus**, dan **semua filter dihapus** (kategori dan teknologi); semua project tampil dalam grid 3 kolom (2 di tablet, 1 di HP). Komponen `ProjectFilter` dan teks terjemahannya dihapus. Kartu project mengisi tinggi baris agar sejajar.
- Gambar project: halaman publik menerima gambar dari akun Cloudinary dan gambar contoh bawaan repo di `/demo/projects/` (`lib/public-image.ts`), dipakai 6 project contoh (CONTENT.md).

## 43. Halaman Project: kartu bertumpuk dan detail bento (2026-10-08, detail diganti di bagian 47)

- Pilihan pemilik dari 10 demo kedua (arah demo 10 "kartu bertumpuk" + 8 "zig-zag" + kartu sekarang): **nomor 3**, disesuaikan dengan data admin Project.
- **Daftar** (`/projects`): satu kolom (maks. 48 rem) kartu gaya situs sekarang (`ProjectCard variant="stack"`): sampul 21:9 (16:10 di HP), nomor · kategori · tahun, judul, ringkasan, teknologi, metadata GitHub, "Baca detail". Tiap kartu `position: sticky` sedikit lebih rendah dari kartu sebelumnya (`.pj-stack`, 1,25 rem; 0,75 rem di HP) sehingga kartu menumpuk saat digulir, di HP maupun laptop. Sampul membesar pelan dan kartu terangkat 4 px saat disorot (hanya perangkat dengan hover). Kartu muncul lewat reveal yang sudah ada.
- **Detail** (`/projects/[slug]`): bila ada sampul, judul, ringkasan, dan tombol Buka demo/Lihat kode berada **di atas gambar sampul** (`.pj-hero`, gradien gelap, teks putih); gambar membesar pelan saat digulir lewat CSS scroll-driven (`animation-timeline: view()`, tanpa JavaScript; browser tanpa dukungan menampilkan gambar diam, reduced-motion mematikannya). Tanpa sampul: kepala halaman biasa. Lalu baris info (Kategori, Tahun, Teknologi, Di GitHub; hanya yang terisi) dan **ubin bento** (`.pj-bento`): gambar galeri pertama (4/6) + ubin terbalik berisi teknologi, metadata GitHub, dan tahun besar (2/6); Gambaran dan Studi kasus berdampingan (atau Gambaran selebar penuh bila tanpa studi kasus); sisa galeri berpasangan (gambar terakhir yang ganjil selebar penuh). Ubin terangkat saat disorot dan muncul bergantian. Di HP semua ubin satu kolom. Navigasi Sebelumnya/Berikutnya tetap.
- Data yang dipakai hanya kolom Project yang ada (judul, ringkasan, uraian, studi kasus, tahun, kategori, tautan demo/kode, repo GitHub, sampul, galeri, teknologi); tidak ada kolom baru.


## 44. Grafik kontribusi GitHub 2D/3D di beranda (2026-10-08)

- Permintaan pemilik: bagian GitHub di beranda dibuat seperti komponen 21st.dev "Contribution Skyline" (gambar acuan pemilik). Kalender SVG lama (bagian 28) diganti `src/components/ui/contribution-skyline.tsx`; data tetap dari `getGithubContributions` (GitHub GraphQL, `GITHUB_TOKEN`, cache 6 jam). Tanpa token atau bila GitHub gagal, bagian ini tetap tidak tampil.
- Satu canvas: tampilan **2D** (peta panas gaya GitHub, label bulan dan Sen/Rab/Jum) dan **3D** (skyline isometrik). Bawaan 3D: saat pertama terlihat di layar, batang naik bergelombang dari minggu terlama ke terbaru. Tombol grid/kubus di kanan atas berganti tampilan dengan morph kamera. Di 3D, angka besar (total setahun, hari tersibuk, rentetan terpanjang, rentetan saat ini) berada di sudut kartu; di 2D dan di layar sempit (< 560 px) angka itu berupa baris statistik di bawah grafik.
- Interaksi: arahkan kursor/ketuk satu hari untuk tooltip jumlah dan tanggal, tombol panah menjelajah grid (dibacakan lewat `aria-live`), Esc menutup, arahkan ke kotak legenda untuk menyorot satu level, seret untuk memutar di 3D (klik dua kali untuk kembali). Di HP geser horizontal memutar, geser vertikal tetap menggulir halaman (`touch-action: pan-y`).
- Warna level memakai nilai token `--gh-1` sampai `--gh-4` (disalin ke `GITHUB_PALETTE` karena canvas tidak membaca `var()`); latar, teks, dan garis memakai token situs dan ikut berganti saat tema diganti. Level dihitung komponen dari jumlah per hari (seperempat dari persentil 95). Semua teks ID/EN di `messages/*.json` namespace `Skyline`; tanggal dan angka memakai format `id-ID`/`en-US`.
- Aksesibilitas: canvas `role="img"` dengan ringkasan teks dan dapat difokus; tombol tampilan memakai `aria-pressed`; `prefers-reduced-motion` membuat morph dan transisi langsung. Tidak ada dependency baru (hanya React).

## 45. Beranda dipangkas, keyboard 3D berhenti di luar layar (2026-10-08)

- Permintaan pemilik: bagian **Project pilihan**, **Perjalanan terbaru**, dan **Ada yang ingin dibangun?** (ajakan + form newsletter) dihapus dari beranda. Pemilik memilih menghapus form newsletter juga; halaman konfirmasi/berhenti dan menu admin pelanggan tetap ada, tetapi saat ini tidak ada tempat mendaftar. Urutan beranda sekarang: 01 hero, 02 Yang saya pakai (keyboard), 03 Aktivitas di GitHub, lalu footer. Wireframe di bagian 5 tidak lagi sesuai untuk tiga bagian itu.
- Lag: scene Spline keyboard skill beranimasi terus dan tetap menggambar walau sudah di luar layar, sehingga scroll di bagian lain (grafik GitHub, footer) tersendat. Sekarang `IntersectionObserver` memanggil `app.stop()` saat canvas keyboard keluar layar dan `app.play()` saat terlihat lagi. Ukuran lokal (Chromium headless, CPU HP diperlambat 4x): saat diam di bawah halaman 120 frame per 2 detik (sebelumnya 8), frame > 50 ms saat scroll satu halaman penuh 25 (sebelumnya 74); sisa frame lambat terjadi saat keyboard sedang terlihat (WebGL perangkat lunak di headless).

## 46. Beranda: Dalam angka, Dari komunitas ke software, aktivitas GitHub (2026-10-08)

- Pilihan pemilik dari demo "bagian baru beranda": nomor **1, 2, dan 7**. Urutan beranda sekarang: 01 pembuka, 02 Dalam angka, 03 Dari komunitas ke software, 04 Yang saya pakai, 05 Aktivitas di GitHub.
- **Dalam angka** (`Highlight`, Admin → Angka): kisi angka dengan garis 1 px di antara sel (2 kolom di HP, sampai 4 di layar lebar). Angka memakai Oswald besar, keterangan abu-abu, asal angka dengan huruf mono biru. Angka menghitung naik 1,4 detik saat pertama kali masuk layar (`CountUp`); HTML awal sudah berisi angka akhir sehingga tanpa JavaScript, pembaca layar, dan reduced-motion tetap benar. Isi awal dari CV (CONTENT.md bagian 7): 1.000+ anggota Reclub, 300+ anggota aktif WhatsApp, 128+ peserta per turnamen, 30+ siswa. Format angka mengikuti bahasa (1.000 / 1,000).
- **Dari komunitas ke software**: pengalaman yang dicentang "Tampilkan sebagai titik di garis cerita" di Admin → Pengalaman, urut dari yang terlama. Mendatar di layar ≥ 768 px, menurun di HP. Saat bagian muncul (reveal), garis biru memanjang 1,6 detik dan titik menyala bergantian; titik terakhir yang masih berjalan terisi penuh. Isi awal: Warnet Mobile, Horizon Organizer, Universitas Bina Nusantara, Ace Padel Club, PT PGAS Solution (CONTENT.md bagian 2). Bagian tidak tampil bila titiknya kurang dari dua.
- **Aktivitas GitHub terakhir**: satu baris di atas grafik kontribusi yang berganti tiap 3,5 detik (push, repo baru, branch/tag, rilis, PR dibuka/digabung, publik, star, fork) dari Events API publik GitHub (`GITHUB_TOKEN` yang sama, cache 30 menit, maksimal 5 item, push beruntun ke branch yang sama digabung). Repo milik sendiri ditulis tanpa nama pemilik agar muat di HP. Waktu relatif dihitung di browser. Berhenti saat disorot/difokus, ada tombol jeda (WCAG 2.2.2), diam pada reduced-motion. Tanpa token atau tanpa aktivitas, baris ini tidak tampil.
- Perbaikan aksesibilitas grafik kontribusi (bagian 44): kotak legenda kini punya area sentuh 24 px (WCAG 2.5.8 target size); kotak warnanya tetap 11 px.

## 47. Detail project "belah dua" (2026-10-08)

- Pemilik merasa detail bento (bagian 43) terlalu banyak informasi dan berantakan, terutama judul yang menimpa gambar sampul. Dari 10 demo detail ringkas, pemilik memilih **nomor 10 "Belah dua"**.
- Satu kartu (`ProjectSplit`, `.pd-split`): di layar ≥ 900 px gambar mengisi setengah kiri dan teks di kanan; di HP gambar 4:3 di atas, teks di bawah. Teks hanya kategori · tahun, judul (`text-h1`), ringkasan, tombol Buka demo / Lihat kode, chip teknologi, dan gambar kecil. Gambar kecil (sampul lalu galeri) mengganti gambar besar dengan fade 500 ms; gambar besar sedikit membesar saat disorot. Tanpa JavaScript gambar pertama tetap tampil.
- Dibuang dari detail: baris info (Kategori/Tahun/Teknologi/Di GitHub), ubin teknologi dengan tahun besar, metadata GitHub, dan galeri ubin. Uraian (Markdown) tetap ada di bawah kartu dalam satu kolom sempit tanpa ubin; Studi kasus hanya tampil bila diisi. Navigasi Sebelumnya/Berikutnya tetap.
