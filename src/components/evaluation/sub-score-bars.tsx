interface SubScore {
  label: string;
  value: number;
  /** Optional note, e.g. what the dimension measures. */
  hint?: string;
}

interface Props {
  items: SubScore[];
  max?: number;
}

/** Thin ink bars with the number beside them (DESIGN.md §10). */
export function SubScoreBars({ items, max = 10 }: Props) {
  return (
    <ul className="subscore-bars">
      {items.map((item) => (
        <li key={item.label} className="subscore-row">
          <span className="subscore-label">
            {item.label}
            {item.hint && <span className="visually-hidden">: {item.hint}</span>}
          </span>
          <span className="subscore-track" aria-hidden="true">
            <span
              className="subscore-fill"
              style={{
                width: `${Math.max(0, Math.min(100, (item.value / max) * 100))}%`,
              }}
            />
          </span>
          <span className="subscore-value">
            {item.value}
            <span className="visually-hidden"> dari {max}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
