"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Sparkles, X } from "lucide-react";
import Link from "next/link";

export default function UsernameSetupModal({
  username,
}: {
  username: string;
}) {
  const [visible, setVisible] = useState(true);
  const [dismissing, setDismissing] = useState(false);
  const router = useRouter();

  const dismiss = async () => {
    setDismissing(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needsUsernameSetup: false }),
    }).catch(() => {});
    setVisible(false);
    router.refresh();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />

        <div className="p-8 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <button
              onClick={dismiss}
              disabled={dismissing}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase italic tracking-tight">
              Welcome to Poison Rana!
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We gave you the username{" "}
              <span className="font-black text-foreground">{username}</span>.
              You can keep it or change it to something more you.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link
              href="/profile/edit"
              onClick={dismiss}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-black py-3 px-5 rounded-xl text-sm uppercase italic tracking-wider hover:opacity-90 transition-opacity"
            >
              <Pencil className="w-4 h-4" />
              Edit Profile
            </Link>
            <button
              onClick={dismiss}
              disabled={dismissing}
              className="flex-1 py-3 px-5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors disabled:opacity-50"
            >
              Keep "{username}"
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
