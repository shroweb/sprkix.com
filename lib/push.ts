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
  const tokens = await prisma.pushToken.findMany({
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
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });

    // Prune dead tokens so we don't keep paying for failed sends
    if (res.ok) {
      const data: any = await res.json().catch(() => null);
      const deadTokens = (data?.data ?? [])
        .map((ticket: any, i: number) =>
          ticket?.status === "error" &&
          ["DeviceNotRegistered", "MessageTooBig", "InvalidCredentials"].includes(
            ticket?.details?.error,
          )
            ? tokens[i]?.token
            : null,
        )
        .filter(Boolean);
      if (deadTokens.length > 0) {
        await prisma.pushToken.deleteMany({
          where: { token: { in: deadTokens } },
        });
        console.warn(`[push] Pruned ${deadTokens.length} dead push token(s)`);
      }
    }
  } catch (err) {
    console.error("[push] Failed to send push notification:", err);
  }
}
