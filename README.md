# 🧭 Startup Navigator

A single-window web app that helps early-stage Indian founders find, understand and act on the startup schemes, funding, incubators, competitions and compliance relevant to them.

**Core loop:** profile → match → simplify → act.

Built per [BUILD_SPEC.md](./BUILD_SPEC.md) with Next.js (App Router) + TypeScript + Tailwind CSS. No database — all content lives in `data/schemes.json`; the user profile is stored in `localStorage`.

> **Deviation from the spec:** §2, §6 and §11 of BUILD_SPEC.md specify the Anthropic Messages API for the AI navigator. This build uses **Google Gemini** instead (`@google/genai`), for the free tier. Nothing else about the architecture changed — the AI call is still a server-side route handler at `app/api/ask/route.ts` so the key is never exposed to the browser.

## Run it

Requires **Node.js 20 or newer** (the Gemini SDK sets `engines: node >= 20`).

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

### AI navigator (optional but recommended)

The "Ask AI" assistant needs a Gemini API key — free, no credit card.

1. Go to **https://aistudio.google.com/apikey** and sign in with a Google account.
2. Click **Create API key** (new users often find one already created).
3. Copy it and put it in `.env.local`:

```bash
# .env.local
GEMINI_API_KEY=your_key_here
```

4. **Restart the dev server** — env vars are only read at startup.

Everything else (matching, dashboard, checklists) works without the key.

**Gotchas:**
- New keys start with `AQ.`, not the older `AIza` format. That's expected, not a restricted account.
- If you also have `GOOGLE_API_KEY` set in your environment, **it takes precedence** over `GEMINI_API_KEY` and will silently override it.
- Free-tier rate limits are per-minute and per-day. Check live limits in AI Studio.

## Onboarding: two ways in

1. **Describe your startup in free text** (default). `/api/extract-profile` asks Gemini to turn the description into a `UserProfile`, and returns which fields it had to **guess** because you didn't mention them. A confirm card shows the result with `✓ from text` / `~ guessed` badges and lets you fix any row before matching runs.
2. **Answer 5 questions** — the original flow, kept as a fallback for founders who already know their answers.

**The AI never decides which schemes you qualify for.** It only fills in the profile; `matchEntries()` (spec §5) is still a plain deterministic filter over that profile. This keeps matches auditable and impossible to hallucinate — the worst an extraction error can do is fill a field wrong, which the confirm card lets you catch.

The extraction uses Gemini's `responseSchema`, with `state` constrained to the real `INDIAN_STATES` list, so the model cannot return a value the UI has no option for. The route re-validates every field server-side anyway before it reaches `matchEntries()`.

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build + type check — **stop the dev server first** (see below) |
| `npm run validate-data` | Validate `data/schemes.json` and `data/personas.json` against the data shapes |

> ⚠️ **Don't run `npm run build` while `npm run dev` is running.** They share the `.next/` directory, so a build corrupts the state of the live dev server. Symptoms are confusing and look like app bugs: `ENOENT ... vendor-chunks/*.js`, `missing required error components, refreshing...`, or blank 500s. Fix: stop everything, `rm -rf .next`, restart. Only one dev server at a time, too — a second one silently falls back to port 3001 and you end up looking at the wrong app.

## AI model

`app/api/ask/route.ts` sends the whole of `data/schemes.json` plus the user's profile on every request, so answers stay grounded in curated data instead of the model's own knowledge.

**Model: `gemini-3.1-flash-lite`**, chosen by measuring candidates against the real ~33KB payload:

| model | latency | grounding | notes |
| --- | --- | --- | --- |
| `gemini-3.1-flash-lite` | **~2-8s** | 4/4 tests passed, 0 invented links | **shipped** |
| `gemini-3.5-flash` | ~5-26s | passed | too slow; intermittently 503-overloaded |
| `gemini-2.5-flash` | ~11s | — | truncated: ignores `thinkingLevel`, thinking ate the token budget |

Override with `GEMINI_MODEL` in `.env.local` if needed.

Two non-obvious settings, both load-bearing:

- **`thinkingLevel: LOW`** — these models default to `HIGH`. Grounded lookup over a small JSON payload doesn't need deep reasoning, and this is most of the latency win.
- **`maxOutputTokens: 8192`** — deliberately generous. Thinking tokens are billed against this *same* budget, so a tight cap gets spent mid-thought and returns an **empty answer with no error** (`finish=MAX_TOKENS`). This was observed, not theorised. Typical runs use ~2k.

503 (`"model is experiencing high demand"`) is transient and is retried once automatically.

## Data integrity

Seed entries are curated placeholders, not verified facts: every entry has `sourceVerifiedDate: null` and unconfirmed figures are tagged `(VERIFY)`. Confirm each entry against its `officialUrl` before the demo, then set `sourceVerifiedDate`.

## Demo personas

`data/personas.json` has four demo founders (Kicks Reborn, AgriSense, MediQueue, LearnLoop). On the first onboarding step you can tap one to fill the profile instantly.
