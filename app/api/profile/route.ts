import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { revalidatePath } from "next/cache";

export async function PATCH(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, avatarUrl, favoritePromotion } = body;

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json(
      { error: "Name cannot be empty" },
      { status: 400 },
    );
  }

  const data: any = {};
  if (name !== undefined) data.name = name.trim();
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
  if (favoritePromotion !== undefined)
    data.favoritePromotion = favoritePromotion;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
  });

  revalidatePath("/profile");
  return NextResponse.json({
    success: true,
    name: updated.name,
    avatarUrl: updated.avatarUrl,
  });
}
