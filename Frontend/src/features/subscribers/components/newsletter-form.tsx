'use client'

import { CheckCircle2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useActionState } from 'react'

import { Honeypot, PublicField } from '@/components/site/public-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { initialFormState } from '@/lib/form-state'

import { subscribeNewsletter } from '../public-actions'

export function NewsletterForm() {
  const t = useTranslations('Newsletter')
  const locale = useLocale()
  const [state, action, pending] = useActionState(subscribeNewsletter, initialFormState)
  const fieldError = state.fieldErrors?.email

  return (
    <section
      aria-labelledby="newsletter-title"
      className="rounded-lg border border-border bg-surface p-5 md:p-6"
    >
      <h2 id="newsletter-title" className="text-h3 font-semibold">
        {t('heading')}
      </h2>
      <p className="mt-2 text-sm text-muted">{t('body')}</p>
      {state.status === 'success' ? (
        <p role="status" className="mt-4 flex items-start gap-2 text-sm text-success">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t('success')}
        </p>
      ) : (
        <form action={action} className="relative mt-4 flex flex-col gap-3" noValidate>
          <input type="hidden" name="locale" value={locale} />
          <Honeypot id="newsletter-website" label="Website" />
          <PublicField
            id="newsletter-email"
            label={t('email')}
            error={fieldError ? t(fieldError as 'emailInvalid') : undefined}
          >
            {(a) => (
              <Input
                {...a}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                defaultValue={state.values?.email ?? ''}
              />
            )}
          </PublicField>
          <Button type="submit" variant="secondary" disabled={pending} className="sm:self-start">
            {pending ? t('subscribing') : t('subscribe')}
          </Button>
          <p role="status" aria-live="polite" className="text-sm text-danger empty:hidden">
            {state.status === 'error' && state.message && state.message !== 'emailInvalid'
              ? t(state.message as 'error')
              : ''}
          </p>
        </form>
      )}
    </section>
  )
}
