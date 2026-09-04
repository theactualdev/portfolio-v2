import type { MetadataRoute } from "next";
import { SITE } from "./robots";

/**
 * One page, honestly declared.
 *
 * The site is a single scrolling document — About, Work, Products, Stack and
 * Contact are sections of `/`, not routes — so listing their fragment URLs
 * here would be padding a sitemap with entries that resolve to the same
 * document. The `/dev/*` routes are excluded because they 404 in production,
 * and the résumé PDF is excluded because it is a download reached from the
 * page, not a destination to rank.
 *
 * `lastModified` is the build time, which for a static export is the last time
 * the content actually changed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
