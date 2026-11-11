'use client'

import { ChevronsUpDown, ExternalLink, KeyRound, LogOut } from 'lucide-react'
import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { fadeLabel } from '@/components/admin/sidebar-state'
import { authClient } from '@/lib/auth-client'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'
import { cn } from '@/lib/utils'

export type AdminIdentity = { adminName: string; photo: string | StaticImageData }

// sudut kecil, bukan kapsul (revisi pemilik 2026-11-06: ujung sorotan lebih lancip). Warna dipisah
// agar Keluar merah tidak bertabrakan dengan text-muted (urutan kelas di CSS tidak bisa diandalkan).
const itemBase =
  'flex min-h-11 w-full items-center gap-3 rounded-md px-3.5 text-sm font-semibold transition-colors'
const itemClass = `${itemBase} text-muted hover:bg-surface-2 hover:text-text`

// Isi menu profil (revisi pemilik 2026-11-11, kedua): hanya Akun dan Lihat situs, lalu Keluar.
// Pengaturan kembali ke sidebar; Log audit dihapus dari panel.
const MENU_ITEMS = [
  { label: 'Akun', href: '/admin/account', icon: KeyRound, external: false },
  { label: 'Lihat situs', href: '/id', icon: ExternalLink, external: true },
] as const

function Photo({ photo, size }: { photo: string | StaticImageData; size: number }) {
  return (
    <Image
      placeholder={SHIMMER_PLACEHOLDER}
      src={photo}
      alt=""
      width={size}
      height={size}
      sizes={`${size}px`}
      className="size-full rounded-full bg-text object-cover"
    />
  )
}

// Menu profil (DESIGN.md bagian 126). Identitas admin hanya ada di satu tempat:
// - variant "sidebar" (tablet dan desktop): foto, nama, dan "Super Admin" di puncak sidebar adalah
//   tombolnya; menu terbuka di bawahnya (di samping saat sidebar hanya ikon).
// - variant "avatar" (HP, sidebar tersembunyi): foto bulat di top bar; menu terbuka dengan kepala
//   berisi foto, nama, dan peran.
// Isi menu: Akun, Lihat situs, lalu Keluar berwarna merah.
export function ProfileMenu({
  adminName,
  photo,
  variant,
  compact = false,
  className,
}: AdminIdentity & {
  variant: 'sidebar' | 'avatar'
  // sidebar sedang hanya ikon di desktop (di tablet selalu hanya ikon)
  compact?: boolean
  className?: string
}) {
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

  const sidebar = variant === 'sidebar'
  // teks identitas: tablet disembunyikan (tetap untuk pembaca layar); desktop memudar saat menciut
  const hideText = cn('max-lg:sr-only', fadeLabel(compact))

  return (
    <div ref={root} className={cn('relative flex shrink-0', className)}>
      {sidebar ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            // foto tepat di tengah rel 4.75rem di kedua keadaan: (4.75 - 2 x 0.75 - 2.5) / 2
            'flex min-h-14 w-full min-w-0 items-center gap-3 rounded-md px-1.5 py-1.5 text-left hover:bg-surface-2',
            'max-lg:justify-center max-lg:px-0',
          )}
        >
          <span className="size-10 shrink-0">
            <Photo photo={photo} size={40} />
          </span>
          <span className={cn('min-w-0 flex-1', hideText)}>
            <span className="block truncate text-sm leading-snug font-semibold">{adminName}</span>
            <span className="block text-xs text-muted">Super Admin</span>
          </span>
          <span className="sr-only">{t('Menu profil')}</span>
          <ChevronsUpDown
            className={cn('size-4 shrink-0 text-muted', hideText)}
            aria-hidden="true"
          />
        </button>
      ) : (
        <button
          type="button"
          aria-label={t('Menu profil')}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface p-0.5"
        >
          <Photo photo={photo} size={40} />
        </button>
      )}
      {open ? (
        <div
          id={panelId}
          className={cn(
            'admin-pop absolute z-50 w-64 rounded-2xl border border-border p-2 shadow-2xl',
            sidebar
              ? cn(
                  // di bawah identitas saat sidebar lebar, di sampingnya saat hanya ikon
                  'top-0 left-full ml-3 lg:top-full lg:right-0 lg:left-0 lg:mt-2 lg:ml-0 lg:w-auto',
                  compact && 'lg:top-0 lg:right-auto lg:left-full lg:mt-0 lg:ml-3 lg:w-64',
                )
              : 'top-full right-0 mt-3',
          )}
        >
          {sidebar ? null : (
            <>
              <div className="flex items-center gap-3 px-2 py-2">
                <span className="size-10 shrink-0">
                  <Photo photo={photo} size={40} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm leading-snug font-semibold">{adminName}</p>
                  <p className="text-xs text-muted">Super Admin</p>
                </div>
              </div>
              <div className="my-1 border-t border-border" />
            </>
          )}
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
