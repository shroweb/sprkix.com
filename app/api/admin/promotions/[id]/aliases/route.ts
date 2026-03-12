import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../../../lib/server-auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { fullName } = await req.json();
  if (!fullName)
    return NextResponse.json({ error: "fullName required" }, { status: 400 });

  const alias = await prisma.promotionAlias.create({
    data: { fullName: fullName.trim(), promotionId: id },
  });
  return NextResponse.json(alias);
}
