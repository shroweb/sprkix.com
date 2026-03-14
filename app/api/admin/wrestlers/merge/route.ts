import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

// POST /api/admin/wrestlers/merge
// body: { keepId: string, mergeId: string }
// - Reassigns all MatchParticipant records from mergeId → keepId (skips if keepId already in that match)
// - Moves aliases from mergeId to keepId (no duplicates)
// - Adds the merged wrestler's name as an alias on keepId
// - Deletes the mergeId wrestler

export async function POST(req: NextRequest) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { keepId, mergeId } = await req.json();
  if (!keepId || !mergeId || keepId === mergeId) {
    return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
  }

  const [keepWrestler, mergeWrestler] = await Promise.all([
    prisma.wrestler.findUnique({ where: { id: keepId } }),
    prisma.wrestler.findUnique({ where: { id: mergeId } }),
  ]);
  if (!keepWrestler || !mergeWrestler) {
    return NextResponse.json({ error: "Wrestler not found" }, { status: 404 });
  }

  // Reassign participants
  const mergeParticipants = await prisma.matchParticipant.findMany({ where: { wrestlerId: mergeId } });
  for (const mp of mergeParticipants) {
    const conflict = await prisma.matchParticipant.findFirst({
      where: { matchId: mp.matchId, wrestlerId: keepId },
    });
    if (conflict) {
      await prisma.matchParticipant.delete({ where: { id: mp.id } });
    } else {
      await prisma.matchParticipant.update({ where: { id: mp.id }, data: { wrestlerId: keepId } });
    }
  }

  // Move aliases
  const [keepAliases, mergeAliases] = await Promise.all([
    prisma.wrestlerAlias.findMany({ where: { wrestlerId: keepId } }),
    prisma.wrestlerAlias.findMany({ where: { wrestlerId: mergeId } }),
  ]);

  const existingNames = new Set([
    keepWrestler.name.toLowerCase(),
    ...keepAliases.map((a) => a.alias.toLowerCase()),
  ]);

  // Add merged wrestler's primary name as alias
  if (!existingNames.has(mergeWrestler.name.toLowerCase())) {
    await prisma.wrestlerAlias.create({ data: { alias: mergeWrestler.name, wrestlerId: keepId } });
    existingNames.add(mergeWrestler.name.toLowerCase());
  }

  // Add merged aliases
  for (const ma of mergeAliases) {
    if (!existingNames.has(ma.alias.toLowerCase())) {
      await prisma.wrestlerAlias.create({ data: { alias: ma.alias, wrestlerId: keepId } });
      existingNames.add(ma.alias.toLowerCase());
    }
  }

  // Delete merged wrestler (aliases cascade)
  await prisma.wrestler.delete({ where: { id: mergeId } });

  return NextResponse.json({ success: true, kept: keepWrestler.name, removed: mergeWrestler.name });
}
