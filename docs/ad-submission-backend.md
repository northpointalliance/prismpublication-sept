# Ad submission backend (Cloudflare Pages Functions + D1)

Added 14 September 2026. Replaces the `mailto:` submission flow with a real
form, without adding any third-party service, API key, or account system.

## What this is

- `ad-submission/index.html` now has a working form that POSTs to `/api/submit`.
- `functions/api/submit.js` is a Cloudflare Pages Function (a Worker that
  deploys as part of this same Pages project -- not a separate Worker).
  It validates the submission and checks the category against the approved
  list (fitness, sleep, productivity -- same list as `docs/ad-submission.md`).
- Everything is written to the `prism-crm` D1 database (an existing, empty
  database already on the account -- reused instead of creating a new one)
  into a table called `ad_submissions`.
- `admin/index.html` + `functions/api/submissions/index.js` +
  `functions/api/submissions/[id].js` let you review, approve, or reject
  submissions from a browser.

**Approving a submission does not make it go live.** Adding an approved
creative to `sdk/catalog.json` (the file real ad-serving reads from) is
still a manual git edit, same as before. This only replaces "read an email
and remember it" with a reviewable, structured queue.

## One-time setup you need to do (I can't do this part for you)

Two clicks in the Cloudflare dashboard. Nothing here involves an API key,
a password, or code.

**1. Bind the D1 database to this Pages project.**
The database and table already exist -- I created and applied the schema
directly. You just need to connect it to the Pages project:

1. Cloudflare dashboard -> **Workers & Pages**.
2. Open the Pages project for this site.
3. **Settings** -> **Bindings** -> **Add** -> **D1 database binding**.
4. Variable name: `DB` (must be exactly this -- the code expects `env.DB`).
5. D1 database: select `prism-crm`.
6. Save, then trigger a redeploy (the next git push does this automatically;
   or use "Retry deployment" on the latest one in the dashboard).

Without this step, `/api/submit` and `/api/submissions` will return a
server error -- the form itself will still load fine.

**2. Protect `/admin/*` and `/api/submissions*` with Cloudflare Access.**
This is what keeps the review page and the submissions list private. It's
Cloudflare's own login (you sign in with your existing Cloudflare account),
not something this repo builds or manages.

1. Cloudflare dashboard -> **Zero Trust** -> **Access** -> **Applications**.
2. **Add an application** -> **Self-hosted**.
3. Application domain: `prismpublication.com`, path `/admin`.
4. Add a second path rule (or a second application) for `/api/submissions`.
5. Policy: Allow, and add your own email as the only allowed identity.
6. Save.

After this, visiting `/admin/` will prompt a Cloudflare-hosted login before
showing the page. The Pages Function also checks for the header Access adds
(`Cf-Access-Authenticated-User-Email`) and returns 403 without it, as a
second layer -- so the API can't be hit directly even if the Access rule is
ever misconfigured.

## Local development

`wrangler.toml` at the repo root is for local testing only --
`wrangler pages dev .` reads it to emulate the `DB` binding. Cloudflare's
Git-connected build does **not** read this file and does not need it; the
production binding is the dashboard step above. This does not change the
existing deploy pipeline (`echo "Building static site"`, no `wrangler deploy`).

`d1/schema.sql` documents the table. It was already run against the real
`prism-crm` database, so you don't need to run it again unless the database
is ever recreated from scratch.

## Known gap, not built here

`sdk/prismClient.js` requires a publisher's server to be Node/JS, since the
matching logic runs inside that file. A publisher on Python, PHP, Java, etc.
can't use it without reimplementing the cosine matcher themselves. The
fix would be a `POST /api/match` Pages Function that does the matching
server-side and returns plain JSON -- same pattern as this submission
backend, callable from any language over HTTPS. Not built yet.
