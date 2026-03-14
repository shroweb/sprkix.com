import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

// POST /api/admin/wrestlers/bulk-update
// body: { updates: [{id, imageUrl, bio}] }
export async function POST(req: NextRequest) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { updates } = await req.json() as {
    updates: { id: string; imageUrl?: string | null; bio?: string | null }[];
  };

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "Provide updates array" }, { status: 400 });
  }

  const results = await Promise.allSettled(
    updates.map(({ id, imageUrl, bio }) =>
      prisma.wrestler.update({
        where: { id },
        data: {
          ...(imageUrl != null ? { imageUrl } : {}),
          ...(bio != null ? { bio } : {}),
        },
        select: { id: true, name: true, imageUrl: true, bio: true },
      }),
    ),
  );

  const saved = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ saved, failed });
}
