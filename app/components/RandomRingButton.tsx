"use client";

import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { useState } from "react";

export default function RandomRingButton({ 
    eventSlugs, 
    className = "group inline-flex h-14 items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-black/40 px-6 text-sm font-black uppercase italic tracking-wider text-slate-200 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/60 hover:bg-amber-400/10 hover:text-amber-300 hover:shadow-lg hover:shadow-amber-400/20 active:translate-y-0 disabled:opacity-50",
    label = "Random Event"
}: { 
    eventSlugs: string[], 
    className?: string,
    label?: string
}) {
    const router = useRouter();
    const [isRolling, setIsRolling] = useState(false);

    const handleRandom = () => {
        if (eventSlugs.length === 0) return;
        setIsRolling(true);
        const randomSlug = eventSlugs[Math.floor(Math.random() * eventSlugs.length)];
        setTimeout(() => {
            router.push(`/events/${randomSlug}`);
        }, 600);
    };

    return (
        <button 
            onClick={handleRandom}
            disabled={isRolling}
            className={className}
        >
            <Zap className={`h-4 w-4 text-amber-400 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 ${isRolling ? 'animate-bounce text-amber-300' : ''}`} />
            <span>{isRolling ? "Rolling the ring..." : label}</span>
        </button>
    );
}
