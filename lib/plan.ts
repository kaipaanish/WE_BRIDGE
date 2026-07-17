import { scoreEntries } from "./match";
import type { Entry, PlanStep, UserProfile } from "./types";

// Turns a profile into an ordered "do this first" path instead of a flat wall
// of cards. The sequence follows the real prerequisite chain for an Indian
// startup: incorporate -> get DPIIT recognition -> then funding/benefits and
// ongoing compliance unlock. Each step links to the scheme that explains it.

export function buildPlan(profile: UserProfile, entries: Entry[]): PlanStep[] {
  const steps: PlanStep[] = [];
  const registered = profile.stage !== "idea";
  const { matched, locked } = scoreEntries(profile, entries);

  const topMatched = (category: Entry["category"]) =>
    matched.find((s) => s.entry.category === category)?.entry ?? null;
  const topLocked = (category: Entry["category"]) =>
    locked.find((s) => s.entry.category === category)?.entry ?? null;

  // 1. Incorporate — the legal base everything else needs.
  if (!registered) {
    steps.push({
      title: "Register your company",
      detail:
        "Incorporate a private limited company or LLP — the legal foundation almost every scheme requires.",
      entryId: "incorporate-company",
      status: "now",
    });
  }

  // 2. DPIIT recognition — free, and the gateway to most benefits. Skip it for
  //    a company already past the recognition age cap (they're ineligible), so
  //    we never tell an over-cap founder to "do now" something they can't.
  const recogId = registered ? "get-dpiit-recognised" : "dpiit-recognition";
  const recogEntry = entries.find((e) => e.id === recogId);
  const ageCap = recogEntry?.eligibility.maxAgeYears ?? null;
  const tooOldForDpiit =
    ageCap != null && profile.companyAgeYears != null && profile.companyAgeYears > ageCap;
  if (!profile.dpiitRecognized && recogEntry && !tooOldForDpiit) {
    steps.push({
      title: "Get DPIIT recognition",
      detail:
        "Free official 'startup' status that unlocks tax breaks, seed funding and IPR rebates.",
      entryId: recogId,
      // Can't get recognised until incorporated, so it's gated for idea-stage.
      status: registered ? "now" : "locked",
    });
  }

  // 3. A funding or benefit step tuned to their goal. Prefer something they can
  //    act on now; fall back to a DPIIT-locked option framed honestly.
  if (profile.fundingNeed !== "none") {
    const now = topMatched("funding");
    const later = topLocked("funding");
    if (now) {
      steps.push({
        title: `Apply for funding: ${now.name}`,
        detail: now.oneLiner,
        entryId: now.id,
        status: "now",
      });
    } else if (later) {
      steps.push({
        title: `Line up funding: ${later.name}`,
        detail: `${later.oneLiner} Unlocks once you're DPIIT-recognised.`,
        entryId: later.id,
        status: "locked",
      });
    }
  } else {
    const benefit = topMatched("benefit") ?? topLocked("benefit");
    if (benefit) {
      steps.push({
        title: `Claim a quick win: ${benefit.name}`,
        detail: benefit.oneLiner,
        entryId: benefit.id,
        status:
          benefit.eligibility.dpiitRequired && !profile.dpiitRecognized ? "locked" : "now",
      });
    }
  }

  // 4. Stay compliant — only meaningful once they're actually operating.
  if (profile.stage === "operating") {
    const compliance = topMatched("compliance");
    if (compliance) {
      steps.push({
        title: `Stay compliant: ${compliance.name}`,
        detail: compliance.oneLiner,
        entryId: compliance.id,
        status: "now",
      });
    }
  }

  return steps;
}
