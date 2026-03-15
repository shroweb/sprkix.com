import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function middleware(req: NextRequest) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  // For API routes: if the request includes an Authorization: Bearer <token> header,
  // inject it as a cookie so getUserFromServerCookie() works transparently across
  // all 56+ existing route handlers — no changes needed to any of them.
  const authHeader = req.headers.get("Authorization");
  if (req.nextUrl.pathname.startsWith("/api/") && authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const requestHeaders = new Headers(req.headers);
      const existingCookies = req.headers.get("cookie") || "";
      const tokenCookie = `token=${token}`;
      requestHeaders.set(
        "cookie",
        existingCookies ? `${existingCookies}; ${tokenCookie}` : tokenCookie,
      );
      const res = NextResponse.next({ request: { headers: requestHeaders } });
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
  }

  const res = NextResponse.next();
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
