'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'

import { useAdminT } from '@/components/admin/admin-lang'
import { applyResult } from '@/components/admin/apply-result'
import { BilingualTabs, countLangErrors } from '@/components/admin/bilingual-tabs'
import { Field } from '@/components/admin/field'
import { FormFooter } from '@/components/admin/form-footer'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { saveHeroRoles } from '../actions'
import { type HeroRolesInput, heroRolesSchema } from '../schema'

// Admin → Home: peran di kiri dan kanan bawah foto beranda (mis. "Fullstack Developer" dan
// "Community Manager"), dipindah dari form Profil 2026-11-10.
export function HeroRolesForm({
  defaultValues,
  placeholders,
}: {
  defaultValues: HeroRolesInput
  // teks bawaan (About.roles) yang tampil di situs selama kolom ini kosong
  placeholders: Record<'id' | 'en', string>
}) {
  const t = useAdminT()
  const [pending, startTransition] = useTransition()
  const form = useForm<HeroRolesInput>({ resolver: zodResolver(heroRolesSchema), defaultValues })
  const {
    register,
    formState: { errors },
  } = form

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveHeroRoles(values)
      if (applyResult(result, form.setError)) form.reset(values)
    })
  })

  const roles = (lang: 'id' | 'en') => {
    const name = `aboutRoles_${lang}` as const
    return (
      <Field
        id={name}
        label={lang === 'id' ? 'Peran' : 'Roles'}
        hint={
          lang === 'id'
            ? 'Dipisah |, mis. "Fullstack Developer | Community Manager". Peran pertama di kiri bawah foto, berikutnya di kanan. Juga tampil di halaman Tentang dan footer.'
            : 'Separated by |. The first role sits bottom left of the photo, the next bottom right. Also shown on the About page and in the footer.'
        }
        error={errors[name]?.message}
      >
        {(a) => <Input placeholder={placeholders[lang]} {...a} {...register(name)} />}
      </Field>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <h2 className="text-h3 font-semibold">{t('Peran di bawah foto')}</h2>
        <BilingualTabs errors={countLangErrors(errors)} id={roles('id')} en={roles('en')} />
      </Card>
      <FormFooter pending={pending} />
    </form>
  )
}
