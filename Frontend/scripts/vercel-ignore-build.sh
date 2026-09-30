#!/usr/bin/env bash
# Ignored Build Step Vercel: exit 0 = build DILEWATI, exit 1 = build DIJALANKAN.
# Build dilewati bila yang berubah hanya di luar Frontend/ dan Database/
# (misalnya Documentation/, .github/, README.md). Bila ragu, build selalu dijalankan.
set -u

base="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$base" ] || ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  base="HEAD^"
fi

if ! git rev-parse --verify --quiet "${base}^{commit}" >/dev/null; then
  echo "Commit pembanding tidak tersedia, build dijalankan."
  exit 1
fi

if git diff --quiet "$base" HEAD -- . ../Database; then
  echo "Tidak ada perubahan di Frontend/ atau Database/, build dilewati."
  exit 0
fi

echo "Ada perubahan di Frontend/ atau Database/, build dijalankan."
exit 1
