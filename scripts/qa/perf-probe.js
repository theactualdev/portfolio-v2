/* eslint-disable @typescript-eslint/no-require-imports -- Plain CommonJS QA script, run directly by node and never bundled. */
/** Usage: node scripts/qa/perf-probe.js <url> [cpuThrottle] [width] [height] */
const puppeteer = require("puppeteer-core");
const [url, cpu = "1", w = "1600", h = "1000"] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
  const p = await b.newPage();
  // --touch emulates a real mobile device (isMobile + hasTouch), which makes
  // Chrome report `hover: none` / `pointer: coarse` natively. Without it the
  // probe measures the pointer-device code path on a "mobile" run.
  if (process.argv.includes("--touch")) {
    await p.emulate({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      viewport: { width: +w, height: +h, deviceScaleFactor: 3, isMobile: true, hasTouch: true, isLandscape: false },
    });
  } else {
    await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
  }
  // Emulate a touch device when asked, so pointer-capability gating in the
  // page is actually exercised. Without this the probe runs desktop Chrome at
  // a small viewport, matchMedia("(hover: hover)") stays true, and the
  // expensive pointer-device path is measured on a "mobile" run.
  const c = await p.target().createCDPSession();
  if (+cpu > 1) await c.send("Emulation.setCPUThrottlingRate", { rate: +cpu });
  await p.goto(url, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1500));

  // sweep the pointer so the surface is actually doing work
  const sweep = (async () => {
    for (let i = 0; i < 100; i++) {
      await p.mouse.move(200 + (i % 50) * 20, 300 + Math.sin(i / 5) * 150);
      await new Promise((r) => setTimeout(r, 100));
    }
  })();

  const stats = await p.evaluate(
    () =>
      new Promise((res) => {
        const gaps = []; let last = performance.now(); const t0 = last;
        const tick = (now) => {
          gaps.push(now - last); last = now;
          if (now - t0 < 10000) requestAnimationFrame(tick);
          else {
            gaps.sort((a, b) => a - b);
            res({
              frames: gaps.length,
              fps: +(gaps.length / ((now - t0) / 1000)).toFixed(1),
              medianGap: +gaps[Math.floor(gaps.length / 2)].toFixed(2),
              p95Gap: +gaps[Math.floor(gaps.length * 0.95)].toFixed(2),
              maxGap: +gaps[gaps.length - 1].toFixed(2),
            });
          }
        };
        requestAnimationFrame(tick);
      })
  );
  await sweep;
  console.log(JSON.stringify({ url, cpuThrottle: +cpu, viewport: `${w}x${h}`, ...stats }, null, 2));
  await b.close();
})();
