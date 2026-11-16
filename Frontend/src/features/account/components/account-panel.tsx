'use client'

import {
  Bell,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  History,
  KeyRound,
  LogOut,
  Mail,
  Monitor,
  Pencil,
  Smartphone,
  User,
} from 'lucide-react'
import Image, { type StaticImageData } from 'next/image'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useId, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminLang, useAdminT } from '@/components/admin/admin-lang'
import { Button } from '@/components/ui/button'
import type { DeviceParts } from '@/lib/device'
import { formatDateTime } from '@/lib/format'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'
import { cn } from '@/lib/utils'
import { useAssetPicker } from '@/features/assets/components/use-asset-picker'
import { saveSiteOption } from '@/features/settings/actions'

import type { AccountEvent, AccountSession } from '../queries'
import { revokeOtherSessions, revokeSession } from '../session-actions'
import { ChangeIdentityDialog, ChangePasswordDialog, PhotoLightbox } from './account-dialogs'

type View = 'main' | 'activity'
// form dan foto penuh tampil sebagai dialog di atas halaman utama
type Dialog = 'name' | 'email' | 'password' | 'photo'
type T = ReturnType<typeof useAdminT>

// aktivitas yang langsung tampil di halaman utama; sisanya lewat "Lihat semua aktivitas"
const RECENT = 5

