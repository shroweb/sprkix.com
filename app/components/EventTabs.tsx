"use client";

import { useState } from "react";

export interface EventTab {
  id: string;
  label: string;
  /** Optional count badge (e.g. number of reviews) */
  badge?: number;
}

interface EventTabsProps {
  tabs: EventTab[];
  defaultTab?: string;
  card: React.ReactNode;
  predictions?: React.ReactNode;
  watchParty?: React.ReactNode;
  review?: React.ReactNode;
}

export default function EventTabs({
  tabs,
  defaultTab,
  card,
  predictions,
  watchParty,
  review,
}: EventTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "card");

  const contentMap: Record<string, React.ReactNode> = {
    card,
    predictions,
    watchParty,
    review,
  };

  return (
    <div className="space-y-8">
      {/* Tab Bar */}
      <div className="flex gap-1 bg-card/40 border border-border rounded-2xl p-1.5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 flex-shrink-0 py-2.5 px-5 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all ${
              activeTab === tab.id
                ? "bg-primary text-black shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                  activeTab === tab.id
                    ? "bg-black/20 text-black"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tabs.map((tab) => (
        <div key={tab.id} className={activeTab === tab.id ? "block" : "hidden"}>
          {contentMap[tab.id]}
        </div>
      ))}
    </div>
  );
}
