// Photographs every screen of the dev gallery (/dev/galeri) for design review.
//
//   npm run dev                         # in another terminal
//   npm run shots -- --label before     # writes docs/design/shots/before/*.png
//
// Options:
//   --label <name>      output folder under docs/design/shots (required)
//   --base <url>        dev server (default http://localhost:3000)
//   --widths 390,1280   viewport widths
//   --only a,b          only these frame ids
//   --themes light,dark sets the "theme" cookie per run (Fase V.2+); omit for default
//
// Uses the Chrome installed on this machine (playwright-core, channel "chrome").
// Set SHOTS_CHROME to a browser executable to use another one.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const label = arg("label");
if (!label || !/^[a-z0-9-]+$/.test(label)) {
  console.error("Pakai --label <nama>, huruf kecil/angka/strip. Contoh: --label before");
  process.exit(1);
}
const base = arg("base", "http://localhost:3000").replace(/\/$/, "");
const widths = arg("widths", "390,1280").split(",").map(Number);
const only = arg("only")?.split(",");
const themes = arg("themes")?.split(",") ?? ["default"];
const outDir = path.join(root, "docs", "design", "shots", label);

try {
  const response = await fetch(`${base}/dev/galeri`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
} catch (error) {
  console.error(`Galeri tidak bisa dibuka di ${base}/dev/galeri (${error.message}).`);
  console.error("Jalankan `npm run dev` dulu, atau pakai --base.");
  process.exit(1);
}

const browser = await chromium.launch(
  process.env.SHOTS_CHROME
    ? { executablePath: process.env.SHOTS_CHROME }
    : { channel: "chrome" },
);

try {
  const indexPage = await browser.newPage();
  await indexPage.goto(`${base}/dev/galeri`, { waitUntil: "networkidle" });
  const frames = (
    await indexPage.$$eval("a[data-frame]", (links) =>
      links.map((link) => ({
        id: link.getAttribute("data-frame"),
        capture: link.getAttribute("data-capture") ?? "page",
      })),
    )
  ).filter((frame) => frame.id && (!only || only.includes(frame.id)));
  await indexPage.close();

  await mkdir(outDir, { recursive: true });
  let count = 0;

  for (const theme of themes) {
    for (const width of widths) {
      const screenHeight = width < 600 ? 844 : 900;
      const context = await browser.newContext({
        viewport: { width, height: screenHeight },
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
      });
      if (theme !== "default") {
        await context.addCookies([{ name: "theme", value: theme, url: base }]);
      }
      const page = await context.newPage();

      for (const { id, capture } of frames) {
        await page.goto(`${base}/dev/galeri/${id}`, { waitUntil: "networkidle" });
        // Hide the Next.js dev indicator; let fonts and one frame settle.
        await page.addStyleTag({
          content: "nextjs-portal { display: none !important; }",
        });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(250);

        // Long screens: grow the viewport to the page height instead of using
        // fullPage, so fixed elements (bottom nav) sit at the bottom like on a
        // real device rather than floating at the first screen edge.
        let png;
        if (capture === "viewport") {
          png = await page.screenshot();
        } else {
          const pageHeight = await page.evaluate(() =>
            Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
          );
          await page.setViewportSize({
            width,
            height: Math.max(screenHeight, pageHeight),
          });
          await page.waitForTimeout(150);
          png = await page.screenshot();
          await page.setViewportSize({ width, height: screenHeight });
        }
        const small = await sharp(png)
          .png({ palette: true, quality: 90, compressionLevel: 9 })
          .toBuffer();
        const suffix = theme === "default" ? "" : `-${theme}`;
        const file = `${id}-${width}${suffix}.png`;
        await writeFile(path.join(outDir, file), small);
        count += 1;
        console.log(`  ${file}`);
      }
      await context.close();
    }
  }
  console.log(`${count} screenshot di docs/design/shots/${label}/`);
} finally {
  await browser.close();
}
