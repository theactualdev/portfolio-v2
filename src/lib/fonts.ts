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

/** Display face — variable, with the width axis the hero uses at 115%. */
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});
