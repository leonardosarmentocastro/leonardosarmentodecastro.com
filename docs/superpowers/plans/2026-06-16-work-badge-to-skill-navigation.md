# Work Badge → Skill Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make mapped work-experience technology badges navigate to the corresponding skill card (with level + stars tooltip), mirroring the existing Skills → Work navigation pattern.

**Architecture:** Add reverse alias lookup (`skillForTechnology`) and skill scroll anchors (`scrollToSkill`) symmetric to the work side. Extract `WorkTechnologyBadge` for mapped/unmapped rendering, desktop hover tooltips, and touch two-tap hint flow. Unmapped badges stay static.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Mantine 8 (`Tooltip`, `useMediaQuery`), Vitest, `@testing-library/react`

**Spec:** `docs/superpowers/specs/2026-06-16-work-badge-to-skill-navigation-design.md`

**Branch:** Create `feat/work-badge-to-skill-navigation` before the first commit (never commit directly to `main`).

---

## File map

| File | Responsibility |
| --- | --- |
| `src/cv/sections/Skills/matching.ts` | Add `skillForTechnology` reverse lookup |
| `src/cv/sections/Skills/__tests__/matching.test.ts` | Tests for reverse lookup + regression guard |
| `src/cv/sections/Skills/SkillStars.tsx` | Shared filled/empty star icons |
| `src/cv/sections/Skills/anchors.ts` | `skillAnchorId`, `scrollToSkill` |
| `src/cv/sections/Skills/__tests__/anchors.test.ts` | Anchor id + scroll/flash tests |
| `src/cv/sections/Skills/Skills.tsx` | Use `SkillStars`; add anchor ids to card wrappers |
| `src/cv/sections/Work/WorkTechnologyBadge.tsx` | Interactive/static badge + tooltip |
| `src/cv/sections/Work/__tests__/WorkTechnologyBadge.test.tsx` | Badge component tests |
| `src/cv/sections/Work/WorkTimelineItem.tsx` | Swap inline badges for `WorkTechnologyBadge` |
| `src/cv/sections/Work/__tests__/Work.test.tsx` | Integration smoke test |
| `src/analytics/events.ts` | `trackWorkTechnologySkillClick` |
| `src/analytics/__tests__/events.test.ts` | Analytics test |
| `src/cv/README.md` | Document Work → skill navigation |

---

### Task 1: Reverse skill lookup

