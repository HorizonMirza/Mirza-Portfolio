import { z } from 'zod'

// Laporan error server ke Sentry lewat HTTP (envelope API), tanpa SDK: tidak menambah JavaScript
// klien maupun beban cold start. Aktif hanya bila SENTRY_DSN diisi.
// Data pribadi tidak dikirim: tanpa header, cookie, IP, body, dan query string.

const MAX_MESSAGE = 1000
const MAX_FRAMES = 50

const reportEnvSchema = z.object({
  SENTRY_DSN: z.url().optional(),
  VERCEL_ENV: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
  NODE_ENV: z.string().optional(),
})

export type SentryTarget = { endpoint: string; publicKey: string; dsn: string }

export type RequestInfo = { path: string; method: string }
export type ErrorContext = {
  routerKind?: string
  routePath?: string
  routeType?: string
  renderSource?: string
  revalidateReason?: string
}

type Frame = { function?: string; filename?: string; lineno?: number; colno?: number }

// https://<kunci>@<host>/<projectId>  →  https://<host>/api/<projectId>/envelope/
export function parseDsn(dsn: string): SentryTarget | null {
  let url: URL
  try {
    url = new URL(dsn)
  } catch {
    return null
  }
  const publicKey = url.username
  const segments = url.pathname.split('/').filter(Boolean)
  const projectId = segments.pop()
  if (!publicKey || !projectId || !/^\d+$/.test(projectId)) return null
  const prefix = segments.length ? `/${segments.join('/')}` : ''
  return {
    endpoint: `${url.protocol}//${url.host}${prefix}/api/${projectId}/envelope/`,
    publicKey,
    dsn,
  }
}

// Baris "at fn (file:line:col)" atau "at file:line:col" → frame Sentry (urutan terlama dulu).
export function parseStack(stack: string | undefined): Frame[] {
  if (!stack) return []
  const frames: Frame[] = []
  for (const line of stack.split('\n').slice(1)) {
    const match = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?\s*$/.exec(line)
    if (!match) continue
    frames.push({
      function: match[1] ?? '<anonymous>',
      filename: match[2],
      lineno: Number(match[3]),
      colno: Number(match[4]),
    })
    if (frames.length >= MAX_FRAMES) break
  }
  return frames.reverse()
}

function describe(error: unknown): {
  type: string
  value: string
  stack?: string
  digest?: string
} {
  const digest =
    typeof error === 'object' && error !== null && 'digest' in error
      ? String((error as { digest: unknown }).digest)
      : undefined
  if (error instanceof Error) {
    return {
      type: error.name || 'Error',
      value: error.message.slice(0, MAX_MESSAGE),
      stack: error.stack,
      digest,
    }
  }
  return { type: 'Error', value: String(error).slice(0, MAX_MESSAGE), digest }
}

export function buildEnvelope(
  error: unknown,
  request: RequestInfo,
  context: ErrorContext,
  options: {
    target: SentryTarget
    environment: string
    release?: string
    eventId: string
    now: Date
  },
): string {
  const { type, value, stack, digest } = describe(error)
  const frames = parseStack(stack)
  // path tanpa query string: token newsletter dan sejenisnya tidak boleh ikut terkirim
  const path = request.path.split('?')[0]
  const event = {
    event_id: options.eventId,
    timestamp: options.now.getTime() / 1000,
    platform: 'node',
    level: 'error',
    logger: 'onRequestError',
    environment: options.environment,
    ...(options.release ? { release: options.release } : {}),
    transaction: context.routePath ?? path,
    exception: {
      values: [{ type, value, ...(frames.length ? { stacktrace: { frames } } : {}) }],
    },
    request: { method: request.method, url: path },
    tags: {
      routeType: context.routeType ?? 'unknown',
      routerKind: context.routerKind ?? 'unknown',
      ...(context.renderSource ? { renderSource: context.renderSource } : {}),
      ...(context.revalidateReason ? { revalidateReason: context.revalidateReason } : {}),
    },
    ...(digest ? { extra: { digest } } : {}),
  }
  const header = {
    event_id: options.eventId,
    sent_at: options.now.toISOString(),
    dsn: options.target.dsn,
  }
  const body = JSON.stringify(event)
  return `${JSON.stringify(header)}\n${JSON.stringify({ type: 'event' })}\n${body}\n`
}

export async function reportServerError(
  error: unknown,
  request: RequestInfo,
  context: ErrorContext,
  source: Record<string, string | undefined> = process.env,
  send: typeof fetch = fetch,
): Promise<void> {
  const env = reportEnvSchema.safeParse(
    Object.fromEntries(Object.entries(source).filter(([, v]) => v !== '')),
  )
  if (!env.success || !env.data.SENTRY_DSN) return
  const target = parseDsn(env.data.SENTRY_DSN)
  if (!target) return

  const envelope = buildEnvelope(error, request, context, {
    target,
    environment: env.data.VERCEL_ENV ?? env.data.NODE_ENV ?? 'production',
    release: env.data.VERCEL_GIT_COMMIT_SHA,
    eventId: crypto.randomUUID().replaceAll('-', ''),
    now: new Date(),
  })
  try {
    await send(target.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${target.publicKey}, sentry_client=mirza-portfolio/1.0`,
      },
      body: envelope,
      signal: AbortSignal.timeout(3000),
    })
  } catch {
    // Gagal melapor tidak boleh memicu error baru. Isi error tidak dicatat ulang di log.
  }
}
