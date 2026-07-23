import type { Entry, Mentor, ScoredMentor, UserProfile } from "./types";
import { SECTOR_LABELS } from "./types";

// Ranks the demo mentors against a founder's profile AND the schemes they
// swiped right on. Deterministic (no Date/Math.random) so the order is stable.

export function scoreMentors(
  profile: UserProfile,
  likedEntries: Entry[],
  mentors: Mentor[],
): ScoredMentor[] {
  // Which scheme areas the founder showed interest in by swiping right.
  const likedAreas = new Set(likedEntries.map((e) => e.category));

  const scored = mentors.map((mentor): ScoredMentor => {
    let score = 0;
    const reasons: string[] = [];

    // Sector fit.
    if (mentor.sectors.includes(profile.sector)) {
      score += 4;
      reasons.push(`Knows ${SECTOR_LABELS[profile.sector]}`);
    } else if (mentor.sectors.includes("any")) {
      score += 1;
    }

    // Stage fit.
    if (mentor.stages.includes(profile.stage)) {
      score += 3;
      reasons.push("Works with your stage");
    }

    // Funding-need fit.
    if (mentor.fundingFocus.includes(profile.fundingNeed)) {
      score += 3;
      if (profile.fundingNeed !== "none") reasons.push("Matches your funding goal");
    }

    // Overlap with the areas they saved schemes in.
    const areaOverlap = mentor.helpsWith.filter((a) => likedAreas.has(a));
    if (areaOverlap.length > 0) {
      score += Math.min(areaOverlap.length * 2, 6);
      reasons.push(`Helps with ${areaOverlap.slice(0, 2).join(" & ")}`);
    }

    // A DPIIT-focused mentor is especially relevant if the founder isn't
    // recognised yet (their saved list will have locked items).
    if (
      !profile.dpiitRecognized &&
      mentor.helpsWith.includes("recognition")
    ) {
      score += 2;
      reasons.push("Can get you DPIIT-recognised");
    }

    return { mentor, score, reasons };
  });

  return scored.sort(
    (a, b) => b.score - a.score || a.mentor.name.localeCompare(b.mentor.name),
  );
}
