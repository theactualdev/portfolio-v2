"use client";

import { useRef } from "react";
import { useSectionReveal } from "@/lib/motion/useSectionReveal";

const BODY = "var(--font-body), system-ui, sans-serif";
const DISPLAY = "var(--font-display), system-ui, sans-serif";

/**
 * Where he has worked — deliberately the quietest section on the page.
 *
 * This is a different object from Products, not the same component with
 * different data: no index numbers, no rules, no hover, nothing to click.
 * Every other row on this site goes somewhere; two of these three have no URL
 * to go to, and pretending otherwise would be worse than admitting it. The
 * difference should be felt rather than explained.
 *
 * Dates carry the month on purpose. Rendering Nov 2024 - Jan 2025 as
 * "2024 - 2025" reads as a year or more, which is the same overstatement the
 * About copy was just corrected for. Short contracts and internships are
 * ordinary; implying they were long is not.
 */
const ROLES = [
  {
    role: "Founding Frontend Engineer",
    org: "Nevo Learning",
    when: "Mar 2026 — Present",
  },
  {
    role: "Software Engineer, Frontend",
    org: "Soft-Web Digital",
    when: "Nov 2024 — Jan 2025",
  },
  {
    role: "Frontend Engineer, Intern",
    org: "MicroBytes IT",
    when: "Mar 2023 — May 2023",
  },
];

export default function Roles() {
  const root = useRef<HTMLDivElement>(null);

  useSectionReveal(root);

  return (
    <div ref={root}>
      <h2 className="sr-only">Work</h2>
      <p
        data-reveal
        className="text-[0.68rem] uppercase tracking-[0.35em] text-ink-muted"
        style={{ fontFamily: BODY }}
      >
        Work
      </p>

      <ul className="mt-10 max-w-[46ch] space-y-9">
        {ROLES.map((r) => (
          <li key={r.org} data-reveal>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <span
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 600,
                  fontStretch: "110%",
                  fontSize: "1.05rem",
                }}
              >
                {r.role}
              </span>
              <span
                className="text-[0.68rem] uppercase tracking-[0.2em] text-ink-muted"
                style={{ fontFamily: BODY }}
              >
                {r.when}
              </span>
            </div>
            <p
              className="mt-1 text-[0.85rem] text-ink-muted"
              style={{ fontFamily: BODY }}
            >
              {r.org}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
