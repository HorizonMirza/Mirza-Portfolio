// Bentuk data berkas (foto, logo, PDF) untuk komponen admin. Tanpa impor server, aman dipakai di klien.

export type AssetView = {
  id: string
  url: string
  kind: 'IMAGE' | 'DOCUMENT'
  bytes: number | null
  width: number | null
  height: number | null
  alt_id: string | null
  alt_en: string | null
}
