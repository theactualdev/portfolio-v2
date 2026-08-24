import { Archivo } from "next/font/google";
import localFont from "next/font/local";

/** Body face — self-hosted, the two weights the site uses. */
export const generalSans = localFont({
  src: [
    { path: "../fonts/GeneralSans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/GeneralSans-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

/**
 * Display face — variable, carrying the width axis the hero widens on.
 * (The exact wdth value is the hero's to set; nothing here asserts one.)
 *
 * preload is OFF deliberately. next/font preloads the latin subset by default,
 * which put 90KB on the wire on `/` for a face nothing rendered — measured at
 * 2.5s on-wire under Fast 3G, on the one page carrying the LCP <= 2.5s budget.
 * The entry ceremony holds the page for 1.65s before display type is legible,
 * which is ample cover for a swap. Revisit only if a display glyph ever needs
 * to be painted in the first frame.
 */
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
  preload: false,
});
