"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Aurora from "@/components/Aurora";
import Brand from "@/components/Brand";
import ProgressDots from "@/components/ProgressDots";
import { personas, schemes } from "@/lib/data";
import { scoreEntries } from "@/lib/match";
import { saveProfile } from "@/lib/profile";
import { clearPitches, clearSwipes } from "@/lib/store";
import {
  FUNDING_LABELS,
  INDIAN_STATES,
  SECTOR_LABELS,
  STAGE_LABELS,
  type ExtractedProfile,
  type Persona,
  type ProfileField,
  type Sector,
  type Stage,
  type UserProfile,
} from "@/lib/types";

const TOTAL_STEPS = 6;

const QUESTIONS = [
  "Where is your startup today?",
  "Which sector are you in?",
  "Are you DPIIT recognised?",
  "Which state are you based in?",
  "What kind of funding are you looking for?",
  "What do you need most right now?",
];

const STAGE_HINTS: Record<Stage, string> = {
  idea: "No company registered yet — exploring what's possible.",
  registered: "Company or LLP is registered, product still getting ready.",
  operating: "Registered and already selling or serving users.",
};

const FIELD_LABELS: Record<ProfileField, string> = {
  stage: "Stage",
  sector: "Sector",
  dpiitRecognized: "DPIIT",
  state: "State",
  fundingNeed: "Funding",
};

const EXAMPLE =
  "two doctors in Hyderabad, we have an idea for an app to cut OPD queue times at clinics. Nothing registered yet and we're not sure about funding.";

function OptionButton({
  selected,
  onClick,
  label,
  hint,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border-2 px-5 py-4 text-left transition ${
        selected
          ? "border-coral bg-coral/10 shadow-soft"
          : "border-white/70 bg-white/80 backdrop-blur hover:border-coral/40 hover:shadow-soft"
      }`}
    >
      <span className="font-medium">{label}</span>
      {hint && <span className="mt-0.5 block text-sm text-ink/60">{hint}</span>}
    </button>
  );
}

function personaToProfile(p: Persona): UserProfile {
  return {
    stage: p.stage,
    sector: p.sector,
    dpiitRecognized: p.dpiitRecognized,
    state: p.state,
    fundingNeed: p.fundingNeed,
    // Carry the extras through so a demo persona's stated need enriches the
    // shortlist, the AI brief and the mentor matches (finish() normalises them).
    companyAgeYears: p.companyAgeYears ?? null,
    topNeed: p.topNeed,
  };
}

/** One editable row on the confirm card. */
function ConfirmRow({
  field,
  guessed,
  children,
}: {
  field: ProfileField;
  guessed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-navy/5 py-3 last:border-0">
      <span className="w-20 shrink-0 text-sm font-medium text-ink/60">
        {FIELD_LABELS[field]}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
          guessed ? "bg-gold/25 text-ink" : "bg-emerald-100 text-emerald-900"
        }`}
        title={
          guessed
            ? "You didn't mention this — we guessed. Change it if we got it wrong."
            : "Taken from your description."
        }
      >
        {guessed ? "~ guessed" : "✓ from text"}
      </span>
    </div>
  );
}

const selectClass =
  "w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-coral";

