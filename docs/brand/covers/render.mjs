#!/usr/bin/env node
// Renders an article cover (1200 x 630 PNG) from cover.html. Run from the repository root:
//   node docs/brand/covers/render.mjs <out.png> '<json>'
// JSON: { "lang": "fr", "kicker": "SMIG · Togo · 2026", "figure": "52 500 F", "unit": "par mois", "line": "..." }
// or a title instead of a figure: { "lang": "en", "kicker": "...", "title": "...", "line": "..." }
// Uses Playwright when it is installed, else headless Chrome (set CHROME to its path if it is not the macOS default).
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [out, json] = process.argv.slice(2);
if (!out || !json) {
  console.error("usage: node docs/brand/covers/render.mjs <out.png> '<json>'");
  process.exit(1);
}
JSON.parse(json);
const url = `${pathToFileURL(resolve('docs/brand/covers/cover.html')).href}#${encodeURIComponent(json)}`;

let playwright;
try {
  // require() also finds a global install (NODE_PATH), which import() does not.
  playwright = createRequire(import.meta.url)('playwright');
} catch {
  playwright = null;
}
if (playwright) {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: out });
  await browser.close();
} else {
  const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1200,630', '--virtual-time-budget=4000', `--screenshot=${resolve(out)}`, url]);
}
console.log(`cover written: ${out}`);
