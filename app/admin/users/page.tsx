"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, UserPlus, X, Shield } from "lucide-react";
import UserAdminActions from "./UserAdminActions";

type User = {
  id: string;
  name: string | null;
  email: string;
  slug: string | null;
  isAdmin: boolean;
  isSuspended: boolean;
  createdAt: string;
  _count: { reviews: number; MatchRating: number; followers: number };
};

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add user modal
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addIsAdmin, setAddIsAdmin] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => { setUsers(d.users || []); setLoading(false); });
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || (u.name || "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const createUser = async () => {
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      setAddError("All fields are required"); return;
    }
    setAddLoading(true);
    setAddError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: addName.trim(), email: addEmail.trim(), password: addPassword, isAdmin: addIsAdmin }),
    });
    const data = await res.json();
    if (data.error) { setAddError(data.error); setAddLoading(false); return; }
    setUsers(prev => [data.user, ...prev]);
    setAddOpen(false);
    setAddName(""); setAddEmail(""); setAddPassword(""); setAddIsAdmin(false);
    setAddLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase italic">User Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} registered users</p>
        </div>
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-opacity shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </button>
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
                  userSlug={u.slug ?? undefined}
                  userName={u.name}
                  userEmail={u.email}
                  isAdmin={u.isAdmin}
                  isSuspended={u.isSuspended}
                  onDeleted={() => setUsers((prev) => prev.filter((x) => x.id !== u.id))}
                  onUpdated={(data) => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, ...data } : x))}
                />
              </div>
            ))}
            {filtered.length === 0 && !loading && (
              <div className="py-16 text-center text-muted-foreground font-bold italic">No users found.</div>
            )}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-widest">Add New User</h3>
              <button onClick={() => setAddOpen(false)} className="p-1 hover:bg-secondary rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Display Name</label>
                <input
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  placeholder="e.g. John Cena"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</label>
                <input
                  type="password"
                  value={addPassword}
                  onChange={e => setAddPassword(e.target.value)}
                  placeholder="Temporary password"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
                <div
                  onClick={() => setAddIsAdmin(v => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${addIsAdmin ? "bg-primary" : "bg-border"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${addIsAdmin ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" /> Grant admin access
                </span>
              </label>
              {addError && <p className="text-red-500 text-xs">{addError}</p>}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setAddOpen(false)} className="flex-1 py-2 border border-border rounded-xl text-sm font-bold hover:bg-secondary transition-colors">Cancel</button>
              <button onClick={createUser} disabled={addLoading} className="flex-1 py-2 bg-primary text-black rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50">
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
