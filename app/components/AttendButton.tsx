"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AttendButton({
  eventId,
  initialAttended,
}: {
  eventId: string;
  initialAttended: boolean;
}) {
  const [attended, setAttended] = useState(initialAttended);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setLoading(true);
    const res = await fetch("/api/watchlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, attended: !attended }),
    });
    if (res.ok) {
        setAttended(!attended);
        router.refresh();
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-full h-12 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border text-sm active:scale-95 disabled:opacity-50 ${
        attended
          ? "bg-primary text-black border-primary"
          : "bg-white/5 text-muted-foreground border-white/10 hover:border-primary/30 hover:text-primary"
      }`}
      title={attended ? "I was there live!" : "Mark as attended live"}
    >
      <MapPin className={`w-4 h-4 ${attended ? "fill-current" : ""}`} />
      <span className="text-sm font-black italic">
        {attended ? "Attended" : "I was there"}
      </span>
    </button>
  );
}
