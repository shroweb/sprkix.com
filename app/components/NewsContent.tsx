import { renderNewsContent } from "@lib/news";

export default function NewsContent({ content }: { content: string }) {
  return <div className="space-y-6">{renderNewsContent(content)}</div>;
}
