import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a welcome email to a newly registered user.
 * @param email The recipient's email address
 * @param name The recipient's name/username
 */
export async function sendWelcomeEmail(email: string, name: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Skipping welcome email: RESEND_API_KEY is not set.");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Poison Rana <onboarding@resend.dev>',
      to: email,
      subject: 'Welcome to Poison Rana!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 20px auto; background: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; color: #e11d48; text-decoration: none; }
              .content { margin-bottom: 30px; }
              .button-container { text-align: center; }
              .button { background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
              .footer { text-align: center; font-size: 12px; color: #666; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Poison Rana</div>
              </div>
              <div class="content">
                <h1>Welcome, ${name}!</h1>
                <p>We're thrilled to have you join the Poison Rana community. Whether you're here for the reviews, the ratings, or just to keep track of your favorite matches, you're in the right place.</p>
                <p>Get started by exploring what's new in the world of wrestling today.</p>
              </div>
              <div class="button-container">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/" class="button">Visit Poison Rana</a>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Poison Rana. All rights reserved.</p>
                <p>If you didn't create an account, please ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
    } else {
      console.log("Welcome email sent successfully to:", email);
    }
  } catch (err) {
    console.error("Unexpected error sending welcome email:", err);
  }
}
