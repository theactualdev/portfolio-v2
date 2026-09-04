/* eslint-disable @typescript-eslint/no-require-imports -- Plain CommonJS QA script, run directly by node and never bundled. */
// Regression sweep over every previously-fixed defect. Runs against the
// PRODUCTION server (window.__qa is stripped there, so everything below is
// read from the DOM or from rendered pixels).
const P = require(require.resolve("puppeteer-core", { paths: [process.cwd()] }));
const sharp = require(require.resolve("sharp", { paths: [process.cwd()] }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const URL = "http://localhost:3010/";
const CH = "C:/Program Files/Google/Chrome/Application/chrome.exe";

// NOTE: domcontentloaded, not networkidle0. /api/now-playing polls Spotify on
// an interval, so the network never goes fully idle and networkidle0 times out.
// Every call site below already sleeps generously after navigating.
const geo = () => ({
  main: Math.round(document.querySelector("main").getBoundingClientRect().height),
  scrollH: document.documentElement.scrollHeight,
});

const crossings = () => {
  const svg = document.querySelector("svg[aria-hidden]");
  const path = document.querySelector("[data-meander-path]");
  if (!svg || !path) return { crossings: -1 };
  const sb = svg.getBoundingClientRect();
  const vb = svg.getAttribute("viewBox").split(" ").map(Number);
  const scale = sb.width / vb[2];
  const pts = [...path.getAttribute("d").matchAll(/([ML]) (-?[\d.]+) (-?[\d.]+)/g)]
    .map((m) => ({ x: +m[2], y: +m[3] }));
  const segs = [];
  for (let i = 1; i < pts.length; i++)
    if (Math.abs(pts[i].x - pts[i - 1].x) < 0.5)
      segs.push({ x: pts[i].x * scale, y0: Math.min(pts[i - 1].y, pts[i].y) * scale, y1: Math.max(pts[i - 1].y, pts[i].y) * scale });
  let hits = 0;
  const walk = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walk.nextNode())) {
    if (!n.textContent.trim()) continue;
    const r = document.createRange();
    r.selectNodeContents(n);
    for (const cr of r.getClientRects()) {
      const top = cr.top + window.scrollY, bot = cr.bottom + window.scrollY;
      for (const s of segs) {
        if (!(s.x > cr.left && s.x < cr.right && s.y1 > top && s.y0 < bot)) continue;
        // Geometry is not paint. A Range still reports rects for text that an
        // overflow:hidden ancestor has clipped away — the marquee scrolls names
        // past its own edge every frame. Ask what is actually painted there.
        const y = Math.max(1, Math.min(window.innerHeight - 1, cr.top + cr.height / 2));
        if (document.elementFromPoint(s.x, y) === n.parentElement) hits++;
      }
    }
  }
  return { crossings: hits };
};

