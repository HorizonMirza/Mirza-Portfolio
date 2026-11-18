import { createNavigation } from 'next-intl/navigation'

import { routing } from '@backend/i18n/routing'

// Pengganti next/link dan next/navigation yang sadar bahasa.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
