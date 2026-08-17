"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Filter, Search, Trophy, Clock, ChevronLeft } from "lucide-react";
import PromotionBadge from "@components/PromotionBadge";

export default function MatchFinderPage() {
  const [minRating, setMinRating] = useState("4.0");
  const [promotion, setPromotion] = useState("");
  const [year, setYear] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        minRating,
        promotion,
        year,
        limit: "30",
      });
      const res = await fetch(`/api/v1/matches/finder?${params.toString()}`);
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [minRating, promotion, year]);

  return (
    <div className="min-h-screen pb-20 pt-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Events
        </Link>

        {/* Title Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              Advanced Search
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight text-white">
            Star-Rating Match Finder
          </h1>
          <p className="text-slate-400 text-sm font-medium max-w-xl">
            Filter the highest rated professional wrestling matches by star rating, promotion, and year.
          </p>
        </div>

        {/* Filter Control Bar */}
        <div className="glass-card p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-800">
          {/* Min Rating Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Minimum Rating
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
            >
              <option value="0">All Ratings</option>
              <option value="3.5">3.50+ Stars</option>
              <option value="4.0">4.00+ Stars (Great)</option>
              <option value="4.5">4.50+ Stars (Classic)</option>
              <option value="4.75">4.75+ Stars (All-Timer)</option>
              <option value="5.0">5.00 Stars (Flawless)</option>
            </select>
          </div>

          {/* Promotion Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Promotion
            </label>
            <select
              value={promotion}
              onChange={(e) => setPromotion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
            >
              <option value="">All Promotions</option>
              <option value="WWE">WWE</option>
              <option value="AEW">AEW</option>
              <option value="NJPW">NJPW</option>
              <option value="TNA">TNA</option>
              <option value="ROH">ROH</option>
              <option value="NXT">NXT</option>
            </select>
          </div>

          {/* Year Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Release Year
            </label>
            <input
              type="number"
              placeholder="e.g. 2024"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400 placeholder-slate-600"
            />
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : matches.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-400 space-y-2">
            <p className="text-lg font-bold">No matches found matching these filters.</p>
            <p className="text-xs">Try lowering the minimum rating threshold or clearing filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="glass-card p-5 flex items-center justify-between gap-4 hover:border-amber-400/40 transition-all group"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <PromotionBadge promotion={match.event.promotion} />
                    <Link
                      href={`/events/${match.event.slug}`}
                      className="text-xs font-semibold text-slate-400 hover:text-white truncate"
                    >
                      {match.event.title}
                    </Link>
                  </div>
                  <h3 className="text-base font-bold italic uppercase tracking-tight text-white group-hover:text-amber-400 transition-colors truncate">
                    {match.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>
                      {(match.participants || []).map((p: any) => p.wrestler.name).join(" vs ")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1">
                  <div className="flex items-center gap-1 text-amber-400 font-extrabold text-lg">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{match.rating ? match.rating.toFixed(2) : "N/A"}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(match.event.date).getFullYear()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
