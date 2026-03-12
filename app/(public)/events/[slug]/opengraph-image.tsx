import { ImageResponse } from "next/og";
import { prisma } from "@lib/prisma";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: { reviews: { select: { rating: true } } },
  });

  const avgRating = event?.reviews.length
    ? (
        event.reviews.reduce((sum, r) => sum + r.rating, 0) /
        event.reviews.length
      ).toFixed(1)
    : null;

  const title = event?.title?.replace(/–\s*\d{4}.*$/, "").trim() ?? "Event";
  const promotion = event?.promotion ?? "";
  const posterUrl = event?.posterUrl;
  const reviewCount = event?.reviews.length ?? 0;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#09090b",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Poster image blurred background */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "50%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.15,
            filter: "blur(40px)",
          }}
        />
      )}

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, #09090b 45%, transparent 100%)",
        }}
      />

      {/* Poster — right side */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt={title}
          style={{
            position: "absolute",
            right: 60,
            top: "50%",
            transform: "translateY(-50%)",
            width: 280,
            height: 420,
            objectFit: "cover",
            borderRadius: 24,
            boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
          }}
        />
      )}

      {/* Left content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 70px",
          maxWidth: posterUrl ? "680px" : "100%",
          gap: 0,
        }}
      >
        {/* Sprkix brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "#eab308",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ color: "#000", fontSize: 20, fontWeight: 900 }}>
              ★
            </div>
          </div>
          <span
            style={{
              color: "#fff",
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: "-0.5px",
            }}
          >
            sprkix
          </span>
        </div>

        {/* Promotion badge */}
        {promotion && (
          <div
            style={{
              display: "inline-flex",
              background: "#eab308",
              color: "#000",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "6px 14px",
              borderRadius: 8,
              marginBottom: 20,
              width: "fit-content",
            }}
          >
            {promotion}
          </div>
        )}

        {/* Event title */}
        <div
          style={{
            color: "#fff",
            fontSize: title.length > 30 ? 48 : 60,
            fontWeight: 900,
            fontStyle: "italic",
            textTransform: "uppercase",
            letterSpacing: "-2px",
            lineHeight: 0.9,
            marginBottom: 28,
          }}
        >
          {title}
        </div>

        {/* Date */}
        {event?.date && (
          <div
            style={{
              color: "#71717a",
              fontSize: 16,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: avgRating ? 28 : 0,
            }}
          >
            {new Date(event.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        )}

        {/* Rating */}
        {avgRating && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(234,179,8,0.1)",
                border: "1px solid rgba(234,179,8,0.3)",
                borderRadius: 12,
                padding: "10px 18px",
              }}
            >
              <span style={{ color: "#eab308", fontSize: 22 }}>★</span>
              <span
                style={{
                  color: "#eab308",
                  fontSize: 32,
                  fontWeight: 900,
                  fontStyle: "italic",
                }}
              >
                {avgRating}
              </span>
              <span style={{ color: "#52525b", fontSize: 16, fontWeight: 700 }}>
                / 5.0
              </span>
            </div>
            <span style={{ color: "#52525b", fontSize: 14, fontWeight: 700 }}>
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </span>
          </div>
        )}
      </div>
    </div>,
    { ...size },
  );
}
