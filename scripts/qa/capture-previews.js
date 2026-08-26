/* eslint-disable @typescript-eslint/no-require-imports -- Plain CommonJS QA script, run directly by node and never bundled. */
/**
 * Capture desktop screenshots of the five linked products, so we can judge
 * whether a hover-preview panel is viable. Writes .qa/previews/<slug>-full.png
 * plus a JSON facts file per site.
 *
 * Usage: node scripts/qa/capture-previews.js
 */
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.resolve(__dirname, "../../.qa/previews");

const SITES = [
  { slug: "nevo", url: "https://nevolearning.com" },
  { slug: "mse-lux", url: "https://mse-lux-seven.vercel.app" },
  { slug: "gpa", url: "https://theactual-gpa.vercel.app" },
  { slug: "faceblur", url: "https://faceblur-v3.vercel.app" },
  { slug: "bleachers", url: "https://bleachers-lovat.vercel.app" },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--hide-scrollbars"],
  });

  const report = [];

  for (const site of SITES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    const consoleErrors = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text().slice(0, 160));
    });

    let status = null;
    let navError = null;
    try {
      const res = await page.goto(site.url, { waitUntil: "networkidle2", timeout: 60000 });
      status = res ? res.status() : null;
    } catch (e) {
      navError = String(e.message).slice(0, 200);
      try {
        // fall back to a laxer wait; some sites keep sockets open forever
        await page.goto(site.url, { waitUntil: "domcontentloaded", timeout: 45000 });
        status = "domcontentloaded-fallback";
      } catch (e2) {
        navError += " | " + String(e2.message).slice(0, 120);
      }
    }

    // settle: fonts, hydration, entry animations
    try {
      await page.evaluate(() => document.fonts && document.fonts.ready);
    } catch {}
    await new Promise((r) => setTimeout(r, 5000));

    const facts = await page.evaluate(() => {
      const txt = (document.body ? document.body.innerText : "").replace(/\s+/g, " ").trim();
      const bg = getComputedStyle(document.body).backgroundColor;
      const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
      const imgs = [...document.images];
      return {
        title: document.title,
        href: location.href,
        bodyBg: bg,
        htmlBg: htmlBg,
        textLen: txt.length,
        textHead: txt.slice(0, 600),
        passwordInputs: document.querySelectorAll('input[type="password"]').length,
        allInputs: document.querySelectorAll("input,textarea,select").length,
        forms: document.forms.length,
        images: imgs.length,
        imagesLoaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
        headings: [...document.querySelectorAll("h1,h2,h3")].slice(0, 8).map((h) => h.textContent.replace(/\s+/g, " ").trim().slice(0, 80)),
        canvases: document.querySelectorAll("canvas").length,
        videos: document.querySelectorAll("video").length,
        docHeight: document.documentElement.scrollHeight,
      };
    }).catch((e) => ({ evalError: String(e.message) }));

    const file = path.join(OUT, `${site.slug}-full.png`);
    await page.screenshot({ path: file, captureBeyondViewport: false });

    report.push({ ...site, status, navError, consoleErrors: consoleErrors.slice(0, 5), ...facts });
    console.log(`[${site.slug}] status=${status} title=${JSON.stringify(facts.title)} textLen=${facts.textLen} pw=${facts.passwordInputs} bg=${facts.bodyBg}`);
    await page.close();
  }

  fs.writeFileSync(path.join(OUT, "facts.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log("\nWrote", OUT);
})();
