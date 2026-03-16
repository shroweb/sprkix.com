"use client";

import { useEffect, useState } from "react";
import { Vibrant } from "node-vibrant/browser";

interface ProfileThemeWrapperProps {
    posterUrl: string | undefined;
}

export default function ProfileThemeWrapper({ posterUrl }: ProfileThemeWrapperProps) {
    const [themeColor, setThemeColor] = useState<string>("#EAB308"); // Default primary

    useEffect(() => {
        if (!posterUrl) return;

        const extractColors = async () => {
            try {
                // node-vibrant can sometimes be tricky with CORS on client side
                const palette = await Vibrant.from(posterUrl).getPalette();
                if (palette.Vibrant) {
                    setThemeColor(palette.Vibrant.hex);
                }
            } catch (error) {
                console.error("Vibrant extraction failed:", error);
            }
        };

        extractColors();
    }, [posterUrl]);

    if (!posterUrl) return null;

    return (
        <>
            {/* Colour-only ambient background — no poster image */}
            <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
                <div
                    className="absolute inset-x-0 top-0 h-[900px] opacity-30 blur-[140px] scale-150"
                    style={{
                        background: `radial-gradient(circle at 40% 0%, ${themeColor} 0%, transparent 65%)`
                    }}
                />
                <div
                    className="absolute inset-x-0 bottom-0 h-[600px] opacity-10 blur-[100px]"
                    style={{
                        background: `radial-gradient(circle at 60% 100%, ${themeColor} 0%, transparent 60%)`
                    }}
                />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                :root {
                    --profile-theme-color: ${themeColor};
                    --profile-theme-color-rgb: ${hexToRgb(themeColor)};
                }
            `}} />
        </>
    );
}

function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : "234, 179, 8";
}
