import { Resend } from 'resend';

export async function sendWelcomeEmail(email: string, name: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("Skipping welcome email: RESEND_API_KEY is not set.");
    return;
  }

  const resend = new Resend(apiKey);

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.poisonrana.com';
    const logoUrl = `${siteUrl}/img/logo.png`;

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
              .logo { 
                max-width: 180px; 
                height: auto; 
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
                background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); 
                color: #ffffff !important; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 700; 
                display: inline-block; 
                font-size: 16px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.2);
              }
              .footer { 
                padding: 30px; 
                text-align: center; 
                font-size: 13px; 
                color: #52525b; 
                background: #0f0f0f;
              }
              .social-links {
                margin-bottom: 15px;
              }
              .social-links a {
                color: #52525b;
                text-decoration: none;
                margin: 0 10px;
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <img src="${logoUrl}" alt="Poison Rana" class="logo">
                </div>
                <div class="content">
                  <h1>Welcome to the family, ${name}!</h1>
                  <p>We're thrilled to have you join the Poison Rana community. You now have full access to our wrestling reviews, interactive match ratings, and your personal watchlist.</p>
                  <p>Our goal is to create the ultimate destination for wrestling fans like you. Ready to dive into the latest events?</p>
                  <div class="button-container">
                    <a href="${siteUrl}" class="button">Explore Poison Rana</a>
                  </div>
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
