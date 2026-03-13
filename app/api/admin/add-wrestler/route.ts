import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../lib/server-auth";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

/** Strip path separators and dangerous chars from uploaded filenames */
function sanitizeFilename(name: string): string {
  return path.basename(name).replace(/[/\\?%*:|"<>\x00-\x1F]/g, "_");
}

export async function POST(req: NextRequest) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const bio = formData.get("bio") as string | null;
    const file = formData.get("image") as File | null;

    if (!name || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let imageUrl: string | undefined = undefined;
    const imageUrlField = formData.get("imageUrl") as string | null;

    if (file && typeof file === "object" && "arrayBuffer" in file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${uuid()}-${sanitizeFilename(file.name)}`;
      const filepath = path.join(process.cwd(), "public/uploads", filename);
      await writeFile(filepath, buffer);
      imageUrl = `/uploads/${filename}`;
    } else if (imageUrlField) {
      imageUrl = imageUrlField;
    }

    const wrestler = await prisma.wrestler.create({
      data: { name, slug, bio: bio || undefined, imageUrl },
    });

    return NextResponse.json({ success: true, wrestler });
  } catch (error) {
    console.error("Error adding wrestler:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
