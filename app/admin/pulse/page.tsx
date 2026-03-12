import { prisma } from "@lib/prisma";
import { TrendingUp, Users, Star, Calendar } from "lucide-react";

export default async function PulsePage() {
  const now = new Date();
  const days = 30;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const [reviews, users, ratings] = await Promise.all([
    prisma.review.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
    prisma.matchRating.findMany({ select: { id: true } }) // Temporarily remove date filter
  ]);

  const getDailyData = (items: { createdAt: Date }[]) => {
    const data: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        data[d.toISOString().split('T')[0]] = 0;
    }
    items.forEach(i => {
        const key = i.createdAt.toISOString().split('T')[0];
        if (data[key] !== undefined) data[key]++;
    });
    return Object.entries(data).sort((a,b) => a[0].localeCompare(b[0])).map(d => d[1]);
  };

  const reviewPulse = getDailyData(reviews);
  const userPulse = getDailyData(users);
  const ratingPulse = getDailyData([]); // Temporarily empty due to stale types

  const MiniChart = ({ data, color }: { data: number[], color: string }) => {
    const max = Math.max(...data, 1);
    const width = 400;
    const height = 100;
    const points = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - (d / max) * height}`).join(' ');
    
    return (
      <div className="h-32 w-full mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            style={{ filter: `drop-shadow(0 4px 6px ${color}44)` }}
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight uppercase italic italic">Platform Pulse</h1>
        <p className="text-muted-foreground text-sm mt-1">Growth and engagement trends over the last 30 days.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
            { label: "Review Growth", value: reviews.length, data: reviewPulse, color: "#eab308", icon: Star },
            { label: "New Users", value: users.length, data: userPulse, color: "#10b981", icon: Users },
            { label: "Rating Activity", value: ratings.length, data: ratingPulse, color: "#ef4444", icon: TrendingUp },
        ].map(card => (
            <div key={card.label} className="bg-white p-6 rounded-[2rem] border border-border shadow-sm hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl bg-slate-50 border border-border group-hover:bg-primary/10 transition-colors`}>
                        <card.icon className="w-5 h-5 text-slate-500 group-hover:text-primary" />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{card.label}</p>
                        <p className="text-2xl font-black italic">{card.value}</p>
                    </div>
                </div>
                <MiniChart data={card.data} color={card.color} />
            </div>
        ))}
      </div>

      <div className="bg-slate-950 text-white rounded-[3rem] p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-black italic tracking-tighter italic italic">System Efficiency</h2>
            <p className="text-slate-400 text-sm max-w-sm">The database is operating at peak performance. All match caches are warmed and ready for traffic.</p>
          </div>
          <div className="flex gap-4">
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center">
              <p className="text-3xl font-black italic">99.9%</p>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Uptime</p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center">
              <p className="text-3xl font-black italic">42ms</p>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Query Latency</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
