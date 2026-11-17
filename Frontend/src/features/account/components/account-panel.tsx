'use client'

import {
  CalendarDays,
  Camera,
  ChevronRight,
  KeyRound,
  LogOut,
  Mail,
  Monitor,
  Smartphone,
  User,
} from 'lucide-react'
import Image, { type StaticImageData } from 'next/image'
import { useRouter } from 'next/navigation'
import { type ReactNode, useId, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Spinner } from '@/components/ui/spinner'
import { useAdminLang, useAdminT } from '@/components/admin/admin-lang'
import { Button } from '@/components/ui/button'
import type { DeviceParts } from '@/lib/device'
import { formatDateTime } from '@/lib/format'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'
import { cn } from '@/lib/utils'
import { useAssetPicker } from '@/features/assets/components/use-asset-picker'

import type { AccountSession } from '../queries'
import { revokeOtherSessions, revokeSession } from '../session-actions'
import { ChangeIdentityDialog, ChangePasswordDialog } from './account-dialogs'

// form tampil sebagai dialog di atas halaman
type Dialog = 'name' | 'email' | 'password'
type T = ReturnType<typeof useAdminT>

function deviceName(device: DeviceParts | null, t: T) {
  if (!device) return null
  return t('{browser} di {os}', {
    browser: device.browser ?? t('Browser tidak dikenal'),
    os: device.os ?? t('sistem tidak dikenal'),
  })
}

function shortDate(iso: string, lang: 'id' | 'en') {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
  }).format(new Date(iso))
}

// Admin → Akun, desain 1 "Profil ala WhatsApp" (pilihan pemilik 2026-11-11, DESIGN.md bagian 124):
// foto besar di tengah, nama dan peran, lalu daftar berkelompok Info, Keamanan, dan Perangkat tertaut.
// Revisi pemilik 2026-11-16: tombol kamera langsung membuka pemilih berkas lalu pengaturan ukuran
// (foto sendiri tidak bisa ditekan); email tampil apa adanya; ganti nama, email, dan password berupa
// dialog dengan latar buram tipis (nama atau email lama, yang baru, dan password); daftar Aktivitas
// terbaru dihapus.
export function AccountPanel({
  name,
  email,
  photo,
  adminSince,
  passwordChangedAt,
  sessions,
  uploadReady,
}: {
  name: string
  email: string
  photo: string | StaticImageData
  adminSince: string | null
  passwordChangedAt: string | null
  sessions: AccountSession[]
  // Cloudinary diatur (unggah foto profil bisa dipakai)
  uploadReady: boolean
}) {
  const t = useAdminT()
  const { lang } = useAdminLang()
  const router = useRouter()
  const [dialog, setDialog] = useState<Dialog | null>(null)
  // kamera: langsung ke pemilih berkas, lalu pemotong gambar (DESIGN.md bagian 148)
  const picker = useAssetPicker({ configured: uploadReady, onDone: () => router.refresh() })
  const setDialogOpen = (name: Dialog) => (open: boolean) => setDialog(open ? name : null)
  // pembuka dialog, tempat fokus kembali saat dialog ditutup
  const opener = useRef<HTMLElement | null>(null)
  const show = (name: Dialog) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setDialog(name)
  }
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-7">
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <div className="relative">
          <Image
            placeholder={SHIMMER_PLACEHOLDER}
            src={photo}
            alt=""
            width={128}
            height={128}
            sizes="128px"
            className={cn('size-32 rounded-full bg-text object-cover', picker.busy && 'opacity-60')}
          />
          {picker.busy ? (
            <span className="absolute inset-0 grid place-items-center text-bg" role="status">
              <Spinner className="size-7" />
              <span className="sr-only">{t('Mengunggah…')}</span>
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => picker.pick('profile-photo')}
            disabled={picker.busy}
            aria-label={t('Ganti Foto Profil')}
            className="absolute right-0 bottom-0 grid size-10 place-items-center rounded-full border border-border-strong bg-surface hover:bg-surface-2"
          >
            <Camera className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-xl font-semibold">{name}</p>
        <span className="rounded-md border border-border-strong px-1.5 text-xs leading-5 font-semibold">
          Super Admin
        </span>
      </div>

      <Group title={t('Info')}>
        <Row icon={<User />} title={t('Nama')} detail={name} onClick={() => show('name')} />
        <Row
          icon={<Mail />}
          title="Email"
          detail={<span className="break-all">{email}</span>}
          onClick={() => show('email')}
        />
        {adminSince ? (
          <Row
            icon={<CalendarDays />}
            title={t('Admin Sejak')}
            detail={shortDate(adminSince, lang)}
          />
        ) : null}
      </Group>

      <Group title={t('Keamanan')}>
        <Row
          icon={<KeyRound />}
          title={t('Ganti Password')}
          detail={
            passwordChangedAt
              ? t('Terakhir diganti {date}', { date: shortDate(passwordChangedAt, lang) })
              : t('Belum pernah diganti dari panel')
          }
          onClick={() => show('password')}
        />
      </Group>

      <DevicesGroup sessions={sessions} />

      <ChangeIdentityDialog
        kind="name"
        current={name}
        returnFocus={opener}
        open={dialog === 'name'}
        onOpenChange={setDialogOpen('name')}
      />
      <ChangeIdentityDialog
        kind="email"
        current={email}
        returnFocus={opener}
        open={dialog === 'email'}
        onOpenChange={setDialogOpen('email')}
      />
      <ChangePasswordDialog
        returnFocus={opener}
        open={dialog === 'password'}
        onOpenChange={setDialogOpen('password')}
      />
      {picker.element}
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h2 id={id} className="px-1 text-sm font-semibold text-muted">
        {title}
      </h2>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {children}
      </div>
    </section>
  )
}

