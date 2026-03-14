"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Users, Loader2 } from "lucide-react";
import FollowButton from "./FollowButton";

type ConnectionUser = {
  id: string;
  name: string | null;
  slug: string;
  isFollowing: boolean;
  isCurrentUser: boolean;
};

interface FollowListModalProps {
  userId: string;
  type: "followers" | "following";
  count: number;
  label: string;
}

export default function FollowListModal({
  userId,
  type,
  count,
  label,
}: FollowListModalProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<ConnectionUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const openModal = async () => {
    setOpen(true);
    if (users.length > 0) return; // already loaded
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/connections?type=${type}`);
      const data = await res.json();
      setUsers(data.users || []);
      setCurrentUserId(data.currentUserId);
    } finally {
      setLoading(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button
        onClick={openModal}
        className="flex flex-col items-center hover:opacity-70 transition-opacity group cursor-pointer"
      >
        <span className="text-2xl font-black italic text-white leading-none">
          {count}
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
          {label}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative bg-[#0d1020] border border-white/10 rounded-[2.5rem] w-full max-w-lg sm:max-w-xl lg:max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-black uppercase italic tracking-tighter text-lg">
                  {label}
                </span>
                <span className="text-[12px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {count}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-3 hover:bg-white/5 rounded-2xl transition-all group"
              >
                <X className="w-5 h-5 text-white/40 group-hover:text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm font-bold italic text-muted-foreground">
                    No {label.toLowerCase()} yet
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-4 px-6 py-4"
                    >
                      <Link
                        href={`/users/${u.slug || u.id}`}
                        onClick={() => setOpen(false)}
                        className="flex min-w-0 flex-1 items-center gap-3 hover:text-primary transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-black text-black shrink-0">
                          {u.name?.charAt(0).toUpperCase() ?? "U"}
                        </div>
                        <span className="font-black text-sm italic group-hover:text-primary transition-colors truncate">
                          {u.name ?? "Unknown"}
                        </span>
                      </Link>

                      {/* Show follow button only if this isn't the current user */}
                      {currentUserId && !u.isCurrentUser && (
                        <div className="shrink-0">
                          <FollowButton
                            targetUserId={u.id}
                            initialIsFollowing={u.isFollowing}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
