# OpenWorld — Vision

> A living creative ecosystem where humans and intelligent systems co-create — openly, visibly, and without containment.
> *This is not final.*

## What OpenWorld is

OpenWorld is a **social network for showing creative work of every kind** — code, music, painting, sculpture, theater, dance, film, craft, cuisine, architecture, writing, and whatever comes next. Not just digital work: anything a person creates.

OpenWorld **does not host the work**. Creators keep their material wherever it already lives — GitHub, YouTube, Spotify, Bandcamp, Instagram, Google Drive, Sketchfab, a personal site, anywhere shareable. OpenWorld is the **showcase layer**: it gives creators thousands of ways (modules) to present what they've made, pulled from wherever they have it.

## Principles

1. **Unfinished by design** — process is part of the work. Versions, sketches, rehearsals, and failures are worth showing.
2. **Open to mutation** — work can be forked, adapted, remixed, credited.
3. **Hostile to enclosure** — creators own their work. It lives in their repos and on their platforms, not locked inside OpenWorld.
4. **Show anything from anywhere** — if it is shareable anywhere on the internet, OpenWorld should be able to display it well.
5. **No one is limited by skill** — non-developers can build rich posts and custom pages; developers can build anything.

## GitHub first (but not GitHub only)

OpenWorld embraces GitHub as the recommended home for creative material and deliverables — even for media GitHub wasn't designed for, like theater or dance.

| GitHub concept | Meaning in OpenWorld |
|---|---|
| Repo | A creative project: a play, collection, album, choreography |
| Commits | The process history, sketch → rehearsal → final |
| Releases | Finished deliverables: premiere, album drop, exhibition |
| Forks | Adaptations and remixes, with lineage shown |
| Contributors | Credits: cast, crew, collaborators |
| Issues / Discussions | Feedback and critique |
| GitHub Pages | The project's own free website |

- An `openworld.yml` manifest in a repo describes the work (title, medium, credits, which modules present which files and links). OpenWorld reads it and builds the showcase.
- **Starter templates per art form** (theater, dance, painting, music, film, craft, …) via GitHub's "Use this template".
- **No git knowledge required**: OpenWorld's editor commits to the creator's own repo on their behalf (via a GitHub App, with per-repo permission).
- Any other platform is equally welcome: the manifest and posts can point anywhere.

## Modules

Everything shown on OpenWorld is shown through modules. A module can:

1. **Connect** — recognize a link/source and pull what it makes shareable (oEmbed, Open Graph, public APIs, RSS, repo files).
2. **View** — display it, with the platform's own player or OpenWorld viewers (gallery, lightbox, before/after, 3D viewer, waveform player, PDF/score reader, code viewer, map, recipe card, …).
3. **Arrange** — compose many pieces: process timeline, exhibition wall, tracklist, portfolio grid, case study.

Any URL with no matching module still becomes a link card. Nothing is un-showable.

### Module tiers

The rule: **anyone can make anything that's shown; what code may *touch* depends on its tier.**

| Tier | Who | What | Safety |
|---|---|---|---|
| 1. Blocks | Everyone | Form-based, no code: text, link, embed, gallery, credits, event, repo showcase | Rendered by OpenWorld itself |
| 2. Custom HTML/CSS | Non-devs, tinkerers | Style posts, profiles, spaces; remix templates | No scripts; isolated frame |
| 3. Code modules | Developers | Any framework (React, Svelte, vanilla, WebGL, audio…); installable by others | Sandboxed iframe; talks only via the Module Kit; permissions requested |
| 4. Verified | Reviewed modules | Can run natively for performance | Reviewed before promotion |

The same module system works everywhere: posts, profiles, repos, spaces, labs, workshops.

## Spaces

Spaces are interest-based spotlight and collaboration areas where people with similar creative interests gather, form communities, and run workshops. The first seven:

| Space | Formerly | Focus |
|---|---|---|
| **Lab** | Creative Lab | Experiments, work in progress |
| **Studio** | Interactive Art | Visual, physical, performance art |
| **Hub** | Open-Source Hub | Repos, forks, collaboration |
| **Portal** | Knowledge Portal | Guides, techniques, discussion |
| **Forge** | Community Forge | People, feed, follows |
| **Engine** | Soundscape Engine | Music and sound |
| **System** | System Intelligence | AI tools (later) |

More will exist. Spaces are data, not hard-coded pages. Each space can feature the modules that suit its medium, host groups, and run workshops and challenges.

## The feed: focus mode

The feed shows **one work at a time**, snapping between posts:

- The **focused** post is fully live.
- The posts **directly above and below** are visible as half-seen **snapshots** in a fog-of-war look, so there's always a sense of more.
- Posts **two steps away** have their snapshot data prefetched. Nothing further is loaded.
- One gesture = one post (wheel, trackpad, swipe, arrow keys, J/K). No flinging past work.
- **Power-up shift**: appears only when the next post is still loading. Normally the feed snaps instantly. If it has to wait, scrolling pulls the post slightly toward the next one (rubber-band) while the fog glows and builds; when ready it releases and snaps forward. Letting go early eases back, but loading continues.
- If loading takes more than ~4 seconds, the charge stops and shows "still loading…" with a retry, and the user can advance to the snapshot.
- The live module fades in over its snapshot.
- Tall posts scroll internally before the feed advances.
- Media starts muted until the first user interaction; leaving a post remembers its state.
- A **grid view** (snapshots only) exists for skimming, accessibility, and reduced-motion users. Profiles and repos default to grid.

## Roadmap

1. **Core** — accounts (GitHub), profiles, creative repos, posts built from modules, focus feed, follows, ~20 first-party modules.
2. **Spaces** — the seven, creation of more, groups, workshops.
3. **Module Kit** opened to developers; module directory.
4. **System** — AI features.
