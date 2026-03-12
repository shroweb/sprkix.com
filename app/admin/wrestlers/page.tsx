import { getUserFromServerCookie } from "../../../lib/getUserFromServerCookie";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import AdminWrestlersPage from "./AdminWrestlersPage";

export default async function WrestlerAdminWrapper() {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) redirect("/login");

  const wrestlers = await prisma.wrestler.findMany({
    orderBy: { name: "asc" },
  });

  return <AdminWrestlersPage initialWrestlers={wrestlers} />;
}
