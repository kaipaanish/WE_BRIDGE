"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Aurora from "@/components/Aurora";
import Brand from "@/components/Brand";
import { MentorAvatar } from "@/components/MentorCard";
import { mentors } from "@/lib/data";
import { loadPitches, updatePitch } from "@/lib/store";
import {
  FUNDING_LABELS,
  SECTOR_LABELS,
  STAGE_LABELS,
  type Pitch,
  type PitchStatus,
} from "@/lib/types";

export default function MentorPage() {
  const [mentorId, setMentorId] = useState(mentors[0].id);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setPitches(loadPitches());
  }, []);

  const mentor = mentors.find((m) => m.id === mentorId) ?? mentors[0];
  const inbox = useMemo(
    () =>
      pitches
        .filter((p) => p.mentorId === mentorId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [pitches, mentorId],
  );
  const pendingCountFor = (id: string) =>
    pitches.filter((p) => p.mentorId === id && p.status === "sent").length;

  function respond(id: string, status: PitchStatus) {
    const reply = drafts[id]?.trim() || undefined;
    updatePitch(id, { status, reply });
    setPitches((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status, reply } : p)),
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden pb-20">
      <Aurora />

      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/">
          <Brand />
        </Link>
        <Link
          href="/summary"
          className="glass rounded-full border border-white/60 px-3 py-1.5 text-sm font-medium text-ink/70 shadow-soft transition hover:text-ink"
        >
          ← Founder view
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-6">
        <div className="animate-fade-up pt-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet">
            Mentor account
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
            Your inbox
          </h1>
          <p className="mt-2 text-ink/70">
            You're viewing as a mentor. Pick who you are, then reply to the
            founders reaching out.
          </p>
        </div>

        {/* Which mentor am I? (demo account switcher) */}
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
          {mentors.map((m) => {
            const pending = pendingCountFor(m.id);
            const active = m.id === mentorId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMentorId(m.id)}
                className={`relative flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-left transition ${
                  active
                    ? "border-violet bg-violet/10 shadow-soft"
                    : "border-white/70 bg-white/70 hover:border-violet/40"
                }`}
              >
                <MentorAvatar mentor={m} className="h-9 w-9 text-xs" />
                <span className="pr-1 text-sm font-semibold">
                  {m.name.split(" ")[0]}
                </span>
                {pending > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-fuchsia px-1 text-[11px] font-bold text-white">
                    {pending}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected mentor summary */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-soft">
          <MentorAvatar mentor={mentor} />
          <div>
            <p className="font-bold">{mentor.name}</p>
            <p className="text-sm text-ink/60">{mentor.headline}</p>
          </div>
        </div>

        {/* Inbox */}
        <div className="mt-6 space-y-4">
          {inbox.length === 0 ? (
            <div className="glass rounded-3xl border border-white/70 p-10 text-center shadow-soft">
              <div className="text-4xl">📭</div>
              <p className="mt-3 font-bold">No pitches yet for {mentor.name.split(" ")[0]}</p>
              <p className="mt-2 text-sm text-ink/60">
                Switch to{" "}
                <Link href="/summary" className="font-semibold text-violet hover:underline">
                  founder view
                </Link>
                , swipe through some schemes, and pitch this mentor to see it
                land here.
              </p>
            </div>
          ) : (
            inbox.map((p) => (
              <article
                key={p.id}
                className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{p.founderName}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    STAGE_LABELS[p.profile.stage],
                    SECTOR_LABELS[p.profile.sector],
                    p.profile.state,
                    FUNDING_LABELS[p.profile.fundingNeed],
                    p.profile.dpiitRecognized ? "DPIIT ✓" : "No DPIIT",
                  ].map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink/60"
                    >
                      {c}
                    </span>
                  ))}
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                  {p.text}
                </p>

                {p.status === "sent" ? (
                  <div className="mt-4 space-y-3 border-t border-ink/5 pt-4">
                    <textarea
                      value={drafts[p.id] ?? ""}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [p.id]: e.target.value }))
                      }
                      rows={2}
                      placeholder="Add a short reply (optional)…"
                      className="w-full resize-none rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-violet"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => respond(p.id, "accepted")}
                        className="flex-1 rounded-full bg-gradient-to-br from-mint to-emerald-500 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-105"
                      >
                        ✓ Accept & connect
                      </button>
                      <button
                        type="button"
                        onClick={() => respond(p.id, "declined")}
                        className="rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:text-ink"
                      >
                        Pass
                      </button>
                    </div>
                  </div>
                ) : (
                  p.reply && (
                    <div className="mt-3 rounded-2xl bg-violet/5 px-4 py-3 text-sm text-ink/80">
                      <span className="font-semibold">Your reply:</span> “{p.reply}”
                    </div>
                  )
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: PitchStatus }) {
  const map: Record<PitchStatus, { label: string; cls: string }> = {
    sent: { label: "New", cls: "bg-gold/20 text-ink" },
    accepted: { label: "Accepted", cls: "bg-mint/15 text-emerald-900" },
    declined: { label: "Passed", cls: "bg-ink/5 text-ink/50" },
  };
  const s = map[status];
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}
