# Work Badge → Skill Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Work Experience technology badges interactive — hovering shows a star-rating tooltip, clicking scrolls to and flashes the matching skill card in the Skills section.

**Architecture:** Extract the `Stars` component from `Skills.tsx` into a shared file; add reverse lookup `skillForTechnology` to `matching.ts`; create `Skills/anchors.ts` mirroring `Work/anchors.ts`; new `TechBadge` component replaces the inline badge loop in `WorkTimelineItem`.

**Tech Stack:** React 19, TypeScript strict mode, Mantine 8 (`Tooltip`), @tabler/icons-react, Vitest + @testing-library/react, Tailwind, pnpm.

---

## File Map

**New files:**
- `src/cv/Stars.tsx` — shared star-rating display component
- `src/cv/__tests__/Stars.test.tsx`
- `src/cv/sections/Skills/anchors.ts` — `skillCardAnchorId` + `scrollToSkillCard`
- `src/cv/sections/Skills/__tests__/anchors.test.ts`
- `src/cv/sections/Work/TechBadge.tsx` — interactive or plain badge per technology
- `src/cv/sections/Work/__tests__/TechBadge.test.tsx`

**Modified files:**
- `src/cv/sections/Skills/matching.ts` — add `skillForTechnology`
- `src/cv/sections/Skills/__tests__/matching.test.ts` — tests for `skillForTechnology`
- `src/cv/sections/Skills/Skills.tsx` — import shared `Stars`; add card anchor IDs
- `src/cv/sections/Skills/__tests__/Skills.test.tsx` — assert card IDs exist
- `src/cv/sections/Work/WorkTimelineItem.tsx` — replace inline badges with `TechBadge`
- `src/cv/sections/Work/__tests__/WorkTimelineItem.test.tsx` — assert badge interactivity
- `src/analytics/events.ts` — add `trackWorkBadgeSkillClick`
- `src/analytics/__tests__/events.test.ts` — test new event

---

## Task 1: Extract `Stars` into a shared component

**Files:**
- Create: `src/cv/Stars.tsx`
- Create: `src/cv/__tests__/Stars.test.tsx`
- Modify: `src/cv/sections/Skills/Skills.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/cv/__tests__/Stars.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Stars } from "@/cv/Stars";

describe("Stars", () => {
  it("sets aria-label to '{count} of 5 stars'", () => {
    const { container } = render(<Stars count={4} />);
    expect(container.querySelector('[role="img"]')).toHaveAttribute(
      "aria-label",
      "4 of 5 stars",
    );
  });

  it("always renders exactly 5 svg icons", () => {
    const { container } = render(<Stars count={3} />);
    expect(container.querySelectorAll("svg").length).toBe(5);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm vitest run src/cv/__tests__/Stars.test.tsx
```

Expected: FAIL — `Cannot find module '@/cv/Stars'`

- [ ] **Step 3: Create `src/cv/Stars.tsx`**

```tsx
"use client";

import { IconStar, IconStarFilled } from "@tabler/icons-react";

const STAR_POSITIONS = [1, 2, 3, 4, 5] as const;

export const Stars = ({ count }: { count: number }) => (
  <span
    role="img"
    aria-label={`${count} of 5 stars`}
    className="inline-flex items-center"
  >
    {STAR_POSITIONS.map((pos) =>
      pos <= count ? (
        <IconStarFilled key={pos} className="w-3 h-3 text-amber-500" />
      ) : (
        <IconStar key={pos} className="w-3 h-3 text-neutral-300" />
      ),
    )}
  </span>
);
```

- [ ] **Step 4: Update `Skills.tsx` to use the shared `Stars`**

In `src/cv/sections/Skills/Skills.tsx`:

Remove the `IconStar` and `IconStarFilled` imports and replace with the shared Stars import. Remove the inline `STAR_POSITIONS` constant and `Stars` component definition. Add the import at the top.

The diff is:

