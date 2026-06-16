# Work Badge → Skill Navigation

**Date:** 2026-06-16  
**Status:** Approved design  
**Companion:** Skills → Work navigation (`SkillExperiencesModal`, `scrollToWorkEntry`)

## Summary

Add reverse navigation from work experience technology badges to the corresponding skill card in the Skills section. Mapped badges become interactive: hover (desktop) or first tap (touch) shows a tooltip with skill level and star rating; click (desktop) or second tap (touch) scrolls to the skill card with the same flash highlight used for work entries. Unmapped technology strings remain static badges with no tooltip or click behavior.

## Background

The CV page already supports **Skills → Work** navigation: clicking a skill card opens `SkillExperiencesModal`; selecting a job calls `scrollToWorkEntry`, which smooth-scrolls, flashes the target, and expands the work accordion via `cv:open-work-entry`.

Work entries render technology strings as plain `Badge` components in `WorkTimelineItem.tsx` — no link back to skills. Of ~60 unique technology strings across work entries, ~31 map to a skill alias and ~29 do not (e.g. Java, PHP, Kubernetes). Alias lookup is case-insensitive and exact (no substring matching), consistent with `experiencesForSkill` in `matching.ts`.

## Goals

- Clicking a **mapped** technology badge navigates to the corresponding skill card.
- Hovering a mapped badge (desktop) shows tooltip: `{level} · ★★★★☆`.
- On touch devices, first tap shows the same level + stars plus hint *"Tap again to see skill"*; second tap navigates.
- Arrival mirrors work navigation: smooth scroll + `.cv-flash` (respecting `prefers-reduced-motion`).
- Unmapped badges stay visually unchanged — no interaction.

## Non-goals

- Expanding `data.ts` to cover unmapped technologies.
- URL hash deep links (`#skill-typescript`).
- Opening `SkillExperiencesModal` on arrival.
- Changing the existing Skills → Work flow.

## Approach

**Option 2 (chosen):** `WorkTechnologyBadge` component + shared navigation helpers.

Extract badge interaction into a dedicated component under `src/cv/sections/Work/`. Add reverse lookup in `matching.ts` and `scrollToSkill` in `src/cv/sections/Skills/anchors.ts`, mirroring the work-side pattern in `sections/Work/anchors.ts`.

Rejected alternatives:

1. **Inline in `WorkTimelineItem`** — bloats an already large component; two-tap mobile logic hard to test.
3. **URL hash deep links** — overkill for in-page CV navigation; adds hash listener complexity.

## Architecture

### Reverse lookup — `skillForTechnology`

New function in `src/cv/sections/Skills/matching.ts`:

```ts
skillForTechnology(tech: string, skills: ReadonlyArray<Skill>): Skill | null
```

- Builds a lookup from lowercased alias → `Skill`.
- Returns the skill whose `aliases` include an exact case-insensitive match for `tech`.
- Returns `null` when no skill matches (same rules as `experiencesForSkill`, inverted).
- No substring matching (`"Sanity"` ≠ `"Sanity.io"`).

### Skill anchors — `skillAnchorId` + `scrollToSkill`

New file: `src/cv/sections/Skills/anchors.ts`

**`skillAnchorId(skill: Skill): string`**

- Slugifies `skill.name` with the same normalization as `workEntryAnchorId` (NFD accent strip, lowercase, non-alphanumeric → `-`).
- Prefix: `skill-` (e.g. `skill-typescript`).

**`scrollToSkill(skill: Skill): void`**

Mirrors `scrollToWorkEntry`:

1. Find element by `skillAnchorId(skill)`.
2. `scrollIntoView` with `behavior: smooth` when `prefers-reduced-motion: no-preference`, else `auto`.
3. Add `.cv-flash` class; remove on `animationend` (skip flash when reduced motion).
4. No custom event needed (skills section has no accordion state).

### Skill card DOM ids

In `Skills.tsx`, each skill card wrapper (both interactive `button` and static `div` variants) receives:

- `id={skillAnchorId(skill)}`
- `scroll-mt-24` class (same dock offset as work entries).

### Shared star rendering — `SkillStars`

Extract the `Stars` component from `Skills.tsx` into `src/cv/sections/Skills/SkillStars.tsx`. Used by:

- Skill cards (existing display)
- `WorkTechnologyBadge` tooltip content

### `WorkTechnologyBadge` component

New file: `src/cv/sections/Work/WorkTechnologyBadge.tsx`

**Props:**

| Prop | Type | Purpose |
| --- | --- | --- |
| `technology` | `string` | Badge label and lookup key |
| `company` | `string` | Analytics context (which work entry) |

**Behavior:**

| Condition | Render |
| --- | --- |
| `skillForTechnology` returns `null` | Static `Badge` — identical to current appearance, no tooltip, no pointer cursor |
| Skill found | `<button>` styled as badge, wrapped in Mantine `Tooltip` |

