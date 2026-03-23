import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions for using Poison Rana.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-12 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-1 h-10 bg-primary rounded-full block" />
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tight">
            Terms of Service
          </h1>
        </div>
        <p className="text-muted-foreground font-medium italic pl-4 text-lg">
          Last updated: March 2025
        </p>
      </div>

      <div className="space-y-8">
        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">
            1. Acceptance of Terms
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            By creating an account or using Poison Rana (&quot;the site&quot;, &quot;the
            service&quot;), you agree to these Terms of Service. If you do not agree, please do not
            use the site.
          </p>
        </section>

        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">2. Your Account</h2>
          <p className="text-muted-foreground leading-relaxed">
            You are responsible for maintaining the security of your account and password. You must
            be at least 13 years old to create an account. You may only have one account per person.
          </p>
        </section>

        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">
            3. Acceptable Use
          </h2>
          <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
          <ul className="text-muted-foreground space-y-1 list-disc list-inside">
            <li>Post content that is abusive, hateful, threatening, or discriminatory</li>
            <li>Spam, harass, or impersonate other users</li>
            <li>Attempt to gain unauthorised access to other accounts or the site&apos;s systems</li>
            <li>Use automated bots or scrapers without prior written permission</li>
            <li>Post copyrighted material without permission</li>
            <li>
              Use the site for any unlawful purpose or in violation of any applicable laws or
              regulations
            </li>
          </ul>
        </section>

        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">
            4. User-Generated Content
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Reviews, ratings, comments, and other content you create remain yours. By posting
            content on Poison Rana, you grant us a non-exclusive licence to display and distribute
            that content on the site. We reserve the right to remove content that violates these
            terms.
          </p>
        </section>

        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">
            5. Intellectual Property
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The Poison Rana name, logo, and site design are our intellectual property. Event,
            wrestler, and promotion names belong to their respective owners. We use them for
            informational and fan community purposes only.
          </p>
        </section>

        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">
            6. Disclaimers
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Poison Rana is provided &quot;as is&quot; without warranties of any kind. We do not
            guarantee uninterrupted or error-free service. Ratings and rankings on the site are
            community-generated opinions and do not represent official positions.
          </p>
        </section>

        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">
            7. Termination
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate these terms. You may
            delete your account at any time by contacting us.
          </p>
        </section>

        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">8. Changes</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update these terms from time to time. Continued use of the site after changes
            are posted constitutes acceptance of the updated terms.
          </p>
        </section>

        <section className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-black italic uppercase tracking-tight">9. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Questions about these terms? Email{" "}
            <a
              href="mailto:poisonrana.app@gmail.com"
              className="text-primary hover:underline font-medium"
            >
              poisonrana.app@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
