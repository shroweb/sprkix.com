import { ImageResponse } from "next/og";
import { prisma } from "@lib/prisma";
import { calcRankScore, getRank, RANKS } from "@lib/ranks";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Poison Rana profile";

// One accent per rank tier, low → high (matches RANKS order).
const RANK_COLORS = ["#71717a", "#a1a1aa", "#94a3b8", "#60a5fa", "#a78bfa", "#fbbf24", "#facc15", "#fbbf24", "#fbbf24", "#fbbf24"];

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await prisma.user.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    select: { id: true, name: true, slug: true, avatarUrl: true },
  });

  let stats = { ratings: 0, reviews: 0, predictions: 0, correct: 0, resolved: 0, submissions: 0 };
  if (user) {
    const [ratings, reviews, predictions, correct, resolved, submissions] = await Promise.all([
      prisma.matchRating.count({ where: { userId: user.id } }),
      prisma.review.count({ where: { userId: user.id } }),
      prisma.prediction.count({ where: { userId: user.id } }),
      prisma.prediction.count({ where: { userId: user.id, isCorrect: true } }),
      prisma.prediction.count({ where: { userId: user.id, isCorrect: { not: null } } }),
      prisma.eventSubmission.count({ where: { userId: user.id, status: "approved" } }),
    ]);
    stats = { ratings, reviews, predictions, correct, resolved, submissions };
  }

  const rank = getRank(calcRankScore(stats.ratings, stats.reviews, stats.predictions, stats.submissions));
  const accent = RANK_COLORS[Math.max(0, RANKS.findIndex((r) => r.name === rank.name))];
  const accuracy = stats.resolved > 0 ? `${Math.round((stats.correct / stats.resolved) * 100)}%` : "–";
  const name = user?.name || "Poison Rana";
  const avatar = user?.avatarUrl?.startsWith("http") ? user.avatarUrl : null;

  const tiles: [string, string][] = [
    [accuracy, "Prediction accuracy"],
    [String(stats.correct), "Correct picks"],
    [String(stats.reviews), "Reviews"],
    [String(stats.ratings), "Match ratings"],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0b10",
          padding: "64px 72px",
          borderTop: "6px solid #fbbf24",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "36px" }}>
          {avatar ? (
            <img
              src={avatar}
              alt=""
              width={160}
              height={160}
              style={{ borderRadius: "80px", border: `4px solid ${accent}`, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "160px",
                height: "160px",
                borderRadius: "80px",
                border: `4px solid ${accent}`,
                backgroundColor: "#1a1b23",
                color: accent,
                fontSize: "72px",
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "68px", fontWeight: 900, color: "#ffffff", lineHeight: 1.05 }}>
              {name.length > 22 ? `${name.slice(0, 21)}…` : name}
            </div>
            <div style={{ fontSize: "34px", fontWeight: 800, color: accent, marginTop: "10px", textTransform: "uppercase", letterSpacing: "3px" }}>
              {rank.name}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px" }}>
          {tiles.map(([value, label]) => (
            <div
              key={label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "26px 28px",
                borderRadius: "20px",
                backgroundColor: "#14151c",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: "64px", fontWeight: 900, color: "#fbbf24" }}>{value}</div>
              <div style={{ fontSize: "22px", color: "#9ca3af", marginTop: "4px" }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280", fontSize: "26px", fontWeight: 700 }}>
          <span>POISON RANA</span>
          <span>poisonrana.com/users/{user?.slug ?? slug}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
