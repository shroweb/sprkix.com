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
  const { isAdmin, isFoundingMember, isVerified } = await req.json();

  const data: Record<string, boolean> = {};
  if (isAdmin !== undefined) data.isAdmin = !!isAdmin;
  if (isFoundingMember !== undefined) data.isFoundingMember = !!isFoundingMember;
  if (isVerified !== undefined) data.isVerified = !!isVerified;

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { isAdmin: true, isFoundingMember: true, isVerified: true },
  });

  return NextResponse.json({ success: true, ...updated });
}
