import type { Entry, Mentor, Persona } from "./types";
import schemesJson from "@/data/schemes.json";
import personasJson from "@/data/personas.json";
import mentorsJson from "@/data/mentors.json";

// JSON imports widen literals to `string`, so cast through unknown.
// scripts/validate-data.mjs checks the actual shapes at data level.
export const schemes = schemesJson as unknown as Entry[];
export const personas = personasJson as unknown as Persona[];
export const mentors = mentorsJson as unknown as Mentor[];
