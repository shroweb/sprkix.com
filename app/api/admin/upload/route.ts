import { prisma } from "@lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromServerCookie } from "@lib/server-auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const results = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      // Sanitize: strip path separators/dangerous chars before writing to disk
      const safeName = require("path").basename(file.name).replace(/[/\\?%*:|"<>\x00-\x1F]/g, "_").replace(/\s+/g, "-");
      const uniqueName = `${uuidv4()}-${safeName}`;
      const path = join(uploadDir, uniqueName);
      await writeFile(path, buffer);
      const url = `/uploads/${uniqueName}`;

      // Record in DB
      const media = await prisma.mediaItem.create({
        data: {
          filename: file.name,
          url,
          mimeType: file.type || null,
          size: file.size || null,
          uploadedBy: user.id,
        },
      });
      results.push(media);
    }

    return NextResponse.json(
      results.length === 1 ? results[0] : results,
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
