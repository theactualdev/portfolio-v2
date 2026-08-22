import type { CSSProperties } from "react";

/**
 * Five hero-monument TREATMENTS, not five fonts.
 *
 * First round of this elicitation varied only the typeface and held weight,
 * width, case and scale constant — so three grotesks read as one look and two
 * serifs read as another. At display size the face is the least visible
 * variable; width, weight and case are what the eye actually registers.
 *
 * Each treatment below has a deliberately different silhouette. The body face
 * is held constant (General Sans) so this round decides exactly one thing:
 * what the name looks like.
 */
export type Treatment = {
  id: string;
  /** Shown to the user only after they pick. */
  faces: string;
  /** One-line description of the attitude, for the report. */
  attitude: string;
  text: string;
  style: CSSProperties;
  /** Rendered lowercase/title-case rather than uppercase where it suits. */
  transform?: "uppercase" | "lowercase" | "none";
};

export const TREATMENTS: Treatment[] = [
  {
    id: "A",
    faces: "Anton",
    attitude: "Condensed brutal — tall, tight, poster-like. Maximum name at maximum scale.",
    text: "Ayodele\nOlayinka",
    transform: "uppercase",
    style: {
      fontFamily: '"Anton", system-ui, sans-serif',
      fontWeight: 400,
      letterSpacing: "-0.01em",
      lineHeight: 0.86,
      fontSize: "clamp(3.5rem, 13vw, 12rem)",
    },
  },
  {
    id: "B",
    faces: "Archivo Expanded (wdth 125)",
    attitude: "Expanded monumental — wide, cinematic, fills the frame edge to edge.",
    text: "Ayodele\nOlayinka",
    transform: "uppercase",
    style: {
      fontFamily: '"Archivo", system-ui, sans-serif',
      fontWeight: 800,
      fontStretch: "125%",
      letterSpacing: "-0.03em",
      lineHeight: 0.88,
      fontSize: "clamp(2.6rem, 9vw, 8rem)",
    },
  },
  {
    id: "C",
    faces: "Bodoni Moda",
    attitude: "High-contrast didone — editorial luxury, thick-to-hairline strokes, title case.",
    text: "Ayodele\nOlayinka",
    transform: "none",
    style: {
      fontFamily: '"Bodoni Moda", Georgia, serif',
      fontWeight: 700,
      letterSpacing: "-0.005em",
      lineHeight: 0.92,
      fontSize: "clamp(3.2rem, 11vw, 10rem)",
    },
  },
  {
    id: "D",
    faces: "Chillax Light",
    attitude: "Light and airy — hairline weight at huge scale, lowercase. Quiet confidence.",
    text: "ayodele\nolayinka",
    transform: "lowercase",
    style: {
      fontFamily: '"Chillax", system-ui, sans-serif',
      fontWeight: 200,
      letterSpacing: "-0.02em",
      lineHeight: 0.94,
      fontSize: "clamp(3.4rem, 12vw, 11rem)",
    },
  },
  {
    id: "E",
    faces: "Syne Extrabold",
    attitude: "Characterful geometric — odd proportions, contemporary art-gallery energy.",
    text: "Ayodele\nOlayinka",
    transform: "uppercase",
    style: {
      fontFamily: '"Syne", system-ui, sans-serif',
      fontWeight: 800,
      letterSpacing: "-0.02em",
      lineHeight: 0.9,
      fontSize: "clamp(3rem, 10.5vw, 9.5rem)",
    },
  },
];

export const GOOGLE_FONTS =
  "https://fonts.googleapis.com/css2?family=Anton" +
  "&family=Archivo:wdth,wght@62..125,100..900" +
  "&family=Bodoni+Moda:opsz,wght@6..96,400..900" +
  "&family=Syne:wght@400..800" +
  "&display=swap";
