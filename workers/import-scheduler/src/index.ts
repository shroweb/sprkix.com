/**
 * Poison Rana — nightly import scheduler
 *
 * Replaces the GitHub Actions Playwright scraper: on a cron trigger, this
 * worker calls the site's `/api/cron/import-shows` route (which scrapes
 * Cagematch server-side and imports into Neon), so no CI runner is needed.
 *
 * The site worker is reached via the `SITE` service binding — direct
 * worker-to-worker fetches to `*.workers.dev` URLs are 404'd by Cloudflare's
 * edge routing.
 *
 * Robustness: each run imports the last `IMPORT_LOOKBACK_DAYS` days (default
 * 3) rather than just yesterday. The import route is idempotent per event
 * (title + date dedupe), so if one invocation dies partway — or a day is
 * missed entirely — the next night's run picks up the remaining events.
 * Scheduled handlers have a 15-minute wall-time cap; the per-day timeout
 * (240s × 3 days = 12 min) stays under it.
 *
 * - `scheduled` → runs the catch-up import automatically
 * - `fetch`     → manual trigger: `?run=1` with `Authorization: Bearer <CRON_SECRET>`
 *                 optional `&date=YYYY-MM-DD` (single day) or `&days=N`
 */
export interface Env {
  CRON_SECRET: string;
  SITE: Fetcher;
  /** How many days back to import each run (including yesterday). Default 3. */
  IMPORT_LOOKBACK_DAYS?: string;
}

const SITE_HOST = "https://poison-rana-site.shrowebdesign.workers.dev";
const DEFAULT_LOOKBACK_DAYS = 3;
const MAX_LOOKBACK_DAYS = 7;
const PER_DAY_TIMEOUT_MS = 240_000; // 4 min per day; 3 days stays under the 15-min cap

function checkAuth(request: Request, env: Env): boolean {
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return !!env.CRON_SECRET && match?.[1] === env.CRON_SECRET;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function runDay(env: Env, date: string) {
  const started = new Date().toISOString();
  const outcome: Record<string, unknown> = { date, started };
  try {
    const res = await env.SITE.fetch(`${SITE_HOST}/api/cron/import-shows?date=${date}`, {
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      signal: AbortSignal.timeout(PER_DAY_TIMEOUT_MS),
    });
    const text = await res.text();
    let body: unknown = null;
    try {
      body = JSON.parse(text);
    } catch {
      /* non-JSON response */
    }
    outcome.status = res.status;
    outcome.body = body;
  } catch (err) {
    outcome.status = "error";
    outcome.error = err instanceof Error ? err.message : String(err);
  }
  outcome.finished = new Date().toISOString();
  return outcome;
}

async function runBadgeAward(env: Env) {
  const started = new Date().toISOString();
  try {
    const res = await env.SITE.fetch(`${SITE_HOST}/api/cron/award-badges`, {
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      signal: AbortSignal.timeout(120_000),
    });
    const text = await res.text();
    let body: unknown = null;
    try {
      body = JSON.parse(text);
    } catch {
      /* non-JSON response */
    }
    return { started, status: res.status, body };
  } catch (err) {
    return {
      started,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function runImport(env: Env, opts: { days?: number; date?: string } = {}) {
  const started = new Date().toISOString();

  let dates: string[];
  if (opts.date) {
    dates = [opts.date];
  } else {
    const lookback = Math.max(
      1,
      Math.min(
        MAX_LOOKBACK_DAYS,
        parseInt(env.IMPORT_LOOKBACK_DAYS || "", 10) ||
          opts.days ||
          DEFAULT_LOOKBACK_DAYS,
      ),
    );
    dates = [];
    const now = new Date();
    for (let i = 1; i <= lookback; i++) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      dates.push(formatDate(d));
    }
  }

  const days = [];
  for (const date of dates) {
    days.push(await runDay(env, date));
  }

  const summary: Record<string, unknown> = {
    started,
    finished: new Date().toISOString(),
    days,
  };
  console.log(`[import-scheduler] ${JSON.stringify(summary)}`);
  return summary;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runImport(env));
    ctx.waitUntil(runBadgeAward(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.searchParams.has("run")) {
      if (!checkAuth(request, env)) {
        return new Response("Unauthorized", { status: 401 });
      }
      const date = url.searchParams.get("date");
      const days = url.searchParams.get("days");
      if (url.searchParams.has("badges")) {
        return Response.json(await runBadgeAward(env));
      }

      return Response.json(
        await runImport(env, {
          ...(date ? { date } : {}),
          ...(days ? { days: parseInt(days, 10) || undefined } : {}),
        }),
      );
    }

    return Response.json({
      ok: true,
      worker: "poison-rana-import",
      schedule: "0 6 * * * (daily 06:00 UTC)",
      lookback: `${env.IMPORT_LOOKBACK_DAYS || DEFAULT_LOOKBACK_DAYS} days`,
      manual: "GET /?run=1 with Authorization: Bearer <CRON_SECRET> (?date=YYYY-MM-DD or ?days=N)",
    });
  },
};
