import type { Metadata, Viewport } from "next";
import QaHooks from "@/components/dev/QaHooks";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { archivo, generalSans } from "@/lib/fonts";
import {
  CURRENT_ORG,
  CURRENT_ROLE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  SOCIALS,
  STACK_PRIMARY,
  STACK_SECONDARY,
  THEME_COLOR,
  UNIVERSITY,
  X_HANDLE,
} from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  /**
   * Without this Next resolves relative metadata URLs against VERCEL_URL,
   * which is the *.vercel.app deployment host — so every generated og:image
   * and canonical would advertise a hostname that is not the site. The apex
   * is canonical and `www` redirects to it.
   */
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,

  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },

  /**
   * summary_large_image is what every comparable site ships — surveyed, 10 of
   * the 13 that carry cards at all. `summary` renders a small square thumbnail
   * beside the text instead, which wastes the one image anyone will see.
   */
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: X_HANDLE,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

/**
 * themeColor belongs on the viewport export, not on metadata — Next moved it
 * and warns at build time otherwise. It paints the browser chrome around the
 * page on mobile, so on a site this dark, leaving it unset means a white bar
 * above a near-black page.
 */
export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  colorScheme: "dark",
};

/**
 * Structured data, as a single @graph with stable @id values so the Person and
 * the WebSite reference each other rather than floating as two unrelated
 * entities. This is the piece almost nobody ships: of fifteen comparable sites
 * surveyed, exactly one carried a Person schema. It is what search engines and
 * AI answer engines read to decide that a name is an entity rather than a
 * string.
 *
 * Every field is drawn from `@/lib/site`, which the visible page also reads,
 * so the machine-readable claims cannot drift from the rendered ones.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: SITE_NAME,
      url: SITE_URL,
      jobTitle: CURRENT_ROLE,
      description: SITE_DESCRIPTION,
      // Already published in plain text on the contact section, so this
      // exposes nothing the page does not.
      email: "mailto:olayinkacodes@gmail.com",
      worksFor: { "@type": "Organization", name: CURRENT_ORG },
      // Enrolled, not graduated: alumniOf would be a false claim.
      affiliation: { "@type": "CollegeOrUniversity", name: UNIVERSITY },
      knowsAbout: [...STACK_PRIMARY, ...STACK_SECONDARY],
      sameAs: SOCIALS.map((s) => s.href),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_TITLE,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#person` },
    },
  ],
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
            /**
             * The `js` class hides every gated element so the ceremony can
             * reveal them. That is fail-DEADLY on its own: if the bundle never
             * executes — a syntax error on an older engine, a chunk that never
             * arrives, a throw during hydration — nothing ever un-hides it and
             * the visitor gets a permanently blank page. Which is exactly what
             * happened on a real iPhone.
             *
             * So the same script that hides the content also promises to give
             * it back. At 4s (the ceremony is 1.65s) it checks whether the veil
             * actually lifted; if it did not, it hands everything over to CSS.
             * This runs before any of our other JavaScript and depends on none
             * of it.
             */
            __html:
              'document.documentElement.classList.add("js");' +
              'setTimeout(function(){' +
              'var v=document.querySelector("[data-veil]");' +
              'if(!v||getComputedStyle(v).opacity!=="0"){' +
              'document.documentElement.classList.add("ceremony-stalled");}' +
              '},4000);',
          }}
        />
      </head>
      <body>
        {/*
          JSON-LD in the body rather than the head: both are valid per the
          spec and Google reads either, and keeping it out of <head> leaves the
          critical path above untouched by a block that only crawlers consume.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {process.env.NODE_ENV !== "production" && <QaHooks />}
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
