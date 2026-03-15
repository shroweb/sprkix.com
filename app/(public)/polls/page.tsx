import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { BarChart2, CheckCircle2, Clock } from "lucide-react";
import PollCard from "./PollCard";

export const dynamic = "force-dynamic";

export default async function PollsPage() {
  const user = await getUserFromServerCookie();

  const polls = await prisma.poll.findMany({
    include: {
      options: {
        orderBy: { order: "asc" },
        include: { _count: { select: { votes: true } } },
      },
      votes: user ? { where: { userId: user.id }, select: { optionId: true } } : false,
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  const activePolls = polls.filter((p) => p.isActive);
  const archivedPolls = polls.filter((p) => !p.isActive);

  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-16">
      {/* Header */}
      <div className="space-y-2 pt-4">
        <div className="flex items-center gap-3">
          <div className="h-[1px] w-8 bg-primary" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary italic">
            Community
          </span>
        </div>
        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
          Polls
        </h1>
        <p className="text-muted-foreground font-medium italic">
          Vote on the hottest topics in wrestling.
        </p>
      </div>

      {/* Active polls */}
      {activePolls.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-primary">
                Active
              </h2>
            </div>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-primary/20 to-transparent" />
          </div>

          <div className="space-y-6">
            {activePolls.map((poll) => {
              const totalVotes = poll.options.reduce(
                (sum, o) => sum + o._count.votes,
                0
              );
              const userVoteOptionId =
                (poll as any).votes?.[0]?.optionId ?? null;
              return (
                <PollCard
                  key={poll.id}
                  poll={{
                    id: poll.id,
                    question: poll.question,
                    options: poll.options.map((o) => ({
                      id: o.id,
                      text: o.text,
                      order: o.order,
                      _count: { votes: o._count.votes },
                    })),
                  }}
                  totalVotes={totalVotes}
                  userVoteOptionId={userVoteOptionId}
                  isLoggedIn={!!user}
                  endsAt={
                    (poll as any).endsAt
                      ? new Date((poll as any).endsAt).toISOString()
                      : null
                  }
                  isActive={true}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Archived polls */}
      {archivedPolls.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="px-4 py-1.5 bg-muted border border-border rounded-xl">
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-muted-foreground">
                Archived
              </h2>
            </div>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-border to-transparent" />
          </div>

          <div className="space-y-6 opacity-80">
            {archivedPolls.map((poll) => {
              const totalVotes = poll.options.reduce(
                (sum, o) => sum + o._count.votes,
                0
              );
              const userVoteOptionId =
                (poll as any).votes?.[0]?.optionId ?? null;
              return (
                <PollCard
                  key={poll.id}
                  poll={{
                    id: poll.id,
                    question: poll.question,
                    options: poll.options.map((o) => ({
                      id: o.id,
                      text: o.text,
                      order: o.order,
                      _count: { votes: o._count.votes },
                    })),
                  }}
                  totalVotes={totalVotes}
                  userVoteOptionId={userVoteOptionId}
                  isLoggedIn={!!user}
                  endsAt={
                    (poll as any).endsAt
                      ? new Date((poll as any).endsAt).toISOString()
                      : null
                  }
                  isActive={false}
                />
              );
            })}
          </div>
        </section>
      )}

      {polls.length === 0 && (
        <div className="bg-card/30 border border-dashed border-border rounded-[2rem] p-20 text-center">
          <BarChart2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-bold italic">
            No polls yet. Check back soon.
          </p>
        </div>
      )}
    </div>
  );
}
