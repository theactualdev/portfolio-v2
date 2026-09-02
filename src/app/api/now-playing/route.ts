import { NextResponse } from "next/server";
import { getNowPlaying } from "@/lib/spotify";

/**
 * What he is listening to, if anything.
 *
 * Always 200, always the same shape. A visitor's browser must never see an
 * error from this — "not listening", "token expired" and "Spotify is down" are
 * all the same thing as far as the page is concerned: no mark.
 *
 * Cached for 20s at the edge so a page full of pollers costs one upstream call.
 * Spotify's rate limit is generous but this is a portfolio, not a dashboard.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const now = await getNowPlaying();
  return NextResponse.json(now ?? null, {
    headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40" },
  });
}
