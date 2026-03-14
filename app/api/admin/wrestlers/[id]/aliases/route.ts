import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

// GET  /api/admin/wrestlers/[id]/aliases  — list aliases
export async function GET(_req: NextRequest, { params }: { params: any }) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const aliases = await prisma.wrestlerAlias.findMany({ where: { wrestlerId: id }, orderBy: { alias: "asc" } });
  return NextResponse.json({ aliases });
}

// POST /api/admin/wrestlers/[id]/aliases  — add an alias  { alias: string }
export async function POST(req: NextRequest, { params }: { params: any }) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { alias } = await req.json();
  if (!alias?.trim()) return NextResponse.json({ error: "Alias required" }, { status: 400 });
  const created = await prisma.wrestlerAlias.create({ data: { alias: alias.trim(), wrestlerId: id } });
  return NextResponse.json({ alias: created }, { status: 201 });
}

// DELETE /api/admin/wrestlers/[id]/aliases  — remove by aliasId  { aliasId: string }
export async function DELETE(req: NextRequest, { params }: { params: any }) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { aliasId } = await req.json();
  await prisma.wrestlerAlias.deleteMany({ where: { id: aliasId, wrestlerId: id } });
  return NextResponse.json({ success: true });
}
