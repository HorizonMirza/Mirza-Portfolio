#!/usr/bin/env bash
# Build di Vercel. Migrasi database hanya dijalankan di production, atau di preview yang
# memakai branch database sendiri (set MIGRATE_ON_BUILD=true di env Preview), supaya deploy
# preview tidak pernah mengubah database production.
set -euo pipefail

if [ "${VERCEL_ENV:-}" = "production" ] || [ "${MIGRATE_ON_BUILD:-}" = "true" ]; then
  echo "Menjalankan migrasi database (VERCEL_ENV=${VERCEL_ENV:-tidak ada})"
  pnpm exec prisma migrate deploy
  # Deploy pertama: isi konten CV dan akun admin bila database masih kosong (tidak diulang
  # setelah itu, lihat scripts/seed.ts mode --bootstrap).
  if [ "${VERCEL_ENV:-}" = "production" ]; then
    pnpm exec tsx scripts/seed.ts --bootstrap
  fi
else
  echo "Migrasi dilewati (VERCEL_ENV=${VERCEL_ENV:-tidak ada}). Set MIGRATE_ON_BUILD=true bila preview memakai branch database sendiri."
fi

pnpm exec next build
