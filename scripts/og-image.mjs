// Photographs the link-preview card at /dev/og into public/og.png.
//
//   npm run dev          # in another terminal
//   npm run og
//
// Options:
//   --base <url>   dev server (default http://localhost:3000)
//   --out <file>   output path (default public/og.png)
//   --theme <name> "light" (default) or "dark"
//
// The card is a real page rendered with the app's own tokens and fonts, so it
// can never drift from the design the way a hand-drawn image would.
// Uses the Chrome installed on this machine; set SHOTS_CHROME to override.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const base = arg("base", "http://localhost:3000").replace(/\/$/, "");
const out = path.resolve(root, arg("out", path.join("public", "og.png")));
const theme = arg("theme", "light");

const WIDTH = 1200;
const HEIGHT = 630;

try {
  const response = await fetch(`${base}/dev/og`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
} catch (error) {
  console.error(`Kartu OG tidak bisa dibuka di ${base}/dev/og (${error.message}).`);
  console.error("Jalankan `npm run dev` dulu, atau pakai --base.");
  process.exit(1);
}

const browser = await chromium.launch(
  process.env.SHOTS_CHROME
    ? { executablePath: process.env.SHOTS_CHROME }
    : { channel: "chrome" },
);

try {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    colorScheme: "light",
  });
  await context.addCookies([{ name: "theme", value: theme, url: base }]);

  const page = await context.newPage();
  await page.goto(`${base}/dev/og`, { waitUntil: "networkidle" });
  // The dev-server badge renders in a <nextjs-portal> and would be in frame.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.evaluate(() => document.fonts.ready);

  const card = page.locator(".og-card");
  if ((await card.count()) === 0) {
    throw new Error("Elemen .og-card tidak ditemukan di /dev/og.");
  }

  await mkdir(path.dirname(out), { recursive: true });
  await card.screenshot({ path: out });
  console.log(`Kartu OG ditulis ke ${path.relative(root, out)} (${WIDTH}x${HEIGHT}).`);
} finally {
  await browser.close();
}
