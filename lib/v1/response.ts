import { NextResponse, NextRequest } from "next/server";

type Meta = {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export function ok(data: unknown, meta?: Meta, status = 200) {
  return NextResponse.json(
    { data, error: null, ...(meta ? { meta } : {}) },
    { status, headers: CORS_HEADERS }
  );
}

export function err(message: string, status = 400) {
  return NextResponse.json(
    { data: null, error: message },
    { status, headers: CORS_HEADERS }
  );
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

type RouteHandler = (req: NextRequest, ctx?: any) => Promise<NextResponse>;

/**
 * Wrap a route handler so auth errors thrown by requireAuth() are caught cleanly.
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ctx?: any) => {
    try {
      return await handler(req, ctx);
    } catch (e: any) {
      if (e?.status && e?.message) {
        return err(e.message, e.status);
      }
      console.error("[v1 API error]", e);
      return err("Internal server error", 500);
    }
  };
}
