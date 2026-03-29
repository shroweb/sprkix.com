import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

// One-time admin creation endpoint — only works when zero users exist in the DB
export async function POST(req: Request) {
  if (process.env.ADMIN_SETUP_ENABLED !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const setupSecret = process.env.ADMIN_SETUP_SECRET || process.env.CRON_SECRET;
  if (!setupSecret) {
    return NextResponse.json({ error: "Setup is not configured" }, { status: 503 });
  }

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return NextResponse.json({ error: "Setup already complete" }, { status: 403 });
  }

  const { email, password, name, secret } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (secret !== setupSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const slug = "admin";

  const user = await prisma.user.create({
    data: { name, email, password: hashed, slug, isAdmin: true },
  });

  return NextResponse.json({ success: true, userId: user.id, email: user.email });
}
