import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { uniqueWrestlerSlug } from "@lib/slug-utils";

// POST /api/admin/wrestlers/fix-slugs
// Finds wrestlers with timestamp-style slugs (ending in -<13 digits>) and renames them.
export async function POST() {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const all = await prisma.wrestler.findMany({ select: { id: true, name: true, slug: true } });
  const timestampSuffix = /-\d{10,}$/;
  const toFix = all.filter((w) => timestampSuffix.test(w.slug));

  const results: { id: string; oldSlug: string; newSlug: string }[] = [];

  for (const w of toFix) {
    const newSlug = await uniqueWrestlerSlug(w.name, w.id);
    if (newSlug !== w.slug) {
      await prisma.wrestler.update({ where: { id: w.id }, data: { slug: newSlug } });
      results.push({ id: w.id, oldSlug: w.slug, newSlug });
    }
  }

  return NextResponse.json({ fixed: results.length, results });
}
