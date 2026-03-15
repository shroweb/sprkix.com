import Link from "next/link";
import {
  Star,
  Trophy,
  Bookmark,
  Users,
  Zap,
  MessageSquare,
  TrendingUp,
  Search,
  ChevronDown,
  Rss,
} from "lucide-react";

const sections = [
  {
    icon: Star,
    title: "Rating & Reviewing Events",
    color: "text-primary",
    qa: [
      {
        q: "How do I rate an event?",
        a: "Open any event page and scroll to the review section. Give it a star rating out of 5 (half-stars supported) and optionally leave a written review. You need a free account to submit ratings.",
      },
      {
        q: "Can I edit or delete my review?",
        a: "Yes — find the review on your Profile page or on the event page itself. Click the edit icon next to your review to update your rating or comment.",
      },
      {
        q: "What is the community rating?",
        a: "Each event's displayed rating is a Bayesian-weighted average — it factors in both the event's own reviews and the global site average, so events with just one review don't unfairly dominate the rankings.",
      },
      {
        q: "Can I rate individual matches?",
        a: "Yes. On any event page, expand the match card and use the star rating under each match. Match ratings feed into the Top Matches leaderboard.",
      },
    ],
  },
  {
    icon: Trophy,
    title: "Predictions",
    color: "text-yellow-400",
    qa: [
      {
        q: "How do predictions work?",
        a: "On upcoming events where predictions are enabled, each match card shows a 'Pick Your Winner' section. Select a side before the event starts — you can change your pick right up until the start time.",
      },
      {
        q: "When do predictions lock?",
        a: "Predictions lock automatically when the event's start time is reached, or when an admin marks a match as resolved.",
      },
      {
        q: "Can I see what the community is picking?",
        a: "Yes — each wrestler or team shows a community confidence percentage once picks start coming in. A bar at the bottom of each card shows the split.",
      },
      {
        q: "Is there a predictions leaderboard?",
        a: "Yes — head to Rankings → Predictions to see who has the best prediction record across all events.",
      },
    ],
  },
  {
    icon: Bookmark,
    title: "Watchlist",
    color: "text-blue-400",
    qa: [
      {
        q: "What is the watchlist?",
        a: "Your watchlist is a personal list of events you want to watch or have already watched. Add any event by clicking the bookmark icon on its page.",
      },
      {
        q: "How do I access my watchlist?",
        a: "Click your profile avatar in the top right and select Watchlist, or go directly to /watchlist.",
      },
      {
        q: "Can I mark events as attended?",
        a: "Yes — on your watchlist page you can toggle events as attended to track which shows you saw live.",
      },
    ],
  },
  {
    icon: TrendingUp,
    title: "Rankings",
    color: "text-emerald-400",
    qa: [
      {
        q: "How is the Hall of Fame / Top Events list calculated?",
        a: "Rankings use a Bayesian weighted rating — a formula that balances an event's average score with the number of reviews it has received. This prevents events with one 5-star review from outranking well-reviewed classics.",
      },
      {
        q: "What is the Top Matches list?",
        a: "The Top Matches list ranks individual bouts by their community match ratings. Go to Rankings → Top Matches to explore the best bouts across every promotion.",
      },
      {
        q: "What promotions are covered?",
        a: "Poison Rana covers all major promotions including WWE, AEW, NJPW, ROH, TNA, and many more. Use the promotion filter on the Events page to browse by company.",
      },
    ],
  },
  {
    icon: Rss,
    title: "Feed",
    color: "text-orange-400",
    qa: [
      {
        q: "What is the Feed?",
        a: "The Feed shows you a real-time activity stream of reviews, ratings and actions from people you follow. It's the best way to discover events your friends are talking about.",
      },
      {
        q: "How do I follow someone?",
        a: "Visit any user's profile page and click the Follow button. Their activity will start appearing in your Feed.",
      },
    ],
  },
  {
    icon: Zap,
    title: "Grapped",
    color: "text-primary",
    qa: [
      {
        q: "What is Grapped?",
        a: "Grapped is your personal wrestling journey card — it showcases your top-rated events, total reviews, rank, and favourite promotion in a shareable format. Find it in your profile menu.",
      },
      {
        q: "Can I share my Grapped card?",
        a: "Yes — your Grapped card can be downloaded as an image and shared on social media to show off your wrestling knowledge.",
      },
    ],
  },
  {
    icon: MessageSquare,
    title: "Watch Party & Live Chat",
    color: "text-red-400",
    qa: [
      {
        q: "What is Watch Party?",
        a: "For events with Watch Party enabled, a live chat appears on the event page during the show. Join other fans in real-time to react to each match as it happens.",
      },
      {
        q: "When does Watch Party activate?",
        a: "The live chat becomes active when the event's start time is reached and stays open until the end time. Outside those windows the event page shows the standard archive view.",
      },
    ],
  },
  {
    icon: Users,
    title: "Account & Profile",
    color: "text-purple-400",
    qa: [
      {
        q: "Is Poison Rana free?",
        a: "Yes — creating an account and using all features is completely free.",
      },
      {
        q: "What are the user ranks?",
        a: "Ranks are earned by the total number of reviews and match ratings you submit. The more you contribute, the higher your rank — from Rookie all the way up to Legend.",
      },
      {
        q: "How do I change my username or avatar?",
        a: "Go to Profile → Edit Profile to update your display name, avatar, bio, and favourite promotion.",
      },
      {
        q: "Can I make my profile private?",
        a: "User profiles are currently public so the community can see your reviews and picks. Your watchlist and feed are only visible to you.",
      },
    ],
  },
  {
    icon: Search,
    title: "Search & Discovery",
    color: "text-cyan-400",
    qa: [
      {
        q: "How do I search for an event?",
        a: "Click the search icon in the top navigation bar. You can search by event name, promotion, or wrestler name.",
      },
      {
        q: "What is the Random Event button?",
        a: "On the home page there's a 'Random Event' button that sends you to a randomly selected event in the database — great for discovering hidden gems.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-16 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-1 h-10 bg-primary rounded-full block" />
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tight">
            How it Works
          </h1>
        </div>
        <p className="text-muted-foreground font-medium italic pl-4 text-lg max-w-2xl">
          Everything you need to know about Poison Rana — the community archive for professional wrestling.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-16">
        {sections.map((s) => (
          <a
            key={s.title}
            href={`#${s.title.toLowerCase().replace(/\s+/g, "-")}`}
            className="flex items-center gap-2 bg-card/40 border border-white/5 hover:border-primary/30 hover:bg-card/60 rounded-xl px-4 py-3 transition-all group"
          >
            <s.icon className={`w-4 h-4 shrink-0 ${s.color}`} />
            <span className="text-xs font-black uppercase tracking-tight group-hover:text-primary transition-colors truncate">
              {s.title}
            </span>
          </a>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-16">
        {sections.map((section) => (
          <section
            key={section.title}
            id={section.title.toLowerCase().replace(/\s+/g, "-")}
            className="scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl bg-card/60 border border-white/10`}>
                <section.icon className={`w-5 h-5 ${section.color}`} />
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-tight">
                {section.title}
              </h2>
            </div>

            <div className="space-y-3">
              {section.qa.map((item, i) => (
                <details
                  key={i}
                  className="group bg-card/30 border border-white/5 hover:border-primary/20 rounded-2xl overflow-hidden transition-colors"
                >
                  <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none">
                    <span className="font-black text-sm uppercase italic tracking-tight">
                      {item.q}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-6 pb-5 pt-1 border-t border-white/5">
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                      {item.a}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-20 bg-card/40 border border-primary/20 rounded-3xl p-8 sm:p-12 text-center space-y-4">
        <h3 className="text-2xl font-black italic uppercase tracking-tight">
          Ready to get started?
        </h3>
        <p className="text-muted-foreground font-medium italic">
          Join the community and start rating, reviewing and predicting.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/register"
            className="h-12 px-8 bg-primary text-black text-sm font-black uppercase italic tracking-widest flex items-center justify-center gap-2 rounded-2xl shadow-xl shadow-primary/30 hover:bg-[var(--primary-hover)] hover:shadow-[var(--primary-hover)/30] hover:scale-105 active:scale-95 transition-all"
          >
            Create Free Account
          </Link>
          <Link
            href="/events"
            className="h-12 px-8 bg-card/60 border border-white/10 text-white text-sm font-black uppercase italic tracking-widest flex items-center justify-center gap-2 rounded-2xl hover:border-primary/30 transition-all"
          >
            Browse Events
          </Link>
        </div>
      </div>
    </div>
  );
}
