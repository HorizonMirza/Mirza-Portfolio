'use client'

import { Download, House } from 'lucide-react'
import {
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { Button } from '@/components/ui/button'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { LANG_SCRAMBLE_KEY, scrambleVisibleText, visibleTexts } from '@/lib/text-scramble'
import { playLanguageSound } from '@/lib/ui-sounds'
import { prefersReducedMotion } from '@/lib/view-transition'

type Locale = (typeof routing.locales)[number]

export type IntroNoticeVersion = {
  eyebrow: string
  title: string
  body: ReactNode
  cvHref: string | null
  labels: { language: string; downloadCv: string; home: string; newTab: string }
}

// Penanda "sudah dilihat" per sesi browser: pemberitahuan muncul sekali setiap situs dibuka (tab
// baru), tidak muncul lagi saat berpindah halaman (pilihan pemilik 2026-10-12).
const SEEN_KEY = 'intro-notice-seen'
// sama dengan durasi animasi .intro[data-leaving] di globals.css
const LEAVE_MS = 320
// batas ukuran judul agar judul pendek tidak menjadi raksasa
const MAX_TITLE_PX = 72

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    // penyimpanan diblokir: pemberitahuan bisa muncul lagi di halaman berikutnya
  }
}

// Pemberitahuan pembuka (pilihan pemilik 2026-10-12, demo 1 "Kartu tengah"; revisi 2026-10-15): kartu
// ramping di tengah layar di atas situs yang diburamkan. Memakai <dialog> bawaan (showModal): fokus
// terkunci di dalam kartu, Esc menutup, halaman di belakang tidak bisa diklik. Dibuka setelah
// halaman tampil, jadi isi situs tetap dirender server dan terbaca mesin pencari.
// Tombol ID/EN mengganti bahasa kartu di tempat (efek acak huruf dan suara seperti tombol bahasa di
// header, tanpa memuat halaman). Bahasa situs ikut berganti setelah kartu ditutup, karena navigasi
// dari dalam dialog modal tidak andal di Firefox (CI 2026-10-12).
export function IntroNotice({
  locale,
  versions,
}: {
  locale: Locale
  versions: Record<Locale, IntroNoticeVersion>
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const [shown, setShown] = useState<Locale>(locale)
  // teks kartu sebelum ganti bahasa, agar teks yang sama di kedua bahasa tidak ikut diacak
  const before = useRef<string[] | null>(null)
  const v = versions[shown]

  useEffect(() => {
    const dialog = ref.current
    // otomatisasi (tes E2E, Lighthouse) tidak perlu melihat pemberitahuan
    if (!dialog || dialog.open || navigator.webdriver || alreadySeen()) return
    dialog.showModal()
    // fokus ke tombol utama; garis fokus baru tampil saat pengunjung memakai keyboard (Tab)
    dialog
      .querySelector<HTMLElement>('[data-intro-primary]')
      ?.focus({ focusVisible: false } as FocusOptions)
  }, [])

  // Judul satu baris selebar kartu (revisi pemilik 2026-10-15): ukuran huruf disesuaikan dengan
  // lebar teks yang diukur, dihitung ulang saat bahasa berganti atau ukuran layar berubah. Ukuran
  // dari CSS (.intro-title) menjadi titik awal sekaligus cadangan bila skrip belum berjalan.
  const titleRef = useRef<HTMLHeadingElement>(null)
  useLayoutEffect(() => {
    const title = titleRef.current
    if (!title) return
    const fit = () => {
      const text = title.firstElementChild as HTMLElement | null
      title.style.fontSize = ''
      const box = title.clientWidth
      // lebar teks sebenarnya (span inline), bukan lebar blok judul. offsetWidth, bukan
      // getBoundingClientRect: kartu masih mengecil 98% selama animasi masuk dan ukuran itu tidak
      // boleh ikut terhitung
      const width = text?.offsetWidth ?? 0
      if (!box || !width) return
      const base = parseFloat(getComputedStyle(title).fontSize)
      title.style.fontSize = `${Math.min(base * (box / width) * 0.99, MAX_TITLE_PX).toFixed(2)}px`
    }
    fit()
    // ukur ulang setelah font Oswald selesai dimuat: font baru diminta saat kartu tampil, dan font
    // cadangan lebih sempit sehingga judul akan terpotong bila tidak diukur ulang
    document.fonts?.addEventListener('loadingdone', fit)
    const observer = new ResizeObserver(fit)
    observer.observe(title.parentElement ?? title)
    return () => {
      document.fonts?.removeEventListener('loadingdone', fit)
      observer.disconnect()
    }
  }, [shown])

  // efek acak huruf setelah teks kartu berganti bahasa
  useEffect(() => {
    const dialog = ref.current
    const unchanged = before.current
    before.current = null
    if (!dialog?.open || !unchanged || prefersReducedMotion()) return
    scrambleVisibleText(dialog, unchanged)
  }, [shown])

  function switchTo(next: Locale) {
    if (next === shown) return
    playLanguageSound(next === 'en')
    if (ref.current) before.current = visibleTexts(ref.current)
    setShown(next)
  }

  // Menutup kartu, lalu (bila dipilih) pindah ke Beranda dan/atau ke bahasa yang dipilih di kartu.
  function close(goHome = false) {
    const dialog = ref.current
    if (!dialog?.open) return
    markSeen()
    const finish = () => {
      dialog.close()
      delete dialog.dataset.leaving
      const target = goHome ? '/' : pathname
      if (shown === locale && target === pathname) return
      if (shown !== locale) {
        // situs ikut beranimasi acak huruf seperti ganti bahasa dari header (LanguageScramble)
        try {
          sessionStorage.setItem(
            LANG_SCRAMBLE_KEY,
            JSON.stringify({ at: Date.now(), texts: visibleTexts() }),
          )
        } catch {
          // sessionStorage diblokir: tetap pindah, hanya tanpa animasi
        }
      }
      router.push(target, { locale: shown, scroll: goHome })
    }
    if (prefersReducedMotion()) {
      finish()
      return
    }
    dialog.dataset.leaving = ''
    window.setTimeout(finish, LEAVE_MS)
  }

  // klik di luar kartu (di latar buram) ikut menutup
  function onDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return
    const box = event.currentTarget.getBoundingClientRect()
    const inside =
      event.clientX >= box.left &&
      event.clientX <= box.right &&
      event.clientY >= box.top &&
      event.clientY <= box.bottom
    if (!inside) close()
  }

  return (
    <dialog
      ref={ref}
      lang={shown}
      className="intro"
      aria-labelledby="intro-title"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClick={onDialogClick}
    >
      <div className="intro-box">
        <div className="flex items-center justify-between gap-4">
          <p className="intro-eyebrow font-mono text-note uppercase">{v.eyebrow}</p>
          <div role="group" aria-label={v.labels.language} className="intro-lang">
            {routing.locales.map((l) => (
              <button key={l} type="button" aria-pressed={l === shown} onClick={() => switchTo(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {/* selalu satu baris selebar kartu: ukuran huruf mengikuti panjang judul (revisi pemilik
            2026-10-15) */}
        <h2
          ref={titleRef}
          id="intro-title"
          className="intro-title"
          style={{ '--chars': v.title.length } as CSSProperties}
        >
          <span>{v.title}</span>
        </h2>
        <div className="intro-body">{v.body}</div>
        <div className={v.cvHref ? 'intro-actions intro-actions-2' : 'intro-actions'}>
          {v.cvHref ? (
            <Button asChild data-intro-primary="" className="min-h-12">
              <a href={v.cvHref} target="_blank" rel="noopener noreferrer" onClick={() => close()}>
                <Download aria-hidden="true" />
                {v.labels.downloadCv}
                <span className="sr-only">{v.labels.newTab}</span>
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="min-h-12"
            onClick={() => close(true)}
            {...(v.cvHref ? {} : { 'data-intro-primary': '' })}
          >
            <House aria-hidden="true" />
            {v.labels.home}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
