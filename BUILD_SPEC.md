# Startup Navigator — Build Spec (A to Z)

You are an AI coding agent. Build the app described below **in the phase order given**. Each phase must run and be visibly working before you move to the next. Keep the code simple and readable — this is a hackathon MVP, not production.

---

## 1. What we're building

A single-window web app that helps early-stage Indian founders find, understand, and act on the startup schemes and support relevant to them. A user answers a few questions, gets a **personalized shortlist** of schemes/benefits/funding/incubators/competitions/compliance items, can open any item to see a **plain-language explanation + steps to apply**, and can **ask an AI assistant** questions that are answered only from our curated data.

Core loop: **profile → match → simplify → act.**

---

## 2. Tech stack (use exactly this)

- **Next.js (App Router) + TypeScript** — one project for both the UI and the AI proxy.
- **Tailwind CSS** for styling.
- **No database.** All content lives in a single bundled JSON file (`/data/schemes.json`).
- **User profile** persisted in `localStorage` (no auth for MVP).
- **AI navigator** via the Anthropic Messages API, called from a **server-side Next.js route handler** so the API key is never exposed to the browser.

Reasons: Next.js gives us server routes for the AI call in the same repo, and it deploys to Vercel in one click for the demo.

---

## 3. Data model

Two shapes. Keep them identical to this — the rest of the app depends on it.

### Scheme entry

```ts
type Category =
  | "recognition" | "benefit" | "funding"
  | "incubator" | "competition" | "process" | "compliance";

type Stage = "idea" | "registered" | "operating";
type Sector = "fintech" | "healthtech" | "edtech" | "agritech"
  | "consumer" | "deeptech" | "other";

interface Entry {
  id: string;
  category: Category;
  name: string;
  oneLiner: string;              // one-sentence hook
  summary: string;              // 2-3 plain-language sentences, no jargon
  eligibility: {
    stage: Stage[];             // which stages qualify
    sector: (Sector | "any")[]; // ["any"] if open to all
    dpiitRequired: boolean;     // does it need DPIIT recognition?
    maxAgeYears: number | null; // company age cap, or null
    notes: string;
  };
  eligibilityPlain: string;     // the rule in one human sentence
  benefit: string;              // what you get
  howToApply: string[];         // ordered steps -> becomes a checklist
  documentsRequired: string[];
  deadline: string;             // "rolling" or a date/description
  officialUrl: string;          // MANDATORY source link
  sourceVerifiedDate: string | null; // null = not yet human-verified
  tags: string[];
}
```

### User profile (from onboarding)

```ts
interface UserProfile {
  stage: Stage;
  sector: Sector;
  dpiitRecognized: boolean;
  state: string;                // e.g. "Maharashtra"
  fundingNeed: "none" | "grant" | "seed" | "equity";
}
```

---

## 4. Repo structure

```
/app
  /page.tsx                 → Landing
  /onboarding/page.tsx      → Multi-step profile form
  /dashboard/page.tsx       → Personalized matches
  /scheme/[id]/page.tsx     → Detail view + AI panel
  /api/ask/route.ts         → Server-side Anthropic proxy
/components
  SchemeCard.tsx
  StepChecklist.tsx
  AskAssistant.tsx          → chat UI
  ProgressDots.tsx
/data
  schemes.json              → the ~20 seed entries
  personas.json             → 3-4 demo businesses for testing
/lib
  types.ts                  → the interfaces above
  match.ts                  → matching logic
  profile.ts                → load/save profile in localStorage
```

---

## 5. Matching logic (`/lib/match.ts`)

The onboarding answers map 1:1 to eligibility fields, so matching is a plain filter — no AI needed for this part.

```ts
export function matchEntries(profile: UserProfile, entries: Entry[]): Entry[] {
  return entries.filter((e) => {
    const stageOk  = e.eligibility.stage.includes(profile.stage);
    const dpiitOk  = !e.eligibility.dpiitRequired || profile.dpiitRecognized;
    const sectorOk = e.eligibility.sector.includes("any")
                  || e.eligibility.sector.includes(profile.sector);
    return stageOk && dpiitOk && sectorOk;
  });
}
```

On the dashboard, group the matched entries by `category` and show each group under a heading. If an entry requires DPIIT and the user isn't recognised yet, still show it but flag it as "unlocks after DPIIT recognition."

---

## 6. The AI navigator (`/api/ask/route.ts`)

A POST endpoint that takes `{ question, profile }`, sends the whole `schemes.json` plus the profile to Claude, and returns a grounded answer.

- Call the Anthropic Messages API server-side. Read the key from `process.env.ANTHROPIC_API_KEY`.
- Use a current Claude model (e.g. `claude-sonnet-5` — confirm the latest string at docs.claude.com).
- **System prompt (use this):**

