import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { isAdmin } = await req.json();

  const updated = await prisma.user.update({
    where: { id },
    data: { isAdmin: !!isAdmin },
  });

  return NextResponse.json({ success: true, isAdmin: updated.isAdmin });
}
