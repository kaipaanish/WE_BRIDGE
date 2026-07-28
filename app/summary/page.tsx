"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ActionPlan from "@/components/ActionPlan";
import AskAssistant from "@/components/AskAssistant";
import Aurora from "@/components/Aurora";
import Brand from "@/components/Brand";
import DashboardBrief from "@/components/DashboardBrief";
import MentorCard from "@/components/MentorCard";
import Reveal from "@/components/Reveal";
import SchemeCard from "@/components/SchemeCard";
import { mentors, schemes } from "@/lib/data";
import { scoreEntries } from "@/lib/match";
import { scoreMentors } from "@/lib/mentors";
import { buildPlan } from "@/lib/plan";
import { loadProfile } from "@/lib/profile";
import { addPitch, loadPitches, loadSwipes } from "@/lib/store";
import {
  FUNDING_LABELS,
  SECTOR_LABELS,
  STAGE_LABELS,
  type Pitch,
  type UserProfile,
} from "@/lib/types";

export default function SummaryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [liked, setLiked] = useState<string[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [showAsk, setShowAsk] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
    setLiked(loadSwipes().liked);
    setPitches(loadPitches());
  }, [router]);

  const likedEntries = useMemo(
    () => schemes.filter((e) => liked.includes(e.id)),
    [liked],
  );

  // "why this matched" reasons for the cards, from the ranker.
  const reasonsById = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!profile) return map;
    const { matched, locked } = scoreEntries(profile, schemes);
    [...matched, ...locked].forEach((s) => map.set(s.entry.id, s.reasons));
    return map;
  }, [profile]);

  const scoredMentors = useMemo(
    () => (profile ? scoreMentors(profile, likedEntries, mentors) : []),
    [profile, likedEntries],
  );

  if (!profile) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-ink/50">Loading your shortlist…</p>
      </main>
    );
  }

  const ready = likedEntries.filter(
    (e) => !(e.eligibility.dpiitRequired && !profile.dpiitRecognized),
  );
  const planned = likedEntries.filter(
    (e) => e.eligibility.dpiitRequired && !profile.dpiitRecognized,
  );
  const plan = buildPlan(profile, schemes);

  // The onboarding answers, shown back so the founder can see what's driving
  // these matches (and edit if it's wrong).
  const profileChips = [
    STAGE_LABELS[profile.stage],
    SECTOR_LABELS[profile.sector],
    profile.state,
    FUNDING_LABELS[profile.fundingNeed],
    profile.dpiitRecognized ? "DPIIT recognised ✓" : "Not DPIIT recognised",
    ...(profile.companyAgeYears != null
      ? [
          profile.companyAgeYears === 0
            ? "under 1 yr old"
            : `${profile.companyAgeYears} yr old`,
        ]
      : []),
  ];

  function handleSend(pitch: Pitch) {
    addPitch(pitch);
    setPitches((prev) => [pitch, ...prev]);
  }
  const pitchFor = (mentorId: string) =>
    pitches.find((p) => p.mentorId === mentorId);

  return (
    <main className="relative min-h-screen overflow-hidden pb-24">
      <Aurora />

      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <Link href="/">
          <Brand />
        </Link>
        <div className="flex items-center gap-3 text-sm font-medium">
          <Link
            href="/onboarding"
            className="text-ink/60 transition hover:text-ink"
          >
            Edit profile
          </Link>
          <Link href="/swipe" className="text-ink/60 transition hover:text-ink">
            ↺ Re-swipe
          </Link>
          <Link
            href="/mentor"
            className="glass rounded-full border border-white/60 px-3 py-1.5 text-ink/70 shadow-soft transition hover:text-ink"
          >
            Mentor view →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6">
        <div className="animate-fade-up pt-4">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Your <span className="gradient-text">shortlist</span>
          </h1>
          <p className="mt-2 text-ink/70">
            {likedEntries.length === 0
              ? "You haven't saved anything yet."
              : `${ready.length} ready to act on${planned.length ? `, ${planned.length} unlock after DPIIT` : ""}.`}
          </p>

          {/* Your onboarding answers — what's driving these matches. */}
          <div className="mt-4 flex flex-wrap gap-2">
            {profileChips.map((chip) => (
              <span
                key={chip}
                className="glass rounded-full border border-white/60 px-3 py-1 text-xs font-medium text-ink/70"
              >
                {chip}
              </span>
            ))}
          </div>
          {profile.topNeed && (
            <p className="mt-3 text-sm text-ink/60">
              You told us you need:{" "}
              <span className="font-medium text-ink">“{profile.topNeed}”</span>
            </p>
          )}
        </div>

        {likedEntries.length === 0 ? (
          <div className="glass mt-10 rounded-3xl border border-white/70 p-10 text-center shadow-soft">
            <div className="text-4xl">🃏</div>
            <p className="mt-3 text-lg font-bold">Nothing saved yet</p>
            <p className="mt-2 text-ink/60">
              Swipe through the schemes and save the ones that fit — then come
              back for your plan and mentors.
            </p>
            <Link
              href="/swipe"
              className="btn-gradient mt-6 inline-block rounded-full px-8 py-3 font-semibold"
            >
              Start swiping →
            </Link>
          </div>
        ) : (
          <>
            <DashboardBrief profile={profile} />

            <Reveal>
              <ActionPlan steps={plan} />
            </Reveal>

            {ready.length > 0 && (
              <Reveal>
                <section className="mt-12">
                  <h2 className="text-xl font-bold">Ready to apply</h2>
                  <p className="mt-1 text-sm text-ink/60">
                    You saved these and you qualify now.
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {ready.map((e) => (
                      <SchemeCard
                        key={e.id}
                        entry={e}
                        reasons={reasonsById.get(e.id) ?? []}
                      />
                    ))}
                  </div>
                </section>
              </Reveal>
            )}

            {planned.length > 0 && (
              <Reveal>
                <section className="mt-12">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-xl font-bold">
                      Planned — unlocks after DPIIT
                    </h2>
                    <Link
                      href="/scheme/get-dpiit-recognised"
                      className="text-sm font-semibold text-violet hover:underline"
                    >
                      Get DPIIT recognised →
                    </Link>
                  </div>
                  <p className="mt-1 text-sm text-ink/60">
                    You liked these — DPIIT recognition (free) opens them up.
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {planned.map((e) => (
                      <SchemeCard
                        key={e.id}
                        entry={e}
                        locked
                        reasons={reasonsById.get(e.id) ?? []}
                      />
                    ))}
                  </div>
                </section>
              </Reveal>
            )}

            <Reveal>
              <section className="mt-14">
                <h2 className="text-2xl font-extrabold tracking-tight">
                  Mentors <span className="gradient-text">matched to you</span>
                </h2>
                <p className="mt-1 text-sm text-ink/60">
                  Ranked by your sector, stage and what you saved. Pitch your
                  idea — you'll hear back from the ones who love it.
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {scoredMentors.map((sm) => (
                    <MentorCard
                      key={sm.mentor.id}
                      mentor={sm.mentor}
                      reasons={sm.reasons}
                      profile={profile}
                      pitch={pitchFor(sm.mentor.id)}
                      onSend={handleSend}
                    />
                  ))}
                </div>
              </section>
            </Reveal>
          </>
        )}
      </div>

      {showAsk && (
        <div className="animate-pop glass fixed bottom-24 right-6 z-40 max-h-[70vh] w-[min(26rem,calc(100vw-3rem))] overflow-y-auto rounded-3xl border border-white/70 p-5 shadow-soft">
          <h3 className="font-bold">Ask WeBridge AI</h3>
          <p className="mt-1 text-xs text-ink/60">
            Answers come only from our curated scheme data.
          </p>
          <div className="mt-4">
            <AskAssistant profile={profile} />
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setShowAsk((v) => !v)}
        className="btn-gradient fixed bottom-6 right-6 z-40 rounded-full px-5 py-4 font-semibold"
      >
        {showAsk ? "✕ Close" : "💬 Ask AI"}
      </button>
    </main>
  );
}
