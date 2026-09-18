// ============================================================================
// Recording hints — pure helpers.
//
// Tier 1 (keywords) and tier 2 (guiding questions) come from the AI and are
// stored per outline point. They must not leak the rubric: keywords never
// just repeat the point's title, and are shown shuffled and unnumbered so
// they don't reveal the outline's order.
// ============================================================================

export const MAX_KEYWORDS_PER_POINT = 4;
const MAX_KEYWORD_LENGTH = 60;

function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((t) => t.length > 0);
}

/**
 * Cleans AI keywords for one outline point: trims, drops empties, duplicates
 * (case-insensitive), overly long entries, and any keyword whose words are
 * all already in the title (it would just give the title away).
 */
export function sanitizeKeywords(title: string, keywords: readonly string[]): string[] {
  const titleTokens = new Set(tokens(title));
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of keywords) {
    const keyword = raw.trim().replace(/\s+/g, " ");
    if (keyword.length === 0 || keyword.length > MAX_KEYWORD_LENGTH) continue;

    const key = keyword.toLowerCase();
    if (seen.has(key)) continue;

    const keywordTokens = tokens(keyword);
    if (keywordTokens.length === 0) continue;
    if (keywordTokens.every((t) => titleTokens.has(t))) continue;

    seen.add(key);
    out.push(keyword);
    if (out.length >= MAX_KEYWORDS_PER_POINT) break;
  }
  return out;
}

/** 32-bit FNV-1a hash of a string (seed for the shuffle). */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: tiny deterministic PRNG in [0, 1). */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle, deterministic for a given seed. Does not mutate input. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const out = [...items];
  const random = mulberry32(hashSeed(seed));
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = out[i] as T;
    out[i] = out[j] as T;
    out[j] = a;
  }
  return out;
}

export interface OutlineHintSource {
  title: string;
  description: string | null;
  keywords: readonly string[];
  guiding_question: string | null;
}

export interface RecordingHints {
  /** Tier 1: all keywords, shuffled + deduplicated. */
  keywords: string[];
  /** Tier 2: one guiding question per outline point, in outline order. */
  questions: string[];
  /** Tier 3: the full outline. */
  outline: { title: string; description: string | null }[];
  /** True when at least one point had no stored AI hints (fallback used). */
  missing: boolean;
}

export function isHintMissing(item: {
  keywords: readonly string[];
  guiding_question: string | null;
}): boolean {
  return item.keywords.length === 0 || !item.guiding_question?.trim();
}

/**
 * Builds the three hint tiers for the recording screen. Points without stored
 * AI hints fall back to the old behaviour (title as keyword, a templated
 * question) so recording is never blocked by a missing hint.
 */
export function buildHints(
  items: readonly OutlineHintSource[],
  seed: string,
): RecordingHints {
  const allKeywords: string[] = [];
  const seen = new Set<string>();
  let missing = false;

  for (const item of items) {
    if (isHintMissing(item)) missing = true;
    const source = item.keywords.length > 0 ? item.keywords : [item.title];
    for (const keyword of source) {
      const key = keyword.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      allKeywords.push(keyword);
    }
  }

  return {
    keywords: seededShuffle(allKeywords, seed),
    questions: items.map(
      (item) =>
        item.guiding_question?.trim() || `Bisakah kamu menjelaskan: ${item.title}?`,
    ),
    outline: items.map((item) => ({ title: item.title, description: item.description })),
    missing,
  };
}
