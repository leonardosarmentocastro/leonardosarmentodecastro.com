# CV machine-readable export — design

**Date:** 2026-06-21
**Status:** Approved, ready for implementation planning

## Problem

The CV website at `/cv` already holds a rich, single source of truth: the
`RESUME` object in `src/cv/data.ts` (typed by `Resume` in `src/cv/types.ts`).
It is rendered into a human-facing page, but there is no machine-readable
representation of it.

A separate, downstream **job-hunter scraper job** (out of scope for this
project) needs to consume the CV as its source of truth — to infer the
engineer's strongest skills and decide which job postings might fit, collecting
matches for later human screening. Today that consumer would have to scrape HTML
and guess.

Separately, the resume that hiring platforms ingest currently lives as a
hand-maintained file on Google Drive (`RESUME.hero.links.resumePdf`), which
drifts from the site because it is edited in a second place.

## Goal

Add **read-only export surfaces** derived from `RESUME`, so they can never drift
from the site. `data.ts` remains the only place content is edited.

### In scope

| Surface | URL | Output | Primary consumer |
| --- | --- | --- | --- |
| JSON | `/api/cv/json` | [JSON Resume](https://jsonresume.org/schema) standard | scraper job (machine) |
| ATS document | `/cv/ats` | server-generated PDF (one-click download) | hiring platforms |

### Out of scope

- The scraper / matcher job itself.
- A markdown / plain-text endpoint (considered and **dropped** — the scraper can
  consume JSON).
- Wiring any site button to `/cv/ats` (**deferred** to a future task — see
  [Future direction](#future-direction)).

## Architecture

Code is organized by domain (per `CLAUDE.md`): everything the export concern
needs lives under `src/cv/export/`.

```
src/cv/export/
  json-resume.ts        # toJsonResume(RESUME) -> JsonResume  (+ JsonResume type)
  ats-view-model.ts     # buildAtsResume(RESUME) -> pure, ordered section data
  AtsResumeDocument.tsx # @react-pdf/renderer component consuming the view-model
  README.md             # endpoints, schema mapping, work[].keywords join rule
  __tests__/            # colocated unit tests for each mapper
```

Route handlers stay in `src/app/` (Next.js convention exception in `CLAUDE.md`).
Each is **thin**: import data, call a pure mapper, return a response. Both pin
`export const runtime = "nodejs"` (required for `@react-pdf/renderer`).

```
src/app/api/cv/json/route.ts   # NextResponse.json(toJsonResume(RESUME)) + CORS
src/app/cv/ats/route.ts        # renderToBuffer(<AtsResumeDocument/>) -> application/pdf
```

`/cv/ats` is a child route segment of the existing `/cv` page (`src/app/cv/page.tsx`)
— no conflict; a route handler at `src/app/cv/ats/route.ts` returns the PDF.

### Key design choice: isolate the hard-to-test renderer

The PDF's **content and layout decisions** (section order, formatted date
strings, grouped skills, contact line) live in a pure `buildAtsResume()`
view-model that returns plain data and is unit-tested without rendering a PDF.
`AtsResumeDocument.tsx` is a thin presentational layer over that data. This keeps
the PDF renderer dumb and the logic testable.

### New dependency

- `@react-pdf/renderer` — produces real, selectable-text PDFs from React
  components in a Node route handler.

## JSON Resume mapping

Target schema: the [JSON Resume](https://jsonresume.org/schema) standard, for
interoperability beyond the bespoke scraper.

| JSON Resume field | Source in `RESUME` |
| --- | --- |
| `basics.name` | `hero.name` |
| `basics.label` | `hero.role` |
| `basics.summary` | `hero.blurb` |
| `basics.email` | `hero.links.email` |
| `basics.phone` | `hero.links.whatsappDisplay` |
| `basics.url` | `hero.links.site` |
| `basics.location` | parsed from `hero.location` |
| `basics.profiles[]` | `hero.links.linkedin`, `hero.links.github` |
| `work[].name` | `workExperience[].company` |
| `work[].position` | `workExperience[].role` |
| `work[].startDate` / `endDate` | `workExperience[].startDate` / `endDate` |
| `work[].summary` | `workExperience[].description` |
| `work[].highlights` | `workExperience[].bullets` |
| **`work[].keywords`** | **`workExperience[].technologies`** |
| `education[].institution` | `education[].school` |
| `education[].area` / `studyType` | `education[].degree` |
| `education[].startDate` / `endDate` | parsed from `education[].period` |
| `skills[].name` | `skills[].name` |
| `skills[].level` | `skills[].level` |
| `skills[].keywords` | `skills[].aliases` |
| `languages[]` | the two `Communication` skills (English, Portuguese) |

### Per-job technologies are essential — and preserved

The scraper ranks skill **strength**, which depends on *which technology was used,
in which job, for how long, and how recently*. The aggregate `skills[]` section
flattens that away (a tech used once in 2014 looks identical to one used across
the last four jobs). Therefore per-job technologies are emitted as
**`work[].keywords`**.

- `keywords` is a recognized JSON Resume field name (already used on `skills[]`,
  `projects[]`, `publications[]`); adding it to `work[]` follows the same
  convention and keeps the document standard-tolerant.
- The scraper can derive `firstUsed` / `lastUsed` / `totalMonths` / `jobCount`
  per technology by scanning `work[]` — deterministically, no guessing.
- The aggregate `skills[]` still ships as the engineer's **self-assessed** view
  (`level`, `aliases`→`keywords`). The matcher gets both the stated proficiency
  **and** the raw evidence to verify it.

### Alias join rule (documented in export README)

`work[].keywords` strings are emitted **unchanged** from
`workExperience[].technologies`. These already match `skills[].aliases` exactly —
the same mapping `src/cv/sections/Skills/matching.ts` relies on for the site's
skill↔work navigation. So a consumer joins `work[].keywords` → `skills[]` by
exact (case-insensitive) alias match. This rule is documented in
`src/cv/export/README.md`.

### Not mapped

- **Milestones** — narrative career notes with no JSON Resume home and low
  matching value. **Omitted.**

### `endDate` handling

`workExperience[].endDate` of `"Present"` is emitted by **omitting** the
`endDate` field (JSON Resume convention for ongoing roles).

## ATS PDF layout (`/cv/ats`)

Optimized to pass real-world ATS parsers (Workday, Greenhouse, Lever, Taleo):

- Single column. No icons, tables, columns, or text boxes for critical content.
- Built-in Helvetica; real selectable text (not an image).
- Standard section headings: `Summary`, `Skills`, `Experience`, `Education`.
- Contact details as a plain text line.
- Full work history included by default (ATS parsers do not penalize length).
- Response headers:
  `Content-Type: application/pdf`,
  `Content-Disposition: attachment; filename="Leonardo-Sarmento-de-Castro-Resume.pdf"`.

## Error handling & ops

- Mappers are pure and total over the typed `RESUME` (no runtime fetching), so
  the failure surface is minimal.
- `/api/cv/json` sends permissive CORS (`Access-Control-Allow-Origin: *`) — the
  data is public CV content and the cross-origin scraper may fetch it directly.
- Both surfaces can be statically cached (`export const dynamic = "force-static"`);
  a deploy regenerates them on the same cadence as the site.

## Testing (TDD)

- `json-resume.test.ts`: field mapping; `"Present"` → omitted `endDate`;
  `work[].keywords` populated from `technologies`; languages split out of
  `skills`; profiles built from links; milestones absent.
- `ats-view-model.test.ts`: structure of `buildAtsResume()` output — section
  order, formatted dates, contact line, full work history present.
- Route tests:
  - `/api/cv/json` — `GET` returns 200, `content-type: application/json`, body
    parses, CORS header present.
  - `/cv/ats` — `GET` returns 200, `content-type: application/pdf`, non-empty
    buffer beginning with the `%PDF` magic header,
    `Content-Disposition: attachment`.

## Documentation

`src/cv/export/README.md` (new domain README) documents: the two endpoints, the
full JSON Resume mapping table, the `work[].keywords` → `skills[]` alias-join
rule for consumers, and how the PDF is generated. The top-level `README.md`
links to it.

## Future direction (not built here)

A single chooser button on the web CV offering **human-readable PDF vs ATS PDF**,
both generated from `RESUME` — making `data.ts` the only place resume content is
edited and retiring the hand-maintained Google Drive file. The `/cv/ats` route
built here is the first half of that feature.