export default function OnboardingPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"describe" | "confirm" | "questions">(
    "describe",
  );

  // --- describe mode ---
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- confirm mode ---
  const [extracted, setExtracted] = useState<ExtractedProfile | null>(null);

  // --- questions mode ---
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Partial<UserProfile>>({});

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function finish(profile: UserProfile) {
    // Normalise at the save boundary so no contradictory profile is ever
    // stored: an idea-stage startup can't be DPIIT-recognised or have a company
    // age, and a blank/whitespace need should be dropped, not saved.
    const isIdea = profile.stage === "idea";
    const clean: UserProfile = {
      ...profile,
      dpiitRecognized: isIdea ? false : profile.dpiitRecognized,
      companyAgeYears: isIdea ? null : (profile.companyAgeYears ?? null),
      topNeed: profile.topNeed?.trim() || undefined,
    };
    saveProfile(clean);
    clearSwipes(); // fresh shortlist for a fresh profile
    clearPitches(); // and a clean mentor inbox — no stale pitches from a prior run
    router.push("/swipe");
  }

  async function describeSubmit() {
    const text = description.trim();
    if (text.length < 10 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/extract-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      setExtracted(data.profile);
      setMode("confirm");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  /** Editing a guessed field means it's now the founder's answer, not ours. */
  function editExtracted<K extends keyof UserProfile>(
    key: K,
    value: UserProfile[K],
  ) {
    setExtracted((p) =>
      p ? { ...p, [key]: value, guessed: p.guessed.filter((f) => f !== key) } : p,
    );
  }

  // ---------------------------------------------------------------- describe
  if (mode === "describe") {
    return (
      <main className="relative min-h-screen overflow-hidden px-6 py-10">
      <Aurora />
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <Link href="/">
            <Brand />
          </Link>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Tell us about your startup
            </h1>
            <p className="mt-2 text-ink/70">
              In your own words — an idea, a rough plan, whatever you have. No
              jargon needed.
            </p>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder={`e.g. ${EXAMPLE}`}
            className="w-full resize-none rounded-2xl border-2 border-white/70 bg-white/80 px-5 py-4 shadow-soft outline-none backdrop-blur focus:border-coral"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={describeSubmit}
              disabled={description.trim().length < 10 || loading}
              className="btn-gradient rounded-full px-8 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Reading…" : "Find my matches"}
            </button>
            {!description && (
              <button
                type="button"
                onClick={() => setDescription(EXAMPLE)}
                className="text-sm font-medium text-ink/50 underline hover:text-ink"
              >
                Use an example
              </button>
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 text-sm text-ink/40">
            <span className="h-px flex-1 bg-navy/10" />
            or
            <span className="h-px flex-1 bg-navy/10" />
          </div>

          <button
            type="button"
            onClick={() => setMode("questions")}
            className="rounded-2xl border-2 border-white/70 bg-white/80 px-5 py-4 text-left font-medium shadow-soft backdrop-blur transition hover:border-coral/40"
          >
            Answer a few quick questions instead
            <span className="mt-0.5 block text-sm font-normal text-ink/60">
              If you already know your stage, sector and DPIIT status.
            </span>
          </button>

          <div className="glass rounded-3xl border border-white/70 p-5 shadow-soft">
            <p className="text-sm font-medium text-ink/70">
              Or explore as a demo founder:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {personas.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => finish(personaToProfile(p))}
                  title={p.backstory}
                  className="rounded-full border border-navy/15 bg-white px-4 py-2 text-sm font-medium transition hover:border-coral hover:text-coral"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------------------- confirm
  if (mode === "confirm" && extracted) {
    const { guessed } = extracted;
    const isGuessed = (f: ProfileField) => guessed.includes(f);
    const matchCount = scoreEntries(extracted, schemes).matched.length;

    return (
      <main className="relative min-h-screen overflow-hidden px-6 py-10">
      <Aurora />
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <Link href="/">
            <Brand />
          </Link>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Here&apos;s what we understood
            </h1>
            <p className="mt-2 text-ink/70">
              {guessed.length === 0
                ? "All of this came from your description. Change anything that's off."
                : `We guessed ${guessed.length} thing${guessed.length === 1 ? "" : "s"} you didn't mention — worth a look before we match.`}
            </p>
          </div>

          <div className="glass rounded-3xl border border-white/70 p-5 shadow-soft">
            <ConfirmRow field="stage" guessed={isGuessed("stage")}>
              <select
                value={extracted.stage}
                onChange={(e) => editExtracted("stage", e.target.value as Stage)}
                className={selectClass}
              >
                {(Object.keys(STAGE_LABELS) as Stage[]).map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </ConfirmRow>

            <ConfirmRow field="sector" guessed={isGuessed("sector")}>
              <select
                value={extracted.sector}
                onChange={(e) =>
                  editExtracted("sector", e.target.value as Sector)
                }
                className={selectClass}
              >
                {(Object.keys(SECTOR_LABELS) as Sector[]).map((s) => (
                  <option key={s} value={s}>
                    {SECTOR_LABELS[s]}
                  </option>
                ))}
              </select>
            </ConfirmRow>

            <ConfirmRow
              field="dpiitRecognized"
              guessed={isGuessed("dpiitRecognized")}
            >
              <select
                value={extracted.dpiitRecognized ? "yes" : "no"}
                onChange={(e) =>
                  editExtracted("dpiitRecognized", e.target.value === "yes")
                }
                className={selectClass}
              >
                <option value="no">Not DPIIT recognised</option>
                <option value="yes">DPIIT recognised</option>
              </select>
            </ConfirmRow>

            <ConfirmRow field="state" guessed={isGuessed("state")}>
              <select
                value={extracted.state}
                onChange={(e) => editExtracted("state", e.target.value)}
                className={selectClass}
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </ConfirmRow>

            <ConfirmRow field="fundingNeed" guessed={isGuessed("fundingNeed")}>
              <select
                value={extracted.fundingNeed}
                onChange={(e) =>
                  editExtracted(
                    "fundingNeed",
                    e.target.value as UserProfile["fundingNeed"],
                  )
                }
                className={selectClass}
              >
                {(
                  Object.keys(FUNDING_LABELS) as UserProfile["fundingNeed"][]
                ).map((f) => (
                  <option key={f} value={f}>
                    {FUNDING_LABELS[f]}
                  </option>
                ))}
              </select>
            </ConfirmRow>

            {/* Extras — not part of the AI's guessed set, so no badge. */}
            <div className="flex items-center gap-3 border-t border-navy/5 pt-4">
              <span className="w-20 shrink-0 text-sm font-medium text-ink/60">
                Need
              </span>
              <input
                type="text"
                value={extracted.topNeed ?? ""}
                onChange={(e) =>
                  setExtracted((p) =>
                    p ? { ...p, topNeed: e.target.value } : p,
                  )
                }
                placeholder="What you need most right now (optional)"
                className={selectClass}
              />
            </div>

            {extracted.stage !== "idea" && (
              <div className="mt-3 flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm font-medium text-ink/60">
                  Age
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={extracted.companyAgeYears ?? ""}
                  onChange={(e) =>
                    setExtracted((p) =>
                      p
                        ? {
                            ...p,
                            companyAgeYears:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          }
                        : p,
                    )
                  }
                  placeholder="Years since incorporation"
                  className={selectClass}
                />
                <span className="shrink-0 text-sm text-ink/50">years</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              finish({
                stage: extracted.stage,
                sector: extracted.sector,
                dpiitRecognized: extracted.dpiitRecognized,
                state: extracted.state,
                fundingNeed: extracted.fundingNeed,
                companyAgeYears: extracted.companyAgeYears ?? null,
                topNeed: extracted.topNeed?.trim() || undefined,
              })
            }
            className="btn-gradient rounded-full px-8 py-4 text-lg font-semibold"
          >
            Show my {matchCount} match{matchCount === 1 ? "" : "es"}
          </button>

          <button
            type="button"
            onClick={() => {
              setExtracted(null);
              setMode("describe");
            }}
            className="text-sm font-medium text-ink/50 hover:text-ink"
          >
            ← Describe it differently
          </button>
        </div>
      </main>
    );
  }

  // --------------------------------------------------------------- questions
  const stepAnswered = [
    draft.stage !== undefined,
    draft.sector !== undefined,
    draft.dpiitRecognized !== undefined,
    Boolean(draft.state),
    draft.fundingNeed !== undefined,
    true, // step 6 is optional
  ][step];

  function next() {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      finish(draft as UserProfile);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10">
      <Aurora />
      <div className="mx-auto flex max-w-xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <Link href="/">
            <Brand />
          </Link>
          <ProgressDots total={TOTAL_STEPS} current={step} />
        </header>

        <div>
          <p className="text-sm font-medium text-coral">
            Question {step + 1} of {TOTAL_STEPS}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
            {QUESTIONS[step]}
          </h1>
        </div>

        {step === 0 && (
          <div className="space-y-3">
            {(Object.keys(STAGE_LABELS) as Stage[]).map((s) => (
              <OptionButton
                key={s}
                selected={draft.stage === s}
                onClick={() => set("stage", s)}
                label={STAGE_LABELS[s]}
                hint={STAGE_HINTS[s]}
              />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(SECTOR_LABELS) as Sector[]).map((s) => (
              <OptionButton
                key={s}
                selected={draft.sector === s}
                onClick={() => set("sector", s)}
                label={SECTOR_LABELS[s]}
              />
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <OptionButton
              selected={draft.dpiitRecognized === true}
              onClick={() => set("dpiitRecognized", true)}
              label="Yes, we're DPIIT recognised"
              hint="You have the Startup India recognition certificate."
            />
            <OptionButton
              selected={draft.dpiitRecognized === false}
              onClick={() => set("dpiitRecognized", false)}
              label="Not yet (or what's that?)"
              hint="No problem — we'll show you what unlocks once you get it."
            />
          </div>
        )}

        {step === 3 && (
          <select
            value={draft.state ?? ""}
            onChange={(e) => set("state", e.target.value)}
            className="w-full rounded-2xl border-2 border-navy/10 bg-white px-5 py-4 font-medium outline-none focus:border-coral"
          >
            <option value="" disabled>
              Select your state…
            </option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}

        {step === 4 && (
          <div className="space-y-3">
            {(Object.keys(FUNDING_LABELS) as UserProfile["fundingNeed"][]).map(
              (f) => (
                <OptionButton
                  key={f}
                  selected={draft.fundingNeed === f}
                  onClick={() => set("fundingNeed", f)}
                  label={FUNDING_LABELS[f]}
                />
              ),
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="-mt-4 text-sm text-ink/60">
              Optional — helps us tailor what we show first. Skip if you like.
            </p>
            <textarea
              value={draft.topNeed ?? ""}
              onChange={(e) => set("topNeed", e.target.value)}
              rows={3}
              placeholder="e.g. money to build a prototype, and help getting the legal setup right"
              className="w-full resize-none rounded-2xl border-2 border-navy/10 bg-white px-5 py-4 outline-none focus:border-coral"
            />
            {draft.stage !== undefined && draft.stage !== "idea" && (
              <label className="flex items-center gap-3 text-sm">
                <span className="font-medium text-ink/70">
                  Years since incorporation
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.companyAgeYears ?? ""}
                  onChange={(e) =>
                    set(
                      "companyAgeYears",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  placeholder="e.g. 2"
                  className="w-24 rounded-lg border border-navy/15 bg-white px-3 py-2 outline-none focus:border-coral"
                />
              </label>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => (step === 0 ? setMode("describe") : setStep(step - 1))}
            className="rounded-full px-5 py-3 text-sm font-medium text-ink/60 hover:text-ink"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!stepAnswered}
            className="rounded-full bg-coral px-8 py-3 font-semibold text-white shadow-md shadow-coral/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === TOTAL_STEPS - 1 ? "See my matches" : "Next"}
          </button>
        </div>
      </div>
    </main>
  );
}
