import { prisma } from "@lib/prisma";
import MatchesAdminClient from "./MatchesAdminClient";

export default async function MatchesPage() {
  const wrestlers = await prisma.wrestler.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, imageUrl: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight uppercase italic">Match Editor</h1>
        <p className="text-muted-foreground text-sm mt-1">Search, edit, and manage all match records.</p>
      </div>
      <MatchesAdminClient allWrestlers={wrestlers} />
    </div>
  );
}
