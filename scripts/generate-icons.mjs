// Generates the PWA icons from one geometric "F" mark (no <text>, so the
// result never depends on which fonts the rasterizer has).
//
//   node scripts/generate-icons.mjs
//
// Writes public/icon.svg and public/icons/*.png. Commit the output.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = path.join(root, "public", "icons");

// Brand colors as hex (librsvg does not reliably parse hsl()).
const BG = "#101218"; // --bg-primary, hsl(228, 20%, 8%)
const FROM = "#735af2"; // --accent-primary, hsl(250, 85%, 65%)
const TO = "#368ce2"; // hsl(210, 75%, 55%)

const gradient = `<linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${FROM}"/>
      <stop offset="1" stop-color="${TO}"/>
    </linearGradient>`;

/** The "F": stem + top bar + middle bar, centered on (256, 256) at scale 1. */
function mark(scale) {
  const t = `translate(256 256) scale(${scale}) translate(-256 -256)`;
  return `<g transform="${t}" fill="#ffffff">
    <rect x="170" y="116" width="66" height="280" rx="18"/>
    <rect x="170" y="116" width="184" height="64" rx="18"/>
    <rect x="170" y="224" width="148" height="60" rx="18"/>
  </g>`;
}

/** Rounded tile on a dark frame: the regular ("any") icon. */
const anySvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Feynman Challenge">
  <defs>
    ${gradient}
  </defs>
  <rect width="512" height="512" rx="112" fill="${BG}"/>
  <rect x="40" y="40" width="432" height="432" rx="88" fill="url(#bg)"/>
  ${mark(1)}
</svg>
`;

/**
 * Full-bleed square. Maskable icons are cropped by the OS to a circle or
 * squircle, so the mark stays inside the 80% safe zone (scale 0.8 keeps its
 * corners within a radius of 40%). iOS rounds apple-touch icons itself.
 */
function fullBleedSvg(scale) {
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${gradient}
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  ${mark(scale)}
</svg>
`;
}

async function png(svg, size, file) {
  const out = path.join(iconsDir, file);
  await sharp(Buffer.from(svg), { density: 144 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`wrote public/icons/${file} (${size}x${size})`);
}

await mkdir(iconsDir, { recursive: true });
await writeFile(path.join(root, "public", "icon.svg"), anySvg);
console.log("wrote public/icon.svg");

await png(anySvg, 192, "icon-192.png");
await png(anySvg, 512, "icon-512.png");
await png(fullBleedSvg(0.8), 512, "maskable-512.png");
await png(fullBleedSvg(0.9), 180, "apple-touch-icon.png");
