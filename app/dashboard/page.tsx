"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ActionPlan from "@/components/ActionPlan";
import AskAssistant from "@/components/AskAssistant";
import Aurora from "@/components/Aurora";
import DashboardBrief from "@/components/DashboardBrief";
import Reveal from "@/components/Reveal";
import SchemeCard from "@/components/SchemeCard";
import { schemes } from "@/lib/data";
import { scoreEntries } from "@/lib/match";
import { buildPlan } from "@/lib/plan";
import { loadProfile } from "@/lib/profile";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  FUNDING_LABELS,
  SECTOR_LABELS,
  STAGE_LABELS,
  type UserProfile,
} from "@/lib/types";

const TOP_COUNT = 6;

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showAsk, setShowAsk] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
  }, [router]);

  if (!profile) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-ink/50">Loading your navigator…</p>
      </main>
    );
  }

  const { matched, locked } = scoreEntries(profile, schemes);
  const plan = buildPlan(profile, schemes);

  // Top matches lead; the remainder stays grouped by category so the page still
  // reads as an organised catalogue below the fold.
  const top = matched.slice(0, TOP_COUNT);
  const rest = matched.slice(TOP_COUNT);
  const restGroups = CATEGORY_ORDER.map((category) => ({
    category,
    items: rest.filter((s) => s.entry.category === category),
  })).filter((g) => g.items.length > 0);

  const profileChips = [
    STAGE_LABELS[profile.stage],
    SECTOR_LABELS[profile.sector],
    profile.state,
    FUNDING_LABELS[profile.fundingNeed],
    profile.dpiitRecognized ? "DPIIT recognised ✓" : "Not DPIIT recognised",
    // != null, not truthy: 0 (under a year old) is a valid age the matcher uses.
    ...(profile.companyAgeYears != null
      ? [
          profile.companyAgeYears === 0
            ? "under 1 yr old"
            : `${profile.companyAgeYears} yr old`,
        ]
      : []),
  ];

  return (
    <main className="relative min-h-screen overflow-hidden pb-24">
      <Aurora />
      <header>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-extrabold tracking-tight">
            🧭 WeBridge
          </Link>
          <Link
            href="/onboarding"
            className="glass rounded-full border border-white/60 px-4 py-1.5 text-sm font-medium text-ink/70 shadow-soft transition hover:text-ink"
          >
            Edit profile
          </Link>
        </div>
        <div className="animate-fade-up mx-auto max-w-5xl px-6 pb-6 pt-6">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            <span className="gradient-text">
              {matched.length} thing{matched.length === 1 ? "" : "s"}
            </span>{" "}
            you may qualify for
          </h1>
          {locked.length > 0 && (
            <p className="mt-2 text-ink/60">
              + {locked.length} more unlock once you get DPIIT recognition.
            </p>
          )}
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
      </header>

      <div className="mx-auto max-w-5xl px-6">
        {matched.length === 0 && locked.length === 0 ? (
          <div className="glass mt-16 rounded-3xl border border-white/70 p-10 text-center shadow-soft">
            <p className="text-lg font-bold">No matches yet.</p>
            <p className="mt-2 text-ink/60">
              Try adjusting your answers — most founders match at least a few
              schemes.
            </p>
            <Link
              href="/onboarding"
              className="btn-gradient mt-6 inline-block rounded-full px-6 py-3 font-semibold"
            >
              Edit profile
            </Link>
          </div>
        ) : (
          <>
            <DashboardBrief profile={profile} />

            <Reveal>
              <ActionPlan steps={plan} />
            </Reveal>

            {top.length > 0 && (
              <Reveal>
                <section className="mt-12">
                  <h2 className="text-xl font-bold">Top matches for you</h2>
                  <p className="mt-1 text-sm text-ink/60">
                    Ranked by how well each fits your profile.
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {top.map((s) => (
                      <SchemeCard
                        key={s.entry.id}
                        entry={s.entry}
                        reasons={s.reasons}
                      />
                    ))}
                  </div>
                </section>
              </Reveal>
            )}

            {restGroups.map((group) => (
              <Reveal key={group.category}>
                <section className="mt-12">
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-xl font-bold">
                      {CATEGORY_LABELS[group.category]}
                    </h2>
                    <span className="text-sm text-ink/50">
                      {group.items.length}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((s) => (
                      <SchemeCard
                        key={s.entry.id}
                        entry={s.entry}
                        reasons={s.reasons}
                      />
                    ))}
                  </div>
                </section>
              </Reveal>
            ))}

            {locked.length > 0 && (
              <Reveal>
                <section className="mt-12">
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-xl font-bold">
                      Unlocks after DPIIT recognition
                    </h2>
                    <span className="text-sm text-ink/50">{locked.length}</span>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {locked.map((s) => (
                      <SchemeCard
                        key={s.entry.id}
                        entry={s.entry}
                        locked
                        reasons={s.reasons}
                      />
                    ))}
                  </div>
                </section>
              </Reveal>
            )}
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
