'use client'

import { Check, Send } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useActionState, useEffect, useRef, useState } from 'react'

import { Honeypot, PublicField } from '@/components/site/public-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { usePathname } from '@/i18n/navigation'
import { initialFormState, type PublicFormState } from '@/lib/form-state'
import { cn } from '@/lib/utils'

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
        className={cn(
          'rounded-md text-sm text-danger empty:hidden focus-visible:outline-offset-4',
          // "Periksa kembali isian yang ditandai" cukup untuk pembaca layar; tanda per kolom sudah terlihat
          state.message === 'invalid' && 'sr-only',
        )}
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
            lingkaran berpemutar saat mengirim. */}
        <button
          type="submit"
          disabled={phase !== 'idle'}
          data-state={phase}
          aria-label={phase !== 'idle' ? t('sending') : undefined}
          className="send-btn"
        >
          {phase !== 'idle' ? (
            <span className="send-btn-spin" aria-hidden="true" />
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

  // Terkirim (pilihan pemilik 2026-10-03, demo nomor 3): form memudar dan menyusut, lalu tiket
  // ringkasan terbuka. Urutannya murni CSS (.contact-sent di globals.css) agar sama dengan atau
  // tanpa JavaScript. Waktu memakai WIB (zona Mirza) agar server dan browser menulis hal yang sama.
  const sentAt = v.sentAt
    ? new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta',
      }).format(new Date(v.sentAt)) + ' WIB'
    : null
  const rows: [string, string][] = [
    ...(v.name ? ([[t('ticketFrom'), v.name]] as [string, string][]) : []),
    ...(v.email ? ([[t('ticketReplyTo'), v.email]] as [string, string][]) : []),
    ...(v.subject ? ([[t('ticketSubject'), v.subject]] as [string, string][]) : []),
  ]
  return (
    <div className="contact-sent">
      <div className="contact-sent-form" aria-hidden="true">
        <div>{form}</div>
      </div>
      <div role="status" className="contact-ticket">
        <div className="contact-ticket-head">
          <p className="font-display text-h3 font-semibold uppercase">{t('sentTitle')}</p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/45 px-2.5 py-0.5 text-[0.8125rem] font-semibold text-success">
            <Check className="size-3.5" strokeWidth={2.75} aria-hidden="true" />
            {t('sentBadge')}
          </span>
        </div>
        <dl className="contact-ticket-rows">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          {v.message ? (
            <div>
              <dt>{t('ticketMessage')}</dt>
              <dd className="line-clamp-3 text-muted">{v.message}</dd>
            </div>
          ) : null}
          {sentAt ? (
            <div>
              <dt>{t('ticketTime')}</dt>
              <dd>{sentAt}</dd>
            </div>
          ) : null}
        </dl>
        {/* tanpa JavaScript: memuat ulang halaman kontak; dengan JavaScript: form dipasang ulang */}
        <a
          href={`/${locale}${pathname === '/' ? '' : pathname}`}
          onClick={(event) => {
            event.preventDefault()
            onReset()
          }}
          className="inline-flex min-h-11 items-center text-[0.9375rem] text-text underline underline-offset-4 hover:no-underline"
        >
          {t('another')}
        </a>
      </div>
    </div>
  )
}
