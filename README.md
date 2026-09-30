# ◈ OpenWorld

A social network for showing creative work of every kind — from wherever it lives.
Creators keep their work on GitHub, YouTube, Spotify, Instagram, Drive, their own sites…
OpenWorld gives them **modules** to show it.

- Vision: [docs/VISION.md](docs/VISION.md)
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

Stack: SvelteKit + TypeScript on Cloudflare Workers, Cloudflare D1 (SQLite) database, GitHub sign-in.

## Run it locally

Requires Node 20+.

```bash
npm install
cp .dev.vars.example .dev.vars      # local secrets; DEV_LOGIN=1 enables fake sign-in
npm run db:migrate:local            # creates the local database in .wrangler/
npm run dev                         # http://localhost:5173
```

Run the tests with `npm test`.

Sign in without GitHub while developing: open `http://localhost:5173/auth/dev?as=yourname`.
(Only works under `npm run dev` with `DEV_LOGIN=1`; it is disabled in production builds.)

To test real GitHub sign-in locally, create a GitHub OAuth app (below) with callback
`http://localhost:5173/auth/callback` and put its id/secret in `.dev.vars`.

## Deploy to Cloudflare

1. `npx wrangler login`
2. `npx wrangler d1 create openworld` → copy the printed `database_id` into `wrangler.jsonc`.
3. `npm run db:migrate` (creates the tables in the real database).
4. Create a GitHub App (github.com → Settings → Developer settings → GitHub Apps) or an OAuth App:
   - Callback URL: `https://<your-domain>/auth/callback`
   - Put the **Client ID** in `wrangler.jsonc` → `vars.GITHUB_CLIENT_ID`.
   - `npx wrangler secret put GITHUB_CLIENT_SECRET`
   - `npx wrangler secret put SESSION_SECRET` (any long random string)
5. `npm run deploy`

Or connect this repo in the Cloudflare dashboard (Workers → Create → Import a repository) with
build command `npm run build` and deploy command `npx wrangler deploy`, so every push deploys.

### Bring over the old data

```bash
node scripts/import-legacy.mjs ../openworld-data > legacy.sql
npx wrangler d1 execute openworld --remote --file legacy.sql
```

## Creative repos

Anyone can add their own public GitHub repos from their profile. OpenWorld builds a page at
`/r/owner/repo` from the repo's `openworld.yml`, README, releases, contributors and commits.
Guide: [docs/MANIFEST.md](docs/MANIFEST.md). Starter repos for theater, dance, visual art and
music: [templates/](templates/).

Optional: `npx wrangler secret put GITHUB_TOKEN` (a GitHub token with no scopes) raises the
GitHub API rate limit for repo pages viewed by signed-out visitors.

## Adding a module

1. Add an entry to `src/lib/modules/registry.ts` (id, name, icon, fields, snapshot).
   The composer form, server validation and feed snapshots come from that entry.
2. Add its renderer in `src/lib/modules/blocks/` and route it in `src/lib/modules/Block.svelte`.

New embed sites go in `src/lib/modules/providers.ts` — the embed URL is always computed
from a matched pattern, never taken from user input.

## Project layout

```
src/lib/modules/      registry, embed providers, block renderers
src/lib/components/   FocusFeed (snap feed + power-up), GridView, Composer, PostView…
src/lib/server/       auth/sessions, link + GitHub enrichment, feed queries, repo sync
src/lib/manifest.ts   openworld.yml parser
src/routes/           pages and /api endpoints
migrations/           D1 schema
scripts/              one-off tools (legacy import)
templates/            starter creative repos (openworld.yml + layout)
```
