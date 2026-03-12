"use client";

import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { useState } from "react";

export default function RandomRingButton({ 
    eventSlugs, 
    className = "group flex items-center gap-3 px-6 py-3 bg-primary text-black font-black uppercase italic tracking-tighter rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50",
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
        }, 800);
    };

    return (
        <button 
            onClick={handleRandom}
            disabled={isRolling}
            className={className}
        >
            <Zap className={`w-4 h-4 ${isRolling ? 'animate-bounce' : ''}`} />
            {isRolling ? "Fetching..." : label}
        </button>
    );
}
