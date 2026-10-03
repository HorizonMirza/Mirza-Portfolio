import { whatsappUrl } from '@/lib/seo'

// Daftar kartu kontak di footer (DESIGN.md bagian 29): urutan tetap, kartu yang datanya kosong
// di admin tidak ditampilkan. Fungsi murni agar mudah dites.

export type FooterLinkKey =
  'whatsapp' | 'email' | 'linkedin' | 'github' | 'instagram' | 'website' | 'cv'

export type FooterLink = {
  key: FooterLinkKey
  href: string
  // teks kecil di bawah nama: nomor, alamat, atau nama akun
  value: string
  external: boolean
}

type ProfileLinks = {
  email: string | null
  whatsapp: string | null
  socials: Partial<Record<'linkedin' | 'github' | 'instagram' | 'website', string>>
  hasCv: boolean
  cvHost: string | null
}

// Segmen terakhir path URL profil: linkedin.com/in/nama -> nama, github.com/nama -> nama.
export function handleFromUrl(url: string) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean)
    const last = parts.at(-1)
    return last ? decodeURIComponent(last) : null
  } catch {
    return null
  }
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function isDriveHost(host: string | null) {
  return host === 'drive.google.com' || host === 'docs.google.com'
}

// Keterangan kartu CV: "Google Drive", host link lain, atau "PDF" untuk berkas upload.
export function cvLabel(cvHost: string | null, fileLabel: string) {
  if (!cvHost) return fileLabel
  return isDriveHost(cvHost) ? 'Google Drive' : cvHost
}

export function footerLinks(
  profile: ProfileLinks,
  { locale, fileLabel }: { locale: string; fileLabel: string },
): FooterLink[] {
  const links: FooterLink[] = []
  const { socials } = profile
  if (profile.whatsapp)
    links.push({
      key: 'whatsapp',
      href: whatsappUrl(profile.whatsapp),
      value: profile.whatsapp,
      external: true,
    })
  if (profile.email)
    links.push({
      key: 'email',
      href: `mailto:${profile.email}`,
      value: profile.email,
      external: false,
    })
  if (socials.linkedin)
    links.push({
      key: 'linkedin',
      href: socials.linkedin,
      value: handleFromUrl(socials.linkedin) ?? hostOf(socials.linkedin),
      external: true,
    })
  if (socials.github)
    links.push({
      key: 'github',
      href: socials.github,
      value: handleFromUrl(socials.github) ?? hostOf(socials.github),
      external: true,
    })
  if (socials.instagram) {
    const handle = handleFromUrl(socials.instagram)
    links.push({
      key: 'instagram',
      href: socials.instagram,
      value: handle ? `@${handle}` : hostOf(socials.instagram),
      external: true,
    })
  }
  if (socials.website)
    links.push({
      key: 'website',
      href: socials.website,
      value: hostOf(socials.website),
      external: true,
    })
  if (profile.hasCv)
    links.push({
      key: 'cv',
      href: `/api/cv?locale=${locale}`,
      value: cvLabel(profile.cvHost, fileLabel),
      external: true,
    })
  return links
}
