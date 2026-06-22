# `src/cv/export/`

Read-only machine-readable exports derived from `RESUME` (`src/cv/data.ts`).
`data.ts` stays the single source of truth — these surfaces re-derive from it on
every deploy, so they never drift from the site.

## Endpoints

| URL | Output | Source mapper | Consumer |
| --- | --- | --- | --- |
| `/api/cv/json` | [JSON Resume](https://jsonresume.org/schema) standard | `toJsonResume` (`json/json-resume.ts`) | job-hunter scraper (machine) |
| `/cv/ats` | Single-column, selectable-text PDF (attachment download) | `buildAtsResume` + `AtsResumeDocument` | hiring platforms / ATS |

Both route handlers run on the Node.js runtime (`export const runtime = "nodejs"`),
required by `@react-pdf/renderer`. `/api/cv/json` sends `Access-Control-Allow-Origin: *`
because the data is public and a cross-origin scraper may fetch it directly.

## Files

Each export is a small folder: a thin orchestrator that calls per-section
mappers (`helpers.ts`) producing the shapes declared in `types.ts`.

| File | Purpose |
| --- | --- |
| `json/json-resume.ts` | `toJsonResume(resume)` → JSON Resume object (thin orchestrator). |
| `json/helpers.ts` | Pure mappers: `toIsoMonth`, `parseLocation`, `toWork`, `toEducation`, `toSkill`, `toLanguage`, `profileFromUrl`. |
| `json/types.ts` | `JsonResume` and its per-section sub-types. |
| `ats/build-ats-resume.ts` | `buildAtsResume(resume)` → plain, ordered section data (all PDF content/layout decisions, unit-testable without rendering). |
| `ats/helpers.ts` | Pure mappers: `toExperience`, `groupSkills`, `stripFlags`. |
| `ats/types.ts` | `AtsResume` and its per-section sub-types. |
| `AtsResumeDocument.tsx` | `@react-pdf/renderer` component + `renderAtsPdf(viewModel)` helper. |

## JSON Resume mapping

| JSON Resume field | Source in `RESUME` |
| --- | --- |
| `basics.{name,label,summary,email,phone,url}` | `hero.name` / `hero.role` / `hero.blurb` / `hero.links.email` / `hero.links.whatsappDisplay` / `hero.links.site` |
| `basics.location` | parsed from `hero.location` (flag emoji stripped; `Brazil` → `BR`) |
| `basics.profiles[]` | `hero.links.linkedin`, `hero.links.github` |
| `work[].{name,position,startDate,endDate,summary,highlights}` | `workExperience[].{company,role,startDate,endDate,description,bullets}` (dates → `YYYY-MM`; `"Present"` omits `endDate`) |
| `work[].keywords` | `workExperience[].technologies` |
| `education[].{institution,studyType,startDate,endDate}` | `education[].{school,degree}` + parsed `period` |
| `skills[].{name,level,keywords}` | non-`Communication` `skills[]` (`aliases` → `keywords`) |
| `skills[].yearsOfExperience` *(non-standard)* | `skills[].years` — self-assessed; omitted for `omitExperienceBar` skills or zero years |
| `languages[]` | `Communication` skills (English, Portuguese) |

**Not exported:** milestones (no JSON Resume home, low matching value).

## ATS PDF contents

The PDF mirrors the same source data as the JSON, so a human or hiring platform
reading it sees the same evidence:

- **Skills** are grouped by category and annotated with the engineer's
  self-assessed years of experience — `"JavaScript — Expert · 10 yrs"`. The years
  suffix is dropped for skills flagged `omitExperienceBar` (e.g. Portuguese, a
  native language), so they render as just `"Portuguese — Expert"`.
- **Experience** entries each end with a `Technologies:` line listing that role's
  `technologies`, the same per-job keywords the JSON exposes as `work[].keywords`.
  This answers the common hiring-form question — *"how many years with X?"* —
  by pairing the per-skill years above with the jobs that actually used each tech.

## Consumer join rule (skill strength inference)

`work[].keywords` strings are emitted **unchanged** from `workExperience[].technologies`.
These match `skills[].keywords` (the `aliases`) exactly — the same mapping
`src/cv/sections/Skills/matching.ts` relies on for the site's skill↔work
navigation. A consumer can therefore:

1. Read each `skills[]` entry for the engineer's **self-assessed** level and
   `yearsOfExperience` — the curated answer to "how many years with X?", taken
   straight from `data.ts` rather than inferred.
2. Join `work[].keywords` → `skills[]` by exact, case-insensitive match to get
   the **evidence**: which jobs used each technology, their dates, and durations.

This lets the scraper compute per-technology `firstUsed` / `lastUsed` /
`totalMonths` / `jobCount` deterministically — no guessing. Note these computed
spans can legitimately differ from the curated `yearsOfExperience` (a span across
jobs is not the same as focused years of practice); prefer `yearsOfExperience`
when reporting a single number.

## Editing

Change `src/cv/data.ts`. Both endpoints re-derive automatically; run
`pnpm test:run src/cv/export` to confirm the mappers still pass.
