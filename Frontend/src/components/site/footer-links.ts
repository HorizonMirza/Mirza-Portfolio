import { whatsappUrl } from '@/lib/seo'

// Daftar kartu kontak di footer (DESIGN.md bagian 29): urutan tetap, kartu yang datanya kosong
// di admin tidak ditampilkan. Fungsi murni agar mudah dites.

export type FooterLinkKey =
  'whatsapp' | 'email' | 'linkedin' | 'github' | 'instagram' | 'website' | 'cv'

export type FooterLink = {
  key: FooterLinkKey
  href: string
  // judul kartu bila diganti admin; kosong = nama bawaan (WhatsApp, Email, ...)
  title?: string
  // teks kecil di bawah nama: nomor, alamat, atau nama akun (bisa diganti admin)
  value: string
  // teks kecil bawaan yang diturunkan dari data (tanpa penggantian admin)
  derived: string
  external: boolean
}

// Nama yang tampil di kartu, diganti admin (Admin → Footer): judul dan teks kecil
export type ContactLabels = Partial<Record<FooterLinkKey, { title?: string; value?: string }>>

// Judul bawaan kartu (merek, sama di kedua bahasa); judul kartu CV datang dari teks situs Footer.cv
export const CARD_TITLES = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  instagram: 'Instagram',
} as const

// Kartu yang bisa diganti namanya (kartu situs lain tidak ada di admin)
export const CONTACT_LABEL_KEYS = [
  'whatsapp',
  'email',
  'linkedin',
  'github',
  'instagram',
  'cv',
] as const

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

function hostOrNull(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
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

// Teks kecil bawaan satu kartu dari isian kontak admin (tautan, nomor, atau email). Kartu CV dengan
// link luar: "Google Drive" atau host; tanpa link, kosong (situs memakai "PDF"/"File" sesuai bahasa).
export function derivedCardValue(
  key: (typeof CONTACT_LABEL_KEYS)[number],
  links: {
    whatsapp: string
    email: string
    cvUrl: string
    socials: Partial<Record<'linkedin' | 'github' | 'instagram' | 'website', string>>
  },
) {
  if (key === 'whatsapp') return footerValue('whatsapp', links.whatsapp)
  if (key === 'email') return footerValue('email', links.email)
  if (key === 'cv') return links.cvUrl ? cvLabel(hostOrNull(links.cvUrl), '') : ''
  return footerValue(key, links.socials[key])
}

export function footerLinks(
  profile: ProfileLinks,
  { locale, fileLabel }: { locale: string; fileLabel: string },
): FooterLink[] {
  const links: FooterLink[] = []
  const { socials, contactLabels } = profile
  const add = (key: FooterLinkKey, href: string, derived: string) => {
    const label = contactLabels?.[key]
    links.push({
      key,
      href,
      title: label?.title?.trim() || undefined,
      value: label?.value?.trim() || derived,
      derived,
      external: true,
    })
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
