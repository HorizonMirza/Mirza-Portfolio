import { EmailButton, emailColors, EmailLayout } from './layout'

export type ConfirmSubscriptionCopy = { intro: string; action: string; ignore: string }

export function ConfirmSubscriptionEmail({
  lang,
  url,
  copy,
}: {
  lang: string
  url: string
  copy: ConfirmSubscriptionCopy
}) {
  return (
    <EmailLayout lang={lang} preview={copy.intro}>
      <p style={{ margin: '0 0 24px' }}>{copy.intro}</p>
      <p style={{ margin: '0 0 24px' }}>
        <EmailButton href={url}>{copy.action}</EmailButton>
      </p>
      <p style={{ margin: 0, fontSize: 14, color: emailColors.muted }}>{copy.ignore}</p>
    </EmailLayout>
  )
}
