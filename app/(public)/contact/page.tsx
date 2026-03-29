import { Mail, Twitter, MessageSquare, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-16 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-1 h-10 bg-primary rounded-full block" />
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tight">
            Contact
          </h1>
        </div>
        <p className="text-muted-foreground font-medium italic pl-4 text-lg max-w-2xl">
          Got a question, bug report, or idea? We'd love to hear from you.
        </p>
      </div>

      {/* Contact cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-16">
        <a
          href="mailto:poisonrana.app@gmail.com"
          className="group flex flex-col gap-4 bg-card/40 border border-white/5 hover:border-primary/30 hover:bg-card/60 rounded-2xl p-6 transition-all"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
              Email
            </p>
            <p className="font-black italic uppercase text-lg group-hover:text-primary transition-colors">
              poisonrana.app@gmail.com
            </p>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              For general enquiries, partnerships, or feedback.
            </p>
          </div>
        </a>

        <a
          href="https://twitter.com/poisonrana_app"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col gap-4 bg-card/40 border border-white/5 hover:border-primary/30 hover:bg-card/60 rounded-2xl p-6 transition-all"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Twitter className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
              Twitter / X
            </p>
            <p className="font-black italic uppercase text-lg group-hover:text-primary transition-colors">
              @poisonrana_app
            </p>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              DMs open for feedback, bugs, and wrestling chat.
            </p>
          </div>
        </a>
      </div>

      {/* Bug / feature note */}
      <div className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3 mb-8">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-primary shrink-0" />
          <h2 className="font-black italic uppercase tracking-tight text-lg">
            Bug Reports & Feature Requests
          </h2>
        </div>
        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
          Found something broken or have an idea to make Poison Rana better? Drop us an email with as
          much detail as you can — what page you were on, what you expected to happen, and what
          actually happened. Screenshots are always helpful.
        </p>
        <a
          href="mailto:poisonrana.app@gmail.com?subject=Bug%20Report"
          className="inline-flex items-center gap-2 text-sm font-black uppercase italic text-primary hover:opacity-80 transition-opacity"
        >
          <Mail className="w-4 h-4" />
          Send a bug report
        </a>
      </div>

      {/* FAQ link */}
      <div className="bg-card/30 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-primary shrink-0" />
          <h2 className="font-black italic uppercase tracking-tight text-lg">
            Looking for help?
          </h2>
        </div>
        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
          Check out the How it Works page first — it covers ratings, predictions, the watchlist,
          rankings, and everything else on the site.
        </p>
        <Link
          href="/faq"
          className="inline-flex items-center gap-2 text-sm font-black uppercase italic text-primary hover:opacity-80 transition-opacity"
        >
          <HelpCircle className="w-4 h-4" />
          How it Works
        </Link>
      </div>
    </div>
  );
}
