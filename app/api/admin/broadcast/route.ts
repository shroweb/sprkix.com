import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { logAdminAction } from "@lib/admin-log";

export async function POST(req: Request) {
  const admin = await getUserFromServerCookie();
  if (!admin?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, body, link } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const userIds = (await prisma.user.findMany({ select: { id: true } })).map((u) => u.id);

  let notificationsCreated = 0;
  if (userIds.length > 0) {
    const res = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: "broadcast",
        message: title.trim(),
        detail: body?.trim() || null,
        link: link?.trim() || null,
      })),
    });
    notificationsCreated = res.count;
  }

  // Push to all registered devices (Expo accepts up to 100 messages per call)
  const tokens = await prisma.pushToken.findMany({ select: { token: true } });
  let pushSent = 0;
  for (let i = 0; i < tokens.length; i += 100) {
    const chunk = tokens.slice(i, i + 100).map((t) => ({
      to: t.token,
      sound: "default",
      title: title.trim(),
      body: body?.trim() || "",
      data: link?.trim() ? { path: link.trim() } : {},
    }));
    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(chunk),
      });
      if (res.ok) pushSent += chunk.length;
    } catch (err) {
      console.error("[broadcast] push chunk failed:", err);
    }
  }

  await logAdminAction(admin.id, "broadcast", {
    detail: `${title.trim()} → ${notificationsCreated} notifications, ${pushSent} pushes`,
  });

  return NextResponse.json({
    success: true,
    notificationsCreated,
    pushSent,
    totalUsers: userIds.length,
  });
}
