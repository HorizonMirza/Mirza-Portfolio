// Hook instrumentasi Next: galat server dilaporkan ke Sentry (bila SENTRY_DSN diisi).

import type { Instrumentation } from 'next'

import { reportServerError } from '@backend/lib/error-report'

// Error dari Server Components, Route Handlers, Server Actions, dan proxy dilaporkan ke Sentry
// (bila SENTRY_DSN diisi). Hanya path, method, dan konteks route yang dikirim, tanpa header.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  await reportServerError(error, { path: request.path, method: request.method }, context)
}
