import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "Poison Rana";
  const promotion = searchParams.get("promotion") || "";
  const year = searchParams.get("year") || "";
  const poster = searchParams.get("poster") || "";

  const useImage = poster.startsWith("https://") || poster.startsWith("http://");
  const pill = [promotion, year].filter(Boolean).join(" · ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          backgroundColor: "#0a0b10",
          position: "relative",
        }}
      >
        {/* Amber radial glow bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: "0px",
            right: "0px",
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle at 80% 80%, rgba(251,191,36,0.18) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: "0px",
            left: "0px",
            right: "0px",
            height: "4px",
            backgroundColor: "#fbbf24",
            display: "flex",
          }}
        />

        {/* Poster panel */}
        {useImage && (
          <div
            style={{
              position: "absolute",
              right: "60px",
              top: "80px",
              width: "280px",
              height: "400px",
              borderRadius: "12px",
              overflow: "hidden",
              display: "flex",
              border: "1px solid rgba(251,191,36,0.25)",
            }}
          >
            <img
              src={poster}
              width={280}
              height={400}
              style={{ objectFit: "cover" }}
            />
          </div>
        )}

        {/* Text content */}
        <div
          style={{
            position: "absolute",
            left: "60px",
            top: "80px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: useImage ? "780px" : "1080px",
          }}
        >
          {/* Site wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "4px",
                height: "32px",
                backgroundColor: "#fbbf24",
                borderRadius: "2px",
                display: "flex",
              }}
            />
            <span
              style={{
                color: "#fbbf24",
                fontSize: "14px",
                fontWeight: 900,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
              }}
            >
              POISON RANA
            </span>
          </div>

          {/* Promotion · Year pill */}
          {pill ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(251,191,36,0.1)",
                border: "1px solid rgba(251,191,36,0.3)",
                borderRadius: "999px",
                padding: "8px 20px",
                color: "#fbbf24",
                fontSize: "14px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                width: "fit-content",
              }}
            >
              {pill}
            </div>
          ) : null}

          {/* Event title */}
          <div
            style={{
              color: "#ffffff",
              fontSize: title.length > 28 ? "56px" : "72px",
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            {title}
          </div>

          {/* Tagline */}
          <div
            style={{
              color: "rgba(148,163,184,0.8)",
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              marginTop: "8px",
            }}
          >
            Rate · Review · Discuss at poisonrana.com
          </div>
        </div>

        {/* Bottom divider */}
        <div
          style={{
            position: "absolute",
            bottom: "48px",
            left: "60px",
            right: "60px",
            height: "1px",
            backgroundColor: "rgba(255,255,255,0.06)",
            display: "flex",
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
