import type { Entry, ScoredEntry, UserProfile } from "./types";
import { CATEGORY_ORDER, FUNDING_LABELS, SECTOR_LABELS, STAGE_LABELS } from "./types";

export function matchEntries(profile: UserProfile, entries: Entry[]): Entry[] {
  return entries.filter((e) => {
    const stageOk = e.eligibility.stage.includes(profile.stage);
    const dpiitOk = !e.eligibility.dpiitRequired || profile.dpiitRecognized;
    const sectorOk =
      e.eligibility.sector.includes("any") ||
      e.eligibility.sector.includes(profile.sector);
    return stageOk && dpiitOk && sectorOk;
  });
}

// Entries the user would qualify for if they had DPIIT recognition —
// shown on the dashboard flagged as "unlocks after DPIIT recognition".
export function dpiitLockedEntries(
  profile: UserProfile,
  entries: Entry[],
): Entry[] {
  if (profile.dpiitRecognized) return [];
  return entries.filter((e) => {
    const stageOk = e.eligibility.stage.includes(profile.stage);
    const sectorOk =
      e.eligibility.sector.includes("any") ||
      e.eligibility.sector.includes(profile.sector);
    return stageOk && sectorOk && e.eligibility.dpiitRequired;
  });
}

// --- Relevance scoring -----------------------------------------------------
// matchEntries above is a plain pass/fail filter (per spec §5). scoreEntries
// layers ranking on top: it uses the WHOLE profile — state, funding need,
// company age, and the founder's stated need — none of which the basic filter
// touched. It returns entries sorted most-relevant first, each carrying the
// human reasons it surfaced ("why this matches you").

// Kept deliberately small; threshold is length >= 3 so short domain terms the
// founder actually cares about (gst, tax, ipr) survive, while common filler is
// dropped by name here.
const STOPWORDS = new Set([
  "want",
  "need",
  "help",
  "with",
  "some",
  "money",
  "funding",
  "startup",
  "business",
  "company",
  "looking",
  "right",
  "now",
  "just",
  "have",
  "that",
  "this",
  "from",
  "your",
  "our",
  "and",
  "the",
  "for",
  "are",
  "was",
  "has",
  "but",
  "not",
  "get",
  "any",
  "can",
  "you",
  "who",
  "how",
]);

// Prerequisites the whole journey hinges on — boosted so they lead the list
// for founders who still need them.
const FUNDING_TAGS: Record<Exclude<UserProfile["fundingNeed"], "none">, string[]> = {
  grant: ["grant"],
  seed: ["seed"],
  equity: ["equity", "vc"],
};

/**
 * Hard eligibility gate. Returns whether the entry is a match at all, and
 * whether it's DPIIT-locked (a match once the user gets recognition).
 */
function gate(
  profile: UserProfile,
  e: Entry,
): { ok: boolean; locked: boolean } {
  if (!e.eligibility.stage.includes(profile.stage)) return { ok: false, locked: false };

  const sectorOk =
    e.eligibility.sector.includes("any") ||
    e.eligibility.sector.includes(profile.sector);
  if (!sectorOk) return { ok: false, locked: false };

  // State-restricted scheme for a different state = not a match. "All India"
  // users aren't tied to a state, so they still see it (just unboosted).
  const restrictedTo = e.eligibility.state;
  if (
    restrictedTo &&
    profile.state !== "All India" &&
    profile.state !== restrictedTo
  ) {
    return { ok: false, locked: false };
  }

  // Over the age cap = genuinely ineligible.
  const cap = e.eligibility.maxAgeYears;
  if (cap != null && profile.companyAgeYears != null && profile.companyAgeYears > cap) {
    return { ok: false, locked: false };
  }

  const locked = e.eligibility.dpiitRequired && !profile.dpiitRecognized;
  return { ok: true, locked };
}

function scoreOne(profile: UserProfile, e: Entry): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Sector targeted specifically at them (not a catch-all "any").
  if (!e.eligibility.sector.includes("any") && e.eligibility.sector.includes(profile.sector)) {
    score += 3;
    reasons.push(`Matches your sector (${SECTOR_LABELS[profile.sector]})`);
  }

  // Built for exactly their stage, not a broad multi-stage scheme.
  if (e.eligibility.stage.length === 1 && e.eligibility.stage[0] === profile.stage) {
    score += 2;
    reasons.push(`Made for your stage (${STAGE_LABELS[profile.stage]})`);
  }

  // State signal.
  if (e.eligibility.state && e.eligibility.state === profile.state) {
    score += 4;
    reasons.push(`Available in ${profile.state}`);
  } else if (
    !e.eligibility.state &&
    typeof profile.state === "string" &&
    profile.state !== "All India" &&
    e.tags.includes(profile.state.toLowerCase())
  ) {
    score += 1;
    reasons.push("Based in your state");
  }

  // Prerequisites: lead with the gateway steps they still need.
  if (e.id === "incorporate-company" && profile.stage === "idea") {
    score += 5;
    reasons.push("Do this first — unlocks other schemes");
  }
  if ((e.id === "dpiit-recognition" || e.id === "get-dpiit-recognised") && !profile.dpiitRecognized) {
    score += 4;
    reasons.push("Unlocks most other benefits");
  }

  // Funding need alignment — only the RIGHT kind of funding earns the boost and
  // the affirmative chip. A grant-seeker should not see a collateral-free loan
  // or a VC fund labelled "matches your goal"; those are still funding, so they
  // get a small nudge and an honest "other funding" chip instead.
  if (profile.fundingNeed !== "none" && e.category === "funding") {
    const wantedTags = FUNDING_TAGS[profile.fundingNeed];
    if (wantedTags.some((t) => e.tags.includes(t))) {
      score += 5;
      reasons.push(`${FUNDING_LABELS[profile.fundingNeed]} — what you're after`);
    } else {
      score += 1;
      reasons.push("Other funding worth a look");
    }
  }

  // Free-text need: light keyword overlap against name/hook/tags.
  const need = profile.topNeed?.toLowerCase().trim();
  if (need) {
    const haystack = `${e.name} ${e.oneLiner} ${e.tags.join(" ")}`.toLowerCase();
    const tokens = need
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
    if (tokens.some((t) => haystack.includes(t))) {
      score += 2;
      reasons.push("Relevant to what you asked for");
    }
  }

  return { score, reasons };
}

// Deterministic ordering: score desc, then canonical category order, then name.
// No Date/Math.random — stable across renders.
function byRelevance(a: ScoredEntry, b: ScoredEntry): number {
  return (
    b.score - a.score ||
    CATEGORY_ORDER.indexOf(a.entry.category) - CATEGORY_ORDER.indexOf(b.entry.category) ||
    a.entry.name.localeCompare(b.entry.name)
  );
}

/**
 * Rank every scheme against the full profile. `matched` are actionable now;
 * `locked` are matches gated behind DPIIT recognition. Both are sorted
 * most-relevant first.
 */
export function scoreEntries(
  profile: UserProfile,
  entries: Entry[],
): { matched: ScoredEntry[]; locked: ScoredEntry[] } {
  const matched: ScoredEntry[] = [];
  const locked: ScoredEntry[] = [];

  for (const entry of entries) {
    const g = gate(profile, entry);
    if (!g.ok) continue;
    const { score, reasons } = scoreOne(profile, entry);
    (g.locked ? locked : matched).push({ entry, score, reasons });
  }

  matched.sort(byRelevance);
  locked.sort(byRelevance);
  return { matched, locked };
}
