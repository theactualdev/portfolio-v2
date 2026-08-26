/* eslint-disable @typescript-eslint/no-require-imports -- One-off CommonJS script, run directly by node and never bundled. */
/**
 * One-off: exchange a Spotify authorization code for a refresh token.
 *
 *   node scripts/spotify-token.js <client_id> <client_secret> <code>
 *
 * See docs/spotify-setup.md for how to get the code. Nothing here is stored;
 * the refresh token is printed once and you paste it into .env.local yourself.
 *
 * Re-run this roughly every 6 months — refresh tokens issued by the Developer
 * Dashboard expire 6 months after the user authorised, and refreshing an access
 * token does NOT extend that clock.
 */
const https = require("https");

const [clientId, clientSecret, code] = process.argv.slice(2);

if (!clientId || !clientSecret || !code) {
  console.error("usage: node scripts/spotify-token.js <client_id> <client_secret> <code>");
  console.error("see docs/spotify-setup.md");
  process.exit(1);
}

// Must match the redirect URI registered on the app, exactly.
const REDIRECT = "http://127.0.0.1:3010/callback";

const body = new URLSearchParams({
  grant_type: "authorization_code",
  code,
  redirect_uri: REDIRECT,
}).toString();

const req = https.request(
  {
    hostname: "accounts.spotify.com",
    path: "/api/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body),
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
  },
  (res) => {
    let raw = "";
    res.on("data", (d) => (raw += d));
    res.on("end", () => {
      let json;
      try {
        json = JSON.parse(raw);
      } catch {
        console.error("could not parse response:", raw.slice(0, 400));
        process.exit(1);
      }
      if (res.statusCode !== 200 || !json.refresh_token) {
        console.error(`\nSpotify said ${res.statusCode}:`, JSON.stringify(json, null, 2));
        if (json.error === "invalid_grant") {
          console.error(
            "\nAn authorization code is single-use and expires in ~60 seconds.\n" +
              "Go back to step 2 in docs/spotify-setup.md and get a fresh one."
          );
        }
        process.exit(1);
      }
      console.log("\nRefresh token (paste into .env.local as SPOTIFY_REFRESH_TOKEN):\n");
      console.log(json.refresh_token);
      console.log("\nScopes granted:", json.scope || "(none reported)");
      console.log(
        `\nWrite today's date in docs/spotify-setup.md — this expires in 6 months.\n`
      );
    });
  }
);

req.on("error", (e) => {
  console.error("request failed:", e.message);
  process.exit(1);
});
req.write(body);
req.end();
