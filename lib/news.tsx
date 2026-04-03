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

export function renderNewsContent(content: string) {
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

export function stripNewsShortcodes(text: string) {
  return text.replace(SHORTCODE_RE, (_, _type, _slug, label) => label);
}
