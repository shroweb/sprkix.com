import Header from "@components/Header";
import Footer from "@components/Footer";
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
  let primaryColor = "";
  let primaryHoverColor = "";
  let socialX = "";
  let socialFacebook = "";
  let socialInstagram = "";
  try {
    const [logoRow, sizeRow, bannerEnabledRow, bannerTextRow, bannerLinkRow, primaryRow, hoverRow, xRow, fbRow, igRow] =
      await Promise.all([
      (prisma as any).siteConfig.findUnique({ where: { key: "SITE_LOGO" } }),
      (prisma as any).siteConfig.findUnique({ where: { key: "LOGO_SIZE" } }),
      (prisma as any).siteConfig.findUnique({ where: { key: "BANNER_ENABLED" } }),
      (prisma as any).siteConfig.findUnique({ where: { key: "BANNER_TEXT" } }),
      (prisma as any).siteConfig.findUnique({ where: { key: "BANNER_LINK" } }),
      (prisma as any).siteConfig.findUnique({ where: { key: "PRIMARY_COLOR" } }),
      (prisma as any).siteConfig.findUnique({ where: { key: "PRIMARY_HOVER_COLOR" } }),
      (prisma as any).siteConfig.findUnique({ where: { key: "SOCIAL_X" } }),
      (prisma as any).siteConfig.findUnique({ where: { key: "SOCIAL_FACEBOOK" } }),
      (prisma as any).siteConfig.findUnique({ where: { key: "SOCIAL_INSTAGRAM" } }),
    ]);
    siteLogo = logoRow?.value || "";
    logoSize = sizeRow?.value || "md";
    bannerEnabled = (bannerEnabledRow?.value || "").toLowerCase() === "true";
    bannerText = bannerTextRow?.value || "";
    bannerLink = bannerLinkRow?.value || "";
    primaryColor = primaryRow?.value || "";
    primaryHoverColor = hoverRow?.value || "";
    socialX = xRow?.value || "";
    socialFacebook = fbRow?.value || "";
    socialInstagram = igRow?.value || "";
  } catch {}

  const cssVars = [
    primaryColor ? `--primary: ${primaryColor};` : "",
    primaryHoverColor ? `--primary-hover: ${primaryHoverColor};` : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      {cssVars && <style>{`:root { ${cssVars} }`}</style>}
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
      <Footer
        siteLogo={siteLogo}
        socialX={socialX}
        socialFacebook={socialFacebook}
        socialInstagram={socialInstagram}
      />
    </>
  );
}
