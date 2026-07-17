"use client";

import { type ReactNode, useState } from "react";
import type { UserProfile } from "@/lib/types";

type ChatMessage = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "What funding can I apply for right now?",
  "How do I get DPIIT recognised?",
  "What compliance should I not miss?",
];

// The model answers in Markdown. We render the small subset it actually emits
// — bold, links, bare URLs, headings and bullet lists — without pulling in a
// full Markdown dependency.

// One match = a Markdown link [text](url), OR **bold**, OR a bare URL.
const INLINE_REGEX =
  /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*(.+?)\*\*|(https?:\/\/[^\s)]+)/g;

function link(href: string, label: string, key: string) {
  return (
    <a
      key={key}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-words text-coral underline"
    >
      {label}
    </a>
  );
}

/** Renders inline bold + links within a single line of text. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let i = 0;
  INLINE_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = INLINE_REGEX.exec(text)) !== null) {
    if (m.index > lastIndex) nodes.push(text.slice(lastIndex, m.index));
    const [full, linkText, linkUrl, boldText, bareUrl] = m;
    const key = `${keyPrefix}-${i}`;
    if (linkUrl) {
      nodes.push(link(linkUrl, linkText, key));
    } else if (boldText) {
      nodes.push(<strong key={key}>{boldText}</strong>);
    } else if (bareUrl) {
      nodes.push(link(bareUrl, bareUrl, key));
    }
    lastIndex = m.index + full.length;
    i++;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/** Renders the assistant's Markdown reply as headings, bullets and paragraphs. */
function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  text.split("\n").forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return; // blank line — spacing comes from the parent gap
    const heading = trimmed.match(/^#{1,6}\s+(.*)$/);
    const bullet = trimmed.match(/^[-*]\s+(.*)$/); // "* x" / "- x", not "**x**"
    if (heading) {
      blocks.push(
        <p key={idx} className="font-semibold">
          {renderInline(heading[1], `h${idx}`)}
        </p>,
      );
    } else if (bullet) {
      blocks.push(
        <div key={idx} className="flex gap-2">
          <span className="select-none text-ink/40">•</span>
          <span>{renderInline(bullet[1], `b${idx}`)}</span>
        </div>,
      );
    } else {
      blocks.push(<p key={idx}>{renderInline(trimmed, `p${idx}`)}</p>);
    }
  });
  return <div className="space-y-2">{blocks}</div>;
}

export default function AskAssistant({
  profile,
}: {
  profile: UserProfile | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, profile }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Something went wrong.");
      }
      setMessages((m) => [...m, { role: "assistant", text: data.answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="rounded-full border border-navy/15 bg-white px-3.5 py-2 text-xs font-medium transition hover:border-coral hover:text-coral"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex max-h-96 flex-col gap-3 overflow-y-auto pr-1">
          {messages.map((msg, i) =>
            msg.role === "user" ? (
              <div
                key={i}
                className="ml-8 self-end rounded-2xl rounded-br-sm bg-navy px-4 py-2.5 text-sm text-white"
              >
                {msg.text}
              </div>
            ) : (
              <div
                key={i}
                className="mr-8 self-start rounded-2xl rounded-bl-sm border border-navy/10 bg-white px-4 py-2.5 text-sm leading-relaxed"
              >
                <Markdown text={msg.text} />
              </div>
            ),
          )}
        </div>
      )}

      {loading && (
        <p className="text-sm text-ink/50">
          <span className="animate-pulse">Thinking…</span>
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-800">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about schemes, funding, compliance…"
          className="min-w-0 flex-1 rounded-full border border-navy/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-coral"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
