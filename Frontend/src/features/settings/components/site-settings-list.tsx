'use client'

import { Volume2 } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import { ChoiceSelect } from '@/components/admin/choice-select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { previewSound } from '@/lib/ui-sounds'
import { cn } from '@/lib/utils'

import { saveSiteOption } from '@backend/features/settings/actions'
import {
  CONTACT_PER_HOUR_MAX,
  CONTACT_PER_HOUR_MIN,
  type SiteOptionInput,
  type SiteOptionKey,
  type SiteOptions,
  type SoundKind,
} from '@backend/features/settings/options'

// jeda sebelum isian angka dan geseran volume disimpan, agar tidak menyimpan setiap langkah
const TYPING_DELAY_MS = 600

type Save = <K extends SiteOptionKey>(key: K, value: SiteOptions[K]) => void

// Admin → Pengaturan, desain 1 "Daftar berkelompok" (pilihan pemilik 2026-11-11):
// kelompok Suara, Tampilan, Pesan, Privasi, Lanjutan (revisi pemilik 2026-11-16: semua suara satu
// kelompok, Tampilan dan Konten digabung); tiap baris satu pengaturan dengan kontrol di kanan. Setiap perubahan langsung disimpan (tanpa tombol Simpan) lalu muncul notifikasi "Tersimpan".
// Gagal disimpan: kontrol kembali ke nilai terakhir yang tersimpan.
export function SiteSettingsList({
  initial,
  hasWhatsapp,
}: {
  initial: SiteOptions
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
    // loading biasa: notifikasi berputar "Menyimpan…" lalu diganti "Tersimpan" di tempat yang sama
    toast.loading(t('Menyimpan…'), { id: 'site-option' })
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

  // campuran suara terbaru (termasuk yang belum selesai disimpan), agar dua geseran berbeda yang
  // diubah beruntun tidak saling menimpa
  const latestMix = useRef(values.soundMix)
  useEffect(() => {
    latestMix.current = values.soundMix
  }, [values.soundMix])

  // setiap suara situs: judul dan tempat suara itu terdengar
  const soundRows: [SoundKind, string, string][] = [
    ['nav', t('Menu'), t('Tik kaca saat menu situs dan foto profil di navbar ditekan.')],
    ['theme', t('Tombol Tema'), t('Desir angin saat tema terang atau gelap diganti.')],
    [
      'language',
      t('Tombol Bahasa'),
      t('Rentetan bip saat bahasa ID/EN diganti, di situs, kartu pembuka, dan panel admin.'),
    ],
    [
      'experienceToggle',
      t('Pengalaman di Beranda'),
      t('Blip saat daftar pengalaman di beranda dibuka atau ditutup.'),
    ],
    [
      'timeline',
      t('Timeline Pengalaman'),
      t('Bip pendek setiap entri yang menyala berganti saat halaman Pengalaman digulir.'),
    ],
    [
      'spotlight',
      t('Daftar Project'),
      t('Blup kecil setiap project yang menyala berganti saat halaman Project digulir.'),
    ],
    [
      'slide',
      t('Galeri Project'),
      t('Desir lembut saat gambar di halaman detail project berganti.'),
    ],
    [
      'shimmer',
      t('Kartu Foto Tentang'),
      t('Kilau nada saat kursor bergeser di kartu foto halaman Tentang.'),
    ],
    [
      'lanyard',
      t('Kartu ID Kontak'),
      t('Bunyi pegas saat kartu ID di halaman Kontak ditarik dan dilepas.'),
    ],
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Semua suara situs satu per satu (revisi pemilik 2026-11-16): tiap suara punya geseran volume
          dan tombol coba sendiri, tanpa volume utama */}
      <Group title={t('Suara')}>
        {soundRows.map(([kind, title, description]) => (
          <Row
            key={kind}
            title={title}
            description={description}
            control={(ids) => (
              <VolumeControl
                ids={ids}
                value={values.soundMix[kind]}
                onCommit={(next) => save('soundMix', { ...latestMix.current, [kind]: next })}
                onPreview={(level) => previewSound(kind, level)}
              />
            )}
          />
        ))}
      </Group>

      <Group title={t('Tampilan')}>
        <Row
          title={t('Tema Awal Pengunjung')}
          description={t('Dipakai sampai pengunjung memilih tema sendiri lewat tombol bulan.')}
          control={(ids) => (
            <Choice
              ids={ids}
              value={values.defaultTheme}
              options={[
                ['dark', t('Gelap')],
                ['light', t('Terang')],
                ['system', t('Ikuti Perangkat')],
              ]}
              onChange={(v) => save('defaultTheme', v)}
            />
          )}
        />
        <Row
          title={t('Bahasa Saat Pertama Dibuka')}
          description={t(
            'Untuk alamat tanpa /id atau /en, mis. mmirza.site. Pengunjung yang pernah memilih bahasa tetap memakai pilihannya.',
          )}
          control={(ids) => (
            <Choice
              ids={ids}
              value={values.defaultLocale}
              options={[
                ['browser', t('Ikuti Browser')],
                ['id', 'Indonesia'],
                ['en', 'English'],
              ]}
              onChange={(v) => save('defaultLocale', v)}
            />
          )}
        />
        <Row
          title={t('Kartu Pembuka Muncul')}
          description={t('Seberapa sering pengunjung yang sama melihat kartu pembuka.')}
          control={(ids) => (
            <Choice
              ids={ids}
              value={values.introFrequency}
              disabled={!values.introEnabled}
              options={[
                ['once', t('Sekali Saja')],
                ['visit', t('Setiap Kunjungan Baru')],
                ['weekly', t('Seminggu Sekali')],
              ]}
              onChange={(v) => save('introFrequency', v)}
            />
          )}
        />
        <Row
          title={t('Kartu Pembuka')}
          description={t(
            'Kartu Informasi Penting saat situs dibuka. Isinya diubah di Home, tab Kartu pembuka.',
          )}
          control={(ids) => (
            <Switch ids={ids} on={values.introEnabled} onChange={(v) => save('introEnabled', v)} />
          )}
        />
        <Row
          title={t('Animasi Hero')}
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
        <Row
          title={t('Tombol WhatsApp Melayang')}
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
          title={t('Terima Pesan dari Form Kontak')}
          description={t(
            'Bila mati, form di halaman Kontak diganti tulisan bahwa form sedang ditutup.',
          )}
          control={(ids) => (
            <Switch ids={ids} on={values.contactOpen} onChange={(v) => save('contactOpen', v)} />
          )}
        />
        <Row
          title={t('Batas Pesan per Jam')}
          description={t('Dari satu jaringan, {min} sampai {max} pesan.', {
            min: CONTACT_PER_HOUR_MIN,
            max: CONTACT_PER_HOUR_MAX,
          })}
          control={(ids) => <NumberControl ids={ids} value={values.contactPerHour} onSave={save} />}
        />
      </Group>

      <Group title={t('Privasi')}>
        <Row
          title={t('Hitung Kunjungan')}
          description={t('Untuk grafik di Dashboard. Tanpa cookie dan tanpa IP mentah.')}
          control={(ids) => (
            <Switch ids={ids} on={values.trackVisits} onChange={(v) => save('trackVisits', v)} />
          )}
        />
        <Row
          title={t('Simpan Data Kunjungan')}
          description={t(
            'Data mentah yang lebih lama dihapus otomatis setiap hari; ringkasan harian tetap ada. Halaman Privasi ikut menyebut masa simpan ini.',
          )}
          control={(ids) => (
            <Choice
              ids={ids}
              value={String(values.visitRetentionDays)}
              options={[
                ['30', t('30 Hari')],
                ['90', t('90 Hari')],
                ['365', t('1 Tahun')],
              ]}
              onChange={(v) => save('visitRetentionDays', Number(v) as 30 | 90 | 365)}
            />
          )}
        />
      </Group>

      <Group title={t('Lanjutan')}>
        <MaintenanceRow on={values.maintenanceMode} onSave={save} />
        {/* Halaman status pindah ke sidebar (revisi pemilik 2026-11-17) */}
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

function VolumeControl({
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
function MaintenanceRow({ on, onSave }: { on: boolean; onSave: Save }) {
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
