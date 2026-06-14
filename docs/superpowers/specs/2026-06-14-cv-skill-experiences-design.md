# `/cv` — "Where I used this skill" — design

**Date:** 2026-06-14
**Status:** Approved for planning
**Domain:** `src/cv/`

## Problem

On the `/cv` page, the Skills section lists 16 skills as rich cards, and the Work
Experience section lists 16 jobs, each with a `technologies[]` array. A visitor
reading a skill (e.g. *JavaScript*) has no way to see **which jobs that skill was
actually used in**, nor to jump to those jobs. The two sections hold the
information needed to connect them, but the connection is invisible.

## Goal

Clicking a skill card opens a dialog listing every work experience in which that
skill was used. Clicking a work experience in the dialog closes it and anchors the
user to that specific work entry, with a brief highlight so the eye lands on it.

## Constraints

- Skill names and `technologies[]` strings do **not** align by string equality
  (e.g. skill `"MongoDB / Redis (NoSQL)"` vs technologies `"MongoDB"`, `"Redis"`;
  skill `"Next.js, Vite, TanStack"` vs technology `"Next.js"`). The link must be
  modeled explicitly, not inferred by fuzzy matching.
- Follow repo conventions (`CLAUDE.md`): feature code under `src/cv/`, pure logic
  separated from UI, tests colocated in `__tests__/`, TDD (red → green → refactor),
  Mantine 8 + Tailwind, GSAP for motion, Biome lint.
- Motion (smooth-scroll, highlight flash) must respect
  `prefers-reduced-motion`, consistent with the existing `/cv` scroll-fade behavior.

## Architecture

Six units, smallest/most-testable first.

### 1. Data model — `aliases` on `Skill`

Add `aliases: string[]` to the `Skill` type (`src/cv/types.ts`). Each skill
declares the exact `technologies[]` strings that represent it. Work entries remain
the single source of truth for what each job used; skills declare their identity.

Alias table (populated in `src/cv/data.ts`):

| Skill | aliases |
| --- | --- |
| AI tools (Claude Code, Cursor, etc) | `Claude Code`, `Cursor`, `GitHub Copilot` |
| JavaScript | `JavaScript` |
| TypeScript | `TypeScript` |
| Python | `Python` |
| Ruby (on Rails) | `Ruby on Rails` |
| React.js | `React.js` |
| React Native | `React Native` |
| Next.js, Vite, TanStack | `Next.js`, `Vite`, `TanStack` |
| Figma | `Figma` |
| Node.js | `Node.js` |
| MongoDB / Redis (NoSQL) | `MongoDB`, `Redis` |
| PostgreSQL / MySQL (SQL) | `PostgreSQL`, `MySQL` |
| CMS (Sanity, Payload, etc) | `Sanity`, `Sanity.io` |
| AWS | `AWS` |
| Docker | `Docker` |
| Git and CI/CD | `Git`, `GitHub Actions`, `Gitlab CI`, `Buildkite`, `Codeship`, `SVN` |

Coverage was checked against the current `data.ts`: every skill resolves to at
least one job. The empty-result path (below) is a safety net, not a routine state.

### 2. Matching — pure function

`experiencesForSkill(skill: Skill, entries: ReadonlyArray<WorkExperience>): WorkExperience[]`
in `src/cv/sections/Skills/matching.ts`.

- Returns entries whose `technologies` intersect `skill.aliases`.
- Comparison is case-insensitive **exact** string match (not substring), so
  `"Sanity"` matches `"Sanity"` but not `"Sanity.io"` — which is why both strings
  are listed as aliases where needed.
- Preserves the input order (most-recent-first, as in `RESUME.workExperience`).
- No DOM, no React — the testable core.

**What it does:** maps a skill to its jobs. **How you use it:** call with a skill
and the resume's work entries. **Depends on:** the `Skill`/`WorkExperience` types only.

### 3. Anchors — shared id helper

`workEntryAnchorId(entry: WorkExperience): string` in
`src/cv/sections/Work/anchors.ts` (or colocated with Work). Produces a stable slug
from `company` + `startDate` (mirrors the existing React `key` pattern
`` `${company}-${startDate}` ``). Used in exactly two places so they cannot drift:

1. `Work.tsx` — set as the `id` on each `WorkEntry` `<article>` (the article keeps
   its existing `data-testid`).
2. `SkillExperiencesModal` — to build the scroll target for each job row.

### 4. Dialog — `SkillExperiencesModal`

`src/cv/sections/Skills/SkillExperiencesModal.tsx`. Mantine `Modal`.

- Props: `{ skill: Skill | null; onClose: () => void; onExperienceClick: (entry: WorkExperience) => void }`.
  Open state is derived from `skill !== null`.
- Title: `Where I used {skill.name}`.
- Body: the matched entries (via `experiencesForSkill`) rendered as a vertical list
  of **button** rows; each row shows **company · role · startDate – endDate**.
- Empty result: render a short "No linked experiences yet." line (defensive; not
  expected to trigger with the current data).
- Accessibility: Mantine Modal already manages focus trap / `role="dialog"` /
  Escape. Rows are real `<button>`s.

### 5. Card affordance — `Skills` owns the interaction

`src/cv/sections/Skills/Skills.tsx`:

- `Skills` holds `const [activeSkill, setActiveSkill] = useState<Skill | null>(null)`
  and renders one `SkillExperiencesModal` driven by it.
