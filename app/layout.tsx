import "./globals.css";

import { prisma } from "@lib/prisma";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export async function generateMetadata() {
  let siteName = "Poison Rana";
  let tagline = "Discover. Rate. Share Pro Wrestling Events.";
  let description = "The authoritative community archive for professional wrestling.";

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
    title: {
      template: `%s | ${siteName}`,
      default: `${siteName} | ${tagline}`,
    },
    description,
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
