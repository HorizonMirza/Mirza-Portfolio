import { notFound } from 'next/navigation'

// URL tak dikenal di bawah /id atau /en (mis. /id/bllog) ditangkap di sini agar yang tampil adalah
// 404 berbahasa sesuai URL dari [locale]/not-found.tsx, bukan 404 global (revisi pemilik 2026-10-18).
export default function CatchAllNotFound() {
  notFound()
}
