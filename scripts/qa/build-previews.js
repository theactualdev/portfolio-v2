/* eslint-disable @typescript-eslint/no-require-imports -- Plain CommonJS build script, run directly by node and never bundled. */
/**
 * Capture each product's best frame and emit the WebP assets the Products
 * hover-preview uses, into public/previews/.
 *
 * Re-run when a product's site changes:  node scripts/qa/build-previews.js
 *
 * FRAME CHOICE IS DELIBERATE, per product, and not a global rule — a survey of
 * all five found that only Nevo has a real product screen above the fold, and
 * it is not on its hero:
 *
 *   nevo      scrollY 3400 — an actual lesson UI, not marketing type. The hero
 *               is a headline on cream and says nothing about the product.
 *   mse-lux   the password gate. It is the only public surface; the storefront
 *               is closed. Captured honestly rather than faked.
 *   bleachers the waitlist. Same situation. It is also the ONLY dark site of
 *               the five, so it needs a frame or it vanishes into the ground.
 *   gpa       filled with real course rows, because the empty card is a form in
 *               a void. (Its result is a native alert() and cannot be captured.)
 *   faceblur  the dropzone, which is the whole product surface.
 *
 * Nevo's reveals are scroll-driven, so it gets a long settle — capturing too
 * early catches text mid-animation.
 */
const path = require("path");
const fs = require("fs");
const sharp = require(require.resolve("sharp", { paths: [process.cwd()] }));
const P = require(require.resolve("puppeteer-core", { paths: [process.cwd()] }));

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.resolve(process.cwd(), "public/previews");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SHOTS = [
  { slug: "nevo", url: "https://nevolearning.com", scrollY: 3400, settle: 3500 },
  { slug: "mse-lux", url: "https://mse-lux-seven.vercel.app", scrollY: 0, settle: 2500 },
  { slug: "bleachers", url: "https://bleachers-lovat.vercel.app", scrollY: 0, settle: 2500 },
  { slug: "gpa", url: "https://theactual-gpa.vercel.app", scrollY: 0, settle: 2000, fill: true },
  { slug: "faceblur", url: "https://faceblur-v3.vercel.app", scrollY: 0, settle: 2500 },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await P.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const report = [];

  for (const s of SHOTS) {
    const p = await b.newPage();
    await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    try {
      await p.goto(s.url, { waitUntil: "networkidle2", timeout: 45000 });
    } catch {
      console.warn(`  ${s.slug}: navigation slow, continuing with what rendered`);
    }
    await sleep(s.settle);

    if (s.fill) {
      // A form in a void photographs as a void. Put real rows in it first.
      await p.evaluate(() => {
        document.querySelectorAll("input").forEach((el, i) => {
          const v = ["Data Structures", "3"][i % 2] ?? "3";
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )?.set;
          setter?.call(el, v);
          el.dispatchEvent(new Event("input", { bubbles: true }));
        });
      });
      await sleep(600);
    }

    if (s.scrollY) {
      await p.evaluate((y) => window.scrollTo(0, y), s.scrollY);
      await sleep(s.settle); // scroll-driven reveals need to finish drawing
    }

    const raw = await p.screenshot({ type: "png" });
    await p.close();

    // 3:2, cropped from the top of the frame. 2x for retina, 1x for the rest.
    const at = (w, h) =>
      sharp(raw).resize(w, h, { fit: "cover", position: "top" }).webp({ quality: 78 }).toBuffer();

    const one = await at(560, 373);
    const two = await at(1120, 746);
    fs.writeFileSync(path.join(OUT, `${s.slug}.webp`), one);
    fs.writeFileSync(path.join(OUT, `${s.slug}@2x.webp`), two);

    // Mean luminance tells us how hard each one will glow on #0a0a0b (lum 10).
    const stats = await sharp(one).greyscale().stats();
    report.push({
      slug: s.slug,
      "1x": (one.length / 1024).toFixed(1) + "KB",
      "2x": (two.length / 1024).toFixed(1) + "KB",
      meanLum: stats.channels[0].mean.toFixed(1),
    });
  }

  await b.close();
  console.table(report);
  const total = report.reduce((n, r) => n + parseFloat(r["1x"]), 0);
  console.log(`total 1x: ${total.toFixed(1)}KB  (fetched on intent, not at first load)`);
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
