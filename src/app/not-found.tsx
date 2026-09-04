import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

const BODY = "var(--font-body), system-ui, sans-serif";
const DISPLAY = "var(--font-display), system-ui, sans-serif";

/**
 * Its own title, rather than the root layout's.
 *
 * Without this the tab on a dead link reads "Ayodele Olayinka — Frontend
 * Engineer", which is a small lie: the page being looked at is not that. The
 * og:image and description are deliberately left inherited, so a broken link
 * someone shares still unfurls as the site rather than as nothing.
 */
export const metadata: Metadata = {
  title: `Not found — ${SITE_NAME}`,
};

/**
 * The 404.
 *
 * Deliberately static: no surface, no ceremony, no spine. This page exists
 * because something went wrong, and the honest response to that is to be
 * legible immediately rather than to perform. It is also the one route a
 * visitor can reach with no JavaScript at all, so nothing here may depend on
 * hydration — the entrance gating in globals.css hides `[data-line]` and
 * `[data-reveal]` until animation runs them, and neither appears below for
 * exactly that reason.
 *
 * The flat ground is not a fallback for the field: it IS the field's amp-0
 * frame, the same colour the surface materialises out of. So this reads as the
 * same room with the lights down, not as a different site.
 */
export default function NotFound() {
  return (
    <main
      id="main"
      className="flex min-h-screen flex-col justify-center bg-ground px-[7vw] text-ink"
    >
      <p
        className="text-[0.6rem] uppercase tracking-[0.18em] text-ink-muted sm:text-[0.68rem] sm:tracking-[0.35em]"
        style={{ fontFamily: BODY }}
      >
        404
      </p>

      <h1
        className="mt-6 text-[clamp(2.4rem,7vw,4.5rem)] leading-[1.04] tracking-[-0.02em]"
        style={{ fontFamily: DISPLAY }}
      >
        Nothing here.
      </h1>

      <p
        className="mt-6 max-w-[42ch] text-[0.95rem] leading-relaxed text-ink-muted sm:text-base"
        style={{ fontFamily: BODY }}
      >
        This page does not exist. It may have been moved, or the link may be
        wrong.
      </p>

      {/*
        A real anchor, not a button that pushes history: this is frequently the
        first page a visitor lands on from a stale link, and there is nothing
        to go "back" to.
      */}
      <Link
        href="/"
        className="mt-10 w-fit border-b border-accent/40 pb-1 text-[0.95rem] text-accent transition-colors hover:border-accent hover:text-accent-alt sm:text-base"
        style={{ fontFamily: BODY }}
      >
        Back to the start
      </Link>
    </main>
  );
}
