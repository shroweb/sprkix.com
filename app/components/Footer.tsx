import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

interface FooterProps {
  siteLogo?: string;
  socialX?: string;
  socialFacebook?: string;
  socialInstagram?: string;
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

const DISCOVER = [
  { href: "/events", label: "Events" },
  { href: "/matches", label: "Top Matches" },
  { href: "/rankings", label: "Rankings" },
  { href: "/wrestlers", label: "Wrestlers" },
  { href: "/promotions", label: "Promotions" },
];

const COMMUNITY = [
  { href: "/champions", label: "Current Champions" },
  { href: "/lineal", label: "Lineal Titles" },
  { href: "/feed", label: "Activity Feed" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/polls", label: "Polls" },
  { href: "/lists", label: "Lists" },
  { href: "/submit-event", label: "Submit an Event" },
];

const ACCOUNT = [
  { href: "/profile", label: "My Profile" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/login", label: "Sign In" },
  { href: "/register", label: "Create Account" },
  { href: "/contact", label: "Contact" },
];

export default function Footer({ siteLogo, socialX, socialFacebook, socialInstagram }: FooterProps) {
  const hasSocial = socialX || socialFacebook || socialInstagram;

  return (
    <footer className="relative mt-12 sm:mt-20 overflow-hidden border-t border-white/10 bg-gradient-to-b from-card/35 to-background">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">

        {/* Main footer grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-12 sm:grid-cols-4 sm:py-14 lg:grid-cols-[1.65fr_1fr_1fr_1fr] lg:gap-14 lg:py-16">

          {/* Brand column */}
          <div className="col-span-2 flex flex-col items-start gap-5 sm:col-span-4 lg:col-span-1">
            {/* Logo / wordmark */}
            <Link href="/" className="group inline-flex items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              {siteLogo ? (
                <img src={siteLogo} alt="Poison Rana" className="h-10 w-auto object-contain transition-opacity group-hover:opacity-80" />
              ) : (
                <span className="text-2xl font-black italic uppercase leading-none tracking-tighter text-primary transition-colors group-hover:text-[var(--primary-hover)]">
                  Poison Rana
                </span>
              )}
            </Link>
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary">
              Built for wrestling fans
            </span>

            <p className="max-w-[290px] text-sm leading-relaxed text-muted-foreground/75">
              Rate shows. Write reviews. Make predictions. Discuss with fans. Everything wrestling in one place.
            </p>

            <Link href="/events" className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white transition-colors hover:text-primary">
              Browse latest events
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* Social icons */}
            {hasSocial && (
              <div className="flex items-center gap-2 pt-1">
                {socialX && (
                  <a
                    href={socialX}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X (Twitter)"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-muted-foreground/60 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                  >
                    <XIcon size={13} />
                  </a>
                )}
                {socialFacebook && (
                  <a
                    href={socialFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-muted-foreground/60 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                  >
                    <FacebookIcon size={13} />
                  </a>
                )}
                {socialInstagram && (
                  <a
                    href={socialInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-muted-foreground/60 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                  >
                    <InstagramIcon size={13} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Discover */}
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/55 before:h-1 before:w-1 before:rounded-full before:bg-primary">
              Discover
            </p>
            <ul className="space-y-1">
              {DISCOVER.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-lg py-1.5 text-xs font-semibold text-muted-foreground/70 transition-all hover:translate-x-1 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/55 before:h-1 before:w-1 before:rounded-full before:bg-primary">
              Community
            </p>
            <ul className="space-y-1">
              {COMMUNITY.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-lg py-1.5 text-xs font-semibold text-muted-foreground/70 transition-all hover:translate-x-1 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/55 before:h-1 before:w-1 before:rounded-full before:bg-primary">
              Account
            </p>
            <ul className="space-y-1">
              {ACCOUNT.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-lg py-1.5 text-xs font-semibold text-muted-foreground/70 transition-all hover:translate-x-1 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-5 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-start">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/45">
              © {new Date().getFullYear()} Poison Rana
            </p>
            <Link href="/privacy" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/45 transition-colors hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/45 transition-colors hover:text-primary">
              Terms
            </Link>
          </div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/45">
            A{" "}
            <a
              href="https://shro.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary/70 transition-colors hover:text-primary"
            >
              Shro
              <ExternalLink className="h-2.5 w-2.5" />
            </a>{" "}
            product
          </p>
        </div>

      </div>
    </footer>
  );
}
