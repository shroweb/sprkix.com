"use client";

import { useState, useRef, useEffect } from "react";
import { X, Download, Loader2, Star } from "lucide-react";
import Image from "next/image";
import { toPng } from "html-to-image";

interface ShareReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: {
    rating: number;
    comment: string | null;
  };
  event: {
    title: string;
    posterUrl: string | null;
    promotion: string;
  };
}

export default function ShareReviewModal({
  isOpen,
  onClose,
  review,
  event,
}: ShareReviewModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/v1/config")
      .then(r => r.json())
      .then(d => { if (d.logoUrl) setSiteLogo(d.logoUrl); })
      .catch(() => {});
  }, []);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `poison-rana-review-${event.title.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate image", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-colors z-10"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Shareable Card Header Info */}
        <p className="text-white/60 text-xs font-black uppercase tracking-[0.2em] animate-pulse">
            Ready to share!
        </p>

        {/* The Actual Card (9:16) */}
        <div 
          ref={cardRef}
          className="relative w-full aspect-[9/16] bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
        >
          {/* Background Poster */}
          <div className="absolute inset-0">
            <Image
              src={event.posterUrl || "/placeholder.png"}
              alt={event.title}
              fill
              className="object-cover opacity-60 scale-110 blur-[2px]"
              priority
            />
            {/* Gradients to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
            <div className="absolute inset-0 bg-black/20" />
          </div>

          {/* Content Wrapper */}
          <div className="absolute inset-0 p-10 flex flex-col justify-between items-center text-center">
            {/* Top: Logo */}
            <div className="mt-2 h-14 flex items-center justify-center">
              {siteLogo ? (
                <img
                  src={siteLogo}
                  alt="Poison Rana"
                  className="h-full w-auto object-contain"
                  crossOrigin="anonymous"
                />
              ) : (
                <span className="text-lg font-black tracking-tighter text-white">Poison Rana</span>
              )}
            </div>

            {/* Middle: Review & Rating */}
            <div className="flex-1 flex flex-col justify-center items-center gap-8 w-full">
                {/* Stars */}
                <div className="flex gap-2 bg-black/20 backdrop-blur-md px-5 py-3 rounded-3xl border border-white/10">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                            key={s}
                            className={`w-7 h-7 ${review.rating >= s ? "text-primary fill-current" : "text-white/20"}`}
                        />
                    ))}
                </div>

                {/* Comment */}
                {review.comment && (
                    <div className="px-2">
                        <p className="text-lg font-black italic uppercase leading-snug text-white drop-shadow-2xl">
                            &ldquo;{review.comment}&rdquo;
                        </p>
                    </div>
                )}
            </div>

            {/* Bottom: Event Info */}
            <div className="mb-6 space-y-3 w-full">
                <div className="inline-flex px-4 py-1.5 bg-primary text-black text-[10px] font-black uppercase rounded-lg shadow-xl shadow-primary/20">
                    {event.promotion}
                </div>
                <h3 className="text-base font-black italic uppercase tracking-tighter text-white leading-tight">
                    {event.title}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary pt-2">
                    WWW.POISONRANA.COM
                </p>
            </div>
          </div>
        </div>

        {/* Actions Button */}
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="w-full bg-primary hover:bg-[var(--primary-hover)] text-black py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
                <Download className="w-5 h-5" />
                Download to Share
            </>
          )}
        </button>
      </div>
    </div>
  );
}
