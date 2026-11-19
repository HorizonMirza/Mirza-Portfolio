// Tes unit: batas Backend.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Kode server ada di Backend/ dan diimpor Frontend lewat alias @backend/*. Arahnya satu: Frontend boleh
// mengimpor Backend, Backend tidak boleh mengimpor Frontend (CLAUDE.md bagian Struktur). Backend/lib juga
// tidak boleh mengimpor Backend/features.
const BACKEND = resolve(process.cwd(), '../Backend')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name === 'generated') return []
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx|mjs)$/.test(name) ? [path] : []
  })
}

function specifiers(source: string): string[] {
  return [...source.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)'([^']+)'/g)].map((m) => m[1]!)
}

describe('batas Backend', () => {
  const files = sourceFiles(BACKEND)

  it('menemukan kode Backend', () => {
    expect(files.length).toBeGreaterThan(50)
  })

  it('Backend tidak mengimpor Frontend', () => {
    const bad: string[] = []
    for (const file of files) {
      for (const spec of specifiers(readFileSync(file, 'utf8'))) {
        const escapes = spec.startsWith('.') && !resolve(file, '..', spec).startsWith(BACKEND)
        // pengecualian yang disengaja: konfigurasi lint dan format memakai ulang berkas Frontend (satu
        // sumber aturan), dan teks situs bawaan dibaca dari Frontend/messages/*.json (data, bukan kode)
        const allowed =
          (/(\.prettierrc|eslint\.config)\./.test(file) && spec.startsWith('../Frontend/')) ||
          /\/Frontend\/messages\/(id|en)\.json$/.test(spec)
        if (spec.startsWith('@/') || (escapes && !allowed && !spec.includes('Database/')))
          bad.push(`${relative(BACKEND, file)}: ${spec}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('Backend/lib tidak mengimpor Backend/features', () => {
    const bad = files
      .filter((file) => relative(BACKEND, file).startsWith('lib'))
      .flatMap((file) =>
        specifiers(readFileSync(file, 'utf8'))
          .filter((spec) => spec.startsWith('@backend/features') || spec.includes('../features'))
          .map((spec) => `${relative(BACKEND, file)}: ${spec}`),
      )
    expect(bad).toEqual([])
  })
})
