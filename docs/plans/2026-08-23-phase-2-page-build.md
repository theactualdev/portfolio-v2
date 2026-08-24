# Portfolio Rebuild — Phase 2: The Real Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Load the `portfolio-direction`, `motion-language`, and `visual-qa` skills before any task.
>
> **Revision 2** — revised after adversarial review (6 confirmed defects, 4 of them major; 2 more verified directly). Phase 1's rev 1 contained 8 blockers found by adversarial review — treat this plan as fallible the same way. Every interface it consumes was verified against the repo on 2026-08-23 (commit `1f42727`).

**Goal:** `/` becomes the real site: entry ceremony → hero (surface-first, small name) → about → work (five link-out rows) → footer finale, with the meander line as the page's spine, the meander cursor, self-hosted fonts, lazy-loaded WebGL, no-JS and reduced-motion parity, and the perf budget held. Ends with the Vercel preview live.

**Architecture:** The prototypes at `/dev/hero` and `/dev/meander` are the approved spec — this plan promotes their composition onto `/` and productionises what the prototypes were allowed to fake (CDN fonts, static three import, setState-per-frame amp driving, FOUC-unsafe ceremony).

**Tech Stack:** already installed — Next 16.3.2, React 19.2, Tailwind v4, gsap, lenis, three, @react-three/fiber. Nothing new gets installed except font files.

## Global Constraints

- Locks (from `portfolio-direction`, all user-approved from live prototypes): surface is the hero; ceremony = the field waking, ≤3s, skippable, reduced-motion gets the composed end state instantly; name small; meander cursor; meander line as spine (hairline cream, ONE amber point, never still, never a border); one continuous page; projects link out; footer is the finale where amber pays off; theme never named in copy.
- **ALL COPY IN THIS PLAN IS DRAFT.** It ships marked as good-faith placeholder; Ayodele's copy pass happens in Phase 3. Do not wordsmith beyond what is written here.
- Budgets: first-load JS of `/` ≤ 300KB gz **excluding** the async WebGL chunk (three must NOT be in first-load); LCP ≤ 2.5s; CLS < 0.05; 60fps desktop scroll. Current baseline: 183KB gz before this plan.
- Sections are **transparent** — no `bg-ground`/`bg-elevated` on sections. Phase 1's hard lesson: opaque backgrounds silently occlude the fixed `-z-10` canvas. Text legibility comes from the surface being near-black, not from scrims.
- No component libraries. Conventional commits, no Claude attribution. Gates for every task: `npx next build` · `npm run lint` · `npm run typecheck` · visual-qa capture read when anything visible changed.
- Dev server runs centrally on **:3010** — never start/stop/restart one.
- The `/dev/*` routes stay (they are the design bench). **Only `/dev/specimens` calls `notFound()`; the other three `return null`, which serves HTTP 200 with an app shell.** Task 9 converts them all to real 404s.

## Verified repo facts (measured 2026-08-23 — build on these, do not re-derive)

- `EASE = {enter:"expo.out", move:"power2.inOut", exit:"power2.in"}`, `DUR = {xs:.2,s:.4,m:.7,l:1.1}`, `STAGGER = 0.06`, `prefersReducedMotion()` — all exported from `src/lib/motion/tokens.ts`.
- `SurfaceCanvas` props: `{ amplitude?, hueShift?, still?, stillTime? }`. It self-handles reduced-motion (pins amp/pointer/vel; hue stays live — colour is not motion) and no-WebGL (pre-flight probe → composed CSS radial fallback). DPR capped at 1.
- `GreekCursor` variant `"meander"` is locked; pointer-fine only; state-aware.
- `MeanderLine` builds its path from `[data-meander-section]` boundaries, scrubs `strokeDashoffset` via ScrollTrigger, amber head rides the tip, reduced-motion = pre-drawn. Its head currently HIDES at p≥0.999 — Task 6 changes that to park.
- `qaRegister(tl)` from `src/components/dev/QaHooks.tsx` returns a void disposer; `window.__qa = {scrollTo, seek, freeze, register}`; `window.__lenis` published by `SmoothScroll` (skipped entirely under reduced motion — that IS parity).
- `src/app/dev/specimens/fonts.css` contains the Fontshare CDN `@font-face` blocks for **General Sans 400 and 500** with absolute `https://cdn.fontshare.com/...woff2` URLs — Task 1 harvests them from that file; do not invent URLs.
- Old-site project data (verbatim, these are the real URLs):
  - MSE LUX — live `https://mse-lux-seven.vercel.app` · code `https://github.com/theactualdev/MSE-LUX`
  - Bleachers — live `https://bleachers-lovat.vercel.app` · code `https://github.com/theactualdev/bleachers`
  - Nevo — live `https://nevolearning.com` · code `https://github.com/teslimsadiqnevo/nevo-frontend-2.0`
  - GPA Calculator — live `https://theactual-gpa.vercel.app` · code `https://github.com/theactualdev/theactualGPA`
  - FaceBlur — live `https://faceblur-theactualdev.vercel.app` · code `https://github.com/theactualdev/faceblur`
- Socials: `https://github.com/theactualdev` · `https://www.linkedin.com/in/theactualdev` · `https://x.com/theactualdev` · `mailto:olayinkacodes@gmail.com`.

---

### Task 1: Self-hosted fonts via next/font

**Files:**
- Create: `scripts/fetch-fonts.js`, `src/fonts/` (two woff2 files land here), `src/lib/fonts.ts`
- Modify: `src/app/layout.tsx`, `src/app/globals.css`

