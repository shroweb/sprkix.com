import Link from "next/link";
import {
  Lock,
  Unlock,
  ChevronRight,
  Terminal,
  Zap,
  BookOpen,
  Plug,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type Param = {
  name: string;
  type: string;
  required?: boolean;
  description: string;
};

type Endpoint = {
  method: HttpMethod;
  path: string;
  auth?: boolean;
  description: string;
  query?: Param[];
  body?: Param[];
  returns: string;
  example?: { request?: string; response: string };
};

type Section = {
  id: string;
  title: string;
  description?: string;
  endpoints: Endpoint[];
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const BASE_URL = "https://sprkix.com/api/v1";

const sections: Section[] = [
  {
    id: "authentication",
    title: "Authentication",
    description:
      "All authenticated endpoints require a Bearer token in the Authorization header. Obtain a token via login or register — tokens are valid for 30 days.",
    endpoints: [
      {
        method: "POST",
        path: "/auth/login",
        description: "Authenticate with email and password. Returns a Bearer token and user object.",
        body: [
          { name: "email", type: "string", required: true, description: "User's email address" },
          { name: "password", type: "string", required: true, description: "User's password" },
        ],
        returns: "{ token, user }",
        example: {
          request: JSON.stringify({ email: "fan@example.com", password: "supersecret" }, null, 2),
          response: JSON.stringify(
            {
              data: {
                token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                user: { id: "clx123", name: "John Cena Fan", email: "fan@example.com", slug: "john-cena-fan", avatarUrl: null, isAdmin: false },
              },
              error: null,
            },
            null,
            2
          ),
        },
      },
      {
        method: "POST",
        path: "/auth/register",
        description: "Create a new account. Returns a Bearer token and the created user.",
        body: [
          { name: "name", type: "string", required: true, description: "Display name" },
          { name: "email", type: "string", required: true, description: "Email address" },
          { name: "password", type: "string", required: true, description: "Password (min 8 chars)" },
        ],
        returns: "{ token, user }",
      },
      {
        method: "GET",
        path: "/auth/me",
        auth: true,
        description: "Returns the currently authenticated user.",
        returns: "{ user }",
      },
    ],
  },
  {
    id: "events",
    title: "Events",
    description: "Browse, search and retrieve professional wrestling events.",
    endpoints: [
      {
        method: "GET",
        path: "/events",
        description: "List all events with optional filtering, search and pagination.",
        query: [
          { name: "page", type: "number", description: "Page number (default: 1)" },
          { name: "limit", type: "number", description: "Results per page, max 50 (default: 20)" },
          { name: "q", type: "string", description: "Search by event title" },
          { name: "promotion", type: "string", description: "Filter by promotion (e.g. WWE, AEW)" },
          { name: "type", type: "string", description: "Filter by event type (e.g. PPV, TV)" },
          {
            name: "sort",
            type: "string",
            description: "Sort order: date_desc (default) | date_asc",
          },
        ],
        returns: "Event[]",
        example: {
          response: JSON.stringify(
            {
              data: [
                {
                  id: "clx456",
                  title: "WrestleMania 40",
                  slug: "wrestlemania-40",
                  date: "2024-04-06T00:00:00.000Z",
                  promotion: "WWE",
                  venue: "Lincoln Financial Field",
                  posterUrl: "https://...",
                  type: "PPV",
                  reviewCount: 312,
                  matchCount: 10,
                  averageRating: 4.21,
                },
              ],
              error: null,
              meta: { page: 1, limit: 20, total: 1842 },
            },
            null,
            2
          ),
        },
      },
      {
        method: "GET",
        path: "/events/:slug",
        description: "Get a single event by slug, including all matches and participants.",
        returns: "Event with matches[]",
        example: {
          response: JSON.stringify(
            {
              data: {
                id: "clx456",
                title: "WrestleMania 40",
                slug: "wrestlemania-40",
                date: "2024-04-06T00:00:00.000Z",
                promotion: "WWE",
                venue: "Lincoln Financial Field",
                posterUrl: "https://...",
                description: "...",
                type: "PPV",
                startTime: null,
                endTime: null,
                enableWatchParty: true,
                enablePredictions: true,
                reviewCount: 312,
                matchCount: 10,
                averageRating: 4.21,
                matches: [
                  {
                    id: "clxm1",
                    title: "Cody Rhodes vs Roman Reigns",
                    type: "Singles",
                    duration: 4230,
                    rating: 4.78,
                    order: 10,
                    participants: [
                      { id: "p1", team: 1, isWinner: true, wrestler: { id: "w1", name: "Cody Rhodes", slug: "cody-rhodes", imageUrl: "https://..." } },
                      { id: "p2", team: 2, isWinner: false, wrestler: { id: "w2", name: "Roman Reigns", slug: "roman-reigns", imageUrl: "https://..." } },
                    ],
                  },
                ],
              },
              error: null,
            },
            null,
            2
          ),
        },
      },
      {
        method: "GET",
        path: "/events/:slug/reviews",
        description: "Get paginated reviews for an event, including replies.",
        query: [
          { name: "page", type: "number", description: "Page number (default: 1)" },
          { name: "limit", type: "number", description: "Results per page, max 50 (default: 20)" },
        ],
        returns: "Review[]",
      },
      {
        method: "POST",
        path: "/events/:slug/reviews",
        auth: true,
        description: "Submit or update your review for an event. Submitting again updates your existing review.",
        body: [
          { name: "rating", type: "number", required: true, description: "Star rating from 0.5 to 5 (half-stars supported)" },
          { name: "comment", type: "string", description: "Optional written review" },
        ],
        returns: "Review",
      },
    ],
  },
  {
    id: "rankings",
    title: "Rankings",
    description:
      "Ranked lists using the sprkix Bayesian weighted rating formula: (v/(v+m)) × R + (m/(v+m)) × C — where v = review count, m = minimum review threshold, R = event average, C = global average.",
    endpoints: [
      {
        method: "GET",
        path: "/rankings/events",
        description: "Top events ranked by Bayesian weighted rating.",
        query: [
          { name: "promotion", type: "string", description: "Filter to a specific promotion" },
          { name: "limit", type: "number", description: "Max results, up to 100 (default: 50)" },
        ],
        returns: "RankedEvent[]",
        example: {
          response: JSON.stringify(
            {
              data: [
                {
                  id: "clx789",
                  title: "WrestleKingdom 17",
                  slug: "wrestlekingdom-17",
                  date: "2023-01-04T00:00:00.000Z",
                  promotion: "NJPW",
                  posterUrl: "https://...",
                  reviewCount: 88,
                  averageRating: 4.71,
                  bayesianScore: 4.643,
                },
              ],
              error: null,
              meta: { total: 50 },
            },
            null,
            2
          ),
        },
      },
      {
        method: "GET",
        path: "/rankings/matches",
        description: "Top individual matches ranked by community match rating.",
        query: [
          { name: "promotion", type: "string", description: "Filter to a specific promotion" },
          { name: "limit", type: "number", description: "Max results, up to 100 (default: 50)" },
        ],
        returns: "RankedMatch[]",
      },
    ],
  },
  {
    id: "promotions",
    title: "Promotions",
    endpoints: [
      {
        method: "GET",
        path: "/promotions",
        description: "List all promotions with their aliases and event counts.",
        returns: "Promotion[]",
        example: {
          response: JSON.stringify(
            {
              data: [
                {
                  id: "prom1",
                  shortName: "AEW",
                  fullName: "All Elite Wrestling",
                  logoUrl: "https://...",
                  aliases: [{ id: "a1", fullName: "All Elite Wrestling" }],
                  eventCount: 284,
                },
              ],
              error: null,
            },
            null,
            2
          ),
        },
      },
    ],
  },
  {
    id: "wrestlers",
    title: "Wrestlers",
    endpoints: [
      {
        method: "GET",
        path: "/wrestlers",
        description: "List all wrestlers with optional name search and pagination.",
        query: [
          { name: "page", type: "number", description: "Page number (default: 1)" },
          { name: "limit", type: "number", description: "Results per page, max 100 (default: 40)" },
          { name: "q", type: "string", description: "Search by name" },
        ],
        returns: "Wrestler[]",
      },
      {
        method: "GET",
        path: "/wrestlers/:slug",
        description: "Get a wrestler's profile and their last 50 match appearances.",
        returns: "Wrestler with matches[]",
        example: {
          response: JSON.stringify(
            {
              data: {
                id: "w1",
                name: "Cody Rhodes",
                slug: "cody-rhodes",
                imageUrl: "https://...",
                bio: "The American Nightmare.",
                matchCount: 143,
                matches: [
                  {
                    id: "p1",
                    team: 1,
                    isWinner: true,
                    match: {
                      id: "clxm1",
                      title: "Cody Rhodes vs Roman Reigns",
                      type: "Singles",
                      rating: 4.78,
                      duration: 4230,
                      event: { id: "clx456", title: "WrestleMania 40", slug: "wrestlemania-40", date: "2024-04-06T00:00:00.000Z", promotion: "WWE" },
                    },
                  },
                ],
              },
              error: null,
            },
            null,
            2
          ),
        },
      },
    ],
  },
  {
    id: "search",
    title: "Search",
    endpoints: [
      {
        method: "GET",
        path: "/search",
        description: "Search across events, wrestlers and users simultaneously. Minimum 2 characters.",
        query: [
          { name: "q", type: "string", required: true, description: "Search query (min 2 chars)" },
        ],
        returns: "{ events[], wrestlers[], users[] }",
        example: {
          response: JSON.stringify(
            {
              data: {
                events: [{ id: "clx456", title: "WrestleMania 40", slug: "wrestlemania-40", date: "2024-04-06T00:00:00.000Z", promotion: "WWE" }],
                wrestlers: [{ id: "w1", name: "Cody Rhodes", slug: "cody-rhodes", imageUrl: "https://..." }],
                users: [{ id: "u1", name: "WrestleFan99", slug: "wrestlefan99", avatarUrl: null }],
              },
              error: null,
            },
            null,
            2
          ),
        },
      },
    ],
  },
  {
    id: "me",
    title: "My Profile",
    description: "Endpoints for the authenticated user's own data.",
    endpoints: [
      {
        method: "GET",
        path: "/me",
        auth: true,
        description: "Get the authenticated user's profile with activity counts.",
        returns: "User with counts",
      },
      {
        method: "PATCH",
        path: "/me",
        auth: true,
        description: "Update the authenticated user's profile.",
        body: [
          { name: "name", type: "string", description: "Display name" },
          { name: "avatarUrl", type: "string", description: "Avatar image URL (null to remove)" },
          { name: "favoritePromotion", type: "string", description: "Favourite promotion short name" },
        ],
        returns: "Updated user",
      },
      {
        method: "GET",
        path: "/me/watchlist",
        auth: true,
        description: "Get the authenticated user's watchlist with pagination.",
        query: [
          { name: "page", type: "number", description: "Page number (default: 1)" },
          { name: "limit", type: "number", description: "Results per page, max 50 (default: 20)" },
        ],
        returns: "WatchlistItem[]",
      },
      {
        method: "POST",
        path: "/me/watchlist",
        auth: true,
        description: "Add an event to the watchlist.",
        body: [
          { name: "eventId", type: "string", required: true, description: "Event ID to add" },
        ],
        returns: "WatchlistItem",
      },
      {
        method: "DELETE",
        path: "/me/watchlist",
        auth: true,
        description: "Remove an event from the watchlist.",
        query: [
          { name: "eventId", type: "string", required: true, description: "Event ID to remove" },
        ],
        returns: "{ removed: true }",
      },
      {
        method: "GET",
        path: "/me/feed",
        auth: true,
        description: "Get a paginated activity feed of reviews from users you follow.",
        query: [
          { name: "page", type: "number", description: "Page number (default: 1)" },
          { name: "limit", type: "number", description: "Results per page, max 50 (default: 20)" },
        ],
        returns: "Review[]",
      },
    ],
  },
  {
    id: "interactions",
    title: "Interactions",
    description: "Submit ratings, predictions, and follow other users.",
    endpoints: [
      {
        method: "POST",
        path: "/matches/:id/rate",
        auth: true,
        description: "Submit or update a star rating for a match.",
        body: [
          { name: "rating", type: "number", required: true, description: "Rating from 0.25 to 5" },
        ],
        returns: "{ average, ratingCount }",
      },
      {
        method: "POST",
        path: "/predictions",
        auth: true,
        description: "Submit a prediction for a match. Set predictedWinnerId to null to clear your pick. Locked once the event starts or a winner is marked.",
        body: [
          { name: "matchId", type: "string", required: true, description: "Match ID" },
          { name: "predictedWinnerId", type: "string | null", required: true, description: "Participant wrestler ID, or null to clear" },
        ],
        returns: "Prediction | { deleted: true }",
      },
      {
        method: "GET",
        path: "/predictions",
        description: "Get community prediction stats for a match.",
        query: [
          { name: "matchId", type: "string", required: true, description: "Match ID" },
        ],
        returns: "{ stats: [{ winnerId, count, percentage }], total }",
      },
      {
        method: "POST",
        path: "/follow",
        auth: true,
        description: "Toggle follow/unfollow a user. Returns the new follow state.",
        body: [
          { name: "targetUserId", type: "string", required: true, description: "User ID to follow or unfollow" },
        ],
        returns: "{ followed: boolean }",
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PATCH: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
};

function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span
      className={`inline-block text-[10px] font-black uppercase tracking-widest border rounded px-1.5 py-0.5 ${METHOD_STYLES[method]}`}
    >
      {method}
    </span>
  );
}

function ParamTable({ params, label }: { params: Param[]; label: string }) {
  return (
    <div className="mt-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
        {label}
      </p>
      <div className="rounded-xl overflow-hidden border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/3 border-b border-white/5">
              <th className="text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Name
              </th>
              <th className="text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Type
              </th>
              <th className="text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {params.map((p) => (
              <tr key={p.name} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-2.5 font-mono text-xs">
                  <span className="text-primary">{p.name}</span>
                  {p.required && (
                    <span className="ml-1 text-[9px] font-black text-red-400 uppercase">*</span>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.type}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-black/40 border border-white/5 rounded-xl p-4 overflow-x-auto text-xs font-mono text-emerald-300/90 leading-relaxed">
      {code}
    </pre>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  return (
    <div className="bg-card/30 border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-white/5 bg-card/20">
        <MethodBadge method={ep.method} />
        <code className="font-mono text-sm font-bold text-foreground">{ep.path}</code>
        {ep.auth && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary">
            <Lock className="w-3 h-3" /> Auth required
          </span>
        )}
        {!ep.auth && ep.method !== "GET" && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <Unlock className="w-3 h-3" /> Public
          </span>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
          {ep.description}
        </p>

        {ep.query && ep.query.length > 0 && (
          <ParamTable params={ep.query} label="Query Parameters" />
        )}
        {ep.body && ep.body.length > 0 && (
          <ParamTable params={ep.body} label="Request Body (JSON)" />
        )}

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Returns
          </span>
          <code className="text-xs font-mono text-primary">{ep.returns}</code>
        </div>

        {ep.example && (
          <div className="space-y-3">
            {ep.example.request && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                  Example Request Body
                </p>
                <CodeBlock code={ep.example.request} />
              </div>
            )}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                Example Response
              </p>
              <CodeBlock code={ep.example.response} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApiDocsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-16 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-1 h-10 bg-primary rounded-full block" />
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tight">
            API Docs
          </h1>
        </div>
        <p className="text-muted-foreground font-medium italic pl-4 text-lg max-w-2xl">
          The sprkix REST API — build apps, integrations, and tools on top of the world's wrestling archive.
        </p>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-12">
        {/* Sidebar nav */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 px-2">
              Sections
            </p>
            {[
              { id: "getting-started", title: "Getting Started" },
              { id: "connecting", title: "Connecting" },
              ...sections.map((s) => ({ id: s.id, title: s.title })),
            ].map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold hover:bg-card/60 hover:text-primary transition-all group"
              >
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                {s.title}
              </a>
            ))}
            <div className="pt-4 px-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                Base URL
              </p>
              <code className="text-xs font-mono text-primary break-all">{BASE_URL}</code>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="space-y-6">
          {/* Getting started */}
          <div
            id="getting-started"
            className="bg-card/40 border border-primary/20 rounded-3xl p-6 sm:p-8 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-xl font-black italic uppercase tracking-tight">Getting Started</h2>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground font-medium leading-relaxed">
              <p>
                <strong className="text-foreground">Base URL:</strong>{" "}
                <code className="font-mono text-primary text-xs">{BASE_URL}</code>
              </p>
              <p>
                <strong className="text-foreground">Auth:</strong> Authenticated endpoints require an{" "}
                <code className="font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code>{" "}
                header. Get a token by calling <code className="font-mono text-xs text-primary">/auth/login</code> or{" "}
                <code className="font-mono text-xs text-primary">/auth/register</code>.
              </p>
              <p>
                <strong className="text-foreground">Response envelope:</strong> Every response follows the same shape:
              </p>
              <CodeBlock
                code={JSON.stringify(
                  { data: "...", error: null, meta: { page: 1, limit: 20, total: 400 } },
                  null,
                  2
                )}
              />
              <p>
                On error, <code className="font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">data</code> is{" "}
                <code className="font-mono text-xs">null</code> and{" "}
                <code className="font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">error</code> contains a message string. HTTP status codes are used correctly (200, 201, 400, 401, 403, 404, 409, 500).
              </p>
              <p>
                <strong className="text-foreground">CORS:</strong> All <code className="font-mono text-xs text-primary">/api/v1</code> endpoints include CORS headers and respond to preflight OPTIONS requests, making them safe to call from browsers and native apps.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                Quick Example
              </p>
              <CodeBlock
                code={`# No auth needed — list the top events
curl "${BASE_URL}/rankings/events?limit=10"

# Login and store your token
TOKEN=$(curl -s -X POST "${BASE_URL}/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"yourpassword"}' \\
  | jq -r '.data.token')

# Use the token to access protected endpoints
curl "${BASE_URL}/me" \\
  -H "Authorization: Bearer $TOKEN"`}
              />
            </div>
          </div>

          {/* Connecting */}
          <div
            id="connecting"
            className="scroll-mt-24 bg-card/40 border border-white/8 rounded-3xl p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Plug className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-xl font-black italic uppercase tracking-tight">Connecting to the API</h2>
            </div>

            {/* Step 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shrink-0">1</span>
                <p className="text-sm font-black uppercase italic tracking-tight">Login and retrieve your token</p>
              </div>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed pl-7">
                Call <code className="font-mono text-xs text-primary">/auth/login</code> with your credentials. Store the returned{" "}
                <code className="font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">token</code> — you'll need it for every authenticated request. Tokens are valid for <strong className="text-foreground">30 days</strong>.
              </p>
              <div className="pl-7">
                <CodeBlock
                  code={`const res = await fetch("${BASE_URL}/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "you@example.com", password: "yourpassword" }),
});

const { data, error } = await res.json();
if (error) throw new Error(error);

const token = data.token; // store this securely
const user  = data.user;`}
                />
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shrink-0">2</span>
                <p className="text-sm font-black uppercase italic tracking-tight">Pass the token on authenticated requests</p>
              </div>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed pl-7">
                Include the token in the <code className="font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">Authorization</code> header as a Bearer token.
              </p>
              <div className="pl-7">
                <CodeBlock
                  code={`const res = await fetch("${BASE_URL}/me", {
  headers: { "Authorization": \`Bearer \${token}\` },
});

const { data } = await res.json();
console.log(data.name); // "John Cena Fan"`}
                />
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shrink-0">3</span>
                <p className="text-sm font-black uppercase italic tracking-tight">Use a client wrapper (recommended)</p>
              </div>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed pl-7">
                Drop this small wrapper into your project to avoid repeating headers and base URLs everywhere. Works in React Native, plain JS, or any fetch-compatible environment.
              </p>
              <div className="pl-7">
                <CodeBlock
                  code={`// api.js
const api = {
  baseUrl: "${BASE_URL}",
  token: null, // set this after login

  async get(path, params = {}) {
    const url = new URL(this.baseUrl + path);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url, {
      headers: this.token ? { Authorization: \`Bearer \${this.token}\` } : {},
    });
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(this.baseUrl + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: \`Bearer \${this.token}\` } : {}),
      },
      body: JSON.stringify(body),
    });
    return res.json();
  },

  async patch(path, body) {
    const res = await fetch(this.baseUrl + path, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: \`Bearer \${this.token}\` } : {}),
      },
      body: JSON.stringify(body),
    });
    return res.json();
  },
};

// ── Usage ──────────────────────────────────────────────
// Login
const { data } = await api.post("/auth/login", { email, password });
api.token = data.token; // store token globally

// Public endpoints — no token needed
const { data: events }   = await api.get("/rankings/events", { limit: 10 });
const { data: event }    = await api.get("/events/wrestlemania-40");
const { data: results }  = await api.get("/search", { q: "Cody Rhodes" });

// Authenticated endpoints
const { data: me }       = await api.get("/me");
const { data: watchlist} = await api.get("/me/watchlist");
await api.post("/me/watchlist", { eventId: "clx456" });
await api.post("/matches/clxm1/rate", { rating: 4.5 });`}
                />
              </div>
            </div>

            {/* Token storage note */}
            <div className="pl-7">
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-yellow-400">Token Storage</p>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  In <strong className="text-foreground">React Native / Expo</strong>, store the token with{" "}
                  <code className="font-mono text-primary">expo-secure-store</code> or{" "}
                  <code className="font-mono text-primary">@react-native-async-storage/async-storage</code>.{" "}
                  In a <strong className="text-foreground">browser app</strong>, store it in{" "}
                  <code className="font-mono text-primary">localStorage</code> (acceptable) or a{" "}
                  <code className="font-mono text-primary">httpOnly</code> cookie (more secure).{" "}
                  Never embed credentials in source code.
                </p>
              </div>
            </div>
          </div>

          {/* Sections */}
          {sections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="scroll-mt-24 space-y-4"
            >
              <div className="flex items-center gap-3 pt-4">
                <div className="p-2 rounded-xl bg-card/60 border border-white/10">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-2xl font-black italic uppercase tracking-tight">
                  {section.title}
                </h2>
              </div>

              {section.description && (
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  {section.description}
                </p>
              )}

              <div className="space-y-4">
                {section.endpoints.map((ep, i) => (
                  <EndpointCard key={i} ep={ep} />
                ))}
              </div>
            </div>
          ))}

          {/* Footer note */}
          <div className="mt-12 bg-card/30 border border-white/5 rounded-2xl p-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="text-sm font-black italic uppercase tracking-tight">
                Questions or issues?
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Reach out via the{" "}
              <Link href="/contact" className="text-primary hover:opacity-80 transition-opacity">
                contact page
              </Link>{" "}
              or email{" "}
              <a href="mailto:hello@sprkix.com" className="text-primary hover:opacity-80 transition-opacity">
                hello@sprkix.com
              </a>
              .
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
