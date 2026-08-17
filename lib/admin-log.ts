// lib/admin-log.ts — append entries to the AdminLog audit trail.
import { prisma } from "@lib/prisma";

export async function logAdminAction(
  actorId: string,
  action: string,
  opts?: { targetType?: string; targetId?: string; detail?: string },
): Promise<void> {
  try {
    await prisma.adminLog.create({
      data: {
        actorId,
        action,
        targetType: opts?.targetType,
        targetId: opts?.targetId,
        detail: opts?.detail,
      },
    });
  } catch (err) {
    // Never let audit logging break the underlying action
    console.error("[admin-log] Failed to write audit entry:", err);
  }
}
