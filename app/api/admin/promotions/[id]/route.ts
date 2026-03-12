import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../../lib/server-auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.promotion.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
