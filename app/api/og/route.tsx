import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "Poison Rana";
  const promotion = searchParams.get("promotion") || "";
  const year = searchParams.get("year") || "";
  const poster = searchParams.get("poster") || ""; // must be absolute https URL

  // Only pass poster to img if it's a real https URL (not base64)
  const useImage = poster.startsWith("https://") || poster.startsWith("http://");

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background: "#0a0b10",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        {/* Poster image as blurred background */}
        {useImage && (
          <img
            src={poster}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.25,
              filter: "blur(12px)",
            }}
          />
        )}

        {/* Dark gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(10,11,16,0.97) 0%, rgba(10,11,16,0.75) 60%, rgba(251,191,36,0.08) 100%)",
            display: "flex",
          }}
        />

        {/* Amber glow bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Left: poster image */}
        {useImage && (
          <div
            style={{
              position: "absolute",
              right: "60px",
              top: "125px",
              width: "280px",
              height: "380px",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 0 60px rgba(251,191,36,0.2), 0 32px 64px rgba(0,0,0,0.6)",
              display: "flex",
            }}
          >
            <img
              src={poster}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}

        {/* Content */}
        <div
          style={{
            position: "absolute",
            left: "60px",
            top: "90px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: useImage ? "720px" : "1080px",
          }}
        >
          {/* Site badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "4px",
                height: "28px",
                background: "#fbbf24",
                borderRadius: "2px",
                display: "flex",
              }}
            />
            <span
              style={{
                color: "#fbbf24",
                fontSize: "16px",
                fontWeight: 900,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              POISON RANA
            </span>
          </div>

          {/* Promotion + year pill */}
          {(promotion || year) && (
            <div
              style={{
                display: "inline-flex",
                background: "rgba(251,191,36,0.1)",
                border: "1px solid rgba(251,191,36,0.3)",
                borderRadius: "999px",
                padding: "6px 18px",
                color: "#fbbf24",
                fontSize: "15px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                width: "fit-content",
              }}
            >
              {[promotion, year].filter(Boolean).join(" · ")}
            </div>
          )}

          {/* Event title */}
          <div
            style={{
              color: "#ffffff",
              fontSize: title.length > 30 ? "52px" : "64px",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              fontStyle: "italic",
            }}
          >
            {title}
          </div>

          {/* Tagline */}
          <div
            style={{
              color: "rgba(248,250,252,0.45)",
              fontSize: "18px",
              fontWeight: 600,
              fontStyle: "italic",
              letterSpacing: "0.04em",
            }}
          >
            Rate · Review · Discuss at poisonrana.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
