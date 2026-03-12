import { NextRequest, NextResponse } from "next/server";
import { getUserFromServerCookie } from "../../../../../lib/server-auth";
import { fetchCagematchEventInfo } from "../../../../../lib/cagematch-info";

export async function POST(req: NextRequest) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await req.json();
    if (!url)
      return NextResponse.json({ error: "URL is required" }, { status: 400 });

    const info = await fetchCagematchEventInfo(url);
    return NextResponse.json(info);
  } catch (error: any) {
    console.error("Error fetching Cagematch event info:", error);
    return NextResponse.json(
      { error: "Failed to fetch event info" },
      { status: 500 },
    );
  }
}
