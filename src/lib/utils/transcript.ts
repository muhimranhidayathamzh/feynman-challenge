// ============================================================================
// Result page text helpers (Prompt V.4) — pure.
//
// splitSummary:        the first sentence of the AI feedback becomes the
//                      one-line summary at the top of the result page.
// annotateTranscript:  splits the transcript into pieces so the page can
//                      highlight the evidence quoted for each outline point
//                      and underline terms used without explanation.
// ============================================================================

export interface FeedbackSummary {
  /** First sentence, or null when there is no feedback. */
  summary: string | null;
  /** Everything after the first sentence (may be empty). */
  rest: string;
}

/** Splits AI feedback into its first sentence and the remainder. */
export function splitSummary(feedback: string | null | undefined): FeedbackSummary {
  const text = (feedback ?? "").trim().replace(/\s+/g, " ");
  if (!text) return { summary: null, rest: "" };
  // A sentence ends at . ! ? (or an ellipsis) followed by a space and a
  // capital letter or digit, which skips most abbreviations such as "mis. x".
  const end = text.search(/[.!?…](?=\s+[A-Z0-9“"])/);
  if (end < 0) return { summary: text, rest: "" };
  return { summary: text.slice(0, end + 1), rest: text.slice(end + 1).trim() };
}

// ---------------------------------------------------------------------------

export interface TranscriptPiece {
  text: string;
  /** Index of the coverage entry whose evidence contains this piece. */
  point: number | null;
  /** Unexplained term this piece spells, if any. */
  jargon: string | null;
}

const WORD = /[\p{L}\p{N}]/u;

function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && WORD.test(ch);
}

/**
 * Lower-cases, drops punctuation, and collapses whitespace, keeping a map
 * from each normalized character back to its position in the original.
 */
function normalize(text: string): { norm: string; map: number[] } {
  let norm = "";
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i] as string;
    if (isWordChar(ch)) {
      norm += ch.toLowerCase();
      map.push(i);
    } else if (norm.length > 0 && !norm.endsWith(" ")) {
      norm += " ";
      map.push(i);
    }
  }
  if (norm.endsWith(" ")) {
    norm = norm.slice(0, -1);
    map.pop();
  }
  return { norm, map };
}

/** [start, end) of `quote` inside `transcript`, ignoring case, spacing, and punctuation. */
export function findQuote(transcript: string, quote: string): [number, number] | null {
  const needle = normalize(quote).norm;
  if (needle.length < 3) return null;
  const { norm, map } = normalize(transcript);
  const at = norm.indexOf(needle);
  if (at < 0) return null;
  const start = map[at];
  const last = map[at + needle.length - 1];
  if (start === undefined || last === undefined) return null;
  return [start, last + 1];
}

/** Every whole-word occurrence of `term`, case-insensitive. */
function findTerm(transcript: string, term: string): [number, number][] {
  const needle = term.trim().toLowerCase();
  if (!needle) return [];
  const hay = transcript.toLowerCase();
  const out: [number, number][] = [];
  let from = 0;
  for (;;) {
    const at = hay.indexOf(needle, from);
    if (at < 0) break;
    const end = at + needle.length;
    if (!isWordChar(transcript[at - 1]) && !isWordChar(transcript[end])) {
      out.push([at, end]);
    }
    from = at + 1;
  }
  return out;
}

/**
 * Splits `transcript` at every evidence and jargon boundary. A piece inside
 * several evidence quotes belongs to the earliest coverage entry; quotes that
 * are not found are simply not highlighted.
 */
export function annotateTranscript(
  transcript: string,
  evidence: readonly string[],
  jargon: readonly string[],
): { pieces: TranscriptPiece[]; found: boolean[] } {
  if (!transcript) return { pieces: [], found: evidence.map(() => false) };

  const quotes = evidence.map((quote) => (quote ? findQuote(transcript, quote) : null));
  const terms = jargon.flatMap((term) =>
    findTerm(transcript, term).map(([start, end]) => ({ start, end, term })),
  );

  const cuts = new Set<number>([0, transcript.length]);
  for (const range of quotes) {
    if (range) {
      cuts.add(range[0]);
      cuts.add(range[1]);
    }
  }
  for (const { start, end } of terms) {
    cuts.add(start);
    cuts.add(end);
  }
  const bounds = [...cuts].sort((a, b) => a - b);

  const pieces: TranscriptPiece[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const start = bounds[i] as number;
    const end = bounds[i + 1] as number;
    if (end <= start) continue;
    const point = quotes.findIndex(
      (range) => range !== null && range[0] <= start && end <= range[1],
    );
    const term = terms.find((t) => t.start <= start && end <= t.end);
    const piece: TranscriptPiece = {
      text: transcript.slice(start, end),
      point: point >= 0 ? point : null,
      jargon: term ? term.term : null,
    };
    const prev = pieces[pieces.length - 1];
    if (
      prev &&
      prev.point === piece.point &&
      prev.jargon === null &&
      piece.jargon === null
    ) {
      prev.text += piece.text;
    } else {
      pieces.push(piece);
    }
  }
  return { pieces, found: quotes.map((range) => range !== null) };
}
