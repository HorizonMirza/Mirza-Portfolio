import type { ReactNode } from 'react'

// Isi hero beranda (revisi pemilik 2026-10-19, DESIGN.md bagian 85 dan 86): halo, nama dua baris di
// belakang foto, foto rata bawah, salinan nama di depan foto yang dilubangi di area wajah, lalu peran
// di pojok bawah. Dipakai beranda dan pratinjau Admin → Home → Peran agar keduanya sama persis
// (DESIGN.md bagian 141).
export function HeroContent({
  name,
  portrait,
  roles,
  titleTag: Title = 'h1',
}: {
  name: string
  portrait: ReactNode
  // daftar peran (<ul className="hero-roles">) atau null
  roles: ReactNode
  // admin: bukan h1 halaman, jadi <p>
  titleTag?: 'h1' | 'p'
}) {
  const nameWords = name.split(/\s+/)
  // Baris pertama kata pertama, sisanya baris kedua; spasi agar pembaca layar membaca nama utuh.
  // Kata pertama dibagi tiga (mis. MUH·AM·MAD): bagian tengah diberi ruang selebar wajah agar sisi
  // kiri dan kanannya sejajar dan utuh di kiri-kanan wajah (revisi pemilik 2026-10-19).
  const first = nameWords[0] ?? ''
  const edge = Math.max(0, Math.floor((first.length - 2) / 2))
  const nameLines = (
    <>
      <span>
        {first.slice(0, edge)}
        <span className="hero-name-mid">{first.slice(edge, first.length - edge)}</span>
        {first.slice(first.length - edge)}
      </span>
      {nameWords.length > 1 ? <span> {nameWords.slice(1).join(' ')}</span> : null}
    </>
  )
  return (
    <div className="hero">
      {/* halo lembut di belakang kepala (demo cahaya 1 pilihan pemilik) */}
      <div aria-hidden="true" className="hero-glow" />
      <Title id={Title === 'h1' ? 'hero-title' : undefined} className="hero-name">
        {nameLines}
      </Title>
      <figure className="hero-portrait">{portrait}</figure>
      <div aria-hidden="true" className="hero-name-front">
        <p className="hero-name">{nameLines}</p>
      </div>
      {roles}
    </div>
  )
}
