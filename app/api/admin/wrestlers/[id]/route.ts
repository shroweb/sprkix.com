import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
  try {
    const { id } = await params;
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const bio = formData.get("bio") as string | null;
    const file = formData.get("image") as File | null;

    let imageUrl: string | undefined = undefined;

    const imageUrlField = formData.get("imageUrl") as string | null;

    if (
      file &&
      typeof file === "object" &&
      "arrayBuffer" in file &&
      file.size > 0
    ) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${uuid()}-${file.name}`;
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

    const wrestler = await prisma.wrestler.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(wrestler);
  } catch (error) {
    console.error("Error updating wrestler:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
