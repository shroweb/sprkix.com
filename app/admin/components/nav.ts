import {
  LayoutDashboard, Calendar, Users, Settings, Star, Tag, Image, ShieldAlert, Search, Activity,
  Download, BarChart2, Send, Newspaper, Trophy, Medal, Megaphone, ClipboardCheck, ScrollText, Crown,
  Copy, Heart, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** key into the badge counts supplied by the layout */
  badge?: "submissions" | "drafts" | "reports";
  keywords?: string;
}
export interface NavGroup { title: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/pulse", label: "Platform Pulse", icon: Activity },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/events", label: "Events", icon: Calendar },
      { href: "/admin/wrestlers", label: "Wrestlers", icon: Users },
      { href: "/admin/promotions", label: "Promotions", icon: Tag },
      { href: "/admin/championships", label: "Championships", icon: Trophy },
      { href: "/admin/lineal", label: "Lineal Titles", icon: Crown, keywords: "lineal belts champions" },
      { href: "/admin/news", label: "Newsroom", icon: Newspaper, badge: "drafts" },
      { href: "/admin/polls", label: "Polls", icon: BarChart2 },
      { href: "/admin/media", label: "Media Library", icon: Image },
    ],
  },
  {
    title: "Community",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/moderation", label: "Moderation", icon: ShieldAlert, badge: "reports" },
      { href: "/admin/submissions", label: "Submissions", icon: Send, badge: "submissions" },
      { href: "/admin/badges", label: "Badges", icon: Medal },
      { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
    ],
  },
  {
    title: "Data & Ops",
    items: [
      { href: "/admin/import", label: "Import Queue", icon: Download },
      { href: "/admin/scraper", label: "Metadata Scraper", icon: Search },
      { href: "/admin/duplicates", label: "Duplicate Finder", icon: Copy },
      { href: "/admin/health", label: "Image Health", icon: Heart },
      { href: "/admin/audit", label: "Content Audit", icon: ClipboardCheck },
      { href: "/admin/logs", label: "Admin Log", icon: ScrollText },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/settings", label: "Site Settings", icon: Settings },
      { href: "/admin/maintenance", label: "System Control", icon: Settings },
    ],
  },
];

export const ALL_NAV: NavItem[] = NAV.flatMap((g) => g.items);

export function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");
}
