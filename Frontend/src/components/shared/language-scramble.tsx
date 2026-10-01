'use client'

import { useLocale } from 'next-intl'
import { useEffect } from 'react'

import { LANG_SCRAMBLE_KEY, scrambleVisibleText } from '@/lib/text-scramble'

// tanda dari tombol bahasa dianggap basi setelah beberapa detik (mis. tab dibuka ulang)
const MAX_AGE_MS = 5000

// Memutar animasi "acak huruf" begitu halaman tampil dalam bahasa baru, bila perpindahan itu
// berasal dari tombol bahasa (tanda di sessionStorage). Tidak merender apa pun.
export function LanguageScramble() {
  const locale = useLocale()

  useEffect(() => {
    let flag: { at?: unknown; texts?: unknown } | null = null
    try {
      const raw = sessionStorage.getItem(LANG_SCRAMBLE_KEY)
      sessionStorage.removeItem(LANG_SCRAMBLE_KEY)
      flag = raw ? JSON.parse(raw) : null
    } catch {
      return
    }
    if (!flag || typeof flag.at !== 'number' || Date.now() - flag.at > MAX_AGE_MS) return
    const unchanged = Array.isArray(flag.texts)
      ? flag.texts.filter((t): t is string => typeof t === 'string')
      : []
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // dua frame: tunggu posisi scroll halaman baru selesai diatur sebelum mencari teks yang terlihat
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => scrambleVisibleText(document.body, unchanged))
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [locale])

  return null
}
