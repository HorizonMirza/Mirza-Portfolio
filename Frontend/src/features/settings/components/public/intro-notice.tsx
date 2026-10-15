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
    if (!dialog || dialog.open || navigator.webdriver || alreadySeen()) return
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
      // Dimulai setelah penanganan tombol selesai: di Firefox, Esc juga berarti "hentikan pemuatan"
      // dan bisa memutus permintaan halaman yang dimulai di saat yang sama (CI 2026-10-15).
      window.setTimeout(() => router.push(target, { locale: shown, scroll: goHome }), 0)
    }
    if (prefersReducedMotion()) {
      finish()
      return
    }
    dialog.dataset.leaving = ''
    window.setTimeout(finish, LEAVE_MS)
  }

  // dialog memenuhi layar; klik di luar kartu (di latar vortex) ikut menutup
  function onDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) close()
  }

  // Esc ditangani sendiri dan aksi bawaannya dicegah (lihat catatan Firefox di close)
  function onDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Escape') return
    event.preventDefault()
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
              {v.cvHref ? (
                <a
                  href={v.cvHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="intro-btn intro-btn-primary"
                  onClick={() => close()}
                >
                  <FileText aria-hidden="true" />
                  {v.labels.downloadCv}
                  <span className="sr-only">{v.labels.newTab}</span>
                </a>
              ) : null}
              {/* bingkai berkilau yang sama dengan kolom email/password di login */}
              <span className="login-field login-field-delay intro-btn-frame">
                <button
                  type="button"
                  className="intro-btn intro-btn-secondary"
                  onClick={() => close(true)}
                >
                  <House aria-hidden="true" />
                  {v.labels.home}
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