(async () => {
  const b = await P.launch({ executablePath: CH, headless: "new", args: ["--no-sandbox"] });
  const out = {};

  // 1. page-height ratchet: shrink ladder + rotation
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 1200 });
  await p.goto(URL, { waitUntil: "domcontentloaded" });
  await sleep(2200);
  const ladder = [{ vh: 1200, ...(await p.evaluate(geo)) }];
  for (const h of [700, 400, 1000, 500]) {
    await p.setViewport({ width: 1440, height: h });
    await sleep(600);
    ladder.push({ vh: h, ...(await p.evaluate(geo)) });
  }
  out.ratchet = { ladder, deadScrollAnywhere: ladder.some((r) => r.scrollH > r.main + 2) };
  await p.close();

  const ph = await b.newPage();
  await ph.emulate({ viewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
  await ph.goto(URL, { waitUntil: "domcontentloaded" });
  await sleep(2200);
  const portrait = await ph.evaluate(geo);
  await ph.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  await sleep(900);
  const landscape = await ph.evaluate(geo);
  out.rotation = { portrait, landscape, deadScroll: landscape.scrollH - landscape.main };
  await ph.close();

  // 2. spine vs inked text
  out.spine = [];
  for (const w of [320, 360, 390, 414, 767, 768, 1024, 1440]) {
    const q = await b.newPage();
    await q.setViewport({ width: w, height: 900 });
    await q.goto(URL, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    out.spine.push({ w, ...(await q.evaluate(crossings)) });
    await q.close();
  }

  // 3. reveal: no-JS, and nothing stranded at opacity 0 after a deep reload
  const nj = await b.newPage();
  await nj.setJavaScriptEnabled(false);
  await nj.goto(URL, { waitUntil: "domcontentloaded" });
  out.noJs = await nj.evaluate(() => {
    const els = [...document.querySelectorAll("[data-reveal], [data-line]")];
    return { n: els.length, allVisible: els.every((e) => +getComputedStyle(e).opacity === 1) };
  });
  await nj.close();

  const deep = await b.newPage();
  await deep.setViewport({ width: 1440, height: 900 });
  await deep.goto(URL, { waitUntil: "domcontentloaded" });
  await sleep(2000);
  await deep.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await sleep(2500);
  out.deepScroll = await deep.evaluate(() => {
    const hidden = [...document.querySelectorAll("[data-reveal]")]
      .filter((e) => +getComputedStyle(e).opacity < 0.95)
      .map((e) => e.textContent.trim().slice(0, 24));
    return { strandedAtOpacityZero: hidden };
  });
  await deep.close();

  // 4. reduced-motion, flipped mid-session in BOTH directions
  const r = await b.newPage();
  const cdp = await r.createCDPSession();
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await r.setViewport({ width: 1440, height: 900 });
  await r.goto(URL, { waitUntil: "domcontentloaded" });
  await sleep(2200);
  const st = () => r.evaluate(() => ({
    veil: getComputedStyle(document.querySelector("[data-veil]")).opacity,
    h1: getComputedStyle(document.querySelector("h1")).opacity,
  }));
  const asReduced = await st();
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  await sleep(2600);
  const flippedOff = await st();
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await sleep(1800);
  const flippedBack = await st();
  out.reducedFlip = { asReduced, flippedOff, flippedBack };
  await r.close();

  // 5. terminus parks beside the contact block, both modes
  out.terminus = [];
  for (const reduce of [false, true]) {
    const t = await b.newPage();
    if (reduce) {
      const c = await t.createCDPSession();
      await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    }
    await t.setViewport({ width: 1440, height: 900 });
    await t.goto(URL, { waitUntil: "domcontentloaded" });
    await sleep(2200);
    await t.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await sleep(2200);
    out.terminus.push({ reduce, ...(await t.evaluate(() => {
      const h = document.querySelector("[data-meander-head]").getBoundingClientRect();
      const c = document.querySelector("[data-meander-end]").getBoundingClientRect();
      return { headY: Math.round(h.top), block: [Math.round(c.top), Math.round(c.bottom)],
               beside: h.top >= c.top - 60 && h.bottom <= c.bottom + 60 };
    })) });
    await t.close();
  }

  // 6. text contrast, measured against the field the text actually sits on
  //
  // Tokens cannot be checked against #0a0a0b: no text on this page sits on flat
  // ground, it sits on the shader, whose bright structure reaches far above the
  // ground colour. Checking against the token is what let two AA failures
  // through once already.
  //
  // TWO THINGS THIS GETS RIGHT, both learned by getting them wrong:
  //
  // 1. Only GLYPH pixels count. The first version took the brightest pixel in
  //    each element rect, but the footer credit rect is 1179px wide while its
  //    letters occupy ~500px of it. Bright field showing through the whitespace
  //    was counted as if it were behind text, and reported 4.19:1 on a line
  //    that actually measures 7.21:1.
  //
  // 2. The field must be FROZEN. The background is read by hiding the text and
  //    re-photographing, so anything that moves between the two shots is
  //    indistinguishable from a glyph. Against the live field this produced a
  //    bimodal 7.15 / 4.25 split -- the low readings were frames where the
  //    shader had advanced. Frozen, the same measurement returns 7.21 ten times
  //    out of ten with zero variance.
  //
  // Reduced motion is therefore the measurement mode, and it is a fair one:
  // the still frame is the same composition as the live field (mean 13.14 vs
  // 13.26, stddev 8.171 vs 8.115, identical 8-55 range), it is simply not
  // moving.
  {
    const cp = await b.newPage();
    const ccdp = await cp.createCDPSession();
    await ccdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await cp.setViewport({ width: 1440, height: 900 });
    await cp.goto(URL, { waitUntil: "domcontentloaded" });
    await sleep(3000);

    const lumf = (r, g, bl) => {
      const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl);
    };
    const height = await cp.evaluate(() => document.documentElement.scrollHeight);
    let worst = { ratio: 99, text: null, color: null };
    let measured = 0;
    const failures = [];

    for (let y = 0; y < height - 200; y += 850) {
      await cp.evaluate((to) => window.scrollTo(0, to), y);
      await sleep(1600);

      const runs = await cp.evaluate(() => {
        const out = [];
        const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = walk.nextNode())) {
          const t = n.textContent.trim();
          if (!t) continue;
          const el = n.parentElement;
          if (!el || el.closest("[data-veil]")) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) continue;
          out.push({ text: t.slice(0, 28), color: cs.color,
            rect: [Math.max(0, Math.round(r.left)), Math.max(0, Math.round(r.top)),
                   Math.round(r.width), Math.round(r.height)] });
        }
        return out;
      });
      if (!runs.length) continue;

      const withText = await cp.screenshot();
      await cp.evaluate(() => {
        document.querySelectorAll("main, header").forEach((e) => { e.dataset.qaHid = "1"; e.style.visibility = "hidden"; });
      });
      await sleep(150);
      const without = await cp.screenshot();
      await cp.evaluate(() => {
        document.querySelectorAll("[data-qa-hid]").forEach((e) => { e.style.visibility = ""; delete e.dataset.qaHid; });
      });

      const A = await sharp(withText).raw().toBuffer({ resolveWithObject: true });
      const B = await sharp(without).raw().toBuffer({ resolveWithObject: true });
      const ch = A.info.channels, W = A.info.width, H = A.info.height;

      for (const run of runs) {
        const [x0, y0, w, h] = run.rect;
        let brightest = -1;
        for (let yy = y0; yy < Math.min(y0 + h, H); yy++)
          for (let xx = x0; xx < Math.min(x0 + w, W); xx++) {
            const i = (yy * W + xx) * ch;
            const d = Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i+1] - B.data[i+1]) + Math.abs(A.data[i+2] - B.data[i+2]);
            if (d < 40) continue; // not a glyph pixel
            const L = lumf(B.data[i], B.data[i+1], B.data[i+2]);
            if (L > brightest) brightest = L;
          }
        if (brightest < 0) continue; // nothing painted here
        const m = run.color.match(/\d+/g);
        // A colour we cannot parse must fail loudly. Silently skipping is how
        // this pass first reported worstRatio 99 with nothing measured at all.
        if (!m) throw new Error(`unparseable colour: ${run.color}`);
        const fg = lumf(+m[0], +m[1], +m[2]);
        const ratio = (Math.max(fg, brightest) + 0.05) / (Math.min(fg, brightest) + 0.05);
        measured++;
        if (ratio < worst.ratio) worst = { ratio: +ratio.toFixed(2), text: run.text, color: run.color };
        if (ratio < 4.5) failures.push({ text: run.text, color: run.color, ratio: +ratio.toFixed(2) });
      }
    }

    // A pass that measured nothing is not a pass. This check exists because
    // the first run reported worstRatio 99 / belowAA 0 while sampling zero
    // pixels -- a regex typo made every element skip, and the result read as
    // clean. Any future breakage of the same shape fails loudly instead.
    if (measured < 10) {
      throw new Error(`contrast pass measured only ${measured} text runs — the harness is broken, not the page`);
    }

    out.contrast = { measuredOn: "frozen field (reduced motion)", runsMeasured: measured,
      worstRatio: worst.ratio, worstElement: worst.text, worstColor: worst.color,
      belowAA: failures.length, failures: failures.slice(0, 6) };
    await cp.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await b.close();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
