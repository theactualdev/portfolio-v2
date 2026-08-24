/* eslint-disable @typescript-eslint/no-require-imports -- Plain CommonJS one-off script, run directly by node and never bundled. */
/** One-off: downloads General Sans 400/500 woff2 from the CDN URLs already
 *  recorded in src/app/dev/specimens/fonts.css, into src/fonts/.
 *  Paths are resolved from the CWD — run it from the repo root. Re-running is
 *  safe: it overwrites both files. */
const fs = require("fs");
const https = require("https");
const path = require("path");

const css = fs.readFileSync("src/app/dev/specimens/fonts.css", "utf8");
// Blocks are ordered; General Sans appears with font-weight 400 then 500.
const blocks = [...css.matchAll(/font-family: 'General Sans';[\s\S]*?font-weight: (\d+);/g)];
const urls = [...css.matchAll(/font-family: 'General Sans';[\s\S]*?url\('(https:[^']+?\.woff2)'\)/g)];
if (urls.length < 2 || blocks.length < 2) { console.error("expected 2 General Sans weights and 2 woff2 urls, got", blocks.length, "and", urls.length); process.exit(1); }

/*
 * The two regexes above are paired BY INDEX, and each can run `[\s\S]*?` past
 * the end of its own @font-face block (the file also holds Chillax faces).
 * So prove the pairing before downloading: every weight and its partner URL
 * must fall inside the SAME `@font-face { ... }` block. Cheap, and it turns a
 * silent mis-download into a loud failure.
 */
const faceRanges = [...css.matchAll(/@font-face\s*\{[\s\S]*?\}/g)]
  .map((m) => [m.index, m.index + m[0].length]);
const blockOf = (i) => faceRanges.findIndex(([s, e]) => i >= s && i < e);

let bad = false;
for (let i = 0; i < 2; i++) {
  // Check BOTH ends. Comparing only where each match ENDS lets the failure
  // through whenever both tails run past their own block into the same next
  // one — they agree, and the guard waves it by.
  const wStart = blockOf(blocks[i].index);
  const wEnd = blockOf(blocks[i].index + blocks[i][0].length - 1);
  const uStart = blockOf(urls[i].index);
  const uEnd = blockOf(urls[i].index + urls[i][0].length - 1);
  console.log(`pair ${i}: weight=${blocks[i][1]} (@font-face #${wStart}..#${wEnd})  url=${urls[i][1]} (@font-face #${uStart}..#${uEnd})`);
  if ([wStart, wEnd, uStart, uEnd].some((b) => b === -1)) bad = true;
  else if (new Set([wStart, wEnd, uStart, uEnd]).size !== 1) bad = true;
}
if (bad) { console.error("weight/url pairing crossed @font-face boundaries — refusing to download"); process.exit(1); }

fs.mkdirSync("src/fonts", { recursive: true });
const get = (u, out) => new Promise((res, rej) =>
  https.get(u, { headers: { "User-Agent": "Mozilla/5.0" } }, (r) => {
    if (r.statusCode !== 200) return rej(new Error(u + " -> " + r.statusCode));
    // Without listeners on BOTH streams a mid-body truncation just unpipes:
    // `finish` never fires, the promise never settles, and node exits 0 with a
    // half-written .woff2 on disk. Fail loudly instead.
    const w = fs.createWriteStream(out);
    r.on("error", rej);
    w.on("error", rej);
    w.on("finish", () => res(out));
    r.pipe(w);
  }).on("error", rej));

(async () => {
  for (let i = 0; i < 2; i++) {
    const weight = blocks[i][1];
    const out = path.join("src/fonts", `GeneralSans-${weight}.woff2`);
    await get(urls[i][1], out);
    console.log("wrote", out, fs.statSync(out).size, "bytes");
  }
})().catch((e) => { console.error("download failed:", e.message); process.exit(1); });
