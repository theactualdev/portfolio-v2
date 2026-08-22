@AGENTS.md

# olayinka.codes — rebuild

Award-tier personal portfolio for Ayodele Olayinka (theactualdev). Awwwards-SOTD quality is the floor. One continuous page. Projects link out to repo/live site — there are no case-study pages.

## Direction

The creative direction is locked and lives in the `portfolio-direction` skill — load it before ANY design, visual, motion, or copy decision. Summary for orientation only (the skill is authoritative): dark editorial stage, cursor-aware liquid WebGL surface as the signature, tight responsive choreography, swagger in the details, footer as finale, entry ceremony.

## Stack

Next.js (App Router) · TypeScript · Tailwind v4 · GSAP + Lenis · React Three Fiber (surface material per the `webgl-surface` skill once written). No other UI/animation libraries without explicit discussion.

## Hard rules

- **No component libraries.** No shadcn/ui, Radix themes, Material, DaisyUI, or any styled kit. Every component is bespoke.
- **Keep-out skills for this project:** `premium-frontend-ui`, `minimalist-ui`, `shad-cn`, `material-3`, `ui-ux-pro-max` styling (its a11y checklist is allowed at pre-ship audit only), `mobile-app-ui-design`. Do not invoke them here; their aesthetics are contamination.
- **Visual verification:** any visually observable change goes through the `visual-qa` skill loop before being reported done. The in-app Browser pane cannot screenshot on this machine — do not use it to judge pixels.
- **Motion:** follow the `motion-language` skill. No easing/duration values outside its vocabulary without updating the vocabulary deliberately.
- **Reduced-motion parity:** every animated experience has a designed still counterpart, built in the same PR — never bolted on.
- **iOS Safari is ship-blocking.** WebKit lane + manual iPhone pass at milestones (protocol in `visual-qa`).

## Performance budgets (hard, measured on 4× CPU throttle + Fast 3G unless noted)

- LCP ≤ 2.5s · CLS < 0.05 · INP < 200ms
- Entry ceremony: interactive ≤ 2.5s on desktop broadband; ceremony never blocks input past 3s (skippable by scroll/click)
- JS ≤ 300KB gzipped before the WebGL bundle; WebGL bundle lazy-loaded, page fully usable without it (fallback ladder)
- 60fps scroll on desktop; no main-thread task > 200ms during entry
- Fonts: self-hosted, subset, `font-display: swap` with matched fallback metrics — no layout shift on swap

## Dev conventions

- `window.__qa = { scrollTo, seek, freeze }` hooks exist in dev builds (consumed by visual-qa's capture script); stripped in production.
- GLSL: every uniform documented where declared; every shader has a plain-English header comment explaining the effect and its knobs — the maintainer does not write GLSL.
- Verify with `npm run build` + lint before any commit claim.

## Git

Follow global CLAUDE.md attribution rules (no Claude trailers/footers). Conventional commit prefixes (`feat:`, `fix:`, `refactor:`, `chore:`).

Dev server: port 3010. Prod preview: port 3011.

The dev-only QA bridge is `window.__qa = { scrollTo, seek, freeze, register }` (4 members — `register` lets components enrol GSAP timelines so capture.js can seek them).
