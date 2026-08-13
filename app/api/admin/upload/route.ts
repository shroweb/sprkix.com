import { prisma } from "@lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromServerCookie } from "@lib/server-auth";
import { v4 as uuidv4 } from "uuid";
import { r2Put } from "@lib/r2";

export const runtime = "nodejs";

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

    const results = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = file.name
        .replace(/[/\\?%*:|"<>\x00-\x1F]/g, "_")
        .replace(/\s+/g, "-");
      const uniqueName = `${uuidv4()}-${safeName}`;
      const url = await r2Put(
        `admin/${uniqueName}`,
        buffer,
        file.type || "application/octet-stream",
      );

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

    return NextResponse.json(results.length === 1 ? results[0] : results);
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error.message || String(error) },
      { status: 500 },
    );
  }
}
