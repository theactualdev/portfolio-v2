import type { Metadata } from "next";
import QaHooks from "@/components/dev/QaHooks";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { archivo, generalSans } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ayodele Olayinka — Frontend Engineer",
  description:
    "Frontend engineer building interfaces that pay attention. React, Next.js, TypeScript.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${generalSans.variable} ${archivo.variable} antialiased`}
      /*
       * The head script below adds `js` to this element before React hydrates,
       * so the client className provably differs from the server one and React
       * logs a hydration mismatch. Measured A/B against the dev server: with
       * the script 1 console error, without it 0. React deliberately does not
       * patch the root element up, so the class survives either way — this
       * only silences the warning, and only for <html>'s own attributes; it
       * does not extend to descendants. It is the other half of the
       * theme-switcher pattern the script is borrowed from.
       */
      suppressHydrationWarning
    >
      {/*
       * A raw inline script, NOT next/script. `beforeInteractive` guarantees
       * ordering relative to hydration, not relative to first paint — and this
       * class must exist before the sections paint or the ceremony flashes.
       * An inline head script executes during head parsing, before any body
       * content paints. Same pattern theme-switchers use, for the same reason.
       */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add("js")`,
          }}
        />
      </head>
      <body>
        {process.env.NODE_ENV !== "production" && <QaHooks />}
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
