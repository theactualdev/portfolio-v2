"use client";

import { useEffect, useState } from "react";

type Track = { track: string; artist: string; url: string };

/**
 * A third mark in the masthead — and it exists ONLY while he is actually
 * playing something.
 *
 * That is the whole idea. The feature has no empty state, no "nothing playing"
 * placeholder, no greyed-out widget: when he is not listening, the header is
 * precisely the header that ships without this. Absence is the resting state,
 * so there is nothing to look broken.
 *
 * It is deliberately not a Spotify component. No green, no album art, no
 * equalizer bars — those would be a second brand on a page with exactly one
 * accent colour. It is the artist's name in the same 0.6rem tracked caps as the
 * marks beside it, behind a single cream tick. Somebody who looks twice notices
 * it changed; nobody else notices it at all.
 *
 * Spotify's terms require attribution linking back, which the anchor provides.
 *
 * Carries no [data-line]: the ceremony's gating hides those until it reveals
 * them, and this can mount long after the ceremony has finished. It fades in on
 * its own instead.
 */
export default function NowPlaying() {
  const [now, setNow] = useState<Track | null>(null);

  useEffect(() => {
    let alive = true;
    let timer = 0;

    const poll = async () => {
      // Don't poll a tab nobody is looking at.
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch("/api/now-playing");
          const data: Track | null = res.ok ? await res.json() : null;
          if (alive) setNow(data && data.track ? data : null);
        } catch {
          if (alive) setNow(null);
        }
      }
      if (alive) timer = window.setTimeout(poll, 30_000);
    };

    poll();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        window.clearTimeout(timer);
        poll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!now) return null;

  return (
    <a
      href={now.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${now.track} — ${now.artist}`}
      className="hidden items-baseline gap-2 whitespace-nowrap text-ink-muted transition-colors hover:text-ink sm:flex"
    >
      {/* The tick. One cream hairline, the same weight as the spine. */}
      <span aria-hidden="true" className="inline-block h-[0.62em] w-px bg-ink/40" />
      <span className="sr-only">Currently listening to </span>
      {/* Caps at 0.35em tracking are roughly twice as wide as a `ch`, so these
          limits are in rem. Measured with a punishing 61-character track name:
          no collision at 640-1920, and 684px still free at 1440. */}
      <span className="max-w-[10rem] truncate lg:max-w-[17rem]">{now.artist || now.track}</span>
      {now.artist && now.track && (
        // The song only appears from lg up. Below that the masthead is already
        // carrying two marks and the artist alone is the useful half — at 640px
        // the three of them left just 12px of air.
        <span className="hidden items-baseline gap-2 lg:flex">
          {/* The divider is the same hairline as the tick rather than a pipe
              glyph — the page has no other punctuation like that, and a rule at
              the spine's weight is already its vocabulary. */}
          <span aria-hidden="true" className="inline-block h-[0.5em] w-px bg-ink/25" />
          <span className="sr-only"> — </span>
          {/* Track names run long ("WICKED CITY (feat. Gus Dapperton)"), and
              this sits in a fixed masthead beside two other marks, so it
              truncates rather than shoving them. The title attribute and the
              accessible name both carry the full text. */}
          <span className="max-w-[20rem] truncate">{now.track}</span>
        </span>
      )}
    </a>
  );
}
