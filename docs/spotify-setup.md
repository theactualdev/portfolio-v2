# Spotify setup — steps only you can do

I will never type your Client Secret or tokens. You create them and paste them
into `.env.local` yourself; the code only ever reads `process.env`.

`.env.local` is gitignored. Never commit it, and never paste these values into
chat.

## 1. Register the app (2 minutes)

1. Go to <https://developer.spotify.com/dashboard> and log in.
2. **Create app**. Name and description can be anything — "olayinka.codes" is fine.
3. **Redirect URI**: add exactly `http://127.0.0.1:3010/callback`
   (Spotify rejects `localhost` for new apps; it must be the loopback IP.)
4. Under **APIs used**, tick **Web API**.
5. Save, then open **Settings** to see your **Client ID** and **Client Secret**.

## 2. Authorise once, to get a refresh token

Paste your Client ID into this URL and open it in a browser you are logged into
Spotify with:

```
https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http%3A%2F%2F127.0.0.1%3A3010%2Fcallback&scope=user-read-currently-playing%20user-read-recently-played
```

Approve it. The browser lands on a dead page — that is expected. Copy the
`code=...` value out of the address bar.

Then run this once, with your own values substituted:

```bash
node scripts/spotify-token.js YOUR_CLIENT_ID YOUR_CLIENT_SECRET THE_CODE_FROM_THE_URL
```

It prints a refresh token. That is the only time that script is needed.

## 3. Put the three values in `.env.local`

```
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REFRESH_TOKEN=...
```

For the deployed site, add the same three as Environment Variables in Vercel's
project settings.

## 4. The part that will bite you later

**Refresh tokens now expire after 6 months.** Spotify changed this on
18 June 2026, and refreshing an access token does *not* extend the clock. When
it lapses, the token endpoint returns `400 invalid_grant` and the section goes
quiet — it will not error visibly, by design.

So: **repeat step 2 roughly every 6 months.** Steps 1 and 3 stay as they are;
only the refresh token changes.

Authorised on: `____________` ← write the date here when you do it.

## Scopes, and why only these two

- `user-read-currently-playing` — the live mark in the header.
- `user-read-recently-played` — the listening-hours section.

Nothing else is requested. `user-top-read` would add top artists/tracks if a
future section wants them, but an unused scope is a permission you asked for
and did not need.

## What is permanently unavailable

Spotify blocked these for apps registered after 27 November 2024, with no
appeal and no waitlist: `audio-features`, `audio-analysis`, `recommendations`,
`related-artists`. The escape hatch (extended quota mode) requires a registered
business and 250k monthly active users, so this site can never qualify.

This is why the surface cannot react to the energy or tempo of what you are
playing — that data is simply not obtainable any more. Do not let anyone talk
you into "just fetching the audio features"; it returns 403.
