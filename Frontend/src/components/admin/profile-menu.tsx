'use client'

import { ExternalLink, KeyRound, LogOut } from 'lucide-react'
import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import { authClient } from '@/lib/auth-client'

export type AdminIdentity = { adminName: string; photo: string | StaticImageData }

const itemClass =
  'flex min-h-11 w-full items-center gap-3 rounded-full px-3.5 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-text'

// Foto bulat di pojok kanan atas; menekannya membuka akun, tautan ke situs, dan Keluar.
export function ProfileMenu({ adminName, photo }: AdminIdentity) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
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
    await authClient.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="Menu profil"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface p-0.5"
      >
        <Image
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
          className="absolute top-full right-0 z-40 mt-2 w-64 rounded-2xl border border-border bg-surface p-2 shadow-lg"
        >
          <div className="px-3.5 py-2">
            <p className="text-sm leading-snug font-semibold">{adminName}</p>
            <p className="text-xs text-muted">Super Admin</p>
          </div>
          <div className="my-1 border-t border-border" />
          <Link href="/admin/account" className={itemClass} onClick={() => setOpen(false)}>
            <KeyRound className="size-4" aria-hidden="true" />
            Akun
          </Link>
          <a href="/id" target="_blank" rel="noopener noreferrer" className={itemClass}>
            <ExternalLink className="size-4" aria-hidden="true" />
            Lihat situs
            <span className="sr-only">(membuka tab baru)</span>
          </a>
          <button type="button" className={itemClass} onClick={signOut}>
            <LogOut className="size-4" aria-hidden="true" />
            Keluar
          </button>
        </div>
      ) : null}
    </div>
  )
}
