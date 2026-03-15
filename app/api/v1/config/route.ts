import { prisma } from "@lib/prisma";
import { ok, preflight, withErrorHandling } from "@lib/v1/response";
import { NextRequest } from "next/server";

export const OPTIONS = () => preflight();

// Returns public site config (logo, name, etc.) — no auth required
export const GET = withErrorHandling(async (_req: NextRequest) => {
  const rows = await prisma.siteConfig.findMany({
    where: { key: { in: ["SITE_LOGO", "SITE_NAME", "LOGO_SIZE"] } },
  });

  const config: Record<string, string> = {};
  rows.forEach((r) => { config[r.key] = r.value; });

  return ok({
    logoUrl: config["SITE_LOGO"] ?? null,
    siteName: config["SITE_NAME"] ?? "Poison Rana",
    logoSize: config["LOGO_SIZE"] ?? "MD",
  });
});
