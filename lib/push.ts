import { prisma } from "@lib/prisma";

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send an Expo push notification to all of a user's registered devices.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const tokens = await (prisma as any).pushToken.findMany({
    where: { userId },
    select: { token: true },
  });
  if (tokens.length === 0) return;

  const messages = tokens.map(({ token }: { token: string }) => ({
    to: token,
    sound: "default",
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  }));

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error("[push] Failed to send push notification:", err);
  }
}
