import Sidebar from "./components/Sidebar";
import AdminTopBar from "./components/AdminTopBar";
import AdminCommandPalette from "./components/AdminCommandPalette";
import AdminKeyboardShortcuts from "./components/AdminKeyboardShortcuts";
import { ToastProvider } from "@components/ToastProvider";
import { getUserFromServerCookie } from "@lib/server-auth";
import { prisma } from "@lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) redirect("/");

  const [submissions, drafts] = await Promise.allSettled([
    prisma.eventSubmission.count({ where: { status: "pending" } }),
    prisma.newsPost.count({ where: { status: "draft" } }),
  ]);
  const n = (r: PromiseSettledResult<number>) => (r.status === "fulfilled" ? r.value : 0);

  return (
    <ToastProvider>
      <div className="admin-mode flex min-h-screen bg-background text-foreground">
        <AdminCommandPalette />
        <AdminKeyboardShortcuts />
        <Sidebar badges={{ submissions: n(submissions), drafts: n(drafts) }} />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopBar name={user.name ?? "Admin"} role="Super Admin" />
          <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">{children}</main>
          <footer className="mt-auto px-4 sm:px-8 py-5 border-t border-border flex justify-center">
            <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-[0.2em]">
              Developed by{" "}
              <a href="https://shroweb.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Shro Web
              </a>
            </p>
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
}
