import Sidebar from "./components/Sidebar";
import AdminCommandPalette from "./components/AdminCommandPalette";
import AdminKeyboardShortcuts from "./components/AdminKeyboardShortcuts";
import { ToastProvider } from "@components/ToastProvider";
import { UserCircle, Search, Command, Activity } from "lucide-react";
import { getUserFromServerCookie } from "@lib/server-auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) redirect("/");

  return (
    <ToastProvider>
      <div className="admin-mode flex min-h-screen bg-background text-foreground">
        <AdminCommandPalette />
        <AdminKeyboardShortcuts />
        <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Top Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-border pl-16 pr-4 sm:px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-slate-200">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Search admin tools...</span>
              <kbd className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-300">
                ⌘K
              </kbd>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-600 text-[10px] font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              DB Connected
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none">
                {user?.name ?? "Admin"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.isAdmin ? "Super Admin" : "Admin"}
              </p>
            </div>
            <UserCircle className="w-8 h-8 text-muted-foreground" />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">{children}</main>
        
        <footer className="mt-auto px-4 sm:px-8 py-6 border-t border-border flex justify-center items-center">
          <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-[0.2em]">
            Developed by{" "}
            <a 
              href="https://shroweb.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline transition-all"
            >
              Shro Web
            </a>
          </p>
        </footer>
      </div>
    </div>
    </ToastProvider>
  );
}
