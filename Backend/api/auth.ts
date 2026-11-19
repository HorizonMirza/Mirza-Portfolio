// Logika rute /api/auth/*: semua permintaan Better Auth (masuk, keluar, sesi) diteruskan ke handler-nya.

import { toNextJsHandler } from 'better-auth/next-js'

import { getAuth } from '@backend/lib/auth'

export async function GET(request: Request) {
  return toNextJsHandler(getAuth()).GET(request)
}

export async function POST(request: Request) {
  return toNextJsHandler(getAuth()).POST(request)
}
