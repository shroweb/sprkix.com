import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

// PATCH /api/admin/users/[id] - body: { isSuspended?: boolean, isAdmin?: boolean }
export async function PATCH(req: NextRequest, { params }: { params: any }) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { isSuspended, isAdmin } = body;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(isSuspended !== undefined && { isSuspended }),
      ...(isAdmin !== undefined && { isAdmin }),
    },
    select: { id: true, isAdmin: true, isSuspended: true },
  });

  return NextResponse.json({ success: true, user: updated });
}

// DELETE /api/admin/users/[id] - permanently delete user
export async function DELETE(req: NextRequest, { params }: { params: any }) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // Don't allow deleting yourself
  if (id === user.id) return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
