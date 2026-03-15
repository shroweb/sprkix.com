"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ListPlus, Check, RefreshCcw, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";

type ListOption = { id: string; title: string; items: { eventId: string | null; matchId: string | null }[] };

export default function AddToListButton({
  eventId,
  matchId,
  isLoggedIn,
  minimal = false,
}: {
  eventId?: string;
  matchId?: string;
  isLoggedIn: boolean;
  minimal?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ListOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Position dropdown relative to button using fixed coords (escapes overflow clipping)
  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        zIndex: 9999,
      });
    }
  }, [open]);

  const openDropdown = async () => {
    if (!isLoggedIn) return;
    setOpen((prev) => !prev);
    if (!open) {
      setLoading(true);
      try {
        const res = await fetch("/api/lists");
        const data = await res.json();
        setLists(Array.isArray(data) ? data : []);
      } catch {
        setLists([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAdd = async (listId: string) => {
    setAdding(listId);
    try {
      await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchId ? { matchId } : { eventId }),
      });
    } catch { /* noop */ } finally {
      setAdding(null);
      const res = await fetch("/api/lists");
      setLists(await res.json());
    }
  };

  const handleRemove = async (listId: string) => {
    setAdding(listId);
    try {
      const param = matchId ? `matchId=${matchId}` : `eventId=${eventId}`;
      await fetch(`/api/lists/${listId}/items?${param}`, { method: "DELETE" });
    } catch { /* noop */ } finally {
      setAdding(null);
      const res = await fetch("/api/lists");
      setLists(await res.json());
    }
  };

  if (!isLoggedIn) return null;

  const dropdown = open ? (
    <div
      ref={dropRef}
      style={dropdownStyle}
      className="w-64 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
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
          <p className="text-xs text-muted-foreground font-medium italic">No lists yet.</p>
          <Link
            href="/lists/create"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
          >
            <Plus className="w-3 h-3" /> Create your first list
          </Link>
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {lists.map((list) => {
            const inList = matchId
              ? list.items.some((i) => i.matchId === matchId)
              : list.items.some((i) => i.eventId === eventId);
            return (
              <button
                key={list.id}
                onClick={() => inList ? handleRemove(list.id) : handleAdd(list.id)}
                disabled={adding === list.id}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <span className="text-sm font-bold truncate">{list.title}</span>
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
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-black text-primary hover:bg-primary/5 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New List
              <ChevronRight className="w-3 h-3 ml-auto" />
            </Link>
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={openDropdown}
        title="Add to list"
        className={
          minimal
            ? "w-12 h-12 bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-primary border border-border rounded-xl flex items-center justify-center transition-all active:scale-95"
            : "flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-xl text-xs font-black uppercase tracking-wider hover:border-primary/30 hover:text-primary transition-all"
        }
      >
        <ListPlus className="w-4 h-4" />
        {!minimal && <span>Add to List</span>}
      </button>
      {typeof document !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </>
  );
}
