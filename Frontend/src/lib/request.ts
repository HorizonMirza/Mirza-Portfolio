import 'server-only'

const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|uptime/i

export function isBot(userAgent: string | null) {
  return !userAgent || BOT_PATTERN.test(userAgent)
}

// Permintaan mutasi publik harus datang dari situs sendiri (cegah CSRF dan beacon palsu lintas situs).
export function isSameOrigin(request: Request) {
  const site = request.headers.get('sec-fetch-site')
  if (site) return site === 'same-origin'
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}
