import Link from "next/link";
import type { ReactNode } from "react";
import { slugify } from "./slug-utils";

export type NewsEntityType = "event" | "wrestler" | "promotion";

export function getNewsEntityHref(type: NewsEntityType, slug: string) {
  if (type === "event") return `/events/${slug}`;
  if (type === "wrestler") return `/wrestlers/${slug}`;
  return `/promotions/${slug}`;
}

export function getPromotionNewsSlug(shortName: string) {
  return slugify(shortName);
}

const SHORTCODE_RE = /\[\[(event|wrestler|promotion):([^\]|]+)\|([^\]]+)\]\]/g;
const HTML_TAG_RE = /<\/?[a-z][\s\S]*>/i;

export function isHtmlNewsContent(content: string) {
  return HTML_TAG_RE.test(content);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(text: string) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(SHORTCODE_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    const type = match[1] as NewsEntityType;
    const slug = match[2];
    const label = match[3];

    parts.push(
      <Link
        key={`${type}-${slug}-${start}`}
        href={getNewsEntityHref(type, slug)}
        className="font-bold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
      >
        {label}
      </Link>,
    );

    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function renderLegacyNewsContent(content: string) {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    if (block.startsWith("### ")) {
      return (
        <h3 key={index} className="text-2xl font-black italic tracking-tight mt-10">
          {renderInline(block.slice(4))}
        </h3>
      );
    }

    if (block.startsWith("## ")) {
      return (
        <h2 key={index} className="text-3xl font-black italic tracking-tight mt-12">
          {renderInline(block.slice(3))}
        </h2>
      );
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length > 1 && lines.every((line) => line.startsWith("- "))) {
      return (
        <ul key={index} className="list-disc pl-6 space-y-2 text-base sm:text-lg leading-8 text-foreground/90">
          {lines.map((line, itemIndex) => (
            <li key={itemIndex}>{renderInline(line.slice(2))}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={index} className="text-base sm:text-lg leading-8 text-foreground/90">
        {renderInline(block)}
      </p>
    );
  });
}

function replaceShortcodesWithAnchors(content: string) {
  return content.replace(
    SHORTCODE_RE,
    (_match, type: NewsEntityType, slug: string, label: string) =>
      `<a href="${escapeHtml(getNewsEntityHref(type, slug))}" data-news-entity="${type}" data-news-slug="${escapeHtml(slug)}">${escapeHtml(label)}</a>`,
  );
}

export function sanitizeNewsHtml(content: string) {
  return replaceShortcodesWithAnchors(content)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<(iframe|object|embed|form|input|button|textarea|select|option)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(iframe|object|embed|form|input|button|textarea|select|option)([^>]*)\/?>/gi, "")
    .replace(/\son[a-z]+="[^"]*"/gi, "")
    .replace(/\son[a-z]+='[^']*'/gi, "")
    .replace(/\son[a-z]+=[^\s>]+/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sstyle='[^']*'/gi, "")
    .replace(/href="javascript:[^"]*"/gi, 'href="#"')
    .replace(/href='javascript:[^']*'/gi, "href='#'");
}

export function stripNewsContent(text: string) {
  return text
    .replace(SHORTCODE_RE, (_match, _type, _slug, label) => label)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