// Satu baris daftar: ikon di kotak kecil, judul dan keterangan, lalu isi kanan. Bila bisa ditekan,
// seluruh baris tombol dengan panah (atau ikon lain) di kanan.
function Row({
  icon,
  title,
  detail,
  trailing,
  onClick,
  danger = false,
}: {
  icon: ReactNode
  title: ReactNode
  detail?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  danger?: boolean
}) {
  const body = (
    <>
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-[10px] bg-surface-2 [&_svg]:size-[18px]',
          danger ? 'text-danger' : 'text-text',
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block font-medium', danger && 'text-danger')}>{title}</span>
        {detail ? <span className="block text-sm text-muted">{detail}</span> : null}
      </span>
      {trailing ??
        (onClick && !danger ? (
          <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
        ) : null)}
    </>
  )
  const base = 'flex min-h-16 w-full items-center gap-3.5 px-4 py-2.5 text-left'
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(base, 'hover:bg-surface-2 focus-visible:-outline-offset-2')}
    >
      {body}
    </button>
  ) : (
    <div className={base}>{body}</div>
  )
}

function DevicesGroup({ sessions }: { sessions: AccountSession[] }) {
  const t = useAdminT()
  const { lang } = useAdminLang()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  // perangkat yang sedang dikeluarkan (spinner di tombolnya)
  const [busyId, setBusyId] = useState<string | null>(null)
  const others = sessions.filter((s) => !s.current).length

  const run = (action: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const result = await action()
      if (result.ok) toast.success(t(result.message))
      else toast.error(t(result.message))
      setConfirming(false)
      router.refresh()
    })

  return (
    <Group title={t('Perangkat Tertaut · {count}', { count: sessions.length })}>
      {sessions.map((s) => {
        const Icon = s.device.mobile ? Smartphone : Monitor
        const device = deviceName(s.device, t) ?? ''
        return (
          <div key={s.id} data-session className="flex min-h-16 items-center gap-3.5 px-4 py-2.5">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-surface-2"
              aria-hidden="true"
            >
              <Icon className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{device}</span>
              <span className="block text-sm text-muted">
                {s.location ? `${s.location} · ` : ''}
                {s.current ? (
                  <span className="font-medium text-success">{t('Aktif Sekarang')}</span>
                ) : (
                  t('Terakhir aktif {time}', { time: formatDateTime(new Date(s.lastActive), lang) })
                )}
              </span>
            </span>
            {s.current ? (
              <span className="shrink-0 rounded-md border border-border-strong px-1.5 text-xs leading-5 font-semibold">
                {t('Perangkat Ini')}
              </span>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                loading={pending && busyId === s.id}
                onClick={() => {
                  setBusyId(s.id)
                  run(() => revokeSession(s.id))
                }}
                aria-label={t('Keluarkan {device}', { device })}
              >
                {t('Keluarkan')}
              </Button>
            )}
          </div>
        )
      })}
      {others > 0 ? (
        confirming ? (
          <div
            role="alertdialog"
            aria-label={t('Keluar dari semua perangkat lain?')}
            className="flex flex-wrap items-center justify-between gap-3 bg-danger/10 px-4 py-3"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setConfirming(false)
            }}
          >
            <p className="text-sm">
              {t('Keluarkan {count} perangkat lain? Perangkat ini tetap masuk.', { count: others })}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                {t('Batal')}
              </Button>
              <Button
                type="button"
                size="sm"
                autoFocus
                loading={pending}
                onClick={() => run(revokeOtherSessions)}
                className="bg-danger text-white hover:bg-danger/90 dark:text-bg"
              >
                {t('Keluarkan')}
              </Button>
            </div>
          </div>
        ) : (
          <Row
            icon={<LogOut />}
            title={t('Keluar dari Semua Perangkat Lain')}
            onClick={() => setConfirming(true)}
            danger
          />
        )
      ) : (
        <p className="px-4 py-3 text-sm text-muted">
          {t('Hanya perangkat ini yang sedang masuk.')}
        </p>
      )}
    </Group>
  )
}
