import { prisma } from "@lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDataUrl(value: string) {
  const match = value.match(/^data:([^;,]+)?(;base64)?,([\s\S]*)$/);
  if (!match) return null;

  const mimeType = match[1] || "application/octet-stream";
  const isBase64 = !!match[2];
  const payload = match[3] || "";

  try {
    const buffer = isBase64
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload), "utf8");
    return { mimeType, buffer };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const fallbackUrl = new URL("/favicon.ico", req.url);

  try {
    const row = await (prisma as any).siteConfig
      ?.findUnique({
        where: { key: "FAVICON" },
        select: { value: true },
      })
      .catch(() => null);

    const value = row?.value?.trim();
    if (!value) {
      return NextResponse.redirect(fallbackUrl);
    }

    const dataUrl = parseDataUrl(value);
    if (dataUrl) {
      return new NextResponse(dataUrl.buffer, {
        headers: {
          "Content-Type": dataUrl.mimeType,
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // If the admin entered a normal URL, redirect the browser to it.
    if (/^https?:\/\//i.test(value) || value.startsWith("/")) {
      const target = value.startsWith("/") ? new URL(value, req.url).toString() : value;
      return NextResponse.redirect(target);
    }
  } catch (error) {
    console.error("[site/favicon] failed to serve favicon:", error);
  }

  return NextResponse.redirect(fallbackUrl);
}