```diff
-import { IconStar, IconStarFilled } from "@tabler/icons-react";
 import { useState } from "react";

 import {
   trackSkillExperienceClick,
   trackSkillExperiencesOpen,
 } from "@/analytics/events";
 import { RESUME } from "@/cv/data";
 import { getUniqueIconAliases } from "@/cv/icons";
+import { Stars } from "@/cv/Stars";
 import { scrollToWorkEntry } from "@/cv/sections/Work/anchors";
 import { TechIcon } from "@/cv/TechIcon";
 import type { Skill, SkillCategory, WorkExperience } from "@/cv/types";
```

Then remove these lines from the file body (they appear before `SkillCardInner`):

```diff
-const STAR_POSITIONS = [1, 2, 3, 4, 5] as const;
-
-const Stars = ({ count }: { count: number }) => (
-  <span
-    role="img"
-    aria-label={`${count} of 5 stars`}
-    className="inline-flex items-center"
-  >
-    {STAR_POSITIONS.map((pos) =>
-      pos <= count ? (
-        <IconStarFilled key={pos} className="w-3 h-3 text-amber-500" />
-      ) : (
-        <IconStar key={pos} className="w-3 h-3 text-neutral-300" />
-      ),
-    )}
-  </span>
-);
```

- [ ] **Step 5: Run all tests to verify they pass**

```bash
pnpm vitest run src/cv/__tests__/Stars.test.tsx src/cv/sections/Skills/__tests__/Skills.test.tsx
```

Expected: PASS for both files.

- [ ] **Step 6: Commit**

```bash
git add src/cv/Stars.tsx src/cv/__tests__/Stars.test.tsx src/cv/sections/Skills/Skills.tsx
git commit -m "refactor(cv): extract Stars into shared component"
```

---

## Task 2: Add `skillForTechnology` to `matching.ts`

**Files:**
- Modify: `src/cv/sections/Skills/matching.ts`
- Modify: `src/cv/sections/Skills/__tests__/matching.test.ts`

- [ ] **Step 1: Write the failing tests**

Add a second `describe` block at the bottom of `src/cv/sections/Skills/__tests__/matching.test.ts`:

```ts
import { experiencesForSkill, skillForTechnology } from "../matching";

// ... existing experiencesForSkill describe block stays unchanged ...

describe("skillForTechnology", () => {
  it("returns the skill whose aliases include the technology", () => {
    const result = skillForTechnology("JavaScript", RESUME.skills);
    expect(result?.name).toBe("JavaScript");
  });

  it("is case-insensitive", () => {
    const result = skillForTechnology("javascript", RESUME.skills);
    expect(result?.name).toBe("JavaScript");
  });

  it("matches a multi-alias skill by any of its aliases", () => {
    expect(skillForTechnology("MongoDB", RESUME.skills)?.name).toBe(
      "MongoDB / Redis (NoSQL)",
    );
    expect(skillForTechnology("Redis", RESUME.skills)?.name).toBe(
      "MongoDB / Redis (NoSQL)",
    );
  });

  it("returns undefined for a technology with no matching skill", () => {
    expect(skillForTechnology("Turborepo", RESUME.skills)).toBeUndefined();
  });

  it("does NOT match on substrings — 'Sanity.io' must not match the 'Sanity' alias", () => {
    expect(skillForTechnology("Sanity.io", RESUME.skills)).toBeUndefined();
  });
});
```

Note: update the import on line 6 to include `skillForTechnology`:
```ts
import { experiencesForSkill, skillForTechnology } from "../matching";
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm vitest run src/cv/sections/Skills/__tests__/matching.test.ts
```

Expected: FAIL — `skillForTechnology is not a function`

- [ ] **Step 3: Add `skillForTechnology` to `matching.ts`**

Append to `src/cv/sections/Skills/matching.ts`:

