import Header from "@components/Header";
import GoogleAnalytics from "@components/GoogleAnalytics";
import { getUserFromServerCookie } from "@lib/server-auth";
import { prisma } from "@lib/prisma";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromServerCookie();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  let siteLogo = "";
  let logoSize = "md";
  let bannerEnabled = false;
  let bannerText = "";
  let bannerLink = "";
  try {
    const [logoRow, sizeRow, bannerEnabledRow, bannerTextRow, bannerLinkRow] =
      await Promise.all([
      (prisma as any).siteConfig.findUnique({ where: { key: "SITE_LOGO" } }),
      (prisma as any).siteConfig.findUnique({ where: { key: "LOGO_SIZE" } }),
      (prisma as any).siteConfig.findUnique({ where: { key: "BANNER_ENABLED" } }),
      (prisma as any).siteConfig.findUnique({ where: { key: "BANNER_TEXT" } }),
      (prisma as any).siteConfig.findUnique({ where: { key: "BANNER_LINK" } }),
    ]);
    siteLogo = logoRow?.value || "";
    logoSize = sizeRow?.value || "md";
    bannerEnabled = (bannerEnabledRow?.value || "").toLowerCase() === "true";
    bannerText = bannerTextRow?.value || "";
    bannerLink = bannerLinkRow?.value || "";
  } catch {}

  return (
    <>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      <Header
        user={user}
        siteLogo={siteLogo}
        logoSize={logoSize}
        bannerEnabled={bannerEnabled}
        bannerText={bannerText}
        bannerLink={bannerLink}
      />
      <main
        className={`max-w-7xl mx-auto px-4 sm:px-6 pb-10 ${
          bannerEnabled && bannerText.trim() ? "pt-40" : "pt-28"
        }`}
      >
        {children}
      </main>
      <footer className="mt-16 border-t border-white/5 text-center py-10 px-4 max-w-7xl mx-auto space-y-4">
        <p className="text-[10px] sm:text-xs text-muted-foreground/60 uppercase tracking-widest font-black italic">
          © {new Date().getFullYear()} Poison Rana · The definitive wrestling archive
        </p>
        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
          Developed by{" "}
          <a
            href="https://shroweb.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline hover:text-primary/80 transition-all"
          >
            Shro Web
          </a>
        </p>
      </footer>
    </>
  );
}
