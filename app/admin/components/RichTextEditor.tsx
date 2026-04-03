"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  RemoveFormatting,
  Underline,
} from "lucide-react";
import { getNewsEntityHref, type NewsEntityType } from "@lib/news";

export type RichTextEditorHandle = {
  focus: () => void;
  insertEntityLink: (entity: { type: NewsEntityType; slug: string; label: string }) => void;
};

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeInitialValue(value: string) {
  if (!value.trim()) {
    return "<p></p>";
  }

  return value;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor({ value, onChange, placeholder }, ref) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;

      const normalized = normalizeInitialValue(value);
      if (editor.innerHTML !== normalized && !isFocused) {
        editor.innerHTML = normalized;
      }
    }, [value, isFocused]);

    function emitChange() {
      const editor = editorRef.current;
      if (!editor) return;

      const html = editor.innerHTML.trim();
      onChange(html === "<p></p>" ? "" : html);
    }

    function runCommand(command: string, commandValue?: string) {
      editorRef.current?.focus();
      document.execCommand(command, false, commandValue);
      emitChange();
    }

    function setBlock(tag: "H2" | "H3" | "BLOCKQUOTE" | "P") {
      runCommand("formatBlock", tag);
    }

    function insertLink() {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      const url = window.prompt("Enter a URL", "https://");
      if (!url) return;

      const safeUrl = url.trim();
      if (!safeUrl) return;

      if (selectedText) {
        runCommand("createLink", safeUrl);
      } else {
        runCommand("insertHTML", `<a href="${safeUrl}">${safeUrl}</a>`);
      }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      if (event.key === "Tab") {
        event.preventDefault();
        runCommand("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;");
      }
    }

    useImperativeHandle(ref, () => ({
      focus: () => {
        editorRef.current?.focus();
      },
      insertEntityLink: ({ type, slug, label }) => {
        const href = getNewsEntityHref(type, slug);
        runCommand(
          "insertHTML",
          `<a href="${escapeHtml(href)}" data-news-entity="${escapeHtml(type)}" data-news-slug="${escapeHtml(slug)}">${escapeHtml(label)}</a>`,
        );
      },
    }));

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-slate-50 p-3">
          <ToolbarButton label="Bold" onClick={() => runCommand("bold")}>
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Italic" onClick={() => runCommand("italic")}>
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Underline" onClick={() => runCommand("underline")}>
            <Underline className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Heading 2" onClick={() => setBlock("H2")}>
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Heading 3" onClick={() => setBlock("H3")}>
            <Heading3 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Bullet list" onClick={() => runCommand("insertUnorderedList")}>
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Numbered list" onClick={() => runCommand("insertOrderedList")}>
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Quote" onClick={() => setBlock("BLOCKQUOTE")}>
            <Quote className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Link" onClick={insertLink}>
            <Link2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Clear formatting" onClick={() => runCommand("removeFormat")}>
            <RemoveFormatting className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Paragraph" onClick={() => setBlock("P")}>
            P
          </ToolbarButton>
        </div>

        <div className="relative rounded-2xl border border-border bg-white">
          {!value.trim() && !isFocused ? (
            <div className="pointer-events-none absolute px-4 py-3 text-muted-foreground/80">
              {placeholder}
            </div>
          ) : null}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              emitChange();
            }}
            onInput={emitChange}
            onKeyDown={handleKeyDown}
            className="min-h-[420px] px-4 py-3 outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:text-3xl [&_h2]:font-black [&_h2]:italic [&_h3]:text-2xl [&_h3]:font-black [&_h3]:italic [&_li]:ml-5 [&_ol]:list-decimal [&_p]:min-h-[1.5em] [&_ul]:list-disc"
          />
        </div>
      </div>
    );
  },
);

function ToolbarButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-xs font-black uppercase text-slate-700 transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
    >
      {children}
    </button>
  );
}
