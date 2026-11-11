'use client'

import { Volume2 } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import { NativeSelect } from '@/components/admin/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { previewSound } from '@/lib/ui-sounds'
import { cn } from '@/lib/utils'

import { saveSiteOption } from '../actions'
import {
  CONTACT_PER_HOUR_MAX,
  CONTACT_PER_HOUR_MIN,
  type SiteOptionInput,
  type SiteOptionKey,
  type SiteOptions,
} from '../options'

// jeda sebelum isian angka dan geseran volume disimpan, agar tidak menyimpan setiap langkah
const TYPING_DELAY_MS = 600

type Save = <K extends SiteOptionKey>(key: K, value: SiteOptions[K]) => void

// Admin → Pengaturan, desain 1 "Daftar berkelompok" (pilihan pemilik 2026-11-11, DESIGN.md bagian 119):
// kelompok Tampilan, Konten, Pesan, Privasi, Lanjutan; tiap baris satu pengaturan dengan kontrol di
// kanan. Setiap perubahan langsung disimpan (tanpa tombol Simpan) lalu muncul notifikasi "Tersimpan".
// Gagal disimpan: kontrol kembali ke nilai terakhir yang tersimpan.
export function SiteSettingsList({
  initial,
  emailReady,
  hasWhatsapp,
}: {
  initial: SiteOptions
  // Resend sudah diatur (email pesan baru benar-benar terkirim)
  emailReady: boolean
  // nomor WhatsApp sudah diisi di Footer (tombol melayang butuh nomor)
  hasWhatsapp: boolean
}) {
  const t = useAdminT()
  const [values, setValues] = useState(initial)
  // nilai terakhir yang pasti tersimpan di server, untuk dikembalikan bila simpan gagal
  const saved = useRef(initial)
  const [, startTransition] = useTransition()

  const save: Save = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }))
    startTransition(async () => {
      const result = await saveSiteOption({ key, value } as SiteOptionInput)
      if (result.ok) {
        saved.current = { ...saved.current, [key]: value }
        // satu notifikasi yang diperbarui, bukan tumpukan saat beberapa baris diubah cepat
        toast.success(t('Tersimpan'), { id: 'site-option' })
      } else {
        setValues((v) => ({ ...v, [key]: saved.current[key] }))
        toast.error(t(result.message), { id: 'site-option' })
      }
    })
  }

  const needs = (text: string) => <Pill tone="warn">{text}</Pill>

  return (
    <div className="flex flex-col gap-8">
      <Group title={t('Tampilan')}>
        <Row
          title={t('Suara tombol')}
          description={t(
            'Satu volume untuk tombol tema, bahasa, dan menu di situs. 0 berarti tanpa suara.',
          )}
          control={(ids) => <VolumeControl ids={ids} value={values.soundVolume} onSave={save} />}
        />
        <Row
          title={t('Tema awal pengunjung')}
          description={t('Dipakai sampai pengunjung memilih tema sendiri lewat tombol bulan.')}
          control={(ids) => (
            <Choice
              ids={ids}
              value={values.defaultTheme}
              options={[
                ['dark', t('Gelap')],
                ['light', t('Terang')],
                ['system', t('Ikuti perangkat')],
              ]}
              onChange={(v) => save('defaultTheme', v)}
            />
          )}
        />
        <Row
          title={t('Animasi hero')}
          description={t(
            'Efek cairan dan kursor di foto beranda. Bila mati, foto dan nama tetap tampil tanpa efek.',
          )}
          control={(ids) => (
            <Switch
              ids={ids}
              on={values.heroAnimation}
              onChange={(v) => save('heroAnimation', v)}
            />
          )}
        />
      </Group>

      <Group title={t('Konten')}>
        <Row
          title={t('Bahasa saat pertama dibuka')}
          description={t(
            'Untuk alamat tanpa /id atau /en, mis. mmirza.site. Pengunjung yang pernah memilih bahasa tetap memakai pilihannya.',
          )}
          control={(ids) => (
            <Choice
              ids={ids}
              value={values.defaultLocale}
              options={[
                ['browser', t('Ikuti browser')],
                ['id', 'Indonesia'],
                ['en', 'English'],
              ]}
              onChange={(v) => save('defaultLocale', v)}
            />
          )}
        />
        <Row
          title={t('Kartu pembuka')}
          description={t(
            'Kartu Informasi Penting saat situs dibuka. Isinya diubah di Halaman situs, Bagian Awal.',
          )}
          control={(ids) => (
            <Switch ids={ids} on={values.introEnabled} onChange={(v) => save('introEnabled', v)} />
          )}
        />
        <Row
          title={t('Kartu pembuka muncul')}
          description={t('Seberapa sering pengunjung yang sama melihat kartu pembuka.')}
          control={(ids) => (
            <Choice
              ids={ids}
              value={values.introFrequency}
              disabled={!values.introEnabled}
              options={[
                ['once', t('Sekali saja')],
                ['visit', t('Setiap kunjungan baru')],
                ['weekly', t('Seminggu sekali')],
              ]}
              onChange={(v) => save('introFrequency', v)}
            />
          )}
        />
        <Row
          title={t('Tombol WhatsApp melayang')}
          badge={hasWhatsapp ? null : needs(t('Nomor belum diisi'))}
          description={t(
            'Tombol bulat di pojok kanan bawah situs, membuka chat ke nomor WhatsApp di menu Footer.',
          )}
          control={(ids) => (
            <Switch
              ids={ids}
              on={values.whatsappButton}
              onChange={(v) => save('whatsappButton', v)}
            />
          )}
        />
      </Group>

      <Group title={t('Pesan')}>
        <Row
          title={t('Terima pesan dari form kontak')}
          description={t(
            'Bila mati, form di halaman Kontak diganti tulisan bahwa form sedang ditutup.',
          )}
          control={(ids) => (
            <Switch ids={ids} on={values.contactOpen} onChange={(v) => save('contactOpen', v)} />
          )}
        />
        <Row
          title={t('Batas pesan per jam')}
          description={t('Dari satu jaringan, {min} sampai {max} pesan.', {
            min: CONTACT_PER_HOUR_MIN,
            max: CONTACT_PER_HOUR_MAX,
          })}
          control={(ids) => <NumberControl ids={ids} value={values.contactPerHour} onSave={save} />}
        />
        <Row
          title={t('Email saat ada pesan baru')}
          badge={emailReady ? null : needs(t('Butuh Resend'))}
          description={t(
            'Dikirim ke email kontak pemilik. Pesan tetap tersimpan di Kotak masuk walau email mati.',
          )}
          control={(ids) => (
            <Switch
              ids={ids}
              on={values.emailOnMessage}
              onChange={(v) => save('emailOnMessage', v)}
            />
          )}
        />
      </Group>

      <Group title={t('Privasi')}>
        <Row
          title={t('Hitung kunjungan')}
          description={t('Untuk grafik di Dashboard. Tanpa cookie dan tanpa IP mentah.')}
          control={(ids) => (
            <Switch ids={ids} on={values.trackVisits} onChange={(v) => save('trackVisits', v)} />
          )}
        />
        <Row
          title={t('Simpan data kunjungan')}
          description={t(
            'Data mentah yang lebih lama dihapus otomatis setiap hari; ringkasan harian tetap ada. Halaman Privasi ikut menyebut masa simpan ini.',
          )}
          control={(ids) => (
            <Choice
              ids={ids}
              value={String(values.visitRetentionDays)}
              options={[
                ['30', t('30 hari')],
                ['90', t('90 hari')],
                ['365', t('1 tahun')],
              ]}
              onChange={(v) => save('visitRetentionDays', Number(v) as 30 | 90 | 365)}
            />
          )}
        />
        <Row
          title={t('Izinkan mesin pencari')}
          description={t('Bila mati, robots.txt dan setiap halaman melarang pengindeksan.')}
          control={(ids) => (
            <Switch
              ids={ids}
              on={values.allowIndexing}
              onChange={(v) => save('allowIndexing', v)}
            />
          )}
        />
      </Group>

      <Group title={t('Lanjutan')}>
        <MaintenanceRow on={values.maintenanceMode} onSave={save} />
      </Group>
    </div>
  )
}

