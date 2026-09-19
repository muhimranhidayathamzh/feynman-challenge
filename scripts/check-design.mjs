// Guards the "Kertas & Kapur" design rules (docs/design/DESIGN.md §4, §12).
//
//   npm run design:check      (also runs in CI)
//
// Fails on: decorative gradients, backdrop-filter, glows (blurred accent
// shadows or *-glow tokens), purple hues, the Inter font, emoji in UI code,
// text colour tokens below WCAG AA in either theme, and a "system" dark
// palette that drifted from the explicit dark palette.
//
// A gradient that is a shape, not decoration (e.g. a half-filled mark), is
// allowed when the line before it says: design-check: allow-gradient
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];

function report(file, line, message) {
  problems.push(
    `${path.relative(root, file).split(path.sep).join("/")}:${line}  ${message}`,
  );
}

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = (await walk(path.join(root, "src"))).filter(
  (file) => /[.](css|tsx?)$/.test(file) && !/[.]test[.]tsx?$/.test(file),
);

// ---------------------------------------------------------------------------
// 1. Pattern rules
// ---------------------------------------------------------------------------
const EMOJI = /\p{Extended_Pictographic}/u;
const GRADIENT = /(linear|radial|conic)-gradient[(]/;
const PURPLE_HSL = /hsla?[(]\s*(2[4-7][0-9])[\s,]/;
const GLOW_TOKEN = /--[a-z-]*glow/;
const INTER_IMPORT =
  /import\s*[{][^}]*[^A-Za-z]Inter[^A-Za-z][^}]*[}]\s*from\s*["']next[/]font[/]google["']/;
const INTER_FAMILY = /font-family:[^;]*[^A-Za-z]Inter[^A-Za-z]/;

/** Splits a box-shadow value on top-level commas. */
function splitShadows(value) {
  const out = [];
  let depth = 0;
  let current = "";
  for (const ch of value) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      out.push(current.trim());
      current = "";
    } else current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

/** A shadow is a glow when it is blurred and coloured with the accent. */
function isGlow(shadow) {
  if (!/var[(]--(accent|focus)/.test(shadow)) return false;
  const lengths = shadow
    .replace(/var[(][^)]*[)]/g, " ")
    .replace(/rgba?[(][^)]*[)]/g, " ")
    .split(/\s+/)
    .filter((part) => /^-?[0-9.]+(px|rem|em)?$/.test(part));
  const blur = lengths[2] ? parseFloat(lengths[2]) : 0;
  return blur > 0;
}

