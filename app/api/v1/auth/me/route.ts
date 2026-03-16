import { NextRequest } from "next/server";
import { requireAuth } from "@lib/v1/auth";
import { ok, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);
  return ok(user);
});
