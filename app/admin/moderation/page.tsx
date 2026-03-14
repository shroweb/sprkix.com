import { prisma } from "@lib/prisma";
import ModerationQueue from "./ModerationQueue";

export default async function ModerationPage() {
    const pendingReviews = await prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, slug: true, avatarUrl: true, isAdmin: true, isVerified: true } },
          event: { select: { id: true, title: true, slug: true, promotion: true } },
        },
        take: 30
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic">Moderation Queue</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Review community posts and manage content reports.
                </p>
            </div>

            <ModerationQueue initialReviews={pendingReviews} />
        </div>
    );
}
