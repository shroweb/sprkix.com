import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  // Clear the token cookie
  cookieStore.set({
    name: "token",
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
  });

  return NextResponse.json({ message: "Logged out" });
}