type Ids = { title: string; description: string }

function Group({ title, children }: { title: string; children: ReactNode }) {
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

function Row({
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

function Pill({ tone, children }: { tone: 'warn' | 'danger'; children: ReactNode }) {
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
function Switch({
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

function Choice<V extends string>({
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
  return (
    <NativeSelect
      aria-labelledby={ids.title}
      aria-describedby={ids.description}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as V)}
      className="w-auto min-w-44 disabled:opacity-50"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </NativeSelect>
  )
}

// Simpan tertunda: dijalankan setelah pengguna berhenti menggeser/mengetik sejenak.
function useDelayedSave() {
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return (run: () => void) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(run, TYPING_DELAY_MS)
  }
}

function VolumeControl({ ids, value, onSave }: { ids: Ids; value: number; onSave: Save }) {
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
          later(() => onSave('soundVolume', next))
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
        aria-label={t('Coba suara')}
        title={t('Coba suara')}
        onClick={() => previewSound(draft)}
      >
        <Volume2 aria-hidden="true" />
      </Button>
    </div>
  )
}

function NumberControl({ ids, value, onSave }: { ids: Ids; value: number; onSave: Save }) {
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
      <Input
        type="number"
        inputMode="numeric"
        min={CONTACT_PER_HOUR_MIN}
        max={CONTACT_PER_HOUR_MAX}
        value={draft}
        aria-labelledby={ids.title}
        aria-describedby={valid ? ids.description : `${ids.description} ${errorId}`}
        aria-invalid={valid ? undefined : true}
        onChange={(e) => {
          const next = e.target.value
          setDraft(next)
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
function MaintenanceRow({ on, onSave }: { on: boolean; onSave: Save }) {
  const t = useAdminT()
  const [asking, setAsking] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (asking) confirmRef.current?.focus()
  }, [asking])
  return (
    <Row
      title={t('Mode perawatan')}
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