**Interfaces:**
- Produces: `generalSans` (variable `--font-body`, weights 400/500) and `archivo` (variable `--font-display`, Google, `wdth` axis) from `src/lib/fonts.ts`; both `.variable` classes applied on `<html>`. All later tasks use `font-family: var(--font-body)` / `var(--font-display)` and never a CDN `<link>`.

- [ ] **Step 1: Harvest the General Sans woff2 files from the URLs already in the repo**

`scripts/fetch-fonts.js`:

```js
/** One-off: downloads General Sans 400/500 woff2 from the CDN URLs already
 *  recorded in src/app/dev/specimens/fonts.css, into src/fonts/. */
const fs = require("fs");
const https = require("https");
const path = require("path");

const css = fs.readFileSync("src/app/dev/specimens/fonts.css", "utf8");
// Blocks are ordered; General Sans appears with font-weight 400 then 500.
const blocks = [...css.matchAll(/font-family: 'General Sans';[\s\S]*?font-weight: (\d+);/g)];
const urls = [...css.matchAll(/font-family: 'General Sans';[\s\S]*?url\('(https:[^']+?\.woff2)'\)/g)];
if (urls.length < 2) { console.error("expected 2 General Sans woff2 urls, got", urls.length); process.exit(1); }

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
```

Run: `node scripts/fetch-fonts.js` → expect two files, each >10KB. Sanity-check the magic bytes: `node -e "const b=require('fs').readFileSync('src/fonts/GeneralSans-400.woff2');console.log(b.slice(0,4).toString())"` → `wOF2`.

- [ ] **Step 2: `src/lib/fonts.ts`**

```ts
import { Archivo } from "next/font/google";
import localFont from "next/font/local";

/** Body face — self-hosted, the two weights the site uses. */
export const generalSans = localFont({
  src: [
    { path: "../fonts/GeneralSans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/GeneralSans-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

/** Display face — variable, with the width axis the hero uses at 115%. */
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});
```

- [ ] **Step 3: Apply in `src/app/layout.tsx`** — and resolve the `h-full` / `min-h-full` pair while here. Phase 1's final review flagged them as inert under Lenis but live under reduced motion (Lenis's stylesheet sets `html.lenis, html.lenis body { height: auto }`). The page is now a long scrolling document in every mode, so both are wrong: **drop `h-full` from `<html>` and `min-h-full` from `<body>`.** Verify after: page height and scrolling unchanged in normal, reduced and no-JS modes. — `<html lang="en" className={`${generalSans.variable} ${archivo.variable} h-full antialiased`}>`. Set page metadata while here: `title: "Ayodele Olayinka — Frontend Engineer"`, `description: "Frontend engineer building interfaces that pay attention. React, Next.js, TypeScript."`.

- [ ] **Step 4: Default the body face in `globals.css`** — add `body { font-family: var(--font-body), system-ui, sans-serif; }` beneath the existing body rule.

- [ ] **Step 5: Verify no font CDN is contacted by `/`** — puppeteer network check:

```bash
node -e "const p=require('puppeteer-core');(async()=>{const b=await p.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});const g=await b.newPage();const bad=[];g.on('request',r=>{const u=r.url();if(u.includes('fontshare')||u.includes('googleapis')||u.includes('gstatic'))bad.push(u)});await g.goto('http://localhost:3010',{waitUntil:'networkidle2'});console.log(bad.length?bad:'no font CDN requests');await b.close();process.exit(bad.length?1:0)})()"
```

Expect exit 0. (`/dev/*` routes may still hotlink — they are dev-only; only `/` matters.)

- [ ] **Step 6: Gates + commit** — `git commit -m "feat: self-host General Sans and Archivo via next/font"`

---

### Task 2: Surface driver channel + lazy WebGL wrapper

The hero prototype drove `amplitude` through setState at 60Hz — a React render per frame. The real page writes a mutable driver object that the R3F frame loop reads directly: zero re-renders. And `three` must leave the first-load bundle: the page mounts the surface through `next/dynamic` with `ssr: false` and a composed CSS placeholder.

**Files:**
- Create: `src/components/surface/surfaceDriver.ts`, `src/components/surface/SurfaceLazy.tsx`
- Modify: `src/components/surface/SurfaceCanvas.tsx`

**Interfaces:**
- Produces: `surfaceDriver: { amp: number; hue: number }` mutable singleton and `REST_AMP = 0.28` from `surfaceDriver.ts`; `<SurfaceLazy />` which mounts the canvas client-side only and reads the driver every frame. Later tasks write `surfaceDriver.amp/.hue` from GSAP callbacks — they never re-render the canvas.

- [ ] **Step 1: `surfaceDriver.ts`**

```ts
/**
 * Mutable per-frame channel between page choreography and the WebGL surface.
 * GSAP writes it inside onUpdate callbacks; SurfacePlane reads it in useFrame.
 * Deliberately NOT React state: 60 writes/second must not mean 60 renders.
 */
export const REST_AMP = 0.28;

export const surfaceDriver = {
  amp: 0, // turbulence 0..1 — ceremony ramps it to REST_AMP, scroll adds on top
  hue: 0, // warmth 0..1 — the footer finale ramps this
};
```

- [ ] **Step 2: teach `SurfacePlane` the driver** — in `SurfaceCanvas.tsx`, add to `Props`: `driver?: { amp: number; hue: number }`. In the `useFrame` body, replace the two reads:

```ts
    const amp = driver ? driver.amp : amplitude;
    const hue = driver ? driver.hue : hueShift;
```

