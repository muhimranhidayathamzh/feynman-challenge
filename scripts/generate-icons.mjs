// Generates every app icon from the brand mark in src/lib/brand/mark.ts, the
// same geometry the <BrandMark/> component draws (DESIGN.md §7).
//
//   npm run icons
//
// Writes public/icon.svg, public/icons/*.png, and src/app/favicon.ico.
// Commit the output. Needs Node 22.18+ / 23.6+ (imports the .ts file directly).
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { BRAND_COLORS, markSvg } from "../src/lib/brand/mark.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = path.join(root, "public", "icons");

// Ink tile, paper lines, light vermilion wave: reads on light and dark home
// screens alike.
const onInk = {
  tile: BRAND_COLORS.ink,
  line: BRAND_COLORS.paper,
  wave: BRAND_COLORS.accentOnInk,
};

/** Rounded tile ("any" purpose, favicon). */
const tileSvg = (size) => markSvg({ size, radius: 11, ...onInk });

/**
 * Full-bleed square. Maskable icons are cropped to a circle or squircle, so
 * the mark shrinks into the 80% safe zone; iOS rounds apple-touch icons itself.
 */
const bleedSvg = (size, scale) => markSvg({ size, radius: 0, scale, ...onInk });

async function png(svg, size) {
  return sharp(Buffer.from(svg), { density: Math.max(72, (size / 48) * 72 * 2) })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Minimal .ico container holding PNG images (supported by every browser). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

async function write(file, data) {
  await writeFile(path.join(root, file), data);
  console.log(`wrote ${file}`);
}

await mkdir(iconsDir, { recursive: true });

await write("public/icon.svg", tileSvg(512));
await write("public/icons/icon-192.png", await png(tileSvg(192), 192));
await write("public/icons/icon-512.png", await png(tileSvg(512), 512));
await write("public/icons/maskable-512.png", await png(bleedSvg(512, 0.78), 512));
await write("public/icons/apple-touch-icon.png", await png(bleedSvg(180, 0.9), 180));

const favicon = [];
for (const size of [16, 32, 48]) {
  favicon.push({ size, data: await png(tileSvg(size), size) });
}
await write("src/app/favicon.ico", ico(favicon));
