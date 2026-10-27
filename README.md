# Muhammad Mirza - Portfolio

Portfolio of Muhammad Mirza with a Super Admin Panel

[![CI](https://github.com/HorizonMirza/Mirza-Portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/HorizonMirza/Mirza-Portfolio/actions/workflows/ci.yml)

**Live:** [mmirza.site](https://mmirza.site) · [Bahasa Indonesia](https://mmirza.site/id) · [English](https://mmirza.site/en)

![Home page of mmirza.site: the name behind the photo, with an armor layer revealed under the cursor](Documentation/screenshots/home.webp)

## Pages

| Page | What's there |
|---|---|
| **Home** `/` | Name behind the photo, with an armor layer revealed by a WebGL fluid mask. Below it: an Experience accordion, a Projects marquee, a spinning Technical Skills globe, and a GitHub contribution graph. |
| **About** `/about` | Bio, education, and a tilting photo card. |
| **Experience** `/experience` | Timeline of work and organizations, with filters. |
| **Projects** `/projects` | Spotlight list with browser-frame previews and detail pages (role, tech stack, gallery, demo and code links). |
| **Contact** `/contact` | Rate-limited form with honeypot, a swinging ID-card lanyard, and a flip-card "message sent" ticket. |
| **Privacy** `/privacy` | What the site collects and why. |

Every page comes in Indonesian and English (`/id`, `/en`), dark by default with a light theme, and is built mobile-first.

## Super Admin

`/admin` is a single owner account (email and password via Better Auth).

- **Site text:** one admin page per module (Intro, Home, About, Experience, Projects, Contact, Navbar, Footer, Privacy), edited in both languages, plus the hero photos.
- **Content:** profile, projects (GitHub import, Cloudinary uploads, draft/published), skills, experience and education.
- **Inbox:** contact messages and newsletter subscribers.
- **Safety:** every action is validated with Zod on the server, requires the `SUPER_ADMIN` role, and is written to the audit log.

## Tech stack

| Layer | Tools |
|---|---|
| **App** | Next.js 16 (App Router), React 19, TypeScript (strict) |
| **UI** | Tailwind CSS 4, Radix UI, lucide-react, next-themes, Recharts, WebGL for the hero effect |
| **i18n and forms** | next-intl, React Hook Form, Zod, TanStack Table, react-markdown with sanitizing |
| **Data and auth** | PostgreSQL (Neon), Prisma 7, Better Auth |
| **Services** | Cloudinary (uploads), Resend (email), Vercel Analytics and Speed Insights |
| **Testing** | Vitest, Testing Library, Playwright, axe |
| **Delivery** | pnpm, Vercel, GitHub Actions, Docker image on GitHub Packages |

## Quality

WCAG 2.2 AA (axe-clean on every page, in both themes and languages), `prefers-reduced-motion` respected, strict CSP, SEO (sitemap, dynamic Open Graph images, JSON-LD), a read-only public API at `/api/v1`, and an encrypted daily database backup.

## Run it

Needs Node.js 24, pnpm 10, and a PostgreSQL database. All commands run from `Frontend/`.

```bash
cd Frontend
pnpm install
cp .env.example .env.local   # set DATABASE_URL, BETTER_AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
pnpm db:migrate && pnpm db:seed
pnpm dev                     # http://localhost:3000 · admin at /admin
```

Or pull the container image (needs a migrated database):

```bash
docker pull ghcr.io/horizonmirza/mirza-portfolio:latest
```

Before pushing: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`.

## Repository

| Path | Contents |
|---|---|
| `Frontend/` | The Next.js app: public site, `/admin`, route handlers, tests |
| `Database/` | Prisma schema, SQL migrations, and CV seed data |
| `Documentation/` | PRD, design, architecture, [deployment & backup](Documentation/DEPLOYMENT.md), workflow, plan |

## License

© Muhammad Mirza Wirya. All rights reserved. Fonts (Oswald, Inter, JetBrains Mono) are under the SIL Open Font License. Skill logos are trademarks of their owners; sources and licenses are in [`Frontend/scripts/skill-logos/SOURCES.md`](Frontend/scripts/skill-logos/SOURCES.md).
