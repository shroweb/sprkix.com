"use client";

import { useState, useRef } from "react";
import { Download, Share2, Zap, Star, Trophy, X, Loader2 } from "lucide-react";
import Image from "next/image";
import * as htmlToImage from "html-to-image";

export default function GrappedClient({ 
    month, 
    reviewsCount, 
    matchesCount,
    ratingBreakdown,
    avgThisMonth,
    promotionOfMonth,
}: { 
    month: string, 
    reviewsCount: number, 
    matchesCount: number, 
    ratingBreakdown: { five: number; four: number; three: number; two: number; one: number },
    avgThisMonth: string | null,
    promotionOfMonth: { name: string; avg: number; count: number } | null,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsDownloading(true);
        try {
            const dataUrl = await htmlToImage.toPng(cardRef.current, {
                cacheBust: true,
                quality: 1,
                pixelRatio: 2,
            });
            const link = document.createElement('a');
            link.download = `grapped-${month.toLowerCase()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Failed to generate image", err);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-black text-xs font-black uppercase italic tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
                <Share2 className="w-4 h-4" /> Share GRAPPED
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsOpen(false)} />
                    
                    <div className="relative z-10 w-full max-w-lg space-y-8 animate-in zoom-in-95 duration-300">
                        {/* The Graphic Card */}
                        <div 
                            ref={cardRef}
                            className="aspect-[4/5] w-full bg-slate-950 rounded-[3rem] overflow-hidden relative border border-white/10 shadow-2xl flex flex-col p-10"
                        >
                            {/* Backdrop Accents */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-12">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                        <Image
                                            src="/img/logo.png"
                                            alt="sprkix"
                                            width={120}
                                            height={40}
                                            className="object-contain h-8 w-auto"
                                        />
                                    </div>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-4xl font-black italic uppercase text-white leading-none">GRAPPED</h2>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{month} 2026</p>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-center space-y-12">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <div className="text-5xl font-black italic text-white flex items-baseline gap-2">
                                                {reviewsCount}
                                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Reviews</span>
                                            </div>
                                            <div className="h-1 w-12 bg-primary/30 rounded-full" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-5xl font-black italic text-white flex items-baseline gap-2">
                                                {matchesCount}
                                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Matches</span>
                                            </div>
                                            <div className="h-1 w-12 bg-primary/30 rounded-full" />
                                        </div>
                                    </div>

                                    {/* Star Breakdown */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">Star Distribution</p>
                                            {avgThisMonth && (
                                                <span className="text-[9px] font-black italic text-white bg-primary/20 px-2 py-0.5 rounded-full">{avgThisMonth} avg</span>
                                            )}
                                        </div>
                                        {([
                                            { label: '5★', count: ratingBreakdown.five,  color: 'bg-yellow-400' },
                                            { label: '4★', count: ratingBreakdown.four,  color: 'bg-primary' },
                                            { label: '3★', count: ratingBreakdown.three, color: 'bg-amber-600' },
                                            { label: '2★', count: ratingBreakdown.two,   color: 'bg-orange-700' },
                                            { label: '1★', count: ratingBreakdown.one,   color: 'bg-red-700' },
                                        ] as const).map(({ label, count, color }) => {
                                            const total = ratingBreakdown.five + ratingBreakdown.four + ratingBreakdown.three + ratingBreakdown.two + ratingBreakdown.one;
                                            return (
                                                <div key={label} className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-white/50 w-4 shrink-0">{label}</span>
                                                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div className={`h-full ${color} rounded-full`} style={{ width: total ? `${(count / total) * 100}%` : '0%' }} />
                                                    </div>
                                                    <span className="text-[9px] font-black text-white/60 w-3 text-right shrink-0">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Promo of the Month */}
                                    {promotionOfMonth && (
                                        <div className="bg-primary/10 border border-primary/20 rounded-2xl px-5 py-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">Promo of the Month</p>
                                                <p className="text-sm font-black italic text-white truncate max-w-[140px]">{promotionOfMonth.name}</p>
                                            </div>
                                            <span className="text-lg font-black italic text-primary">{promotionOfMonth.avg.toFixed(2)}★</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto pt-10 border-t border-white/5 flex justify-between items-end">
                                    <div className="flex items-center gap-4 text-muted-foreground">
                                        <Zap className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest italic">Join the archive at sprkix.com</span>
                                    </div>
                                    <div className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white">
                                        {month} 2026 Record
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex justify-center gap-4">
                            <button 
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="flex items-center gap-3 px-8 py-4 bg-primary text-black font-black uppercase italic tracking-widest rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isDownloading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" /> Save to Photos
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-8 py-4 bg-white/10 text-white font-black uppercase italic tracking-widest rounded-2xl hover:bg-white/20 transition-all"
                            >
                                <X className="w-5 h-5" /> Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
