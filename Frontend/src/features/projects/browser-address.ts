// Isi kolom alamat bingkai jendela browser (daftar dan detail project): tautan demo tanpa protokol
// bila ada, selain itu alamat halaman project di situs ini.
export function browserAddress(project: { slug: string; demoUrl: string | null }): string {
  return project.demoUrl
    ? project.demoUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : `mmirza.site/projects/${project.slug}`
}

// Rasio bingkai gambar mengikuti ukuran asli foto agar tampil utuh tanpa terpotong; 16:9 bila ukuran
// tidak diketahui.
export function imageRatio(img: { width: number | null; height: number | null } | null): string {
  return img?.width && img.height ? `${img.width} / ${img.height}` : '16 / 9'
}
