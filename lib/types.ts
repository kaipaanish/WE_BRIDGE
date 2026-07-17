export type Category =
  | "recognition"
  | "benefit"
  | "funding"
  | "incubator"
  | "competition"
  | "process"
  | "compliance";

export type Stage = "idea" | "registered" | "operating";

export type Sector =
  | "fintech"
  | "healthtech"
  | "edtech"
  | "agritech"
  | "consumer"
  | "deeptech"
  | "other";

export interface Entry {
  id: string;
  category: Category;
  name: string;
  oneLiner: string; // one-sentence hook
  summary: string; // 2-3 plain-language sentences, no jargon
  eligibility: {
    stage: Stage[]; // which stages qualify
    sector: (Sector | "any")[]; // ["any"] if open to all
    dpiitRequired: boolean; // does it need DPIIT recognition?
    maxAgeYears: number | null; // company age cap, or null
    // A state this scheme is genuinely restricted to (e.g. a state grant).
    // Omitted/undefined = available nationwide. NOT the same as being located
    // in a state — a national incubator that happens to sit in Mumbai has no
    // `state` restriction.
    state?: string;
    notes: string;
  };
  eligibilityPlain: string; // the rule in one human sentence
  benefit: string; // what you get
  howToApply: string[]; // ordered steps -> becomes a checklist
  documentsRequired: string[];
  deadline: string; // "rolling" or a date/description
  officialUrl: string; // MANDATORY source link
  sourceVerifiedDate: string | null; // null = not yet human-verified
  tags: string[];
}

export interface UserProfile {
  stage: Stage;
  sector: Sector;
  dpiitRecognized: boolean;
  state: string; // e.g. "Maharashtra"
  fundingNeed: "none" | "grant" | "seed" | "equity";
  // Optional, enriches personalization; older saved profiles won't have them.
  companyAgeYears?: number | null; // years since incorporation; null if idea/unknown
  topNeed?: string; // free-text: what the founder needs most right now
}

// Only the five core fields the onboarding dropdowns cover — these are what the
// AI extraction flags as "guessed". companyAgeYears/topNeed are extras.
export type ProfileField = "stage" | "sector" | "dpiitRecognized" | "state" | "fundingNeed";

export const PROFILE_FIELDS: ProfileField[] = [
  "stage",
  "sector",
  "dpiitRecognized",
  "state",
  "fundingNeed",
];

/** An entry plus why it matched this profile and how relevant it is. */
export interface ScoredEntry {
  entry: Entry;
  score: number;
  reasons: string[]; // "why this matches you" — most specific first
}

/** One step in the guided action plan. */
export interface PlanStep {
  title: string;
  detail: string;
  entryId: string | null; // links to /scheme/[id] when set
  status: "now" | "next" | "locked";
}

/**
 * A profile the AI derived from a free-text description, plus which fields it
 * had to guess because the description didn't say. Guessed fields are flagged
 * in the UI so the founder can correct them before matching runs.
 */
export interface ExtractedProfile extends UserProfile {
  guessed: ProfileField[];
}

export type Persona = UserProfile & {
  name: string;
  backstory: string;
};

export const CATEGORY_ORDER: Category[] = [
  "recognition",
  "benefit",
  "funding",
  "incubator",
  "competition",
  "process",
  "compliance",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  recognition: "Recognition",
  benefit: "Benefits",
  funding: "Funding",
  incubator: "Incubators",
  competition: "Competitions",
  process: "How-to guides",
  compliance: "Compliance",
};

export const STAGE_LABELS: Record<Stage, string> = {
  idea: "Just an idea",
  registered: "Registered company",
  operating: "Registered & operating",
};

export const SECTOR_LABELS: Record<Sector, string> = {
  fintech: "Fintech",
  healthtech: "Healthtech",
  edtech: "Edtech",
  agritech: "Agritech",
  consumer: "Consumer",
  deeptech: "Deeptech",
  other: "Other",
};

export const FUNDING_LABELS: Record<UserProfile["fundingNeed"], string> = {
  none: "Not right now",
  grant: "Grants (non-dilutive)",
  seed: "Seed funding",
  equity: "Equity / VC funding",
};

// "All India" is the broad default for founders who operate nationwide or
// aren't tied to one state; the individual states follow. This list drives the
// onboarding dropdowns AND the AI extraction enum, so an entry added here
// becomes selectable everywhere at once.
export const INDIAN_STATES: string[] = [
  "All India",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Other / Union Territory",
];
