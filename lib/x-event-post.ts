import { createHmac, randomBytes } from "node:crypto";

type EventPostPayload = {
  title: string;
  slug: string;
  promotion?: string | null;
};

const X_TWEET_ENDPOINT = "https://api.twitter.com/2/tweets";
const DEFAULT_SITE_URL = "https://poisonrana.com";
const TWEET_MAX_LENGTH = 280;
const SHORTENED_URL_LENGTH = 23;

function percentEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function buildSigningKey(consumerSecret: string, tokenSecret: string) {
  return `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
}

function normalizeParams(params: Record<string, string>) {
  return Object.entries(params)
    .map(([key, value]) => [percentEncode(key), percentEncode(value)] as const)
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey === rightKey) return leftValue.localeCompare(rightValue);
      return leftKey.localeCompare(rightKey);
    })
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function buildOAuthHeader(params: Record<string, string>) {
  const headerValue = Object.entries(params)
    .map(([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`)
    .join(", ");

  return `OAuth ${headerValue}`;
}

function getCredentials() {
  const apiKey = process.env.X_API_KEY || "";
  const apiSecret = process.env.X_API_SECRET || "";
  const accessToken = process.env.X_ACCESS_TOKEN || "";
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET || "";

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    return null;
  }

  return {
    apiKey,
    apiSecret,
    accessToken,
    accessTokenSecret,
  };
}

function buildEventUrl(slug: string) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
  return `${siteUrl}/events/${slug}`;
}

function buildTweetText({ title, slug, promotion }: EventPostPayload) {
  const url = buildEventUrl(slug);
  const introPrefix = promotion?.trim() ? `${promotion.trim()}: ` : "New event: ";
  const cta = "Review it on Sprkix:";
  const fixedLength = introPrefix.length + cta.length + 2 + SHORTENED_URL_LENGTH + 2;
  const maxTitleLength = Math.max(0, TWEET_MAX_LENGTH - fixedLength);
  const trimmedTitle =
    title.length > maxTitleLength
      ? `${title.slice(0, Math.max(0, maxTitleLength - 1)).trimEnd()}…`
      : title;

  return `${introPrefix}${trimmedTitle}\n${cta}\n${url}`;
}

export async function postNewEventToX(payload: EventPostPayload) {
  const credentials = getCredentials();
  if (!credentials) return;

  const body = JSON.stringify({
    text: buildTweetText(payload),
  });

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.accessToken,
    oauth_version: "1.0",
  };

  const signatureBaseString = [
    "POST",
    percentEncode(X_TWEET_ENDPOINT),
    percentEncode(normalizeParams(oauthParams)),
  ].join("&");

  oauthParams.oauth_signature = createHmac(
    "sha1",
    buildSigningKey(credentials.apiSecret, credentials.accessTokenSecret),
  )
    .update(signatureBaseString)
    .digest("base64");

  const response = await fetch(X_TWEET_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: buildOAuthHeader(oauthParams),
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`X post failed: ${response.status} ${await response.text()}`);
  }
}
