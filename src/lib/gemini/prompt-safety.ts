// ============================================================================
// Prompt-injection hygiene for user-supplied text placed inside prompts.
// ============================================================================

/**
 * Wraps user text in <tag>…</tag> after removing any occurrence of that tag,
 * so the text can never "close" its own fence and smuggle instructions into
 * the part of the prompt the model treats as ours. Empty text becomes an
 * explicit placeholder.
 */
export function fenceUserText(tag: string, text: string | null | undefined): string {
  const pattern = new RegExp(`</?\\s*${tag}\\s*>`, "gi");
  const clean = (text ?? "").replace(pattern, "").trim();
  return `<${tag}>\n${clean.length > 0 ? clean : "(tidak ada)"}\n</${tag}>`;
}
