"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Loader2, CheckCircle, AlertCircle, RefreshCw, KeyRound, ExternalLink } from "lucide-react";

export default function ScraperDashboard({ 
    initialEvents, 
    hasTmdbKey 
}: { 
    initialEvents: any[];
    hasTmdbKey: boolean;
}) {
    const [events, setEvents] = useState(initialEvents);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

    const handleFetch = async (eventId: string) => {
        setIsProcessing(eventId);
        setErrorMessages(prev => { const n = {...prev}; delete n[eventId]; return n; });
        try {
            const res = await fetch(`/api/admin/scraper?eventId=${eventId}`, { method: 'POST' });
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch metadata');
            }
            
            setEvents(prev => prev.map(e => e.id === eventId 
                ? { ...e, ...data.updatedEvent, success: true, matchedTitle: data.matchedTitle } 
                : e
            ));
        } catch (err: any) {
            console.error(err);
            setErrorMessages(prev => ({ ...prev, [eventId]: err.message }));
            setEvents(prev => prev.map(e => e.id === eventId ? { ...e, error: true } : e));
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* TMDB Key Warning */}
            {!hasTmdbKey && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
                    <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                        <p className="font-bold text-amber-800 text-sm">TMDB API Key Missing</p>
                        <p className="text-amber-700 text-xs leading-relaxed">
                            The scraper uses <strong>The Movie Database (TMDB)</strong> to find event posters and descriptions. 
                            Auto-Fetch will fail until you add your key to <code className="bg-amber-100 px-1 rounded">.env</code>:
                        </p>
                        <code className="block bg-amber-100 text-amber-900 text-xs px-3 py-2 rounded-lg font-mono">
                            TMDB_API_KEY=your_key_here
                        </code>
                        <a 
                            href="https://www.themoviedb.org/settings/api" 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 underline"
                        >
                            Get a free API key <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            )}

            {/* Source note */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <p className="text-xs text-slate-500">
                    Searches <strong>The Movie Database (TMDB)</strong> using the event title (episode numbers stripped). 
                    Results are matched by popularity score.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-slate-50/50 flex justify-between items-center">
                    <h2 className="font-bold text-lg">Incomplete Archives ({events.length})</h2>
                    <div className="flex gap-2">
                        {events.length > 0 && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded">
                                Action Required
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="divide-y divide-border">
                    {events.length > 0 ? events.map((event) => (
                        <div key={event.id} className="p-6 flex items-start justify-between group hover:bg-slate-50 transition-colors gap-4">
                            <div className="flex items-start gap-6 min-w-0">
                                <div className="relative w-12 aspect-[2/3] rounded-lg bg-slate-100 overflow-hidden border border-border shrink-0">
                                    {event.posterUrl && (
                                        <Image src={event.posterUrl} alt={event.title} fill className="object-cover" />
                                    )}
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <h3 className="font-bold text-sm">{event.title}</h3>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                        {event.promotion} · {new Date(event.date).toLocaleDateString()}
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {!event.posterUrl && <span className="text-[9px] font-bold text-red-500 uppercase">Missing Poster</span>}
                                        {!event.description && <span className="text-[9px] font-bold text-amber-500 uppercase">No Description</span>}
                                        {event.success && (
                                            <span className="text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                                                <CheckCircle className="w-2 h-2" /> Updated
                                                {event.matchedTitle && <span className="text-slate-400 normal-case">via "{event.matchedTitle}"</span>}
                                            </span>
                                        )}
                                        {event.error && errorMessages[event.id] && (
                                            <span className="text-[9px] font-bold text-red-600 flex items-center gap-1">
                                                <AlertCircle className="w-2 h-2" /> {errorMessages[event.id]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleFetch(event.id)}
                                disabled={isProcessing === event.id || event.success || !hasTmdbKey}
                                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                    event.success 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                                    : !hasTmdbKey
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-primary text-black hover:scale-105 disabled:opacity-50'
                                }`}
                            >
                                {isProcessing === event.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-3 h-3" />
                                )}
                                {isProcessing === event.id ? 'Fetching...' : event.success ? 'Success' : 'Auto-Fetch'}
                            </button>
                        </div>
                    )) : (
                        <div className="p-20 text-center space-y-4">
                            <CheckCircle className="w-12 h-12 text-emerald-500/20 mx-auto" />
                            <p className="text-muted-foreground font-bold italic">All archives are complete! Amazing work.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
