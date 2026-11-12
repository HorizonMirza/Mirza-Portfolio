'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import type { StaticImageData } from 'next/image'
import { useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { useAdminT } from '@/components/admin/admin-lang'
import { applyResult } from '@/components/admin/apply-result'
import { HeroPreview } from '@/components/admin/hero-preview'
import {
  InlineInput,
  LANG_NAME,
  type Lang,
  LangToggle,
  LiveErrors,
  LiveStage,
  SaveBar,
  useEditLang,
} from '@/components/admin/live-edit'

import { saveHeroRoles } from '../actions'
import { type HeroRolesInput, heroRolesSchema } from '../schema'

function splitRoles(value: string) {
  return value.split('|').map((r) => r.trim())
}

// Admin → Home, tab Peran beranda (DESIGN.md bagian 133): hero beranda tampil seperti di situs dan
// peran di kiri dan kanan bawah foto diketik langsung di tempatnya. Disimpan sebagai satu teks
// dipisah "|" (format lama tetap). Selama kosong, situs memakai teks bawaan (About.roles), yang
// tampil samar di sini.
export function HeroRolesForm({
  defaultValues,
  placeholders,
  name,
  portrait,
}: {
  defaultValues: HeroRolesInput
  // teks bawaan (About.roles) yang tampil di situs selama kolom ini kosong
  placeholders: Record<Lang, string>
  name: string
  portrait: string | StaticImageData
}) {
  const t = useAdminT()
  const [pending, startTransition] = useTransition()
  const [lang, setLang] = useEditLang()
  const form = useForm<HeroRolesInput>({ resolver: zodResolver(heroRolesSchema), defaultValues })
  const {
    control,
    setValue,
    formState: { errors, dirtyFields, isSubmitted },
  } = form
  const field = `aboutRoles_${lang}` as const
  const value = useWatch({ control, name: field }) ?? ''
  const hints = splitRoles(placeholders[lang])
  const parts = splitRoles(value)
  // minimal dua tempat: kiri dan kanan bawah foto
  const slots = Array.from({ length: Math.max(2, parts.length) }, (_, i) => parts[i] ?? '')
  const error = errors[field]?.message
  const otherLang: Lang = lang === 'id' ? 'en' : 'id'
  const otherError = errors[`aboutRoles_${otherLang}`]?.message

  function update(index: number, text: string) {
    const next = slots.map((s, i) => (i === index ? text : s))
    // tempat kosong di akhir tidak ikut disimpan
    while (next.length > 0 && next[next.length - 1]!.trim() === '') next.pop()
    setValue(field, next.join(' | '), { shouldDirty: true, shouldValidate: isSubmitted })
  }

  const onSubmit = form.handleSubmit(
    (values) => {
      // tempat kosong di tengah dibuang, spasi dirapikan
      const clean = (v: string | undefined) =>
        splitRoles(v ?? '')
          .filter(Boolean)
          .join(' | ')
      const payload = {
        aboutRoles_id: clean(values.aboutRoles_id),
        aboutRoles_en: clean(values.aboutRoles_en),
      }
      startTransition(async () => {
        const result = await saveHeroRoles(payload)
        if (applyResult(result, form.setError)) form.reset(payload)
      })
    },
    (invalid) => {
      if (!invalid[field] && invalid[`aboutRoles_${otherLang}`]) setLang(otherLang)
    },
  )

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <LiveStage className="relative">
        <HeroPreview name={name} portrait={portrait}>
          <div className="admin-hero-roles" lang={lang}>
            {slots.map((role, i) => (
              <InlineInput
                key={`${lang}-${i}`}
                label={t('Peran ke-{n} ({lang})', { n: i + 1, lang: t(LANG_NAME[lang]) })}
                value={role}
                placeholder={hints[i] ?? ''}
                size={Math.max(4, (role || hints[i] || '').length + 1)}
                maxLength={120}
                invalid={Boolean(error)}
                describedBy={error ? `${field}-error` : undefined}
                onChange={(event) => update(i, event.target.value)}
              />
            ))}
          </div>
        </HeroPreview>
        <LangToggle
          lang={lang}
          onChange={setLang}
          dirty={{ id: Boolean(dirtyFields.aboutRoles_id), en: Boolean(dirtyFields.aboutRoles_en) }}
          className="absolute top-3 right-3"
        />
      </LiveStage>
      <LiveErrors
        messages={[
          ...(error ? [{ id: `${field}-error`, text: t(error) }] : []),
          ...(otherError
            ? [
                {
                  text: t('Isi {lang}: {error}', {
                    lang: t(LANG_NAME[otherLang]),
                    error: t(otherError),
                  }),
                },
              ]
            : []),
        ]}
      />
      <SaveBar pending={pending} />
    </form>
  )
}
