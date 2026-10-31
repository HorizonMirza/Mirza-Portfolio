// Isi kolom alamat bingkai jendela browser (daftar dan detail project): tautan demo tanpa protokol
// bila ada, selain itu alamat halaman project di situs ini. Host dioper dari server (siteHost() di
// lib/env), bukan domain yang ditulis mati (audit 2026-10-31, EFF-09); berkas ini juga dipakai galeri
// di klien, jadi sengaja tidak mengimpor lib/env.
export function browserAddress(
  project: { slug: string; demoUrl: string | null },
  host: string,
): string {
  return project.demoUrl
    ? project.demoUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : `${host}/projects/${project.slug}`
}

// Rasio bingkai gambar mengikuti ukuran asli foto agar tampil utuh tanpa terpotong; 16:9 bila ukuran
// tidak diketahui.
export function imageRatio(img: { width: number | null; height: number | null } | null): string {
  return img?.width && img.height ? `${img.width} / ${img.height}` : '16 / 9'
}
