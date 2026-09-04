/**
 * The facts the site asserts about itself, in one place.
 *
 * This file exists because they drifted. The stack list lived only in
 * `Stack.tsx`, so when the surface stopped using three.js the marquee went on
 * advertising Three.js — an unbacked claim by that section's own evidence
 * rule, and the same defect as the "four years" line this site already had to
 * remove. Structured data made it worse: schema.org `knowsAbout` would have
 * been a second copy of the same list, drifting independently.
 *
 * So the marquee, the JSON-LD and the metadata all read from here. A change
 * to what he actually uses is one edit, and the page and the machine-readable
 * claims cannot disagree.
 */

/** The apex is canonical; `www` 307s to it. Everything absolute derives here. */
export const SITE_URL = "https://olayinka.tech";

export const SITE_NAME = "Ayodele Olayinka";

/**
 * Name and role, not the bare name.
 *
 * Surveyed against the sites this one is measured against: individual
 * portfolios overwhelmingly title with the bare name (Brittany Chiang, Rauno
 * Freiberg, Emil Kowalski, Paco Coursey, Lee Robinson — 12 to 15 characters),
 * while studios carry a descriptor. The bare name works when the name is
 * already the search term. It is not yet, and the audience includes employers
 * who search by role, so the descriptor stays until the name does that work.
 */
export const SITE_TITLE = "Ayodele Olayinka — Frontend Engineer";

export const SITE_DESCRIPTION =
  "Frontend engineer building interfaces that pay attention. React, Next.js, TypeScript.";

/** The ground colour. Paints the browser chrome on mobile, so it must match. */
export const THEME_COLOR = "#0a0a0b";

export const X_HANDLE = "@theactualdev";

export const SOCIALS = [
  { label: "GitHub", href: "https://github.com/theactualdev" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/theactualdev" },
  { label: "X", href: "https://x.com/theactualdev" },
] as const;

/**
 * EVIDENCE RULE: nothing appears here that is not either on his resume or
 * demonstrably used in something he shipped. An unbacked name is the same
 * defect as the "four years" claim this site already had to remove — and it is
 * the one a peer is most likely to ask about in an interview.
 *
 * Resume: TypeScript, JavaScript, React, Next.js, Tailwind CSS, Firebase,
 * MongoDB, Git, Vite, Turbopack, Postman, Figma.
 * Evidenced by the products: Paystack and Prisma (MSE LUX), NestJS (Bleachers),
 * OpenCV.js (FaceBlur).
 * Evidenced by this site: GSAP, WebGL.
 *
 * Three.js was here, evidenced by this site alone. The surface now draws
 * against the raw WebGL API and imports no three, so the evidence is gone and
 * so is the entry. WebGL is if anything better supported than before.
 */
export const STACK_PRIMARY = [
  "TypeScript",
  "React",
  "Next.js",
  "Tailwind CSS",
  "GSAP",
  "WebGL",
] as const;

export const STACK_SECONDARY = [
  "NestJS",
  "Prisma",
  "MongoDB",
  "Firebase",
  "Paystack",
  "OpenCV.js",
  "Vite",
  "Turbopack",
  "Git",
  "Figma",
  "Postman",
] as const;

/**
 * Employment and study, matching `Roles.tsx` and the resume exactly. Month
 * precision is deliberate there and the reasoning carries here: rendering
 * "Nov 2024 - Jan 2025" as "2024-2025" reads as a year or more.
 */
export const CURRENT_ROLE = "Founding Frontend Engineer";
export const CURRENT_ORG = "Nevo Learning";
/** Enrolled, not graduated — `affiliation`, never `alumniOf`. */
export const UNIVERSITY = "University of Lagos";
