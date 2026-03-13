"use client";

import { useState } from "react";
import { Palette, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface SetThemeButtonProps {
    eventId: string;
}

export default function SetThemeButton({ eventId }: SetThemeButtonProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const setTheme = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileThemeEventId: eventId }),
            });

            if (res.ok) {
                setSuccess(true);
                router.refresh();
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Failed to set theme:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={setTheme}
            disabled={loading}
            className={`w-full h-12 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border text-sm active:scale-95 disabled:opacity-50 ${
                success
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-white/5 text-muted-foreground border-white/10 hover:border-primary/30 hover:text-primary"
            }`}
        >
            {success ? (
                <>
                    <Check className="w-4 h-4" /> Theme Applied!
                </>
            ) : (
                <>
                    <Palette className="w-4 h-4" /> Use as Profile Theme
                </>
            )}
        </button>
    );
}
