"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReplyForm({
  reviewId,
  onReply,
  isUpcoming,
}: {
  reviewId: string;
  onReply?: () => void;
  isUpcoming?: boolean;
}) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewId,
        comment,
        isUpcoming: isUpcoming ? true : undefined,
      }),
    });

    setComment("");
    setLoading(false);
    router.refresh();
    if (onReply) onReply();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 w-full space-y-3">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full bg-white text-slate-900 text-sm font-bold border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground placeholder:italic resize-y"
        rows={2}
        placeholder={isUpcoming ? "Write a comment..." : "Write a reply..."}
      />
      <button
        disabled={loading}
        type="submit"
        className="w-full h-14 bg-primary hover:bg-white text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
      >
        {loading ? "Posting..." : isUpcoming ? "Post Comment" : "Post Reply"}
      </button>
    </form>
  );
}
