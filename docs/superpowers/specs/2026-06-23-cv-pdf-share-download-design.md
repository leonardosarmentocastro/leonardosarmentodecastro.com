# CV Recruiter PDF — shareable preview + reliable download

**Date:** 2026-06-23
**Status:** Approved (ready for planning)
**Branch:** `feat/cv-web-pdf-export`

## Problem

The resume dialog (`ResumeOptionsModal`) offers a "RECRUITER PDF" option that links
directly to the **static binary file** `/cv/Leonardo-Sarmento-de-Castro-Resume.pdf`
with `target="_blank"`. Two problems stem from handing people a raw PDF URL:

1. **No save affordance, especially on mobile.** A browser opens the binary PDF
   inline. There is no download button, and on iOS Safari the HTML `download`
   attribute is ignored, so "save it" dead-ends in the inline viewer.
2. **No share preview.** Link-unfurling crawlers (WhatsApp, Slack, …) build preview
   cards only from **HTML** via Open Graph tags. A `.pdf` returns binary, so the
   shared link shows no thumbnail — unlike sharing `/cv`.

The site currently has **no** `openGraph` / `og:image` / `metadataBase` metadata
anywhere, so even `/cv` only yields a title+description card, never an image.

## The constraint that shapes the design

A single URL cannot be **both** a force-download (binary `Content-Disposition:
attachment`) **and** a thumbnail source (HTML with Open Graph tags). The clean way
to get both from one URL is to lean on a property of link crawlers: **they do not
run JavaScript.**

So `/cv/pdf` is served as a thin **HTML page**. The crawler sees HTML + `og:image`.
A real browser runs JS and immediately downloads the file, with a visible fallback
button.

| Visitor | Behavior |
| --- | --- |
| Preview crawler (no JS) | Receives HTML + `og:image` → rich preview card |
| Human browser (runs JS) | PDF download auto-starts; visible "Download PDF" fallback button |

## Components

### 1. `src/app/cv/pdf/page.tsx` — server component (HTML shell)
- Exports `metadata` with:
  - `title`: "Leonardo Sarmento de Castro — Résumé (PDF)"
  - `description`: short résumé blurb (reuse `RESUME.hero.blurb`)
  - `openGraph` (title/description/url/type) and `twitter` (`card: "summary_large_image"`).
  - The `og:image` / `twitter:image` are wired automatically by the colocated
    `opengraph-image.tsx` (Next.js convention) — no manual `images` array needed.
- Renders a minimal branded shell containing the `CvPdfDownload` client component.

### 2. `src/app/cv/pdf/opengraph-image.tsx` — designed share card
- Next.js `ImageResponse`, **1200×630**.
- Dark brand background (`#171717`), `#BB001B` accent, avatar on the left, text on
  the right: "Leonardo Sarmento de Castro" / "Senior Software Engineer" /
  "· Résumé (PDF) ·".
- Exports `size = { width: 1200, height: 630 }`, `contentType = "image/png"`, and an
  `alt`. Renders both `og:image` and `twitter:image` at correct dimensions.

### 3. `src/app/cv/pdf/download/route.ts` — file delivery
- Mirrors `src/app/cv/ats/route.ts`, but instead of rendering on the fly it **reads
  the pre-generated static PDF** at `CV_PDF_OUTPUT_FILE` (`src/cv/print/constants.ts`)
  and returns its bytes with:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="Leonardo-Sarmento-de-Castro-Resume.pdf"`
- Attachment disposition is the most reliable cross-platform "save": it makes iOS
  Safari (16+) offer "Save to Files" instead of dead-ending in the inline viewer,
  and downloads directly on desktop and Android.
- `runtime = "nodejs"` (filesystem read), `dynamic = "force-static"` (matches ATS).

### 4. `CvPdfDownload` — client component
- Location: colocate under the CV feature, e.g. `src/cv/pages/CvPdfPage/`.
- On mount, programmatically triggers a download of `/cv/pdf/download` (auto-download,
  honoring the "like /cv/ats" behavior).
- Always renders a visible "Download PDF" button → `/cv/pdf/download`, so it works
  even when the auto-trigger is blocked (the fallback half of the hybrid).
- Includes a short line of copy (e.g. "Your download should start automatically. If
  not, tap below.") plus name/role for the rare human who lands here.

### 5. Wiring changes
- `src/cv/data.ts`: `RESUME.hero.links.resumePdf`
  `"/cv/Leonardo-Sarmento-de-Castro-Resume.pdf"` → **`"/cv/pdf"`**. This single change
  repoints **both** consumers:
  - `ResumeOptionsModal.tsx` (dialog `recruiterPdf` descriptor)
  - `Hero.tsx:130` (hero "resume" link)
- `src/app/layout.tsx`: add **`metadataBase`** to the root `metadata`
  (`new URL("https://www.leonardosarmentocastro.com")`) so colocated og:images
  resolve to absolute URLs. (Confirm canonical host — see Open Questions.)

## What does NOT change
- The raw static asset and `CV_PDF_PUBLIC_PATH` stay — they are now the source the
  download route reads, not the public-facing link.
- `/cv/ats` and `/api/cv/json` — untouched.
- `scripts/cv/generate-pdf.ts` and the PDF freshness/hash mechanism — untouched.
- The `/cv` page itself — unchanged (the og:image work lives on `/cv/pdf`).

## Testing (TDD)

Existing patterns to mirror: `src/app/cv/ats/__tests__/route.test.ts`,
`src/cv/__tests__/ResumeOptionsModal.test.tsx`. Runner: Vitest.

- **`download/route.ts`**: GET → 200, `Content-Type: application/pdf`,
  `Content-Disposition` is `attachment` with the expected filename, body is non-empty.
- **`page.tsx`**: `metadata` exports the expected `title`, an `openGraph` object, and
  `twitter.card === "summary_large_image"`.
- **`opengraph-image.tsx`**: exports `size` `{1200,630}`, a non-empty `alt`, and the
  default render returns a 200 `Response` without throwing.
- **`ResumeOptionsModal.test.tsx`**: update expectation — `recruiterPdf` href is now
  `/cv/pdf`.
- **`CvPdfDownload`**: renders a fallback anchor whose href is `/cv/pdf/download`.

## Commit cadence (atomic, per project CLAUDE.md)

Suggested slices, each red→green→refactor and independently buildable:
1. `download/route.ts` + test (file delivery).
2. `metadataBase` in root layout.
3. `opengraph-image.tsx` + test (share card).
4. `page.tsx` + `CvPdfDownload` + tests (HTML shell + auto/fallback download).
5. Repoint `resumePdf` in `data.ts` + update `ResumeOptionsModal` test.
6. Docs: `src/cv/README.md` (or `export/README.md`) note the new `/cv/pdf` surface.

## Open questions / confirm during planning
- **Canonical host.** The dialog links to `/cv/ats` etc. relative; `RESUME.hero.links.site`
  is `https://www.leonardosarmentodecastro.com` but the user shared
  `https://www.leonardosarmentocastro.com/...`. Confirm the exact production host for
  `metadataBase` before hardcoding.