then use `amp`/`hue` where `amplitude`/`hueShift` were used. **Anchor correction:** `hue` is written exactly once, unconditionally, BEFORE the still branch (`u.uHue.value = hueShift;`); the only `amplitude` read is in the `else` branch. There is no hue line inside the still branch — do not add one. With the two consts, `still=true` correctly yields `uAmp=0` (pinned) and `uHue=driver.hue` (live), which is the intended reduced-motion behaviour. Destructure `driver` in `SurfacePlane`'s props and pass it through from `SurfaceCanvas`'s props. No other behaviour changes.

- [ ] **Step 3: `SurfaceLazy.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const SurfaceCanvas = dynamic(() => import("./SurfaceCanvas"), {
  ssr: false,
  // Same visual family as the surface's resting state, so the swap is a
  // cross-fade in feel rather than a pop. Fixed background => zero CLS.
  loading: () => (
    <div
      className="fixed inset-0 -z-10 bg-ground"
      style={{
        backgroundImage:
          // Same warmed values as SurfaceCanvas's no-WebGL fallback — the cool
          // #17161a original was corrected in Phase 1; do not reintroduce it.
          "radial-gradient(60% 45% at 55% 45%, #1b1613 0%, #0f0d0b 55%, #0a0a0b 100%)",
      }}
    />
  ),
});

export default function SurfaceLazy(props: ComponentProps<typeof SurfaceCanvas>) {
  return <SurfaceCanvas {...props} />;
}
```

- [ ] **Step 4: Verify the split** — `npx next build`, then confirm `three` is NOT in `/`'s first-load: the build output's First Load JS for `/` must not jump by ~150KB (record the number in the commit body), and `grep -rl "three" .next/static/chunks/ | head` chunks must not appear in `.next/server/app/index.html`'s script preloads. Also load `http://localhost:3010/dev/spike-surface` once to confirm the canvas still renders after the prop change (visual-qa capture, read it).

- [ ] **Step 5: Gates + commit** — `git commit -m "feat: surface driver channel and lazy webgl wrapper"`

---

### Task 3: Page shell — providers, spine, cursor, sections, no-JS safety

**Files:**
- Modify: `src/app/page.tsx` (full replacement), `src/app/globals.css`, `src/app/layout.tsx`

**Interfaces:**
- Produces: the real page skeleton with `id`/`data-meander-section` per section, `<main id="main">`, a skip link, `SurfaceLazy` + `GreekCursor` + `MeanderLine` mounted, and the `.js` gating class that makes the ceremony FOUC-proof and no-JS-safe. Tasks 4–7 fill the sections in place.

- [ ] **Step 1: `.js` flag before FIRST PAINT**

Use a raw inline script in `<head>`, NOT `next/script`. `beforeInteractive` guarantees ordering relative to hydration, not relative to first paint — and this class must exist before the sections paint or the ceremony flashes. An inline head script executes during head parsing, before any body content paints. Same pattern theme-switchers use, for the same reason.

In `layout.tsx`, add a `<head>` before `<body>`:

```tsx
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add("js")`,
          }}
        />
      </head>
```

Verify it actually beats paint rather than assuming: assert the class is present in a `document-start` evaluation, AND capture `/` at 4x CPU throttle confirming no frame shows un-veiled text.

- [ ] **Step 2: ceremony gating CSS** — append to `globals.css`:

```css
/* --- ceremony gating -----------------------------------------------------
   Without JS nothing is ever hidden: [data-line] elements are visible and no
   veil exists. With JS, lines start hidden and the veil starts opaque, and
   GSAP animates both. Reduced motion overrides back to the composed end
   state so the page is instantly complete. */
.js [data-line] { opacity: 0; transform: translateY(14px); }
[data-veil] { opacity: 0; }
.js [data-veil] { opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .js [data-line] { opacity: 1; transform: none; }
  .js [data-veil] { opacity: 0; }
}

/* --- focus ---------------------------------------------------------------- */
:focus-visible { outline: 1px solid var(--color-accent); outline-offset: 4px; }

/* --- skip link ------------------------------------------------------------ */
.skip-link {
  position: fixed; top: 0.75rem; left: 0.75rem; z-index: 100;
  padding: 0.5rem 0.9rem; background: var(--color-elevated); color: var(--color-ink);
  transform: translateY(-300%); transition: transform 150ms ease-out;
}
.skip-link:focus-visible { transform: none; }
```

- [ ] **Step 3: `page.tsx` skeleton (full replacement)** — client component composing everything; sections empty beyond their labels (Tasks 4–7 fill them):

```tsx
"use client";

import SurfaceLazy from "@/components/surface/SurfaceLazy";
import GreekCursor from "@/components/cursor/GreekCursor";
import MeanderLine from "@/components/meander/MeanderLine";
import { surfaceDriver } from "@/components/surface/surfaceDriver";

