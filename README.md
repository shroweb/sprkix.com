# Poison Rana

The web app for Poison Rana — rate shows, write reviews, make predictions, and discuss wrestling.

## Stack

- **Next.js 16** (App Router, Turbopack) + Tailwind CSS
- **Prisma 6** + **Neon Postgres** (via the Neon WebSocket driver adapter)
- Deployed to **Cloudflare Workers** with the OpenNext Cloudflare adapter

## Local development

```bash
pnpm install       # runs prisma generate
pnpm dev           # http://localhost:3000
pnpm test          # vitest unit tests
pnpm lint          # eslint (flat config)
```

Local dev reads secrets from `.dev.vars` (gitignored) and uploads fall back to
`public/uploads/`, served through the same `/media/[...key]` route used in
production, so URLs stay identical.

## Deploying to Cloudflare

```bash
npm run deploy     # opennextjs-cloudflare build && deploy
```

Build-time env:

```bash
NEXT_PUBLIC_SITE_URL=https://poison-rana-site.shrowebdesign.workers.dev \
npm run deploy
```

(`NEXT_PUBLIC_SITE_URL` is baked in at build time — it drives canonical URLs,
social meta, and OAuth redirects. Point it at your real domain when you attach
one.)

Runtime secrets (set once with `wrangler secret put`):

| Secret              | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `DATABASE_URL`      | Neon pooled connection string             |
| `DIRECT_URL`        | Neon direct (non-pooler) connection string|
| `JWT_SECRET`        | Auth token signing                        |
| `CRON_SECRET`       | Cron/admin-setup shared secret            |
| `ADMIN_SETUP_ENABLED`| `"true"` to allow first-admin bootstrap  |
| `ADMIN_SETUP_SECRET`| Secret for `POST /api/setup/admin`        |
| `GOOGLE_CLIENT_ID`  | Optional — Google OAuth                   |
| `GOOGLE_CLIENT_SECRET` | Optional — Google OAuth                |
| `FACEBOOK_APP_ID`   | Optional — Facebook OAuth                 |
| `FACEBOOK_APP_SECRET` | Optional — Facebook OAuth               |
| `RESEND_API_KEY`    | Optional — password reset emails          |
| `TMDB_API_KEY`      | Optional — show import enrichment         |
| `SCRAPER_API_KEY`   | Optional — ScraperAPI for Cagematch fetch |

### Bindings (wrangler.jsonc)

- **R2 `MEDIA_BUCKET`** → `poison-rana-avatars` — user avatars, admin uploads, wrestler images
- **R2 `NEXT_INC_CACHE_R2_BUCKET`** → `poison-rana-cache` — Next.js ISR/data cache

### Admin bootstrap

With zero users in the DB:

```bash
curl -X POST https://<worker>/api/setup/admin \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"...","name":"You","secret":"<ADMIN_SETUP_SECRET>"}'
```

The first registered user becomes admin (`app/api/auth/register`).

## Notes / known limitations on Cloudflare

- **Image optimization** runs through the `IMAGES` Cloudflare Images binding
  declared in `wrangler.jsonc`. It requires Cloudflare Images to be enabled on
  the account; if the binding is missing, deployments fail — remove the `images`
  block and set `images.unoptimized: true` in `next.config.ts` to opt out.
- **Web analytics**: set `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` (from Cloudflare Web
  Analytics) to inject the beacon script. The old `@vercel/analytics` and
  `@vercel/speed-insights` packages were removed — they do nothing on Workers.
- **The nightly Cagematch import** is handled by the `poison-rana-import`
  scheduler worker (`workers/import-scheduler/`) — a Cloudflare cron trigger
  (`0 6 * * *`, daily 06:00 UTC) calls the site's `/api/cron/import-shows`
  route via a service binding, so no CI runner is needed (the old GitHub
  Actions Playwright scraper is retired). Deploy/update it with:
  ```bash
  npx wrangler deploy --config workers/import-scheduler/wrangler.jsonc
  ```
  Its `CRON_SECRET` secret must match the site worker's. Manual trigger:
  `GET https://poison-rana-import.shrowebdesign.workers.dev/?run=1` with
  `Authorization: Bearer <CRON_SECRET>` (`&date=YYYY-MM-DD` for one day,
  `&days=N` for a custom window). Each run imports the last
  `IMPORT_LOOKBACK_DAYS` days (default 3) — the route is idempotent per event,
  so missed or partially-finished days self-heal on the next run. The import
  route itself requires `Authorization: Bearer <CRON_SECRET>` since it
  triggers Cagematch scraping.
  `TMDB_API_KEY` is set on the site worker — imported events get posters
  and descriptions automatically. `SCRAPER_API_KEY` (optional) improves
  Cagematch fetch reliability; without it the route falls back to direct
  fetch + public proxies.
- **Community badges** are awarded by `GET /api/cron/award-badges` (protected
  by `CRON_SECRET`): `ppv_master` (10+ correct predictions), `top_reviewer`
  (5+ reviews), and `founding_member` (joined during the founding window).
  Trigger it on a cron schedule alongside the import scheduler.
- **Auth tokens** are HS256 JWTs signed with `jose` (the old `jsonwebtoken`
  dependency was removed). Existing sessions remain valid.
- **Prisma on the worker** uses `driverAdapters` + the Neon WebSocket pool
  adapter. Do not switch to `PrismaNeonHTTP` — it doesn't support transactions
  (upserts and `$transaction` calls will fail). `lib/prisma.ts` exposes a
  per-request client through a Proxy + React `cache()`: a single global client
  crashes Workers with “Cannot perform I/O on behalf of a different request”.
- `middleware.ts` keeps the deprecated filename because OpenNext requires
  edge middleware; Next 16's `proxy.ts` forces the Node runtime, which the
  adapter doesn't support yet.
