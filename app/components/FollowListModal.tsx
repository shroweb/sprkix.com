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
        className="flex flex-col items-center hover:text-primary transition-colors group cursor-pointer"
      >
        <span className="text-sm font-black">{count}</span>
        <span className="text-sm text-muted-foreground font-medium">
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
          <div className="relative bg-card border border-border rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-black uppercase italic tracking-tighter text-sm">
                  {label}
                </span>
                <span className="text-[10px] font-black text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                  {count}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-secondary rounded-xl transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-80 overflow-y-auto">
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
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <Link
                        href={`/users/${u.slug || u.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 hover:text-primary transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-black text-black shrink-0">
                          {u.name?.charAt(0).toUpperCase() ?? "U"}
                        </div>
                        <span className="font-black text-sm italic group-hover:text-primary transition-colors">
                          {u.name ?? "Unknown"}
                        </span>
                      </Link>

                      {/* Show follow button only if this isn't the current user */}
                      {currentUserId && !u.isCurrentUser && (
                        <FollowButton
                          targetUserId={u.id}
                          initialIsFollowing={u.isFollowing}
                        />
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
