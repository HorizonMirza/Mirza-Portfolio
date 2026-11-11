'use client'

import { KeyRound, LogOut, MonitorSmartphone, Smartphone, Monitor } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminLang, useAdminT } from '@/components/admin/admin-lang'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { DeviceParts } from '@/lib/device'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { saveSiteOption } from '@/features/settings/actions'

import { maskEmail } from '../mask-email'
import type { AccountEvent, AccountSession } from '../queries'
import { revokeOtherSessions, revokeSession } from '../session-actions'
import { ChangePasswordForm } from './change-password-form'

type Panel = 'password' | 'devices' | null

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || 'A'
  )
}

// Admin → Akun, desain 6 "Linimasa aktivitas akun" (pilihan pemilik 2026-11-11, DESIGN.md bagian 120).
// Kiri: identitas, tombol Ganti password dan Perangkat yang membuka panelnya, saklar email login baru.
// Kanan: semua kejadian akun (masuk, gagal masuk, password diganti, perangkat dikeluarkan) dalam satu
// garis waktu, bisa disaring Semua / Gagal.
export function AccountPanel({
  name,
  email,
  adminSince,
  sessions,
  events,
  loginNotify,
  emailReady,
}: {
  name: string
  email: string
  adminSince: string | null
  sessions: AccountSession[]
  events: AccountEvent[]
  loginNotify: boolean
  emailReady: boolean
}) {
  const t = useAdminT()
  const { lang } = useAdminLang()
  const [panel, setPanel] = useState<Panel>(null)
  const [showEmail, setShowEmail] = useState(false)
  const ids = useId()
  const toggle = (p: Exclude<Panel, null>) => setPanel((cur) => (cur === p ? null : p))
  const since = adminSince
    ? new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'medium',
      }).format(new Date(adminSince))
    : null

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <Card className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-text text-lg font-semibold text-bg"
          >
            {initials(name)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{name}</h2>
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
              <span className="break-all">{showEmail ? email : maskEmail(email)}</span>
              <button
                type="button"
                onClick={() => setShowEmail((v) => !v)}
                className="rounded-sm text-text underline underline-offset-4"
              >
                {showEmail ? t('Sembunyikan') : t('Tampilkan')}
              </button>
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="rounded-md border border-border-strong px-1.5 py-0.5 font-medium text-text">
                Super Admin
              </span>
              {since ? <span>{t('Admin sejak {date}', { date: since })}</span> : null}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            aria-expanded={panel === 'password'}
            aria-controls={`${ids}-password`}
            onClick={() => toggle('password')}
          >
            <KeyRound aria-hidden="true" />
            {t('Ganti password')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            aria-expanded={panel === 'devices'}
            aria-controls={`${ids}-devices`}
            onClick={() => toggle('devices')}
          >
            <MonitorSmartphone aria-hidden="true" />
            {t('Perangkat')}
            <span className="rounded-md bg-surface-2 px-1.5 text-xs tabular-nums">
              {sessions.length}
            </span>
          </Button>
        </div>

        <div id={`${ids}-password`} hidden={panel !== 'password'}>
          {panel === 'password' ? <ChangePasswordForm /> : null}
        </div>
        <div id={`${ids}-devices`} hidden={panel !== 'devices'}>
          <DeviceList sessions={sessions} />
        </div>

        <LoginNotifySwitch initial={loginNotify} emailReady={emailReady} />
      </Card>

      <Activity events={events} />
    </div>
  )
}

function deviceName(device: DeviceParts | null, t: ReturnType<typeof useAdminT>) {
  if (!device) return null
  return t('{browser} di {os}', {
    browser: device.browser ?? t('Browser tidak dikenal'),
    os: device.os ?? t('sistem tidak dikenal'),
  })
}

