'use client'

// Admin → Pengaturan: daftar berkelompok Suara, Tampilan, Pesan, Privasi, Lanjutan; tiap baris satu
// pengaturan dengan kontrol di kanan. Setiap perubahan langsung disimpan (tanpa tombol Simpan) lalu
// muncul notifikasi "Tersimpan".
// Gagal disimpan: kontrol kembali ke nilai terakhir yang tersimpan.

import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import { previewSound } from '@/lib/ui-sounds'

import { saveSiteOption } from '@backend/features/settings/actions'
import {
  CONTACT_PER_HOUR_MAX,
  CONTACT_PER_HOUR_MIN,
  type SiteOptionInput,
  type SiteOptions,
  type SoundKind,
} from '@backend/features/settings/options'

import {
  Choice,
  Group,
  MaintenanceRow,
  NumberControl,
  Pill,
  Row,
  Switch,
  VolumeControl,
  type Save,
} from './settings-controls'

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
      {/* Semua suara situs satu per satu: tiap suara punya geseran volume
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
      </Group>
    </div>
  )
}
