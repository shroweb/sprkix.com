"use client";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const [deleted, setDeleted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (deleted) return <span className="text-[10px] text-muted-foreground font-bold uppercase">Deleted</span>;

  return (
    <button
      onClick={async () => {
        if (!confirm("Delete this review permanently?")) return;
        setLoading(true);
        const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
        if (res.ok) setDeleted(true);
        setLoading(false);
      }}
      disabled={loading}
      className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-muted-foreground"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  );
}
