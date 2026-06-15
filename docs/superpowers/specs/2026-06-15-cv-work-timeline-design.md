# CV Work Experience Timeline — Design Spec

**Date:** 2026-06-15  
**Status:** Approved (brainstorming)  
**Approach:** shadcn/ui + GSAP ScrollTrigger

## Summary

Replace the flat Work Experience list with a Shadcn Studio–inspired vertical timeline: centered spine with scroll-driven progress fill, work entries as shadcn Cards with multi-open Accordions, and milestone dividers between entries. Parallel employment (e.g. Écolheita alongside Radical Imaging / PureCars / PairTree) uses explicit lane assignment and sticky left-lane pinning on desktop.

## Goals

- Visual timeline matching [Shadcn Timeline Component](https://shadcnstudio.com/blocks/marketing-ui/timeline-component) reference (alternating cards, date pills, scroll progress spine).
- Collapsed accordion shows company, period, role, and metadata; expanded shows description, bullets, and technologies.
- Expanded cards switch to a dark active theme; multiple accordions may be open simultaneously.
- Preserve skill → experience navigation (scroll, auto-expand, highlight).
- Milestones render as full-width dividers, not cards.
- Responsive: alternating layout at `md+`; single-column with left spine below `md`.

## Non-goals

- Company logo bullets on timeline nodes (deferred; not in this iteration).
- Replacing Mantine elsewhere on the CV page.
- Installing Shadcn Studio premium blocks verbatim.

## Color palette

Applied to Work timeline and shadcn theme tokens for Card/Accordion/Badge in this section.

| Token     | Hex       | Usage |
|-----------|-----------|-------|
| Primary   | `#222222` | Dark text, spine progress fill, expanded card background, date pill (active) |
| Secondary | `#7B7B7B` | Muted text, metadata, spine track (unfilled), borders |
| Tertiary  | `#F8F8F8` | Expanded panel inner background (optional), tech badge backgrounds |
| White     | `#FFFFFF` | Collapsed card background, page background, text on dark cards |

> **Note:** User provided `#22222` (5 digits); interpreted as `#222222`.

### Theme mapping

| State              | Background | Text      | Border    |
|--------------------|------------|-----------|-----------|
| Collapsed card     | `#FFFFFF`  | `#222222` | `#7B7B7B` at low opacity or `#F8F8F8` edge |
| Expanded card      | `#222222`  | `#FFFFFF` | `#222222` |
| Expanded metadata  | —          | `#7B7B7B` on dark (lightened for contrast) | — |
| Spine track        | —          | —         | `#7B7B7B` (2px) |
| Spine progress     | `#222222`  | —         | — |
| Date pill          | `#222222`  | `#FFFFFF` | — |
| Milestone divider  | —          | `#7B7B7B` | `#7B7B7B` hr |
| cv-flash highlight | amber tint | —         | — (existing) |

## Data model

### `WorkExperience` extension (`src/cv/types.ts`)

```typescript
export type WorkExperience = {
  // …existing fields…
  lane: "left" | "right";
  /** When set, this entry sticks on its lane while scrolling through the overlap cluster until the named company's region ends. Desktop only. */
  stickyThrough?: string;
};
```

### Field semantics

- **`lane`** — Deterministic placement on desktop/tablet (`md+`). Cards render on the left or right of the center spine. Non-overlapping entries alternate by convention but explicit `lane` in data is the source of truth.
- **`stickyThrough`** — Optional company name (must match another entry's `company`). Enables sticky pinning: e.g. Écolheita has `lane: "left"` and `stickyThrough: "PairTree"` so it appears once and stays pinned on the left while Radical Imaging, PureCars, and PairTree scroll on the right; unpins after PairTree's region ends.

### Example data assignments

| Company         | lane   | stickyThrough |
|-----------------|--------|---------------|
| Pinterest       | right  | —             |
| PairTree        | right  | —             |
| PureCars        | right  | —             |
| Radical Imaging | right  | —             |
| Écolheita       | left   | PairTree        |
| *(others)*      | explicit per entry | — |

### `Milestone` — unchanged

```typescript
export type Milestone = { year: number; text: string };
```

Interleaving logic in `Work.tsx` (`interleave()`) remains; milestones are not cards.

## Layout

### Page width

Widen the entire CV page container from `max-w-[680px]` to `max-w-5xl` (~1024px) in `CVPage.tsx`.

### Desktop / tablet (`md+`, ≥768px)

```
                    [date pill]
                         │
    [card left] ─────────●───────── [card right]
                         │
              ─── milestone hr ───
                         │
                    [date pill]
                         │
    [card left] ─────────●───────── [card right]
```

- **Center spine:** 2px vertical line, `#7B7B7B` track; `#222222` fill grows top-to-bottom with scroll progress (GSAP ScrollTrigger scrubbed to timeline container).
- **Date pill:** Opposite side from card; shows `startDate — endDate`. Same period also appears in accordion trigger header.
- **Cards:** shadcn Card wrapping shadcn Accordion item.
- **Timeline nodes:** Small circle on spine at each work entry (filled `#222222` when progress reaches node, else `#7B7B7B`).

### Parallel overlap (Option C + sticky pin)

- Entries listed most-recent-first (existing order).
- Overlap cluster detected when date ranges intersect and lanes differ.
- Long-running entry (Écolheita) rendered once; wrapped in sticky container spanning from first to `stickyThrough` entry in the cluster.
- `position: sticky; top: <offset>` on desktop only; disabled below `md`.
- Right-lane entries (Radical Imaging, PureCars, PairTree) stack normally on the right.

### Mobile (`< md`)

- Single column; spine aligned left of content.
- Date pills above card (not on opposite side).
- No sticky pinning — standard vertical stack.
- Lane field ignored for layout (all cards full-width).

### Milestone dividers

Full-width horizontal rule (`border-color: #7B7B7B`) with milestone text centered above or on the rule. Italic, `#7B7B7B`, no card chrome. Does not consume a spine node.

## Accordion content

### Collapsed trigger

- **Line 1:** Company name (semibold) + period (`startDate — endDate`)
- **Line 2:** Role + optional metadata: `via · workMode · location` (omit empty segments)

### Expanded panel

- Description paragraph
- Bullet list (`entry.bullets`)
- Technology badges with `TechIcon` (reuse existing icon mapping)

### Accordion behavior

- shadcn Accordion `type="multiple"` — opening one does not close others.
- **Collapsed:** white card theme.
- **Expanded:** dark active theme (`#222222` bg, `#FFFFFF` text); badges use `#F8F8F8` bg with `#222222` text.

## Animations

All gated behind `prefers-reduced-motion: no-preference` (match existing CV patterns).

| Animation        | Trigger                          | Implementation        |
|------------------|----------------------------------|-----------------------|
| Spine progress   | Scroll through timeline section  | GSAP ScrollTrigger scrub on fill height/scaleY |
| Card fade-in     | Card enters viewport             | GSAP ScrollTrigger: opacity 0→1, y 12→0 |
| cv-flash         | Skill navigation                 | Existing CSS keyframe on anchor element |
| Accordion expand | User click / skill navigation    | shadcn/Radix default  |

Reduced-motion: instant layout, no fade/flash/scrub; scroll uses `behavior: "auto"`.

## Skill navigation

Extend `scrollToWorkEntry` in `anchors.ts`:

1. Smooth scroll to `workEntryAnchorId(entry)` (existing).
2. Programmatically open the matching Accordion item (controlled state or `data-state` + click simulation via ref callback).
3. Apply dark active theme (follows open state).
4. Apply `cv-flash` class (existing amber pulse).

Triggered from `Skills.tsx` → `SkillExperiencesModal` → `onExperienceClick` (unchanged call site).

## Component architecture

```
src/cv/sections/Work/
├── Work.tsx                    # Section shell, interleave, GSAP ScrollTrigger setup
├── timeline-layout.ts          # Overlap cluster detection, sticky container grouping
├── WorkTimelineItem.tsx        # Date pill + spine node + Card + Accordion
├── WorkMilestoneDivider.tsx    # Full-width hr + centered text
├── WorkTimelineSpine.tsx       # Track + progress fill element
├── work-colors.ts              # Palette tokens (#222222, #7B7B7B, #F8F8F8, #FFF)
├── anchors.ts                  # scrollToWorkEntry extended with expand + flash
└── __tests__/
    ├── Work.test.tsx
    ├── timeline-layout.test.ts
    └── anchors.test.ts

src/components/ui/              # shadcn (new)
├── accordion.tsx
├── card.tsx
└── badge.tsx
```

### shadcn setup

- Initialize shadcn/ui with Tailwind v4 compatibility.
- Scope custom colors to CSS variables used by Card/Accordion in Work section, or override via `work-colors.ts` class maps.
- Mantine remains for Modal (Skills), notifications, etc.

### `timeline-layout.ts` responsibilities

Pure functions, unit-tested:

- `buildTimelineItems(entries, milestones)` — wraps existing `interleave()`.
- `detectOverlapClusters(items)` — group entries with intersecting date ranges.
- `buildStickyGroups(items)` — return render groups: `{ stickyEntry?, siblings[], throughEntry }`.

Date parsing reuses `parseStartYear` pattern; extend to month-level overlap for accuracy.

## Testing

| Test | Assertion |
|------|-----------|
| Work renders heading + all companies | Existing tests updated for accordion structure |
| Collapsed shows company, period, role, metadata | Per entry |
| Expanded shows description, bullets, tech | On accordion open |
| Milestones are dividers, not cards | No `data-testid="work-entry-*"` on milestones |
| Lane renders correct side at `md+` | Snapshot or data-side attribute |
| Écolheita sticky group includes PairTree cluster | `timeline-layout.test.ts` |
| `scrollToWorkEntry` opens accordion + flash | `anchors.test.ts` |
| Reduced motion skips flash | Existing test preserved |
| Tech icons in badges | Existing Pinterest test adapted |

## Dependencies

- Add shadcn/ui (`accordion`, `card`, `badge`) via CLI.
- Existing: GSAP, `@gsap/react`, ScrollTrigger, Tailwind 4.

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| shadcn + Mantine CSS conflicts | Scope shadcn to Work section; test visually |
| Sticky pin jank on Safari | Test cross-browser; fallback to static layout if sticky fails |
| Month-level overlap edge cases | Unit tests with Écolheita/PairTree dates |
| Accordion programmatic open from scroll | Controlled `value` state on Accordion root |

## Open items (none)

All brainstorming decisions resolved.
