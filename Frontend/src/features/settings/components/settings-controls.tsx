'use client'

// Kontrol baris Admin → Pengaturan: kelompok, baris, label status, saklar, pilihan, volume suara,
// angka, dan mode perbaikan. Tiap kontrol menyimpan lewat `onSave`; volume dan angka menunggu
// sebentar setelah berhenti diubah.

import { Volume2 } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { ChoiceSelect } from '@/components/admin/choice-select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import {
  CONTACT_PER_HOUR_MAX,
  CONTACT_PER_HOUR_MIN,
  type SiteOptionKey,
  type SiteOptions,
} from '@backend/features/settings/options'

// jeda sebelum isian angka dan geseran volume disimpan, agar tidak menyimpan setiap langkah
const TYPING_DELAY_MS = 600

export type Save = <K extends SiteOptionKey>(key: K, value: SiteOptions[K]) => void

type Ids = { title: string; description: string }

export function Group({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h2 id={id} className="px-1 text-sm font-medium text-muted">
        {title}
      </h2>
      <Card className="divide-y divide-border p-0">{children}</Card>
    </section>
  )
}

export function Row({
  title,
  description,
  badge,
  control,
  children,
}: {
  title: string
  description: string
  badge?: ReactNode
  control: (ids: Ids) => ReactNode
  children?: ReactNode
}) {
  const base = useId()
  const ids = { title: `${base}-t`, description: `${base}-d` }
  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 basis-64">
          <p id={ids.title} className="flex flex-wrap items-center gap-2 font-medium">
            {title}
            {badge}
          </p>
          <p id={ids.description} className="mt-0.5 text-sm text-muted">
            {description}
          </p>
        </div>
        {control(ids)}
      </div>
      {children}
    </div>
  )
}

export function Pill({ tone, children }: { tone: 'warn' | 'danger'; children: ReactNode }) {
  return (
    <span
      className={cn(
        'rounded-md px-1.5 py-0.5 text-xs font-medium',
        tone === 'warn' ? 'border border-border-strong text-muted' : 'bg-danger/15 text-danger',
      )}
    >
      {children}
    </span>
  )
}

