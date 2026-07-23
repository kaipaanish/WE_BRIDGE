import type { Pitch, Role, SwipeState } from "./types";

// All v2 client state lives in localStorage (no backend — the mentor/founder
// "accounts" are simulated in one browser). Every accessor is SSR-safe.

const ROLE_KEY = "webridge-role";
const SWIPES_KEY = "webridge-swipes";
const PITCHES_KEY = "webridge-pitches";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode etc.) — state just won't persist
  }
}

// --- role ------------------------------------------------------------------
export function loadRole(): Role | null {
  const r = read<Role | null>(ROLE_KEY, null);
  return r === "founder" || r === "mentor" ? r : null;
}
export function saveRole(role: Role): void {
  write(ROLE_KEY, role);
}

// --- swipes ----------------------------------------------------------------
export function loadSwipes(): SwipeState {
  const s = read<SwipeState>(SWIPES_KEY, { liked: [], passed: [] });
  return {
    liked: Array.isArray(s.liked) ? s.liked : [],
    passed: Array.isArray(s.passed) ? s.passed : [],
  };
}
export function saveSwipes(state: SwipeState): void {
  write(SWIPES_KEY, state);
}
export function clearSwipes(): void {
  write(SWIPES_KEY, { liked: [], passed: [] });
}

// --- pitches (shared "inbox" between the founder and mentor views) ---------
export function loadPitches(): Pitch[] {
  const p = read<Pitch[]>(PITCHES_KEY, []);
  return Array.isArray(p) ? p : [];
}
export function savePitches(pitches: Pitch[]): void {
  write(PITCHES_KEY, pitches);
}
export function clearPitches(): void {
  write(PITCHES_KEY, []);
}
export function addPitch(pitch: Pitch): void {
  savePitches([pitch, ...loadPitches()]);
}
export function updatePitch(id: string, patch: Partial<Pitch>): void {
  savePitches(loadPitches().map((p) => (p.id === id ? { ...p, ...patch } : p)));
}
