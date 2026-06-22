# Canonical web CV: PDF export + format dialogs — Design

- **Date:** 2026-06-22
- **Status:** Approved (design); ready for implementation plan
- **Domain:** `src/cv/`

## Background

The CV currently exists in three forms:

- **`/cv`** — `CVPage`, the interactive web version (GSAP scroll reveals, a two-lane
  scroll-driven Work timeline with a glowing spine, a Skills modal, an animated company-logo
  marquee, and an interactive "Get in Touch" section). Built previously as the web port of a
  recruiter-focused PDF.
- **`/cv/ats`** — a server-generated, machine-readable ATS PDF via `@react-pdf/renderer`
  (`force-static`).
- **`/api/cv/json`** — a JSON Resume export for external scraping tools.

A separate, hand-made **recruiter PDF** is hosted on Google Drive and linked via
`RESUME.hero.links.resumePdf`. The landing page "RESUME" button opens `ResumeOptionsModal`,
which today offers two choices: the Google Drive PDF and the web version. On `/cv`, the Hero
renders a row of social/PDF icon links; the PDF icon links straight to the Google Drive file.

## Goals

1. **Make `/cv` the canonical source of truth** and make it **exportable as a polished A4 PDF**
   that faithfully reproduces the desktop web look (minus screen-only ornamentation). This
   generated PDF **replaces** the Google Drive recruiter PDF.
2. **Upgrade the format dialogs** so users can choose between the recruiter PDF, the ATS PDF,
   and the web version:
   - Landing page "RESUME" button → **3 options**: recruiter PDF, ATS PDF, web version.
   - `/cv` Hero PDF icon → **2 options**: recruiter PDF, ATS PDF.

This CV is **human-impression focused**, not ATS-focused — its job is to convey that
considerable care went into crafting the UI. (ATS needs are already served by `/cv/ats`.)

## Non-goals

- No change to `/cv/ats` output or `/api/cv/json`.
- No change to the **web** `/cv` page's interactive behavior, hero icons, or "Get in Touch"
  section. All print-mode transformations are scoped to the generated PDF only.
- No runtime/serverless PDF generation. The PDF is a committed static asset.

## Design

### 1. One CV, two render modes

`/cv` remains the single source of truth. Its section components gain a **print mode** that
yields a faithful, de-animated, paginated A4 variant. Print mode is rendered by a dedicated
route and only applies the transformations in the table below — the screen page is untouched.

| Aspect | Web `/cv` (screen) | PDF (print mode) |
|---|---|---|
| Hero social icons | shown (interactive) | **hidden** |
| GSAP reveals / glows / spine-fill animation | on | **off** (everything visible; solid spine) |
| Work timeline | desktop two-lane scroll timeline | **single left spine** (the mobile layout) at full width |
| Work cards | accordion, collapsed by default | **all expanded** (description + bullets + tech badges) |
| About marquee | animated scrolling logos | **static row of the 5 most-recent company logos** |
| Skills | category card grids (+ interactive modal) | same card grids, non-interactive |
| "Get in Touch" section | shown (interactive buttons + live clock) | **removed** |
| Contact | — | **new static Contact card section** (print-only) |

Section order is unchanged: Hero → About → Work → Education → Skills → Contact.

The **blue brand palette** (`CV_COLORS`, accent `#3c78d8`) is used throughout; no red accents
in the layout. Fonts (Domine / Quicksand / Spectral) match the web page.

#### Work timeline in print

Print mode renders the **mobile single-left-spine** layout at desktop width: one vertical spine
on the left, a node dot per role **centered on and touching the spine**, the date pill above
each card, and **every card expanded**. Milestone dividers render inline between entries. The
spine renders as a solid (static) blue line — no scroll-driven fill. The desktop two-lane /
sticky-cluster layout is not used in print.

> Note: the current mobile node placement bug (dot pushed into the row padding against the card,
> rather than centered on the spine) is corrected as part of the print layout.

### 2. The print route — `/cv/print`

A dedicated route renders the print-mode variant, reusing the same section components via a
`printMode` prop (or equivalent). It is:

- `noindex` and not linked in navigation.
- The Puppeteer render target.
- Browser-previewable for development/debugging.

This keeps screen vs. print concerns visibly separate and gives the generator a stable URL.

### 3. PDF generation — committed asset via local script

- A **`pnpm cv:pdf`** script renders `/cv/print` with headless Chrome (Puppeteer) and writes a
  committed asset, e.g. `public/cv/Leonardo-Sarmento-de-Castro-Resume.pdf`, using
  `format: "A4"`, `printBackground: true`, and controlled margins.
- The asset is **committed to the repo** and served as a plain static file — zero serverless
  dependencies, fully deterministic.
- A **CI freshness test** regenerates the PDF and fails if it differs from the committed copy,
  so the PDF can never silently drift from the CV data. (The author re-runs `pnpm cv:pdf` and
  commits when CV content changes — which already happens via commits.)
