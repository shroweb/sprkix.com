"use client";

import { useState } from "react";
import { Shield, ShieldOff, Ban, CheckCircle, Trash2, Loader2 } from "lucide-react";

export default function UserAdminActions({
  userId,
  isAdmin,
  isSuspended,
  onDeleted,
}: {
  userId: string;
  isAdmin: boolean;
  isSuspended: boolean;
  onDeleted: () => void;
}) {
  const [admin, setAdmin] = useState(isAdmin);
  const [suspended, setSuspended] = useState(isSuspended);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [loadingSuspend, setLoadingSuspend] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

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
    if (data.success) setAdmin(data.user.isAdmin);
    setLoadingAdmin(false);
  };

  const toggleSuspend = async () => {
    setLoadingSuspend(true);
    const data = await patchUser({ isSuspended: !suspended });
    if (data.success) setSuspended(data.user.isSuspended);
    setLoadingSuspend(false);
  };

  const deleteUser = async () => {
    if (!confirm("Permanently delete this user and all their content?")) return;
    setLoadingDelete(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) onDeleted();
    else setLoadingDelete(false);
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
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
  );
}
