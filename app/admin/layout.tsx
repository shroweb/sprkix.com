import Sidebar from "./components/Sidebar";
import { UserCircle } from "lucide-react";
import { getUserFromServerCookie } from "../../lib/getUserFromServerCookie";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromServerCookie();

  return (
    <div className="admin-mode flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Top Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-border px-8 flex items-center justify-end sticky top-0 z-10">
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

        <main className="p-8 max-w-[1600px] mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
