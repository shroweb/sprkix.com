import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Delete Event]", err);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 },
    );
  }
}