**Files:**
- Modify: `src/cv/sections/Skills/matching.ts`
- Test: `src/cv/sections/Skills/__tests__/matching.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `src/cv/sections/Skills/__tests__/matching.test.ts` (update import to include `skillForTechnology`):

```ts
import { experiencesForSkill, skillForTechnology } from "../matching";
```

Append a new `describe("skillForTechnology", () => { ... })` block:

```ts
describe("skillForTechnology", () => {
  it("returns the skill whose alias matches exactly, case-insensitively", () => {
    const skill = skillForTechnology("javascript", RESUME.skills);
    expect(skill?.name).toBe("JavaScript");
  });

  it("does NOT match on substrings (Sanity.io must not resolve to Sanity skill)", () => {
    const skill = skillForTechnology("Sanity.io", RESUME.skills);
    expect(skill).toBeNull();
  });

  it("returns the Sanity CMS skill for exact Sanity token", () => {
    const skill = skillForTechnology("Sanity", RESUME.skills);
    expect(skill?.name).toBe("CMS (Sanity, Payload, etc)");
  });

  it("returns null for unknown technology strings", () => {
    expect(skillForTechnology("Java", RESUME.skills)).toBeNull();
    expect(skillForTechnology("NonexistentTech", RESUME.skills)).toBeNull();
  });

  it("round-trips with experiencesForSkill for every skill alias in work data", () => {
    const aliasSet = new Set(
      RESUME.workExperience.flatMap((e) => e.technologies),
    );
    for (const skill of RESUME.skills) {
      for (const alias of skill.aliases) {
        if (!aliasSet.has(alias)) continue;
        const resolved = skillForTechnology(alias, RESUME.skills);
        expect(resolved?.name).toBe(skill.name);
        expect(experiencesForSkill(skill, RESUME.workExperience).length).toBeGreaterThan(0);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run src/cv/sections/Skills/__tests__/matching.test.ts`

Expected: FAIL — `skillForTechnology` is not exported

- [ ] **Step 3: Implement `skillForTechnology`**

Add to `src/cv/sections/Skills/matching.ts`:

```ts
/**
 * The skill whose aliases include an exact case-insensitive match for `tech`.
 * Returns null when no skill claims that technology string.
 */
export const skillForTechnology = (
  tech: string,
  skills: ReadonlyArray<Skill>,
): Skill | null => {
  const needle = tech.toLowerCase();
  for (const skill of skills) {
    if (skill.aliases.some((alias) => alias.toLowerCase() === needle)) {
      return skill;
    }
  }
  return null;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:run src/cv/sections/Skills/__tests__/matching.test.ts`

Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Skills/matching.ts src/cv/sections/Skills/__tests__/matching.test.ts
git commit -m "feat(cv): add skillForTechnology reverse alias lookup"
```

---

### Task 2: Analytics event

**Files:**
- Modify: `src/analytics/events.ts`
- Test: `src/analytics/__tests__/events.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/analytics/__tests__/events.test.ts`:

```ts
it("trackWorkTechnologySkillClick captures work_technology_skill_clicked with technology, skill, and company", async () => {
  const { trackWorkTechnologySkillClick } = await loadAnalytics();
  trackWorkTechnologySkillClick({
    technology: "TypeScript",
    skill: "TypeScript",
    company: "Pinterest",
  });
  expect(mockCapture).toHaveBeenCalledWith("work_technology_skill_clicked", {
    technology: "TypeScript",
    skill: "TypeScript",
    company: "Pinterest",
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run src/analytics/__tests__/events.test.ts`

Expected: FAIL — `trackWorkTechnologySkillClick` is not a function

- [ ] **Step 3: Implement the tracker**

Add to `src/analytics/events.ts` after `trackSkillExperienceClick`:

```ts
export const trackWorkTechnologySkillClick = (params: {
  technology: string;
  skill: string;
  company: string;
}): void => {
  posthog.capture("work_technology_skill_clicked", params);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:run src/analytics/__tests__/events.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/analytics/events.ts src/analytics/__tests__/events.test.ts
git commit -m "feat(analytics): add work_technology_skill_clicked event"
```

---

### Task 3: Extract `SkillStars`

**Files:**
- Create: `src/cv/sections/Skills/SkillStars.tsx`
- Modify: `src/cv/sections/Skills/Skills.tsx`

- [ ] **Step 1: Create `SkillStars.tsx`**

Create `src/cv/sections/Skills/SkillStars.tsx`:

```tsx
import { IconStar, IconStarFilled } from "@tabler/icons-react";

const STAR_POSITIONS = [1, 2, 3, 4, 5] as const;

type Props = {
  count: number;
};

export const SkillStars = ({ count }: Props) => (
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

- [ ] **Step 2: Update `Skills.tsx` to use `SkillStars`**

In `src/cv/sections/Skills/Skills.tsx`:

1. Remove the `IconStar`, `IconStarFilled` imports and the local `STAR_POSITIONS` / `Stars` component.
2. Add: `import { SkillStars } from "./SkillStars";`
3. Replace `<Stars count={skill.stars} />` with `<SkillStars count={skill.stars} />`.

- [ ] **Step 3: Run existing Skills tests**

Run: `pnpm test:run src/cv/sections/Skills/__tests__/Skills.test.tsx`

Expected: PASS (star aria-label unchanged)

- [ ] **Step 4: Commit**

```bash
git add src/cv/sections/Skills/SkillStars.tsx src/cv/sections/Skills/Skills.tsx
git commit -m "refactor(cv): extract SkillStars for reuse in tooltips"
```

---

### Task 4: Skill anchors and card ids

**Files:**
- Create: `src/cv/sections/Skills/anchors.ts`
- Create: `src/cv/sections/Skills/__tests__/anchors.test.ts`
- Modify: `src/cv/sections/Skills/Skills.tsx`

- [ ] **Step 1: Write the failing anchor tests**

Create `src/cv/sections/Skills/__tests__/anchors.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

import { RESUME } from "@/cv/data";

import { scrollToSkill, skillAnchorId } from "../anchors";

describe("skillAnchorId", () => {
  it("is deterministic for the same skill", () => {
    const skill = RESUME.skills[0];
    expect(skillAnchorId(skill)).toBe(skillAnchorId(skill));
  });

  it("slugifies skill name, stripping accents and spaces", () => {
    const skill = {
      ...RESUME.skills[0],
      name: "MongoDB / Redis (NoSQL)",
    };
    expect(skillAnchorId(skill)).toBe("skill-mongodb-redis-nosql");
  });

  it("is unique across every current skill", () => {
    const ids = RESUME.skills.map(skillAnchorId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("scrollToSkill", () => {
  const skill = RESUME.skills.find((s) => s.name === "TypeScript");
  if (!skill) throw new Error("TypeScript skill missing from RESUME");

  const mountTarget = () => {
    const el = document.createElement("div");
    el.id = skillAnchorId(skill);
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
    scrollToSkill(skill);
    expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("adds the cv-flash class when motion is allowed", () => {
    const el = mountTarget();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    scrollToSkill(skill);
    expect(el.classList.contains("cv-flash")).toBe(true);
  });

  it("does NOT flash when reduced motion is preferred", () => {
    const el = mountTarget();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
    } as MediaQueryList);
    scrollToSkill(skill);
    expect(el.classList.contains("cv-flash")).toBe(false);
  });

  it("is a no-op when no matching element is mounted", () => {
    expect(() => scrollToSkill(skill)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run src/cv/sections/Skills/__tests__/anchors.test.ts`

Expected: FAIL — module `../anchors` not found

- [ ] **Step 3: Implement `anchors.ts`**

Create `src/cv/sections/Skills/anchors.ts`:

```ts
import type { Skill } from "@/cv/types";

/**
 * Stable, URL-safe DOM id for a skill card, derived from skill.name.
 * Accents are stripped so ids stay ASCII.
 */
export const skillAnchorId = (skill: Skill): string => {
  const slug = skill.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `skill-${slug}`;
};

/**
 * Scroll to a skill card and briefly flash it. Smooth-scroll and the flash
 * are gated behind `prefers-reduced-motion: no-preference`; reduced-motion
 * users get an instant jump with no flash. No-ops if the element is absent.
 */
export const scrollToSkill = (skill: Skill): void => {
  const el = document.getElementById(skillAnchorId(skill));
  if (!el) return;

  const motionOk = window.matchMedia(
    "(prefers-reduced-motion: no-preference)",
  ).matches;

  el.scrollIntoView({ behavior: motionOk ? "smooth" : "auto", block: "start" });

  if (!motionOk) return;

  el.classList.add("cv-flash");
  el.addEventListener("animationend", () => el.classList.remove("cv-flash"), {
    once: true,
  });
};
```

- [ ] **Step 4: Run anchor tests to verify they pass**

Run: `pnpm test:run src/cv/sections/Skills/__tests__/anchors.test.ts`

Expected: PASS

- [ ] **Step 5: Add anchor ids to skill card wrappers in `Skills.tsx`**

In `src/cv/sections/Skills/Skills.tsx`:

1. Add: `import { skillAnchorId } from "./anchors";`
2. Update `CARD_CLASS` constant to include `scroll-mt-24`:

```ts
const CARD_CLASS =
  "font-quicksand border border-neutral-200 rounded-lg p-4 flex flex-col gap-1 scroll-mt-24";
```

3. In `SkillCard`, add `id={skillAnchorId(skill)}` to both the static `<div>` and the interactive `<button>`.

- [ ] **Step 6: Run Skills tests**

Run: `pnpm test:run src/cv/sections/Skills/__tests__/Skills.test.tsx`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/cv/sections/Skills/anchors.ts src/cv/sections/Skills/__tests__/anchors.test.ts src/cv/sections/Skills/Skills.tsx
git commit -m "feat(cv): add skill anchor ids and scrollToSkill navigation"
```

---

### Task 5: `WorkTechnologyBadge` component

**Files:**
- Create: `src/cv/sections/Work/WorkTechnologyBadge.tsx`
- Create: `src/cv/sections/Work/__tests__/WorkTechnologyBadge.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/cv/sections/Work/__tests__/WorkTechnologyBadge.test.tsx`:

```tsx
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "@/test/render";

import { WorkTechnologyBadge } from "../WorkTechnologyBadge";

const mockScrollToSkill = vi.fn();
const mockTrack = vi.fn();
const mockUseMediaQuery = vi.fn(() => true);

vi.mock("@/cv/sections/Skills/anchors", () => ({
  scrollToSkill: (...args: unknown[]) => mockScrollToSkill(...args),
}));

vi.mock("@/analytics/events", () => ({
  trackWorkTechnologySkillClick: (...args: unknown[]) => mockTrack(...args),
}));

vi.mock("@mantine/hooks", () => ({
  useMediaQuery: () => mockUseMediaQuery(),
}));

describe("WorkTechnologyBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMediaQuery.mockReturnValue(true);
  });

  it("renders an unmapped technology as a static badge (not a button)", () => {
    renderWithProviders(
      <WorkTechnologyBadge technology="Java" company="Daitan Group" />,
    );
    const badge = screen.getByTestId("work-tech-badge-java");
    expect(badge.tagName).not.toBe("BUTTON");
    expect(screen.getByText("Java")).toBeInTheDocument();
  });

  it("renders a mapped technology as a button with an accessible label", () => {
    renderWithProviders(
      <WorkTechnologyBadge technology="TypeScript" company="Pinterest" />,
    );
    const btn = screen.getByRole("button", {
      name: /View TypeScript skill — Advanced, 4 of 5 stars/i,
    });
    expect(btn).toHaveAttribute("data-testid", "work-tech-badge-typescript");
  });

  it("navigates immediately on desktop click", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <WorkTechnologyBadge technology="TypeScript" company="Pinterest" />,
    );
    await user.click(
      screen.getByRole("button", { name: /View TypeScript skill/i }),
    );
    expect(mockScrollToSkill).toHaveBeenCalledTimes(1);
    expect(mockScrollToSkill.mock.calls[0][0].name).toBe("TypeScript");
    expect(mockTrack).toHaveBeenCalledWith({
      technology: "TypeScript",
      skill: "TypeScript",
      company: "Pinterest",
    });
  });

  it("shows hint on first touch tap and navigates on second tap", async () => {
    mockUseMediaQuery.mockReturnValue(false);
    const user = userEvent.setup();
    renderWithProviders(
      <WorkTechnologyBadge technology="TypeScript" company="Pinterest" />,
    );
    const btn = screen.getByRole("button", { name: /View TypeScript skill/i });

    await user.click(btn);
    expect(mockScrollToSkill).not.toHaveBeenCalled();
    expect(screen.getByText("Tap again to see skill")).toBeInTheDocument();

    await user.click(btn);
    expect(mockScrollToSkill).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run src/cv/sections/Work/__tests__/WorkTechnologyBadge.test.tsx`

Expected: FAIL — module not found

- [ ] **Step 3: Implement `WorkTechnologyBadge.tsx`**

Create `src/cv/sections/Work/WorkTechnologyBadge.tsx`:

```tsx
"use client";

import { Tooltip } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useCallback, useState } from "react";

import { trackWorkTechnologySkillClick } from "@/analytics/events";
import { Badge } from "@/components/ui/Badge";
import { workBadge } from "@/cv/cv-colors";
import { RESUME } from "@/cv/data";
import { scrollToSkill } from "@/cv/sections/Skills/anchors";
import { skillForTechnology } from "@/cv/sections/Skills/matching";
import { SkillStars } from "@/cv/sections/Skills/SkillStars";
import { TechIcon } from "@/cv/TechIcon";

type Props = {
  technology: string;
  company: string;
};

export const technologyTestId = (technology: string): string =>
  `work-tech-badge-${technology
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;

const BadgeContent = ({ technology }: { technology: string }) => (
  <>
    <TechIcon alias={technology} size={14} />
    {technology}
  </>
);

export const WorkTechnologyBadge = ({ technology, company }: Props) => {
  const skill = skillForTechnology(technology, RESUME.skills);
  const isFinePointer = useMediaQuery(
    "(hover: hover) and (pointer: fine)",
    true,
  );
  const [hintOpen, setHintOpen] = useState(false);

  const navigate = useCallback(() => {
    if (!skill) return;
    scrollToSkill(skill);
    trackWorkTechnologySkillClick({
      technology,
      skill: skill.name,
      company,
    });
    setHintOpen(false);
  }, [skill, technology, company]);

  if (!skill) {
    return (
      <Badge
        variant="secondary"
        className={`gap-2 ${workBadge}`}
        data-testid={technologyTestId(technology)}
      >
        <BadgeContent technology={technology} />
      </Badge>
    );
  }

  const tooltipLabel = (
    <span className="flex flex-col gap-1">
      <span className="inline-flex items-center gap-1">
        {skill.level} · <SkillStars count={skill.stars} />
      </span>
      {!isFinePointer && hintOpen && (
        <span className="text-xs text-neutral-400">Tap again to see skill</span>
      )}
    </span>
  );

  const handleClick = () => {
    if (isFinePointer) {
      navigate();
      return;
    }
    if (hintOpen) {
      navigate();
    } else {
      setHintOpen(true);
    }
  };

  return (
    <Tooltip
      label={tooltipLabel}
      position="top"
      withArrow
      multiline
      opened={isFinePointer ? undefined : hintOpen}
      events={{ hover: isFinePointer, focus: true, touch: false }}
    >
      <Badge
        render={
          <button
            type="button"
            aria-label={`View ${skill.name} skill — ${skill.level}, ${skill.stars} of 5 stars`}
            onClick={handleClick}
            onBlur={() => {
              if (!isFinePointer) setHintOpen(false);
            }}
          />
        }
        variant="secondary"
        data-testid={technologyTestId(technology)}
        className={`gap-2 cursor-pointer hover:border-neutral-400 transition-colors ${workBadge}`}
      >
        <BadgeContent technology={technology} />
      </Badge>
    </Tooltip>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test:run src/cv/sections/Work/__tests__/WorkTechnologyBadge.test.tsx`

Expected: PASS (all four tests)

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/WorkTechnologyBadge.tsx src/cv/sections/Work/__tests__/WorkTechnologyBadge.test.tsx
git commit -m "feat(cv): add WorkTechnologyBadge with tooltip and skill navigation"
```

---

### Task 6: Wire into Work timeline

**Files:**
- Modify: `src/cv/sections/Work/WorkTimelineItem.tsx`
- Modify: `src/cv/sections/Work/__tests__/Work.test.tsx`

- [ ] **Step 1: Write the failing integration test**

Add to `src/cv/sections/Work/__tests__/Work.test.tsx`:

```ts
it("renders mapped technology badges as navigation buttons inside expanded accordion", async () => {
  const user = userEvent.setup();
  renderWithProviders(<Work />);
  const pinterest = RESUME.workExperience.find((w) => w.company === "Pinterest");
  if (!pinterest) throw new Error("Pinterest entry missing");
  const card = screen.getByTestId("work-entry-Pinterest");
  await user.click(within(card).getByRole("button", { name: /Toggle Pinterest/i }));

  expect(
    within(card).getByRole("button", { name: /View TypeScript skill/i }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run src/cv/sections/Work/__tests__/Work.test.tsx -t "mapped technology badges"`

Expected: FAIL — TypeScript text is plain badge, not a skill navigation button

- [ ] **Step 3: Update `WorkTimelineItem.tsx`**

1. Remove unused imports: `Badge`, `TechIcon` (if no longer used elsewhere in file).
2. Add: `import { WorkTechnologyBadge } from "./WorkTechnologyBadge";`
3. Replace the technology badge map:

```tsx
<div className="flex flex-wrap gap-2">
  {entry.technologies.map((t) => (
    <WorkTechnologyBadge key={t} technology={t} company={entry.company} />
  ))}
</div>
```

- [ ] **Step 4: Run Work tests**

Run: `pnpm test:run src/cv/sections/Work/__tests__/Work.test.tsx`

Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/WorkTimelineItem.tsx src/cv/sections/Work/__tests__/Work.test.tsx
git commit -m "feat(cv): wire WorkTechnologyBadge into work timeline items"
```

---

### Task 7: Documentation

**Files:**
- Modify: `src/cv/README.md`

- [ ] **Step 1: Add Work → skill navigation section**

In `src/cv/README.md`, after the **Skill → work navigation** subsection (after the analytics sentence, before **shadcn/ui in Work**), insert:

```markdown
### Work → skill navigation

Work accordion technology badges use `WorkTechnologyBadge` (`sections/Work/WorkTechnologyBadge.tsx`). `skillForTechnology` (`sections/Skills/matching.ts`) resolves a technology string to a skill via exact case-insensitive alias match (same rules as `experiencesForSkill`, inverted).

- **Mapped badges** render as buttons. Desktop hover shows a Mantine tooltip with `{level} · stars`. Click scrolls to the skill card via `scrollToSkill` (`sections/Skills/anchors.ts`) and flashes it (`.cv-flash`, gated by `prefers-reduced-motion`).
- **Touch devices** use a two-tap flow: first tap opens the tooltip (level + stars + *"Tap again to see skill"* hint); second tap navigates.
- **Unmapped badges** (technology strings with no skill alias) stay static — no tooltip, no click.

Skill cards expose `id={skillAnchorId(skill)}` for scroll targets. Analytics: `work_technology_skill_clicked`.
```

- [ ] **Step 2: Run full test suite**

Run: `pnpm test:run`

Expected: PASS (entire suite)

- [ ] **Step 3: Run linter**

Run: `pnpm lint`

Expected: no errors (fix any Biome issues if they appear)

- [ ] **Step 4: Commit**

```bash
git add src/cv/README.md
git commit -m "docs(cv): document work badge to skill navigation"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| `skillForTechnology` reverse lookup | Task 1 |
| Unmapped badges static | Task 5 |
| `skillAnchorId` + `scrollToSkill` | Task 4 |
| Skill card DOM ids + `scroll-mt-24` | Task 4 |
| Shared `SkillStars` | Task 3 |
| Desktop hover tooltip (level + stars) | Task 5 |
| Touch two-tap + hint text | Task 5 |
| `.cv-flash` on arrival | Task 4 |
| Analytics `work_technology_skill_clicked` | Task 2 |
| Regression guard for alias round-trip | Task 1 |
| `WorkTimelineItem` integration | Task 6 |
| README documentation | Task 7 |

## Out of scope (confirmed)

- Expanding `data.ts` aliases for unmapped technologies
- URL hash deep links
- Opening `SkillExperiencesModal` on arrival
- Changing Skills → Work flow
