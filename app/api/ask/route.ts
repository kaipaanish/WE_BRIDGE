import { ThinkingLevel } from "@google/genai";
import { NextResponse } from "next/server";
import { schemes } from "@/lib/data";
import {
  GEMINI_MODEL,
  generateWithRetry,
  geminiErrorResponse,
  getGeminiClient,
  missingKeyResponse,
} from "@/lib/gemini";

// The SDK targets Node >= 20 and is not tested on the edge runtime.
export const runtime = "nodejs";

const SYSTEM_PROMPT =
  "You are WeBridge, the assistant for early-stage Indian founders. " +
  "Answer ONLY using the DATA provided below. If the answer is not in the DATA, " +
  "say you don't have that information and point the user to the official Startup India portal — " +
  "never invent a scheme, number, rule, or deadline. " +
  "Keep answers short and in plain language a first-time founder can understand. " +
  "Whenever you mention a scheme, include its official link from the DATA. " +
  "Use the user's PROFILE to personalize which schemes you highlight.";

export async function POST(req: Request) {
  let body: { question?: unknown; profile?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json(
      { error: "Please type a question first." },
      { status: 400 },
    );
  }

  const ai = getGeminiClient();
  if (!ai) return missingKeyResponse();

  // Ground the model in our curated data + the user's profile (per spec §6).
  const userTurn =
    `${question}\n\n` +
    `DATA: ${JSON.stringify(schemes)}\n\n` +
    `PROFILE: ${body.profile ? JSON.stringify(body.profile) : "not provided"}`;

  try {
    const response = await generateWithRetry(ai, {
      model: GEMINI_MODEL,
      contents: userTurn,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        // This is a thinking model and defaults to HIGH. Grounded lookup over
        // a small JSON payload doesn't need deep reasoning, and thinking
        // tokens share the maxOutputTokens budget below.
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        // Generous on purpose: thinking is billed against this same budget, so
        // a tight cap gets spent mid-thought and returns an empty answer with
        // finish=MAX_TOKENS and no error. Measured runs use ~2k of this.
        maxOutputTokens: 8192,
      },
    });

    // `text` is a getter typed `string | undefined` — it is legitimately
    // undefined when generation stops early (safety, or budget exhausted
    // mid-thought), so this is a real case, not defensive noise.
    const answer = response.text;
    if (!answer) {
      return NextResponse.json(
        { error: "The assistant returned no answer — please try again." },
        { status: 502 },
      );
    }
    return NextResponse.json({ answer });
  } catch (error) {
    return geminiErrorResponse(error);
  }
}
