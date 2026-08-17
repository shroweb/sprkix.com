"use client";

import { useState, useEffect } from "react";
import {
  Power,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  RefreshCcw,
  Stethoscope,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function MaintenanceClient({ initialMode }: { initialMode: boolean }) {
  const [isMode, setIsMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);

  const [repairing, setRepairing] = useState(false);
  const [repairMsg, setRepairMsg] = useState("");

  const [diag, setDiag] = useState<null | {
    db: { ok: boolean; error: string | null };
    counts: Record<string, number>;
    envStatus: { key: string; set: boolean }[];
  }>(null);
  const [diagLoading, setDiagLoading] = useState(true);

  const toggle = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/config/maintenance_mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: (!isMode).toString() }),
      });
      setIsMode(!isMode);
    } finally {
      setLoading(false);
    }
  };

  const runRepair = async () => {
    setRepairing(true);
    setRepairMsg("");
    try {
      const res = await fetch("/api/admin/maintenance/recompute-predictions", { method: "POST" });
      const data = await res.json();
      setRepairMsg(data.error || `Recalculated prediction scores for ${data.usersUpdated ?? 0} users.`);
    } catch {
      setRepairMsg("Repair failed.");
    } finally {
      setRepairing(false);
    }
  };

  const loadDiagnostics = () => {
    setDiagLoading(true);
    fetch("/api/admin/diagnostics")
      .then((r) => r.json())
      .then(setDiag)
      .finally(() => setDiagLoading(false));
  };

  useEffect(loadDiagnostics, []);

  return (
    <div className="space-y-8">
      <div className={`p-10 rounded-[3rem] border-2 transition-all ${isMode ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`p-6 rounded-full ${isMode ? "bg-red-500 text-white" : "bg-emerald-500 text-white shadow-xl shadow-emerald-200"}`}>
            {isMode ? <AlertTriangle className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
          </div>
          <div>
            <h2 className="text-2xl font-semibold italic uppercase tracking-tighter">
              {isMode ? "Maintenance Mode Active" : "System Online"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
              {isMode
                ? "Public traffic is blocked. Only admins can access the platform."
                : "The platform is live and accepting public traffic."}
            </p>
          </div>

          <button
            onClick={toggle}
            disabled={loading}
            className={`mt-6 flex items-center gap-3 px-8 py-4 font-black uppercase italic tracking-widest rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${isMode ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5" />}
            {isMode ? "Deactivate Maintenance" : "Activate Maintenance"}
          </button>
        </div>
      </div>

      {/* Data repair */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <RefreshCcw className="w-4 h-4 text-primary" /> Data Repair
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Recalculate every user&apos;s prediction score and count from raw predictions. Use when
          leaderboard totals look stale.
        </p>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={runRepair}
            disabled={repairing}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
          >
            {repairing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Recompute Prediction Scores
          </button>
          {repairMsg && <span className="text-xs font-bold text-muted-foreground">{repairMsg}</span>}
        </div>
      </div>

      {/* Diagnostics */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" /> System Diagnostics
          </h3>
          <button
            onClick={loadDiagnostics}
            disabled={diagLoading}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline disabled:opacity-50"
          >
            <RefreshCcw className={`w-3 h-3 ${diagLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {diagLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : diag ? (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {Object.entries(diag.counts).map(([k, val]) => (
                <div key={k} className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black">{val}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                    {k.replace(/([A-Z])/g, " $1")}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                {diag.db.ok ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-bold">
                  Database {diag.db.ok ? "connected" : "unreachable"}
                </span>
              </div>
              {diag.db.error && (
                <p className="text-xs font-mono text-red-500">{diag.db.error}</p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                Environment Secrets
              </p>
              <div className="flex flex-wrap gap-2">
                {diag.envStatus.map((s) => (
                  <span
                    key={s.key}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      s.set ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                    }`}
                  >
                    {s.set ? "✓" : "✗"} {s.key}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
