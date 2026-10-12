'use client'

import { ArrowRight, Code2, Download } from 'lucide-react'
import { useLocale } from 'next-intl'
import { type MouseEvent, type ReactNode, useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { prefersReducedMotion } from '@/lib/view-transition'

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

type Labels = {
  language: string
  downloadCv: string
  projects: string
  enter: string
  newTab: string
}

// Pemberitahuan pembuka (pilihan pemilik 2026-10-12, demo 1 "Kartu tengah"): kartu di tengah layar
// di atas situs yang diburamkan. Memakai <dialog> bawaan (showModal): fokus terkunci di dalam kartu,
// Esc menutup, halaman di belakang tidak bisa diklik. Dibuka setelah halaman tampil, jadi isi situs
// tetap dirender server dan terbaca mesin pencari. Isi Markdown sudah dirender server (children).
export function IntroNotice({
  eyebrow,
  title,
  cvHref,
  labels,
  children,
}: {
  eyebrow: string
  title: string
  cvHref: string | null
  labels: Labels
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  // true saat pengunjung mengganti bahasa dari dalam kartu: halaman berpindah ke bahasa lain dan
  // pemberitahuan harus tetap tampil, jadi penutupan yang terjadi selama perpindahan itu (Firefox
  // sempat menutup dialog di CI) tidak dihitung "sudah dilihat"
  const switchingLocale = useRef(false)
  const locale = useLocale()
  const pathname = usePathname()

  // Dibuka setelah halaman tampil, dan dibuka lagi setelah bahasa diganti dari dalam kartu bila
  // browser sempat menutupnya selama perpindahan (Firefox). Setelah itu penutupan kembali dihitung.
  useEffect(() => {
    switchingLocale.current = false
    const dialog = ref.current
    // otomatisasi (tes E2E, Lighthouse) tidak perlu melihat pemberitahuan
    if (!dialog || dialog.open || navigator.webdriver || alreadySeen()) return
    dialog.showModal()
    // fokus ke tombol utama, bukan ke pilihan bahasa di pojok; garis fokus baru tampil saat
    // pengunjung memakai keyboard (Tab), agar kartu tidak langsung bergaris biru
    dialog
      .querySelector<HTMLElement>('[data-intro-primary]')
      ?.focus({ focusVisible: false } as FocusOptions)
  }, [locale])

  function close() {
    const dialog = ref.current
    if (!dialog?.open) return
    if (!switchingLocale.current) markSeen()
    if (prefersReducedMotion()) {
      dialog.close()
      return
    }
    dialog.dataset.leaving = ''
    window.setTimeout(() => {
      dialog.close()
      delete dialog.dataset.leaving
    }, LEAVE_MS)
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
      className="intro"
      aria-labelledby="intro-title"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClick={onDialogClick}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-label tracking-widest text-note uppercase">{eyebrow}</p>
        {/* ganti bahasa: halaman yang sama dibuka di bahasa lain, pemberitahuan tampil lagi di
            bahasa itu karena belum ditutup */}
        <nav aria-label={labels.language} className="intro-lang">
          {routing.locales.map((l) => (
            <Link
              key={l}
              href={pathname}
              locale={l}
              hrefLang={l}
              scroll={false}
              aria-current={l === locale ? 'true' : undefined}
              onClick={() => {
                switchingLocale.current = true
              }}
            >
              {l.toUpperCase()}
            </Link>
          ))}
        </nav>
      </div>
      <h2 id="intro-title" className="intro-title">
        {title}
      </h2>
      <div className="intro-body">{children}</div>
      <div className="mt-7 flex flex-wrap gap-3">
        {cvHref ? (
          <Button asChild data-intro-primary="">
            <a href={cvHref} target="_blank" rel="noopener noreferrer" onClick={close}>
              <Download aria-hidden="true" />
              {labels.downloadCv}
              <span className="sr-only">{labels.newTab}</span>
            </a>
          </Button>
        ) : null}
        <Button asChild variant="secondary" {...(cvHref ? {} : { 'data-intro-primary': '' })}>
          <Link href="/projects" onClick={close}>
            <Code2 aria-hidden="true" />
            {labels.projects}
          </Link>
        </Button>
        <Button type="button" variant="ghost" onClick={close}>
          {labels.enter}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </dialog>
  )
}
