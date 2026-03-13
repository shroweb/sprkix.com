import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { findEventOnTMDB } from "@lib/tmdb";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function POST(req: NextRequest) {
    const user = await getUserFromServerCookie();
    if (!user?.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
        return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    try {
        const metadata = await findEventOnTMDB(event.title);
        
        if (!metadata) {
            return NextResponse.json({ error: "No matching metadata found on TMDB" }, { status: 404 });
        }

        // Always overwrite with fresh TMDB data so broken/404 images get replaced
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                ...(metadata.posterUrl && { posterUrl: metadata.posterUrl }),
                ...(metadata.description && { description: metadata.description }),
            }
        });

        return NextResponse.json({ success: true, updatedEvent, matchedTitle: metadata.matchedTitle });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
