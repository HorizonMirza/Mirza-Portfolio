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
import { Input } from '@/components/ui/input'
import type { DeviceParts } from '@/lib/device'
import { formatDateTime } from '@/lib/format'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'
import { cn } from '@/lib/utils'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { removeAsset } from '@/features/assets/actions'
import { AssetUploader } from '@/features/assets/components/asset-uploader'
import { saveSiteOption } from '@/features/settings/actions'

import { renameAccount } from '../actions'
import { maskEmail } from '../mask-email'
import type { AccountEvent, AccountSession } from '../queries'
import { revokeOtherSessions, revokeSession } from '../session-actions'
import { ChangePasswordForm } from './change-password-form'

type View = 'main' | 'password' | 'name' | 'photo' | 'activity'
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
// foto besar di tengah dengan tombol kamera, nama dan peran, lalu daftar berkelompok Info, Keamanan,
// Perangkat tertaut, dan Aktivitas terbaru. Semua langsung terlihat; foto, nama, password, dan riwayat
// lengkap dibuka sebagai halaman sendiri dengan tombol kembali, seperti di aplikasi.
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
  const [showEmail, setShowEmail] = useState(false)
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

  const done = () => {
    router.refresh()
    back()
  }

  if (view !== 'main') {
    const titles: Record<Exclude<View, 'main'>, string> = {
      password: t('Ganti password'),
      name: t('Nama akun'),
      photo: t('Foto profil'),
      activity: t('Aktivitas'),
    }
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
        {view === 'password' ? (
          <>
            <p className="text-sm text-muted">
              {t('Perangkat lain otomatis keluar setelah password diganti.')}
            </p>
            <ChangePasswordForm onDone={done} />
          </>
        ) : null}
        {view === 'name' ? <NameForm current={name} onDone={done} /> : null}
        {view === 'photo' ? (
          <PhotoView
            photo={photo}
            photoAssetId={photoAssetId}
            uploadReady={uploadReady}
            onDone={done}
          />
        ) : null}
        {view === 'activity' ? <ActivityList events={events} filterable /> : null}
      </div>
    )
  }

  return (
    <div ref={top} className="mx-auto flex w-full max-w-xl scroll-mt-6 flex-col gap-7">
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <div className="relative">
          <Image
            placeholder={SHIMMER_PLACEHOLDER}
            src={photo}
            alt=""
            width={128}
            height={128}
            sizes="128px"
            className="size-32 rounded-full bg-text object-cover"
          />
          <button
            type="button"
            onClick={open('photo')}
            data-opens="photo"
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
          onClick={open('name')}
          opens="name"
          trailing={<Pencil className="size-4 shrink-0 text-muted" aria-hidden="true" />}
        />
        <Row
          icon={<Mail />}
          title="Email"
          detail={
            <span className="flex flex-wrap items-center gap-x-2">
              <span className="break-all">{showEmail ? email : maskEmail(email)}</span>
              <button
                type="button"
                onClick={() => setShowEmail((v) => !v)}
                className="rounded-sm text-xs text-text underline underline-offset-4"
              >
                {showEmail ? t('Sembunyikan') : t('Tampilkan')}
              </button>
            </span>
          }
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
          onClick={open('password')}
          opens="password"
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

function NameForm({ current, onDone }: { current: string; onDone: () => void }) {
  const t = useAdminT()
  const [value, setValue] = useState(current)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const id = useId()
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const result = await renameAccount({ name: value })
          if (result.ok) {
            // satu notifikasi yang diperbarui bila nama disimpan beberapa kali berturut-turut
            toast.success(t(result.message), { id: 'account-name' })
            onDone()
          } else {
            setError(result.fieldErrors?.name ?? result.message)
            toast.error(t(result.message), { id: 'account-name' })
          }
        })
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {t('Nama')}
        </label>
        <Input
          id={id}
          value={value}
          maxLength={80}
          autoComplete="name"
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
          onChange={(e) => {
            setValue(e.target.value)
            setError(null)
          }}
        />
        <p id={`${id}-hint`} className="text-sm text-muted">
          {t(
            'Tampil di menu profil, sidebar, dan log audit. Nama di situs publik diubah di menu Tentang, Profil.',
          )}
        </p>
        {error ? (
          <p id={`${id}-error`} className="text-sm text-danger">
            {t(error)}
          </p>
        ) : null}
      </div>
      <div>
        <Button type="submit" disabled={pending || value.trim() === ''}>
          {pending ? t('Menyimpan…') : t('Simpan')}
        </Button>
      </div>
    </form>
  )
}

function PhotoView({
  photo,
  photoAssetId,
  uploadReady,
  onDone,
}: {
  photo: string | StaticImageData
  photoAssetId: string | null
  uploadReady: boolean
  onDone: () => void
}) {
  const t = useAdminT()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center">
        <Image
          placeholder={SHIMMER_PLACEHOLDER}
          src={photo}
          alt=""
          width={160}
          height={160}
          sizes="160px"
          className="size-40 rounded-full bg-text object-cover"
        />
      </div>
      <p className="text-sm text-muted">
        {t(
          'Foto bulat yang sama dengan kiri atas situs, footer, kartu halaman Tentang, kartu ID Kontak, sidebar, dan menu profil. Rasio persegi atau potret.',
        )}
      </p>
      {/* foto unggahan bisa dihapus untuk kembali ke foto bawaan (permintaan pemilik 2026-11-12,
          setelah foto salah terunggah) */}
      {photoAssetId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4">
          <p className="text-sm text-muted">
            {t('Hapus foto unggahan untuk kembali ke foto bawaan.')}
          </p>
          <ConfirmDelete
            itemLabel={t('foto unggahan')}
            onConfirm={removeAsset.bind(null, photoAssetId)}
            onDone={onDone}
          />
        </div>
      ) : null}
      {uploadReady ? (
        <AssetUploader target="profile-photo" onDone={onDone} />
      ) : (
        <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted">
          {t('Unggah belum aktif. Isi')} <code className="font-mono">CLOUDINARY_CLOUD_NAME</code>,{' '}
          <code className="font-mono">CLOUDINARY_API_KEY</code>, {t('dan')}{' '}
          <code className="font-mono">CLOUDINARY_API_SECRET</code>{' '}
          {t('di environment, lalu deploy ulang.')}
        </p>
      )}
    </div>
  )
}
