"use client";

import { useState, useEffect, useRef } from "react";
import { ListPlus, Check, RefreshCcw, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";

type ListOption = { id: string; title: string; items: { eventId: string }[] };

export default function AddToListButton({
  eventId,
  isLoggedIn,
  minimal = false,
}: {
  eventId: string;
  isLoggedIn: boolean;
  minimal?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ListOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const openDropdown = async () => {
    if (!isLoggedIn) return;
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch("/api/lists");
      const data = await res.json();
      setLists(data);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (listId: string) => {
    setAdding(listId);
    try {
      await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      // Refresh the list data to reflect new state
      const res = await fetch("/api/lists");
      setLists(await res.json());
    } catch {
      /* noop */
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (listId: string) => {
    setAdding(listId);
    try {
      await fetch(`/api/lists/${listId}/items?eventId=${eventId}`, {
        method: "DELETE",
      });
      const res = await fetch("/api/lists");
      setLists(await res.json());
    } catch {
      /* noop */
    } finally {
      setAdding(null);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={openDropdown}
        title="Add to list"
        className={
          minimal
            ? "w-12 h-12 bg-secondary/50 hover:bg-secondary text-foreground rounded-xl flex items-center justify-center transition-all border border-white/5 active:scale-95"
            : "flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-xl text-xs font-black uppercase tracking-wider hover:border-primary/30 hover:text-primary transition-all"
        }
      >
        <ListPlus className="w-4 h-4" />
        {!minimal && <span>Add to List</span>}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3 border-b border-border">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Your Lists
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-6">
              <RefreshCcw className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : lists.length === 0 ? (
            <div className="p-4 text-center space-y-3">
              <p className="text-xs text-muted-foreground font-medium italic">
                No lists yet.
              </p>
              <Link
                href="/lists/create"
                className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
              >
                <Plus className="w-3 h-3" /> Create your first list
              </Link>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {lists.map((list) => {
                const inList = list.items.some((i) => i.eventId === eventId);
                return (
                  <button
                    key={list.id}
                    onClick={() =>
                      inList ? handleRemove(list.id) : handleAdd(list.id)
                    }
                    disabled={adding === list.id}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                  >
                    <span className="text-sm font-bold truncate">
                      {list.title}
                    </span>
                    {adding === list.id ? (
                      <RefreshCcw className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />
                    ) : inList ? (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                );
              })}
              <div className="pt-1 border-t border-border">
                <Link
                  href="/lists/create"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-black text-primary hover:bg-primary/5 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> New List
                  <ChevronRight className="w-3 h-3 ml-auto" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
