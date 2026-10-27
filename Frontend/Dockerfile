# syntax=docker/dockerfile:1
# Image produksi aplikasi (dipublikasikan ke GitHub Packages: ghcr.io/horizonmirza/mirza-portfolio).
# Dibangun dari akar repo:
#   docker build --network=host -f Frontend/Dockerfile --build-arg DATABASE_URL=<postgres> .
# `next build` merender halaman dari database, jadi saat build harus ada Postgres yang sudah
# dimigrasi (workflow .github/workflows/release.yml menyiapkannya). Saat dijalankan, image butuh
# DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, dan NEXT_PUBLIC_SITE_URL (lihat
# Documentation/DEPLOYMENT.md).

FROM node:24-slim AS build
ENV HUSKY=0 NEXT_TELEMETRY_DISABLED=1 DOCKER_BUILD=1
RUN corepack enable
WORKDIR /app
# skema Prisma ada di Database/, dan `pnpm install` menjalankan prisma generate (postinstall)
COPY Database ./Database
WORKDIR /app/Frontend
COPY Frontend/package.json Frontend/pnpm-lock.yaml Frontend/pnpm-workspace.yaml Frontend/prisma.config.ts ./
RUN pnpm install --frozen-lockfile
COPY Frontend ./
ARG DATABASE_URL
ARG NEXT_PUBLIC_SITE_URL=https://mmirza.site
RUN pnpm exec next build

FROM node:24-slim AS runtime
LABEL org.opencontainers.image.title="mirza-portfolio" \
      org.opencontainers.image.url="https://mmirza.site" \
      org.opencontainers.image.source="https://github.com/HorizonMirza/Mirza-Portfolio" \
      org.opencontainers.image.description="Bilingual (ID/EN) portfolio website with a Super Admin panel, built with Next.js" \
      org.opencontainers.image.licenses="NOASSERTION"
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build --chown=node:node /app/Frontend/.next/standalone ./
COPY --from=build --chown=node:node /app/Frontend/.next/static ./.next/static
COPY --from=build --chown=node:node /app/Frontend/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
