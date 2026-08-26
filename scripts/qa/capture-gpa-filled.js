/* eslint-disable @typescript-eslint/no-require-imports -- Plain CommonJS QA script, run directly by node and never bundled. */
/** Does the GPA calculator screenshot better with real data in it? */
const puppeteer = require("puppeteer-core");
const path = require("path");
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.resolve(__dirname, "../../.qa/previews");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--hide-scrollbars"],
    protocolTimeout: 30000,
  });
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  const dialogs = [];
  p.on("dialog", async (d) => {
    dialogs.push({ type: d.type(), message: d.message() });
    await d.dismiss();
  });

  await p.goto("https://theactual-gpa.vercel.app", { waitUntil: "networkidle2", timeout: 60000 });
  await wait(2500);

  // Inspect the real DOM shape before touching it.
  const shape = await p.evaluate(() => ({
    inputs: [...document.querySelectorAll("input")].map((i) => ({ ph: i.placeholder, type: i.type, cls: i.className.slice(0, 60) })),
    selects: [...document.querySelectorAll("select")].map((s) => ({ opts: [...s.options].map((o) => o.value).slice(0, 12) })),
    buttons: [...document.querySelectorAll("button")].map((b) => b.textContent.replace(/\s+/g, " ").trim()),
  }));
  console.log("SHAPE", JSON.stringify(shape, null, 1));

  const rows = [
    ["Operating Systems", "3", 1],
    ["Data Structures", "4", 0],
    ["Discrete Mathematics", "2", 2],
  ];

  for (let i = 0; i < rows.length; i++) {
    const [name, units, gradeIdx] = rows[i];
    if (i > 0) {
      const btns = await p.$$("button");
      for (const b of btns) {
        const t = await p.evaluate((e) => e.textContent.trim(), b);
        if (/add course/i.test(t)) { await b.click(); break; }
      }
      await wait(600);
    }
    const nameInputs = await p.$$('input[placeholder="Course Name"]');
    const unitInputs = await p.$$('input[placeholder="Units"]');
    const selects = await p.$$("select");
    if (nameInputs[i]) { await nameInputs[i].click(); await nameInputs[i].type(name, { delay: 12 }); }
    if (unitInputs[i]) { await unitInputs[i].click(); await unitInputs[i].type(units, { delay: 20 }); }
    if (selects[i]) {
      const opts = await p.evaluate((s) => [...s.options].map((o) => o.value).filter(Boolean), selects[i]);
      if (opts.length) await selects[i].select(opts[Math.min(gradeIdx, opts.length - 1)]);
    }
    await wait(300);
  }

  await wait(600);
  await p.screenshot({ path: path.join(OUT, "gpa-filled-full.png") });

  const btns = await p.$$("button");
  for (const b of btns) {
    const t = await p.evaluate((e) => e.textContent.trim(), b);
    if (/^calculate$/i.test(t)) { await b.click(); break; }
  }
  await wait(2500);
  await p.screenshot({ path: path.join(OUT, "gpa-result-full.png") });

  const after = await p.evaluate(() => (document.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 500));
  console.log("DIALOGS", JSON.stringify(dialogs));
  console.log("TEXT AFTER", JSON.stringify(after));
  await browser.close();
})();