export default function Home() {
  return (
    <div className="relative text-ink">
      <a href="#main" className="skip-link" style={{ fontFamily: "var(--font-body)" }}>
        Skip to content
      </a>

      <SurfaceLazy driver={surfaceDriver} />
      <GreekCursor variant="meander" />
      <MeanderLine />

      {/* z-[6]: above every decorative layer (canvas -10, meander 5) but BELOW
          main (10) and header (20) — matching the approved prototype, where the
          lines animate in FRONT of the veil rather than filtered through it. */}
      <div data-veil className="fixed inset-0 z-[6] bg-ground pointer-events-none" />

      <header className="fixed inset-x-0 top-0 z-20 flex items-baseline justify-between px-[6vw] py-6 text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted" style={{ fontFamily: "var(--font-body)" }}>
        <span data-line>theactualdev</span>
        <span data-line>Available for work</span>
      </header>

      <main id="main" className="relative z-10">
        <section id="hero" data-meander-section className="flex min-h-screen flex-col justify-center px-[7vw] md:pl-[calc(6vw+96px)]" />
        <section id="about" data-meander-section className="flex min-h-screen flex-col justify-center px-[7vw] md:pl-[calc(6vw+96px)]" />
        <section id="work" data-meander-section className="flex min-h-screen flex-col justify-center px-[7vw] md:pl-[calc(6vw+96px)]" />
        <section id="contact" data-meander-section className="flex min-h-screen flex-col justify-center px-[7vw] md:pl-[calc(6vw+96px)]" />
      </main>
    </div>
  );
}
```

- [ ] **Step 4: responsive meander jog** — the line's 56px jog is fine ≥768px but crowds a 390px viewport. In `MeanderLine.tsx`, replace the `laneB` line:

```ts
      const laneB = laneA + Math.min(jog, Math.round(window.innerWidth * 0.09));
```

(resize already rebuilds the path, so this is self-correcting.)

- [ ] **Step 5: Verify — scoped by mode, because the veil does not lift until Task 4**

**The veil is opaque in normal mode at the end of this task and that is CORRECT.** The tween lifting it is created by Task 4's Hero. Do NOT 'fix' the `.js [data-veil]` gating to make a capture look right — Task 4 depends on it.

- **Reduced motion:** line present and jogging at boundaries (pre-drawn), veil transparent, header marks visible. The only mode where composition is verifiable now.
- **No JS** (`page.setJavaScriptEnabled(false)`): header marks and section markup render, no veil. The meander needs JS to build its path — its absence here is expected.
- **Normal JS:** assert only the expected intermediate — a uniform ground-coloured (`#0a0a0b`) frame at every scroll position, and no white flash.
- **Cursor:** verify via DOM (`page.evaluate` that `[data-greek-cursor]` is mounted), never via pixels — it is invisible until first pointermove and pointer-fine gated.

Normal-mode line/jog verification lands in Task 4 Step 3, once the veil lifts.

- [ ] **Step 6: Gates + commit** — `git commit -m "feat: real page shell with spine, cursor and no-js-safe ceremony gating"`

---

### Task 4: Hero + entry ceremony

Promotes `/dev/hero` minus its demo apparatus (no key-toggle, no "press 1/2" line, no "hover this link to see it react"). The ceremony drives the surface through `surfaceDriver` — no setState per frame.

**Files:**
- Create: `src/components/sections/Hero.tsx`
- Modify: `src/app/page.tsx` (fill `#hero` by rendering `<Hero />` inside the hero `<section>` — move the section's flex classes onto the section as already written)

**Interfaces:**
- Consumes: `qaRegister`, tokens, `surfaceDriver`/`REST_AMP`.
- Produces: the ceremony timeline (registered with `qaRegister`), skippable on wheel/pointerdown/keydown.

- [ ] **Step 1: `Hero.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { qaRegister } from "@/components/dev/QaHooks";
import { EASE, DUR, STAGGER, prefersReducedMotion } from "@/lib/motion/tokens";
import { surfaceDriver, REST_AMP } from "@/components/surface/surfaceDriver";

const BODY = "var(--font-body), system-ui, sans-serif";
const DISPLAY = "var(--font-display), system-ui, sans-serif";

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      // Composed end state instantly; CSS already shows lines and hides veil.
      surfaceDriver.amp = REST_AMP;
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE.enter } });

      // The field wakes: veil lifts while turbulence breathes in.
      tl.to("[data-veil]", { opacity: 0, duration: DUR.l, ease: EASE.move }, 0);
      tl.to(surfaceDriver, { amp: REST_AMP, duration: DUR.l, ease: EASE.move }, 0);

      // The name arrives small while the material is already alive.
      tl.to("[data-line]", { opacity: 1, y: 0, duration: DUR.m, stagger: STAGGER * 2 }, 0.35);

      const unregister = qaRegister(tl);
      const skip = () => tl.progress(1);
      window.addEventListener("wheel", skip, { once: true, passive: true });
      window.addEventListener("pointerdown", skip, { once: true });
      window.addEventListener("keydown", skip, { once: true });

      return () => {
        unregister();
        window.removeEventListener("wheel", skip);
        window.removeEventListener("pointerdown", skip);
        window.removeEventListener("keydown", skip);
      };
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      <p data-line className="text-[0.72rem] uppercase tracking-[0.35em] text-ink-muted" style={{ fontFamily: BODY }}>
        Ayodele Olayinka&ensp;·&ensp;Frontend Engineer
      </p>
      <h1
        data-line
        className="mt-5 max-w-[24ch] leading-[1.06]"
        style={{ fontFamily: DISPLAY, fontWeight: 700, fontStretch: "115%", letterSpacing: "-0.015em", fontSize: "clamp(1.9rem, 3.2vw, 2.9rem)" }}
      >
        I build interfaces that pay attention.
      </h1>
      <p data-line className="mt-6 max-w-[44ch] text-[1.02rem] leading-relaxed text-ink-muted" style={{ fontFamily: BODY }}>
        React, Next.js, TypeScript. Founding frontend engineer at Nevo.
        Lagos&thinsp;→&thinsp;anywhere.
      </p>
      <p data-line className="mt-10 text-[0.8rem] text-ink-muted" style={{ fontFamily: BODY }}>
        <span className="hidden sm:inline">Go on — move your cursor.</span>
        <span className="sm:hidden">Scroll.</span>
      </p>
    </div>
  );
}
```

Note the ceremony's `[data-veil]`/`[data-line]` selectors are document-wide on purpose: the header marks animate in with the hero lines. The `gsap.set` from the prototype is gone — the `.js` CSS from Task 3 provides the initial hidden state, so there is no flash before hydration.

- [ ] **Step 2: mount it** — in `page.tsx`, `import Hero from "@/components/sections/Hero";` and render `<Hero />` inside the `#hero` section.

- [ ] **Step 3: Verify** — capture with `--frames 0,0.35,0.7,1` (ceremony is qa-registered) plus settled shots, both modes, both viewports; Read all. Reduced mode must show the complete composition in frame 0 territory (no ceremony). Confirm skip works: puppeteer `wheel` event then screenshot — end state.

- [ ] **Step 4: Gates + commit** — `git commit -m "feat: hero with entry ceremony driving the surface"`

---

### Task 5: About section

**Files:**
- Create: `src/components/sections/About.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: motion tokens; the `data-reveal` convention introduced here.
- Produces: `data-reveal` as the section-reveal convention (distinct from the hero-only `data-line`), reused verbatim by Tasks 6 and 7.

- [ ] **Step 1: `About.tsx`** — static, scroll-revealed with the same grammar (DRAFT copy verbatim from the approved prototype):

```tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, DUR, STAGGER, prefersReducedMotion } from "@/lib/motion/tokens";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const BODY = "var(--font-body), system-ui, sans-serif";
const DISPLAY = "var(--font-display), system-ui, sans-serif";