```ts
/**
 * The skill whose aliases include `tech`, or undefined if none match.
 * Comparison is case-insensitive and exact (no substring), mirroring
 * experiencesForSkill. Returns the first match in skill list order.
 */
export const skillForTechnology = (
  tech: string,
  skills: ReadonlyArray<Skill>,
): Skill | undefined => {
  const needle = tech.toLowerCase();
  return skills.find((skill) =>
    skill.aliases.some((alias) => alias.toLowerCase() === needle),
  );
};
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm vitest run src/cv/sections/Skills/__tests__/matching.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Skills/matching.ts src/cv/sections/Skills/__tests__/matching.test.ts
git commit -m "feat(cv): add skillForTechnology reverse lookup to matching"
```

---

## Task 3: Create `Skills/anchors.ts`

**Files:**
- Create: `src/cv/sections/Skills/anchors.ts`
- Create: `src/cv/sections/Skills/__tests__/anchors.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/cv/sections/Skills/__tests__/anchors.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

import { RESUME } from "@/cv/data";

import { scrollToSkillCard, skillCardAnchorId } from "../anchors";

describe("skillCardAnchorId", () => {
  it("is deterministic for the same skill", () => {
    const skill = RESUME.skills[0];
    expect(skillCardAnchorId(skill)).toBe(skillCardAnchorId(skill));
  });

  it("prefixes the slug with 'skill-'", () => {
    const skill = { ...RESUME.skills[0], name: "JavaScript" };
    expect(skillCardAnchorId(skill)).toBe("skill-javascript");
  });

  it("slugifies slashes and parentheses in the name", () => {
    const skill = { ...RESUME.skills[0], name: "MongoDB / Redis (NoSQL)" };
    expect(skillCardAnchorId(skill)).toBe("skill-mongodb-redis-nosql");
  });

  it("is unique across all current skills in RESUME", () => {
    const ids = RESUME.skills.map(skillCardAnchorId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("scrollToSkillCard", () => {
  const skill = RESUME.skills[0];

  const mountTarget = () => {
    const el = document.createElement("div");
    el.id = skillCardAnchorId(skill);
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);
    return el;
  };

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("scrolls the matching element into view", () => {
    const el = mountTarget();
    scrollToSkillCard(skill);
    expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("uses block: center so compact cards land in the viewport", () => {
    const el = mountTarget();
    scrollToSkillCard(skill);
    expect(el.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: "center" }),
    );
  });

  it("adds the cv-flash class when motion is allowed", () => {
    const el = mountTarget();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    scrollToSkillCard(skill);
    expect(el.classList.contains("cv-flash")).toBe(true);
  });

  it("does NOT flash when reduced motion is preferred", () => {
    const el = mountTarget();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
    } as MediaQueryList);
    scrollToSkillCard(skill);
    expect(el.classList.contains("cv-flash")).toBe(false);
  });

  it("is a no-op when no matching element is mounted", () => {
    expect(() => scrollToSkillCard(skill)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm vitest run src/cv/sections/Skills/__tests__/anchors.test.ts
```

Expected: FAIL — `Cannot find module '../anchors'`

- [ ] **Step 3: Create `src/cv/sections/Skills/anchors.ts`**

```ts
import type { Skill } from "@/cv/types";

/**
 * Stable, URL-safe DOM id for a skill card, derived from skill.name.
 * Uses the same slug pattern as workEntryAnchorId in Work/anchors.ts.
 */
export const skillCardAnchorId = (skill: Skill): string => {
  const slug = skill.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `skill-${slug}`;
};

/**
 * Scroll to a skill card and briefly flash it. Mirrors scrollToWorkEntry
 * from Work/anchors.ts but uses block:'center' (skill cards are compact).
 * No custom event needed — skill cards are always visible, unlike accordion
 * work entries that must be opened first.
 */
export const scrollToSkillCard = (skill: Skill): void => {
  const el = document.getElementById(skillCardAnchorId(skill));
  if (!el) return;

  const motionOk = window.matchMedia(
    "(prefers-reduced-motion: no-preference)",
  ).matches;

  el.scrollIntoView({ behavior: motionOk ? "smooth" : "auto", block: "center" });

  if (!motionOk) return;

  el.classList.add("cv-flash");
  el.addEventListener("animationend", () => el.classList.remove("cv-flash"), {
    once: true,
  });
};
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm vitest run src/cv/sections/Skills/__tests__/anchors.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Skills/anchors.ts src/cv/sections/Skills/__tests__/anchors.test.ts
git commit -m "feat(cv): add skillCardAnchorId and scrollToSkillCard"
```

