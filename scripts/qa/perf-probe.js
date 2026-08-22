/* eslint-disable @typescript-eslint/no-require-imports -- Plain CommonJS QA script, run directly by node and never bundled. */
/** Usage: node scripts/qa/perf-probe.js <url> [cpuThrottle] [width] [height] */
const puppeteer = require("puppeteer-core");
const [url, cpu = "1", w = "1600", h = "1000"] = process.argv.slice(2);
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--hide-scrollbars"] });
  const p = await b.newPage();
  await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
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
