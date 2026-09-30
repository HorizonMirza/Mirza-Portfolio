'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

import { cn } from '@/lib/utils'

const options = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
] as const

const subscribe = () => () => {}

export function ThemeToggle() {
  const t = useTranslations('Theme')
  const { theme, setTheme } = useTheme()
  // Tema baru diketahui di browser. Sebelum itu jangan tandai pilihan apa pun (hindari hydration mismatch).
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )

  return (
    <div
      role="group"
      aria-label={t('label')}
      className="inline-flex rounded-md border border-border bg-surface p-0.5"
    >
      {options.map(({ value, icon: Icon }) => {
        const active = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            title={t(value)}
            className={cn(
              'inline-flex size-10 items-center justify-center rounded-sm text-muted transition-colors hover:text-text',
              active && 'bg-surface-2 text-text',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="sr-only">{t(value)}</span>
          </button>
        )
      })}
    </div>
  )
}
