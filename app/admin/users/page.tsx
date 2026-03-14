"use client";

import { useState, useEffect } from "react";
import { Search, Shield, Loader2, UserCircle } from "lucide-react";
import UserAdminActions from "./UserAdminActions";

type User = {
  id: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  isSuspended: boolean;
  createdAt: string;
  _count: { reviews: number; MatchRating: number; followers: number };
};

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => { setUsers(d.users || []); setLoading(false); });
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (u.name || "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase italic">User Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {users.length} registered users
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((u) => (
              <div key={u.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors ${u.isSuspended ? "opacity-60" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-black text-primary shrink-0">
                  {u.name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm truncate">{u.name ?? "Unnamed"}</span>
                    {u.isAdmin && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>
                    )}
                    {u.isSuspended && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Suspended</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                </div>
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
                <div className="hidden md:block text-[11px] text-muted-foreground shrink-0 w-24 text-right">
                  {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                </div>
                <UserAdminActions
                  userId={u.id}
                  isAdmin={u.isAdmin}
                  isSuspended={u.isSuspended}
                  onDeleted={() => setUsers((prev) => prev.filter((x) => x.id !== u.id))}
                />
              </div>
            ))}
            {filtered.length === 0 && !loading && (
              <div className="py-16 text-center text-muted-foreground font-bold italic">No users found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
