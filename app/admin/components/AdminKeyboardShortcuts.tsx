"use client";

import { useState, useEffect } from "react";
import { Command, X, Search, Power, ShieldAlert, Key } from "lucide-react";

export default function AdminKeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs/textareas
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName
        )
      ) {
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6 text-white animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold uppercase italic tracking-tight">
              Admin Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-300">
              Open Command Palette Search
            </span>
            <kbd className="font-mono text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700 text-amber-400 font-bold">
              ⌘ + K
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-300">
              Toggle Keyboard Shortcuts Guide
            </span>
            <kbd className="font-mono text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700 text-amber-400 font-bold">
              ?
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-300">
              Close Modals & Search
            </span>
            <kbd className="font-mono text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-400">
              ESC
            </kbd>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 text-center italic">
          Press ESC to dismiss this window.
        </p>
      </div>
    </div>
  );
}
