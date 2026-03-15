import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { revalidatePath } from "next/cache";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { title, slug, date, promotion, venue, city, attendance, network, wikiUrl, aewUrl, posterUrl, description, type, startTime, endTime, currentMatchOrder, enableWatchParty, enablePredictions } = body;

  try {
    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(promotion !== undefined && { promotion }),
        ...(venue !== undefined && { venue }),
        ...(city !== undefined && { city }),
        ...(attendance !== undefined && { attendance: attendance ? parseInt(attendance.toString()) : null }),
        ...(network !== undefined && { network }),
        ...(wikiUrl !== undefined && { wikiUrl }),
        ...(aewUrl !== undefined && { aewUrl }),
        ...(posterUrl !== undefined && { posterUrl }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
        ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
        ...(currentMatchOrder !== undefined && { currentMatchOrder: parseInt(currentMatchOrder.toString()) }),
        ...(enableWatchParty !== undefined && { enableWatchParty: !!enableWatchParty }),
        ...(enablePredictions !== undefined && { enablePredictions: !!enablePredictions }),
      },
    });

    revalidatePath("/");
    revalidatePath(`/events/${updated.slug}`);

    return NextResponse.json({ success: true, event: updated });
  } catch (error: any) {
    console.error("❌ Error updating event details:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update event" },
      { status: 500 },
    );
  }
}
