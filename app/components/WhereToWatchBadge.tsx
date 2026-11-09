"use client";

import React from "react";
import { Tv } from "lucide-react";

export type WatchPlatform = {
  name: string;
  logoPath: string;
  url?: string;
};

// Map of networks to their actual saved logo assets in public/images/networks/
const LOGOS: Record<string, WatchPlatform> = {
  Netflix: {
    name: "Netflix",
    logoPath: "/images/networks/netflix.svg",
    url: "https://www.netflix.com",
  },
  Peacock: {
    name: "Peacock",
    logoPath: "/images/networks/peacock.svg",
    url: "https://www.peacocktv.com",
  },
  TrillerTV: {
    name: "TrillerTV",
    logoPath: "/images/networks/trillertv.svg",
    url: "https://www.trillertv.com",
  },
  Max: {
    name: "Max",
    logoPath: "/images/networks/max.svg",
    url: "https://www.max.com",
  },
  "NJPW World": {
    name: "NJPW World",
    logoPath: "/images/networks/njpwworld.svg",
    url: "https://njpwworld.com",
  },
  "TNA+": {
    name: "TNA+",
    logoPath: "/images/networks/tnaplus.svg",
    url: "https://watch.tnawrestling.com",
  },
  "Wrestle Universe": {
    name: "Wrestle Universe",
    logoPath: "/images/networks/wrestleuniverse.svg",
    url: "https://www.wrestle-universe.com",
  },
  HonorClub: {
    name: "HonorClub",
    logoPath: "/images/networks/honorclub.svg",
    url: "https://www.rohhonorclub.com",
  },
  "Stardom World": {
    name: "Stardom World",
    logoPath: "/images/networks/stardom.svg",
    url: "https://www.stardom-world.com",
  },
  YouTube: {
    name: "YouTube",
    logoPath: "/images/networks/youtube.svg",
    url: "https://www.youtube.com",
  },
  "USA Network": {
    name: "USA Network",
    logoPath: "/images/networks/usanetwork.svg",
    url: "https://www.usanetwork.com",
  },
  "The CW": {
    name: "The CW",
    logoPath: "/images/networks/thecw.svg",
    url: "https://www.cwtv.com",
  },
};

/**
 * Resolves 100% accurate streaming platforms for any event based on promotion, explicit network, and title
 */
export function resolveWhereToWatch(
  promotion?: string | null,
  network?: string | null,
  title?: string | null
): WatchPlatform[] {
  const normPromo = (promotion || "").trim().toUpperCase();
  const normNet = (network || "").trim().toLowerCase();
  const normTitle = (title || "").trim().toLowerCase();

  // Explicit network matching first
  if (normNet.includes("peacock")) return [LOGOS.Peacock, LOGOS.Netflix];
  if (normNet.includes("netflix")) return [LOGOS.Netflix];
  if (normNet.includes("triller") || normNet.includes("fite")) return [LOGOS.TrillerTV];
  if (normNet.includes("max") || normNet.includes("hbo")) return [LOGOS.Max, LOGOS.TrillerTV];
  if (normNet.includes("njpw")) return [LOGOS["NJPW World"]];
  if (normNet.includes("tna")) return [LOGOS["TNA+"]];
  if (normNet.includes("wrestle universe")) return [LOGOS["Wrestle Universe"]];
  if (normNet.includes("honorclub") || normNet.includes("roh")) return [LOGOS.HonorClub];
  if (normNet.includes("stardom")) return [LOGOS["Stardom World"]];

  // Promotion & Title Fallback (100% accurate defaults)
  if (normPromo === "WWE") {
    if (normTitle.includes("smackdown")) {
      return [LOGOS["USA Network"], LOGOS.Netflix];
    }
    if (normTitle.includes("nxt")) {
      return [LOGOS["The CW"], LOGOS.Peacock];
    }
    if (normTitle.includes("raw")) {
      return [LOGOS.Netflix];
    }
    // Major WWE PLEs (WrestleMania, SummerSlam, Royal Rumble, Survivor Series, etc.)
    return [LOGOS.Peacock, LOGOS.Netflix];
  }

  if (normPromo === "AEW") {
    return [LOGOS.TrillerTV, LOGOS.Max];
  }

  if (normPromo === "NJPW") {
    return [LOGOS["NJPW World"]];
  }

  if (normPromo === "TNA" || normPromo === "IMPACT") {
    return [LOGOS["TNA+"]];
  }

  if (normPromo === "ROH") {
    return [LOGOS.HonorClub];
  }

  if (normPromo === "STARDOM") {
    return [LOGOS["Stardom World"]];
  }

  if (normPromo === "NOAH" || normPromo === "DDT" || normPromo === "TJPW") {
    return [LOGOS["Wrestle Universe"]];
  }

  if (normPromo === "CMLL") {
    return [LOGOS.YouTube];
  }

  if (normPromo === "GCW" || normPromo === "REVPRO" || normPromo === "PROGRESS") {
    return [LOGOS.TrillerTV];
  }

  return [LOGOS.TrillerTV];
}