export default function About() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return; // content is visible by default
    const ctx = gsap.context(() => {
      gsap.set("[data-reveal]", { opacity: 0, y: 14 });
      gsap.to("[data-reveal]", {
        opacity: 1, y: 0, duration: DUR.m, ease: EASE.enter, stagger: STAGGER * 2,
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      <p data-reveal className="text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted" style={{ fontFamily: BODY }}>
        About
      </p>
      <p data-reveal className="mt-6 max-w-[34ch] leading-[1.25]" style={{ fontFamily: DISPLAY, fontWeight: 600, fontStretch: "110%", fontSize: "clamp(1.4rem, 2.4vw, 2.1rem)" }}>
        Four years turning specifications into interfaces people actually finish using.
      </p>
      <p data-reveal className="mt-6 max-w-[46ch] text-[1rem] leading-relaxed text-ink-muted" style={{ fontFamily: BODY }}>
        Most recently at Nevo, building an adaptive learning platform from the
        first commit. Before that, e-commerce and event-sourced systems.
      </p>
    </div>
  );
}
```

Note `data-reveal` (scroll-triggered, per-section), distinct from `data-line` (ceremony, hero only) — the ceremony must not grab section content.

- [ ] **Step 2: mount, verify (captures at the section's scroll position, both modes — reduced shows content with no reveal), gates, commit** — `git commit -m "feat: about section"`

---

### Task 6: Work section — five link-out rows

**Files:**
- Create: `src/components/sections/Work.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: motion tokens; `data-reveal` from Task 5; the verified project URLs above.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: `Work.tsx`** — the five rows with the verbatim URLs from the facts block. Primary link = live site; secondary = code. Reveal grammar identical to About.

```tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, DUR, STAGGER, prefersReducedMotion } from "@/lib/motion/tokens";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const BODY = "var(--font-body), system-ui, sans-serif";
const DISPLAY = "var(--font-display), system-ui, sans-serif";

const WORK = [
  { n: "01", name: "MSE LUX", note: "E-commerce — Paystack, Prisma, Next.js", live: "https://mse-lux-seven.vercel.app", code: "https://github.com/theactualdev/MSE-LUX" },
  { n: "02", name: "Bleachers", note: "Event-sourced sports PWA — NestJS, offline-first", live: "https://bleachers-lovat.vercel.app", code: "https://github.com/theactualdev/bleachers" },
  { n: "03", name: "Nevo", note: "Adaptive learning platform — founding engineer", live: "https://nevolearning.com", code: "https://github.com/teslimsadiqnevo/nevo-frontend-2.0" },
  { n: "04", name: "GPA Calculator", note: "Vite, React, TypeScript", live: "https://theactual-gpa.vercel.app", code: "https://github.com/theactualdev/theactualGPA" },
  { n: "05", name: "FaceBlur", note: "In-browser AI face blurring", live: "https://faceblur-theactualdev.vercel.app", code: "https://github.com/theactualdev/faceblur" },
];

export default function Work() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.set("[data-reveal]", { opacity: 0, y: 14 });
      gsap.to("[data-reveal]", {
        opacity: 1, y: 0, duration: DUR.m, ease: EASE.enter, stagger: STAGGER,
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      <p data-reveal className="text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted" style={{ fontFamily: BODY }}>
        Selected work
      </p>
      <ul className="mt-8 max-w-[56ch]">
        {WORK.map((w) => (
          <li key={w.n} data-reveal className="border-t border-ink/10 last:border-b">
            <div className="flex items-baseline gap-6 py-5" style={{ fontFamily: BODY }}>
              <span className="text-[0.7rem] tracking-[0.25em] text-ink-muted">{w.n}</span>
              <a
                href={w.live}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex-1 no-underline"
              >
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-2" style={{ fontFamily: DISPLAY, fontWeight: 600, fontStretch: "110%", fontSize: "1.2rem" }}>
                  {w.name}
                </span>
                <span className="ml-4 hidden text-[0.8rem] text-ink-muted sm:inline">{w.note}</span>
              </a>
              <a href={w.code} target="_blank" rel="noopener noreferrer" className="text-[0.72rem] uppercase tracking-[0.2em] text-ink-muted underline-offset-4 hover:text-accent hover:underline">
                Code
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: mount, verify** — captures; keyboard-tab through all 10 links headless and assert `:focus-visible` outline appears (evaluate `getComputedStyle(document.activeElement).outlineColor` after Tab presses); hover state check on one row.

- [ ] **Step 3: Gates + commit** — `git commit -m "feat: work section with five link-out rows"`

---

### Task 7: Footer finale — warmth ramp, meander terminus, xenia as behaviour

The finale is where the amber pays off: the surface warms (`surfaceDriver.hue` 0 → 0.85 across the section's approach) and the meander line's amber head arrives and **parks** beside the contact block instead of vanishing. Hospitality expressed as behaviour, never as a word.

**Files:**
- Create: `src/components/sections/Contact.tsx`
- Modify: `src/app/page.tsx`, `src/components/meander/MeanderLine.tsx`

**Interfaces:**
- Consumes: `surfaceDriver` (Task 2), `data-reveal` (Task 5), `MeanderLine`'s head element.
- Produces: `surfaceDriver.hue` written on scroll; the parked meander terminus.

- [ ] **Step 1: park the meander head** — in `MeanderLine.tsx`, the head currently hides at completion. Replace the opacity line inside `onUpdate`:

```ts
            head.current.style.opacity = obj.p > 0.002 ? "1" : "0";
```

(the head now rides to the path's end — which is the contact section — and stays.) Under reduced motion keep the current parked-hidden behaviour, but park it AT the end instead of hiding: in the `reduce.matches` branch replace the two lines with:

```ts
        // Kill any trigger from a previous non-reduced build. build() re-runs on
        // motion-preference change and the reduce path never killed it — an
        // orphaned trigger keeps scrubbing the "already drawn" line and drags
        // the head off the terminus we just parked it at.
        trigger?.kill();
        trigger = undefined;
        el.style.strokeDashoffset = "0";
        if (head.current) {
          const end = el.getPointAtLength(len);
          head.current.setAttribute("cx", String(end.x));
          head.current.setAttribute("cy", String(end.y));
          head.current.style.opacity = "1";
        }
```

- [ ] **Step 2: `Contact.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, DUR, STAGGER, prefersReducedMotion } from "@/lib/motion/tokens";
import { surfaceDriver } from "@/components/surface/surfaceDriver";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const BODY = "var(--font-body), system-ui, sans-serif";
const DISPLAY = "var(--font-display), system-ui, sans-serif";

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/theactualdev" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/theactualdev" },
  { label: "X", href: "https://x.com/theactualdev" },
];

