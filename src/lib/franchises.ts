/**
 * Franchise ribbons on Radar / Release Timeline posters. Which films get one, and the
 * franchise they belong to, come from the Convex `franchises` catalog (see
 * `useFranchiseBadges`); this file only decides how a ribbon looks.
 */
import type { FranchiseBadgeTone } from "@/lib/franchiseSeed";

/** A franchise ribbon ready to render: its label and Tailwind colour classes. */
export interface FranchiseMetadata {
  id: number;
  name: string;
  color: string;
  borderColor: string;
}

interface ToneClasses {
  color: string;
  borderColor: string;
}

// Literal class strings so Tailwind keeps them in the build
const TONE_CLASSES: Record<FranchiseBadgeTone, ToneClasses> = {
  red: { color: "bg-red-600", borderColor: "border-red-800" },
  blue: { color: "bg-blue-600", borderColor: "border-blue-800" },
  cyan: { color: "bg-cyan-500", borderColor: "border-cyan-700" },
  orange: { color: "bg-orange-600", borderColor: "border-orange-800" },
  yellow: { color: "bg-yellow-500", borderColor: "border-yellow-700" },
  slate: { color: "bg-slate-700", borderColor: "border-slate-900" },
  pink: { color: "bg-pink-600", borderColor: "border-pink-800" },
  green: { color: "bg-green-600", borderColor: "border-green-800" },
  amber: { color: "bg-amber-600", borderColor: "border-amber-800" },
  teal: { color: "bg-teal-600", borderColor: "border-teal-800" },
};
const TONES: FranchiseBadgeTone[] = ["red", "blue", "cyan", "orange", "yellow", "slate", "pink", "green", "amber", "teal"];

/** Tones stored in Convex are plain strings; only accept ones we have classes for. */
function isTone(value: string | undefined): value is FranchiseBadgeTone {
  return value !== undefined && (TONES as string[]).includes(value);
}

/** "The Conjuring Collection" → "CONJURING"; long names are clipped to fit the ribbon. */
function shortLabel(name: string): string {
  const label = name
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s+(Collection|Saga|Trilogy|Universe)\s*$/i, "")
    .replace(/^The\s+/i, "")
    .trim()
    .toUpperCase();
  return label.length > 14 ? `${label.slice(0, 13).trimEnd()}…` : label;
}

/** Ribbon for a franchise: its stored label/tone if set, otherwise derived from its name. */
export function franchiseBadge(f: BadgeSource): FranchiseMetadata {
  const tone = isTone(f.tone) ? f.tone : TONES[f.key % TONES.length];
  return { id: f.key, name: f.label || shortLabel(f.name), ...TONE_CLASSES[tone] };
}

/** What the catalog knows about a franchise's ribbon. */
export interface BadgeSource {
  key: number;
  name: string;
  label?: string;
  tone?: string;
}