---

## Task 4: Add anchor IDs to skill cards in `Skills.tsx`

**Files:**
- Modify: `src/cv/sections/Skills/Skills.tsx`
- Modify: `src/cv/sections/Skills/__tests__/Skills.test.tsx`

- [ ] **Step 1: Write the failing test**

Add to the end of the `describe("Skills")` block in `src/cv/sections/Skills/__tests__/Skills.test.tsx`:

```tsx
import { skillCardAnchorId } from "../anchors";

// Inside the existing describe("Skills") block:

it("each skill card has an id matching skillCardAnchorId", () => {
  renderWithProviders(<Skills />);
  for (const skill of RESUME.skills) {
    const card = screen.getByTestId(`skill-card-${skill.name}`);
    expect(card).toHaveAttribute("id", skillCardAnchorId(skill));
  }
});
```

Note: add `import { skillCardAnchorId } from "../anchors";` to the imports at the top of the test file.

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm vitest run src/cv/sections/Skills/__tests__/Skills.test.tsx
```

Expected: FAIL — elements don't have an `id` attribute yet.

- [ ] **Step 3: Update `SkillCard` in `Skills.tsx` to include anchor IDs**

Add import at the top of `src/cv/sections/Skills/Skills.tsx`:

```ts
import { skillCardAnchorId } from "./anchors";
```

In the `SkillCard` component, add `id={skillCardAnchorId(skill)}` to **both** the `<div>` (non-interactive) and `<button>` (interactive) elements:

```tsx
// Non-interactive variant
<div
  id={skillCardAnchorId(skill)}
  data-testid={`skill-card-${skill.name}`}
  className={CARD_CLASS}
>
  <SkillCardInner skill={skill} />
</div>

// Interactive variant
<button
  type="button"
  id={skillCardAnchorId(skill)}
  data-testid={`skill-card-${skill.name}`}
  aria-haspopup="dialog"
  onClick={() => onOpen(skill)}
  className={`${CARD_CLASS} text-left w-full cursor-pointer hover:border-neutral-400 hover:shadow-sm transition`}
>
  <SkillCardInner skill={skill} />