export default function Contact() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // The warmth ramp runs in BOTH modes: hue is colour, not motion — the
      // reduced-motion surface keeps hue live by design (see SurfaceCanvas).
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => { surfaceDriver.hue = self.progress * 0.85; },
      });

      if (!prefersReducedMotion()) {
        gsap.set("[data-reveal]", { opacity: 0, y: 14 });
        gsap.to("[data-reveal]", {
          opacity: 1, y: 0, duration: DUR.m, ease: EASE.enter, stagger: STAGGER * 2,
          scrollTrigger: { trigger: root.current, start: "top 70%" },
        });
      }
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      <p data-reveal className="text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted" style={{ fontFamily: BODY }}>
        Contact
      </p>
      <h2 data-reveal className="mt-6 max-w-[20ch] leading-[1.05]" style={{ fontFamily: DISPLAY, fontWeight: 700, fontStretch: "115%", fontSize: "clamp(2rem, 4vw, 3.4rem)" }}>
        The door is open.
      </h2>
      <a data-reveal href="mailto:olayinkacodes@gmail.com" className="mt-8 block w-fit text-accent underline underline-offset-8" style={{ fontFamily: BODY, fontSize: "1.05rem" }}>
        olayinkacodes@gmail.com
      </a>
      <div data-reveal className="mt-10 flex gap-8 text-[0.72rem] uppercase tracking-[0.25em] text-ink-muted" style={{ fontFamily: BODY }}>
        {SOCIALS.map((s) => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
            {s.label}
          </a>
        ))}
      </div>
      <p data-reveal className="mt-16 text-[0.62rem] uppercase tracking-[0.3em] text-ink/60" style={{ fontFamily: BODY }}>
        © 2026 theactualdev
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Verify the payoff** — scroll to the bottom headless, read the capture: field visibly warmer (sample mean R−B delta at bottom vs top of page — must be positive at bottom), amber head parked near the contact block, email link focusable. Reduced mode: warmth still ramps (scroll to bottom, same sample), head parked at terminus.

- [ ] **Step 4: Gates + commit** — `git commit -m "feat: footer finale - warmth ramp and meander terminus"`

---

### Task 8: Scroll-driven turbulence

The sea churns while you travel and settles when you rest — tight and responsive, per the pacing lock.

**Files:**
- Create: `src/components/surface/ScrollTurbulence.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `surfaceDriver`/`REST_AMP` (Task 2), `window.__lenis` (published by `SmoothScroll`).
- Produces: continuous `surfaceDriver.amp` writes. Coexists with Task 4's ceremony by easing toward its target from whatever value the ceremony left.

- [ ] **Step 1: `ScrollTurbulence.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion/tokens";
import { surfaceDriver, REST_AMP } from "@/components/surface/surfaceDriver";

