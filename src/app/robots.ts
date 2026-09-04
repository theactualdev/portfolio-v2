import type { MetadataRoute } from "next";

/**
 * The apex is canonical: `www` 307s to it, so every URL advertised here is the
 * one that answers directly. Pointing crawlers at the redirecting host would
 * spend a round trip on every fetch and split the site's identity across two
 * hostnames.
 *
 * `/dev/` is disallowed because those routes exist — they are the surface and
 * type specimens used during the build — and they `notFound()` in production
 * rather than being removed. A crawler has no reason to walk into four 404s.
 */
export const SITE = "https://olayinka.tech";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/dev/" }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
