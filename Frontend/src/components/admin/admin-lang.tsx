'use client'

import { createContext, type ReactNode, useCallback, useContext, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

import { scrambleVisibleText, visibleTexts } from '@/lib/text-scramble'
import { playLanguageSound } from '@/lib/ui-sounds'
import { cn } from '@/lib/utils'

// Bahasa isian konten (pilihan pemilik 2026-10-26, tombol bahasa di top bar): form dua bahasa membuka
// bahasa ini lebih dulu. Menu dan teks admin sendiri tetap Indonesia. Tersimpan di browser pemilik.
export type ContentLang = 'id' | 'en'

const STORAGE_KEY = 'mmirza-admin-lang'
const listeners = new Set<() => void>()

function read(): ContentLang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'id'
  } catch {
    return 'id'
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

const Ctx = createContext<{ lang: ContentLang; setLang: (lang: ContentLang) => void }>({
  lang: 'id',
  setLang: () => {},
})

export function AdminLangProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, read, () => 'id' as ContentLang)
  const setLang = useCallback((next: ContentLang) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // penyimpanan diblokir: pilihan berlaku sampai halaman dimuat ulang
    }
    listeners.forEach((listener) => listener())
  }, [])
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>
}

export function useAdminLang() {
  return useContext(Ctx)
}

const LANG_NAME: Record<ContentLang, string> = { id: 'Indonesia', en: 'English' }

// Satu tombol bulat seperti tombol bahasa situs publik (revisi pemilik 2026-11-06, menggantikan
// pasangan ID | EN): kode yang terlihat adalah bahasa tujuan dan menjadi awal nama aksesibel
// (WCAG 2.5.3, DESIGN.md bagian 102). Saat ditekan: suara acak digital yang sama, kolom isian
// berganti bahasa, lalu teks yang berubah di layar diacak dan terurai seperti di situs publik.
export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useAdminLang()
  const target: ContentLang = lang === 'id' ? 'en' : 'id'
  const label = `${target.toUpperCase()}, ganti bahasa isian ke ${LANG_NAME[target]}`

  function toggle() {
    playLanguageSound(target === 'en')
    const before = visibleTexts()
    flushSync(() => setLang(target))
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scrambleVisibleText(document.body, before)
    }
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={toggle}
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-text uppercase transition-colors hover:bg-surface-2',
        className,
      )}
    >
      {target}
    </button>
  )
}
