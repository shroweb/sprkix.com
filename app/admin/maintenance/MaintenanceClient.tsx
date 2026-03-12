"use client";

import { useState } from "react";
import { Power, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";

export default function MaintenanceClient({ initialMode }: { initialMode: boolean }) {
  const [isMode, setIsMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      await fetch('/api/admin/config/maintenance_mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: (!isMode).toString() })
      });
      setIsMode(!isMode);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className={`p-10 rounded-[3rem] border-2 transition-all ${isMode ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
        <div className="flex flex-col items-center text-center space-y-4">
            <div className={`p-6 rounded-full ${isMode ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white shadow-xl shadow-emerald-200'}`}>
                {isMode ? <AlertTriangle className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
            </div>
            <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">
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
                className={`mt-6 flex items-center gap-3 px-8 py-4 font-black uppercase italic tracking-widest rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${isMode ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5" />}
                {isMode ? "Deactivate Maintenance" : "Activate Maintenance"}
            </button>
        </div>
      </div>
    </div>
  );
}
