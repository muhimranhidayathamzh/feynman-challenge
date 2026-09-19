import { Sheet, SheetTitle } from "@/components/ui/sheet";

interface Props {
  /** Feedback after the first sentence (the first one is the page summary). */
  rest: string;
  strengths: string[];
  improvements: string[];
  jargon: string[];
}

/**
 * The evaluator's notes, written like a teacher's margin notes: what is
 * already strong, what could be better, and terms still to explain.
 */
export function FeedbackNotes({ rest, strengths, improvements, jargon }: Props) {
  if (
    !rest &&
    strengths.length === 0 &&
    improvements.length === 0 &&
    jargon.length === 0
  ) {
    return null;
  }
  return (
    <Sheet as="section" className="stack gap-5" aria-labelledby="notes-title">
      <SheetTitle id="notes-title">Catatan penilai</SheetTitle>
      {rest && <p className="reading">{rest}</p>}

      <div className="notes-columns">
        {strengths.length > 0 && (
          <div className="stack gap-2">
            <h3 className="notes-heading">Sudah kuat</h3>
            <ul className="notes-list">
              {strengths.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {improvements.length > 0 && (
          <div className="stack gap-2">
            <h3 className="notes-heading">Bisa lebih baik</h3>
            <ul className="notes-list">
              {improvements.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {jargon.length > 0 && (
        <div className="stack gap-2">
          <h3 className="notes-heading">Istilah yang belum kamu jelaskan</h3>
          <p className="text-secondary text-sm">
            Inti teknik Feynman: jelaskan istilah ini dengan kata sederhana di percobaan
            berikutnya.
          </p>
          <ul className="row flex-wrap gap-2">
            {jargon.map((term) => (
              <li key={term} className="badge">
                {term}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Sheet>
  );
}
