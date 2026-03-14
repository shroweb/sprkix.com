import { prisma } from "@lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getUserFromServerCookie } from "@lib/server-auth";
import EditListClient from "./EditListClient";

export const dynamic = "force-dynamic";

export default async function EditListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserFromServerCookie();
  if (!user) redirect("/login");

  const list = await prisma.list.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, slug: true } },
      items: {
        include: {
          event: {
            select: { id: true, title: true, posterUrl: true, slug: true, promotion: true, date: true },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!list) return notFound();
  if (list.userId !== user.id) redirect(`/lists/${id}`);

  // Serialize dates so they pass safely to client component
  const serialized = {
    ...list,
    createdAt: list.createdAt.toISOString(),
    items: list.items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      event: {
        ...item.event,
        date: (item.event as any).date instanceof Date
          ? (item.event as any).date.toISOString()
          : item.event.date,
      },
    })),
  };

  return <EditListClient list={serialized as any} />;
}
