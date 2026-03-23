"use client";

import { useState } from "react";
import { Shield, ShieldOff, Ban, CheckCircle, Trash2, Loader2, KeyRound, ExternalLink, Pencil, X, Copy, Check, Zap } from "lucide-react";

export default function UserAdminActions({
  userId,
  userSlug,
  userName,
  userEmail,
  isAdmin,
  isSuspended,
  isFoundingMember,
  onDeleted,
  onUpdated,
}: {
  userId: string;
  userSlug?: string;
  userName: string | null;
  userEmail: string;
  isAdmin: boolean;
  isSuspended: boolean;
  isFoundingMember: boolean;
  onDeleted: () => void;
  onUpdated: (data: { name?: string; email?: string; isAdmin?: boolean; isSuspended?: boolean; isFoundingMember?: boolean }) => void;
}) {
  const [admin, setAdmin] = useState(isAdmin);
  const [suspended, setSuspended] = useState(isSuspended);
  const [foundingMember, setFoundingMember] = useState(isFoundingMember);
  const [loadingFoundingMember, setLoadingFoundingMember] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [loadingSuspend, setLoadingSuspend] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(userName || "");
  const [editEmail, setEditEmail] = useState(userEmail);
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Reset password result
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const patchUser = async (data: object) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  };

  const toggleAdmin = async () => {
    setLoadingAdmin(true);
    const data = await patchUser({ isAdmin: !admin });
    if (data.success) { setAdmin(data.user.isAdmin); onUpdated({ isAdmin: data.user.isAdmin }); }
    setLoadingAdmin(false);
  };

  const toggleFoundingMember = async () => {
    setLoadingFoundingMember(true);
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFoundingMember: !foundingMember }),
    });
    const data = await res.json();
    if (data.success) { setFoundingMember(data.isFoundingMember); onUpdated({ isFoundingMember: data.isFoundingMember }); }
    setLoadingFoundingMember(false);
  };

  const toggleSuspend = async () => {
    setLoadingSuspend(true);
    const data = await patchUser({ isSuspended: !suspended });
    if (data.success) { setSuspended(data.user.isSuspended); onUpdated({ isSuspended: data.user.isSuspended }); }
    setLoadingSuspend(false);
  };

  const deleteUser = async () => {
    if (!confirm("Permanently delete this user and all their content?")) return;
    setLoadingDelete(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) onDeleted();
    else setLoadingDelete(false);
  };

  const resetPassword = async () => {
    if (!confirm("Generate a new temporary password for this user?")) return;
    setLoadingReset(true);
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
    const data = await res.json();
    if (data.tempPassword) setTempPassword(data.tempPassword);
    setLoadingReset(false);
  };

  const saveEdit = async () => {
    setEditLoading(true);
    setEditError("");
    const data = await patchUser({ name: editName.trim(), email: editEmail.trim() });
    if (data.error) { setEditError(data.error); setEditLoading(false); return; }
    if (data.success) {
      onUpdated({ name: data.user.name, email: data.user.email });
      setEditOpen(false);
    }
    setEditLoading(false);
  };

  const copyToClipboard = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 shrink-0">
        {/* View profile */}
        {userSlug && (
          <a
            href={`/users/${userSlug}`}
            target="_blank"
            title="View profile"
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {/* Edit name/email */}
        <button
          onClick={() => setEditOpen(true)}
          title="Edit user"
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Reset password */}
        <button
          onClick={resetPassword}
          disabled={loadingReset}
          title="Reset password"
          className="p-2 rounded-lg hover:bg-blue-50 text-blue-400 transition-colors"
        >
          {loadingReset ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
        </button>

        {/* Toggle Founding Member */}
        <button
          onClick={toggleFoundingMember}
          disabled={loadingFoundingMember}
          title={foundingMember ? "Remove founding member" : "Grant founding member"}
          className={`p-2 rounded-lg transition-colors ${foundingMember ? "bg-primary/10 text-primary hover:bg-primary/20" : "hover:bg-secondary text-muted-foreground"}`}
        >
          {loadingFoundingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        </button>

        {/* Toggle Admin */}
        <button
          onClick={toggleAdmin}
          disabled={loadingAdmin}
          title={admin ? "Remove admin" : "Make admin"}
          className={`p-2 rounded-lg transition-colors ${admin ? "bg-primary/10 text-primary hover:bg-primary/20" : "hover:bg-secondary text-muted-foreground"}`}
        >
          {loadingAdmin ? <Loader2 className="w-4 h-4 animate-spin" /> : admin ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
        </button>

        {/* Suspend */}
        <button
          onClick={toggleSuspend}
          disabled={loadingSuspend}
          title={suspended ? "Unsuspend user" : "Suspend user"}
          className={`p-2 rounded-lg transition-colors ${suspended ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "hover:bg-secondary text-muted-foreground"}`}
        >
          {loadingSuspend ? <Loader2 className="w-4 h-4 animate-spin" /> : suspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
        </button>

        {/* Delete */}
        <button
          onClick={deleteUser}
          disabled={loadingDelete}
          title="Delete user"
          className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
        >
          {loadingDelete ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-widest">Edit User</h3>
              <button onClick={() => setEditOpen(false)} className="p-1 hover:bg-secondary rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Display Name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {editError && <p className="text-red-500 text-xs">{editError}</p>}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditOpen(false)} className="flex-1 py-2 border border-border rounded-xl text-sm font-bold hover:bg-secondary transition-colors">Cancel</button>
              <button onClick={saveEdit} disabled={editLoading} className="flex-1 py-2 bg-primary text-black rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50">
                {editLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temp password modal */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-widest">Temporary Password</h3>
              <button onClick={() => setTempPassword(null)} className="p-1 hover:bg-secondary rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-muted-foreground">Share this with the user. They should change it after logging in.</p>
            <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-3">
              <code className="flex-1 font-mono text-sm font-bold">{tempPassword}</code>
              <button onClick={copyToClipboard} className="shrink-0 p-1.5 hover:bg-border rounded-lg transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
            <button onClick={() => setTempPassword(null)} className="w-full py-2 bg-primary text-black rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90">Done</button>
          </div>
        </div>
      )}
    </>
  );
}
