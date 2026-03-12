import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../../../../lib/server-auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; aliasId: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { aliasId } = await params;
  await prisma.promotionAlias.delete({ where: { id: aliasId } });
  return NextResponse.json({ success: true });
}
