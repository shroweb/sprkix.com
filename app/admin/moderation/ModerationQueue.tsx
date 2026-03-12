"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Shield, Trash2, CheckCircle, Flag } from "lucide-react";

export default function ModerationQueue({ initialReviews }: { initialReviews: any[] }) {
    const [reviews, setReviews] = useState(initialReviews);

    const handleDelete = async (reviewId: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;
        
        try {
            const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' });
            if (res.ok) {
                setReviews(prev => prev.filter(r => r.id !== reviewId));
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white rounded-[2rem] border border-border overflow-hidden">
            <div className="p-8 border-b border-border bg-slate-50/50 flex justify-between items-center">
                <h2 className="font-bold text-lg">Live Feed</h2>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full">Monitoring Active</span>
                </div>
            </div>

            <div className="divide-y divide-border">
                {reviews.map((review) => (
                    <div key={review.id} className="p-8 flex items-start justify-between gap-8 group hover:bg-slate-50 transition-colors">
                        <div className="flex gap-6 flex-1">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-bold text-slate-400">
                                {review.user?.name?.charAt(0) || "A"}
                            </div>
                            <div className="space-y-3 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm">{review.user?.name}</span>
                                    <span className="text-muted-foreground text-xs font-medium">on {review.event?.title}</span>
                                </div>
                                <div className="flex text-primary gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} />
                                    ))}
                                </div>
                                <p className="text-sm font-medium italic text-slate-600 line-clamp-3 bg-white/50 p-4 rounded-2xl border border-border/50">
                                    &ldquo;{review.comment}&rdquo;
                                </p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                    Posted {new Date(review.createdAt).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                            <button className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all" title="Flag for Review">
                                <Flag className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleDelete(review.id)}
                                className="p-3 text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all" 
                                title="Delete Review"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
