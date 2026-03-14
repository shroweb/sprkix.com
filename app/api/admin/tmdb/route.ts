import { NextRequest, NextResponse } from "next/server";
import { getUserFromServerCookie } from "@lib/server-auth";
import { searchTmdbPeople, getTmdbPerson } from "@lib/tmdb";

// GET /api/admin/tmdb?q=cody+rhodes  — search for people
// GET /api/admin/tmdb?id=12345        — fetch full person detail (image + bio)
export async function GET(req: NextRequest) {
  const user = await getUserFromServerCookie();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const id = searchParams.get("id");

  try {
    if (id) {
      const person = await getTmdbPerson(Number(id));
      return NextResponse.json(person);
    }
    if (q) {
      const results = await searchTmdbPeople(q);
      return NextResponse.json({ results });
    }
    return NextResponse.json({ error: "Provide ?q or ?id" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