</button>
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm vitest run src/cv/sections/Skills/__tests__/Skills.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Skills/Skills.tsx src/cv/sections/Skills/__tests__/Skills.test.tsx
git commit -m "feat(cv): add scroll anchor IDs to skill cards"
```

---

## Task 5: Add `trackWorkBadgeSkillClick` analytics event

**Files:**
- Modify: `src/analytics/events.ts`
- Modify: `src/analytics/__tests__/events.test.ts`

- [ ] **Step 1: Write the failing test**

Add to the end of the `describe("event trackers")` block in `src/analytics/__tests__/events.test.ts`:

```ts
it("trackWorkBadgeSkillClick captures work_badge_skill_clicked with technology and skill", async () => {
  const { trackWorkBadgeSkillClick } = await loadAnalytics();
  trackWorkBadgeSkillClick({ technology: "TypeScript", skill: "TypeScript" });
  expect(mockCapture).toHaveBeenCalledWith("work_badge_skill_clicked", {
    technology: "TypeScript",
    skill: "TypeScript",
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm vitest run src/analytics/__tests__/events.test.ts
```

Expected: FAIL — `trackWorkBadgeSkillClick is not a function`

- [ ] **Step 3: Add the event to `src/analytics/events.ts`**

Append to the file:

```ts
export const trackWorkBadgeSkillClick = (params: {
  technology: string;
  skill: string;
}): void => {
  posthog.capture("work_badge_skill_clicked", params);
};
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm vitest run src/analytics/__tests__/events.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/analytics/events.ts src/analytics/__tests__/events.test.ts
git commit -m "feat(analytics): add trackWorkBadgeSkillClick event"
```

---

## Task 6: Create `TechBadge` component

**Files:**
- Create: `src/cv/sections/Work/TechBadge.tsx`
- Create: `src/cv/sections/Work/__tests__/TechBadge.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/cv/sections/Work/__tests__/TechBadge.test.tsx`:

```tsx
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { mockScroll, mockTrack } = vi.hoisted(() => ({
  mockScroll: vi.fn(),
  mockTrack: vi.fn(),
}));

vi.mock("@/cv/sections/Skills/anchors", () => ({
  skillCardAnchorId: vi.fn(),
  scrollToSkillCard: mockScroll,
}));

vi.mock("@/analytics/events", () => ({
  trackWorkBadgeSkillClick: mockTrack,
}));

import { RESUME } from "@/cv/data";
import { renderWithProviders, screen } from "@/test/render";

import { TechBadge } from "../TechBadge";

const jsSkill = RESUME.skills.find((s) => s.aliases.includes("JavaScript"))!;

describe("TechBadge", () => {
  it("renders the tech name in both the plain and interactive variants", () => {
    renderWithProviders(<TechBadge tech="Turborepo" />);
    expect(screen.getByText("Turborepo")).toBeInTheDocument();
  });

  it("renders as non-interactive (no button) when no skill is provided", () => {
    renderWithProviders(<TechBadge tech="Turborepo" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders a button when a skill is provided", () => {
    renderWithProviders(<TechBadge tech="JavaScript" skill={jsSkill} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls scrollToSkillCard with the skill on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TechBadge tech="JavaScript" skill={jsSkill} />);
    await user.click(screen.getByRole("button"));
    expect(mockScroll).toHaveBeenCalledWith(jsSkill);
  });

  it("calls trackWorkBadgeSkillClick with technology and skill name on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TechBadge tech="JavaScript" skill={jsSkill} />);
    await user.click(screen.getByRole("button"));
    expect(mockTrack).toHaveBeenCalledWith({
      technology: "JavaScript",
      skill: jsSkill.name,
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm vitest run src/cv/sections/Work/__tests__/TechBadge.test.tsx
```

Expected: FAIL — `Cannot find module '../TechBadge'`

- [ ] **Step 3: Create `src/cv/sections/Work/TechBadge.tsx`**

```tsx
"use client";

import { Tooltip } from "@mantine/core";

import { trackWorkBadgeSkillClick } from "@/analytics/events";
import { Badge, badgeVariants } from "@/components/ui/Badge";
import { Stars } from "@/cv/Stars";
import { workBadge } from "@/cv/cv-colors";
import { scrollToSkillCard } from "@/cv/sections/Skills/anchors";
import { TechIcon } from "@/cv/TechIcon";
import type { Skill } from "@/cv/types";
import { cn } from "@/lib/utils";

type Props = {
  tech: string;
  skill?: Skill;
};

export const TechBadge = ({ tech, skill }: Props) => {
  if (!skill) {
    return (
      <Badge variant="secondary" className={`gap-2 ${workBadge}`}>
        <TechIcon alias={tech} size={14} />
        {tech}
      </Badge>
    );
  }

  return (
    <Tooltip label={<Stars count={skill.stars} />} withArrow>
      <button
        type="button"
        className={cn(
          badgeVariants({ variant: "secondary" }),
          `gap-2 ${workBadge}`,
          "cursor-pointer",
        )}
        onClick={() => {
          scrollToSkillCard(skill);
          trackWorkBadgeSkillClick({ technology: tech, skill: skill.name });
        }}
      >
        <TechIcon alias={tech} size={14} />
        {tech}
      </button>
    </Tooltip>
  );
};
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm vitest run src/cv/sections/Work/__tests__/TechBadge.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/TechBadge.tsx src/cv/sections/Work/__tests__/TechBadge.test.tsx
git commit -m "feat(cv): add TechBadge component with skill tooltip and click navigation"
```

---

## Task 7: Wire `TechBadge` into `WorkTimelineItem`

**Files:**
- Modify: `src/cv/sections/Work/WorkTimelineItem.tsx`
- Modify: `src/cv/sections/Work/__tests__/WorkTimelineItem.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add to `src/cv/sections/Work/__tests__/WorkTimelineItem.test.tsx`:

```tsx
import { workEntryAnchorId } from "../anchors";

// Add inside the existing describe block:

it("renders interactive button badges for technologies that have a matching skill", () => {
  const entry = RESUME.workExperience[0]; // Pinterest — includes "JavaScript"
  const anchorId = workEntryAnchorId(entry);
  renderWithProviders(
    <Accordion value={[anchorId]} onValueChange={() => {}}>
      <WorkTimelineItem entry={entry} isOpen={true} />
    </Accordion>,
  );
  // "JavaScript" has a matching skill → rendered as a button
  expect(screen.getByText("JavaScript").closest("button")).not.toBeNull();
});

it("renders plain (non-button) badges for technologies without a matching skill", () => {
  const entry = RESUME.workExperience[0]; // Pinterest — includes "Turborepo"
  const anchorId = workEntryAnchorId(entry);
  renderWithProviders(
    <Accordion value={[anchorId]} onValueChange={() => {}}>
      <WorkTimelineItem entry={entry} isOpen={true} />
    </Accordion>,
  );
  // "Turborepo" has no matching skill → plain span, not a button
  expect(screen.getByText("Turborepo").closest("button")).toBeNull();
});
```

Note: add `import { workEntryAnchorId } from "../anchors";` to the imports if not already present.

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm vitest run src/cv/sections/Work/__tests__/WorkTimelineItem.test.tsx
```

Expected: FAIL — all badges currently render as non-interactive spans.

- [ ] **Step 3: Update `WorkTimelineItem.tsx`**

Replace the existing import block and badge loop.

**Remove** from imports:
```ts
import { Badge } from "@/components/ui/Badge";
```

**Remove** `workBadge` from the `cv-colors` import (keep the others):
```ts
import {
  workBody,
  workCardCollapsed,
  workCardExpanded,
  workCardTriggerHover,
  workDatePillDefault,
  workSubtitle,
  workTitle,
} from "@/cv/cv-colors";
```

**Remove**:
```ts
import { TechIcon } from "@/cv/TechIcon";
```

**Add** these imports:
```ts
import { RESUME } from "@/cv/data";
import { skillForTechnology } from "@/cv/sections/Skills/matching";
import { TechBadge } from "./TechBadge";
```

**Replace** the badge loop inside `AccordionContent`:
```tsx
// Before
<div className="flex flex-wrap gap-2">
  {entry.technologies.map((t) => (
    <Badge
      key={t}
      variant="secondary"
      className={`gap-2 ${workBadge}`}
    >
      <TechIcon alias={t} size={14} />
      {t}
    </Badge>
  ))}
</div>

// After
<div className="flex flex-wrap gap-2">
  {entry.technologies.map((t) => (
    <TechBadge
      key={t}
      tech={t}
      skill={skillForTechnology(t, RESUME.skills)}
    />
  ))}
</div>
```

- [ ] **Step 4: Run all tests to verify everything passes**

```bash
pnpm vitest run
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/WorkTimelineItem.tsx src/cv/sections/Work/__tests__/WorkTimelineItem.test.tsx
git commit -m "feat(cv): wire TechBadge into WorkTimelineItem for badge→skill navigation"
```

---

## Final check

- [ ] Run the full test suite one more time: `pnpm vitest run`
- [ ] Run the linter: `pnpm lint`
- [ ] Verify the feature works in the browser: `pnpm dev`, open `/cv`, expand a work entry, hover and click a technology badge
