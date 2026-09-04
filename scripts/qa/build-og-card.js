/* eslint-disable @typescript-eslint/no-require-imports -- Plain CommonJS build script, run directly by node and never bundled. */
/**
 * Build the 1200x630 link-preview card into src/app/opengraph-image.png.
 *
 * Re-run when the headshot, the name or the role changes:
 *   node scripts/qa/build-og-card.js [fade|framed]
 *
 * WHY A BROWSER AND NOT `sharp` ALONE: the card is typeset in the site's own
 * faces — Archivo for the name, General Sans for the marks — and compositing
 * text with sharp would mean rasterising through librsvg, which does not have
 * these fonts. Chrome does the typesetting, sharp is not needed. This follows
 * build-previews.js, which captures the product shots the same way.
 *
 * 1200x630 is the one size worth shipping: it is the 1.91:1 that Facebook,
 * LinkedIn, Discord, Slack, WhatsApp and iMessage all read, and X accepts it
 * for summary_large_image by cropping top and bottom, which this layout leaves
 * room for — nothing load-bearing sits in the outer 40px band.
 *
 * THE PHOTO PROBLEM, and the two answers to it. The headshot is 1254x1254 on a
 * light warm-grey backdrop measured at rgb(230,220,218). The card ground is
 * #0a0a0b. Dropped in untreated, a third of the card is near-white, which is
 * the opposite of every other surface on this site.
 *
 *   fade   — the photo bleeds off the right edge and its left edge dissolves
 *            into the ground, so he emerges out of the dark rather than
 *            sitting on it. The backdrop is also pulled down in brightness so
 *            it reads as a mid-tone; his face is left alone.
 *   framed — the photo stays a clean square behind a cream hairline with an
 *            inset ring, untreated, exactly the treatment the product previews
 *            got when the same question came up about their brightness.
 */
const path = require("path");
const fs = require("fs");
const P = require(require.resolve("puppeteer-core", { paths: [process.cwd()] }));

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, ".qa");
const NAME = "Ayodele Olayinka";
const ROLE = "Frontend Engineer";
const HOST = "olayinka.tech";

const card = (treatment) => `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..125,400;75..125,500&display=swap" rel="stylesheet">
<style>
  @font-face {
    font-family: "General Sans";
    src: url("../src/fonts/GeneralSans-400.woff2") format("woff2");
    font-weight: 400; font-display: block;
  }
  @font-face {
    font-family: "General Sans";
    src: url("../src/fonts/GeneralSans-500.woff2") format("woff2");
    font-weight: 500; font-display: block;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #0a0a0b; overflow: hidden; position: relative; }

  /* A whisper of the field's warmth, so the card is not a flat rectangle.
     Far below the shader's own contrast -- this is a ground, not a fake. */
  .glow {
    position: absolute; inset: 0;
    background: radial-gradient(70% 60% at 62% 42%, #16120f 0%, #0d0c0b 58%, #0a0a0b 100%);
  }

  .copy {
    position: absolute; left: 76px; top: 0; height: 630px; width: 620px;
    display: flex; flex-direction: column; justify-content: center; z-index: 2;
  }
  .role {
    font-family: "General Sans", system-ui, sans-serif; font-weight: 400;
    font-size: 19px; letter-spacing: 0.35em; text-transform: uppercase;
    color: #b4b1a8;
  }
  .name {
    font-family: "Archivo", system-ui, sans-serif; font-weight: 500;
    font-variation-settings: "wdth" 112;
    font-size: 82px; line-height: 1.02; letter-spacing: -0.022em;
    color: #e9e6df; margin-top: 26px;
  }
  /* The amber, used once. Same restraint as the page: it is the accent, not a
     decoration, and it appears at the moment of the payoff. */
  .rule { width: 64px; height: 2px; background: #d9a441; margin-top: 34px; }
  .host {
    font-family: "General Sans", system-ui, sans-serif; font-weight: 400;
    font-size: 17px; letter-spacing: 0.3em; text-transform: uppercase;
    color: #b4b1a8; margin-top: 30px;
  }

  ${
    treatment === "fade"
      ? `
  /* Bleeds off the right edge, full height, dissolving leftward. Only the left
     edge needs a mask because the other three run off the card. */
  .photo {
    position: absolute; right: 0; top: 0; width: 560px; height: 630px; z-index: 1;
    background-image: url("../public/headshot.jpg");
    background-size: cover; background-position: 50% 22%;
    /* The backdrop is rgb(230,220,218); unadjusted it is the brightest thing
       on the card by a wide margin. Pulled down so it reads as a mid-tone. */
    filter: brightness(0.72) contrast(1.04) saturate(0.92);
    -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.45) 22%, #000 52%);
            mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.45) 22%, #000 52%);
  }
  /* A second, softer pass along the bottom so the crop never reads as a cut. */
  .photo-veil {
    position: absolute; right: 0; top: 0; width: 560px; height: 630px; z-index: 1;
    background: linear-gradient(to top, #0a0a0b 0%, transparent 26%);
  }`
      : `
  /* Framed: untreated colour behind a cream hairline and an inset ring --
     the treatment the product previews got when the same brightness question
     came up. The photo is allowed to be bright; the frame contains it. */
  .photo-wrap {
    position: absolute; right: 84px; top: 105px; width: 420px; height: 420px; z-index: 1;
    border: 1px solid rgba(233,230,223,0.22);
    box-shadow: inset 0 0 0 1px rgba(233,230,223,0.07);
  }
  .photo {
    position: absolute; inset: 0;
    background-image: url("../public/headshot.jpg");
    background-size: cover; background-position: 50% 20%;
  }`
  }
</style></head>
<body>
  <div class="glow"></div>
  ${
    treatment === "fade"
      ? `<div class="photo"></div><div class="photo-veil"></div>`
      : `<div class="photo-wrap"><div class="photo"></div></div>`
  }
  <div class="copy">
    <div class="role">${ROLE}</div>
    <div class="name">${NAME}</div>
    <div class="rule"></div>
    <div class="host">${HOST}</div>
  </div>
</body></html>`;

(async () => {
  const which = process.argv[2];
  const treatments = which ? [which] : ["fade", "framed"];
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await P.launch({
    executablePath: CHROME,
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });

  for (const t of treatments) {
    const htmlPath = path.join(OUT_DIR, `og-card-${t}.html`);
    fs.writeFileSync(htmlPath, card(t));
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.goto("file:///" + htmlPath.replace(/\\/g, "/"), { waitUntil: "networkidle0" });
    // Webfonts must be in before the shot or the name renders in a fallback.
    await page.evaluateHandle("document.fonts.ready");
    await new Promise((r) => setTimeout(r, 400));

    const out = path.join(OUT_DIR, `og-${t}.png`);
    await page.screenshot({ path: out });
    console.log(`  ${t.padEnd(7)} -> ${out}  ${(fs.statSync(out).size / 1024).toFixed(0)}KB`);

    // Naming a single treatment means "ship this one". Next picks the file up
    // by convention and emits og:image and twitter:image from it, sized and
    // typed, so there is nothing to wire by hand.
    if (which) {
      const shipped = path.join(ROOT, "src/app/opengraph-image.png");
      fs.copyFileSync(out, shipped);
      console.log(`  shipped -> src/app/opengraph-image.png`);
    }
    await page.close();
  }

  await browser.close();
  if (!which) console.log(`\n  To ship one:  node scripts/qa/build-og-card.js <treatment>`);
})().catch((e) => { console.error("ERR", e.stack || e.message); process.exit(1); });
