import { ApiError, GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Measured on our real ~33KB payload: flash-lite answers in ~2-8s and passed
// every grounding check, while gemini-3.5-flash took up to 26s and was
// intermittently 503-overloaded. See the AI model section of the README.
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";

/** Google's error envelope, JSON-encoded inside ApiError.message. */
type GoogleErrorBody = {
  code?: number;
  message?: string;
  status?: string;
  details?: Array<{ "@type"?: string; reason?: string }>;
};

/**
 * Prefer instanceof, but fall back to a structural check: the package ships
 * separate cjs/mjs builds, so a bundler can load two copies of the class and
 * break instanceof. `name` is hard-coded to "ApiError" in the constructor.
 */
export function isApiError(e: unknown): e is ApiError {
  return (
    e instanceof ApiError ||
    (e instanceof Error &&
      e.name === "ApiError" &&
      typeof (e as ApiError).status === "number")
  );
}

/** ApiError.message is JSON.stringify(errorBody), not prose. */
function parseErrorBody(e: ApiError): GoogleErrorBody | null {
  try {
    return JSON.parse(e.message)?.error ?? null;
  } catch {
    return null;
  }
}

/** Transport failures are never wrapped in ApiError — they arrive raw. */
function isNetworkError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  if (e.name === "AbortError" || e.name === "TimeoutError") return true;

  const CODES = new Set([
    "ENOTFOUND",
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    "EAI_AGAIN",
    "EPIPE",
    "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_SOCKET",
  ]);
  let cur: unknown = e;
  while (cur instanceof Error) {
    const code = (cur as Error & { code?: unknown }).code;
    if (typeof code === "string" && CODES.has(code)) return true;
    cur = (cur as Error & { cause?: unknown }).cause;
  }
  // undici surfaces transport failures as `TypeError: fetch failed`
  return e instanceof TypeError && /fetch failed/i.test(e.message);
}

/**
 * The SDK does not fail fast on a missing key — it would make a real round
 * trip and come back 403. Returns null so callers can give an actionable
 * message instead.
 */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export function missingKeyResponse() {
  return NextResponse.json(
    {
      error:
        "The AI navigator isn't configured yet — add GEMINI_API_KEY to .env.local and restart the dev server.",
    },
    { status: 500 },
  );
}

/**
 * 503 UNAVAILABLE ("model is experiencing high demand") is transient and hit
 * us repeatedly while testing, so retry it once. Deliberately does NOT retry
 * 429 — retrying a rate limit only makes it worse.
 */
export async function generateWithRetry(
  ai: GoogleGenAI,
  params: Parameters<GoogleGenAI["models"]["generateContent"]>[0],
) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (e) {
      if (!isApiError(e) || e.status !== 503 || attempt >= 1) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

/** Maps any thrown Gemini error to a founder-friendly JSON response. */
export function geminiErrorResponse(error: unknown) {
  if (isApiError(error)) {
    const errBody = parseErrorBody(error);
    const reason = errBody?.details?.find((d) => d?.reason)?.reason;

    if (error.status === 429 || errBody?.status === "RESOURCE_EXHAUSTED") {
      return NextResponse.json(
        {
          error:
            "Gemini's rate limit is hit — wait a minute and try again. (Free tier limits are per-minute and per-day.)",
        },
        { status: 429 },
      );
    }

    // Already retried once; if it's still overloaded, say so plainly rather
    // than blaming the user's setup.
    if (error.status === 503 || errBody?.status === "UNAVAILABLE") {
      return NextResponse.json(
        { error: "Gemini is busy right now — give it a few seconds and try again." },
        { status: 503 },
      );
    }

    // An invalid key returns 400, not 401 — but a plain 400 is also
    // "malformed request", so the reason check is what makes this correct.
    const isAuth =
      error.status === 401 ||
      error.status === 403 ||
      (error.status === 400 &&
        (reason === "API_KEY_INVALID" ||
          /API key not valid|API key expired/i.test(errBody?.message ?? "")));

    if (isAuth) {
      console.error("Gemini auth failure:", error.status, errBody?.message);
      return NextResponse.json(
        { error: "The GEMINI_API_KEY in .env.local looks invalid." },
        { status: 500 },
      );
    }

    console.error("Gemini API error:", error.status, error.message);
    return NextResponse.json(
      { error: "The AI service returned an error — please try again." },
      { status: 502 },
    );
  }

  if (isNetworkError(error)) {
    return NextResponse.json(
      { error: "Couldn't reach the AI service — check your connection." },
      { status: 502 },
    );
  }

  console.error("Unexpected Gemini error:", error);
  return NextResponse.json(
    { error: "Something went wrong — please try again." },
    { status: 500 },
  );
}
