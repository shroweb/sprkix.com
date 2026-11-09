import Link from "next/link";
import { Crown } from "lucide-react";
import type { Side } from "@lib/match-sides";

export function Photo({ name, src, tall, fill = false }: { name: string; src?: string | null; tall: boolean; fill?: boolean }) {
  const words = name.trim().split(/\s+/);
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
  return (
    <div className={`relative w-full overflow-hidden bg-secondary ${fill ? "h-full" : tall ? "aspect-[3/4]" : "aspect-square"}`}>
      {src ? (
        <img src={src} alt={name} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top" />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-primary/10 text-3xl font-black text-primary/70">{initials}</div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/90 to-transparent" />
    </div>
  );
}

/**
 * Head-to-head presentation for a match. Pure display (server-safe):
 * the winner is only marked when `reveal` is true so spoilers stay hidden.
 */
export default function FaceOff({
  sides,
  reveal = false,
  size = "md",
  center,
  className = "",
}: {
  sides: Side[];
  reveal?: boolean;
  size?: "md" | "lg";
  center?: React.ReactNode;
  className?: string;
}) {
  if (sides.length === 0) return null;
  const tall = size === "lg";
  const multi = sides.length > 2;

  return (
    <div className={`relative flex items-stretch gap-px ${multi ? "flex-wrap" : ""} ${className}`}>
      {sides.map((side, i) => {
        const won = reveal && side.isWinner;
        const lost = reveal && !side.isWinner && sides.some((s) => s.isWinner);
        return (
          <div key={side.key} className={`relative min-w-0 flex-1 ${multi ? "basis-1/3" : ""} ${lost ? "opacity-50 saturate-50" : ""} transition-opacity`}>
            <div className={`grid gap-px ${side.members.length > 1 ? `grid-cols-2 ${tall ? "aspect-[3/4]" : "aspect-square"}` : "grid-cols-1"}`}>
              {side.members.slice(0, 4).map((m) => (
                <Photo key={m.wrestler.id} name={m.wrestler.name} src={m.wrestler.imageUrl} tall={tall} fill={side.members.length > 1} />
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-0 space-y-0.5 p-2.5 sm:p-3">
              {side.members.map((m) =>
                m.wrestler.slug ? (
                  <Link key={m.wrestler.id} href={`/wrestlers/${m.wrestler.slug}`} className="block truncate text-xs font-bold uppercase leading-tight tracking-tight text-white hover:text-primary sm:text-sm">
                    {m.wrestler.name}
                  </Link>
                ) : (
                  <p key={m.wrestler.id} className="truncate text-xs font-bold uppercase leading-tight tracking-tight text-white sm:text-sm">
                    {m.wrestler.name}
                  </p>
                ),
              )}
            </div>
            {won && (
              <span className="pr-rise absolute left-2 top-2 inline-flex items-center gap-1 bg-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                <Crown className="h-3 w-3" /> Winner
              </span>
            )}
            {!multi && i === 0 && (
              <span className="absolute -right-3 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center border border-white/20 bg-slate-950 text-[11px] font-bold text-white sm:-right-4 sm:h-10 sm:w-10 sm:text-xs">
                VS
              </span>
            )}
          </div>
        );
      })}
      {center && <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2">{center}</div>}
    </div>
  );
}
