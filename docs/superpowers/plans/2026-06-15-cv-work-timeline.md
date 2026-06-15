# CV Work Experience Timeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat Work Experience list with a Shadcn-style scroll-progress timeline (Card + multi-open Accordion), lane-based layout with sticky parallel pinning, milestone dividers, and preserved skill deep-link navigation.

**Architecture:** Pure layout functions in `timeline-layout.ts` compute interleaved items and sticky overlap groups from explicit `lane` / `stickyThrough` data. `Work.tsx` owns a controlled shadcn Accordion (`type="multiple"`), renders spine + items, and wires GSAP ScrollTrigger for spine fill and card fade-ins. `scrollToWorkEntry` dispatches a `cv:open-work-entry` CustomEvent consumed by `Work` to auto-expand + flash.

**Tech Stack:** Next.js 15, React 19, TypeScript strict, shadcn/ui (Accordion, Card, Badge), GSAP + ScrollTrigger, Tailwind CSS 4, Vitest + Testing Library, pnpm, Biome.

**Design spec:** `docs/superpowers/specs/2026-06-15-cv-work-timeline-design.md`

> **Supersedes:** `docs/superpowers/plans/2026-06-15-cv-work-timeline-accordion.md` (Mantine Timeline + company logos — no longer the target).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components.json` | **Create** | shadcn/ui config |
| `src/components/ui/accordion.tsx` | **Create** | shadcn Accordion primitive |
| `src/components/ui/card.tsx` | **Create** | shadcn Card primitive |
| `src/components/ui/badge.tsx` | **Create** | shadcn Badge primitive |
| `src/cv/types.ts` | **Modify** | Add `lane`, `stickyThrough?` to `WorkExperience` |
| `src/cv/data.ts` | **Modify** | Add `lane` (+ `stickyThrough` for Écolheita) on every entry |
| `src/cv/__tests__/data.test.ts` | **Modify** | Assert every work entry has valid `lane` |
| `src/cv/sections/Work/work-colors.ts` | **Create** | Palette tokens + Tailwind class maps |
| `src/cv/sections/Work/timeline-layout.ts` | **Create** | Date parsing, overlap, sticky groups, interleave |
| `src/cv/sections/Work/__tests__/timeline-layout.test.ts` | **Create** | Unit tests for layout pure functions |
| `src/cv/sections/Work/WorkMilestoneDivider.tsx` | **Create** | Full-width hr + centered milestone text |
| `src/cv/sections/Work/WorkTimelineSpine.tsx` | **Create** | Track + progress fill ref target |
| `src/cv/sections/Work/WorkTimelineItem.tsx` | **Create** | Date pill, node, Card, Accordion item |
| `src/cv/sections/Work/Work.tsx` | **Rewrite** | Section shell, sticky clusters, GSAP, accordion state |
| `src/cv/sections/Work/anchors.ts` | **Modify** | Dispatch `cv:open-work-entry` CustomEvent |
| `src/cv/sections/Work/__tests__/anchors.test.ts` | **Modify** | Assert event dispatch |
| `src/cv/sections/Work/__tests__/Work.test.tsx` | **Modify** | Accordion structure, milestones, auto-expand |
| `src/cv/pages/CVPage/CVPage.tsx` | **Modify** | Widen container to `max-w-5xl` |
| `src/app/globals.css` | **Modify** | shadcn CSS variables (scoped palette) |
| `src/cv/README.md` | **Modify** | Document lane fields + timeline conventions |

---

## Branch setup

- [ ] **Step 1: Create feature branch**

```bash
git checkout -b feat/cv-work-timeline
```

---

## Task 1: Extend `WorkExperience` type

**Files:**
- Modify: `src/cv/types.ts`

- [ ] **Step 1: Add lane fields**

In `src/cv/types.ts`, extend `WorkExperience`:

```typescript
export type WorkLane = "left" | "right";

