"use client";

import { useState } from "react";
import type { Mentor, Pitch, UserProfile } from "@/lib/types";

export function MentorAvatar({
  mentor,
  className = "h-12 w-12 text-base",
}: {
  mentor: Mentor;
  className?: string;
}) {
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${mentor.avatarGradient} font-extrabold text-white shadow-soft ${className}`}
    >
      {mentor.initials}
    </div>
  );
}

const WORD_LIMIT = 400;

const STATUS_STYLES: Record<Pitch["status"], string> = {
  sent: "bg-gold/15 text-ink",
  accepted: "bg-mint/15 text-emerald-900",
  declined: "bg-ink/5 text-ink/60",
};

export default function MentorCard({
  mentor,
  reasons,
  profile,
  pitch,
  onSend,
}: {
  mentor: Mentor;
  reasons: string[];
  profile: UserProfile;
  pitch?: Pitch;
  onSend: (pitch: Pitch) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const overLimit = words > WORD_LIMIT;

  function send() {
    if (!text.trim() || overLimit) return;
    onSend({
      id: `${mentor.id}-${Date.now()}`,
      mentorId: mentor.id,
      founderName: name.trim() || "A founder",
      profile,
      text: text.trim(),
      createdAt: Date.now(),
      status: "sent",
    });
    setOpen(false);
  }

  return (
    <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur">
      <div className="flex items-start gap-4">
        <MentorAvatar mentor={mentor} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <h3 className="font-bold">{mentor.name}</h3>
            <span className="text-xs text-ink/50">· {mentor.location}</span>
          </div>
          <p className="mt-0.5 text-sm text-ink/70">{mentor.headline}</p>
          {reasons.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {reasons.slice(0, 3).map((r) => (
                <li
                  key={r}
                  className="rounded-full bg-violet/10 px-2.5 py-1 text-[11px] font-medium text-violet"
                >
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink/70">{mentor.bio}</p>

      {/* Already pitched → show status + any reply */}
      {pitch ? (
        <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${STATUS_STYLES[pitch.status]}`}>
          {pitch.status === "sent" && "⏳ Pitch sent — waiting to hear back."}
          {pitch.status === "accepted" && (
            <div>
              <p className="font-semibold">✓ {mentor.name} wants to connect!</p>
              {pitch.reply && <p className="mt-1 text-ink/80">“{pitch.reply}”</p>}
            </div>
          )}
          {pitch.status === "declined" && (
            <div>
              <p className="font-medium">{mentor.name} passed this time.</p>
              {pitch.reply && <p className="mt-1">“{pitch.reply}”</p>}
            </div>
          )}
        </div>
      ) : open ? (
        <div className="mt-4 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name or startup"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-violet"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={`Explain your idea to ${mentor.name.split(" ")[0]} in ${WORD_LIMIT} words — the problem, what you're building, and what you need help with.`}
            className="w-full resize-none rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-violet"
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${overLimit ? "font-semibold text-rose-500" : "text-ink/50"}`}>
              {words} / {WORD_LIMIT} words
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={send}
                disabled={!text.trim() || overLimit}
                className="btn-gradient rounded-full px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send pitch
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-gradient mt-4 w-full rounded-full py-2.5 text-sm font-semibold"
        >
          💜 Pitch your idea
        </button>
      )}
    </div>
  );
}
