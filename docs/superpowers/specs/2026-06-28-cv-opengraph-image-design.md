# `/cv` social-share thumbnail fix + canonical host alignment

**Date:** 2026-06-28
**Status:** Approved (design)
**Branch:** `fix/cv-opengraph-image` (off `main`)

## Problem

Sharing `leonardosarmentocastro.com/cv` on LinkedIn renders the **Pinterest logo** as the
thumbnail instead of the CV's portrait and presentation text.

### Root cause

`src/app/cv/page.tsx` declares only `title` and `description` — there is **no `openGraph`
config and no `opengraph-image`**. With no `og:image` advertised, LinkedIn's crawler falls
back to scanning the page DOM and picks the most prominent image it finds: the Pinterest
work-experience company logo (`public/cv/companies/pinterest.jpg`).

The wider gap: `src/app/layout.tsx` sets **no `metadataBase`** and no default Open Graph
metadata, so no route on the site advertises a share image. The homepage (`/`) has the same
latent problem.

## Goals

- `/cv` shares with a branded card: the CV portrait (`RESUME.hero.avatar`) plus name, role,
  and a presentation accent line.
- Every other route (homepage included) gets a sensible default share card.
- Establish `https://leonardosarmentocastro.com` (apex) as the canonical host and align the
  existing SEO surfaces that currently point at `leonardosarmentodecastro.com`.

## Non-goals

- Migrating the analytics campaign base URL (`src/analytics/campaigns.ts`, its tests, the
  `campaign-url.ts` script, and `src/analytics/README.md`) to the new canonical host. That is
  a separate concern, deferred.
- Any work on `/cv/pdf` — that surface is not on `main`.
- Configuring the Vercel redirect (`decastro` → `castro`); owner-operated, outside the repo.

## Decisions

| Decision | Choice |
| --- | --- |
| Accent line on both cards | `RESUME.hero.kicker` (`"AI-assisted · TypeScript · Node.js · React · AWS"`) |
| Scope of the share fix | `/cv` **and** a site-wide default |
| Code organization | Shared, parameterized renderer in a new `src/og/` domain |
| Canonical host | `https://leonardosarmentocastro.com` (apex, no `www`) |
| Canonical alignment scope | `robots.ts`, `sitemap.ts`, `data.ts` only (analytics deferred) |

## Architecture

### Theme A — Open Graph / social-share

#### `src/og/` (new domain)

The branded share-card lives in its own domain so the card has a single source of truth.
Domain-local convention files are used (per `CLAUDE.md`):

- **`src/og/constants.ts`** — `OG_SIZE = { width: 1200, height: 630 }`,
  `OG_CONTENT_TYPE = "image/png"`.
- **`src/og/avatar.ts`** — `loadAvatarDataUri(): Promise<string>`. Reads
  `RESUME.hero.avatar` from `public/`, sniffs the MIME type from the file extension
  (`.png` → `image/png`, `.webp` → `image/webp`, else `image/jpeg`), returns a
  `data:<mime>;base64,<...>` URI. `next/og` (satori) only accepts a plain `<img>` with a
  data URI, so the avatar must be inlined.
- **`src/og/card.tsx`** — `renderOgCard({ label }: { label: string }): Promise<ImageResponse>`.
  Renders the 1200×630 card: avatar on the left (`420×630`, `objectFit: cover`), a text panel
  with a red (`#BB001B`) left border holding `RESUME.hero.name` (64px/800), `RESUME.hero.role`
  (34px), and the `label` as a red accent line (30px/700, letter-spacing). Dark background
  (`#171717`), white text. `runtime = "nodejs"` (the avatar read uses `node:fs`).
- **`src/og/__tests__/`** — see Testing.

#### Route files (Next.js `opengraph-image` file convention, Next 15.5.9)

Next auto-injects each file's image as `og:image`/`twitter:image` for its segment and
descendants; a more specific segment overrides a parent.

- **`src/app/opengraph-image.tsx`** (new, site-wide default) — re-exports `size`/`contentType`
  from `src/og/constants`, exports `alt = "Leonardo Sarmento de Castro — Senior Software Engineer"`,
  and `export default` calls `renderOgCard({ label: RESUME.hero.kicker })`. Applies to `/` and
  every route without a more specific image.
