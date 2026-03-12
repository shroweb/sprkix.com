import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const bio = formData.get("bio") as string | null;
    const file = formData.get("image") as File | null;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

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

    const wrestler = await prisma.wrestler.create({
      data: {
        name,
        slug,
        bio: bio || undefined,
        imageUrl,
      },
    });

    return NextResponse.json({ success: true, wrestler });
  } catch (error) {
    console.error("Error adding wrestler:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
