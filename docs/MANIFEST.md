# openworld.yml

Put a file named `openworld.yml` in the root of a GitHub repo to decide how OpenWorld shows it.
Everything is optional. After editing it on GitHub, press **Refresh** on the repo's OpenWorld page.

Starter templates: [templates/](../templates/).

## Top-level fields

| Field | What it does |
|---|---|
| `title` | Name of the work (defaults to the repo name) |
| `medium` | theater, dance, music, sound, film, visual-art, sculpture, photography, writing, poetry, code, games, design, architecture, craft, cuisine, fashion, performance, light-art, mixed-media, other |
| `summary` | One or two sentences (defaults to the repo description) |
| `cover` | Banner image: a path in the repo or an https URL |
| `credits` | List of `Role — Name` lines |
| `links` | List of https URLs (tickets, shop, press…) |
| `showcase` | List of modules, shown in order |

## Showcase modules

Short form — the module name and its main value:

```yaml
showcase:
  - embed: https://youtu.be/VIDEO_ID
  - image: media/photo.jpg
  - gallery: [media/1.jpg, media/2.jpg]
  - text: "Some words about the work."
```

Long form — `type:` plus any of the module's fields:

```yaml
  - type: gallery
    urls: [media/1.jpg, media/2.jpg, media/3.jpg]
    layout: masonry          # grid | masonry | carousel
    caption: Rehearsal week
```

Paths without `https://` are files in the repo (on its default branch).

| Module | Short form value | Other fields |
|---|---|---|
| `text` | the text | |
| `quote` | the quote | `source` |
| `link` | any URL (shown as a preview card) | |
| `embed` | a share URL from YouTube, Vimeo, Spotify, SoundCloud, Mixcloud, Apple Music, CodePen, CodeSandbox, Sketchfab, Figma, Loom, TikTok, Instagram, Google Drive, Google Docs, Internet Archive | `caption` |
| `image` | image path/URL | `alt`, `caption` |
| `gallery` | list of image paths/URLs (`urls`) | `layout`, `caption` |
| `before-after` | — (use long form) | `before`, `after`, `caption` |
| `video` | .mp4/.webm path/URL | `poster`, `caption` |
| `audio` | .mp3/.wav/.ogg/.flac path/URL | `title`, `cover` |
| `document` | .pdf path/URL or Drive/Docs link | `title` |
| `github-repo` | `owner/name` | |
| `credits` | list of `Role — Name` (`lines`) | |
| `timeline` | list of `When — What` (`lines`) | |
| `tracklist` | list of `Title — 3:45` (`lines`) | `title` |
| `materials` | list of items (`lines`) | |
| `recipe` | — (use long form) | `title`, `ingredients`, `steps` |
| `palette` | list of hex colors (`colors`) | `name` |
| `map` | address or place name (`place`) | `caption` |
| `event` | — (use long form) | `title`, `date` (YYYY-MM-DD), `venue`, `url` |
| `code` | — (use long form) | `code`, `language` |

Mistakes don't break the page: anything invalid is skipped, and the repo owner sees a
"Things to fix" list on the page.

## What else OpenWorld reads from the repo

- **README** — shown on the page.
- **Releases** — shown as *Deliverables*, with downloadable files.
- **Contributors** — shown next to your credits.
- **Recent commits** — shown as *Process*.
- **Forks** — counted as *adaptations*; a fork shows what it was adapted from.
