import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Poison Rana collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-12 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-1 h-10 bg-primary rounded-full block" />
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tight">
            Privacy Policy
          </h1>
        </div>
        <p className="text-muted-foreground font-medium italic pl-4 text-lg">
          Last updated: March 2025
        </p>
      </div>

      <div className="prose prose-invert prose-sm max-w-none space-y-8">
        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">1. Who We Are</h2>
          <p className="text-muted-foreground leading-relaxed">
            Poison Rana (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a wrestling review and
            community platform available at poisonrana.com. We are committed to protecting your
            personal information.
          </p>
        </section>

        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">
            2. Information We Collect
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We collect information you provide directly when you create an account, including:
          </p>
          <ul className="text-muted-foreground space-y-1 list-disc list-inside">
            <li>Username and email address</li>
            <li>Password (stored as a secure hash — we cannot see your password)</li>
            <li>Profile information you choose to add (bio, avatar, cover photo)</li>
            <li>Content you create: reviews, ratings, comments, predictions, lists</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            We also collect usage data automatically, including pages visited, actions taken on the
            site, and your device&apos;s IP address and browser type.
          </p>
        </section>

        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">
            3. How We Use Your Information
          </h2>
          <ul className="text-muted-foreground space-y-1 list-disc list-inside">
            <li>To provide and operate the Poison Rana platform</li>
            <li>To personalise your experience (watchlists, predictions, leaderboard)</li>
            <li>To send account notifications and updates you have opted into</li>
            <li>To improve the site based on how people use it</li>
            <li>To detect and prevent abuse or spam</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            We do not sell your personal data to third parties.
          </p>
        </section>

        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">
            4. Cookies &amp; Analytics
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We use cookies to keep you logged in and to understand how the site is used. We may use
            Google Analytics or similar tools to track anonymous aggregate usage. You can disable
            cookies in your browser settings, though some features may not work correctly.
          </p>
        </section>

        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">
            5. Third-Party Services
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Poison Rana uses the following third-party services which may process your data:
          </p>
          <ul className="text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              <strong>Supabase</strong> — database hosting (EU/US data centres)
            </li>
            <li>
              <strong>Vercel</strong> — website hosting and deployment
            </li>
            <li>
              <strong>Resend</strong> — transactional email delivery
            </li>
            <li>
              <strong>Google / Facebook</strong> — optional social login (only if you use it)
            </li>
          </ul>
        </section>

        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">6. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to access, correct, or delete your personal data at any time. To
            request deletion of your account and all associated data, email us at{" "}
            <a
              href="mailto:hello@poisonrana.com"
              className="text-primary hover:underline font-medium"
            >
              hello@poisonrana.com
            </a>
            .
          </p>
        </section>

        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">
            7. Data Retention
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your account data for as long as your account is active. If you delete your
            account, your personal information is removed within 30 days. Some content (reviews,
            ratings) may be retained in anonymised form.
          </p>
        </section>

        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">8. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For any privacy-related questions, contact us at{" "}
            <a
              href="mailto:hello@poisonrana.com"
              className="text-primary hover:underline font-medium"
            >
              hello@poisonrana.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
