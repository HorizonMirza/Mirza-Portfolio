// Apakah gambar berasal dari domain lain daripada halaman. Gambar domain lain yang digambar ke
// kanvas membuat kanvas "tercemar": piksel tidak boleh dibaca (getImageData), jadi versi abu-abu
// logo skill unggahan (Cloudinary) gagal dibuat. data: dan blob: tidak
// mencemari kanvas.
export function isCrossOrigin(src: string, pageUrl: string): boolean {
  try {
    const url = new URL(src, pageUrl)
    if (url.protocol === 'data:' || url.protocol === 'blob:') return false
    return url.origin !== new URL(pageUrl).origin
  } catch {
    return false
  }
}