> You are the Startup Navigator assistant for early-stage Indian founders. Answer ONLY using the DATA provided below. If the answer is not in the DATA, say you don't have that information and point the user to the official Startup India portal — never invent a scheme, number, rule, or deadline. Keep answers short and in plain language a first-time founder can understand. Whenever you mention a scheme, include its official link from the DATA. Use the user's PROFILE to personalize which schemes you highlight.

- Append `DATA: <schemes.json>` and `PROFILE: <profile>` to the user turn.
- This grounding is the whole point: it keeps answers accurate, current, and source-backed instead of hallucinated.

`AskAssistant.tsx` is a simple chat box (input + message list) that POSTs to this route and renders the reply. Put it on the detail page and optionally as a floating button on the dashboard.

---

## 7. Screens

1. **Landing** — one-line value prop, a "Get started" button → onboarding. Keep it clean.
2. **Onboarding** — 5 questions, one per step, mapping exactly to `UserProfile` (stage, sector, DPIIT recognised?, state, funding need). Show progress dots. On finish, save profile to localStorage and go to dashboard.
3. **Dashboard** — greet by stage/sector, run `matchEntries`, show matches grouped by category as `SchemeCard`s. Each card: name, oneLiner, a category tag, and a "View" link. Show a count ("8 things you may qualify for").
4. **Detail view** (`/scheme/[id]`) — name, plain summary, `eligibilityPlain`, benefit, `StepChecklist` (tickable `howToApply` steps), documents, deadline (as a badge), and a prominent **official link** button. Below it, the `AskAssistant` panel pre-loaded with the user's profile.

---

## 8. Seed the data (this is part of the job)

Generate `/data/schemes.json` with **~20 realistic entries covering all seven categories** (at least 2 per category), following the `Entry` shape exactly. Include well-known real programs as starting points:

- **recognition:** DPIIT Startup Recognition; a state startup registration.
- **benefit:** Income Tax Holiday (Section 80-IAC); Angel Tax exemption; IPR/patent fee rebate.
- **funding:** Startup India Seed Fund Scheme (SISFS); Fund of Funds; Credit Guarantee Scheme (CGSS).
- **incubator:** an IIT/IIM incubator; T-Hub.
- **competition:** a national pitch challenge; a hackathon-style grant.
- **process:** how to incorporate a company; how to get DPIIT recognised; how to register for GST.
- **compliance:** annual MCA/ROC filings; GST returns; post-funding reporting.

**Integrity rule (important):** you are generating placeholders, not verified facts. For every entry, set `sourceVerifiedDate: null`, put the official URL in `officialUrl`, and append `" (VERIFY)"` to any specific figure, amount, age cap, or deadline you are not certain of. A human will confirm each against its source before the demo. Do not present unverified numbers as confirmed.

Also generate `/data/personas.json` with **3-4 demo businesses** in the `UserProfile` shape plus a one-line backstory each (e.g. a registered sustainable-sneaker startup in Maharashtra, not yet DPIIT-recognised, seeking seed funding) — these are for testing and the demo walkthrough.

---

## 9. Design direction

Clean, trustworthy, modern — it should feel like a product, not a government form.

- **Palette:** deep indigo `#191A47` (primary/dark surfaces), coral `#FF6A4D` (accent/CTAs), amber `#F4B740` (highlights), off-white `#F5F5FB` (page background), ink `#20223F` (text).
- **Cards** with soft shadows and rounded corners (`rounded-2xl`), generous spacing.
- Sans-serif, sentence case, no dense paragraphs. One clear action per screen.
- Category tags use small colored pills.

---

## 10. Build order (do in sequence, keep each runnable)

- **Phase 0** — Scaffold Next.js + TS + Tailwind. Set up the repo structure and `/lib/types.ts`.
- **Phase 1** — Create `schemes.json` (~20 entries) and `personas.json`. Verify they parse against the types.
- **Phase 2** — Onboarding flow → profile saved to localStorage.
- **Phase 3** — `matchEntries` + dashboard rendering grouped matches.
- **Phase 4** — Detail view with the tickable step checklist and official-link button.
- **Phase 5** — `/api/ask` route + `AskAssistant` chat UI, grounded in the data.
- **Phase 6** — Polish: styling pass, empty/loading states, deadline badges, "unlocks after DPIIT" flag.

---

## 11. Definition of done

- [ ] A new user can complete onboarding and land on a dashboard with a personalized, non-empty list.
- [ ] Changing profile answers visibly changes the matches.
- [ ] Every scheme opens to a detail view with summary, steps, deadline, and a working official link.
- [ ] The AI assistant answers questions using only the seed data and refuses to invent schemes; every scheme it names includes its official link.
- [ ] All ~20 entries exist across all 7 categories; every entry has an `officialUrl`; unverified figures are tagged `(VERIFY)` and `sourceVerifiedDate` is `null`.
- [ ] The app runs with `npm run dev` and only needs `ANTHROPIC_API_KEY` in `.env.local`.

---

## 12. Env & run

```
# .env.local
ANTHROPIC_API_KEY=your_key_here
```

```
npm install
npm run dev
```