- Each `SkillCard` becomes a `<button type="button" aria-haspopup="dialog">` with a
  subtle hover cue (e.g. border/shadow on hover) when the skill has ≥1 matched job.
  Skills with zero matches render as the current plain, non-interactive card.
- Clicking a card calls `setActiveSkill(skill)`.
- Existing `data-testid={`skill-card-${skill.name}`}` is preserved on the element.

### 6. Click-through — close, scroll, flash

When a dialog row is clicked, `Skills` (or a small `scrollToWorkEntry` helper in
`src/cv/sections/Work/anchors.ts`) does:

1. `setActiveSkill(null)` to close the modal.
2. Resolve the target via `document.getElementById(workEntryAnchorId(entry))`.
   The work entry lives in the page behind the modal, so it is always in the DOM.
3. If `matchMedia("(prefers-reduced-motion: no-preference)")` matches:
   `scrollIntoView({ behavior: "smooth", block: "start" })` and add a `.cv-flash`
   class that runs a ~1.2s ring/background fade, then removes itself
   (`setTimeout` or `animationend`).
   Otherwise: `scrollIntoView()` with no smooth behavior and **no** flash.

`.cv-flash` keyframes live in the nearest existing global stylesheet for `/cv`
(the plan task will identify the exact file).

### 7. Analytics

Two new wrappers in `src/analytics/events.ts`, following the existing pattern:

- `trackSkillExperiencesOpen({ skill }: { skill: string })` → event
  `skill_experiences_opened`, prop `{ skill }`. Fired when a skill card opens the dialog.
- `trackSkillExperienceClick({ skill, company }: { skill: string; company: string })`
  → event `skill_experience_clicked`, props `{ skill, company }`. Fired when a job
  row in the dialog is clicked.

Both documented in `src/analytics/README.md` in the same commit that adds them.

## Data flow

```
SkillCard (button)
  └─ click → setActiveSkill(skill) ───────────────┐
                                                   ▼
                              SkillExperiencesModal (skill !== null)
                                   │  body = experiencesForSkill(skill, RESUME.workExperience)
                                   │
   row click → onExperienceClick(entry):
       trackSkillExperienceClick({ skill, company })
       setActiveSkill(null)                         // close
       scrollToWorkEntry(entry)                     // getElementById(workEntryAnchorId(entry))
                                                     //  → smooth scroll + .cv-flash (reduced-motion gated)
                                                     ▼
                              WorkEntry <article id={workEntryAnchorId(entry)}>
```

## Error / edge handling

- **Skill with zero matched jobs:** card is non-interactive; modal (if ever reached)
  shows "No linked experiences yet."
- **Target element missing** (`getElementById` returns null): no-op, no throw.
- **Alias matches nothing in a job:** simply excluded — exact-match semantics.
- **Duplicate companies:** none exist today; anchor id uses `company`+`startDate`
  so it stays unique even if a company recurs later.

## Testing

TDD throughout. New/affected tests:

- `matching.test.ts` — `experiencesForSkill`: exact-match (not substring) semantics;
  multi-alias skill (MongoDB/Redis) hits the right jobs; order preserved;
  unknown/empty aliases → `[]`; a representative real skill (JavaScript) returns the
  expected set from `RESUME`.
- `anchors.test.ts` — `workEntryAnchorId` is stable and unique for the current data;
  same input → same output.
- `SkillExperiencesModal.test.tsx` — renders matched rows with company/role/dates;
  closed when `skill === null`; clicking a row calls `onExperienceClick` with the
  entry; empty-state copy when no matches.
- `Skills.test.tsx` (extend) — card is a `button`; clicking opens the modal for that
  skill; zero-match skill renders non-interactive.
- `Work.test.tsx` (extend) — each `WorkEntry` article carries
  `id={workEntryAnchorId(entry)}`.
- `events.test.ts` (extend) — the two new wrappers call PostHog `capture` with the
  right event name and props.

Scroll/flash DOM side effects and `prefers-reduced-motion` branching are verified at
the unit level where practical (e.g. the helper adds/removes the class); full
smooth-scroll visuals are confirmed in the manual smoke check.

## Out of scope

- Reverse direction (clicking a technology badge in a job to see the skill).
- Filtering/searching skills.
- Persisting or deep-linking the open dialog in the URL.
- Changing skill or work content/ordering.

## Files touched

- `src/cv/types.ts` — add `aliases` to `Skill`.
- `src/cv/data.ts` — populate `aliases` for all 16 skills.
- `src/cv/sections/Skills/matching.ts` (+ `__tests__/matching.test.ts`) — new.
- `src/cv/sections/Work/anchors.ts` (+ `__tests__/anchors.test.ts`) — new
  (`workEntryAnchorId`, `scrollToWorkEntry`).
- `src/cv/sections/Skills/SkillExperiencesModal.tsx` (+ test) — new.
- `src/cv/sections/Skills/Skills.tsx` (+ test) — card → button, modal wiring.
- `src/cv/sections/Work/Work.tsx` (+ test) — anchor `id` per entry.
- `src/analytics/events.ts` (+ `__tests__/events.test.ts`) — two new wrappers.
- `src/analytics/README.md` — document the two events.
- global `/cv` stylesheet — `.cv-flash` keyframes.
- `src/cv/README.md` — note the skill→experience interaction.
