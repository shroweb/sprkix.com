// Post-sign-in redirect handling. "next" paths come from query strings and
// cookies, so only same-site absolute paths are ever accepted.

export const POST_AUTH_COOKIE = "post_auth_next";

export function safeNextPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  // Must be a single-slash path: rejects "//evil.com", "/\evil.com", "http://…", "javascript:…"
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}

/** Browser-only: the ?next= param, else the cookie set by the sign-up prompt, else "/". */
export function getClientNext(): string {
  const fromQuery = new URLSearchParams(window.location.search).get("next");
  if (fromQuery) return safeNextPath(fromQuery);
  const match = document.cookie.match(new RegExp(`(?:^|; )${POST_AUTH_COOKIE}=([^;]*)`));
  return safeNextPath(match?.[1]);
}
