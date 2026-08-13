import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import bcrypt from "bcryptjs";

function generateTempPassword() {
  const words = ["Slam", "Drop", "Kick", "Pile", "Lock", "Hold", "Flip", "Dive"];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}${num}!`;
}

// POST /api/admin/users/[id]/reset-password
export async function POST(_req: NextRequest, { params }: { params: any }) {
  const admin = await getUserFromServerCookie();
  if (!admin?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tempPassword = generateTempPassword();
  const hashed = await bcrypt.hash(tempPassword, 10);

  await prisma.user.update({ where: { id }, data: { password: hashed } });

  return NextResponse.json({ success: true, tempPassword });
}
