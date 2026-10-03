'use client'

import { Check, Send } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useActionState, useEffect, useRef, useState } from 'react'

import { Honeypot, PublicField } from '@/components/site/public-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { usePathname } from '@/i18n/navigation'
import { initialFormState, type PublicFormState } from '@/lib/form-state'

import { submitContact } from '../../public-actions'

type ErrorKey =
  | 'nameRequired'
  | 'nameTooLong'
  | 'emailInvalid'
  | 'subjectTooLong'
  | 'messageShort'
  | 'messageLong'

// Form kontak (DESIGN.md bagian 34). "Coba lagi" memasang ulang form lewat key, sehingga state
// useActionState kembali kosong.
export function ContactForm() {
  const [round, setRound] = useState(0)
  return <ContactFormInner key={round} onReset={() => setRound((r) => r + 1)} />
}

function ContactFormInner({ onReset }: { onReset: () => void }) {
  const t = useTranslations('Contact')
  const locale = useLocale()
  const pathname = usePathname()
  const [state, action, pending] = useActionState(submitContact, initialFormState)
  const summary = useRef<HTMLParagraphElement>(null)
  // kolom yang sudah diketik ulang setelah galat: tandanya langsung hilang (seperti login admin)
  const [cleared, setCleared] = useState<Set<string>>(new Set())
  const [seenState, setSeenState] = useState<PublicFormState>(state)
  if (seenState !== state) {
    setSeenState(state)
    setCleared(new Set())
  }
  const err = (name: string) => {
    const key = state.fieldErrors?.[name]
    return key && !cleared.has(name) ? t(key as ErrorKey) : undefined
  }

  // Setelah galat, pindahkan fokus ke ringkasan agar pembaca layar langsung mendengarnya.
  useEffect(() => {
    if (state.status === 'error') summary.current?.focus()
  }, [state])

  const sent = state.status === 'success'
  const v = state.values ?? {}
  const phase = sent ? 'sent' : pending ? 'pending' : 'idle'

  const form = (
    <form
      action={action}
      noValidate
      inert={sent}
      onInput={(event) => {
        const name = (event.target as HTMLInputElement).name
        if (name && state.fieldErrors?.[name] && !cleared.has(name))
          setCleared((prev) => new Set(prev).add(name))
      }}
      className="relative flex flex-col gap-5"
    >
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
        <PublicField id="contact-name" shine={0} label={t('name')} error={err('name')}>
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
        <PublicField id="contact-email" shine={1} label={t('email')} error={err('email')}>
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
      <PublicField id="contact-subject" shine={2} label={t('subject')} error={err('subject')}>
        {(a) => <Input {...a} name="subject" maxLength={150} defaultValue={v.subject ?? ''} />}
      </PublicField>
      <PublicField id="contact-message" shine={3} label={t('message')} error={err('message')}>
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
      <div className="flex">
        {/* Tombol bergaris dengan kilau berputar (pilihan pemilik, demo nomor 5): menyusut jadi
            lingkaran saat mengirim, lalu hijau terang mengkilap saat terkirim. */}
        <button
          type="submit"
          disabled={phase !== 'idle'}
          data-state={phase}
          aria-label={phase === 'pending' ? t('sending') : undefined}
          className="send-btn"
        >
          {phase === 'pending' ? (
            <span className="send-btn-spin" aria-hidden="true" />
          ) : phase === 'sent' ? (
            <>
              <Check className="size-[18px]" strokeWidth={2.75} aria-hidden="true" />
              {t('sent')}
            </>
          ) : (
            <>
              <Send className="size-[18px]" aria-hidden="true" />
              {t('send')}
            </>
          )}
        </button>
      </div>
    </form>
  )

  if (!sent) return form

  // Terkirim: tombol hijau tampil sebentar, lalu form menyusut dan kotak terima kasih muncul.
  // Urutannya murni CSS (.contact-sent di globals.css) agar tetap jalan tanpa JavaScript.
  return (
    <div className="contact-sent">
      <div className="contact-sent-form" aria-hidden="true">
        <div>{form}</div>
      </div>
      <div
        role="status"
        className="contact-done flex items-start gap-3 rounded-xl border border-border bg-surface px-5 py-4"
      >
        <Check
          className="mt-0.5 size-5 shrink-0 text-success"
          strokeWidth={2.5}
          aria-hidden="true"
        />
        <div>
          <p className="font-semibold">
            {v.name ? t('successTitle', { name: v.name }) : t('successTitleAnon')}
          </p>
          <p className="text-muted">
            {t('success')}{' '}
            {/* tanpa JavaScript: memuat ulang halaman kontak; dengan JavaScript: form dipasang ulang */}
            <a
              href={`/${locale}${pathname === '/' ? '' : pathname}`}
              onClick={(event) => {
                event.preventDefault()
                onReset()
              }}
              className="text-text underline underline-offset-4 hover:no-underline"
            >
              {t('tryAgain')}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
