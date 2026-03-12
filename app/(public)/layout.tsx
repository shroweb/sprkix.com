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
  try {
    const row = await (prisma as any).siteConfig.findUnique({
      where: { key: "SITE_LOGO" },
    });
    siteLogo = row?.value || "";
  } catch {}

  return (
    <>
      <Header user={user} siteLogo={siteLogo} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-10">{children}</main>
      <footer className="mt-16 border-t border-white/5 text-center py-10 px-4 max-w-7xl mx-auto">
        <p className="text-[10px] sm:text-xs text-muted-foreground/60 uppercase tracking-widest font-black italic">
          © {new Date().getFullYear()} sprkix · The definitive wrestling archive
        </p>
      </footer>
    </>
  );
}
