'use client'

import { ExternalLink, History, KeyRound, LogOut, Settings } from 'lucide-react'
import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { authClient } from '@/lib/auth-client'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'

export type AdminIdentity = { adminName: string; photo: string | StaticImageData }

// sudut kecil, bukan kapsul (revisi pemilik 2026-11-06: ujung sorotan lebih lancip). Warna dipisah
// agar Keluar merah tidak bertabrakan dengan text-muted (urutan kelas di CSS tidak bisa diandalkan).
const itemBase =
  'flex min-h-11 w-full items-center gap-3 rounded-md px-3.5 text-sm font-semibold transition-colors'
const itemClass = `${itemBase} text-muted hover:bg-surface-2 hover:text-text`

// Isi menu profil (revisi pemilik 2026-11-11): Log audit dan Pengaturan pindah ke sini dari sidebar.
// Urutan tetap pilihan pemilik di kedua bahasa; Keluar tetap paling bawah.
const MENU_ITEMS = [
  { label: 'Akun', href: '/admin/account', icon: KeyRound, external: false },
  { label: 'Pengaturan', href: '/admin/settings', icon: Settings, external: false },
  { label: 'Log audit', href: '/admin/audit', icon: History, external: false },
  { label: 'Lihat situs', href: '/id', icon: ExternalLink, external: true },
] as const

// Foto bulat di pojok kanan atas; menekannya membuka kepala menu (foto, nama, peran), lalu tautan menu
// dan Keluar berwarna merah.
export function ProfileMenu({ adminName, photo }: AdminIdentity) {
  const router = useRouter()
  const t = useAdminT()
  const [open, setOpen] = useState(false)
  // Keluar sedang diproses: tombol nonaktif agar klik berulang tidak mengirim beberapa permintaan
  // (audit 2026-11-02, PERF-06). Ref ikut dicek karena state baru berlaku di render berikutnya.
  const [signingOut, setSigningOut] = useState(false)
  const signingOutRef = useRef(false)
  const root = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') setOpen(false)
      } else if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  async function signOut() {
    if (signingOutRef.current) return
    signingOutRef.current = true
    setSigningOut(true)
    try {
      await authClient.signOut()
      router.replace('/admin/login')
      router.refresh()
    } catch {
      // gagal (mis. koneksi putus): tombol bisa ditekan lagi
      signingOutRef.current = false
      setSigningOut(false)
    }
  }

  return (
    <div ref={root} className="relative flex shrink-0">
      <button
        type="button"
        aria-label={t('Menu profil')}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface p-0.5"
      >
        <Image
          placeholder={SHIMMER_PLACEHOLDER}
          src={photo}
          alt=""
          width={40}
          height={40}
          sizes="40px"
          className="size-full rounded-full bg-text object-cover"
        />
      </button>
      {open ? (
        <div
          id={panelId}
          className="admin-pop absolute top-full right-0 z-40 mt-3 w-64 rounded-2xl border border-border p-2 shadow-2xl"
        >
          <div className="flex items-center gap-3 px-2 py-2">
            <Image
              placeholder={SHIMMER_PLACEHOLDER}
              src={photo}
              alt=""
              width={40}
              height={40}
              sizes="40px"
              className="size-10 shrink-0 rounded-full bg-text object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm leading-snug font-semibold">{adminName}</p>
              <p className="text-xs text-muted">Super Admin</p>
            </div>
          </div>
          <div className="my-1 border-t border-border" />
          {MENU_ITEMS.map(({ label, href, icon: Icon, external }) =>
            external ? (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={itemClass}
              >
                <Icon className="size-4" aria-hidden="true" />
                {t(label)}
                <span className="sr-only">{t('(membuka tab baru)')}</span>
              </a>
            ) : (
              <Link key={href} href={href} className={itemClass} onClick={() => setOpen(false)}>
                <Icon className="size-4" aria-hidden="true" />
                {t(label)}
              </Link>
            ),
          )}
          <div className="my-1 border-t border-border" />
          {/* Keluar berwarna merah, terpisah garis (revisi pemilik 2026-11-11) */}
          <button
            type="button"
            className={`${itemBase} text-danger hover:bg-danger/10 disabled:cursor-wait disabled:opacity-60`}
            onClick={signOut}
            disabled={signingOut}
            aria-busy={signingOut || undefined}
          >
            <LogOut className="size-4" aria-hidden="true" />
            {signingOut ? t('Keluar…') : t('Keluar')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
