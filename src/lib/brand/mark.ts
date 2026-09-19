// ============================================================================
// Brand mark: an upright Feynman diagram (DESIGN.md §7). Two lines meet at a
// vertex and a photon wave rises from it: two ideas meet and an explanation
// (a voice) comes out. Drawn on a 48-unit grid; one geometry for every size
// (checked at 16, 32, and 192 px).
//
// Shared by <BrandMark/> and scripts/generate-icons.mjs, so it must stay
// plain, dependency-free TypeScript (Node runs it with type stripping).
// ============================================================================

export const MARK_VIEWBOX = 48;

/** The two incoming lines, meeting at the vertex (24, 27). */
export const MARK_LEGS = "M10 40 L24 27 L38 40";
export const MARK_LEGS_STROKE = 4.5;

/** Vertex dot. */
export const MARK_VERTEX = { cx: 24, cy: 27, r: 3.4 };

/** Photon wave: four half-periods of 5 units rising from the vertex. */
export const MARK_WAVE =
  "M24 27 q-4.8 -2.5 0 -5 q4.8 -2.5 0 -5 q-4.8 -2.5 0 -5 q4.8 -2.5 0 -5";
export const MARK_WAVE_STROKE = 3.8;

export const BRAND_COLORS = {
  ink: "#1e2230",
  paper: "#f4efe4",
  /** Vermilion for paper backgrounds. */
  accent: "#c8431b",
  /** Lighter vermilion for ink/board backgrounds. */
  accentOnInk: "#ee7a52",
} as const;

/** Standalone SVG markup (icons, favicon). `scale` shrinks the mark around the centre. */
export function markSvg(options: {
  size: number;
  tile: string;
  line: string;
  wave: string;
  /** Corner radius on the 48 grid; 0 = full-bleed square. */
  radius: number;
  scale?: number;
}): string {
  const scale = options.scale ?? 1;
  const t = `translate(24 24) scale(${scale}) translate(-24 -24)`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${options.size}" height="${options.size}" role="img" aria-label="Feynman Challenge">
  <rect width="48" height="48" rx="${options.radius}" fill="${options.tile}"/>
  <g transform="${t}" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="${MARK_LEGS}" stroke="${options.line}" stroke-width="${MARK_LEGS_STROKE}"/>
    <path d="${MARK_WAVE}" stroke="${options.wave}" stroke-width="${MARK_WAVE_STROKE}"/>
    <circle cx="${MARK_VERTEX.cx}" cy="${MARK_VERTEX.cy}" r="${MARK_VERTEX.r}" fill="${options.line}" stroke="none"/>
  </g>
</svg>
`;
}
