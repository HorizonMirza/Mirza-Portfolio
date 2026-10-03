import { describe, expect, it } from 'vitest'

import { cvLabel, footerLinks, handleFromUrl } from '@/components/site/footer-links'

const base = {
  email: null,
  whatsapp: null,
  socials: {},
  hasCv: false,
  cvHost: null,
}

describe('footer-links', () => {
  it('nama akun diambil dari segmen terakhir URL profil', () => {
    expect(handleFromUrl('https://www.linkedin.com/in/muhammad-mirza-wirya/')).toBe(
      'muhammad-mirza-wirya',
    )
    expect(handleFromUrl('https://github.com/HorizonMirza')).toBe('HorizonMirza')
    expect(handleFromUrl('https://instagram.com/')).toBeNull()
    expect(handleFromUrl('bukan url')).toBeNull()
  })

  it('keterangan CV: Google Drive, host lain, atau PDF', () => {
    expect(cvLabel('drive.google.com', 'PDF')).toBe('Google Drive')
    expect(cvLabel('docs.google.com', 'PDF')).toBe('Google Drive')
    expect(cvLabel('dropbox.com', 'PDF')).toBe('dropbox.com')
    expect(cvLabel(null, 'PDF')).toBe('PDF')
  })

  it('urutan tetap dan kartu tanpa data tidak tampil', () => {
    const links = footerLinks(
      {
        email: 'saya@contoh.com',
        whatsapp: '+6281200000000',
        socials: {
          instagram: 'https://www.instagram.com/akun.saya/',
          github: 'https://github.com/HorizonMirza',
          linkedin: 'https://www.linkedin.com/in/muhammad-mirza-wirya',
        },
        hasCv: true,
        cvHost: 'drive.google.com',
      },
      { locale: 'en', fileLabel: 'PDF' },
    )
    expect(links.map((l) => l.key)).toEqual([
      'whatsapp',
      'email',
      'linkedin',
      'github',
      'instagram',
      'cv',
    ])
    expect(links[0]).toMatchObject({ href: 'https://wa.me/6281200000000', external: true })
    expect(links[1]).toMatchObject({
      href: 'https://mail.google.com/mail/?view=cm&fs=1&to=saya%40contoh.com',
      external: true,
    })
    expect(links[4].value).toBe('@akun.saya')
    expect(links[5]).toMatchObject({ href: '/api/cv?locale=en', value: 'Google Drive' })
  })

  it('tanpa data apa pun tidak ada kartu', () => {
    expect(footerLinks(base, { locale: 'id', fileLabel: 'PDF' })).toEqual([])
  })

  it('situs pribadi ditampilkan sebagai nama host', () => {
    const [link] = footerLinks(
      { ...base, socials: { website: 'https://www.contoh.dev/blog' } },
      { locale: 'id', fileLabel: 'PDF' },
    )
    expect(link).toMatchObject({ key: 'website', value: 'contoh.dev' })
  })
})
