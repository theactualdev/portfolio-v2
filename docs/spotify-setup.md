# Spotify setup — the steps only you can do

Two things, then one command.

Your Client Secret and refresh token live in `.env.local`, which is gitignored.
Never commit it, and never paste those values into a chat — including with me.
The code only ever reads them through `process.env`.

## 1. Register the app

1. <https://developer.spotify.com/dashboard> → **Create app**.
2. Name and description can be anything.
3. **Redirect URI** — exactly this, character for character:

   ```
   http://127.0.0.1:8888/callback
   ```

   Spotify rejects `localhost` for new apps, so it must be the loopback IP. Port
   8888 is used because 3010 is the dev server and the two would collide.
4. Tick **Web API**. Save.
5. **Settings** shows your **Client ID** and, behind a toggle, your **Client Secret**.

## 2. Put those two in `.env.local`

```
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
```

Leave `SPOTIFY_REFRESH_TOKEN` empty — the next step fills it in.

## 3. Run one command

From the `portfolio-v2` folder:

```bash
node scripts/spotify-auth.js
```

It prints a link. Open it, click **Agree**, and your browser lands on a small
local page that says *Done*. The script catches the redirect, exchanges the
code, and writes `SPOTIFY_REFRESH_TOKEN` into `.env.local` itself.

Nothing to copy, and no race against the authorisation code, which expires in
about 60 seconds.

If it fails, the message says why. The usual cause is a redirect URI that does
not match step 1 exactly.

## 4. For the deployed site

Add the same three as Environment Variables in Vercel's project settings.

## 5. The part that will bite you later

**Refresh tokens expire 6 months after you authorise.** Spotify changed this on
18 June 2026, and refreshing an access token does *not* extend the clock. When
it lapses the token endpoint returns `400 invalid_grant` and the section simply
goes quiet — by design, it will not show an error to visitors.

So re-run step 3 about every six months. Nothing else changes.

Authorised on: `____________` ← write the date here each time.

## Scopes, and why only these two

- `user-read-currently-playing` — the live mark in the header.
- `user-read-recently-played` — the listening-hours section.

Nothing else is requested. `user-top-read` would add top artists and tracks if
a later section wants them, but an unused scope is a permission you asked for
and did not need.

## What is permanently unavailable

Spotify blocked these for apps registered after 27 November 2024, with no
appeal and no waitlist: `audio-features`, `audio-analysis`, `recommendations`,
`related-artists`. The escape hatch — extended quota mode — requires a
registered business entity and 250k monthly active users, so this site can
never qualify.

That is why the surface cannot react to the energy or tempo of what you are
playing: the data is not obtainable any more. Do not let anyone talk you into
"just fetching the audio features"; for this app it returns 403.

## If a secret ever leaks

Rotate it. Dashboard → your app → **Settings** → rotate the client secret, then
update `.env.local` and Vercel. The old secret stops working immediately, which
is the entire fix — there is nothing else to clean up.
