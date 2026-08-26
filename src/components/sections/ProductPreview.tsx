"use client";

/**
 * The product preview panel.
 *
 * A survey of all five sites found four of them are bright (mean luminance
 * 233-254 against a ground of 10) and one — Bleachers — is darker than the page
 * itself at 19.8. So the two treatments they need are opposites, and no single
 * filter works across the set.
 *
 * The resolution is to treat none of them. Dimming the bright ones turns Nevo's
 * cream ground to khaki and misrepresents work that genuinely looks like that;
 * lifting Bleachers would misrepresent it the other way. Instead every panel
 * gets the same cream hairline and inset shadow, so each reads as an OBJECT
 * sitting on the page rather than as a hole punched through it — which is also
 * the one treatment that rescues Bleachers, by giving it an edge it does not
 * have on its own.
 *
 * Colours are therefore true. The glow is real and deliberate; it is contained
 * by size and by the frame, not by lying about the pixels.
 */

const ALT: Record<string, string> = {
  nevo: "The Nevo learning platform: a lesson panel with three learner columns and a question input",
  "mse-lux": "The MSE LUX storefront, currently behind a launch gate",
  bleachers: "The Bleachers waitlist page",
  gpa: "The GPA calculator with course rows filled in",
  faceblur: "The FaceBlur upload area",
};

export default function ProductPreview({
  slug,
  className = "",
}: {
  slug: string | null;
  className?: string;
}) {
  return (
    <div className={className} aria-hidden="true">
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[3px] ring-1 ring-ink/15">
        {Object.keys(ALT).map((s) => (
          // All five render, so the first hover has nothing to wait for. They
          // are 21KB total at 1x and lazy, so they cost nothing until the
          // section is near the viewport.
          // eslint-disable-next-line @next/next/no-img-element -- These are
          // pre-sized, pre-encoded WebP at exactly 1x/2x, lazy, and far below
          // the fold; next/image would re-optimise already-optimised bytes and
          // add a loader for no gain. They are never the LCP element.
          <img
            key={s}
            src={`/previews/${s}.webp`}
            srcSet={`/previews/${s}.webp 1x, /previews/${s}@2x.webp 2x`}
            alt={ALT[s]}
            loading="lazy"
            decoding="async"
            width={560}
            height={373}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300 motion-reduce:transition-none ${
              slug === s ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {/* Inset hairline over the image, so a bright frame still reads as an
            edge rather than bleeding into the ground. */}
        <div className="pointer-events-none absolute inset-0 rounded-[3px] ring-1 ring-inset ring-ink/10" />
      </div>
    </div>
  );
}
