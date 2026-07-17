import { ThinkingLevel, Type } from "@google/genai";
import { NextResponse } from "next/server";
import {
  GEMINI_MODEL,
  generateWithRetry,
  geminiErrorResponse,
  getGeminiClient,
  missingKeyResponse,
} from "@/lib/gemini";
import {
  FUNDING_LABELS,
  INDIAN_STATES,
  PROFILE_FIELDS,
  SECTOR_LABELS,
  STAGE_LABELS,
  type ExtractedProfile,
} from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You turn an Indian founder's free-text description of their startup into a structured profile.

Rules:
- Infer each field ONLY from what the description says or clearly implies.
- If the description does not give you a field, choose the most likely default AND list that field name in "guessed".
- "guessed" must list every field you were not reasonably confident about. Be honest — an unflagged wrong guess is worse than an admitted one. If the description is vague, most fields belong in "guessed".
- stage: "idea" = no company registered yet. "registered" = company/LLP exists but not really selling yet. "operating" = registered AND already selling or serving users.
- dpiitRecognized: only true if they say they have DPIIT / Startup India recognition. Assume false otherwise (and mark it guessed if unstated).
- state: the Indian state they are based in. Infer from a city if given (e.g. Mumbai -> Maharashtra, Bengaluru -> Karnataka, Hyderabad -> Telangana, Gurgaon -> Haryana, Noida -> Uttar Pradesh). Do NOT mark it guessed if you inferred it confidently from a named city. If they say they operate pan-India / nationwide / all over India, or aren't tied to any one state, use "All India" (do not mark it guessed — that's their stated answer). If there's no location signal at all, use "All India" and mark it guessed.
- fundingNeed: "none" if they aren't looking for money, "grant" for non-dilutive/grant money, "seed" for early cheques, "equity" for a proper VC round. If unstated, use "none" and mark it guessed.
- sector: pick the closest. Use "other" if genuinely none fit.
- companyAgeYears: whole number of years since the company was incorporated. Use 0 if they aren't registered yet or don't say. Never guess a non-zero number.
- topNeed: a short phrase (max 12 words) capturing what they most want or need right now, in their own words (e.g. "money to build a prototype", "help with legal setup"). Empty string if they didn't say.`;

const PROFILE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    stage: {
      type: Type.STRING,
      format: "enum",
      enum: Object.keys(STAGE_LABELS),
      description: "How far along the startup is.",
    },
    sector: {
      type: Type.STRING,
      format: "enum",
      enum: Object.keys(SECTOR_LABELS),
      description: "The startup's sector.",
    },
    dpiitRecognized: {
      type: Type.BOOLEAN,
      description: "Whether they already hold DPIIT / Startup India recognition.",
    },
    state: {
      type: Type.STRING,
      format: "enum",
      enum: INDIAN_STATES,
      description: "The Indian state they are based in.",
    },
    fundingNeed: {
      type: Type.STRING,
      format: "enum",
      enum: Object.keys(FUNDING_LABELS),
      description: "What kind of funding, if any, they are looking for.",
    },
    companyAgeYears: {
      type: Type.INTEGER,
      description: "Years since incorporation; 0 if not registered or unstated.",
    },
    topNeed: {
      type: Type.STRING,
      description: "Short phrase for what they need most right now; empty if unsaid.",
    },
    guessed: {
      type: Type.ARRAY,
      description:
        "Names of the fields you guessed rather than took from the description.",
      items: {
        type: Type.STRING,
        format: "enum",
        enum: PROFILE_FIELDS,
      },
    },
  },
  required: [
    "stage",
    "sector",
    "dpiitRecognized",
    "state",
    "fundingNeed",
    "companyAgeYears",
    "topNeed",
    "guessed",
  ],
};

export async function POST(req: Request) {
  let body: { description?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  if (description.length < 10) {
    return NextResponse.json(
      { error: "Tell us a bit more about your startup first." },
      { status: 400 },
    );
  }

  const ai = getGeminiClient();
  if (!ai) return missingKeyResponse();

  try {
    const response = await generateWithRetry(ai, {
      model: GEMINI_MODEL,
      contents: `Founder's description of their startup:\n\n${description}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        maxOutputTokens: 4096,
        // Forces a response matching PROFILE_SCHEMA, so there is no prose to
        // parse out and no chance of an out-of-range enum value.
        responseMimeType: "application/json",
        responseSchema: PROFILE_SCHEMA,
      },
    });

    const raw = response.text;
    if (!raw) {
      return NextResponse.json(
        { error: "Couldn't read that — try describing your startup again." },
        { status: 502 },
      );
    }

    let parsed: ExtractedProfile;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("extract-profile: non-JSON response despite schema:", raw);
      return NextResponse.json(
        { error: "Couldn't read that — try describing your startup again." },
        { status: 502 },
      );
    }

    // The schema constrains the model, but this endpoint feeds matchEntries()
    // directly — validate rather than trust.
    const valid =
      Object.keys(STAGE_LABELS).includes(parsed.stage) &&
      Object.keys(SECTOR_LABELS).includes(parsed.sector) &&
      typeof parsed.dpiitRecognized === "boolean" &&
      INDIAN_STATES.includes(parsed.state) &&
      Object.keys(FUNDING_LABELS).includes(parsed.fundingNeed);

    if (!valid) {
      console.error("extract-profile: schema-valid but out-of-range:", parsed);
      return NextResponse.json(
        { error: "Couldn't read that — try describing your startup again." },
        { status: 502 },
      );
    }

    const guessed = Array.isArray(parsed.guessed)
      ? parsed.guessed.filter((f) => PROFILE_FIELDS.includes(f))
      : [];

    // Age only means something once registered; treat 0/idea/garbage as null.
    const rawAge = Number(parsed.companyAgeYears);
    const companyAgeYears =
      parsed.stage !== "idea" && Number.isFinite(rawAge) && rawAge > 0
        ? Math.min(Math.round(rawAge), 100)
        : null;

    const topNeed =
      typeof parsed.topNeed === "string" ? parsed.topNeed.trim().slice(0, 140) : "";

    return NextResponse.json({
      profile: {
        stage: parsed.stage,
        sector: parsed.sector,
        dpiitRecognized: parsed.dpiitRecognized,
        state: parsed.state,
        fundingNeed: parsed.fundingNeed,
        companyAgeYears,
        topNeed,
        guessed,
      } satisfies ExtractedProfile,
    });
  } catch (error) {
    return geminiErrorResponse(error);
  }
}
