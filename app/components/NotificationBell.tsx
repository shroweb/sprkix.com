"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, MessageSquare, Star, UserPlus, X, Target, ThumbsUp, XCircle } from "lucide-react";
import Link from "next/link";

type NotificationType = "reply" | "review" | "follow" | "prediction_correct" | "prediction_wrong" | "upvote";

type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  detail: string | null;
  link: string | null;
  avatarUrl: string | null;
  avatarName: string | null;
  createdAt: string;
  isNew: boolean;
};

const TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; bg: string; dot: string }> = {
  prediction_correct: {
    icon: <Target className="w-3.5 h-3.5 text-emerald-400" />,
    bg: "bg-emerald-500/20",
    dot: "bg-emerald-400",
  },
  prediction_wrong: {
    icon: <XCircle className="w-3.5 h-3.5 text-red-400" />,
    bg: "bg-red-500/20",
    dot: "bg-red-400",
  },
  upvote: {
    icon: <ThumbsUp className="w-3.5 h-3.5 text-primary" />,
    bg: "bg-primary/20",
    dot: "bg-primary",
  },
  follow: {
    icon: <UserPlus className="w-3.5 h-3.5 text-blue-400" />,
    bg: "bg-blue-500/20",
    dot: "bg-blue-400",
  },
  review: {
    icon: <Star className="w-3.5 h-3.5 text-primary fill-current" />,
    bg: "bg-primary/20",
    dot: "bg-primary",
  },
  reply: {
    icon: <MessageSquare className="w-3.5 h-3.5 text-purple-400" />,
    bg: "bg-purple-500/20",
    dot: "bg-purple-400",
  },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = (silent = false) => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setCount(data.count || 0);
        if (!silent) setLoaded(true);
      })
      .catch(() => { if (!silent) setLoaded(true); });
  };

  // Initial load
  useEffect(() => { fetchNotifications(); }, []);

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    const interval = setInterval(() => fetchNotifications(true), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (!open && count > 0) {
      fetch("/api/notifications", { method: "POST" }).then(() => {
        setCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isNew: false })));
      });
    }
    setOpen(!open);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (!loaded) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-secondary/80 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-black text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-sm font-black uppercase italic tracking-tight">Notifications</span>
              {count > 0 && (
                <span className="px-1.5 py-0.5 bg-primary text-black text-[9px] font-black rounded">
                  {count} new
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-secondary rounded-lg transition-colors">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border/50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-bold italic text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Predictions, replies, and upvotes appear here</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.reply;
                return (
                  <Link
                    key={notif.id}
                    href={notif.link || "/"}
                    onClick={() => setOpen(false)}
                    className={`flex gap-3 px-5 py-3.5 hover:bg-secondary/40 transition-colors ${notif.isNew ? "bg-primary/5 border-l-2 border-primary/40" : ""}`}
                  >
                    {/* Icon bubble */}
                    <div className={`w-8 h-8 rounded-full ${config.bg} overflow-hidden shrink-0 mt-0.5 flex items-center justify-center`}>
                      {notif.avatarUrl ? (
                        <img src={notif.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : notif.avatarName ? (
                        <span className="text-xs font-black text-primary">{notif.avatarName.charAt(0).toUpperCase()}</span>
                      ) : (
                        config.icon
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-xs font-semibold leading-snug text-foreground">{notif.message}</p>
                      {notif.detail && (
                        <p className="text-xs text-muted-foreground italic line-clamp-1">
                          {notif.type === "reply" ? `"${notif.detail}"` : notif.detail}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} opacity-70`} />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {timeAgo(notif.createdAt)}
                        </span>
                        {notif.isNew && <span className="text-[10px] font-black text-primary uppercase tracking-widest">· new</span>}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
