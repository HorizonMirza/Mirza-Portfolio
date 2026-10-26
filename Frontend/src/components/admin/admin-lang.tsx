'use client'

import { createContext, type ReactNode, useCallback, useContext, useSyncExternalStore } from 'react'

import { cn } from '@/lib/utils'

// Bahasa isian konten (pilihan pemilik 2026-10-26, tombol ID/EN di top bar): form dua bahasa membuka
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

const OPTIONS: { lang: ContentLang; label: string; name: string }[] = [
  { lang: 'id', label: 'ID', name: 'Bahasa isian: Indonesia' },
  { lang: 'en', label: 'EN', name: 'Bahasa isian: English' },
]

export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useAdminLang()
  return (
    <div
      role="group"
      aria-label="Bahasa isian konten"
      title="Bahasa isian konten"
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border border-border bg-surface p-1',
        className,
      )}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.lang}
          type="button"
          aria-pressed={lang === option.lang}
          aria-label={option.name}
          onClick={() => setLang(option.lang)}
          className={cn(
            'min-h-9 rounded-full px-3 text-sm font-semibold transition-colors',
            lang === option.lang ? 'bg-primary text-primary-fg' : 'text-muted hover:text-text',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
