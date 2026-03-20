import { Resend } from 'resend';
import { prisma } from './prisma';

/**
 * Sends a welcome email to a newly registered user.
 * @param email The recipient's email address
 * @param name The recipient's name/username
 */
export async function sendWelcomeEmail(email: string, name: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("Skipping welcome email: RESEND_API_KEY is not set.");
    return;
  }

  const resend = new Resend(apiKey);

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.poisonrana.com';

    // Fetch branding from admin settings
    let siteLogo = "";
    let primaryColor = "#ffbd2e"; // Default brand yellow from your screenshot
    
    try {
      const [logoRow, colorRow] = await Promise.all([
        (prisma as any).siteConfig.findUnique({ where: { key: "SITE_LOGO" } }),
        (prisma as any).siteConfig.findUnique({ where: { key: "PRIMARY_COLOR" } }),
      ]);
      if (logoRow?.value) siteLogo = logoRow.value;
      if (colorRow?.value) primaryColor = colorRow.value;
    } catch (dbErr) {
      console.error("Failed to fetch site branding for email:", dbErr);
    }

    // Determine if we should use an image or text logo
    // IMPORTANT: Base64 data strings (data:image) are blocked by Gmail and bloat the email size,
    // causing Gmail to "clip" the entire message. We fall back to styled text for these.
    const isBase64 = siteLogo?.startsWith('data:image');
    const useImageLogo = siteLogo && !isBase64;
    const finalLogoUrl = siteLogo?.startsWith('http') ? siteLogo : `${siteUrl}${siteLogo}`;

    const { data, error } = await resend.emails.send({
      from: 'Poison Rana <welcome@poisonrana.com>',
      to: email,
      subject: 'Welcome to the Poison Rana Community!',
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Poison Rana</title>
            <style>
              body { 
                background-color: #0a0a0a; 
                margin: 0; 
                padding: 0; 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                color: #ffffff; 
              }
              .wrapper { 
                background-color: #0a0a0a; 
                width: 100%; 
                padding: 40px 0; 
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: #141414; 
                border-radius: 12px; 
                overflow: hidden; 
                border: 1px solid #222;
              }
              .header { 
                padding: 40px 20px; 
                text-align: center; 
                background: #1a1a1a;
                border-bottom: 1px solid #333;
              }
              .logo-img { 
                max-width: 200px; 
                height: auto; 
              }
              .logo-text {
                font-size: 32px; 
                font-weight: 900; 
                letter-spacing: -2px; 
                color: #ffffff; 
                text-transform: uppercase; 
                font-style: italic;
              }
              .content { 
                padding: 40px; 
                line-height: 1.6; 
              }
              h1 { 
                font-size: 24px; 
                margin-top: 0; 
                color: #ffffff; 
                font-weight: 800;
                letter-spacing: -0.025em;
              }
              p { 
                font-size: 16px; 
                color: #a1a1aa; 
                margin-bottom: 24px; 
              }
              .button-container { 
                margin-top: 32px; 
                text-align: center; 
              }
              .button { 
                background-color: ${primaryColor}; 
                color: #000000 !important; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 800; 
                display: inline-block; 
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                box-shadow: 0 4px 6px rgba(0,0,0,0.2);
              }
              .footer { 
                padding: 30px; 
                text-align: center; 
                font-size: 13px; 
                color: #52525b; 
                background: #0f0f0f;
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  ${useImageLogo ? 
                    `<img src="${finalLogoUrl}" alt="Poison Rana" class="logo-img">` : 
                    `<div class="logo-text">Poison Rana</div>`
                  }
                </div>
                <div class="content">
                  <h1>Hey ${name},</h1>
                  <p>You're in. Welcome to PoisonRana — the place where wrestling fans actually get to say what they think.</p>
                  <p>We've assigned you the temporary name <strong>${name}</strong>. Feel free to update it to something more your style in your profile.</p>
                  <p>Review shows. Rate matches. Predict what's coming next. Whether you think last night's main event was a five-star classic or a complete disaster, we want to hear it.</p>
                  <p>To get started, drop a rating on a recent event. Takes two minutes and instantly puts your opinion on the board.</p>
                  <div class="button-container">
                    <a href="${siteUrl}/profile" class="button">→ Update your profile</a>
                  </div>
                  <p style="margin-top: 32px;">See you in there.</p>
                  <p style="margin-bottom: 0;">— The PoisonRana Team</p>
                  <p style="margin-top: 4px; font-size: 14px;"><a href="${siteUrl}" style="color: ${primaryColor}; text-decoration: none;">poisonrana.com</a></p>
                </div>
                <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} Poison Rana. Built for the community.</p>
                  <p>Don't want these emails? Check your <a href="${siteUrl}/profile" style="color: #71717a;">profile settings</a>.</p>
                </div>
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
