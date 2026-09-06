/**
 * Who is on the other end of a thread.
 *
 * The persona trainer (scripts/train-persona.mjs) reads this roster to label
 * every exported chat, because the account owner writes very differently to
 * his mother than he does to a friend. The conversation feed uses the same
 * roster to badge a row, so one edit here changes both.
 *
 * Client-safe: no node built-ins, no secrets.
 */

export type RelationshipRole =
  | "self"
  | "mom"
  | "gf"
  | "female-friend"
  | "friend"
  | "family"
  | "unknown";

export interface RoleMeta {
  id: RelationshipRole;
  label: { en: string; bn: string };
  /** Swatch colour for the feed badge. */
  accent: string;
  /** How the owner speaks to this person — folded into the persona prompt. */
  register: string;
}

export const ROLES: RoleMeta[] = [
  {
    id: "mom",
    label: { en: "Mom", bn: "মা" },
    accent: "#2F8F72",
    register:
      "Speak to a mother: soft, respectful, short. Ask whether she has eaten and taken her medicine, answer her worry before her question, never argue, never joke at her expense.",
  },
  {
    id: "gf",
    label: { en: "Girlfriend", bn: "প্রেমিকা" },
    accent: "#C2506E",
    register:
      "Speak to a partner already close to the owner: affectionate, plain, specific. Small shared details rather than declarations. Never explicit.",
  },
  {
    id: "female-friend",
    label: { en: "Female friend", bn: "বান্ধবী" },
    accent: "#C98A1E",
    register:
      "Speak to a close friend who is not a partner: warm and teasing, never romantic and never about appearance.",
  },
  {
    id: "friend",
    label: { en: "Friend", bn: "বন্ধু" },
    accent: "#7A5CC4",
    register:
      "Speak to a close friend: blunt, casual Banglish, banter allowed, no formality and no honorifics.",
  },
  {
    id: "family",
    label: { en: "Family", bn: "পরিবার" },
    accent: "#2C7FA6",
    register: "Speak to a relative: warm, respectful, a little more formal than to a friend.",
  },
  {
    id: "unknown",
    label: { en: "Unlabelled", bn: "অচিহ্নিত" },
    accent: "#6B7280",
    register: "Speak to someone whose relationship is not recorded: friendly and neutral.",
  },
];

export function roleMeta(id: RelationshipRole): RoleMeta {
  return ROLES.find((r) => r.id === id) || ROLES[ROLES.length - 1];
}

/** The account owner as the export writes his name. */
export const OWNER_NAME = "Pritom Biswas";

/** Alternate spellings of the owner that show up across exports. */
export const OWNER_ALIASES = ["Pritom Biswas", "Pritam Biswas", "Pritom", "Pritam"];

/**
 * Explicit roster. Keys are matched case-insensitively against the thread
 * participant name; anyone absent falls through to `DEFAULT_ROLE`, since every
 * thread in this export is a personal chat rather than a customer one.
 */
export const ROSTER: Record<string, RelationshipRole> = {
  "smriti rani": "mom",
  "shreejoyee biswas urmi": "gf",
  shreejoye: "gf",
  "shreya golder": "female-friend",
  "nayan biswas": "friend",
  "niløy biswas": "friend",
  "niloy biswas": "friend",
  "niloy biswas niloy": "friend",
  "niloy chakraborty": "friend",
};

export const DEFAULT_ROLE: RelationshipRole = "friend";

export function roleFor(name: string | undefined | null): RelationshipRole {
  if (!name) return "unknown";
  const key = name.trim().toLowerCase();
  if (OWNER_ALIASES.some((a) => a.toLowerCase() === key)) return "self";
  
  // 1. Direct exact match in roster
  if (ROSTER[key]) return ROSTER[key];

  // 2. Partial name match (e.g. "Shreya" matches "shreya golder")
  for (const [rosterName, role] of Object.entries(ROSTER)) {
    if (key.includes(rosterName) || rosterName.includes(key)) {
      return role;
    }
  }

  // 3. Natural keyword heuristics for family/relatives
  if (/\b(mom|ma|ammu|maa|mataji|mother)\b/i.test(key)) return "mom";
  if (/\b(gf|bou|jaan|janu|baby|shona|urmi|shreejoyee)\b/i.test(key)) return "gf";
  if (/\b(didi|apu|bon|sister|kaki|mami|khala|fupu|chacha|kaka|mama|baba|abbu|father)\b/i.test(key)) return "family";

  return DEFAULT_ROLE;
}

/** Looser match for feed rows, where the label may carry extra words. */
export function roleForLoose(name: string | undefined | null): RelationshipRole {
  return roleFor(name);
}
