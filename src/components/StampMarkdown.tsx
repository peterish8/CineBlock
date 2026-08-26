"use client";

import type { ReactNode } from "react";

type StampMarkdownProps = {
  value: string;
};

function safeHref(value: string) {
  return /^(https?:\/\/|mailto:)/i.test(value) ? value : null;
}

function inlineMarkdown(value: string): ReactNode[] {
  const tokenPattern = /(\*\*.+?\*\*|__.+?__|~~.+?~~|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*|_.+?_)/g;
  const parts = value.split(tokenPattern);

  return parts.map((part, index) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("__") && part.endsWith("__")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("~~") && part.endsWith("~~")) return <del key={index}>{part.slice(2, -2)}</del>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="rounded-md bg-white/10 px-1.5 py-0.5 text-[0.9em] text-cyan-100">{part.slice(1, -1)}</code>;
    if (part.startsWith("[") && part.includes("](")) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = match ? safeHref(match[2]) : null;
      if (match && href) return <a key={index} href={href} target="_blank" rel="noreferrer" className="text-cyan-200 underline decoration-cyan-200/40 underline-offset-4 hover:text-white">{match[1]}</a>;
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) return <em key={index}>{part.slice(1, -1)}</em>;
    return <span key={index}>{part}</span>;
  }).filter(Boolean) as ReactNode[];
}

export default function StampMarkdown({ value }: StampMarkdownProps) {
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let quote: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: string[] | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(<p key={`p-${blocks.length}`}>{paragraph.map((line, index) => <span key={index}>{index > 0 && <br />}{inlineMarkdown(line)}</span>)}</p>);
    paragraph = [];
  };

  const flushQuote = () => {
    if (!quote.length) return;
    blocks.push(<blockquote key={`q-${blocks.length}`}>{quote.map((line, index) => <span key={index}>{index > 0 && <br />}{inlineMarkdown(line)}</span>)}</blockquote>);
    quote = [];
  };

  const flushList = () => {
    if (!list) return;
    const List = list.ordered ? "ol" : "ul";
    blocks.push(<List key={`list-${blocks.length}`}>{list.items.map((item, index) => <li key={index}>{inlineMarkdown(item)}</li>)}</List>);
    list = null;
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      flushParagraph();
      flushQuote();
      flushList();
      if (code) {
        blocks.push(<pre key={`code-${blocks.length}`}><code>{code.join("\n")}</code></pre>);
        code = null;
      } else {
        code = [];
      }
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushQuote();
      flushList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushQuote();
      flushList();
      const Tag = `h${heading[1].length}` as "h1" | "h2" | "h3" | "h4";
      blocks.push(<Tag key={`h-${blocks.length}`}>{inlineMarkdown(heading[2])}</Tag>);
      continue;
    }

    if (/^(---+|___+|\*\s*\*\s*\*)$/.test(trimmed)) {
      flushParagraph();
      flushQuote();
      flushList();
      blocks.push(<hr key={`hr-${blocks.length}`} />);
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      flushList();
      quote.push(trimmed.replace(/^>\s?/, ""));
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ordered || unordered) {
      flushParagraph();
      flushQuote();
      const isOrdered = Boolean(ordered);
      if (!list || list.ordered !== isOrdered) {
        flushList();
        list = { ordered: isOrdered, items: [] };
      }
      list.items.push((ordered ?? unordered)![1]);
      continue;
    }

    flushQuote();
    flushList();
    paragraph.push(line.replace(/  $/, ""));
  }

  if (code) blocks.push(<pre key={`code-${blocks.length}`}><code>{code.join("\n")}</code></pre>);
  flushParagraph();
  flushQuote();
  flushList();

  return <div className="stamp-markdown">{blocks.length ? blocks : <p className="text-slate-400">No feeling written yet.</p>}</div>;
}
