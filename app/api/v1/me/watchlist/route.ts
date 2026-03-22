import { NextRequest } from "next/server";
import { requireAuth } from "@lib/v1/auth";
import { prisma } from "@lib/prisma";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

const PAGE_SIZE = 20;

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || PAGE_SIZE)));

  const [total, items] = await Promise.all([
    prisma.watchListItem.count({ where: { userId: user.id } }),
    prisma.watchListItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        watched: true,
        attended: true,
        createdAt: true,
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            date: true,
            promotion: true,
            posterUrl: true,
            type: true,
          },
        },
      },
    }),
  ]);

  return ok(items, { page, limit, total });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await req.json().catch(() => ({}));
  const { eventId } = body;

  if (!eventId) return err("eventId is required");

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) return err("Event not found", 404);

  const existing = await prisma.watchListItem.findFirst({
    where: { userId: user.id, eventId },
    select: { id: true },
  });
  if (existing) return err("Event is already on your watchlist", 409);

  const item = await prisma.watchListItem.create({
    data: { userId: user.id, eventId },
    select: {
      id: true,
      watched: true,
      attended: true,
      createdAt: true,
      event: { select: { id: true, title: true, slug: true, date: true, promotion: true } },
    },
  });

  return ok(item, undefined, 201);
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await req.json().catch(() => ({}));
  const { eventId, watched, attended } = body;

  if (!eventId) return err("eventId is required");

  const item = await prisma.watchListItem.findFirst({
    where: { userId: user.id, eventId },
    select: { id: true },
  });
  if (!item) return err("Item not found", 404);

  const updated = await prisma.watchListItem.update({
    where: { id: item.id },
    data: {
      ...(watched !== undefined ? { watched } : {}),
      ...(attended !== undefined ? { attended } : {}),
    },
    select: { id: true, watched: true, attended: true, eventId: true },
  });

  return ok(updated);
});

export const DELETE = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) return err("eventId query param is required");

  await prisma.watchListItem.deleteMany({ where: { userId: user.id, eventId } });
  return ok({ removed: true });
});
