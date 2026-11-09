import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { getRecap } from "@lib/recap";

/** Shareable recap image: /api/og/recap?event=<slug>&user=<user slug> */
export async function GET(req: NextRequest) {
  const eventSlug = req.nextUrl.searchParams.get("event") ?? "";
  const userSlug = req.nextUrl.searchParams.get("user") ?? "";
  const user = userSlug ? await prisma.user.findFirst({ where: { OR: [{ slug: userSlug }, { id: userSlug }] }, select: { id: true } }) : null;
  const recap = user ? await getRecap(eventSlug, user.id) : null;
  if (!recap) return new Response("Not found", { status: 404 });

  const pct = Math.round((recap.correct / recap.total) * 100);
  const tone = recap.perfect ? "#34d399" : pct >= 50 ? "#facc15" : "#fb7185";
  const line = (label: string, text: string) => (
    <div style={{ display: "flex", flexDirection: "column", marginTop: 18 }}>
      <div style={{ display: "flex", fontSize: 20, color: "#94a3b8", letterSpacing: 4, textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: "#fff" }}>{text}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", background: "#070a12", color: "#fff", padding: 64, fontFamily: "sans-serif", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: tone, display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 22, color: tone, letterSpacing: 6, textTransform: "uppercase", fontWeight: 800 }}>
              {recap.perfect ? "Perfect card" : "My predictions"} · {recap.promotion}
            </div>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", marginTop: 12, lineHeight: 1 }}>{recap.eventTitle}</div>
            {recap.bestCall && line("Best call", `${recap.bestCall.picked} (only ${recap.bestCall.communityPct}% agreed)`)}
            {recap.worstMiss && line("Toughest miss", `${recap.worstMiss.picked} (${recap.worstMiss.communityPct}% had them too)`)}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#94a3b8" }}>{recap.userName} · poisonrana.com</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 340, border: `4px solid ${tone}`, marginLeft: 48 }}>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 900, color: tone, lineHeight: 1 }}>{recap.correct}/{recap.total}</div>
          <div style={{ display: "flex", fontSize: 28, color: "#cbd5e1", letterSpacing: 4, textTransform: "uppercase" }}>{pct}% correct</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