function DeviceList({ sessions }: { sessions: AccountSession[] }) {
  const t = useAdminT()
  const { lang } = useAdminLang()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const others = sessions.filter((s) => !s.current).length

  const run = (action: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const result = await action()
      if (result.ok) toast.success(t(result.message))
      else toast.error(t(result.message))
      router.refresh()
    })

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
        {sessions.map((s) => {
          const Icon = s.device.mobile ? Smartphone : Monitor
          return (
            <li key={s.id} className="flex items-center gap-3 px-3 py-3" data-session>
              <Icon className="size-5 shrink-0 text-muted" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {deviceName(s.device, t)}
                  {s.current ? (
                    <span className="rounded-md border border-success/60 px-1.5 py-0.5 text-xs text-text">
                      {t('Perangkat ini')}
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted">
                  {[
                    s.location,
                    t('aktif {time}', { time: formatDateTime(new Date(s.lastActive), lang) }),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              {s.current ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => revokeSession(s.id))}
                  aria-label={t('Keluarkan {device}', { device: deviceName(s.device, t) ?? '' })}
                >
                  {t('Keluarkan')}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      {others > 0 ? (
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          className="self-start"
          onClick={() => run(revokeOtherSessions)}
        >
          <LogOut aria-hidden="true" />
          {t('Keluarkan semua perangkat lain')}
        </Button>
      ) : (
        <p className="text-sm text-muted">{t('Hanya perangkat ini yang sedang masuk.')}</p>
      )}
    </div>
  )
}

function LoginNotifySwitch({ initial, emailReady }: { initial: boolean; emailReady: boolean }) {
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
    <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
      <div>
        <p id={`${base}-t`} className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {t('Email saat ada login baru')}
          {emailReady ? null : (
            <span className="rounded-md border border-border-strong px-1.5 py-0.5 text-xs text-muted">
              {t('Butuh Resend')}
            </span>
          )}
        </p>
        <p id={`${base}-d`} className="text-sm text-muted">
          {t('Dikirim ke email akun ini setiap ada yang berhasil masuk.')}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={`${base}-t`}
        aria-describedby={`${base}-d`}
        onClick={() => change(!on)}
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
    </div>
  )
}

const EVENT_TITLE: Record<AccountEvent['kind'], string> = {
  success: 'Masuk',
  failed: 'Gagal masuk',
  password: 'Password diganti',
  signout: 'Perangkat dikeluarkan',
}

function Activity({ events }: { events: AccountEvent[] }) {
  const t = useAdminT()
  const { lang } = useAdminLang()
  const [onlyFailed, setOnlyFailed] = useState(false)
  const headingId = useId()
  const shown = onlyFailed ? events.filter((e) => e.kind === 'failed') : events
  const failedCount = events.filter((e) => e.kind === 'failed').length

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-lg font-semibold">
          {t('Aktivitas')}
        </h2>
        <div role="group" aria-label={t('Saring aktivitas')} className="flex gap-1">
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
      </div>

      {shown.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted">
          {onlyFailed ? t('Tidak ada percobaan masuk yang gagal.') : t('Belum ada aktivitas.')}
        </p>
      ) : (
        <ol
          aria-labelledby={headingId}
          className="flex flex-col gap-4 border-l border-border-strong pl-5"
        >
          {shown.map((e) => (
            <li key={e.id} className="relative" data-event={e.kind}>
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-1.5 -left-[1.6875rem] size-2.5 rounded-full ring-4 ring-surface',
                  e.kind === 'success'
                    ? 'bg-success'
                    : e.kind === 'failed'
                      ? 'bg-danger'
                      : 'bg-muted',
                )}
              />
              <p className="text-sm">
                <span className="font-medium">{t(EVENT_TITLE[e.kind])}</span>
                {e.unknownEmail ? (
                  <span className="text-muted"> · {t('email tidak terdaftar')}</span>
                ) : null}
                {e.device ? <span className="text-muted"> · {deviceName(e.device, t)}</span> : null}
              </p>
              <p className="text-xs text-muted">
                <time dateTime={e.at}>{formatDateTime(new Date(e.at), lang)}</time>
                {e.location ? ` · ${e.location}` : null}
              </p>
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs text-muted">
        {t(
          'Riwayat masuk disimpan 90 hari. Tanpa alamat IP; tempat diperkirakan dari kota jaringan.',
        )}
      </p>
    </Card>
  )
}
