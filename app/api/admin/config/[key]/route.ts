import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key } = await params;
  const { value } = await req.json();

  const updated = await prisma.siteConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });

  return NextResponse.json({ success: true, value: updated.value });
}
