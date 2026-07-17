// Validates data/schemes.json and data/personas.json against the shapes in lib/types.ts.
import { readFileSync } from "node:fs";

const schemes = JSON.parse(
  readFileSync(new URL("../data/schemes.json", import.meta.url), "utf8"),
);
const personas = JSON.parse(
  readFileSync(new URL("../data/personas.json", import.meta.url), "utf8"),
);

const CATEGORIES = [
  "recognition",
  "benefit",
  "funding",
  "incubator",
  "competition",
  "process",
  "compliance",
];
const STAGES = ["idea", "registered", "operating"];
const SECTORS = [
  "fintech",
  "healthtech",
  "edtech",
  "agritech",
  "consumer",
  "deeptech",
  "other",
];
const FUNDING = ["none", "grant", "seed", "equity"];

const errors = [];
const err = (msg) => errors.push(msg);

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const isStringArray = (v) =>
  Array.isArray(v) && v.length > 0 && v.every(isNonEmptyString);

// --- schemes.json ---
const seenIds = new Set();
for (const e of schemes) {
  const id = e.id ?? "<missing id>";
  if (!isNonEmptyString(e.id)) err(`entry ${id}: bad id`);
  if (seenIds.has(e.id)) err(`entry ${id}: duplicate id`);
  seenIds.add(e.id);

  if (!CATEGORIES.includes(e.category)) err(`${id}: bad category "${e.category}"`);
  for (const field of ["name", "oneLiner", "summary", "eligibilityPlain", "benefit", "deadline"]) {
    if (!isNonEmptyString(e[field])) err(`${id}: missing/empty ${field}`);
  }
  if (!isNonEmptyString(e.officialUrl) || !e.officialUrl.startsWith("http"))
    err(`${id}: officialUrl must be a URL`);
  if (e.sourceVerifiedDate !== null && !isNonEmptyString(e.sourceVerifiedDate))
    err(`${id}: sourceVerifiedDate must be string or null`);
  if (!isStringArray(e.howToApply)) err(`${id}: howToApply must be non-empty string[]`);
  if (!isStringArray(e.documentsRequired)) err(`${id}: documentsRequired must be non-empty string[]`);
  if (!isStringArray(e.tags)) err(`${id}: tags must be non-empty string[]`);

  const el = e.eligibility;
  if (!el || typeof el !== "object") {
    err(`${id}: missing eligibility`);
    continue;
  }
  if (!Array.isArray(el.stage) || el.stage.length === 0 || !el.stage.every((s) => STAGES.includes(s)))
    err(`${id}: eligibility.stage invalid`);
  if (
    !Array.isArray(el.sector) ||
    el.sector.length === 0 ||
    !el.sector.every((s) => s === "any" || SECTORS.includes(s))
  )
    err(`${id}: eligibility.sector invalid`);
  if (typeof el.dpiitRequired !== "boolean") err(`${id}: eligibility.dpiitRequired must be boolean`);
  if (el.maxAgeYears !== null && typeof el.maxAgeYears !== "number")
    err(`${id}: eligibility.maxAgeYears must be number or null`);
  if (el.state !== undefined && !isNonEmptyString(el.state))
    err(`${id}: eligibility.state must be a non-empty string when present`);
  if (typeof el.notes !== "string") err(`${id}: eligibility.notes must be a string`);
}

// category coverage: at least 2 per category
const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
for (const e of schemes) if (counts[e.category] !== undefined) counts[e.category]++;
for (const [c, n] of Object.entries(counts)) {
  if (n < 2) err(`category "${c}" has only ${n} entries (need >= 2)`);
}

// --- personas.json ---
for (const p of personas) {
  const name = p.name ?? "<missing name>";
  if (!isNonEmptyString(p.name)) err(`persona ${name}: bad name`);
  if (!isNonEmptyString(p.backstory)) err(`persona ${name}: missing backstory`);
  if (!STAGES.includes(p.stage)) err(`persona ${name}: bad stage`);
  if (!SECTORS.includes(p.sector)) err(`persona ${name}: bad sector`);
  if (typeof p.dpiitRecognized !== "boolean") err(`persona ${name}: bad dpiitRecognized`);
  if (!isNonEmptyString(p.state)) err(`persona ${name}: bad state`);
  if (!FUNDING.includes(p.fundingNeed)) err(`persona ${name}: bad fundingNeed`);
}
if (personas.length < 3 || personas.length > 4)
  err(`expected 3-4 personas, found ${personas.length}`);

// --- report ---
if (errors.length > 0) {
  console.error(`✗ ${errors.length} data problem(s):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

console.log(`✓ schemes.json: ${schemes.length} entries, all fields valid`);
console.log(
  "✓ per category: " +
    Object.entries(counts)
      .map(([c, n]) => `${c}=${n}`)
      .join(", "),
);
console.log(`✓ personas.json: ${personas.length} personas valid`);