- **`src/app/cv/opengraph-image.tsx`** (new) — same shape, `alt = "Leonardo Sarmento de Castro — CV"`,
  `renderOgCard({ label: RESUME.hero.kicker })`. Overrides the default for the `/cv` subtree.

#### Metadata objects

- **`src/app/layout.tsx`** — add `metadataBase: new URL("https://leonardosarmentocastro.com")`,
  a default `openGraph` (`title`, `description`, `type: "website"`, `url: "/"`, `siteName`), and
  `twitter: { card: "summary_large_image" }`. `metadataBase` makes the file-convention
  `og:image` URLs resolve to absolute URLs on the canonical host.
- **`src/app/cv/page.tsx`** — add `openGraph` (`title`, `description: RESUME.hero.blurb`,
  `url: "/cv"`, `type: "website"`) and `twitter: { card: "summary_large_image", title,
  description }`. The image is supplied by the file-convention `opengraph-image`.

### Theme B — canonical host alignment (scoped to 3 files)

- **`src/app/robots.ts`** — `sitemap` → `https://leonardosarmentocastro.com/sitemap.xml`.
- **`src/app/sitemap.ts`** — emit only the canonical host's URLs (`/` and `/cv`); drop the
  `leonardosarmentodecastro.com` entries that now redirect to the canonical host.
- **`src/cv/data.ts`** — `hero.links.site` → `https://leonardosarmentocastro.com`.

## Data flow

LinkedIn/Twitter crawler → reads `<head>` of the shared URL → finds `og:image` (absolute,
via `metadataBase`) pointing at the generated card route → Next renders `renderOgCard()`
(reads avatar from `public/`, returns PNG) → crawler displays the branded card. Fully static
per build; no runtime user input.

## Error handling

`loadAvatarDataUri()` reads from disk with no fallback. If `RESUME.hero.avatar` is missing,
the OG route throws at build/request time — acceptable and surfaced loudly, matching the
project's existing OG approach. The avatar (`public/leonardo-05.jpg`) is committed on `main`,
so production is unaffected.

## Testing (TDD)

- **`src/og/__tests__/constants.test.ts`** — `OG_SIZE` equals `{ width: 1200, height: 630 }`;
  `OG_CONTENT_TYPE` is `"image/png"`.
- **`src/og/__tests__/avatar.test.ts`** — `loadAvatarDataUri()` returns a
  `data:image/...;base64,` URI; MIME is derived from the extension (fs mocked).
- **`src/og/__tests__/card.test.ts`** — `renderOgCard({ label })` returns a `Response` with
  status `200` and the declared content type.
- **`src/app/opengraph-image` / `src/app/cv/opengraph-image` tests** — assert `alt`, `size`,
  and `contentType` exports (mirrors the established OG-route test shape).
- Satori output is a binary PNG, so tests assert response/metadata shape, not pixels.
- Canonical-alignment files have no logic to unit-test; the `sitemap.ts`/`robots.ts` changes
  are verified by reading the emitted output. `data.ts` is covered by the existing
  `src/cv/__tests__/data.test.ts` shape checks.

## Commit plan (atomic)

Theme A:
1. `feat(og): shared branded OG share-card renderer in src/og/` (renderer + helpers + tests).
2. `feat(seo): set metadataBase + default Open Graph/Twitter metadata in root layout`.
3. `feat(og): site-wide default opengraph-image`.
4. `fix(cv): add /cv opengraph-image and Open Graph/Twitter metadata` (fixes the Pinterest
   thumbnail).

Theme B (canonical alignment, one concern per commit):
5. `chore(seo): point robots sitemap at the canonical host`.
6. `chore(seo): emit only the canonical host in sitemap`.
7. `chore(cv): point hero site link at the canonical host`.

## Post-deploy (operational, not code)

After deploy, re-scrape `https://leonardosarmentocastro.com/cv` in the
[LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) to flush LinkedIn's
~7-day cache holding the stale Pinterest thumbnail.
