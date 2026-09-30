'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type ReactNode, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'

import { applyResult } from '@/components/admin/apply-result'
import { Field } from '@/components/admin/field'
import { NativeSelect } from '@/components/admin/select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import { saveSkill, saveSkillCategory } from '../actions'
import {
  type SkillCategoryInput,
  skillCategorySchema,
  type SkillInput,
  skillSchema,
} from '../schema'

function DialogActions({ pending }: { pending: boolean }) {
  return (
    <div className="mt-2 flex justify-end gap-2">
      <DialogClose asChild>
        <Button type="button" variant="secondary">
          Batal
        </Button>
      </DialogClose>
      <Button type="submit" disabled={pending}>
        {pending ? 'Menyimpan…' : 'Simpan'}
      </Button>
    </div>
  )
}

export function CategoryDialog({
  categoryId,
  defaultValues = { name_id: '', name_en: '' },
  trigger,
}: {
  categoryId: string | null
  defaultValues?: SkillCategoryInput
  trigger: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const form = useForm<SkillCategoryInput>({
    resolver: zodResolver(skillCategorySchema),
    defaultValues,
  })
  const {
    register,
    formState: { errors },
  } = form
  const idPrefix = `category-${categoryId ?? 'new'}`

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveSkillCategory(categoryId, values)
      if (applyResult(result, form.setError)) {
        setOpen(false)
        form.reset(categoryId ? values : defaultValues)
      }
    })
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogTitle>{categoryId ? 'Ubah kategori' : 'Kategori baru'}</DialogTitle>
        <DialogDescription>
          Nama kategori tampil sebagai judul kelompok di halaman skill.
        </DialogDescription>
        <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-4">
          <Field
            id={`${idPrefix}-name_id`}
            label="Nama (Indonesia)"
            error={errors.name_id?.message}
          >
            {(a) => <Input {...a} {...register('name_id')} />}
          </Field>
          <Field id={`${idPrefix}-name_en`} label="Name (English)" error={errors.name_en?.message}>
            {(a) => <Input {...a} {...register('name_en')} />}
          </Field>
          <DialogActions pending={pending} />
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SkillDialog({
  skillId,
  defaultValues,
  categories,
  trigger,
}: {
  skillId: string | null
  defaultValues: SkillInput
  categories: { id: string; name: string }[]
  trigger: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const form = useForm<SkillInput>({ resolver: zodResolver(skillSchema), defaultValues })
  const {
    register,
    formState: { errors },
  } = form
  const idPrefix = `skill-${skillId ?? `new-${defaultValues.categoryId}`}`

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveSkill(skillId, values)
      if (applyResult(result, form.setError)) {
        setOpen(false)
        form.reset(skillId ? values : defaultValues)
      }
    })
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogTitle>{skillId ? 'Ubah skill' : 'Skill baru'}</DialogTitle>
        <DialogDescription>
          Nama skill ditulis dengan kapitalisasi resminya, misalnya Next.js atau PostgreSQL.
        </DialogDescription>
        <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-4">
          <Field id={`${idPrefix}-name`} label="Nama skill" error={errors.name?.message}>
            {(a) => <Input autoComplete="off" {...a} {...register('name')} />}
          </Field>
          <Field id={`${idPrefix}-category`} label="Kategori" error={errors.categoryId?.message}>
            {(a) => (
              <NativeSelect {...a} {...register('categoryId')}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            )}
          </Field>
          <Field
            id={`${idPrefix}-icon`}
            label="Ikon (opsional)"
            hint="Slug Simple Icons, misalnya nextdotjs atau postgresql."
            error={errors.icon?.message}
          >
            {(a) => <Input autoComplete="off" {...a} {...register('icon')} />}
          </Field>
          <DialogActions pending={pending} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
