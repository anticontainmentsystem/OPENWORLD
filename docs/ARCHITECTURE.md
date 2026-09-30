# OpenWorld — Architecture

Companion to [VISION.md](./VISION.md). Decisions here are current, not final.

## Stack

| Layer | Choice | Why |
|---|---|---|
| App shell | **SvelteKit + TypeScript** | Server rendering (link previews when posts are shared), component model, small bundles, adapters for Cloudflare / Netlify / Node / self-hosting |
| Hosting | **Cloudflare** (Workers/Pages via `adapter-cloudflare`) | Free static bandwidth; no hard monthly cap that takes the site offline |
| Database | **Cloudflare D1** (SQLite) | Native to Cloudflare, free tier, no connection management. Accessed through a thin data layer so it can move to Postgres later |
| Small file cache | **Cloudflare R2** | Snapshot thumbnails and link-preview images only. Creators' work is never hosted |
| Identity | **GitHub App** (user-to-server OAuth) | GitHub-first; per-repo write permission instead of blanket `public_repo` |
| Modules | Sandboxed iframes on a **separate origin** + Module Kit (`postMessage`) | Any framework, no access to the main site |

One framework for the shell. Framework freedom lives in modules.

## Sessions and auth

- Login via GitHub App OAuth. The access token is stored **server-side** (encrypted), never in the browser.
- The browser holds only an `HttpOnly`, `Secure`, `SameSite=Lax` session cookie.
- OAuth `state` is generated, stored, and verified.
- Write operations to a creator's repo go through the server with their stored token, only on repos they granted.

## Data model (initial)

```
users            id, github_id, username, name, avatar, bio, links, created_at
sessions         id, user_id, token_enc, expires_at
repos            id, owner_id, full_name, data_json (GitHub data + parsed openworld.yml),
                 synced_at, created_at
posts            id, author_id, repo_id?, space_id?, blocks_json, snapshot_json,
                 created_at, edited_at, deleted_at
follows          follower_id, followee_id, created_at
reactions        post_id, user_id, kind, created_at
comments         id, post_id, author_id, parent_id?, body, created_at, deleted_at
spaces           id, slug, name, description, featured_modules_json, created_at
space_members    space_id, user_id, role, joined_at
groups           id, space_id, slug, title, description, creator_id, ...
workshops        id, space_id, title, starts_at, ends_at, ...
modules          id, slug, tier, author_id, version, manifest_json, bundle_url, status
notifications    id, user_id, kind, actor_id, data_json, read_at, created_at
link_cache       url_hash, url, provider, oembed_json, og_json, fetched_at, status
```

Posts store **blocks** (ordered list of module instances + their settings). Feeds are database queries with cursors — no monthly shards, no file rewrites.

## Modules

### Manifest

Every module declares:

```yaml
id: gallery
version: 1.0.0
tier: 3
matches:            # URLs / sources it can connect to (optional)
  - "https://drive.google.com/drive/folders/*"
settings:           # schema for the creator's customization form
  layout: { type: enum, values: [grid, masonry, carousel] }
permissions: []     # e.g. ["network:api.example.com"], ["storage"]
snapshot: static    # how it produces its feed snapshot
```

### Runtime

- Tier 1 (blocks) and tier 4 (verified) render natively in the shell.
- Tier 2 (HTML/CSS) is sanitized (no scripts), rendered in a sandboxed frame.
- Tier 3 (code) runs in `<iframe sandbox="allow-scripts">` **without** `allow-same-origin`, served from a separate domain. It communicates only through the Module Kit:
  - `ready()`, `getData()`, `getSettings()`, `resize(height)`, `openLink(url)`, `onFocus/onBlur`, `saveState/restoreState`
  - Extra abilities only via declared, user-visible permissions.

### Link resolution

1. Match a module by URL pattern → module connector.
2. Else oEmbed discovery → embed block.
3. Else Open Graph / meta tags → link card.
4. Results cached in `link_cache`; if a source later disappears, the cached title/thumbnail shows with a "source moved" state.

## Focus feed

Window of five slots around the focused index `i`:

| Slot | State |
|---|---|
| `i` | **live** — module(s) mounted |
| `i ± 1` | **snapshot** — rendered static, shown in fog |
| `i ± 2` | **prefetched** — snapshot data fetched, not rendered |
| others | not loaded |

- Input is normalized: each wheel/trackpad gesture, swipe, arrow or J/K key advances exactly one post.
- **Power-up shift**: only when the next post isn't ready yet. If it's ready, the feed snaps immediately with no charge. Otherwise a scroll intent starts a charge that lasts until the next snapshot is ready. During the charge: rubber-band translate toward the target, fog glow intensifies, progressive haptics where supported (`navigator.vibrate`). On completion: release with slight overshoot and snap. Releasing input early cancels the animation (eases back) but not the prefetch.
- Charge timeout ≈ 4 s → "still loading…" + retry; user may advance onto the snapshot.
- `prefers-reduced-motion`: no translate/glow; a plain progress indicator instead.
- On focus: mount live module over the snapshot, fade in. On blur: `saveState`, unmount, return to snapshot.
- Tall posts scroll internally; the feed advances at the post's edge.
- Grid view and `prefers-reduced-motion` use snapshots only.

## GitHub integration

- Read: repo metadata, README, `openworld.yml`, file trees, releases, contributors, forks.
- Write (with user grant): create repo from template, commit files/manifest from the OpenWorld editor, create releases.
- Rate limits: responses cached; webhooks (GitHub App) keep repo data fresh instead of polling.
- Media served from GitHub is proxied/cached via Cloudflare, never hot-linked at scale.

### Creative repos (implemented)

- Owners add their own public repos (owner login must match). Org repos: later, via membership check.
- Sync reads repo info, `openworld.yml` (see [MANIFEST.md](./MANIFEST.md)), README (GitHub-rendered HTML),
  releases, contributors, recent commits. Stored in `repos.data_json`; re-read in the background
  when older than 6 h, or on the owner's Refresh.
- Manifest paths resolve to `raw.githubusercontent.com` on the default branch; traversal and non-http
  schemes are rejected; every showcase entry goes through the same block validation as posts.
- README HTML renders in an `<iframe sandbox>` without scripts or same-origin access.
- Token order for GitHub calls: signed-in user's token → optional `GITHUB_TOKEN` → anonymous.

## Migration from the current site

- The current Netlify site keeps running until the new one is ready.
- `openworld-data` users/posts are imported once into D1.
- Old code stays in git history; the new app replaces it on this branch.

## Open questions

- Moderation and reporting model.
- Module review process for tier 4.
- Whether Spaces can be created by any user or by request.
