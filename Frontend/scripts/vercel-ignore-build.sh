#!/usr/bin/env bash
# Ignored Build Step Vercel: exit 0 = build DILEWATI, exit 1 = build DIJALANKAN.
# Build dilewati bila yang berubah hanya di luar Frontend/ dan Database/
# (misalnya Documentation/, .github/, README.md). Bila ragu, build selalu dijalankan.
set -u

# VERCEL_GIT_PREVIOUS_SHA = commit deploy sukses sebelumnya. Kosong pada deploy pertama,
# jadi build selalu dijalankan (jangan membandingkan dengan HEAD^).
base="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$base" ]; then
  echo "Belum ada deploy sebelumnya, build dijalankan."
  exit 1
fi

if ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  echo "Commit pembanding tidak tersedia, build dijalankan."
  exit 1
fi

if git diff --quiet "$base" HEAD -- . ../Database; then
  echo "Tidak ada perubahan di Frontend/ atau Database/, build dilewati."
  exit 0
fi

echo "Ada perubahan di Frontend/ atau Database/, build dijalankan."
exit 1
