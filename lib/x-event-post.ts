type EventPostPayload = {
  title: string;
  slug: string;
  promotion?: string | null;
  posterUrl?: string | null;
};

const DEFAULT_SITE_URL = "https://poisonrana.com";

function getWebhookUrl() {
  return (process.env.IFTTT_NEW_EVENT_WEBHOOK_URL || "").trim();
}

function buildEventUrl(slug: string) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
  return `${siteUrl}/events/${slug}`;
}

function buildEventImageUrl({ title, promotion, posterUrl }: EventPostPayload) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");

  if (posterUrl?.startsWith("http://") || posterUrl?.startsWith("https://")) {
    return posterUrl;
  }

  if (posterUrl?.startsWith("/")) {
    return `${siteUrl}${posterUrl}`;
  }

  const params = new URLSearchParams({
    title,
    ...(promotion?.trim() ? { promotion: promotion.trim() } : {}),
  });

  return `${siteUrl}/api/og?${params.toString()}`;
}

export async function postNewEventToX(payload: EventPostPayload) {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) return;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      value1: payload.promotion?.trim() ? `${payload.promotion.trim()}: ${payload.title}` : payload.title,
      value2: buildEventUrl(payload.slug),
      value3: buildEventImageUrl(payload),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`IFTTT event webhook failed: ${response.status} ${await response.text()}`);
  }
}
