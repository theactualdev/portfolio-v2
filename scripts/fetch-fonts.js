/* eslint-disable @typescript-eslint/no-require-imports -- Plain CommonJS one-off script, run directly by node and never bundled. */
/** One-off: downloads General Sans 400/500 woff2 from the CDN URLs already
 *  recorded in src/app/dev/specimens/fonts.css, into src/fonts/. */
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
  const wIdx = blocks[i].index + blocks[i][0].length; // end of `font-weight: N;`
  const uIdx = urls[i].index + urls[i][0].length;     // end of the matched url()
  const wBlock = blockOf(wIdx - 1);
  const uBlock = blockOf(uIdx - 1);
  console.log(`pair ${i}: weight=${blocks[i][1]} (@font-face #${wBlock})  url=${urls[i][1]} (@font-face #${uBlock})`);
  if (wBlock === -1 || wBlock !== uBlock) bad = true;
}
if (bad) { console.error("weight/url pairing crossed @font-face boundaries — refusing to download"); process.exit(1); }

fs.mkdirSync("src/fonts", { recursive: true });
const get = (u, out) => new Promise((res, rej) =>
  https.get(u, { headers: { "User-Agent": "Mozilla/5.0" } }, (r) => {
    if (r.statusCode !== 200) return rej(new Error(u + " -> " + r.statusCode));
    const w = fs.createWriteStream(out); r.pipe(w); w.on("finish", () => res(out));
  }).on("error", rej));

(async () => {
  for (let i = 0; i < 2; i++) {
    const weight = blocks[i][1];
    const out = path.join("src/fonts", `GeneralSans-${weight}.woff2`);
    await get(urls[i][1], out);
    console.log("wrote", out, fs.statSync(out).size, "bytes");
  }
})();