/**
 * Maps scroll velocity to surface turbulence: churn while travelling, settle
 * at rest. Reads Lenis's velocity when smooth scroll is active, falls back to
 * a scroll-delta estimate when it is not (touch, or reduced motion — where
 * the surface pins amp anyway, making this a no-op there).
 */
export default function ScrollTurbulence() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    let lastY = window.scrollY;
    let fallbackVel = 0;
    const onScroll = () => {
      fallbackVel = window.scrollY - lastY;
      lastY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const tick = () => {
      const v = window.__lenis ? (window.__lenis as unknown as { velocity: number }).velocity : fallbackVel;
      fallbackVel *= 0.8; // decay the estimate between scroll events
      const target = Math.min(1, REST_AMP + Math.abs(v) * 0.012);
      // ease toward the target so churn builds and settles rather than snapping
      surfaceDriver.amp += (target - surfaceDriver.amp) * 0.08;
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return null;
}
```

- [ ] **Step 2: mount in `page.tsx`** (beside the other mounts). **Ordering note:** the hero ceremony also writes `surfaceDriver.amp` for its first ~1.1s. The lerp above eases toward `REST_AMP + velocity` from whatever the ceremony left, so there is no fight — but verify visually that the ceremony's breathe-in is not visibly disturbed by an early scroll (scrolling also *skips* the ceremony, which resolves the overlap by design).

- [ ] **Step 3: Verify** — headless: capture at rest, then during a programmatic fast scroll (capture mid-scroll), diff the two field crops — the mid-scroll frame must show more structure change vs its neighbour frames than the at-rest pair (reuse the frame-differencing pattern from `docs/surface-spec.md`). Perf-probe `/` desktop + `--touch`: both must still hold their Phase-1 numbers (60/59.4fps region — record actuals).

- [ ] **Step 4: Gates + commit** — `git commit -m "feat: scroll-driven surface turbulence"`

---

### Task 9: Accessibility hardening pass

No new features — an audit with fixes. Work through this checklist and record each result in the report; fix anything failing on the spot:

- [ ] Landmarks: exactly one `<main>`; header content in a `<header>`; contact section footer line in a `<footer>` element (adjust `page.tsx`/`Contact.tsx` if needed).
- [ ] Heading order. Target outline: one `<h1>` (the hero statement), then one `<h2>` per section. The eyebrow `<p>` elements stay `<p>` — they are labels, not headings, and restyling them would change the design. So: add a visually-hidden `<h2>` to About ("About") and Work ("Selected work"); Contact's "The door is open." is already an `<h2>`. Add a `.sr-only` utility to `globals.css` if one does not exist (`position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0`).
- [ ] Keyboard: tab order reaches skip link → header marks are not focusable (spans) → all 10 work links → email → 3 socials. No trap. `:focus-visible` ring shows on every one (headless Tab-walk assertion).
- [ ] Reduced motion: full-page captures both modes at 4 scroll positions; reduced mode must be a complete composed page — nothing missing, nothing animating (byte-compare two captures 1.5s apart at the same scroll position, allowing only the dither's sub-LSB noise: mean delta < 0.05).
- [ ] Contrast: **already measured — confirm nothing new was introduced rather than re-deriving.** Over `#0a0a0b`: `text-ink` 15.88:1 · `text-ink-muted` **5.59:1 (AA)** · `text-ink/60` **6.05:1 (AA)**. The two alpha variants this plan's first draft used are failures and must never return: `text-ink-muted/80` = **3.94:1** (large-text only) and `text-ink-muted/60` = **2.69:1** (fails outright). `text-ink-muted` needs alpha ≥ 0.90 to hold AA; `text-ink` needs only ≥ 0.55 — which is why muted text carries no alpha and dimmer metadata uses `text-ink/60`. **Grep the diff for `ink-muted/` and fail the task on any match.**
- [ ] `aria-hidden` on decorative layers. Verify in the DOM, and note only two of three are already set: `MeanderLine`'s svg and `GreekCursor`'s root carry it; **`SurfaceCanvas`'s wrapper div does not** — add `aria-hidden="true"` to it (both the canvas wrapper and the no-WebGL fallback div), and to `SurfaceLazy`'s loading placeholder.
- [ ] Zoom: capture at 200% zoom (viewport 800×500, dSF 2 approximates) — no clipped/overlapping text.
- [ ] **Real 404s for the dev bench.** `src/app/dev/hero/page.tsx`, `dev/meander/page.tsx` and `dev/spike-surface/page.tsx` use `if (process.env.NODE_ENV === "production") return null;`, serving an empty HTTP 200. Replace each with `notFound()` (plus `import { notFound } from "next/navigation";`), matching `dev/specimens/page.tsx`.
- [ ] Commit any fixes: `git commit -m "fix: accessibility hardening pass"`

---

### Task 10: Performance verification

Measurement, with fixes only if a budget fails:

- [ ] `npx next build` — record `/`'s First Load JS. **Gate: ≤ 300KB gz** and `three` absent from it (async chunk only). Record the async chunk's size too.
- [ ] Font check: both woff2 served from `/_next/static/media`, `font-display: swap` in the CSS, no CDN requests (re-run Task 1 Step 5 probe).
- [ ] `node scripts/qa/perf-probe.js http://localhost:3010 1 1600 1000` and `... 4 390 844 --touch`. Phase-1 recorded (see `docs/surface-spec.md`): desktop **60.1fps / p95 16.9ms**, mobile touch-emulated at 4x CPU **59.4fps / p95 16.8ms**, blank-page baseline p95 **16.80ms**. Gate: both within **2ms p95** of those. The page now has DOM + ScrollTriggers on top of the surface; if p95 regresses >2ms, profile before shipping (the usual suspect: layout reads in a scroll handler).
- [ ] LCP sanity: with the ceremony hiding text via opacity, LCP should be the hero `h1` at its reveal (~1s). Measure with a PerformanceObserver snippet in a headless run; **gate: < 2.5s** on 4× CPU throttle.
- [ ] Entry ceremony: total ≤ 3s. `window.__qa` exposes only `{scrollTo, seek, freeze, register}` — the timeline registry is module-private, so **there is no runtime duration read**. Assert by construction: `max(DUR.l, 0.35 + (n-1)*(STAGGER*2) + DUR.m)` with `n` = 6 document-wide `[data-line]` nodes (2 header + 4 hero) = `max(1.1, 1.65)` = **1.65s** ≤ 3s. Input-skip already verified in Task 4.
- [ ] Record all numbers in `docs/perf-log.md` (create it, dated table). Commit: `git commit -m "chore: phase 2 performance verification"`

---

### Task 11: Whole-branch review, iPhone pass, Vercel preview

- [ ] Final whole-branch review (read-only reviewer, most capable model available): the full Phase-2 diff against this plan + the direction skill's critique protocol. Fix Critical/Important findings via the review loop.
- [ ] Push `feat/foundation` to a new **private** GitHub repo `portfolio-v2`.
- [ ] **Ayodele (~2 min):** import to Vercel — preview domain only; olayinka.codes DNS stays on v1 until the Phase-3 cutover.
- [ ] Verify the deployed preview: capture `/` (layout parity with local — `__qa` is intentionally absent in prod, so capture falls back to raw scroll); `curl` the four `/dev/*` routes → all 404 (Task 9 made this true; a 200 means that step was skipped); run the reduced-motion capture against the preview.
- [ ] **Ayodele iPhone pass (ship-blocking):** preview URL on the phone — surface tier, scroll feel, ceremony, warmth ramp, tap targets. Findings recorded in the ledger.

## Revision-2 changelog

Fixed after review — all verified against the repo or measured, never recalled:

- **The ceremony veil's z-index was inverted** (z-30, above header and main). The approved prototype puts the veil UNDER the text so lines animate in front of it; at z-30 the first ~60% of every line entrance would have been filtered through a bg-ground scrim, quietly undoing the composition that was approved. Now `z-[6]` — above the canvas and meander, below main.
- **The `.js` flag moved from `next/script` beforeInteractive to a raw inline head script.** beforeInteractive orders against hydration, not first paint; the class must exist before the sections paint or the ceremony flashes.
- **Two WCAG failures were baked in.** Measured over the ground colour: the /80 muted variant is 3.94:1 and the /60 variant is **2.69:1**. Both replaced with passing tokens (muted at full alpha is 5.59:1; ink at 60% is 6.05:1), and Task 9 now greps the diff to keep them from returning.
- **Task 3's normal-mode verification was unsatisfiable** — the veil stays opaque until Task 4 creates the tween that lifts it, so the captures it demanded could not exist. Verification is now scoped by mode, with an explicit warning not to "fix" the gating Task 4 depends on.
- **Task 10 asserted a ceremony duration through an interface that does not exist** (the QA bridge has no registry read). Now asserted by construction: 1.65s, not the ~1.8s originally claimed.
- **Task 11 asserted all four dev routes return 404** — three of them return null, which serves HTTP 200. Task 9 now converts them to real notFound() calls.
- **Task 7's reduced-motion branch left an orphaned ScrollTrigger** that would un-draw the line and drag the parked terminus after a mid-session motion-preference flip.
- Smaller: Task 2's hue anchor was mis-described (there is no hue read inside the still branch); the lazy placeholder reused the cool gradient corrected in Phase 1; Contact's email link needed `block` for its margin to apply; the touch nudge told cursorless users to move a cursor; Task 9's heading-order item was unresolved deliberation rather than an instruction; the h-full/min-h-full pair carried since Phase 1 is finally resolved (both dropped); Tasks 5-8 gained Interfaces blocks; perf citations re-anchored to the recorded Phase-1 numbers.

**Unverified at revision time:** 15 of 25 review verifiers died on a session limit, so their claims are unconfirmed rather than refuted. Everything fixed above was either confirmed by a surviving verifier or re-verified by hand. Two unconfirmed claims worth a second look during execution: skip-link behaviour under Lenis (its `anchors` option goes unused), and whether several verification steps still describe measurement instead of providing runnable code.

## Self-review notes

- Every interface consumed (tokens, qaRegister, __lenis, SurfaceCanvas props, MeanderLine internals, fonts.css URLs) was checked against the repo at `1f42727` before writing; project URLs copied verbatim from the v1 data file.
- Copy is deliberately frozen as DRAFT — no task invents new copy beyond what is printed here.
- Known risk accepted: `next/font/google` `axes: ["wdth"]` syntax and `dynamic({ssr:false})`-in-client-component are believed correct for Next 16.3.2 but are exactly the kind of API fact Phase 1 taught us to distrust — the plan review must verify both against the installed packages before Task 1 dispatches.
- The ceremony/no-JS design (`.js` class via beforeInteractive Script + CSS gating) replaces the prototype's `gsap.set` hiding, which would flash content before hydration on a slow connection.
