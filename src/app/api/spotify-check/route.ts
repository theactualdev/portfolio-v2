import { NextResponse } from "next/server";

/**
 * TEMPORARY. Delete once the Spotify mark is confirmed live.
 *
 * The deployed /api/now-playing returns null while the same credentials work
 * from a laptop, which means the environment is not reaching the function.
 * This reports enough to tell WHICH of the four ways that happens — wrong
 * scope, wrong project, misspelled name, or a pasted value carrying quotes or
 * whitespace — while deliberately exposing no secret material: presence,
 * length, and a shape check only. The token call reports its HTTP status and
 * Spotify's own error code, both of which are public failure modes.
 */
export const dynamic = "force-dynamic";

const shape = (v: string | undefined) => ({
  present: !!v,
  length: v?.length ?? 0,
  padded: v !== v?.trim(),
  quoted: !!v && /^["']|["']$/.test(v),
});

export async function GET() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;

  const vars = {
    SPOTIFY_CLIENT_ID: shape(id),
    SPOTIFY_CLIENT_SECRET: shape(secret),
    SPOTIFY_REFRESH_TOKEN: shape(refresh),
  };

  // Names that look like near-misses of the three we want, so a typo in the
  // dashboard shows up as a name rather than staying invisible.
  const spotifyish = Object.keys(process.env).filter((k) => /SPOTI/i.test(k));

  let token: unknown = "not attempted";
  if (id && secret && refresh) {
    try {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        },
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
        cache: "no-store",
      });
      const body = await res.text();
      token = res.ok
        ? { status: res.status, issued: body.includes("access_token") }
        : { status: res.status, error: body.slice(0, 160) };
    } catch (e) {
      token = { threw: String(e).slice(0, 160) };
    }
  }

  return NextResponse.json(
    { vars, spotifyish, token, region: process.env.VERCEL_REGION ?? null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
