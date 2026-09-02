import "server-only";

/**
 * Spotify, server side only.
 *
 * Every function here returns null rather than throwing. Nothing about this
 * feature is important enough to break a page over: if the token has lapsed,
 * the API is down, or he simply is not listening, the site should look exactly
 * as it does without it.
 *
 * The refresh token expires 6 months after authorisation (Spotify changed this
 * on 18 June 2026, and refreshing an access token does NOT extend the clock).
 * When it lapses the token endpoint returns 400 invalid_grant, we log once, and
 * the mark quietly stops appearing. See docs/spotify-setup.md.
 */

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_URL = "https://api.spotify.com/v1/me/player/currently-playing";

type Cached = { token: string; expires: number };
let cached: Cached | null = null;
let warned = false;

async function accessToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!id || !secret || !refresh) return null;

  // Access tokens last an hour. Re-use until a minute before expiry.
  if (cached && Date.now() < cached.expires - 60_000) return cached.token;

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
      cache: "no-store",
    });

    if (!res.ok) {
      if (!warned) {
        warned = true;
        const body = await res.text();
        console.warn(
          `[spotify] token refresh failed (${res.status}). ` +
            (body.includes("invalid_grant")
              ? "The refresh token has expired — re-run scripts/spotify-auth.js."
              : body.slice(0, 200))
        );
      }
      return null;
    }

    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    cached = {
      token: json.access_token,
      expires: Date.now() + (json.expires_in ?? 3600) * 1000,
    };
    warned = false;
    return cached.token;
  } catch {
    return null;
  }
}

export type NowPlaying = { track: string; artist: string; url: string };

/** What he is listening to this second, or null. Null is the normal case. */
export async function getNowPlaying(): Promise<NowPlaying | null> {
  const token = await accessToken();
  if (!token) return null;

  try {
    const res = await fetch(NOW_URL, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    // 204 is Spotify's "nothing is playing". So is a 200 carrying is_playing
    // false, which happens when a track is paused rather than stopped.
    if (res.status === 204 || !res.ok) return null;

    const json = (await res.json()) as {
      is_playing?: boolean;
      item?: {
        name?: string;
        artists?: { name: string }[];
        external_urls?: { spotify?: string };
      } | null;
    };

    if (!json.is_playing || !json.item?.name) return null;

    return {
      track: json.item.name,
      artist: json.item.artists?.[0]?.name ?? "",
      // Spotify's terms require attribution linking back to the content.
      url: json.item.external_urls?.spotify ?? "https://open.spotify.com",
    };
  } catch {
    return null;
  }
}
