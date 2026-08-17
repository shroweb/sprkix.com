"use client";

const PROMOTION_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  WWE: { bg: "bg-rose-950/80", text: "text-rose-400", border: "border-rose-800/80" },
  AEW: { bg: "bg-amber-950/80", text: "text-amber-400", border: "border-amber-800/80" },
  NJPW: { bg: "bg-red-950/80", text: "text-red-400", border: "border-red-800/80" },
  TNA: { bg: "bg-sky-950/80", text: "text-sky-400", border: "border-sky-800/80" },
  ROH: { bg: "bg-slate-900/90", text: "text-slate-200", border: "border-slate-700" },
  NXT: { bg: "bg-yellow-950/80", text: "text-yellow-400", border: "border-yellow-800/80" },
  STARDOM: { bg: "bg-pink-950/80", text: "text-pink-400", border: "border-pink-800/80" },
};

export default function PromotionBadge({
  promotion,
  className = "",
}: {
  promotion: string;
  className?: string;
}) {
  const norm = (promotion || "").toUpperCase().trim();
  const style = PROMOTION_STYLES[norm] || {
    bg: "bg-slate-900/80",
    text: "text-slate-300",
    border: "border-slate-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-md ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {promotion}
    </span>
  );
}
