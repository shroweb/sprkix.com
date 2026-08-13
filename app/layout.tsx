import "./globals.css";

import { prisma } from "@lib/prisma";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  let siteName = "Poison Rana";
  let tagline = "Rate, review, rank, and track professional wrestling.";
  let description =
    "Poison Rana is the community archive for professional wrestling: rate events and matches, track predictions, explore rankings, and discover shows across WWE, AEW, NJPW, TNA, ROH, Stardom, and more.";
  const favicon =
    "https://poisonrana.com/media/settings/site-logo-87c0f9ef-6a20-4abe-a05e-f8e6fb258a36.png";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://poisonrana.com";

  try {
    const configs = await (prisma as any).siteConfig.findMany({
      where: { key: { in: ["SITE_TAGLINE", "SITE_DESCRIPTION"] } },
    });
    
    const mapped = configs.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    if (mapped.SITE_TAGLINE) tagline = mapped.SITE_TAGLINE;
    if (mapped.SITE_DESCRIPTION) description = mapped.SITE_DESCRIPTION;
  } catch (e) {
    console.error("Metadata fetch error:", e);
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      template: `%s | ${siteName}`,
      default: `${siteName} | ${tagline}`,
    },
    description,
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: { url: favicon, type: "image/png" },
      shortcut: favicon,
      apple: favicon,
    },
    openGraph: {
      type: "website",
      url: siteUrl,
      siteName,
      title: `${siteName} | ${tagline}`,
      description,
      locale: "en_GB",
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} | ${tagline}`,
      description,
    },
    verification: {
      google: "A_qTq_pCJoyzV7hqoJMfyNVDN5XpNWpU1-7z18pIeWM",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-b from-[#0d1020] to-black text-white min-h-screen">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