for (const file of files) {
  const text = (await readFile(file, "utf8")).replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const isCss = file.endsWith(".css");

  lines.forEach((line, index) => {
    const n = index + 1;
    if (GRADIENT.test(line)) {
      const allowed =
        /design-check: allow-gradient/.test(lines[index - 1] ?? "") ||
        /design-check: allow-gradient/.test(line);
      if (!allowed) report(file, n, "decorative gradient (DESIGN.md §4: tanpa gradient)");
    }
    if (/backdrop-filter/.test(line))
      report(file, n, "backdrop-filter (tanpa glassmorphism)");
    if (GLOW_TOKEN.test(line)) report(file, n, "glow token");
    if (PURPLE_HSL.test(line)) report(file, n, "purple hue (aksen lama)");
    if (INTER_FAMILY.test(line)) report(file, n, "font Inter");
    if (!isCss && EMOJI.test(line)) report(file, n, "emoji di UI (DESIGN.md §7)");
  });

  if (INTER_IMPORT.test(text))
    report(file, 1, "font Inter di-import dari next/font/google");

  if (isCss) {
    const shadowRe = /box-shadow:\s*([^;]+);/g;
    let match;
    while ((match = shadowRe.exec(text))) {
      const line = text.slice(0, match.index).split("\n").length;
      for (const shadow of splitShadows(match[1])) {
        if (isGlow(shadow)) report(file, line, `glow: box-shadow "${shadow}"`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Every var(--token) must be declared somewhere (a typo silently drops the
//    colour). next/font injects its own variables at runtime.
// ---------------------------------------------------------------------------
const RUNTIME_VARS = new Set(["--font-jakarta", "--font-newsreader"]);
const declared = new Set(RUNTIME_VARS);
const referenced = [];
for (const file of files) {
  const text = (await readFile(file, "utf8")).replace(/\r\n/g, "\n");
  for (const m of text.matchAll(/(--[a-z0-9-]+)\s*:/g)) declared.add(m[1]);
  // JSX style objects declare custom properties as quoted keys: { "--dot": x }
  for (const m of text.matchAll(/["'](--[a-z0-9-]+)["']\s*:/g)) declared.add(m[1]);
  text.split("\n").forEach((line, index) => {
    for (const m of line.matchAll(/var[(](--[a-z0-9-]+)/g)) {
      referenced.push({ file, line: index + 1, name: m[1] });
    }
  });
}
for (const ref of referenced) {
  if (!declared.has(ref.name)) report(ref.file, ref.line, `undefined token ${ref.name}`);
}

// ---------------------------------------------------------------------------
// 3. Palette: contrast and dark/system parity
// ---------------------------------------------------------------------------
const tokensFile = path.join(root, "src", "styles", "tokens.css");
const tokensText = (await readFile(tokensFile, "utf8")).replace(/\r\n/g, "\n");

/** Hex colour tokens declared in the block that follows a marker comment. */
function palette(marker) {
  const at = tokensText.indexOf(`/* @theme ${marker} */`);
  if (at < 0) {
    report(tokensFile, 1, `missing marker @theme ${marker}`);
    return new Map();
  }
  const open = tokensText.indexOf("{", at);
  // For the media-query block the palette sits in the inner braces.
  const inner = marker === "dark-system" ? tokensText.indexOf("{", open + 1) : open;
  const close = tokensText.indexOf("}", inner);
  const map = new Map();
  for (const m of tokensText
    .slice(inner, close)
    .matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    map.set(m[1], m[2].toLowerCase());
  }
  return map;
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// Text tokens and the backgrounds they are used on (DESIGN.md §4).
const PAIRS = [
  ...[
    "--ink",
    "--ink-2",
    "--ink-3",
    "--accent-text",
    "--covered",
    "--partial",
    "--error",
  ].flatMap((text) => [
    [text, "--paper"],
    [text, "--surface"],
  ]),
  ["--ink", "--sunken"],
  ["--ink-2", "--sunken"],
  ["--ink-3", "--sunken"],
  ["--accent-ink", "--accent"],
  ["--accent-ink", "--accent-hover"],
  ["--error-ink", "--error"],
  ["--ink", "--highlight"],
];

const light = palette("light");
const dark = palette("dark");
const system = palette("dark-system");

for (const [name, colours] of [
  ["light", light],
  ["dark", dark],
]) {
  for (const [fg, bg] of PAIRS) {
    const a = colours.get(fg);
    const b = colours.get(bg);
    if (!a || !b) {
      report(
        tokensFile,
        1,
        `${name}: token ${!a ? fg : bg} is missing or not a 6-digit hex`,
      );
      continue;
    }
    const ratio = contrast(a, b);
    if (ratio < 4.5) {
      report(
        tokensFile,
        1,
        `${name}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1 (needs 4.5:1)`,
      );
    }
  }
}

for (const [key, value] of dark) {
  if (system.get(key) !== value) {
    report(
      tokensFile,
      1,
      `dark-system ${key} is ${system.get(key) ?? "missing"}, dark is ${value}`,
    );
  }
}
for (const key of system.keys()) {
  if (!dark.has(key)) report(tokensFile, 1, `dark-system has ${key}, dark does not`);
}

// ---------------------------------------------------------------------------
if (problems.length > 0) {
  console.error(`design:check found ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(
  `design:check ok: ${files.length} files, ${PAIRS.length * 2} contrast pairs, dark and system palettes match.`,
);