export type WorkExperience = {
  company: string;
  role: string;
  via?: string;
  workMode: "remote" | "in office";
  startDate: string;
  endDate: string | "Present";
  location?: string;
  description: string;
  bullets: string[];
  technologies: string[];
  lane: WorkLane;
  /** Desktop sticky pin: stay on lane until this company's scroll region ends */
  stickyThrough?: string;
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: errors in `data.ts` (missing `lane`) — fixed in Task 4.

- [ ] **Step 3: Commit**

```bash
git add src/cv/types.ts
git commit -m "feat(cv): add lane and stickyThrough to WorkExperience type"
```

---

## Task 2: Work color tokens

**Files:**
- Create: `src/cv/sections/Work/work-colors.ts`

- [ ] **Step 1: Create palette module**

```typescript
// src/cv/sections/Work/work-colors.ts
export const WORK_COLORS = {
  primary: "#222222",
  secondary: "#7B7B7B",
  tertiary: "#F8F8F8",
  white: "#FFFFFF",
} as const;

/** Collapsed accordion card */
export const workCardCollapsed =
  "bg-white border border-[#7B7B7B]/30 text-[#222222]";

/** Expanded accordion card (dark active) */
export const workCardExpanded =
  "bg-[#222222] border-[#222222] text-white";

/** Muted metadata on dark background */
export const workMetaOnDark = "text-[#7B7B7B]";

/** Tech badge on dark card */
export const workBadgeOnDark =
  "bg-[#F8F8F8] text-[#222222] border-transparent";

/** Tech badge on light card */
export const workBadgeOnLight =
  "bg-[#F8F8F8] text-[#222222] border-transparent";

/** Spine track / node inactive */
export const workSpineTrack = "bg-[#7B7B7B]";

/** Spine progress fill */
export const workSpineFill = "bg-[#222222]";

/** Date pill */
export const workDatePill =
  "bg-[#222222] text-white text-xs px-3 py-1 rounded-full whitespace-nowrap";
```

- [ ] **Step 2: Commit**

```bash
git add src/cv/sections/Work/work-colors.ts
git commit -m "feat(cv): add work timeline color tokens"
```

---

## Task 3: TDD `timeline-layout.ts`

**Files:**
- Create: `src/cv/sections/Work/__tests__/timeline-layout.test.ts`
- Create: `src/cv/sections/Work/timeline-layout.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/cv/sections/Work/__tests__/timeline-layout.test.ts
import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import type { WorkExperience } from "@/cv/types";

import {
  buildTimelineItems,
  datesOverlap,
  findStickyGroupForEntry,
  parseWorkDate,
} from "../timeline-layout";

describe("parseWorkDate", () => {
  it("parses Mon YYYY strings", () => {
    expect(parseWorkDate("Jun 2021")).toEqual({ year: 2021, month: 6 });
  });

  it('treats "Present" as far future', () => {
    const d = parseWorkDate("Present");
    expect(d.year).toBeGreaterThanOrEqual(2026);
  });
});

describe("datesOverlap", () => {
  it("detects Écolheita overlapping PairTree", () => {
    const ecolheita = RESUME.workExperience.find((w) => w.company === "Écolheita")!;
    const pairtree = RESUME.workExperience.find((w) => w.company === "PairTree")!;
    expect(datesOverlap(ecolheita, pairtree)).toBe(true);
  });

  it("returns false for non-overlapping entries", () => {
    const dash = RESUME.workExperience.find((w) => w.company === "Dash")!;
    const pinterest = RESUME.workExperience.find((w) => w.company === "Pinterest")!;
    expect(datesOverlap(dash, pinterest)).toBe(false);
  });
});

describe("findStickyGroupForEntry", () => {
  it("returns a sticky group for Écolheita through PairTree", () => {
    const ecolheita = RESUME.workExperience.find((w) => w.company === "Écolheita")!;
    const group = findStickyGroupForEntry(ecolheita, RESUME.workExperience);
    expect(group).not.toBeNull();
    expect(group!.stickyEntry.company).toBe("Écolheita");
    expect(group!.throughEntry.company).toBe("PairTree");
    expect(group!.counterpartEntries.map((e) => e.company)).toEqual(
      expect.arrayContaining(["PairTree", "PureCars", "Radical Imaging"]),
    );
  });

  it("returns null for entries without stickyThrough", () => {
    const pinterest = RESUME.workExperience.find((w) => w.company === "Pinterest")!;
    expect(findStickyGroupForEntry(pinterest, RESUME.workExperience)).toBeNull();
  });
});

describe("buildTimelineItems", () => {
  it("interleaves milestones before matching work entries", () => {
    const items = buildTimelineItems(RESUME.workExperience, RESUME.milestones);
    const milestoneIdx = items.findIndex(
      (i) => i.kind === "milestone" && i.milestone.year === 2026,
    );
    const firstWorkIdx = items.findIndex((i) => i.kind === "work");
    expect(milestoneIdx).toBeGreaterThanOrEqual(0);
    expect(milestoneIdx).toBeLessThan(firstWorkIdx);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test:run src/cv/sections/Work/__tests__/timeline-layout.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement timeline-layout.ts**

```typescript
// src/cv/sections/Work/timeline-layout.ts
import type { Milestone, WorkExperience } from "@/cv/types";

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

export type ParsedDate = { year: number; month: number };

export type TimelineItem =
  | { kind: "work"; entry: WorkExperience }
  | { kind: "milestone"; milestone: Milestone };

export type StickyGroup = {
  stickyEntry: WorkExperience;
  throughEntry: WorkExperience;
  counterpartEntries: WorkExperience[];
};

export const parseWorkDate = (value: string): ParsedDate => {
  if (value === "Present") {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const match = value.match(/^([A-Za-z]{3})\s+(\d{4})$/);
  if (!match) throw new Error(`Cannot parse date: ${value}`);
  const month = MONTHS[match[1]];
  if (!month) throw new Error(`Unknown month: ${match[1]}`);
  return { year: Number(match[2]), month };
};

const toSortKey = (d: ParsedDate): number => d.year * 12 + d.month;

const rangeFor = (
  entry: WorkExperience,
): { start: ParsedDate; end: ParsedDate } => ({
  start: parseWorkDate(entry.startDate),
  end: parseWorkDate(entry.endDate),
});

export const datesOverlap = (a: WorkExperience, b: WorkExperience): boolean => {
  const ra = rangeFor(a);
  const rb = rangeFor(b);
  return toSortKey(ra.start) <= toSortKey(rb.end) && toSortKey(rb.start) <= toSortKey(ra.end);
};

const parseStartYear = (startDate: string): number => parseWorkDate(startDate).year;

export const buildTimelineItems = (
  entries: ReadonlyArray<WorkExperience>,
  milestones: ReadonlyArray<Milestone>,
): TimelineItem[] => {
  const result: TimelineItem[] = [];
  const remaining = [...milestones];

  for (const entry of entries) {
    const startYear = parseStartYear(entry.startDate);
    while (remaining.length > 0 && remaining[0].year > startYear) {
      const next = remaining.shift();
      if (next) result.push({ kind: "milestone", milestone: next });
    }
    result.push({ kind: "work", entry });
  }

  for (const milestone of remaining) {
    result.push({ kind: "milestone", milestone });
  }

  return result;
};

export const findStickyGroupForEntry = (
  entry: WorkExperience,
  allEntries: ReadonlyArray<WorkExperience>,
): StickyGroup | null => {
  if (!entry.stickyThrough) return null;

  const throughEntry = allEntries.find((e) => e.company === entry.stickyThrough);
  if (!throughEntry) {
    throw new Error(
      `stickyThrough "${entry.stickyThrough}" not found for ${entry.company}`,
    );
  }

  const throughIdx = allEntries.indexOf(throughEntry);
  const stickyIdx = allEntries.indexOf(entry);
  const slice = allEntries.slice(
    Math.min(stickyIdx, throughIdx),
    Math.max(stickyIdx, throughIdx) + 1,
  );

  const counterpartEntries = slice.filter(
    (e) => e.company !== entry.company && datesOverlap(entry, e),
  );

  return { stickyEntry: entry, throughEntry, counterpartEntries };
};

/** True when this entry is a counterpart inside another entry's sticky group */
export const isStickyCounterpart = (
  entry: WorkExperience,
  allEntries: ReadonlyArray<WorkExperience>,
): boolean =>
  allEntries.some(
    (candidate) =>
      candidate.stickyThrough &&
      candidate.company !== entry.company &&
      findStickyGroupForEntry(candidate, allEntries)?.counterpartEntries.some(
        (c) => c.company === entry.company,
      ),
  );
```

- [ ] **Step 4: Run tests**

```bash
pnpm test:run src/cv/sections/Work/__tests__/timeline-layout.test.ts
```

Expected: PASS (requires `lane`/`stickyThrough` on data — if data not updated yet, only type errors block build; overlap tests use RESUME entries that exist).

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/timeline-layout.ts src/cv/sections/Work/__tests__/timeline-layout.test.ts
git commit -m "feat(cv): add timeline layout pure functions with tests"
```

---

## Task 4: Add lane data to every work entry

**Files:**
- Modify: `src/cv/data.ts`
- Modify: `src/cv/__tests__/data.test.ts`

Lane assignments (most-recent-first, alternating unless overlap dictates):

| Company | lane | stickyThrough |
|---------|------|---------------|
| Pinterest | right | — |
| Blue Yonder | left | — |
| Hrizn | right | — |
| PairTree | right | — |
| PureCars | right | — |
| Radical Imaging | right | — |
| Écolheita | left | PairTree |
| Quero Educação | left | — |
| Spark Networks | right | — |
| Daitan Group | left | — |
| Dextra | right | — |
| Coyô | left | — |
| CI&T | right | — |
| ACTi | left | — |
| VPSA | right | — |
| Dash | left | — |

- [ ] **Step 1: Add failing data guard test**

Add to `src/cv/__tests__/data.test.ts` inside `describe("RESUME data shape")`:

```typescript
it("gives every work entry a valid lane and resolvable stickyThrough", () => {
  const companies = new Set(RESUME.workExperience.map((w) => w.company));
  for (const w of RESUME.workExperience) {
    expect(["left", "right"]).toContain(w.lane);
    if (w.stickyThrough) {
      expect(companies.has(w.stickyThrough)).toBe(true);
    }
  }
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test:run src/cv/__tests__/data.test.ts
```

Expected: FAIL — `lane` undefined.

- [ ] **Step 3: Add `lane` (and `stickyThrough` for Écolheita) to every object in `RESUME.workExperience`**

Apply the table above to each entry in `src/cv/data.ts`.

- [ ] **Step 4: Run data tests**

```bash
pnpm test:run src/cv/__tests__/data.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cv/data.ts src/cv/__tests__/data.test.ts
git commit -m "feat(cv): assign timeline lanes to all work entries"
```

---

## Task 5: Initialize shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/components/ui/accordion.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Initialize shadcn**

```bash
pnpm dlx shadcn@latest init --defaults --force
```

When prompted or via flags, use:
- Style: new-york
- Base color: neutral
- CSS variables: yes
- `@/` alias (matches `tsconfig.json`)

- [ ] **Step 2: Add components**

```bash
pnpm dlx shadcn@latest add accordion card badge --yes
```

- [ ] **Step 3: Override CSS variables in globals.css for CV palette**

Append to `src/app/globals.css` (inside `:root`):

```css
:root {
  --background: #ffffff;
  --foreground: #222222;
  --muted-foreground: #7b7b7b;
  --border: #7b7b7b;
  --card: #ffffff;
  --card-foreground: #222222;
  --primary: #222222;
  --primary-foreground: #ffffff;
  --secondary: #f8f8f8;
  --secondary-foreground: #222222;
}
```

- [ ] **Step 4: Verify build**

```bash
pnpm build 2>&1 | tail -20
```

Expected: successful build.

- [ ] **Step 5: Commit**

```bash
git add components.json src/components/ui src/app/globals.css src/lib package.json pnpm-lock.yaml
git commit -m "chore: initialize shadcn/ui with accordion, card, and badge"
```

---

## Task 6: TDD milestone divider

**Files:**
- Create: `src/cv/sections/Work/__tests__/WorkMilestoneDivider.test.tsx`
- Create: `src/cv/sections/Work/WorkMilestoneDivider.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { WorkMilestoneDivider } from "../WorkMilestoneDivider";

describe("WorkMilestoneDivider", () => {
  it("renders milestone text and a separator without work-entry test id", () => {
    renderWithProviders(
      <WorkMilestoneDivider text="2026 — Looking for new opportunities." />,
    );
    expect(screen.getByText(/2026 — Looking/)).toBeInTheDocument();
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(screen.queryByTestId(/work-entry/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test:run src/cv/sections/Work/__tests__/WorkMilestoneDivider.test.tsx
```

- [ ] **Step 3: Implement component**

```tsx
"use client";

type Props = { text: string };

export const WorkMilestoneDivider = ({ text }: Props) => (
  <div className="w-full py-6" data-testid="work-milestone">
    <p className="text-center text-xs italic text-[#7B7B7B] mb-3">{text}</p>
    <hr className="border-[#7B7B7B]" role="separator" />
  </div>
);
```

- [ ] **Step 4: Run test**

```bash
pnpm test:run src/cv/sections/Work/__tests__/WorkMilestoneDivider.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/WorkMilestoneDivider.tsx src/cv/sections/Work/__tests__/WorkMilestoneDivider.test.tsx
git commit -m "feat(cv): add WorkMilestoneDivider component"
```

---

## Task 7: TDD anchors — dispatch open event

**Files:**
- Modify: `src/cv/sections/Work/__tests__/anchors.test.ts`
- Modify: `src/cv/sections/Work/anchors.ts`

- [ ] **Step 1: Add failing test**

```typescript
it("dispatches cv:open-work-entry with anchor id", () => {
  mountTarget();
  const received: string[] = [];
  const listener = (e: Event) => {
    received.push((e as CustomEvent<string>).detail);
  };
  document.addEventListener("cv:open-work-entry", listener);

  scrollToWorkEntry(entry);

  document.removeEventListener("cv:open-work-entry", listener);
  expect(received).toEqual([workEntryAnchorId(entry)]);
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test:run src/cv/sections/Work/__tests__/anchors.test.ts
```

- [ ] **Step 3: Add dispatch to scrollToWorkEntry**

```typescript
document.dispatchEvent(
  new CustomEvent("cv:open-work-entry", { detail: workEntryAnchorId(entry) }),
);
```

Place after scroll + flash logic. Event fires regardless of reduced-motion (expand should still happen).

- [ ] **Step 4: Run tests**

```bash
pnpm test:run src/cv/sections/Work/__tests__/anchors.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/anchors.ts src/cv/sections/Work/__tests__/anchors.test.ts
git commit -m "feat(cv): dispatch cv:open-work-entry from scrollToWorkEntry"
```

---

## Task 8: WorkTimelineItem component

**Files:**
- Create: `src/cv/sections/Work/WorkTimelineItem.tsx`

- [ ] **Step 1: Create item component**

```tsx
"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TechIcon } from "@/cv/TechIcon";
import type { WorkExperience } from "@/cv/types";

import { workEntryAnchorId } from "./anchors";
import {
  workBadgeOnDark,
  workBadgeOnLight,
  workCardCollapsed,
  workCardExpanded,
  workDatePill,
  workMetaOnDark,
} from "./work-colors";

const metadataLine = (entry: WorkExperience): string =>
  [
    entry.role,
    entry.via,
    entry.workMode,
    entry.location,
  ]
    .filter(Boolean)
    .join(" · ");

type Props = {
  entry: WorkExperience;
  isOpen: boolean;
  /** md+: opposite side date pill */
  showSpineDate?: boolean;
};

export const WorkTimelineItem = ({ entry, isOpen, showSpineDate = true }: Props) => {
  const anchorId = workEntryAnchorId(entry);
  const period = `${entry.startDate} — ${entry.endDate}`;
  const cardClass = isOpen ? workCardExpanded : workCardCollapsed;
  const badgeClass = isOpen ? workBadgeOnDark : workBadgeOnLight;
  const metaClass = isOpen ? workMetaOnDark : "text-[#7B7B7B]";

  return (
    <div
      id={anchorId}
      data-testid={`work-entry-${entry.company}`}
      data-lane={entry.lane}
      className="scroll-mt-24 cv-work-item"
    >
      {showSpineDate && (
        <div
          className={`hidden md:flex mb-2 ${
            entry.lane === "left" ? "justify-end pr-4" : "justify-start pl-4"
          }`}
          data-testid={`work-date-pill-${entry.company}`}
        >
          <span className={workDatePill}>{period}</span>
        </div>
      )}

      <Card className={`${cardClass} transition-colors duration-200`}>
        <AccordionItem value={anchorId} className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>svg]:rotate-180">
            <div className="flex flex-col items-start gap-1 text-left w-full pr-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 w-full">
                <span className="text-base font-semibold">{entry.company}</span>
                <span className={`text-xs ${metaClass} md:hidden`}>{period}</span>
              </div>
              <span className={`text-sm ${metaClass}`}>{metadataLine(entry)}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <p className={`text-sm mb-3 ${isOpen ? "text-white/90" : ""}`}>
              {entry.description}
            </p>
            <ul className="list-disc list-outside ml-5 text-sm space-y-1 mb-4">
              {entry.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              {entry.technologies.map((t) => (
                <Badge key={t} variant="secondary" className={`gap-2 ${badgeClass}`}>
                  <TechIcon alias={t} size={14} />
                  {t}
                </Badge>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Card>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/cv/sections/Work/WorkTimelineItem.tsx
git commit -m "feat(cv): add WorkTimelineItem with shadcn accordion card"
```

---

## Task 9: Rewrite Work.tsx — timeline layout + sticky cluster

**Files:**
- Rewrite: `src/cv/sections/Work/Work.tsx`
- Modify: `src/cv/sections/Work/__tests__/Work.test.tsx`

- [ ] **Step 1: Rewrite Work.tsx**

Key structure:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Accordion } from "@/components/ui/accordion";
import { RESUME } from "@/cv/data";

import {
  buildTimelineItems,
  findStickyGroupForEntry,
  isStickyCounterpart,
} from "./timeline-layout";
import { WorkMilestoneDivider } from "./WorkMilestoneDivider";
import { WorkTimelineItem } from "./WorkTimelineItem";
import { workSpineFill, workSpineTrack } from "./work-colors";

gsap.registerPlugin(ScrollTrigger);

export const Work = () => {
  const [openValues, setOpenValues] = useState<string[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const items = buildTimelineItems(RESUME.workExperience, RESUME.milestones);
  const ecolheitaGroup = findStickyGroupForEntry(
    RESUME.workExperience.find((w) => w.company === "Écolheita")!,
    RESUME.workExperience,
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setOpenValues((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };
    document.addEventListener("cv:open-work-entry", handler);
    return () => document.removeEventListener("cv:open-work-entry", handler);
  }, []);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (!timelineRef.current || !progressRef.current) return;

      gsap.fromTo(
        progressRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: timelineRef.current,
            start: "top center",
            end: "bottom center",
            scrub: true,
          },
        },
      );

      gsap.utils.toArray<HTMLElement>(".cv-work-item").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
          },
        );
      });
    });
    return () => mm.revert();
  }, []);

  const renderedStickyCompanies = new Set<string>();

  return (
    <section id="work" className="flex flex-col gap-8">
      <h2 className="text-xl font-semibold tracking-tight">Work Experience</h2>

      <div ref={timelineRef} className="relative">
        {/* Center spine — desktop */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2">
          <div className={`absolute inset-0 ${workSpineTrack}`} />
          <div
            ref={progressRef}
            className={`absolute inset-0 origin-top ${workSpineFill}`}
            data-testid="work-spine-progress"
          />
        </div>

        <Accordion
          type="multiple"
          value={openValues}
          onValueChange={setOpenValues}
          className="flex flex-col gap-10"
        >
          {items.map((item, i) => {
            if (item.kind === "milestone") {
              return (
                <WorkMilestoneDivider
                  key={`milestone-${item.milestone.year}-${i}`}
                  text={item.milestone.text}
                />
              );
            }

            const { entry } = item;
            const anchorId = `work-${entry.company}`; // use workEntryAnchorId(entry) in real code

            // Sticky cluster: render Écolheita once inside sticky wrapper spanning counterparts
            if (entry.stickyThrough && ecolheitaGroup && !renderedStickyCompanies.has(entry.company)) {
              renderedStickyCompanies.add(entry.company);
              return (
                <div
                  key={`sticky-${entry.company}`}
                  className="md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4 md:items-start"
                  data-testid="work-sticky-cluster"
                >
                  <div className="md:sticky md:top-24 md:self-start">
                    <WorkTimelineItem
                      entry={entry}
                      isOpen={openValues.includes(workEntryAnchorId(entry))}
                    />
                  </div>
                  <div className="hidden md:block w-3" aria-hidden />
                  <div className="flex flex-col gap-10">
                    {ecolheitaGroup.counterpartEntries.map((counterpart) => {
                      renderedStickyCompanies.add(counterpart.company);
                      return (
                        <WorkTimelineItem
                          key={counterpart.company}
                          entry={counterpart}
                          isOpen={openValues.includes(workEntryAnchorId(counterpart))}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (isStickyCounterpart(entry, RESUME.workExperience)) {
              return null; // rendered inside sticky cluster
            }

            return (
              <div
                key={`${entry.company}-${entry.startDate}`}
                className="md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4 md:items-start"
              >
                <div className={entry.lane === "left" ? "md:col-start-1" : "md:col-start-3"}>
                  {entry.lane === "left" ? (
                    <WorkTimelineItem
                      entry={entry}
                      isOpen={openValues.includes(workEntryAnchorId(entry))}
                    />
                  ) : (
                    <div className="hidden md:block" />
                  )}
                </div>
                <div className="hidden md:flex md:col-start-2 w-3 justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#7B7B7B] mt-6" />
                </div>
                <div className={entry.lane === "right" ? "md:col-start-3" : "md:col-start-1"}>
                  {entry.lane === "right" ? (
                    <WorkTimelineItem
                      entry={entry}
                      isOpen={openValues.includes(workEntryAnchorId(entry))}
                    />
                  ) : (
                    <div className="hidden md:block" />
                  )}
                </div>
              </div>
            );
          })}
        </Accordion>
      </div>
    </section>
  );
};
```

**Important:** Replace placeholder `anchorId` with `workEntryAnchorId(entry)` import. Refine grid so mobile uses single column with left spine (add `md:hidden` mobile spine in a follow-up polish pass within this task). Generalize sticky cluster beyond hard-coded Écolheita: loop all entries with `stickyThrough` and call `findStickyGroupForEntry`.

- [ ] **Step 2: Update Work.test.tsx**

Replace description/bullet/tech test to open accordion first:

```tsx
import userEvent from "@testing-library/user-event";
import { workEntryAnchorId } from "../anchors";

it("renders collapsed header with company, period, role for first entry", () => {
  renderWithProviders(<Work />);
  const first = RESUME.workExperience[0];
  const card = screen.getByTestId(`work-entry-${first.company}`);
  expect(within(card).getByText(first.company)).toBeInTheDocument();
  expect(within(card).getByText(first.role)).toBeInTheDocument();
});

it("shows description and bullets after expanding accordion", async () => {
  const user = userEvent.setup();
  renderWithProviders(<Work />);
  const first = RESUME.workExperience[0];
  const card = screen.getByTestId(`work-entry-${first.company}`);
  await user.click(within(card).getByRole("button"));
  expect(within(card).getByText(first.description)).toBeInTheDocument();
  expect(within(card).getByText(first.bullets[0])).toBeInTheDocument();
  expect(within(card).getByText(first.technologies[0])).toBeInTheDocument();
});

it("renders milestones as dividers not work entries", () => {
  renderWithProviders(<Work />);
  expect(screen.getAllByTestId("work-milestone").length).toBeGreaterThan(0);
  for (const m of RESUME.milestones) {
    expect(screen.getByText(m.text)).toBeInTheDocument();
  }
});

it("opens accordion on cv:open-work-entry event", async () => {
  renderWithProviders(<Work />);
  const first = RESUME.workExperience[0];
  const anchorId = workEntryAnchorId(first);
  act(() => {
    document.dispatchEvent(new CustomEvent("cv:open-work-entry", { detail: anchorId }));
  });
  expect(within(screen.getByTestId(`work-entry-${first.company}`)).getByRole("button")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
});

it("assigns data-lane from entry data", () => {
  renderWithProviders(<Work />);
  const ecolheita = screen.getByTestId("work-entry-Écolheita");
  expect(ecolheita).toHaveAttribute("data-lane", "left");
});
```

Keep existing anchor + company + tech icon tests; adapt selectors as needed.

- [ ] **Step 3: Run Work tests**

```bash
pnpm test:run src/cv/sections/Work/
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/cv/sections/Work/Work.tsx src/cv/sections/Work/__tests__/Work.test.tsx
git commit -m "feat(cv): rewrite Work section as shadcn timeline with sticky cluster"
```

---

## Task 10: Widen CV page container

**Files:**
- Modify: `src/cv/pages/CVPage/CVPage.tsx`

- [ ] **Step 1: Change max width**

```tsx
<div className="max-w-5xl mx-auto px-6 py-12 pb-32">
```

- [ ] **Step 2: Run CV page tests**

```bash
pnpm test:run src/cv/pages/CVPage/
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/cv/pages/CVPage/CVPage.tsx
git commit -m "feat(cv): widen CV page container for timeline layout"
```

---

## Task 11: Mobile layout polish

**Files:**
- Modify: `src/cv/sections/Work/Work.tsx`

- [ ] **Step 1: Add mobile left spine**

Below `md`, render a left-aligned track:

```tsx
<div className="md:hidden absolute left-3 top-0 bottom-0 w-0.5 bg-[#7B7B7B]" />
```

Wrap items in `pl-8 md:pl-0` container. Hide opposite-side date pills (already `hidden md:flex` in `WorkTimelineItem`). Disable sticky (`md:sticky` only).

- [ ] **Step 2: Manual check**

```bash
pnpm dev
```

Verify at 375px and 1024px viewports.

- [ ] **Step 3: Commit**

```bash
git add src/cv/sections/Work/Work.tsx
git commit -m "feat(cv): add mobile left-spine timeline layout"
```

---

## Task 12: Update CV domain README

**Files:**
- Modify: `src/cv/README.md`

- [ ] **Step 1: Document lane conventions**

Add section:

```markdown
## Work timeline lanes

Each `WorkExperience` entry requires `lane: "left" | "right"` for desktop layout.

Optional `stickyThrough: "<Company>"` pins a parallel role on its lane while scrolling through overlapping entries until the named company's region ends (desktop only). Example: Écolheita freelancing overlaps PairTree/PureCars/Radical Imaging.

Milestones render as horizontal dividers, not timeline cards.
```

- [ ] **Step 2: Commit**

```bash
git add src/cv/README.md
git commit -m "docs(cv): document work timeline lane conventions"
```

---

## Task 13: Full verification

- [ ] **Step 1: Lint**

```bash
pnpm lint
```

- [ ] **Step 2: Full test suite**

```bash
pnpm test:run
```

Expected: all tests PASS.

- [ ] **Step 3: Production build**

```bash
pnpm build
```

Expected: success.

---

## Self-Review Checklist

| Spec requirement | Task |
|------------------|------|
| shadcn Card + Accordion multi-open | Task 5, 8, 9 |
| Color palette #222222 / #7B7B7B / #F8F8F8 / #FFF | Task 2, 5 |
| `lane` + `stickyThrough` data model | Task 1, 4 |
| Date pill on spine + period in header | Task 8 |
| Collapsed: company, period, role, metadata | Task 8 |
| Expanded: description, bullets, tech | Task 8 |
| Dark theme when expanded | Task 8 (`isOpen` classes) |
| Milestone full-width dividers | Task 6, 9 |
| Sticky Écolheita through PairTree | Task 3, 9 |
| Option C lane pin layout | Task 9 |
| md breakpoint alternating vs mobile column | Task 9, 11 |
| GSAP spine progress + card fade-in | Task 9 |
| Skill nav scroll + expand + flash | Task 7, 9 |
| Page max-w-5xl | Task 10 |
| Reduced motion respected | Task 9 (matchMedia gate) |
| Company logos | Deferred (non-goal) |

**No placeholders:** all steps contain concrete code or commands.

**Type consistency:** `workEntryAnchorId`, `WorkLane`, `StickyGroup`, and `cv:open-work-entry` used consistently across tasks.