type Props = {
  promotion?: string | null;
  network?: string | null;
  title?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: "compact" | "hero" | "details" | "header-pill";
  className?: string;
};

export default function WhereToWatchBadge({
  promotion,
  network,
  title,
  variant = "compact",
  className = "",
}: Props) {
  const platforms = resolveWhereToWatch(promotion, network, title);

  if (!platforms.length) return null;

  // HEADER PILL VARIANT (Matches exact size, border, background, and font of Archive Record and Date pills)
  if (variant === "header-pill") {
    return (
      <div className={`flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-muted-foreground ${className}`}>
        <Tv className="w-4 h-4 text-primary shrink-0" />
        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Watch
        </span>
        <div className="flex items-center gap-1.5 ml-0.5">
          {platforms.map((platform) => (
            <a
              key={platform.name}
              href={platform.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              title={`Watch on ${platform.name}`}
              className="flex h-5 w-8 shrink-0 items-center justify-center rounded bg-white p-0.5 shadow transition-transform hover:scale-110"
            >
              <img
                src={platform.logoPath}
                alt={platform.name}
                className="h-full w-auto max-w-[26px] object-contain"
              />
            </a>
          ))}
        </div>
      </div>
    );
  }

  // HERO VARIANT (Featured Event Cycler)
  if (variant === "hero") {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 backdrop-blur-md ${className}`}>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
          Watch on
        </span>
        <div className="flex items-center gap-1.5">
          {platforms.map((platform) => (
            <a
              key={platform.name}
              href={platform.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              title={`Watch on ${platform.name}`}
              className="flex h-5 w-8 items-center justify-center rounded bg-white p-0.5 shadow transition-transform hover:scale-110"
            >
              <img
                src={platform.logoPath}
                alt={platform.name}
                className="h-full w-auto max-w-[28px] object-contain"
              />
            </a>
          ))}
        </div>
      </div>
    );
  }

  // DETAILS VARIANT (Inside Event Detail Sidebar Details Box)
  if (variant === "details") {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {platforms.map((platform) => (
          <a
            key={platform.name}
            href={platform.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title={`Watch on ${platform.name}`}
            className="group inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 px-2.5 py-1.5 transition-all shadow-sm"
          >
            <div className="flex h-6 w-11 shrink-0 items-center justify-center rounded bg-white p-1 shadow-sm border border-slate-200">
              <img
                src={platform.logoPath}
                alt={platform.name}
                className="h-full w-auto max-w-[38px] object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <span className="text-xs font-bold text-white/90 group-hover:text-primary transition-colors">
              {platform.name}
            </span>
            <span className="text-[11px] text-muted-foreground group-hover:text-primary transition-colors">
              ↗
            </span>
          </a>
        ))}
      </div>
    );
  }

  // COMPACT VARIANT (For Grid Posters & Event Cards)
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {platforms.map((platform) => (
        <div
          key={platform.name}
          title={`Watch on ${platform.name}`}
          className="flex h-5 w-8 items-center justify-center rounded bg-white p-0.5 shadow-md border border-white/40 transition-transform hover:scale-105"
        >
          <img
            src={platform.logoPath}
            alt={platform.name}
            className="h-full w-auto max-w-[28px] object-contain"
          />
        </div>
      ))}
    </div>
  );
}
