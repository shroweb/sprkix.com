import Header from "@components/Header";
import { getUserFromServerCookie } from "@lib/server-auth";
import { prisma } from "@lib/prisma";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromServerCookie();

  let siteLogo = "";
  let logoSize = "md";
  try {
    const [logoRow, sizeRow] = await Promise.all([
      (prisma as any).siteConfig.findUnique({ where: { key: "SITE_LOGO" } }),
      (prisma as any).siteConfig.findUnique({ where: { key: "LOGO_SIZE" } }),
    ]);
    siteLogo = logoRow?.value || "";
    logoSize = sizeRow?.value || "md";
  } catch {}

  return (
    <>
      <Header user={user} siteLogo={siteLogo} logoSize={logoSize} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-10">{children}</main>
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
