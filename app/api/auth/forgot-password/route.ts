import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const trimmed = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: trimmed } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate a short-lived reset token (1 hour)
    const token = jwt.sign(
      { userId: user.id, email: user.email, purpose: "reset" },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://poisonrana.com";
    const resetUrl = `${siteUrl}/reset-password?token=${token}`;

    await resend.emails.send({
      from: "Poison Rana <noreply@poisonrana.com>",
      to: user.email,
      subject: "Reset your Poison Rana password",
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="background:#0a0a0a;margin:0;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
            <div style="max-width:600px;margin:0 auto;background:#141414;border-radius:12px;overflow:hidden;border:1px solid #222;">
              <div style="padding:40px 20px;text-align:center;background:#1a1a1a;border-bottom:1px solid #333;">
                <span style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#ffffff;text-transform:uppercase;font-style:italic;">
                  Poison Rana
                </span>
              </div>
              <div style="padding:40px;">
                <h1 style="font-size:22px;font-weight:900;text-transform:uppercase;font-style:italic;margin:0 0 16px;">
                  Reset Your Password
                </h1>
                <p style="color:#aaa;line-height:1.6;margin:0 0 24px;">
                  Hi ${user.name || "there"}, we received a request to reset your password.
                  Click the button below — this link expires in 1 hour.
                </p>
                <a href="${resetUrl}" style="display:inline-block;background:#eab308;color:#000;font-weight:900;text-transform:uppercase;font-style:italic;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;">
                  Reset Password
                </a>
                <p style="color:#666;font-size:12px;margin:24px 0 0;">
                  If you didn't request this, ignore this email. Your password won't change.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
