import { Resend } from 'resend';
import { prisma } from './prisma';

/**
 * Common layout for emails.
 */
function getEmailLayout(contentHtml: string, primaryColor: string, siteUrl: string, finalLogoUrl: string, useImageLogo: boolean) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Poison Rana Notification</title>
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
              ${contentHtml}
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Poison Rana. Built for the community.</p>
              <p>Don't want these? Check your <a href="${siteUrl}/profile/edit" style="color: #71717a;">notification settings</a>.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Fetches common site branding and checks user notification preference.
 */
async function getEmailConfig(toEmail: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.poisonrana.com';
  let siteLogo = "";
  let primaryColor = "#ffbd2e";
  let emailEnabled = true;

  try {
    const [logoRow, colorRow, userRow] = await Promise.all([
      (prisma as any).siteConfig.findUnique({ where: { key: "SITE_LOGO" } }),
      (prisma as any).siteConfig.findUnique({ where: { key: "PRIMARY_COLOR" } }),
      prisma.user.findUnique({ where: { email: toEmail }, select: { emailNotifications: true } }),
    ]);
    if (logoRow?.value) siteLogo = logoRow.value;
    if (colorRow?.value) primaryColor = colorRow.value;
    if (userRow && userRow.emailNotifications === false) emailEnabled = false;
  } catch (err) {
    console.error("Failed to fetch site config/user preferences:", err);
  }

  // Gmail-safe logo fallback
  const isBase64 = siteLogo?.startsWith('data:image');
  if (isBase64 || !siteLogo) {
    siteLogo = "/img/poisonrana-logo.png";
  }

  const finalLogoUrl = siteLogo?.startsWith('http') ? siteLogo : `${siteUrl}${siteLogo}`;
  return { siteUrl, finalLogoUrl, primaryColor, emailEnabled, useImageLogo: true };
}

/**
 * Sends a welcome email (transactional).
 */
export async function sendWelcomeEmail(email: string, name: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const config = await getEmailConfig(email);
  // Optional: Even if emailNotifications is disabled, we might want to send the "Welcome" email anyway
  // as it is technically a registration confirmation.

  const resend = new Resend(apiKey);
  const html = getEmailLayout(`
    <h1>Hey ${name},</h1>
    <p>You're in. Welcome to PoisonRana — the place where wrestling fans actually get to say what they think.</p>
    <p>We've assigned you the temporary name <strong>${name}</strong>. Feel free to update it to something more your style in your profile.</p>
    <p>Review shows. Rate matches. Predict what's coming next. Whether you think last night's main event was a five-star classic or a complete disaster, we want to hear it.</p>
    <div class="button-container">
      <a href="${config.siteUrl}/profile/edit" class="button">→ Update your profile</a>
    </div>
    <p style="margin-top:32px;">See you in there.</p>
    <p style="margin-bottom:0;">— The PoisonRana Team</p>
  `, config.primaryColor, config.siteUrl, config.finalLogoUrl, config.useImageLogo);

  await resend.emails.send({
    from: 'Poison Rana <welcome@poisonrana.com>',
    to: email,
    subject: 'Welcome to the Poison Rana Community!',
    html,
  });
}

/**
 * Sends a notification when a submission is approved.
 */
export async function sendSubmissionApprovedEmail(email: string, name: string, eventTitle: string, eventSlug: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const config = await getEmailConfig(email);
  if (!config.emailEnabled) return;

  const resend = new Resend(apiKey);
  const html = getEmailLayout(`
    <h1>Nice one, ${name}!</h1>
    <p>Your event submission <strong>"${eventTitle}"</strong> has been approved and is now live on the site.</p>
    <p>Thank you for contributing to the community database. You can view the event and start rating matches here:</p>
    <div class="button-container">
      <a href="${config.siteUrl}/events/${eventSlug}" class="button">→ View Event</a>
    </div>
    <p style="margin-top:32px;">Catch you later,</p>
    <p style="margin-bottom:0;">— The PoisonRana Team</p>
  `, config.primaryColor, config.siteUrl, config.finalLogoUrl, config.useImageLogo);

  await resend.emails.send({
    from: 'Poison Rana <updates@poisonrana.com>',
    to: email,
    subject: 'Your Submission is Live!',
    html,
  });
}

/**
 * Sends a notification for a new reply.
 */
export async function sendReplyEmail(email: string, userName: string, replierName: string, eventTitle: string, comment: string, link: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const config = await getEmailConfig(email);
  if (!config.emailEnabled) return;

  const resend = new Resend(apiKey);
  const html = getEmailLayout(`
    <h1>New Reply on Poison Rana</h1>
    <p>Hey ${userName}, <strong>${replierName}</strong> just replied to your review of <em>"${eventTitle}"</em>:</p>
    <blockquote style="border-left: 3px solid ${config.primaryColor}; padding-left: 16px; margin: 24px 0; font-style: italic; color: #a1a1aa;">
      "${comment}"
    </blockquote>
    <div class="button-container">
      <a href="${config.siteUrl}${link}" class="button">→ View Reply</a>
    </div>
    <p style="margin-top:32px;">See you in the thread.</p>
    <p style="margin-bottom:0;">— The PoisonRana Team</p>
  `, config.primaryColor, config.siteUrl, config.finalLogoUrl, config.useImageLogo);

  await resend.emails.send({
    from: 'Poison Rana <community@poisonrana.com>',
    to: email,
    subject: `${replierName} replied to your review`,
    html,
  });
}

/**
 * Sends a notification for a new follower.
 */
export async function sendFollowEmail(email: string, userName: string, followerName: string, followerSlug: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const config = await getEmailConfig(email);
  if (!config.emailEnabled) return;

  const resend = new Resend(apiKey);
  const html = getEmailLayout(`
    <h1>You've Got a New Follower!</h1>
    <p>Hey ${userName}, <strong>${followerName}</strong> is now following your ratings and reviews on Poison Rana.</p>
    <p>Build your community and check out their profile too:</p>
    <div class="button-container">
      <a href="${config.siteUrl}/users/${followerSlug}" class="button">→ View Profile</a>
    </div>
    <p style="margin-top:32px;">Keep on rating,</p>
    <p style="margin-bottom:0;">— The PoisonRana Team</p>
  `, config.primaryColor, config.siteUrl, config.finalLogoUrl, config.useImageLogo);

  await resend.emails.send({
    from: 'Poison Rana <community@poisonrana.com>',
    to: email,
    subject: `${followerName} started following you`,
    html,
  });
}
