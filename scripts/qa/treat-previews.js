/* eslint-disable @typescript-eslint/no-require-imports -- Plain CommonJS QA script, run directly by node and never bundled. */
/**
 * Downscale the captured product shots to the size a hover-preview panel would
 * use, composite them on the site's ground (#0a0a0b) so the glow question can be
 * judged honestly, and measure real WebP/AVIF weights at 1x and 2x.
 *
 * Usage: node scripts/qa/treat-previews.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const OUT = path.resolve(__dirname, "../../.qa/previews");
const GROUND = { r: 10, g: 10, b: 11 };
const SLUGS = ["nevo", "mse-lux", "gpa", "faceblur", "bleachers"];

const kb = (n) => (n / 1024).toFixed(1) + "KB";

(async () => {
  const rows = [];
  for (const slug of SLUGS) {
    const src = path.join(OUT, `${slug}-full.png`);
    const base = sharp(src);
    const meta = await base.metadata();

    // 3:2 cover crop from the top of the fold, then 600x400 and 1200x800.
    const at = async (w, h) =>
      sharp(src).resize(w, h, { fit: "cover", position: "top" }).toBuffer();

    const png600 = await at(600, 400);
    const png1200 = await at(1200, 800);
    fs.writeFileSync(path.join(OUT, `${slug}-600x400.png`), png600);

    // mean luminance of the 600x400 crop -> how much it will glow on #0a0a0b
    const stats = await sharp(png600).stats();
    const lum = (0.2126 * stats.channels[0].mean + 0.7152 * stats.channels[1].mean + 0.0722 * stats.channels[2].mean);

    // on-ground composite, the way it would actually be seen
    const onDark = await sharp({
      create: { width: 840, height: 560, channels: 3, background: GROUND },
    })
      .composite([{ input: png600, top: 80, left: 120 }])
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(OUT, `${slug}-on-dark.png`), onDark);

    // half-scale full frame, for reading detail
    await sharp(src).resize(Math.round(meta.width / 2)).png().toFile(path.join(OUT, `${slug}-read.png`));

    const enc = {
      webp80_1x: (await sharp(png600).webp({ quality: 80 }).toBuffer()).length,
      webp70_1x: (await sharp(png600).webp({ quality: 70 }).toBuffer()).length,
      avif50_1x: (await sharp(png600).avif({ quality: 50 }).toBuffer()).length,
      webp75_2x: (await sharp(png1200).webp({ quality: 75 }).toBuffer()).length,
      avif45_2x: (await sharp(png1200).avif({ quality: 45 }).toBuffer()).length,
    };

    rows.push({ slug, src: `${meta.width}x${meta.height}`, lum: lum.toFixed(1), ...enc });
    console.log(
      `${slug.padEnd(10)} lum=${lum.toFixed(1).padStart(5)}  webp80@1x ${kb(enc.webp80_1x).padStart(7)}  webp70@1x ${kb(enc.webp70_1x).padStart(7)}  avif50@1x ${kb(enc.avif50_1x).padStart(7)}  webp75@2x ${kb(enc.webp75_2x).padStart(7)}  avif45@2x ${kb(enc.avif45_2x).padStart(7)}`
    );
  }

  const sum = (k) => rows.reduce((a, r) => a + r[k], 0);
  console.log("\nFIVE-IMAGE TOTALS");
  for (const k of ["webp80_1x", "webp70_1x", "avif50_1x", "webp75_2x", "avif45_2x"]) {
    console.log(`  ${k.padEnd(10)} ${kb(sum(k))}`);
  }
  fs.writeFileSync(path.join(OUT, "weights.json"), JSON.stringify(rows, null, 2));
})();
