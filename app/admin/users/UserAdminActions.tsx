"use client";

import { useState } from "react";
import { Shield, ShieldOff, Loader2 } from "lucide-react";

export default function UserAdminActions({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const [admin, setAdmin] = useState(isAdmin);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !admin }),
      });
      if (res.ok) setAdmin((v) => !v);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={admin ? "Remove admin" : "Make admin"}
      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
        admin
          ? "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
          : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
      }`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : admin ? (
        <ShieldOff className="w-3 h-3" />
      ) : (
        <Shield className="w-3 h-3" />
      )}
      {admin ? "Revoke" : "Make Admin"}
    </button>
  );
}