const EVENT_TITLE: Record<AccountEvent['kind'], string> = {
  success: 'Masuk',
  failed: 'Gagal masuk',
  password: 'Password diganti',
  signout: 'Perangkat dikeluarkan',
}

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
// foto besar di tengah, nama dan peran, lalu daftar berkelompok Info, Keamanan, Perangkat tertaut, dan
// Aktivitas terbaru. Revisi pemilik 2026-11-16: foto ditekan tampil penuh; tombol kamera langsung
// membuka pemilih berkas lalu pengaturan ukuran; email tampil apa adanya; ganti nama, email, dan
// password berupa dialog dengan latar buram (nama atau email lama, yang baru, dan password); hanya
// riwayat lengkap yang masih halaman sendiri dengan tombol kembali.
export function AccountPanel({
  name,
  email,
  photo,
  photoAssetId,
  adminSince,
  passwordChangedAt,
  sessions,
  events,
  loginNotify,
  emailReady,
  uploadReady,
}: {
  name: string
  email: string
  photo: string | StaticImageData
  // id berkas foto unggahan; null bila memakai foto bawaan
  photoAssetId: string | null
  adminSince: string | null
  passwordChangedAt: string | null
  sessions: AccountSession[]
  events: AccountEvent[]
  loginNotify: boolean
  emailReady: boolean
  // Cloudinary diatur (unggah foto profil bisa dipakai)
  uploadReady: boolean
}) {
  const t = useAdminT()
  const { lang } = useAdminLang()
  const router = useRouter()
  const [view, setView] = useState<View>('main')
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
  // halaman kedua yang terakhir ditutup, untuk mengembalikan fokus ke tombol pembukanya
  const [returnTo, setReturnTo] = useState<View | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const top = useRef<HTMLDivElement>(null)

  const open = (next: View) => () => setView(next)
  const back = () => {
    setReturnTo(view)
    setView('main')
  }

  // fokus pindah ke judul halaman kedua, lalu kembali ke tombol pembukanya; panel isi digulir ke atas
  useEffect(() => {
    top.current?.scrollIntoView({ block: 'start' })
    if (view !== 'main') heading.current?.focus()
    else if (returnTo)
      top.current?.querySelector<HTMLElement>(`[data-opens="${returnTo}"]`)?.focus()
  }, [view, returnTo])

  if (view !== 'main') {
    const titles: Record<Exclude<View, 'main'>, string> = { activity: t('Aktivitas') }
    return (
      <div ref={top} className="mx-auto flex w-full max-w-xl scroll-mt-6 flex-col gap-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={back}
            aria-label={t('Kembali ke Akun')}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 hover:bg-surface"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <h2 ref={heading} tabIndex={-1} className="text-lg font-semibold outline-none">
            {titles[view]}
          </h2>
        </div>
        {view === 'activity' ? <ActivityList events={events} filterable /> : null}
      </div>
    )
  }

  return (
    <div ref={top} className="mx-auto flex w-full max-w-xl scroll-mt-6 flex-col gap-7">
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <div className="relative">
          {/* foto ditekan: tampil penuh */}
          <button
            type="button"
            onClick={() => show('photo')}
            aria-label={t('Lihat foto profil')}
            className="block rounded-full"
          >
            <Image
              placeholder={SHIMMER_PLACEHOLDER}
              src={photo}
              alt=""
              width={128}
              height={128}
              sizes="128px"
              className={cn(
                'size-32 rounded-full bg-text object-cover',
                picker.busy && 'opacity-60',
              )}
            />
          </button>
          <button
            type="button"
            onClick={() => picker.pick('profile-photo')}
            disabled={picker.busy}
            aria-label={t('Ganti foto profil')}
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
        <Row
          icon={<User />}
          title={t('Nama')}
          detail={name}
          onClick={() => show('name')}
          trailing={<Pencil className="size-4 shrink-0 text-muted" aria-hidden="true" />}
        />
        <Row
          icon={<Mail />}
          title="Email"
          detail={<span className="break-all">{email}</span>}
          onClick={() => show('email')}
          trailing={<Pencil className="size-4 shrink-0 text-muted" aria-hidden="true" />}
        />
        {adminSince ? (
          <Row
            icon={<CalendarDays />}
            title={t('Admin sejak')}
            detail={shortDate(adminSince, lang)}
          />
        ) : null}
      </Group>

      <Group title={t('Keamanan')}>
        <Row
          icon={<KeyRound />}
          title={t('Ganti password')}
          detail={
            passwordChangedAt
              ? t('Terakhir diganti {date}', { date: shortDate(passwordChangedAt, lang) })
              : t('Belum pernah diganti dari panel')
          }
          onClick={() => show('password')}
        />
        <LoginNotifyRow initial={loginNotify} emailReady={emailReady} />
      </Group>

      <DevicesGroup sessions={sessions} />

      <div className="flex flex-col gap-2">
        <Group title={t('Aktivitas terbaru')}>
          <ActivityList events={events.slice(0, RECENT)} />
          {events.length > RECENT ? (
            <Row
              icon={<History />}
              title={t('Lihat semua aktivitas')}
              detail={t('{count} kejadian, bisa disaring yang gagal', { count: events.length })}
              onClick={open('activity')}
              opens="activity"
            />
          ) : null}
        </Group>
        <p className="px-1 text-xs text-muted">
          {t(
            'Riwayat masuk disimpan 90 hari. Tanpa alamat IP; tempat diperkirakan dari kota jaringan.',
          )}
        </p>
      </div>

      <PhotoLightbox
        returnFocus={opener}
        open={dialog === 'photo'}
        onOpenChange={setDialogOpen('photo')}
        photo={photo}
        photoAssetId={photoAssetId}
      />
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
  opens,
  danger = false,
}: {
  icon: ReactNode
  title: ReactNode
  detail?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  // halaman kedua yang dibuka baris ini (fokus kembali ke sini setelah tombol kembali)
  opens?: View
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
      data-opens={opens}
      className={cn(base, 'hover:bg-surface-2 focus-visible:-outline-offset-2')}
    >
      {body}
    </button>
  ) : (
    <div className={base}>{body}</div>
  )
}

function Switch({
  on,
  onChange,
  labelledBy,
  describedBy,
}: {
  on: boolean
  onChange: (next: boolean) => void
  labelledBy: string
  describedBy: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={() => onChange(!on)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2',
        on ? 'border-text bg-text' : 'border-border-strong bg-surface-2',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-1/2 left-0.5 size-5.5 -translate-y-1/2 rounded-full shadow transition-transform duration-200 ease-out-soft',
          on ? 'translate-x-5 bg-bg' : 'translate-x-0 bg-muted',
        )}
      />
    </button>
  )
}

