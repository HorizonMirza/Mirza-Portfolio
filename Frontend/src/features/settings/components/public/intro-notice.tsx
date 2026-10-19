'use client'

import { FileText, House } from 'lucide-react'
import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'

import { NeuralVortexBackground } from '@/components/shared/neural-vortex-background'
import { getPathname, usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { LANG_SCRAMBLE_KEY, scrambleVisibleText, visibleTexts } from '@/lib/text-scramble'
import { playLanguageSound } from '@/lib/ui-sounds'
import { prefersReducedMotion } from '@/lib/view-transition'

import { INTRO_PENDING_ATTR, INTRO_SEEN_KEY } from '../../intro-pending'

type Locale = (typeof routing.locales)[number]

export type IntroNoticeVersion = {
  eyebrow: string
  title: string
  body: ReactNode
  cvHref: string | null
  labels: { language: string; downloadCv: string; home: string; newTab: string }
}

function clearPending() {
  document.documentElement.removeAttribute(INTRO_PENDING_ATTR)
}
// sama dengan durasi animasi .intro[data-leaving] di globals.css
const LEAVE_MS = 320
// sama dengan durasi animasi .intro[data-leaving='home'] (memudar dan buram)
const HOME_LEAVE_MS = 450
// Pindah bahasa lewat navigasi klien kadang macet di Firefox (CI 2026-10-12 s.d. 2026-10-15, juga tombol
// bahasa di header). Bila alamat belum berganti setelah waktu ini, halaman dimuat biasa ke bahasa tujuan.
const LOCALE_FALLBACK_MS = 1500

function alreadySeen() {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    // penyimpanan diblokir: pemberitahuan bisa muncul lagi di halaman berikutnya
  }
}

// Pemberitahuan pembuka (pilihan pemilik 2026-10-12, demo 1 "Kartu tengah"; revisi 2026-10-15): kartu
// ramping di tengah layar. Latar dan kartu sama dengan halaman login Super Admin (pilihan pemilik
// 2026-10-15, demo latar 11): shader neural vortex di atas hitam dan kartu kaca gelap, selalu gelap
// di tema terang maupun gelap. Shader hanya dipasang selama kartu terbuka. Memakai <dialog> bawaan
// (showModal): fokus terkunci di dalam kartu, Esc menutup, halaman di belakang tidak bisa diklik.
// Dibuka setelah halaman tampil, jadi isi situs tetap dirender server dan terbaca mesin pencari.
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
  // selesai saat tombol Esc yang menutup kartu sudah dilepas (lihat catatan Firefox di close)
  const escReleased = useRef<Promise<void> | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const [shown, setShown] = useState<Locale>(locale)
  // shader latar berjalan hanya selama kartu terbuka
  const [active, setActive] = useState(false)
  // teks kartu sebelum ganti bahasa, agar teks yang sama di kedua bahasa tidak ikut diacak
  const before = useRef<string[] | null>(null)
  const v = versions[shown]

  useEffect(() => {
    const dialog = ref.current
    // otomatisasi (tes E2E, Lighthouse) tidak perlu melihat pemberitahuan
    if (!dialog || dialog.open || navigator.webdriver || alreadySeen()) {
      clearPending()
      return
    }
    // dilepas sebelum showModal: di dalam body yang tersembunyi kartu tidak bisa difokus
    clearPending()
    dialog.showModal()
    setActive(true)
    // Fokus awal di dialog itu sendiri (pembaca layar membacakan judulnya), bukan di tombol: Chromium
    // menampilkan garis fokus untuk fokus dari skrip sebelum ada interaksi. Tab menuju tombol pertama.
    dialog.focus()
  }, [])

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
    // sudah sedang ditutup: Esc atau klik kedua tidak memulai ulang
    if (!dialog?.open || dialog.dataset.leaving !== undefined) return
    markSeen()
    const finish = () => {
      dialog.close()
      delete dialog.dataset.leaving
      setActive(false)
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
      // Dimulai setelah tombol Esc dilepas: di Firefox, Esc juga berarti "hentikan pemuatan" dan
      // bisa memutus permintaan halaman yang dimulai di antara tombol ditekan dan dilepas. CI
      // 2026-10-15: bahasa situs tetap ID, lalu halaman kosong saat navigasi dimulai di antaranya.
      const go = () => {
        router.push(target, { locale: shown, scroll: goHome })
        if (shown === locale) return
        const destination = getPathname({ href: target, locale: shown })
        window.setTimeout(() => {
          if (window.location.pathname !== destination) window.location.assign(destination)
        }, LOCALE_FALLBACK_MS)
      }
      void (escReleased.current ?? Promise.resolve()).then(() => window.setTimeout(go, 0))
    }
    if (prefersReducedMotion()) {
      finish()
      return
    }
    // Beranda: kartu dan latar memudar sambil makin buram (pilihan pemilik 2026-10-15)
    dialog.dataset.leaving = goHome ? 'home' : ''
    window.setTimeout(finish, goHome ? HOME_LEAVE_MS : LEAVE_MS)
  }

  // dialog memenuhi layar; klik di luar kartu (di latar vortex) ikut menutup
  function onDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) close()
  }

  // Esc ditangani sendiri dan aksi bawaannya dicegah (lihat catatan Firefox di close)
  function onDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Escape') return
    event.preventDefault()
    escReleased.current = new Promise((resolve) => {
      const done = () => {
        window.removeEventListener('keyup', done, true)
        resolve()
      }
      window.addEventListener('keyup', done, true)
      // tombol tidak pernah dilepas di halaman ini (mis. jendela berpindah): tetap lanjut
      window.setTimeout(done, 400)
    })
    close()
  }

  return (
    <dialog
      ref={ref}
      lang={shown}
      className="intro"
      tabIndex={-1}
      aria-labelledby="intro-title"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onKeyDown={onDialogKeyDown}
      onClick={onDialogClick}
    >
      {active ? <NeuralVortexBackground /> : null}
      {/* kartu kaca seperti login admin (components/admin/login-form.tsx) */}
      <div className="intro-card login-card">
        <div className="intro-panel">
          <div aria-hidden="true" className="intro-grain" />
          <div className="intro-box">
            <div className="flex items-center justify-between gap-4">
              <p className="intro-eyebrow font-mono uppercase">{v.eyebrow}</p>
              <div role="group" aria-label={v.labels.language} className="intro-lang">
                {routing.locales.map((l) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={l === shown}
                    onClick={() => switchTo(l)}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <h2 id="intro-title" className="intro-title">
              {v.title}
            </h2>
            <div className="intro-body">{v.body}</div>
            <div className={v.cvHref ? 'intro-actions intro-actions-2' : 'intro-actions'}>
              {/* Resume CV hanya membuka CV di tab baru; kartu tetap terbuka sampai pengunjung
                  menekan Beranda, Esc, atau area di luar kartu (revisi pemilik 2026-10-16) */}
              {v.cvHref ? (
                <a
                  href={v.cvHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="intro-btn intro-btn-primary"
                >
                  <FileText aria-hidden="true" />
                  {v.labels.downloadCv}
                  <span className="sr-only">{v.labels.newTab}</span>
                </a>
              ) : null}
              <button
                type="button"
                className="intro-btn intro-btn-secondary"
                onClick={() => close(true)}
              >
                <House aria-hidden="true" />
                {v.labels.home}
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