// Saklar bulat: tombol role="switch", namanya judul baris dan keterangannya deskripsi baris.
export function Switch({
  ids,
  on,
  onChange,
  danger = false,
}: {
  ids: Ids
  on: boolean
  onChange: (next: boolean) => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={ids.title}
      aria-describedby={ids.description}
      onClick={() => onChange(!on)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2',
        on
          ? danger
            ? 'border-danger bg-danger'
            : 'border-text bg-text'
          : 'border-border-strong bg-surface-2',
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

export function Choice<V extends string>({
  ids,
  value,
  options,
  onChange,
  disabled,
}: {
  ids: Ids
  value: V
  options: [V, string][]
  onChange: (next: V) => void
  disabled?: boolean
}) {
  // daftar pilihan bergaya aplikasi, bukan dropdown bawaan browser (revisi pemilik 2026-11-16)
  return (
    <ChoiceSelect
      labelledBy={ids.title}
      describedBy={ids.description}
      value={value}
      options={options}
      disabled={disabled}
      onChange={onChange}
    />
  )
}

// Simpan tertunda: dijalankan setelah pengguna berhenti menggeser/mengetik sejenak.
function useDelayedSave() {
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const later = (run: () => void) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(run, TYPING_DELAY_MS)
  }
  // membatalkan simpan yang masih menunggu (audit 2026-11-17, BUG-02)
  later.cancel = () => window.clearTimeout(timer.current)
  return later
}

export function VolumeControl({
  ids,
  value,
  onCommit,
  onPreview,
}: {
  ids: Ids
  value: number
  onCommit: (next: number) => void
  onPreview: (level: number) => void
}) {
  const t = useAdminT()
  const [draft, setDraft] = useState(value)
  const [seen, setSeen] = useState(value)
  // nilai dikembalikan dari server (simpan gagal): ikuti
  if (seen !== value) {
    setSeen(value)
    setDraft(value)
  }
  const later = useDelayedSave()
  return (
    <div className="flex w-full items-center gap-3 sm:w-auto">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={draft}
        aria-labelledby={ids.title}
        aria-describedby={ids.description}
        onChange={(e) => {
          const next = Number(e.target.value)
          setDraft(next)
          later(() => onCommit(next))
        }}
        className="h-11 min-w-0 flex-1 cursor-pointer accent-text sm:w-44 sm:flex-none"
      />
      <output aria-live="polite" className="w-11 text-right text-sm tabular-nums">
        {draft}%
      </output>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label={t('Coba Suara')}
        title={t('Coba Suara')}
        onClick={() => onPreview(draft)}
      >
        <Volume2 aria-hidden="true" />
      </Button>
    </div>
  )
}

export function NumberControl({ ids, value, onSave }: { ids: Ids; value: number; onSave: Save }) {
  const t = useAdminT()
  const [draft, setDraft] = useState(String(value))
  const [seen, setSeen] = useState(value)
  if (seen !== value) {
    setSeen(value)
    setDraft(String(value))
  }
  const later = useDelayedSave()
  const parsed = Number(draft)
  const valid =
    draft.trim() !== '' &&
    Number.isInteger(parsed) &&
    parsed >= CONTACT_PER_HOUR_MIN &&
    parsed <= CONTACT_PER_HOUR_MAX
  const errorId = `${ids.title}-error`
  return (
    <div className="flex flex-col items-end gap-1">
      {/* angka hanya diketik: tanpa panah naik-turun dan tanpa ubah lewat gulir (revisi pemilik
          2026-11-17); selain angka diabaikan */}
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        autoComplete="off"
        value={draft}
        aria-labelledby={ids.title}
        aria-describedby={valid ? ids.description : `${ids.description} ${errorId}`}
        aria-invalid={valid ? undefined : true}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, '')
          setDraft(next)
          // ketikan baru membatalkan simpan yang menunggu, termasuk saat isian kembali ke nilai
          // tersimpan atau dikosongkan; tanpa ini angka yang sudah dibatalkan tetap tersimpan
          later.cancel()
          const n = Number(next)
          if (
            next.trim() !== '' &&
            Number.isInteger(n) &&
            n >= CONTACT_PER_HOUR_MIN &&
            n <= CONTACT_PER_HOUR_MAX &&
            n !== value
          )
            later(() => onSave('contactPerHour', n))
        }}
        className="w-24 text-right tabular-nums"
      />
      {valid ? null : (
        <p id={errorId} className="text-sm text-danger">
          {t('Isi angka {min} sampai {max}', {
            min: CONTACT_PER_HOUR_MIN,
            max: CONTACT_PER_HOUR_MAX,
          })}
        </p>
      )}
    </div>
  )
}

// Mode perawatan menutup seluruh situs publik, jadi menyalakannya minta konfirmasi di baris itu.
export function MaintenanceRow({ on, onSave }: { on: boolean; onSave: Save }) {
  const t = useAdminT()
  const [asking, setAsking] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (asking) confirmRef.current?.focus()
  }, [asking])
  return (
    <Row
      title={t('Mode Perawatan')}
      badge={on ? <Pill tone="danger">{t('Menyala')}</Pill> : null}
      description={t(
        'Pengunjung hanya melihat halaman Sedang diperbarui dan situs tidak diindeks. Panel admin tetap bisa dipakai.',
      )}
      control={(ids) => (
        <Switch
          ids={ids}
          on={on || asking}
          danger
          onChange={(next) => {
            if (next) setAsking(true)
            else {
              setAsking(false)
              onSave('maintenanceMode', false)
            }
          }}
        />
      )}
    >
      {asking ? (
        <div
          role="alertdialog"
          aria-label={t('Nyalakan mode perawatan?')}
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-danger/40 bg-danger/10 px-4 py-3"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setAsking(false)
          }}
        >
          <p className="text-sm">
            {t('Nyalakan mode perawatan? Seluruh situs publik langsung tertutup untuk pengunjung.')}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setAsking(false)}>
              {t('Batal')}
            </Button>
            <Button
              ref={confirmRef}
              type="button"
              className="bg-danger text-white hover:bg-danger/90 dark:text-bg"
              onClick={() => {
                setAsking(false)
                onSave('maintenanceMode', true)
              }}
            >
              {t('Nyalakan')}
            </Button>
          </div>
        </div>
      ) : null}
    </Row>
  )
}
