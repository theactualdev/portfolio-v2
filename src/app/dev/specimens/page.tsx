import { notFound } from "next/navigation";
import { TREATMENTS, GOOGLE_FONTS } from "./treatments";
import "./fonts.css";

/**
 * Contact sheet for the hero-monument round (dev only).
 *
 * All five treatments stacked in one frame so they are compared side by side
 * rather than across five separate screenshots, where everything blurs into
 * "they look the same". Body copy is deliberately absent — this round decides
 * the monument and nothing else.
 */
export default function Specimens() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={GOOGLE_FONTS} />

      <div className="w-full bg-ground text-ink">
        {TREATMENTS.map((t, i) => (
          <section
            key={t.id}
            className="w-full px-[6vw] py-[3.5vh] overflow-hidden"
            style={{
              borderTop: i === 0 ? "none" : "1px solid rgba(233,230,223,0.10)",
            }}
          >
            <div className="flex items-center gap-4 text-ink-muted mb-4">
              <span className="text-[0.65rem] tracking-[0.4em] uppercase">{t.id}</span>
              <span className="h-px w-10 bg-current opacity-30" />
            </div>

            <h2
              style={{ ...t.style, textTransform: t.transform ?? "uppercase", margin: 0 }}
            >
              {t.text.split("\n").map((line, li) => (
                <span key={li} style={{ display: "block" }}>
                  {line}
                </span>
              ))}
            </h2>
          </section>
        ))}
      </div>
    </>
  );
}
