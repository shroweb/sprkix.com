// Discord webhook alerts for community activity. The webhook URL is a secret
// (DISCORD_WEBHOOK_URL) — it is never hardcoded or logged.
import { getSiteUrl } from "@lib/seo";

interface DiscordEmbed {
  title: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp?: string;
}

const AMBER = 0xfbbf24;
const GREEN = 0x34d399;

/** Strip anything that could ping @everyone / roles or break out of Discord markdown. */
function clean(text: string, max: number) {
  const t = text.replace(/[@`*_~|>]/g, "").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

async function post(embed: DiscordEmbed) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Poison Rana",
        embeds: [{ ...embed, timestamp: new Date().toISOString() }],
        allowed_mentions: { parse: [] },
      }),
      // Alerts must never slow down or break the user-facing request.
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) console.error(`[discord] webhook responded ${res.status}`);
  } catch (err) {
    console.error("[discord] webhook failed:", err instanceof Error ? err.message : err);
  }
}

export async function notifyNewUser(user: { name: string | null; slug: string }, method: "email" | "google" | "facebook") {
  await post({
    title: "🎉 New member",
    description: `**${clean(user.name || "Unknown", 60)}** just joined`,
    url: `${getSiteUrl()}/users/${user.slug}`,
    color: GREEN,
    fields: [{ name: "Signed up with", value: method, inline: true }],
  });
}

export async function notifyNewReview(review: {
  userName: string | null;
  userSlug: string;
  eventTitle: string;
  eventSlug: string;
  rating: number | null;
  comment: string | null;
}) {
  await post({
    title: `⭐ New review: ${clean(review.eventTitle, 120)}`,
    description: review.comment ? clean(review.comment, 300) : undefined,
    url: `${getSiteUrl()}/events/${review.eventSlug}`,
    color: AMBER,
    fields: [
      { name: "By", value: clean(review.userName || "Unknown", 60), inline: true },
      ...(review.rating ? [{ name: "Rating", value: `${review.rating} / 5`, inline: true }] : []),
    ],
  });
}

export async function notifyLinealChange(change: {
  titleName: string;
  titleSlug: string;
  emoji: string | null;
  from: string | null;
  to: string;
}) {
  await post({
    title: `${change.emoji ?? "👑"} Lineal title changed: ${clean(change.titleName, 100)}`,
    description: change.from
      ? `**${clean(change.to, 60)}** beat **${clean(change.from, 60)}** and is the new lineal holder`
      : `**${clean(change.to, 60)}** is the new lineal holder`,
    url: `${getSiteUrl()}/lineal/${change.titleSlug}`,
    color: AMBER,
  });
}
