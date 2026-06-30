# `src/seo/og` — Open Graph share card

Generates the social share image (Open Graph / Twitter) rendered by the Next.js
file-convention routes `src/app/opengraph-image.tsx` and
`src/app/cv/opengraph-image.tsx`. Both routes call `renderOpenGraphCard()` from
[`OpenGraphCard.tsx`](./OpenGraphCard.tsx), so the card stays identical across `/`
and `/cv`.

The card is a visual match of the CV hero header (`src/cv/sections/Hero/Hero.tsx`):
a white surface with a blue spine, the kicker and role in **Spectral** (blue, bold,
uppercase), and the name in **Domine** (dark serif). Colors come from
`src/cv/cv-colors.ts` (`CV_COLORS`) so the share card and the page never drift.

## Vendored fonts

The web CV loads its fonts via `next/font/google`, but `next/og` renders through
Satori, which cannot read those — it needs raw font bytes. The matching `.ttf`
files are therefore committed under [`fonts/`](./fonts) and loaded at render time
by [`fonts.ts`](./fonts.ts):

| File | Family / weight | Used for |
| --- | --- | --- |
| `Domine-Regular.ttf` | Domine 400 | the name |
| `Spectral-Bold.ttf` | Spectral 700 | kicker + role |

- **Source:** [Fontsource](https://fontsource.org) CDN (the fonts originate from
  Google Fonts, [SIL Open Font License 1.1](https://openfontlicense.org)).
- **Regenerate:**

  ```bash
  curl -sSL -o src/seo/og/fonts/Domine-Regular.ttf \
    "https://cdn.jsdelivr.net/fontsource/fonts/domine@latest/latin-400-normal.ttf"
  curl -sSL -o src/seo/og/fonts/Spectral-Bold.ttf \
    "https://cdn.jsdelivr.net/fontsource/fonts/spectral@latest/latin-700-normal.ttf"
  ```

- **Why bundle instead of fetch at build?** Reading committed bytes keeps
  production builds reproducible and offline-safe — no dependency on an external
  host being reachable during `next build`.

## Constraint: keep the routes statically prerendered

`fonts.ts` and `avatar.ts` read from the source tree via `fs` + `process.cwd()`.
That only resolves because the OG routes are statically prerendered at build time
(`○ Static` in the build output), when the whole repo is present. If a route is
ever made dynamic, move these assets to `public/` (the avatar already reads from
there) or inline them, or the serverless function won't find them.

## Local preview gotcha

Next can serve a **stale** prerendered OG image across builds. If a change isn't
showing, clear the cache: `rm -rf .next && pnpm build`. Vercel builds clean, so
this only affects local previews.
