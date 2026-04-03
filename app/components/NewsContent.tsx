import { isHtmlNewsContent, renderLegacyNewsContent, sanitizeNewsHtml } from "@lib/news";

export default function NewsContent({ content }: { content: string }) {
  if (isHtmlNewsContent(content)) {
    return (
      <div
        className="space-y-6 text-base sm:text-lg leading-8 text-foreground/90 [&_a]:font-bold [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/40 [&_a]:underline-offset-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-foreground/75 [&_h2]:mt-12 [&_h2]:text-3xl [&_h2]:font-black [&_h2]:italic [&_h2]:tracking-tight [&_h3]:mt-10 [&_h3]:text-2xl [&_h3]:font-black [&_h3]:italic [&_h3]:tracking-tight [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:mb-6 [&_strong]:font-black [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
        dangerouslySetInnerHTML={{ __html: sanitizeNewsHtml(content) }}
      />
    );
  }

  return <div className="space-y-6">{renderLegacyNewsContent(content)}</div>;
}
