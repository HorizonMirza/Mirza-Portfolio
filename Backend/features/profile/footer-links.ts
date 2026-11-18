import { whatsappUrl } from '@backend/lib/seo'

// Daftar kartu kontak di footer (DESIGN.md bagian 29): urutan tetap, kartu yang datanya kosong
// di admin tidak ditampilkan. Fungsi murni agar mudah dites.

export type FooterLinkKey =
  'whatsapp' | 'email' | 'linkedin' | 'github' | 'instagram' | 'website' | 'cv'

export type FooterLink = {
  key: FooterLinkKey
  href: string
  // teks kecil di bawah nama: nomor, alamat, atau nama akun (nama akun sosial bisa diganti admin)
  value: string
  // teks kecil bawaan yang diturunkan dari data (tanpa penggantian admin)
  derived: string
  external: boolean
}

// Nama akun yang tampil di kartu LinkedIn, GitHub, dan Instagram, bila diganti admin (Admin → Footer)
export const CONTACT_LABEL_KEYS = ['linkedin', 'github', 'instagram'] as const
export type ContactLabelKey = (typeof CONTACT_LABEL_KEYS)[number]
export type ContactLabels = Partial<Record<ContactLabelKey, { value?: string }>>

type ProfileLinks = {
  email: string | null
  whatsapp: string | null
  socials: Partial<Record<'linkedin' | 'github' | 'instagram' | 'website', string>>
  hasCv: boolean
  cvHost: string | null
  contactLabels?: ContactLabels
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

// Permintaan pemilik: kartu email langsung membuka jendela tulis pesan Gmail di web (bukan mailto:,
// yang bergantung pada aplikasi email di perangkat pengunjung).
export function gmailComposeUrl(email: string) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`
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

// Teks kecil kartu yang diturunkan dari data: nomor, email, nama akun dari URL profil, atau host.
// Nilai kosong = ''. Dipakai situs, dan admin untuk teks bawaan yang mengikuti tautan.
export function footerValue(key: Exclude<FooterLinkKey, 'cv'>, raw: string | null | undefined) {
  const value = (raw ?? '').trim()
  if (!value) return ''
  if (key === 'whatsapp' || key === 'email') return value
  if (key === 'website') return hostOf(value)
  const handle = handleFromUrl(value)
  if (key === 'instagram') return handle ? `@${handle}` : hostOf(value)
  return handle ?? hostOf(value)
}

// Nama akun bawaan satu kartu sosial dari tautannya (segmen terakhir URL profil atau host).
export function derivedCardValue(
  key: ContactLabelKey,
  links: { socials: Partial<Record<'linkedin' | 'github' | 'instagram' | 'website', string>> },
) {
  return footerValue(key, links.socials[key])
}

export function footerLinks(
  profile: ProfileLinks,
  { locale, fileLabel }: { locale: string; fileLabel: string },
): FooterLink[] {
  const links: FooterLink[] = []
  const { socials, contactLabels } = profile
  const add = (key: FooterLinkKey, href: string, derived: string) => {
    const override =
      key === 'linkedin' || key === 'github' || key === 'instagram'
        ? contactLabels?.[key]?.value?.trim()
        : undefined
    links.push({ key, href, value: override || derived, derived, external: true })
  }
  if (profile.whatsapp) add('whatsapp', whatsappUrl(profile.whatsapp), profile.whatsapp)
  if (profile.email) add('email', gmailComposeUrl(profile.email), profile.email)
  if (socials.linkedin) add('linkedin', socials.linkedin, footerValue('linkedin', socials.linkedin))
  if (socials.github) add('github', socials.github, footerValue('github', socials.github))
  if (socials.instagram)
    add('instagram', socials.instagram, footerValue('instagram', socials.instagram))
  if (socials.website) add('website', socials.website, footerValue('website', socials.website))
  if (profile.hasCv) add('cv', `/api/cv?locale=${locale}`, cvLabel(profile.cvHost, fileLabel))
  return links
}
