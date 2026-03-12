import { prisma } from "@lib/prisma";
import Link from "next/link";
import { Users, Star, Activity, Shield, ShieldOff, ChevronLeft } from "lucide-react";
import UserAdminActions from "./UserAdminActions";

export default async function UsersAdminPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { reviews: true, MatchRating: true, followers: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">User Manager</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {users.length} registered users · manage roles and view activity
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-black text-primary shrink-0">
                {u.name?.charAt(0).toUpperCase() ?? "?"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm truncate">{u.name ?? "Unnamed"}</span>
                  {u.isAdmin && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
              </div>

              {/* Activity */}
              <div className="hidden sm:flex items-center gap-6 text-center shrink-0">
                <div>
                  <p className="text-sm font-black">{u._count.reviews}</p>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Reviews</p>
                </div>
                <div>
                  <p className="text-sm font-black">{u._count.MatchRating}</p>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Ratings</p>
                </div>
                <div>
                  <p className="text-sm font-black">{u._count.followers}</p>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Followers</p>
                </div>
              </div>

              {/* Joined */}
              <div className="hidden md:block text-[11px] text-muted-foreground shrink-0 w-24 text-right">
                {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
              </div>

              {/* Actions */}
              <UserAdminActions userId={u.id} isAdmin={u.isAdmin} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
