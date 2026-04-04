type EventPostPayload = {
  title: string;
  slug: string;
  promotion?: string | null;
};

const DEFAULT_SITE_URL = "https://poisonrana.com";

function getWebhookUrl() {
  return (process.env.IFTTT_NEW_EVENT_WEBHOOK_URL || "").trim();
}

function buildEventUrl(slug: string) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
  return `${siteUrl}/events/${slug}`;
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
      value1: payload.title,
      value2: buildEventUrl(payload.slug),
      value3: payload.promotion || "New event",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`IFTTT event webhook failed: ${response.status} ${await response.text()}`);
  }
}
