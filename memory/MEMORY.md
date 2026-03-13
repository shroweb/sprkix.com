# sprkix.com Project Memory

## Project Overview
Full-stack Next.js 15 / React 19 app — community platform for professional wrestling events.
Stack: Next.js App Router, TypeScript, Tailwind CSS, Prisma + PostgreSQL (Docker), JWT auth via HTTP-only cookies, TMDB API.

> [!CAUTION]
> **DATABASE SAFETY RULE**: Never run `prisma db push --force-reset` or any destructive database command on this machine. `.env.local` often points to the LIVE production database via Prisma Accelerate. Always verify connection strings before running migrations.

## Key Paths
- Admin pages: `/app/admin/` (layout, page, events/, wrestlers/, settings/)
- Admin API routes: `/app/api/admin/`
- Public pages: `/app/(public)/`
- Auth util: `/lib/getUserFromServerCookie.ts` (returns user or null; user.isAdmin for admin check)
- DB: `/lib/prisma.ts`, schema at `/prisma/schema.prisma`

## Architecture Notes
- Docker used for PostgreSQL
- JWT stored in HTTP-only cookies (7-day expiry)
- Admin theme applied via `.admin-mode` class on root div (globals.css)
- Primary color: amber `#fbbf24`
- Admin guards: check `user?.isAdmin`, redirect to `/login` if not

## Admin Credentials
- Email: admin@sprkix.com  Password: admin123
- Script: `node prisma/createAdmin.cjs` (re-runnable, idempotent)

## Useful Scripts
- `node prisma/createAdmin.cjs` — create/reset admin account
- `node prisma/seedWrestlers.cjs` — seed 20 wrestlers (idempotent)
- Node path on this machine: `/Users/callummacinnes/.nvm/versions/node/v24.14.0/bin/node`
- Package type is "module" — use `.cjs` extension for CommonJS scripts

## Admin Section — Changes Made (March 2026)
- Created `DELETE` + `PATCH` API at `/api/admin/wrestlers/[id]/route.ts`
- `add-wrestler` API now returns JSON (not redirect)
- `AdminWrestlersPage.tsx` — fully rewritten: fetch-based add, inline edit panel, working delete, inline messages
- Dashboard (`admin/page.tsx`) — removed dead "Generate Report" button, "View All" → Link, blue→amber colors, added "Site Settings" quick action
- Events page — removed non-functional Filter button
- Settings page — replaced `alert()` with inline success/error messages
- Layout — removed non-functional Bell, shows real user name from cookie
- Auth guards added to `events/page.tsx` and `wrestlers/page.tsx` (redirect to /login if not admin)
