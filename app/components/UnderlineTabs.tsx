"use client";

import { useEffect, useState } from "react";

export interface TabDef {
  id: string;
  label: string;
  count?: number;
  content: React.ReactNode;
}

/** Accessible underline tabs; panels are server-rendered nodes passed in. Syncs with the URL hash. */
export default function UnderlineTabs({ tabs, initial }: { tabs: TabDef[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === h)) setActive(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  const select = (id: string) => {
    setActive(id);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <div>
      <div role="tablist" className="sticky top-[64px] z-20 -mx-4 flex gap-1 overflow-x-auto border-b border-white/10 bg-background/90 px-4 backdrop-blur-md sm:mx-0 sm:px-0">
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={on}
              aria-controls={`panel-${t.id}`}
              onClick={() => select(t.id)}
              className={`relative whitespace-nowrap px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition-colors ${
                on ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {t.count != null && <span className="ml-1.5 text-[10px] tabular-nums opacity-60">{t.count}</span>}
              <span className={`absolute inset-x-3 -bottom-px h-0.5 bg-primary transition-transform ${on ? "scale-x-100" : "scale-x-0"}`} />
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`panel-${t.id}`}
          aria-labelledby={`tab-${t.id}`}
          hidden={t.id !== active}
          className="pr-rise space-y-12 pt-8"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
