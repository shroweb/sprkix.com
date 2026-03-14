import { NextRequest, NextResponse } from "next/server";
import { getUserFromServerCookie } from "@lib/server-auth";
import { searchTmdbPeople, getTmdbPerson } from "@lib/tmdb";

async function requireAdmin() {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

// GET /api/admin/tmdb?q=cody+rhodes  — search for people
// GET /api/admin/tmdb?id=12345        — fetch full person detail (image + bio)
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

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

// POST /api/admin/tmdb/bulk
// body: { wrestlers: [{id, name}] }
// Returns top TMDB match for each, with imageUrl + bio pre-fetched
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { wrestlers } = await req.json() as { wrestlers: { id: string; name: string }[] };
  if (!Array.isArray(wrestlers) || wrestlers.length === 0) {
    return NextResponse.json({ error: "Provide wrestlers array" }, { status: 400 });
  }

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const matches: {
    wrestlerId: string;
    wrestlerName: string;
    tmdbId: number | null;
    tmdbName: string | null;
    imageUrl: string | null;
    bio: string | null;
  }[] = [];

  for (const w of wrestlers) {
    try {
      const results = await searchTmdbPeople(w.name);
      if (results.length > 0) {
        const top = results[0];
        const detail = await getTmdbPerson(top.id);
        matches.push({
          wrestlerId: w.id,
          wrestlerName: w.name,
          tmdbId: top.id,
          tmdbName: top.name,
          imageUrl: detail.imageUrl,
          bio: detail.bio,
        });
      } else {
        matches.push({ wrestlerId: w.id, wrestlerName: w.name, tmdbId: null, tmdbName: null, imageUrl: null, bio: null });
      }
    } catch {
      matches.push({ wrestlerId: w.id, wrestlerName: w.name, tmdbId: null, tmdbName: null, imageUrl: null, bio: null });
    }
    // Stay well under TMDB's 40 req/10s limit
    await delay(300);
  }

  return NextResponse.json({ matches });
}
