import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { revalidatePath } from "next/cache";

export async function PATCH(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, avatarUrl, favoritePromotion, slug, profileThemeEventId, needsUsernameSetup } = body;

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json(
      { error: "Name cannot be empty" },
      { status: 400 },
    );
  }

  if (slug !== undefined) {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    if (!cleanSlug) {
      return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
    }
    
    // Check if slug is taken by someone else
    const existing = await prisma.user.findFirst({
      where: { 
        slug: cleanSlug,
        id: { not: user.id }
      }
    });
    if (existing) {
      return NextResponse.json({ error: "Handle is already taken" }, { status: 400 });
    }
  }

  const data: any = {};
  if (name !== undefined) data.name = name.trim();
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
  if (slug !== undefined) data.slug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  if (favoritePromotion !== undefined)
    data.favoritePromotion = favoritePromotion;
  if (needsUsernameSetup !== undefined) data.needsUsernameSetup = needsUsernameSetup;
  if (profileThemeEventId !== undefined)
    data.profileThemeEventId = profileThemeEventId;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
  });

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return NextResponse.json({
    success: true,
    name: updated.name,
    avatarUrl: updated.avatarUrl,
  });
}
