"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Aurora from "@/components/Aurora";
import Brand from "@/components/Brand";
import SwipeCard, { type SwipeCardHandle } from "@/components/SwipeCard";
import { schemes } from "@/lib/data";
import { scoreEntries } from "@/lib/match";
import { loadProfile } from "@/lib/profile";
import { loadSwipes, saveSwipes } from "@/lib/store";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type Category,
  type Entry,
  type UserProfile,
} from "@/lib/types";

type DeckItem = { entry: Entry; locked: boolean };

// Makes it instantly obvious what the current deck is about.
const CATEGORY_ICONS: Record<Category, string> = {
  recognition: "🏅",
  benefit: "🎁",
  funding: "💰",
  incubator: "🏢",
  competition: "🏆",
  process: "🧭",
  compliance: "📋",
};

const CATEGORY_BLURBS: Record<Category, string> = {
  recognition: "Official startup status that unlocks other benefits.",
  benefit: "Tax breaks, rebates and perks you can claim.",
  funding: "Grants, seed money and loans for your startup.",
  incubator: "Places that take you in, mentor you and give you space.",
  competition: "Pitch challenges and awards with prizes.",
  process: "Step-by-step how-tos for the essentials.",
  compliance: "The filings you need to keep up with.",
};

export default function SwipePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  // Record each card's membership BEFORE the swipe, so undo restores it exactly
  // (a re-swiped card may have been liked/passed already, not "neither").
  const history = useRef<
    { id: string; prev: "liked" | "passed" | "neither" }[]
  >([]);
  const initialized = useRef(false);
  const cardRef = useRef<SwipeCardHandle>(null);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
    const s = loadSwipes();
    setLiked(s.liked);
    setPassed(s.passed);
  }, [router]);

  // Ordered deck: category by category (canonical order), best matches first
  // within each, locked (DPIIT-gated) cards included and flagged.
  const deck = useMemo<DeckItem[]>(() => {
    if (!profile) return [];
    const { matched, locked } = scoreEntries(profile, schemes);
    const all = [
      ...matched.map((s) => ({ ...s, locked: false })),
      ...locked.map((s) => ({ ...s, locked: true })),
    ];
    return CATEGORY_ORDER.flatMap((cat) =>
      all
        .filter((s) => s.entry.category === cat)
        .sort((a, b) => b.score - a.score)
        .map((s) => ({ entry: s.entry, locked: s.locked })),
    );
  }, [profile]);

  // Distinct categories present, in canonical order — for the "category X of Y".
  const deckCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => deck.some((d) => d.entry.category === c)),
    [deck],
  );

  // On first load, resume at the first not-yet-decided card so revisiting
  // /swipe doesn't force the user to replay everything. Runs once.
  useEffect(() => {
    if (initialized.current || deck.length === 0) return;
    const decided = new Set([...liked, ...passed]);
    const firstUndecided = deck.findIndex((d) => !decided.has(d.entry.id));
    setIndex(firstUndecided === -1 ? deck.length : firstUndecided);
    initialized.current = true;
  }, [deck, liked, passed]);

  const persist = useCallback((nextLiked: string[], nextPassed: string[]) => {
    setLiked(nextLiked);
    setPassed(nextPassed);
    saveSwipes({ liked: nextLiked, passed: nextPassed });
  }, []);

  const decide = useCallback(
    (dir: "left" | "right") => {
      const item = deck[index];
      if (!item) return;
      const id = item.entry.id;
      const prev = liked.includes(id)
        ? "liked"
        : passed.includes(id)
          ? "passed"
          : "neither";
      history.current.push({ id, prev });
      const baseLiked = liked.filter((x) => x !== id);
      const basePassed = passed.filter((x) => x !== id);
      if (dir === "right") persist([...baseLiked, id], basePassed);
      else persist(baseLiked, [...basePassed, id]);
      setIndex((i) => i + 1);
    },
    [deck, index, liked, passed, persist],
  );

  const undo = useCallback(() => {
    const last = history.current.pop();
    if (!last) return;
    const baseLiked = liked.filter((x) => x !== last.id);
    const basePassed = passed.filter((x) => x !== last.id);
    // Restore the card to exactly where it was before the swipe.
    if (last.prev === "liked") persist([...baseLiked, last.id], basePassed);
    else if (last.prev === "passed") persist(baseLiked, [...basePassed, last.id]);
    else persist(baseLiked, basePassed);
    setIndex((i) => Math.max(0, i - 1));
  }, [liked, passed, persist]);

  // Keyboard: ← skip, → save, backspace undo.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") cardRef.current?.swipe("right");
      else if (e.key === "ArrowLeft") cardRef.current?.swipe("left");
      else if (e.key === "Backspace") {
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  if (!profile) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-ink/50">Loading your deck…</p>
      </main>
    );
  }

  const current = deck[index];
  const next = deck[index + 1];
  const done = index >= deck.length;

  // Progress within the current category.
  const catItems = current
    ? deck.filter((d) => d.entry.category === current.entry.category)
    : [];
  const catPos = current
    ? catItems.findIndex((d) => d.entry.id === current.entry.id) + 1
    : 0;
  const catIndex = current
    ? deckCategories.indexOf(current.entry.category) + 1
    : 0;

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <Aurora />

      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-5">
        <Link href="/">
          <Brand />
        </Link>
        <Link
          href="/summary"
          className="text-sm font-medium text-ink/60 transition hover:text-ink"
        >
          Skip to shortlist →
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8">
        {done ? (
          <div className="animate-pop m-auto w-full rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-soft backdrop-blur">
            <div className="text-4xl">🎉</div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight">
              That's the full deck!
            </h1>
            <p className="mt-2 text-ink/70">
              You saved{" "}
              <span className="font-bold text-violet">{liked.length}</span>{" "}
              {liked.length === 1 ? "thing" : "things"}. Let's turn them into a
              plan — and find you a mentor.
            </p>
            <Link
              href="/summary"
              className="btn-gradient mt-6 inline-block rounded-full px-8 py-3.5 font-semibold"
            >
              See my shortlist →
            </Link>
            <button
              type="button"
              onClick={() => {
                history.current = [];
                setIndex(0);
              }}
              className="mt-4 block w-full text-sm font-medium text-ink/50 hover:text-ink"
            >
              ↺ Swipe through again
            </button>
          </div>
        ) : (
          <>
            {/* category banner — re-pops each time the category changes so
                it's impossible to miss what you're swiping for */}
            <div
              key={current.entry.category}
              className="animate-pop mb-4 flex items-center gap-3 rounded-2xl border border-violet/20 bg-gradient-to-br from-violet/10 to-fuchsia/10 p-4 shadow-soft backdrop-blur"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet to-fuchsia text-3xl shadow-soft">
                {CATEGORY_ICONS[current.entry.category]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-violet">
                  Swiping for · {catIndex} of {deckCategories.length}
                </p>
                <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
                  {CATEGORY_LABELS[current.entry.category]}
                </h2>
                <p className="mt-0.5 text-xs text-ink/60">
                  {CATEGORY_BLURBS[current.entry.category]}
                </p>
              </div>
            </div>

            {/* progress */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-ink/50">
                <span>
                  Card {catPos} of {catItems.length} in this group
                </span>
                <span>
                  {index + 1}/{deck.length} overall · saved {liked.length}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet to-fuchsia transition-all duration-300"
                  style={{ width: `${((index + 1) / deck.length) * 100}%` }}
                />
              </div>
            </div>

            {/* card stack */}
            <div className="relative flex-1">
              {next && (
                <div className="pointer-events-none absolute inset-0 scale-[0.96] opacity-60">
                  <SwipeCard entry={next.entry} locked={next.locked} onDecide={() => {}} />
                </div>
              )}
              <div className="absolute inset-0">
                <SwipeCard
                  key={current.entry.id + index}
                  ref={cardRef}
                  entry={current.entry}
                  locked={current.locked}
                  onDecide={decide}
                />
              </div>
            </div>

            {/* controls */}
            <div className="mt-6 flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => cardRef.current?.swipe("left")}
                aria-label="Skip"
                className="card-hover grid h-14 w-14 place-items-center rounded-full border border-white/70 bg-white text-2xl text-rose-500 shadow-soft"
              >
                ✕
              </button>
              <button
                type="button"
                onClick={undo}
                disabled={index === 0}
                aria-label="Undo"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-white text-lg text-ink/60 shadow-soft transition hover:text-ink disabled:opacity-30"
              >
                ↺
              </button>
              <button
                type="button"
                onClick={() => cardRef.current?.swipe("right")}
                aria-label="Save"
                className="card-hover grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet to-fuchsia text-2xl text-white shadow-soft"
              >
                ♥
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-ink/40">
              Drag the card, tap the buttons, or use ← / → keys
            </p>
          </>
        )}
      </div>
    </main>
  );
}