function LoginNotifyRow({ initial, emailReady }: { initial: boolean; emailReady: boolean }) {
  const t = useAdminT()
  const [on, setOn] = useState(initial)
  const [, startTransition] = useTransition()
  const base = useId()
  const change = (next: boolean) => {
    setOn(next)
    startTransition(async () => {
      const result = await saveSiteOption({ key: 'loginNotify', value: next })
      if (result.ok) toast.success(t('Tersimpan'), { id: 'login-notify' })
      else {
        setOn(!next)
        toast.error(t(result.message), { id: 'login-notify' })
      }
    })
  }
  return (
    <Row
      icon={<Bell />}
      title={<span id={`${base}-t`}>{t('Email saat ada login baru')}</span>}
      detail={
        <span id={`${base}-d`}>
          {emailReady
            ? t('Dikirim ke email akun ini setiap ada yang berhasil masuk.')
            : t('Butuh Resend. Pilihan tetap disimpan.')}
        </span>
      }
      trailing={
        <Switch on={on} onChange={change} labelledBy={`${base}-t`} describedBy={`${base}-d`} />
      }
    />
  )
}

function DevicesGroup({ sessions }: { sessions: AccountSession[] }) {
  const t = useAdminT()
  const { lang } = useAdminLang()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
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
    <Group title={t('Perangkat tertaut · {count}', { count: sessions.length })}>
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
                  <span className="font-medium text-success">{t('Aktif sekarang')}</span>
                ) : (
                  t('Terakhir aktif {time}', { time: formatDateTime(new Date(s.lastActive), lang) })
                )}
              </span>
            </span>
            {s.current ? (
              <span className="shrink-0 rounded-md border border-border-strong px-1.5 text-xs leading-5 font-semibold">
                {t('Perangkat ini')}
              </span>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => run(() => revokeSession(s.id))}
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
                disabled={pending}
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
            title={t('Keluar dari semua perangkat lain')}
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

function ActivityList({
  events,
  filterable = false,
}: {
  events: AccountEvent[]
  filterable?: boolean
}) {
  const t = useAdminT()
  const { lang } = useAdminLang()
  const [onlyFailed, setOnlyFailed] = useState(false)
  const shown = onlyFailed ? events.filter((e) => e.kind === 'failed') : events
  const failedCount = events.filter((e) => e.kind === 'failed').length

  const list =
    shown.length === 0 ? (
      <p className="px-4 py-4 text-sm text-muted">
        {onlyFailed ? t('Tidak ada percobaan masuk yang gagal.') : t('Belum ada aktivitas.')}
      </p>
    ) : (
      <ol aria-label={t('Aktivitas')} className="divide-y divide-border">
        {shown.map((e) => {
          const device = deviceName(e.device, t)
          const detail = [
            e.unknownEmail ? t('email tidak terdaftar') : null,
            device,
            e.location,
          ].filter(Boolean)
          return (
            <li
              key={e.id}
              data-event={e.kind}
              className="flex min-h-16 items-center gap-3.5 px-4 py-2.5"
            >
              <span className="grid size-9 shrink-0 place-items-center" aria-hidden="true">
                <span
                  className={cn(
                    'size-2 rounded-full',
                    e.kind === 'success'
                      ? 'bg-success'
                      : e.kind === 'failed'
                        ? 'bg-danger'
                        : 'bg-muted',
                  )}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{t(EVENT_TITLE[e.kind])}</span>
                {detail.length > 0 ? (
                  <span className="block text-sm text-muted">{detail.join(' · ')}</span>
                ) : null}
              </span>
              <time dateTime={e.at} className="max-w-[40%] shrink-0 text-right text-xs text-muted">
                {formatDateTime(new Date(e.at), lang)}
              </time>
            </li>
          )
        })}
      </ol>
    )

  if (!filterable) return list
  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label={t('Saring aktivitas')} className="flex gap-1.5">
        {[
          { value: false, label: t('Semua') },
          { value: true, label: t('Gagal ({count})', { count: failedCount }) },
        ].map((chip) => (
          <button
            key={String(chip.value)}
            type="button"
            aria-pressed={onlyFailed === chip.value}
            onClick={() => setOnlyFailed(chip.value)}
            className={cn(
              'min-h-9 rounded-md border px-3 text-sm transition-colors',
              onlyFailed === chip.value
                ? 'border-text bg-text text-bg'
                : 'border-border-strong text-muted hover:text-text',
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">{list}</div>
      <p className="px-1 text-xs text-muted">
        {t(
          'Riwayat masuk disimpan 90 hari. Tanpa alamat IP; tempat diperkirakan dari kota jaringan.',
        )}
      </p>
    </div>
  )
}
