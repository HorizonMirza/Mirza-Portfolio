'use client'

import { EllipsisVertical, ExternalLink, KeyRound, LogOut } from 'lucide-react'
import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  'flex min-h-11 w-full items-center gap-3 rounded-md px-3.5 text-left text-sm font-semibold transition-colors'
const itemClass = `${itemBase} py-2 text-muted hover:bg-surface-2 hover:text-text`

// Isi menu (demo 3 pilihan pemilik 2026-11-11): Akun dan Lihat situs dengan keterangan singkat,
// lalu Keluar. Urutan tetap di kedua bahasa.
const MENU_ITEMS = [
  {
    label: 'Akun',
    hint: 'Nama, foto, password, perangkat',
    href: '/admin/account',
    icon: KeyRound,
    external: false,
  },
  {
    label: 'Lihat situs',
    hint: 'mmirza.site, tab baru',
    href: '/id',
    icon: ExternalLink,
    external: true,
  },
] as const

// Identitas admin di puncak sidebar (DESIGN.md bagian 128): foto, nama, dan Super Admin sekaligus
// tombol kembali ke Dashboard. Di Dashboard sendiri datanya dimuat ulang. Satu-satunya tempat wajah
// admin di panel; menu profil di top bar sengaja tanpa foto.
export function SidebarIdentity({
  adminName,
  photo,
  compact,
}: AdminIdentity & { compact: boolean }) {
  const t = useAdminT()
  const pathname = usePathname()
  const router = useRouter()
  // teks: tablet disembunyikan (tetap untuk pembaca layar); desktop memudar saat menciut
  const hideText = cn('max-lg:sr-only', fadeLabel(compact))
  return (
    <Link
      href="/admin"
      title={t('Kembali ke Dashboard')}
      onClick={(event) => {
        if (pathname !== '/admin') return
        event.preventDefault()
        router.refresh()
      }}
      // foto tepat di tengah rel 4.75rem di kedua keadaan: (4.75 - 2 x 0.75 - 2.5) / 2
      className="flex min-h-14 w-full min-w-0 items-center gap-3 rounded-md px-1.5 py-1.5 transition-colors hover:bg-surface-2 max-lg:justify-center max-lg:px-0"
    >
      <span className="size-10 shrink-0">
        <Image
          placeholder={SHIMMER_PLACEHOLDER}
          src={photo}
          alt=""
          width={40}
          height={40}
          sizes="40px"
          className="size-full rounded-full bg-text object-cover"
        />
      </span>
      <span className={cn('min-w-0 flex-1', hideText)}>
        <span className="block truncate text-sm leading-snug font-semibold">{adminName}</span>
        <span className="block text-xs text-muted">Super Admin</span>
      </span>
      <span className="sr-only">{t(', kembali ke Dashboard')}</span>
    </Link>
  )
}

// Menu profil di top bar, di samping tombol tema (demo 3 "Titik tiga", DESIGN.md bagian 128): tombol
// titik tiga bulat yang netral, bukan wajah kedua. Isi: Akun, Lihat situs, lalu Keluar merah.
export function ProfileMenu() {
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
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border hover:bg-surface-2"
      >
        <EllipsisVertical className="size-5" aria-hidden="true" />
      </button>
      {open ? (
        <div
          id={panelId}
          className="admin-pop absolute top-full right-0 z-50 mt-3 w-64 rounded-2xl border border-border p-2 shadow-2xl"
        >
          {MENU_ITEMS.map(({ label, hint, href, icon: Icon, external }) => {
            const body = (
              <>
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  {t(label)}
                  <span className="block text-xs font-normal text-muted">{t(hint)}</span>
                </span>
              </>
            )
            return external ? (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={itemClass}
              >
                {body}
              </a>
            ) : (
              <Link key={href} href={href} className={itemClass} onClick={() => setOpen(false)}>
                {body}
              </Link>
            )
          })}
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