- `RESUME.hero.links.resumePdf` is updated to point to this local asset; the Google Drive link
  retires.

**Rationale for build-vs-runtime:** content is fully static and changes only via commits, so a
committed asset is the simplest, most robust, deterministic option. True build-time Puppeteer on
Vercel is fragile (no running server to render during `next build`); runtime generation adds a
heavy serverless Chromium dependency. The local-script + committed-asset path avoids both.

### 4. Format dialogs — `ResumeOptionsModal` becomes configurable

`ResumeOptionsModal` is generalized to accept a configurable set of options (an options array or
a variant prop), rendering each as a choice card. Two configurations:

- **Landing page (3 options):**
  1. **Recruiter PDF** → the generated static asset (`RESUME.hero.links.resumePdf`).
  2. **ATS PDF** → `/cv/ats`.
  3. **Web version** → `/cv`.
- **`/cv` Hero PDF icon (2 options):**
  1. **Recruiter PDF** → generated static asset.
  2. **ATS PDF** → `/cv/ats`.

On `/cv`, the Hero PDF icon changes from a direct link into the dialog trigger (the hero icons
remain on the web page; only the PDF icon's behavior changes).

**Analytics:** add `trackResumeAtsClick`; reuse existing `trackResumePdfClick` (recruiter) and
`trackResumeWebClick`. Existing modal open/dismiss tracking on the landing page is preserved and
extended to the `/cv` trigger as appropriate.

### 5. Contact section (print-only)

A new static, card-styled Contact section (matching the Skills card visual language): each card
is an icon chip + bold label with the link/handle in gray beneath. Layout is a **2×2 grid with
50/50 columns**:

- Row 1: **LinkedIn** · **GitHub**
- Row 2: **WhatsApp** · **Email**
- Row 3: **Personal Site**, spanning the full width

Icon chips use brand colors (LinkedIn blue, GitHub dark, WhatsApp green, Email red is acceptable
here, Site neutral). This section appears **only in the generated PDF**, replacing the removed
hero icons and "Get in Touch" section. The web `/cv` page is unchanged.

## File organization

All new code lives under the `src/cv/` domain, per the project's domain-first structure:

- Print route under `src/app/cv/print/` (Next.js routing convention).
- Print-mode rendering and the new print-only Contact section under `src/cv/` (e.g. a print
  page component + a `Contact` print section), colocated with tests in `__tests__/`.
- The PDF generation script and its filename/path constants under the `src/cv` domain (script
  invoked via `pnpm cv:pdf`).
- `ResumeOptionsModal` stays in `src/cv/` and is extended in place.
- Update `src/cv/README.md` (and `.env`/top-level docs only if needed) to document the
  `pnpm cv:pdf` workflow, the committed-asset location, and the CI freshness check.

## Testing (TDD)

Per repo discipline (red → green → refactor; bug fixes get a regression test first):

- **Print route / print mode**: renders hero without social icons; renders the static Contact
  section; renders all work entries expanded; renders the single-left-spine Work layout; omits
  the interactive "Get in Touch". Regression test for the **timeline node centered on the
  spine**.
- **Static marquee**: renders exactly the 5 most-recent company logos, statically (no marquee
  animation wrapper).
- **`ResumeOptionsModal`**: renders the correct option set for the 3-option (landing) and
  2-option (`/cv`) configurations; each option points to the correct destination; fires the
  correct analytics events (including new `trackResumeAtsClick`).
- **`/cv` Hero**: PDF icon opens the dialog (no longer a direct external link); web hero icons
  otherwise unchanged.
- **Analytics**: `trackResumeAtsClick` emits the expected event.
- **PDF freshness (CI)**: regenerating from `/cv/print` matches the committed asset.

Escape hatch: if any part of Puppeteer-based generation cannot be tested in the CI runner
(headless Chromium availability), document why and assert on the print route's rendered DOM
instead of the binary PDF.

## Rollout

- Single feature branch `feat/cv-web-pdf-export`; atomic commits per the repo's commit
  discipline (one increment each: print mode, print route, static Contact, static marquee,
  generation script, freshness test, dialog generalization, landing 3-option wiring, `/cv`
  trigger wiring, retire Google Drive link).
- Merge to `main` only after review (every push to `main` triggers a Vercel production deploy).

## Resolved details

- **Print render**: dedicated `/cv/print` route (not a query flag on `/cv`).
- **Contact scope**: print-only; web `/cv` keeps hero icons + interactive "Get in Touch".
- **Recruiter PDF**: the generated asset replaces the Google Drive file.
- **Contact layout**: 2×2 grid, 50/50 columns, Personal Site full-width on the bottom row.

## Open detail for the plan (non-blocking)

- **Filename disambiguation**: the `/cv/ats` route currently serves
  `Leonardo-Sarmento-de-Castro-Resume.pdf`. Disambiguate so the recruiter and ATS downloads
  don't collide (e.g. ATS → `…-Resume-ATS.pdf`, recruiter → `…-Resume.pdf`). Decide exact names
  in the plan.
