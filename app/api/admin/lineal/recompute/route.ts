import { NextResponse } from "next/server";
import { getUserFromServerCookie } from "@lib/server-auth";
import { recomputeAllLinealTitles } from "@lib/lineal-data";

export async function POST() {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ success: true, results: await recomputeAllLinealTitles() });
}
