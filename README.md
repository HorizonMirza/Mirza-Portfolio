# Muhammad Mirza - Portfolio

Portfolio of Muhammad Mirza with a Super Admin Panel

[![CI](https://github.com/HorizonMirza/Mirza-Portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/HorizonMirza/Mirza-Portfolio/actions/workflows/ci.yml)

**Live:** [mmirza.site](https://mmirza.site) · [Bahasa Indonesia](https://mmirza.site/id) · [English](https://mmirza.site/en)

![Home page of mmirza.site: the name behind the photo, with an armor layer revealed under the cursor](Documentation/screenshots/home.webp)

## Modules

Every module comes in Indonesian and English, dark by default with a light theme, and is built mobile-first.

| Module | What's there |
|---|---|
| **Home** | Name behind the photo with a WebGL armor reveal, experience accordion, projects marquee, skills globe, GitHub contribution graph |
| **About** | Bio, education, and a tilting photo card |
| **Experience** | Timeline of work and organizations, with filters |
| **Projects** | Spotlight list and detail pages (role, tech stack, gallery, demo and code links) |
| **Contact** | Rate-limited form with honeypot and a "message sent" ticket |
| **Privacy** | What the site collects and why |

## Super Admin Highlights

`/admin` is a single owner account (email and password).

- **Editable site text:** one page per module, in both languages, plus the hero photos
- **Content manager:** projects (GitHub import, Cloudinary uploads, draft/published), skills, experience, education
- **Inbox:** contact messages and newsletter subscribers
- **Safe by default:** server-side Zod validation, `SUPER_ADMIN` role check, and an audit log on every action

## Tech Stack

| Layer | Tools |
|---|---|
| **App** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **Data and auth** | PostgreSQL (Neon), Prisma, Better Auth |
| **Services** | Cloudinary, Resend, Vercel |
| **Testing** | Vitest, Playwright, axe |

## Repository

| Path | Contents |
|---|---|
| `Frontend/` | The Next.js app: public site, `/admin`, API, tests |
| `Database/` | Prisma schema, migrations, seed data |
| `Documentation/` | PRD, design, architecture, [deployment & backup](Documentation/DEPLOYMENT.md) |

© Muhammad Mirza Wirya. All rights reserved.
