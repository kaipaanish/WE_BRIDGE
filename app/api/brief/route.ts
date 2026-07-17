import { ThinkingLevel } from "@google/genai";
import { NextResponse } from "next/server";
import { schemes } from "@/lib/data";
import {
  GEMINI_MODEL,
  generateWithRetry,
  geminiErrorResponse,
  getGeminiClient,
} from "@/lib/gemini";
import { scoreEntries } from "@/lib/match";
import { buildPlan } from "@/lib/plan";
import {
  FUNDING_LABELS,
  SECTOR_LABELS,
  STAGE_LABELS,
  type UserProfile,
} from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT =
  "You are WeBridge, the guide for early-stage Indian founders. " +
  "Write a warm, plain-language brief of AT MOST 3 short sentences (under 60 words total). " +
  "Sentence 1: reflect their situation back (stage, sector, state, DPIIT status). " +
  "Then name the 1-2 concrete things to do first, using ONLY scheme names from the MATCHES/PLAN given. " +
  "Never invent a scheme, number, deadline or rule. No markdown, no bullet points, no links — just plain sentences. " +
  "Address the founder as 'you'.";

// Feature is optional — if no key is set we return 204 and the dashboard simply
// omits the brief (the deterministic plan still guides the founder).
export async function POST(req: Request) {
  let body: { profile?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Validate every field before it reaches scoring/prompting. The client always
  // sends a full profile, but this route is publicly POST-able — an unchecked
  // profile.state would crash scoring (state.toLowerCase()), and unchecked enums
  // would leak the literal "undefined" into the prompt.
  const raw = body.profile as Partial<UserProfile> | null;
  const valid =
    !!raw &&
    typeof raw.stage === "string" &&
    Object.keys(STAGE_LABELS).includes(raw.stage) &&
    typeof raw.sector === "string" &&
    Object.keys(SECTOR_LABELS).includes(raw.sector) &&
    typeof raw.dpiitRecognized === "boolean" &&
    typeof raw.state === "string" &&
    raw.state.length > 0 &&
    typeof raw.fundingNeed === "string" &&
    Object.keys(FUNDING_LABELS).includes(raw.fundingNeed);
  if (!valid) {
    return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
  }

  // `valid` above guarantees each field is present and in-range; TS can't track
  // that through a separate boolean, so assert what we've already checked.
  const profile: UserProfile = {
    stage: raw.stage!,
    sector: raw.sector!,
    dpiitRecognized: raw.dpiitRecognized!,
    state: raw.state!,
    fundingNeed: raw.fundingNeed!,
    companyAgeYears:
      typeof raw.companyAgeYears === "number" ? raw.companyAgeYears : null,
    // Bound and sanitize the one free-text field before it enters the prompt.
    topNeed:
      typeof raw.topNeed === "string" ? raw.topNeed.trim().slice(0, 140) : undefined,
  };

  const ai = getGeminiClient();
  if (!ai) return new NextResponse(null, { status: 204 });

  const { matched } = scoreEntries(profile, schemes);
  const plan = buildPlan(profile, schemes);

  const matchLines = matched
    .slice(0, 6)
    .map((s) => `- ${s.entry.name}: ${s.entry.oneLiner}`)
    .join("\n");
  const planLines = plan.map((p, i) => `${i + 1}. ${p.title}`).join("\n");

  const profileText =
    `Stage: ${STAGE_LABELS[profile.stage]}. Sector: ${SECTOR_LABELS[profile.sector]}. ` +
    `State: ${profile.state}. DPIIT recognised: ${profile.dpiitRecognized ? "yes" : "no"}. ` +
    `Funding need: ${FUNDING_LABELS[profile.fundingNeed]}.` +
    (profile.topNeed ? ` In their words, they need: "${profile.topNeed}".` : "");

  const userTurn =
    `PROFILE: ${profileText}\n\n` +
    `TOP MATCHES:\n${matchLines || "(none)"}\n\n` +
    `SUGGESTED PLAN:\n${planLines || "(none)"}`;

  try {
    const response = await generateWithRetry(ai, {
      model: GEMINI_MODEL,
      contents: userTurn,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        maxOutputTokens: 1024,
      },
    });

    const brief = response.text?.trim();
    if (!brief) return new NextResponse(null, { status: 204 });
    return NextResponse.json({ brief });
  } catch (error) {
    return geminiErrorResponse(error);
  }
}
