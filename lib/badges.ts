// lib/badges.ts — Community badge definitions and awarding logic.
import { prisma } from "@lib/prisma";
import { sendPushToUser } from "@lib/push";

export type BadgeType = "ppv_master" | "top_reviewer" | "founding_member";

export interface BadgeDef {
  type: BadgeType;
  title: string;
  icon: string;
  description: string;
}

export const BADGE_DEFS: BadgeDef[] = [
  {
    type: "ppv_master",
    title: "PPV Master",
    icon: "🎯",
    description: "Got 10+ match predictions correct.",
  },
  {
    type: "top_reviewer",
    title: "Top Reviewer",
    icon: "✍️",
    description: "Wrote 5+ event reviews.",
  },
  {
    type: "founding_member",
    title: "Founding Member",
    icon: "👑",
    description: "Joined during the founding window.",
  },
];

export function badgeDef(type: BadgeType): BadgeDef {
  return BADGE_DEFS.find((b) => b.type === type)!;
}

/**
 * Pure eligibility check — used by the awarding cron and unit tests.
 */
export function computeEligibleBadges(stats: {
  correctPredictions: number;
  reviews: number;
  isFoundingMember: boolean;
}): BadgeType[] {
  const eligible: BadgeType[] = [];
  if (stats.correctPredictions >= 10) eligible.push("ppv_master");
  if (stats.reviews >= 5) eligible.push("top_reviewer");
  if (stats.isFoundingMember) eligible.push("founding_member");
  return eligible;
}

/**
 * Award any newly-eligible badges for one user. Creates the badge record plus
 * an in-app notification and push. Returns the list of newly awarded types.
 */
export async function awardBadgesForUser(userId: string): Promise<BadgeType[]> {
  const [correctCount, reviewCount, user, existing] = await Promise.all([
    prisma.prediction.count({ where: { userId, isCorrect: true } }),
    prisma.review.count({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isFoundingMember: true, name: true, slug: true },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeType: true },
    }),
  ]);

  if (!user) return [];

  const owned = new Set(existing.map((b) => b.badgeType as BadgeType));
  const eligible = computeEligibleBadges({
    correctPredictions: correctCount,
    reviews: reviewCount,
    isFoundingMember: user.isFoundingMember,
  });

  const newlyAwarded: BadgeType[] = [];
  for (const type of eligible) {
    if (owned.has(type)) continue;
    const def = badgeDef(type);
    await prisma.userBadge.create({
      data: { userId, badgeType: type, title: def.title, icon: def.icon },
    });
    newlyAwarded.push(type);

    // In-app notification
    await prisma.notification.create({
      data: {
        userId,
        type: "badge_awarded",
        message: `You earned the ${def.title} badge ${def.icon}`,
        detail: def.description,
        link: user.slug ? `/users/${user.slug}` : "/",
      },
    });
    try {
      await sendPushToUser(userId, {
        title: `New badge: ${def.title} ${def.icon}`,
        body: def.description,
        data: { path: "/" },
      });
    } catch { /* push failure shouldn't block badge awarding */ }
  }

  return newlyAwarded;
}

/**
 * Sweep all users and award newly-eligible badges. Returns a summary.
 */
export async function awardEligibleBadges(): Promise<{
  checked: number;
  awarded: number;
  awardedBadges: BadgeType[];
}> {
  const users = await prisma.user.findMany({
    select: { id: true },
  });

  const awardedBadges: BadgeType[] = [];
  let awarded = 0;

  for (const user of users) {
    try {
      const newBadges = await awardBadgesForUser(user.id);
      if (newBadges.length > 0) {
        awarded += newBadges.length;
        awardedBadges.push(...newBadges);
      }
    } catch (err) {
      console.error(`[badges] Failed for user ${user.id}:`, err);
    }
  }

  return { checked: users.length, awarded, awardedBadges };
}