import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { requireAuth } from "@lib/v1/auth";
import { prisma } from "@lib/prisma";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return err("No file provided");
  if (!file.type.startsWith("image/")) return err("File must be an image");
  if (file.size > 5 * 1024 * 1024) return err("Image must be under 5MB");

  const ext = file.name.split(".").pop() ?? "jpg";
  const blob = await put(`avatars/${user.id}.${ext}`, file, {
    access: "public",
  });

  // Persist URL to user record
  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: blob.url },
  });

  return ok({ url: blob.url });
});
