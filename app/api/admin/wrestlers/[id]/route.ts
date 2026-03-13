import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../../lib/server-auth";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

function sanitizeFilename(name: string): string {
  return path.basename(name).replace(/[/\\?%*:|"<>\x00-\x1F]/g, "_");
}

async function requireAdmin() {
  const user = await getUserFromServerCookie();
  return user?.isAdmin ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    await prisma.wrestler.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting wrestler:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const bio = formData.get("bio") as string | null;
    const file = formData.get("image") as File | null;
    const imageUrlField = formData.get("imageUrl") as string | null;

    let imageUrl: string | undefined = undefined;

    if (file && typeof file === "object" && "arrayBuffer" in file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${uuid()}-${sanitizeFilename(file.name)}`;
      const filepath = path.join(process.cwd(), "public/uploads", filename);
      await writeFile(filepath, buffer);
      imageUrl = `/uploads/${filename}`;
    } else if (imageUrlField) {
      imageUrl = imageUrlField;
    }

    const updateData: Record<string, string | undefined> = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (bio !== null) updateData.bio = bio ?? undefined;
    if (imageUrl) updateData.imageUrl = imageUrl;

    const wrestler = await prisma.wrestler.update({ where: { id }, data: updateData });
    return NextResponse.json(wrestler);
  } catch (error) {
    console.error("Error updating wrestler:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
