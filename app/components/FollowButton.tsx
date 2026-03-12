"use client";

import { useState } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      setIsFollowing(data.followed);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getLabel = () => {
    if (loading) return "Loading...";
    if (isFollowing && hovered) return "Unfollow";
    if (isFollowing) return "Following";
    return "Follow";
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-tight transition-all ${
        isFollowing
          ? hovered
            ? "bg-red-500/10 border border-red-400/30 text-red-500"
            : "bg-card border border-primary/30 text-primary"
          : "bg-primary text-black hover:opacity-90"
      } disabled:opacity-50`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing && hovered ? (
        <UserMinus className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {getLabel()}
    </button>
  );
}
