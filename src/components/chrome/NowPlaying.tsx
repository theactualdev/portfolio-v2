"use client";

import { useEffect, useState } from "react";

type Track = { track: string; artist: string; url: string; live: boolean };

/**
 * A third mark in the masthead, carrying what he is playing — or, when nothing
 * is playing, the last thing he played.
 *
 * It began as live-only, so that absence was the resting state and there was no
 * empty state to look broken. He asked for it to always show something, which
 * is the better call for a page most people see once: live-only would have been
 * blank for most visitors.
 *
 * The two states are distinguished honestly rather than being passed off as the
 * same thing: a live track gets a solid tick, a past one a dimmer tick, and the
 * accessible name says which it is. Showing a track he finished an hour ago as
 * though he were listening right now would be a small lie the page does not
 * need to tell.
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
      title={`${now.live ? "Listening to" : "Last played"}: ${now.track} — ${now.artist}`}
      className="hidden items-baseline gap-2 whitespace-nowrap text-ink-muted transition-colors hover:text-ink sm:flex"
    >
      {/* The tick. One cream hairline, the same weight as the spine. */}
      <span
        aria-hidden="true"
        className={`inline-block h-[0.62em] w-px ${now.live ? "bg-ink/40" : "bg-ink/20"}`}
      />
      <span className="sr-only">{now.live ? "Currently listening to " : "Last played: "}</span>
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
