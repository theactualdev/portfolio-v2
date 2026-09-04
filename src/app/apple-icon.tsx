import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * The iOS home-screen icon.
 *
 * The mark is the meander — the hairline spine that runs down the page and
 * turns once per section — rather than initials or a wordmark. It is the one
 * piece of the site's identity that survives being shrunk to a 60px tile,
 * because it is a shape rather than type.
 *
 * Drawn rather than photographed so it needs no font: `ImageResponse` would
 * otherwise have to embed a face to set even two letters, and General Sans is
 * a licensed file we self-host. Stroke weight is deliberately far heavier than
 * the site's real hairline — at tile size the page's actual 1px line
 * disappears entirely, so this is the motif, not a screenshot of it.
 *
 * Amber on ground: the same two colours the footer finale resolves to.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0b",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 180 180">
          <path
            d="M62 26 V74 H118 V106 H62 V154"
            fill="none"
            stroke="#d9a441"
            strokeWidth="12"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