**Mapped badge styling:**

- Same visual as current badge (`Badge` variant + `workBadge` classes + `TechIcon`).
- `cursor-pointer`, subtle hover border (aligned with skill card hover).
- `aria-label`: `"View {skill.name} skill — {level}, {stars} of 5 stars"`.
- `data-testid`: `work-tech-badge-{technology}` (kebab or sanitized).

**Desktop** (`(hover: hover) and (pointer: fine)`):

- Mantine `Tooltip` on hover.
- Tooltip label (React node): `{level} · <SkillStars count={skill.stars} />`.
- Single click → `scrollToSkill(skill)` + analytics.

**Touch** (coarse pointer / no hover):

- Mantine `Tooltip` in controlled mode (`opened` state).
- First tap → open tooltip: level + stars + hint *"Tap again to see skill"*.
- Second tap on the **same** badge → navigate + close tooltip.
- Tap outside or on a different badge → reset hint state.

Detect pointer capability via `window.matchMedia('(hover: hover) and (pointer: fine)')` (or Mantine `useMediaQuery`).

**Integration:** `WorkTimelineItem.tsx` replaces the inline badge `map` with `<WorkTechnologyBadge technology={t} company={entry.company} />`.

### Analytics

New event in `src/analytics/events.ts`:

```ts
trackWorkTechnologySkillClick({
  technology: string;
  skill: string;
  company: string;
}): void
```

PostHog event name: `work_technology_skill_clicked`.

Fires on navigation (desktop single click, touch second tap) — not on first-tap tooltip reveal.

## Data flow

```
WorkTimelineItem
  └─ WorkTechnologyBadge(technology, company)
       ├─ skillForTechnology(technology, RESUME.skills)
       │    └─ null → static Badge
       │    └─ Skill → interactive button + Tooltip
       └─ on navigate → scrollToSkill(skill) + trackWorkTechnologySkillClick

Skills.tsx
  └─ skill card wrapper id={skillAnchorId(skill)}
       └─ target of scrollToSkill + cv-flash
```

## Testing

| File | Coverage |
| --- | --- |
| `matching.test.ts` | `skillForTechnology`: case-insensitive match, no substring, unknown → `null`, alias round-trip with `experiencesForSkill` |
| `Skills/anchors.test.ts` | `skillAnchorId` stability; `scrollToSkill` scroll + flash; reduced-motion skips flash |
| `WorkTechnologyBadge.test.tsx` | Unmapped = static badge; mapped = button; desktop click → scroll + analytics; touch two-tap flow; tooltip content (level + stars + hint) |
| `Work.test.tsx` | Integration smoke: expand accordion, mapped badge renders as button |
| `events.test.ts` | `work_technology_skill_clicked` event shape |

**Regression guard:** For every string in `RESUME.workExperience[*].technologies` that matches a skill alias, assert `skillForTechnology` resolves non-null. Complements the existing test that every skill resolves to at least one experience.

## Documentation

Update `src/cv/README.md` — add **Work → skill navigation** subsection under the existing **Skill → work navigation** section, documenting alias lookup, tooltip behavior, touch two-tap, and analytics event.

## Files changed (expected)

| File | Change |
| --- | --- |
| `src/cv/sections/Skills/matching.ts` | Add `skillForTechnology` |
| `src/cv/sections/Skills/__tests__/matching.test.ts` | Tests for reverse lookup |
| `src/cv/sections/Skills/anchors.ts` | New: `skillAnchorId`, `scrollToSkill` |
| `src/cv/sections/Skills/__tests__/anchors.test.ts` | New: anchor + scroll tests |
| `src/cv/sections/Skills/SkillStars.tsx` | New: extracted star component |
| `src/cv/sections/Skills/Skills.tsx` | Anchor ids, import `SkillStars` |
| `src/cv/sections/Work/WorkTechnologyBadge.tsx` | New: interactive badge |
| `src/cv/sections/Work/__tests__/WorkTechnologyBadge.test.tsx` | New: component tests |
| `src/cv/sections/Work/WorkTimelineItem.tsx` | Use `WorkTechnologyBadge` |
| `src/analytics/events.ts` | Add `trackWorkTechnologySkillClick` |
| `src/analytics/__tests__/events.test.ts` | Event test |
| `src/cv/README.md` | Document Work → skill navigation |

## Decisions log

| Decision | Choice | Rationale |
| --- | --- | --- |
| Unmapped technologies | Static badge, no interaction | ~29 of 60 tech strings have no skill alias; expanding data is out of scope |
| Arrival animation | Mirror work: scroll + `.cv-flash` | Consistent cross-section navigation UX |
| Touch tooltip | Two-tap with hint text | Hover unavailable on touch; hint teaches discoverability |
| Desktop tooltip content | Level + stars only | Technology name already visible on badge |
| Approach | Dedicated component + helpers | Testable, symmetric with existing Skills → Work architecture |
