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
    const rows = await (prisma as any).siteConfig.findMany({
      where: {
        key: {
          in: [
            "SITE_LOGO",
            "LOGO_SIZE",
            "BANNER_ENABLED",
            "BANNER_TEXT",
            "BANNER_LINK",
            "PRIMARY_COLOR",
            "PRIMARY_HOVER_COLOR",
            "SOCIAL_X",
            "SOCIAL_FACEBOOK",
            "SOCIAL_INSTAGRAM",
          ],
        },
      },
      select: { key: true, value: true },
    });
    const mapped = rows.reduce(
      (acc: Record<string, string>, row: { key: string; value: string }) => {
        acc[row.key] = row.value;
        return acc;
      },
      {} as Record<string, string>,
    );

    siteLogo = mapped.SITE_LOGO || "";
    logoSize = mapped.LOGO_SIZE || "md";
    bannerEnabled = (mapped.BANNER_ENABLED || "").toLowerCase() === "true";
    bannerText = mapped.BANNER_TEXT || "";
    bannerLink = mapped.BANNER_LINK || "";
    primaryColor = mapped.PRIMARY_COLOR || "";
    primaryHoverColor = mapped.PRIMARY_HOVER_COLOR || "";
    socialX = mapped.SOCIAL_X || "";
    socialFacebook = mapped.SOCIAL_FACEBOOK || "";
    socialInstagram = mapped.SOCIAL_INSTAGRAM || "";
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
