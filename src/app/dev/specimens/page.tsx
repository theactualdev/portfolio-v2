import { notFound } from "next/navigation";
import "./fonts.css";

/**
 * Typography specimen round (dev only).
 *
 * Five candidate display/utility pairings, each rendered as an identical
 * composition in its own exactly-100vh block so the capture harness gets one
 * clean screenshot per pairing at scroll fractions 0/0.25/0.5/0.75/1.
 *
 * Blocks are labelled by letter only — the face names live in the report, not
 * on screen, so the pick is made on how the type looks rather than on brand
 * recognition.
 */

type Pairing = {
  id: string;
  display: string;
  body: string;
  /** Display faces differ in optical weight; match perceived heft, not numbers. */
  displayWeight: number;
  /** Archivo is variable — expand it via the wdth axis. */
  stretch?: string;
  /** Per-face optical correction so no pairing is handicapped by tracking. */
  tracking: string;
};

const PAIRINGS: Pairing[] = [
  { id: "A", display: "Clash Display", body: "General Sans", displayWeight: 700, tracking: "-0.03em" },
  { id: "B", display: "Cabinet Grotesk", body: "General Sans", displayWeight: 800, tracking: "-0.025em" },
  { id: "C", display: "Zodiak", body: "General Sans", displayWeight: 700, tracking: "-0.02em" },
  { id: "D", display: "Sentient", body: "Supreme", displayWeight: 700, tracking: "-0.015em" },
  { id: "E", display: "Archivo", body: "Archivo", displayWeight: 800, stretch: "125%", tracking: "-0.02em" },
];

const GOOGLE_ARCHIVO =
  "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&display=swap";

export default function Specimens() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={GOOGLE_ARCHIVO} />

      {PAIRINGS.map((p) => (
        <section
          key={p.id}
          className="h-screen w-full overflow-hidden bg-ground text-ink flex flex-col justify-center px-[7vw]"
          style={{ fontFamily: `"${p.body}", system-ui, sans-serif` }}
        >
          {/* eyebrow + rule: the same "HI, I'M" beat the real hero opens on */}
          <div className="flex items-center gap-4 text-ink-muted">
            <span className="text-[0.7rem] tracking-[0.35em] uppercase">Pairing {p.id}</span>
            <span className="h-px w-16 bg-current opacity-40" />
          </div>

          <h1
            className="mt-6 uppercase leading-[0.82]"
            style={{
              fontFamily: `"${p.display}", system-ui, sans-serif`,
              fontWeight: p.displayWeight,
              fontStretch: p.stretch,
              letterSpacing: p.tracking,
              fontSize: "clamp(3rem, 10.5vw, 9.5rem)",
            }}
          >
            Ayodele
            <br />
            Olayinka
          </h1>

          <div className="mt-10 flex flex-wrap items-baseline gap-x-10 gap-y-2 text-ink-muted">
            <span className="text-xs tracking-[0.25em] uppercase">Selected work — 01</span>
            <span className="text-xs tracking-[0.25em] uppercase">Lagos, NG</span>
            <span className="text-xs tracking-[0.25em] uppercase">Available</span>
          </div>

          <p className="mt-6 max-w-[46ch] text-[1.05rem] leading-relaxed text-ink-muted">
            Frontend engineer building fast, elegant interfaces. The palette stays
            deliberately quiet — the surface does the talking, and the type has to
            hold the page on its own.
          </p>

          {/* accent candidates, shown against the real ground colour */}
          <div className="mt-10 flex items-center gap-4">
            <span className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-ground">
              Accent A
            </span>
            <span className="rounded-full bg-accent-alt px-5 py-2 text-sm font-medium text-ground">
              Accent B
            </span>
            <span className="text-sm text-accent underline underline-offset-4">
              a link in accent A
            </span>
          </div>
        </section>
      ))}
    </>
  );
}
