'use client'

import { CheckCircle2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useActionState, useEffect, useRef } from 'react'

import { Honeypot, PublicField } from '@/components/site/public-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Link } from '@/i18n/navigation'
import { initialFormState } from '@/lib/form-state'

import { submitContact } from '../../public-actions'

type ErrorKey =
  | 'nameRequired'
  | 'nameTooLong'
  | 'emailInvalid'
  | 'subjectTooLong'
  | 'messageShort'
  | 'messageLong'

export function ContactForm() {
  const t = useTranslations('Contact')
  const locale = useLocale()
  const [state, action, pending] = useActionState(submitContact, initialFormState)
  const summary = useRef<HTMLParagraphElement>(null)
  const err = (name: string) => {
    const key = state.fieldErrors?.[name]
    return key ? t(key as ErrorKey) : undefined
  }

  // Setelah galat, pindahkan fokus ke ringkasan agar pembaca layar langsung mendengarnya.
  useEffect(() => {
    if (state.status === 'error') summary.current?.focus()
  }, [state])

  if (state.status === 'success') {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-lg border border-success/40 bg-surface p-5 text-success"
      >
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>{t('success')}</p>
      </div>
    )
  }

  const v = state.values ?? {}
  return (
    <form action={action} noValidate className="relative flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />
      <Honeypot id="contact-website" label={t('honeypot')} />
      <p
        ref={summary}
        tabIndex={-1}
        role="alert"
        className="rounded-md text-sm text-danger empty:hidden focus-visible:outline-offset-4"
      >
        {state.status === 'error' && state.message ? t(state.message as 'error') : ''}
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <PublicField id="contact-name" label={t('name')} error={err('name')}>
          {(a) => (
            <Input
              {...a}
              name="name"
              autoComplete="name"
              required
              maxLength={100}
              defaultValue={v.name ?? ''}
            />
          )}
        </PublicField>
        <PublicField id="contact-email" label={t('email')} error={err('email')}>
          {(a) => (
            <Input
              {...a}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              defaultValue={v.email ?? ''}
            />
          )}
        </PublicField>
      </div>
      <PublicField id="contact-subject" label={t('subject')} error={err('subject')}>
        {(a) => <Input {...a} name="subject" maxLength={150} defaultValue={v.subject ?? ''} />}
      </PublicField>
      <PublicField id="contact-message" label={t('message')} error={err('message')}>
        {(a) => (
          <Textarea
            {...a}
            name="message"
            rows={7}
            required
            maxLength={5000}
            defaultValue={v.message ?? ''}
          />
        )}
      </PublicField>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          {t('privacyNote')}{' '}
          <Link href="/privacy" className="text-primary underline underline-offset-4">
            {t('privacyLink')}
          </Link>
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? t('sending') : t('send')}
        </Button>
      </div>
    </form>
  )
}
