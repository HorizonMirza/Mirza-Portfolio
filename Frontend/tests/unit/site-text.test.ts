import { describe, expect, it } from 'vitest'

import {
  SITE_MODULES,
  TEXT_CATALOG,
  checkTextValue,
  entriesOf,
  findModule,
  findTextEntry,
} from '@/features/site-text/catalog'
import { applyTextOverrides } from '@/features/site-text/merge'
import { siteTextsSchema } from '@/features/site-text/schema'

import en from '../../messages/en.json'
import id from '../../messages/id.json'

type Messages = Record<string, Record<string, unknown>>

function read(messages: Messages, key: string) {
  const dot = key.indexOf('.')
  return messages[key.slice(0, dot)]?.[key.slice(dot + 1)]
}

describe('daftar teks situs', () => {
  it('kunci unik dan ada di kedua berkas pesan', () => {
    const keys = TEXT_CATALOG.map((entry) => entry.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const key of keys) {
      expect(typeof read(id as Messages, key), `id: ${key}`).toBe('string')
      expect(typeof read(en as Messages, key), `en: ${key}`).toBe('string')
    }
  })

  it('placeholder di teks bawaan sudah tercantum di daftar', () => {
    for (const entry of TEXT_CATALOG) {
      for (const messages of [id, en] as Messages[]) {
        const used = [...String(read(messages, entry.key)).matchAll(/\{(\w+)\}/g)].map((m) => m[1])
        for (const name of used)
          expect(entry.placeholders ?? [], `${entry.key} memakai {${name}}`).toContain(name)
      }
    }
  })

  it('teks bawaan lolos aturannya sendiri', () => {
    for (const entry of TEXT_CATALOG) {
      for (const messages of [id, en] as Messages[])
        expect(checkTextValue(entry, String(read(messages, entry.key))), entry.key).toBeNull()
    }
  })
})

describe('modul situs', () => {
  it('tiap teks milik modul yang dikenal, dan tiap modul berisi teks', () => {
    for (const entry of TEXT_CATALOG) expect(findModule(entry.module), entry.key).toBeDefined()
    // Bagian Awal dan Home tanpa teks yang bisa diubah sejak 2026-11-10 (form khusus: isi kartu
    // pembuka; foto dan peran), modul lain berisi teks
    for (const site of SITE_MODULES)
      if (site.id === 'intro' || site.id === 'home') expect(entriesOf(site.id), site.id).toEqual([])
      else expect(entriesOf(site.id).length, site.id).toBeGreaterThan(0)
  })

  it('tiap topik hanya punya satu menu: tanpa label ganda dan halaman data lewat tab modul', async () => {
    const { adminNav, isNavActive } = await import('@/components/admin/nav')
    const labels = adminNav.map((item) => item.label.toLowerCase())
    expect(new Set(labels).size).toBe(labels.length)
    const hrefs = adminNav.map((item) => item.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
    // halaman data menyalakan menu modulnya, bukan menu sendiri
    const active = (path: string) =>
      adminNav.filter((item) => isNavActive(path, item)).map((item) => item.href)
    // About: menu langsung ke tab Profil (tab Teks halaman About dihapus 2026-11-12)
    expect(active('/admin/profile')).toEqual(['/admin/profile'])
    expect(active('/admin/education')).toEqual(['/admin/profile'])
    // tab Home (bagian 129): menu Home membuka tab pertama, kartu pembuka
    for (const tab of ['/admin/pages/home', '/admin/roles', '/admin/skills'])
      expect(active(tab), tab).toEqual(['/admin/pages/intro'])
    expect(active('/admin/experience/abc')).toEqual(['/admin/pages/experience'])
    expect(active('/admin/projects/new')).toEqual(['/admin/pages/projects'])
    expect(active('/admin')).toEqual(['/admin'])
  })

  it('kunci menu admin sesuai modul', async () => {
    const { adminNav, isNavActive } = await import('@/components/admin/nav')
    // tiap modul punya menu sendiri atau menjadi tab modul lain (Bagian Awal di Home sejak
    // 2026-11-11), sehingga selalu ada menu yang menyala
    for (const site of SITE_MODULES)
      expect(
        adminNav.some((item) => isNavActive(`/admin/pages/${site.id}`, item)),
        site.id,
      ).toBe(true)
  })
})

describe('aturan isi teks', () => {
  const plain = findTextEntry('About.title')!
  const copyright = findTextEntry('Footer.copyright')!
  const intro = findTextEntry('Contact.intro')!

  it('menolak kurung kurawal di teks tanpa placeholder', () => {
    expect(checkTextValue(plain, 'Skill {name}')).not.toBeNull()
    expect(checkTextValue(plain, '{ rusak')).not.toBeNull()
  })

  it('hanya menerima placeholder yang diizinkan', () => {
    expect(checkTextValue(copyright, '© {year} {name}')).toBeNull()
    expect(checkTextValue(copyright, '© {year} {nama}')).not.toBeNull()
    expect(checkTextValue(copyright, "© '{year}")).not.toBeNull()
  })

  it('membatasi panjang dan baris', () => {
    expect(checkTextValue(plain, 'x'.repeat(plain.max + 1))).not.toBeNull()
    expect(checkTextValue(plain, 'dua\nbaris')).not.toBeNull()
    expect(checkTextValue(intro, 'dua\nbaris')).toBeNull()
  })
})

describe('skema simpan teks situs', () => {
  it('menerima isian valid dan kosong', () => {
    const parsed = siteTextsSchema.safeParse({
      values: { 'About.title': { id: ' Tentang Saya ', en: '' } },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.values['About.title']!.id).toBe('Tentang Saya')
  })

  it('menolak kunci di luar daftar', () => {
    const parsed = siteTextsSchema.safeParse({
      values: { 'Contact.honeypot': { id: 'x', en: '' } },
    })
    expect(parsed.success).toBe(false)
  })

  it('menolak isi yang melanggar aturan teks', () => {
    const parsed = siteTextsSchema.safeParse({
      values: { 'About.title': { id: '{rusak}', en: '' } },
    })
    expect(parsed.success).toBe(false)
  })
})

describe('menimpa pesan bawaan', () => {
  const base = {
    Home: { stackHeading: 'Keahlian', githubHeading: 'GitHub' },
    Nav: { home: 'Beranda' },
  }

  it('mengganti teks sesuai bahasa tanpa mengubah objek asli', () => {
    const out = applyTextOverrides(
      base,
      [{ key: 'Home.stackHeading', value_id: 'Tumpukan', value_en: 'Stack' }],
      'en',
    ) as typeof base
    expect(out.Home.stackHeading).toBe('Stack')
    expect(out.Home.githubHeading).toBe('GitHub')
    expect(out.Nav).toBe(base.Nav)
    expect(base.Home.stackHeading).toBe('Keahlian')
  })

  it('memakai teks bawaan bila kolom bahasa itu kosong', () => {
    const out = applyTextOverrides(
      base,
      [{ key: 'Home.stackHeading', value_id: 'Tumpukan', value_en: null }],
      'en',
    )
    expect(out).toBe(base)
  })

  it('mengabaikan kunci yang tidak ada di pesan bawaan', () => {
    const out = applyTextOverrides(
      base,
      [
        { key: 'Home.tidakAda', value_id: 'x', value_en: 'x' },
        { key: 'Lain.judul', value_id: 'x', value_en: 'x' },
      ],
      'id',
    )
    expect(out).toBe(base)
  })
})
