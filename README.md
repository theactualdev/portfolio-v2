# portfolio-v2

Ground-up rebuild of olayinka.codes, the personal portfolio of Ayodele Olayinka.
Replaces the previous site rather than extending it.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 (CSS-first, no
`tailwind.config.ts`) · GSAP + Lenis.

## Running it

```bash
npm install
npm run dev -- -p 3010     # dev server on http://localhost:3010
```

Production preview:

```bash
npm run build
npx next start -p 3011     # http://localhost:3011
```

## Gates

```bash
npm run build       # next build
npm run lint        # eslint  (next lint does not exist in Next 16)
npm run typecheck   # tsc --noEmit
```

Project conventions and the creative direction live in `CLAUDE.md`.
