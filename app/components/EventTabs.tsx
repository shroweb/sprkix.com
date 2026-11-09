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
  discussion?: React.ReactNode;
  poll?: React.ReactNode;
}

export default function EventTabs({
  tabs,
  defaultTab,
  card,
  predictions,
  watchParty,
  review,
  discussion,
  poll,
}: EventTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "card");

  const contentMap: Record<string, React.ReactNode> = {
    card,
    predictions,
    watchParty,
    review,
    discussion,
    poll,
  };

  return (
    <div className="space-y-8">
      {/* Tab Bar */}
      <div className="sticky top-[68px] z-30 -mx-4 flex gap-1 overflow-x-auto border-y border-white/10 bg-slate-950/90 px-4 py-2 backdrop-blur-xl sm:mx-0 sm:border sm:px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 flex-shrink-0 py-2.5 px-4 sm:px-6 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? "bg-primary text-black shadow-md shadow-primary/20"
                : "text-foreground/75 hover:text-foreground hover:bg-white/5"
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                  activeTab === tab.id
                    ? "bg-black/20 text-black"
                    : "bg-white/10 text-white/75"
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
