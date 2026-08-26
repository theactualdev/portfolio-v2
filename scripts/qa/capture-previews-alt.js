/* eslint-disable @typescript-eslint/no-require-imports -- Plain CommonJS QA script, run directly by node and never bundled. */
/**
 * Second pass on the product previews: does a DIFFERENT state screenshot better
 * than the landing frame, and is there any public product screen behind the two
 * gates? Answers recorded 2026-08-26:
 *   - Nevo: yes, y=3400 shows a real product panel; the hero is the weaker frame.
 *   - MSE LUX: no. Every route rewrites to /gate (password wall).
 *   - Bleachers: no. Only /waitlist and /login are public; everything else 404s.
 *
 * NOTE: the GPA calculator's filled state lives in capture-gpa-filled.js — it
 * needs a dialog handler, because "Calculate" fires a native alert() that blocks
 * CDP evaluate calls until dismissed.
 *
 * Usage: node scripts/qa/capture-previews-alt.js
 */
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.resolve(__dirname, "../../.qa/previews");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const GATED = [
  { name: "mse-lux", origin: "https://mse-lux-seven.vercel.app", routes: ["/", "/shop", "/products", "/collections", "/home", "/store"] },
  { name: "bleachers", origin: "https://bleachers-lovat.vercel.app", routes: ["/app", "/matches", "/demo", "/login", "/sign-in", "/home", "/dashboard"] },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--hide-scrollbars"],
    protocolTimeout: 30000,
  });
  const newPage = async (dsf = 2) => {
    const p = await browser.newPage();
    await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: dsf });
    p.on("dialog", (d) => d.dismiss());
    return p;
  };

  // (a) Nevo, scrolled into the product demo. Its reveals are scroll-driven, so
  // each frame needs a long settle or it captures half-drawn text.
  {
    const p = await newPage();
    await p.goto("https://nevolearning.com", { waitUntil: "networkidle2", timeout: 60000 });
    await wait(4000);
    for (const y of [1800, 3400, 5000]) {
      await p.evaluate((yy) => window.scrollTo(0, yy), y);
      await wait(3500);
      await p.screenshot({ path: path.join(OUT, `nevo-scroll${y}-full.png`) });
    }
    console.log("[nevo] scrolled frames captured");
    await p.close();
  }

  // (b) Is anything public behind the two gates?
  for (const site of GATED) {
    console.log(`[${site.name}] route probe:`);
    for (const route of site.routes) {
      const p = await newPage(1);
      let status = null, landedOn = null, txt = null;
      try {
        const r = await p.goto(site.origin + route, { waitUntil: "domcontentloaded", timeout: 30000 });
        status = r && r.status();
        await wait(2500);
        landedOn = await p.evaluate(() => location.pathname);
        txt = await p.evaluate(() => (document.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 90));
      } catch (e) {
        status = "ERR " + String(e.message).slice(0, 50);
      }
      console.log("   ", route.padEnd(13), String(status).padEnd(5), "->", String(landedOn).padEnd(13), "|", JSON.stringify(txt));
      await p.close();
    }
  }

  await browser.close();
})();
