'use client'

import { useRouter } from 'next/navigation'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react'
import { flushSync } from 'react-dom'

import { ADMIN_LANG_COOKIE, type AdminLang, adminT, parseAdminLang } from '@/lib/admin-i18n'
import { scrambleVisibleText, visibleTexts } from '@/lib/text-scramble'
import { playLanguageSound } from '@/lib/ui-sounds'
import { cn } from '@/lib/utils'

// Bahasa admin (tombol ID/EN di top bar). Sejak 2026-11-11 mengganti bahasa tampilan admin (menu,
// top bar, judul halaman, dashboard; DESIGN.md bagian 113) sekaligus bahasa isian form dua bahasa
// (pilihan pemilik 2026-10-26). Disimpan hanya di cookie agar server dan browser selalu merender
// bahasa yang sama (pilihan lama di localStorage sengaja tidak dibaca: bisa membuat tampilan campur).
export type ContentLang = AdminLang

const listeners = new Set<() => void>()

function readCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${ADMIN_LANG_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]!) : null
}

function read(): AdminLang {
  return parseAdminLang(readCookie())
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

const Ctx = createContext<{ lang: AdminLang; setLang: (lang: AdminLang) => void }>({
  lang: 'id',
  setLang: () => {},
})

export function AdminLangProvider({
  initial,
  children,
}: {
  // bahasa dari cookie yang dibaca server, agar render server dan browser sama
  initial: AdminLang
  children: ReactNode
}) {
  const router = useRouter()
  const lang = useSyncExternalStore(subscribe, read, () => initial)
  const setLang = useCallback(
    (next: AdminLang) => {
      document.cookie = `${ADMIN_LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
      document.documentElement.lang = next
      listeners.forEach((listener) => listener())
      // judul halaman dan isi dashboard dirender server: muat ulang dalam bahasa baru
      router.refresh()
    },
    [router],
  )
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>
}

export function useAdminLang() {
  return useContext(Ctx)
}

// Penerjemah teks admin untuk client component
export function useAdminT() {
  const { lang } = useAdminLang()
  return useMemo(() => (text: string) => adminT(lang, text), [lang])
}

// Satu tombol bulat seperti tombol bahasa situs publik (revisi pemilik 2026-11-06, menggantikan
// pasangan ID | EN): kode yang terlihat adalah bahasa tujuan dan menjadi awal nama aksesibel
// (WCAG 2.5.3, DESIGN.md bagian 102). Saat ditekan: suara acak digital yang sama, tampilan dan kolom
// isian berganti bahasa, lalu teks yang berubah di layar diacak dan terurai seperti di situs publik.
export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useAdminLang()
  const target: AdminLang = lang === 'id' ? 'en' : 'id'
  const label =
    lang === 'id' ? 'EN, ganti bahasa admin ke English' : 'ID, switch admin language to Indonesian'

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
