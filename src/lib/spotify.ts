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
const RECENT_URL = "https://api.spotify.com/v1/me/player/recently-played?limit=1";

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

export type NowPlaying = {
  track: string;
  artist: string;
  url: string;
  /** True while it is actually playing; false when this is the last thing he played. */
  live: boolean;
};

type SpotifyTrack = {
  name?: string;
  artists?: { name: string }[];
  external_urls?: { spotify?: string };
};

const shape = (item: SpotifyTrack | null | undefined, live: boolean): NowPlaying | null =>
  item?.name
    ? {
        track: item.name,
        artist: item.artists?.[0]?.name ?? "",
        // Spotify's terms require attribution linking back to the content.
        url: item.external_urls?.spotify ?? "https://open.spotify.com",
        live,
      }
    : null;

/**
 * What he is playing — or, when nothing is playing, the last thing he played.
 *
 * The mark used to exist only while a track was live, which made absence the
 * resting state. He asked for it to always show something instead, so this
 * falls back to recently-played. `live` distinguishes the two so the UI can be
 * honest about which it is showing rather than implying he is listening right
 * now when he is not.
 *
 * Still returns null on every failure: expired token, rate limit, network
 * fault, or an account with no history at all.
 */
export async function getNowPlaying(): Promise<NowPlaying | null> {
  const token = await accessToken();
  if (!token) return null;

  try {
    const res = await fetch(NOW_URL, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    // 204 is Spotify's "nothing is playing". A 200 carrying is_playing false
    // means paused, which counts as not playing for our purposes.
    if (res.ok && res.status !== 204) {
      const json = (await res.json()) as { is_playing?: boolean; item?: SpotifyTrack | null };
      if (json.is_playing) {
        const live = shape(json.item, true);
        if (live) return live;
      }
    }
  } catch {
    // fall through to the last-played lookup
  }

  try {
    const res = await fetch(RECENT_URL, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { items?: { track?: SpotifyTrack }[] };
    return shape(json.items?.[0]?.track, false);
  } catch {
    return null;
  }
}
