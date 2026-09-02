/* eslint-disable @typescript-eslint/no-require-imports -- One-off CommonJS script, run directly by node and never bundled. */
/**
 * Spotify authorisation, start to finish, in one command:
 *
 *   node scripts/spotify-auth.js
 *
 * It reads your Client ID and Secret from .env.local, prints a link, waits for
 * you to approve it, catches the redirect itself, exchanges the code, and
 * writes SPOTIFY_REFRESH_TOKEN back into .env.local.
 *
 * Nothing is printed to the terminal that you would not want on screen, and
 * nothing leaves your machine except the token exchange with Spotify.
 *
 * This exists because the manual version asked you to hand-edit a long URL and
 * then copy a `code=` parameter out of the address bar before it expired 60
 * seconds later. That is a bad ask.
 *
 * Re-run it roughly every 6 months: refresh tokens issued by the Developer
 * Dashboard expire 6 months after you authorise, and refreshing an access token
 * does NOT extend that clock.
 */
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const ENV = path.resolve(process.cwd(), ".env.local");
const PORT = 8888;
const REDIRECT = `http://127.0.0.1:${PORT}/callback`;
const SCOPES = "user-read-currently-playing user-read-recently-played";

const die = (msg) => {
  console.error("\n" + msg + "\n");
  process.exit(1);
};

if (!fs.existsSync(ENV)) {
  die(
    `No .env.local found at ${ENV}\n` +
      `Run this from the portfolio-v2 folder. See docs/spotify-setup.md.`
  );
}

const raw = fs.readFileSync(ENV, "utf8");
const read = (key) => {
  const m = raw.match(new RegExp(`^${key}=(.*)$`, "m"));
  return m ? m[1].trim() : "";
};

const id = read("SPOTIFY_CLIENT_ID");
const secret = read("SPOTIFY_CLIENT_SECRET");

if (!id || !secret) {
  die(
    "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must both be filled in first.\n\n" +
      "  1. https://developer.spotify.com/dashboard -> Create app\n" +
      `  2. Add this EXACT redirect URI:  ${REDIRECT}\n` +
      "  3. Tick Web API, save, then Settings shows both values\n" +
      "  4. Paste them into .env.local and run this again"
  );
};

const authUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    client_id: id,
    response_type: "code",
    redirect_uri: REDIRECT,
    scope: SCOPES,
    show_dialog: "true",
  }).toString();

const exchange = (code) =>
  new Promise((resolve, reject) => {
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
          Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
        },
      },
      (res) => {
        let out = "";
        res.on("data", (d) => (out += d));
        res.on("end", () => {
          let json;
          try {
            json = JSON.parse(out);
          } catch {
            return reject(new Error("Spotify returned something unparseable: " + out.slice(0, 200)));
          }
          if (res.statusCode !== 200 || !json.refresh_token) {
            return reject(
              new Error(
                `Spotify said ${res.statusCode}: ${JSON.stringify(json)}` +
                  (json.error === "invalid_redirect_uri"
                    ? `\n\nThe redirect URI on your app must be EXACTLY:\n  ${REDIRECT}`
                    : "")
              )
            );
          }
          resolve(json);
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });

const save = (token) => {
  const line = `SPOTIFY_REFRESH_TOKEN=${token}`;
  const next = /^SPOTIFY_REFRESH_TOKEN=.*$/m.test(raw)
    ? raw.replace(/^SPOTIFY_REFRESH_TOKEN=.*$/m, line)
    : raw.trimEnd() + "\n" + line + "\n";
  fs.writeFileSync(ENV, next);
};

const page = (title, detail) =>
  `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
  `<body style="background:#0a0a0b;color:#b4b1a8;font:15px/1.6 system-ui;display:grid;place-items:center;height:100vh;margin:0">` +
  `<div style="max-width:34ch;text-align:center"><p style="color:#e9e6df;font-size:1.1rem">${title}</p><p>${detail}</p></div>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }

  const err = url.searchParams.get("error");
  if (err) {
    res.writeHead(200, { "Content-Type": "text/html" }).end(page("Not authorised", err));
    console.error(`\nSpotify returned: ${err}\nRun the script again if that was a mistake.\n`);
    server.close();
    process.exit(1);
  }

  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400, { "Content-Type": "text/html" }).end(page("No code", "Try again."));
    return;
  }

  try {
    const json = await exchange(code);
    save(json.refresh_token);
    res.writeHead(200, { "Content-Type": "text/html" }).end(
      page("Done", "Your refresh token has been written to .env.local. You can close this tab.")
    );
    console.log("\n  Refresh token written to .env.local");
    console.log("  Scopes granted:", json.scope || "(none reported)");
    console.log(
      `\n  Expires ~6 months from today. Note the date in docs/spotify-setup.md\n` +
        "  and re-run this script when it lapses.\n"
    );
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/html" }).end(page("Failed", String(e.message)));
    console.error("\n" + e.message + "\n");
    server.close();
    process.exit(1);
  }
  server.close();
  process.exit(0);
});

server.on("error", (e) => {
  die(
    e.code === "EADDRINUSE"
      ? `Port ${PORT} is busy. Close whatever is using it and try again.`
      : e.message
  );
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("\n  Open this link, then click Agree:\n");
  console.log("  " + authUrl + "\n");
  console.log("  Waiting for Spotify to redirect back… (Ctrl+C to cancel)\n");
});
