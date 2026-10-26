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
    for (const site of SITE_MODULES) expect(entriesOf(site.id).length, site.id).toBeGreaterThan(0)
  })

  it('kunci menu admin sesuai modul', async () => {
    const { adminNav } = await import('@/components/admin/nav')
    for (const site of SITE_MODULES)
      expect(
        adminNav.some((item) => item.href === `/admin/pages/${site.id}`),
        site.id,
      ).toBe(true)
  })
})

describe('aturan isi teks', () => {
  const plain = findTextEntry('Home.stackHeading')!
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
      values: { 'Home.stackHeading': { id: ' Keahlian ', en: '' } },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.values['Home.stackHeading']!.id).toBe('Keahlian')
  })

  it('menolak kunci di luar daftar', () => {
    const parsed = siteTextsSchema.safeParse({
      values: { 'Contact.honeypot': { id: 'x', en: '' } },
    })
    expect(parsed.success).toBe(false)
  })

  it('menolak isi yang melanggar aturan teks', () => {
    const parsed = siteTextsSchema.safeParse({
      values: { 'Home.stackHeading': { id: '{rusak}', en: '' } },
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
