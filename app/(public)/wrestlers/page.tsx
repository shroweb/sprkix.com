import { prisma } from "../../../lib/prisma";
import WrestlersGrid from "./WrestlersGrid";

export default async function WrestlersPage() {
  const wrestlers = await prisma.wrestler.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="bg-background min-h-screen">
      <WrestlersGrid wrestlers={wrestlers} />
    </div>
  );
}
