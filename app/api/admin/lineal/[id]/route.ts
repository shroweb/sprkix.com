import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { logAdminAction } from "@lib/admin-log";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of ["isActive", "allowMultiMan", "requireClean"] as const) {
    if (typeof body[k] === "boolean") data[k] = body[k];
  }
  for (const k of ["name", "description", "emoji", "origin"] as const) {
    if (typeof body[k] === "string") data[k] = body[k].trim().slice(0, 500) || (k === "name" ? undefined : null);
  }
  if (Number.isInteger(body.sortOrder)) data.sortOrder = body.sortOrder;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  try {
    const title = await prisma.linealTitle.update({ where: { id }, data });
    await logAdminAction(user.id, "lineal.update", { targetType: "LinealTitle", targetId: id, detail: JSON.stringify(data).slice(0, 300) });
    return NextResponse.json({ success: true, title });
  } catch {
    return NextResponse.json({ error: "Title not found" }, { status: 404 });
  }
}
