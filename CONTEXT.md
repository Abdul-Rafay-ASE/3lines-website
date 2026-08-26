# Context & handover

State of this branch, what is verified, and what is still open. `README.md` covers
how the system works; this file covers where it stands.

Last updated at commit `66c0ba4`.

## Current state

The site is production-ready and building. Bilingual EN/AR, 23 route ids × 2 locales,
54 prerendered pages (46 content pages + not-found + OG image routes).

**Verified on the merged tree, not assumed:**

| Gate | Result |
|---|---|
| `typecheck` | PASS |
| `ingest` | PASS — 46 documents |
| `audit:content` | PASS (10 warnings, all non-code) |
| `audit:links` | 0 broken, 0 unreachable, 0 orphans |
| `audit:console` | 0 errors, 0 hydration, 0 same-origin 4xx |
| `audit:a11y` | PASS — 92 pages, 5,432 interactive elements, 712 contrast samples |
| `audit:rtl` | PASS — 23 routes × 2 viewports, 3,606 Arabic elements |
| `audit:assets` | PASS — every asset URL carries its current content hash |
| `build` | 54 pages |

## You are not alone on this branch

`next-site` has more than one contributor. A push was rejected mid-session because
PR #1 (`0xArx`, bilingual chrome / language switch / OG metadata) had landed. It was
**merged, not forced** — force-pushing would have destroyed that work.

There are also active branches `location-page`, `location-map-and-fixes` and
`product-revision`. **Fetch before you push.**

## Blocked: the CMS

The CMS at `3lines-website.ai-25c.workers.dev/admin` **saves but cannot publish.**
Black-box tested:

- `Save changes` → `POST 200 /admin/site`; the value survives a reload. The write
  layer works.
- `Publish`, with a real change staged → **zero network requests**, live site
  unchanged after 180s.
- After a successful save the UI still reads "No changes" — the dirty state is not
  tracked, which is likely the same root cause.

Auth and authorization are correct: wrong and empty passwords are rejected with no
session, the session cookie carries `HttpOnly, Secure, SameSite, Path, Max-Age,
Expires`, and no admin route serves content anonymously.

**Its source is not reachable.** Verified four ways: deep filesystem scan, distinctive
string search across `Desktop`/`Documents`/`Downloads`, no `admin/c/[key]` route
anywhere, and 0 `app/admin` paths in any branch of this repo via the GitHub API.

Unblocking needs one of: the repo it was built from, Cloudflare access to pull the
deployed bundle (minified, not maintainable), or rebuilding the editor against this
site's content model — `3linesWeb/xr-cms-app/lib/` has proven auth, validation and
atomic-write code to reuse.

## Deploying (`deploy/`)

Target is EC2/Lightsail + pm2 + nginx, chosen deliberately: a filesystem-backed CMS
cannot persist on Vercel/Workers/Lambda, which is the root of the publish failure.

`deploy/publish.sh` builds a **new** release from the persistent content directory,
runs every gate, and only then repoints `current` and reloads pm2. Any failure exits
non-zero with `current` untouched, so the live site keeps serving the previous
release. It health-checks after reload and rolls back automatically. Keeps 5 releases.

**The guarantee was tested, not assumed:** blanking a service title and dropping one
of the four companies were both rejected at ingest, with nothing written.

Content paths are env-overridable (`SOURCE_CONTENT_DIR`, `CONTENT_DIR`) so content
lives outside the release directory — without that, a rebuild would destroy an
editor's saved work.

Two caveats: browser-driven audits need Chrome and are reported as *skipped*, never
silently passed, if absent; and `extract` is deliberately not in the publish path
because it reads the sibling project, which will not exist on a server.

## Open items

1. **`baseline/` is stale and deliberately uncommitted.** It was captured before the
   heading-order, marquee and companies changes. A stale visual reference makes every
   future diff fail confusingly. Re-capture with `npm run baseline:update`, then
   commit it as its own reviewable change.
2. **The full pipeline has never completed one clean end-to-end run.** Two attempts
   were spoiled by concurrent edits to files it was measuring. It needs one quiet run
   with nothing else touching the tree.
3. **The three legal pages are placeholder copy** — their source bodies are one-line
   strings. They must not go live as written. Not a code fix.
4. **News posts have no article body** — the data holds only title, description,
   cover, date and tags.
5. **The CMS manages 25 pages; the site renders 23.** The extras are `careers` and
   `location`; the `location-page` branch appears to be closing that gap.
6. The deployment at the Worker predates the 4-up company grid, so its fourth company
   card orphans onto its own row.

## Things that will bite you

- **Cache-busting is content-hashed** (`lib/assets.ts`). Do not reintroduce
  hand-maintained `?v=3` query strings — a stale one silently serves old CSS to
  returning browsers while every cold-browser audit reports green. That cost real
  time before it was fixed, and `audit:assets` now guards it.
- **`3lines.css` is a theme layer full of `!important`** and it flattens section
  tones and hides inline SVG. Restoration rules live in `rtl.css`, loaded last.
- **CSS specificity, twice over.** A lone `.logos__track` lost to `.logos div`, and
  `:lang(ar) *` lost to `.ftr h4`. When an override "does nothing", compare
  specificity before assuming the rule is wrong.
- **Arabic must never be letter-spaced** — it is cursive, so tracking breaks the
  letterforms' joins. `audit:rtl` gates it because the failure is invisible.
- There are **five copies** of the older site on this machine
  (`3linesWeb/*`, `3linesweb_clone/*`, `3lwebsite/3lines-website`). Confirm which one
  you are editing.
