# CV "Where I used this skill" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On `/cv`, clicking a skill card opens a dialog listing every job that used that skill; clicking a job closes the dialog and smooth-scrolls (with a reduced-motion-aware flash) to that work entry.

**Architecture:** Skills declare an `aliases` list (the exact `technologies[]` strings that represent them). A pure `experiencesForSkill` function maps a skill to its jobs. Each work entry gets a stable anchor `id` from a shared `workEntryAnchorId` helper; a `scrollToWorkEntry` helper scrolls to it and flashes it. A presentational `SkillExperiencesModal` renders the matched jobs as buttons; the `Skills` section owns the open/scroll/analytics wiring. Two PostHog events record opens and click-throughs.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript (strict), Mantine 8 `Modal`, Tailwind v4, Vitest + Testing Library + `user-event` v14, PostHog, Biome.

---

## Branch setup (do this first)

The `/cv` feature already merged to `main` (PR #6). Start from a fresh branch off `main`:

```bash
git checkout main
git checkout -b feat/cv-skill-experiences
```

Never commit to `main`. Stay on `feat/cv-skill-experiences` for every task.

## Conventions for every task

- TDD: write the failing test, **run it and watch it fail**, implement minimally, run it green, commit. Never skip the failing run.
- Run a single test file with: `pnpm test:run <path-to-test-file>`.
- Before each commit, the pre-commit hook runs Biome. If it reformats files, re-stage and commit again (no `--no-verify`).
- Path alias `@/*` → `src/*`.
- The plan is local-only (`docs/superpowers/` is gitignored); do not commit plan/spec/run files.

## File structure (what each new/changed file owns)

- `src/cv/types.ts` — add `aliases: string[]` to `Skill`.
- `src/cv/data.ts` — populate `aliases` for all 16 skills.
- `src/cv/sections/Skills/matching.ts` — pure `experiencesForSkill(skill, entries)`.
- `src/cv/sections/Work/anchors.ts` — pure `workEntryAnchorId(entry)` + DOM `scrollToWorkEntry(entry)`.
- `src/cv/sections/Work/Work.tsx` — set the anchor `id` on each entry.
- `src/cv/sections/Skills/SkillExperiencesModal.tsx` — presentational dialog of matched jobs.
- `src/cv/sections/Skills/Skills.tsx` — cards become buttons; owns modal state + scroll + analytics.
- `src/analytics/events.ts` — `trackSkillExperiencesOpen`, `trackSkillExperienceClick`.
- `src/app/globals.css` — `.cv-flash` keyframes.
- `src/analytics/README.md`, `src/cv/README.md` — docs.

---

### Task 1: Add `aliases` to the Skill type and populate the data

**Files:**
- Modify: `src/cv/types.ts:13-23` (the `Skill` type)
- Modify: `src/cv/data.ts` (every entry in the `skills` array)
- Test: `src/cv/__tests__/data.test.ts`

- [ ] **Step 1: Write the failing test**

Add this test inside the `describe("RESUME data shape", ...)` block in `src/cv/__tests__/data.test.ts`:

```ts
  it("gives every skill at least one alias (its technology-string identities)", () => {
    for (const s of RESUME.skills) {
      expect(Array.isArray(s.aliases)).toBe(true);
      expect(s.aliases.length).toBeGreaterThanOrEqual(1);
      for (const alias of s.aliases) expect(alias.trim().length).toBeGreaterThan(0);
    }
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/cv/__tests__/data.test.ts`
Expected: FAIL — `s.aliases` is `undefined` (property does not exist yet), and TypeScript errors on the missing field.

- [ ] **Step 3: Add `aliases` to the `Skill` type**

In `src/cv/types.ts`, add the field to the `Skill` type:

```ts
export type Skill = {
  name: string;
  category: SkillCategory;
  area: string;
  level: SkillLevel;
  stars: 1 | 2 | 3 | 4 | 5;
  years: number;
  filledDots: number;
  totalDots: 10;
  since: string;
  aliases: string[];
};
```

- [ ] **Step 4: Populate `aliases` for all 16 skills**

In `src/cv/data.ts`, add an `aliases` array to each skill object. Use exactly these values:

```ts
// "AI tools (Claude Code, Cursor, etc)"
aliases: ["Claude Code", "Cursor", "GitHub Copilot"],
// "JavaScript"
aliases: ["JavaScript"],
// "TypeScript"
aliases: ["TypeScript"],
// "Python"
aliases: ["Python"],
// "Ruby (on Rails)"
aliases: ["Ruby on Rails"],
// "React.js"
aliases: ["React.js"],
// "React Native"
aliases: ["React Native"],
// "Next.js, Vite, TanStack"
aliases: ["Next.js", "Vite", "TanStack"],
// "Figma"
aliases: ["Figma"],
// "Node.js"
aliases: ["Node.js"],
// "MongoDB / Redis (NoSQL)"
aliases: ["MongoDB", "Redis"],
// "PostgreSQL / MySQL (SQL)"
aliases: ["PostgreSQL", "MySQL"],
// "CMS (Sanity, Payload, etc)"
aliases: ["Sanity", "Sanity.io"],
// "AWS"
aliases: ["AWS"],
// "Docker"
aliases: ["Docker"],
// "Git and CI/CD"
aliases: ["Git", "GitHub Actions", "Gitlab CI", "Buildkite", "Codeship", "SVN"],
```

Add each `aliases` line to its matching skill object (match by the `name` in the comment). Place it after the `since` field of that object.

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test:run src/cv/__tests__/data.test.ts`
Expected: PASS (all data-shape tests, including the new alias test).

- [ ] **Step 6: Type-check**

Run: `pnpm tsc --noEmit`
Expected: clean (no errors).

- [ ] **Step 7: Commit**

```bash
git add src/cv/types.ts src/cv/data.ts src/cv/__tests__/data.test.ts
git commit -m "feat(cv): declare technology aliases on each skill"
```

---

### Task 2: `experiencesForSkill` matching function

**Files:**
- Create: `src/cv/sections/Skills/matching.ts`
- Test: `src/cv/sections/Skills/__tests__/matching.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/cv/sections/Skills/__tests__/matching.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import type { Skill } from "@/cv/types";

import { experiencesForSkill } from "../matching";

const skillNamed = (name: string): Skill => {
  const skill = RESUME.skills.find((s) => s.name === name);
  if (!skill) throw new Error(`No skill named ${name}`);
  return skill;
};

const withAliases = (name: string, aliases: string[]): Skill => ({
  ...skillNamed(name),
  aliases,
});

describe("experiencesForSkill", () => {
  it("matches entries by exact technology string, case-insensitively", () => {
    const result = experiencesForSkill(
      withAliases("JavaScript", ["javascript"]),
      RESUME.workExperience,
    );
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every((e) =>
        e.technologies.some((t) => t.toLowerCase() === "javascript"),
      ),
    ).toBe(true);
  });

  it("does NOT match on substrings (Sanity must not match Sanity.io)", () => {
    const companies = experiencesForSkill(
      withAliases("CMS (Sanity, Payload, etc)", ["Sanity"]),
      RESUME.workExperience,
    ).map((e) => e.company);
    expect(companies).toContain("Pinterest"); // technologies include "Sanity"
    expect(companies).not.toContain("PairTree"); // technologies include "Sanity.io"
  });

  it("matches any of several aliases (MongoDB / Redis)", () => {
    const companies = experiencesForSkill(
      withAliases("MongoDB / Redis (NoSQL)", ["MongoDB", "Redis"]),
      RESUME.workExperience,
    ).map((e) => e.company);
    expect(companies).toContain("Écolheita"); // MongoDB
    expect(companies).toContain("Daitan Group"); // Redis
  });

  it("preserves most-recent-first input order", () => {
    const result = experiencesForSkill(
      withAliases("JavaScript", ["JavaScript"]),
      RESUME.workExperience,
    );
    const indices = result.map((e) => RESUME.workExperience.indexOf(e));
    const ascending = [...indices].sort((a, b) => a - b);
    expect(indices).toEqual(ascending);
  });

  it("returns [] when no technology matches", () => {
    expect(
      experiencesForSkill(
        withAliases("JavaScript", ["NonexistentTech"]),
        RESUME.workExperience,
      ),
    ).toEqual([]);
  });

  it("resolves every real skill in RESUME to at least one experience", () => {
    for (const skill of RESUME.skills) {
      expect(
        experiencesForSkill(skill, RESUME.workExperience).length,
      ).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/cv/sections/Skills/__tests__/matching.test.ts`
Expected: FAIL — `Cannot find module "../matching"`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/cv/sections/Skills/matching.ts`:

```ts
import type { Skill, WorkExperience } from "@/cv/types";

/**
 * Work experiences whose technologies include any of the skill's aliases.
 * Comparison is case-insensitive but EXACT per token (no substring), so
 * "Sanity" matches "Sanity" but not "Sanity.io". Input order is preserved.
 */
export const experiencesForSkill = (
  skill: Skill,
  entries: ReadonlyArray<WorkExperience>,
): WorkExperience[] => {
  const aliases = new Set(skill.aliases.map((a) => a.toLowerCase()));
  return entries.filter((entry) =>
    entry.technologies.some((tech) => aliases.has(tech.toLowerCase())),
  );
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/cv/sections/Skills/__tests__/matching.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Skills/matching.ts src/cv/sections/Skills/__tests__/matching.test.ts
git commit -m "feat(cv): add experiencesForSkill skill-to-jobs matcher"
```

---

### Task 3: `workEntryAnchorId` helper

**Files:**
- Create: `src/cv/sections/Work/anchors.ts`
- Test: `src/cv/sections/Work/__tests__/anchors.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/cv/sections/Work/__tests__/anchors.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";

import { workEntryAnchorId } from "../anchors";

describe("workEntryAnchorId", () => {
  it("is deterministic for the same entry", () => {
    const entry = RESUME.workExperience[0];
    expect(workEntryAnchorId(entry)).toBe(workEntryAnchorId(entry));
  });

  it("slugifies company + startDate, stripping accents and spaces", () => {
    const entry = {
      ...RESUME.workExperience[0],
      company: "Quero Educação",
      startDate: "Sep 2020",
    };
    expect(workEntryAnchorId(entry)).toBe("work-quero-educacao-sep-2020");
  });

  it("is unique across every current work entry", () => {
    const ids = RESUME.workExperience.map(workEntryAnchorId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/cv/sections/Work/__tests__/anchors.test.ts`
Expected: FAIL — `Cannot find module "../anchors"`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/cv/sections/Work/anchors.ts`:

```ts
import type { WorkExperience } from "@/cv/types";

/**
 * Stable, URL-safe DOM id for a work entry, derived from company + startDate
 * (mirrors the React key pattern `${company}-${startDate}`). Accents are
 * stripped so ids stay ASCII.
 */
export const workEntryAnchorId = (entry: WorkExperience): string => {
  const slug = `${entry.company} ${entry.startDate}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `work-${slug}`;
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/cv/sections/Work/__tests__/anchors.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/anchors.ts src/cv/sections/Work/__tests__/anchors.test.ts
git commit -m "feat(cv): add workEntryAnchorId slug helper"
```

---

### Task 4: Put the anchor id on each work entry

**Files:**
- Modify: `src/cv/sections/Work/Work.tsx` (the `WorkEntry` `<article>` and its import)
- Test: `src/cv/sections/Work/__tests__/Work.test.tsx`

- [ ] **Step 1: Write the failing test**

Add this test inside the `describe("Work", ...)` block in `src/cv/sections/Work/__tests__/Work.test.tsx`, and add the import at the top of the file:

```ts
import { workEntryAnchorId } from "../anchors";
```

```tsx
  it("anchors each work entry with its workEntryAnchorId", () => {
    renderWithProviders(<Work />);
    for (const w of RESUME.workExperience) {
      const card = screen.getByTestId(`work-entry-${w.company}`);
      expect(card).toHaveAttribute("id", workEntryAnchorId(w));
    }
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/cv/sections/Work/__tests__/Work.test.tsx`
Expected: FAIL — the `<article>` has no `id` attribute.

- [ ] **Step 3: Write the minimal implementation**

In `src/cv/sections/Work/Work.tsx`, add the import near the existing imports:

```tsx
import { workEntryAnchorId } from "./anchors";
```

Then add `id={workEntryAnchorId(entry)}` to the `WorkEntry` `<article>` (keep the existing `data-testid` and `className`):

```tsx
const WorkEntry = ({ entry }: { entry: WorkExperience }) => (
  <article
    id={workEntryAnchorId(entry)}
    data-testid={`work-entry-${entry.company}`}
    className="flex flex-col gap-2 scroll-mt-24"
  >
```

(`scroll-mt-24` keeps the heading clear of the top edge when scrolled to.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/cv/sections/Work/__tests__/Work.test.tsx`
Expected: PASS (all Work tests).

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/Work.tsx src/cv/sections/Work/__tests__/Work.test.tsx
git commit -m "feat(cv): give each work entry a scroll anchor id"
```

---

### Task 5: `scrollToWorkEntry` helper (scroll + reduced-motion-aware flash)

**Files:**
- Modify: `src/cv/sections/Work/anchors.ts` (add `scrollToWorkEntry`)
- Test: `src/cv/sections/Work/__tests__/anchors.test.ts` (add a `scrollToWorkEntry` describe block)

- [ ] **Step 1: Write the failing test**

Add to `src/cv/sections/Work/__tests__/anchors.test.ts`. Update the import line and append a new describe block:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
```

```ts
import { scrollToWorkEntry, workEntryAnchorId } from "../anchors";
```

```ts
describe("scrollToWorkEntry", () => {
  const entry = RESUME.workExperience[0];

  const mountTarget = () => {
    const el = document.createElement("div");
    el.id = workEntryAnchorId(entry);
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
    scrollToWorkEntry(entry);
    expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("adds the cv-flash class when motion is allowed", () => {
    const el = mountTarget();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    scrollToWorkEntry(entry);
    expect(el.classList.contains("cv-flash")).toBe(true);
  });

  it("does NOT flash when reduced motion is preferred", () => {
    const el = mountTarget();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
    } as MediaQueryList);
    scrollToWorkEntry(entry);
    expect(el.classList.contains("cv-flash")).toBe(false);
  });

  it("is a no-op when no matching element is mounted", () => {
    expect(() => scrollToWorkEntry(entry)).not.toThrow();
  });
});
```

(Note: the global `vitest.setup.ts` polyfills `window.matchMedia` to return `matches: false`, so the first test exercises the reduced-motion path and still scrolls.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/cv/sections/Work/__tests__/anchors.test.ts`
Expected: FAIL — `scrollToWorkEntry` is not exported from `../anchors`.

- [ ] **Step 3: Write the minimal implementation**

Append to `src/cv/sections/Work/anchors.ts`:

```ts
/**
 * Scroll to a work entry and briefly flash it. Smooth-scroll and the flash
 * are gated behind `prefers-reduced-motion: no-preference`; reduced-motion
 * users get an instant jump with no flash. No-ops if the element is absent.
 */
export const scrollToWorkEntry = (entry: WorkExperience): void => {
  const el = document.getElementById(workEntryAnchorId(entry));
  if (!el) return;

  const motionOk = window.matchMedia(
    "(prefers-reduced-motion: no-preference)",
  ).matches;

  el.scrollIntoView({ behavior: motionOk ? "smooth" : "auto", block: "start" });
  if (!motionOk) return;

  el.classList.add("cv-flash");
  el.addEventListener(
    "animationend",
    () => el.classList.remove("cv-flash"),
    { once: true },
  );
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/cv/sections/Work/__tests__/anchors.test.ts`
Expected: PASS (3 anchor-id tests + 4 scroll tests).

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/anchors.ts src/cv/sections/Work/__tests__/anchors.test.ts
git commit -m "feat(cv): add scrollToWorkEntry with reduced-motion-aware flash"
```

---

### Task 6: `.cv-flash` keyframes

**Files:**
- Modify: `src/app/globals.css`

This is a styling change with no unit test (CSS animation is not unit-testable in jsdom; the `scrollToWorkEntry` test already verifies the class is toggled). It is verified by the production build and the manual smoke check.

- [ ] **Step 1: Add the keyframes**

Append to `src/app/globals.css`:

```css
@keyframes cv-flash {
  0% {
    background-color: rgba(251, 191, 36, 0.25);
  }
  100% {
    background-color: transparent;
  }
}

.cv-flash {
  animation: cv-flash 1.2s ease-out;
  border-radius: 0.5rem;
}
```

- [ ] **Step 2: Verify the app still builds**

Run: `pnpm build`
Expected: `✓ Compiled successfully`; `/cv` listed as a static route.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style(cv): add cv-flash highlight keyframes"
```

---

### Task 7: Analytics events

**Files:**
- Modify: `src/analytics/events.ts`
- Modify: `src/analytics/README.md`
- Test: `src/analytics/__tests__/events.test.ts`

- [ ] **Step 1: Write the failing test**

Add these two tests inside the `describe("event trackers", ...)` block in `src/analytics/__tests__/events.test.ts`:

```ts
  it("trackSkillExperiencesOpen captures skill_experiences_opened with the skill", async () => {
    const { trackSkillExperiencesOpen } = await loadAnalytics();
    trackSkillExperiencesOpen({ skill: "JavaScript" });
    expect(mockCapture).toHaveBeenCalledWith("skill_experiences_opened", {
      skill: "JavaScript",
    });
  });

  it("trackSkillExperienceClick captures skill_experience_clicked with skill and company", async () => {
    const { trackSkillExperienceClick } = await loadAnalytics();
    trackSkillExperienceClick({ skill: "JavaScript", company: "Pinterest" });
    expect(mockCapture).toHaveBeenCalledWith("skill_experience_clicked", {
      skill: "JavaScript",
      company: "Pinterest",
    });
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/analytics/__tests__/events.test.ts`
Expected: FAIL — the two functions are not exported.

- [ ] **Step 3: Write the minimal implementation**

Append to `src/analytics/events.ts`:

```ts
export const trackSkillExperiencesOpen = (params: {
  skill: string;
}): void => {
  posthog.capture("skill_experiences_opened", params);
};

export const trackSkillExperienceClick = (params: {
  skill: string;
  company: string;
}): void => {
  posthog.capture("skill_experience_clicked", params);
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/analytics/__tests__/events.test.ts`
Expected: PASS.

- [ ] **Step 5: Document the events**

In `src/analytics/README.md`, add two rows/entries to the event list (match the existing format used for `resume_pdf_clicked` etc.):

- `skill_experiences_opened` — props `{ skill }` — fired on `/cv` when a skill card opens its "where I used this" dialog.
- `skill_experience_clicked` — props `{ skill, company }` — fired on `/cv` when a job is clicked inside that dialog.

- [ ] **Step 6: Commit**

```bash
git add src/analytics/events.ts src/analytics/__tests__/events.test.ts src/analytics/README.md
git commit -m "feat(analytics): add skill-experiences open and click events"
```

---

### Task 8: `SkillExperiencesModal` (presentational dialog)

**Files:**
- Create: `src/cv/sections/Skills/SkillExperiencesModal.tsx`
- Test: `src/cv/sections/Skills/__tests__/SkillExperiencesModal.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/cv/sections/Skills/__tests__/SkillExperiencesModal.test.tsx`:

```tsx
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RESUME } from "@/cv/data";
import type { Skill } from "@/cv/types";
import { renderWithProviders, screen, within } from "@/test/render";

import { experiencesForSkill } from "../matching";
import { SkillExperiencesModal } from "../SkillExperiencesModal";

const javascript = RESUME.skills.find((s) => s.name === "JavaScript") as Skill;

describe("SkillExperiencesModal", () => {
  it("renders nothing open when skill is null", () => {
    renderWithProviders(
      <SkillExperiencesModal
        skill={null}
        onClose={vi.fn()}
        onExperienceClick={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lists each matched experience with company, role and dates", () => {
    renderWithProviders(
      <SkillExperiencesModal
        skill={javascript}
        onClose={vi.fn()}
        onExperienceClick={vi.fn()}
      />,
    );
    const matches = experiencesForSkill(javascript, RESUME.workExperience);
    expect(matches.length).toBeGreaterThan(0);
    for (const entry of matches) {
      const row = screen.getByTestId(`skill-experience-${entry.company}`);
      expect(within(row).getByText(entry.company)).toBeInTheDocument();
      expect(
        within(row).getByText(new RegExp(entry.startDate)),
      ).toBeInTheDocument();
    }
  });

  it("calls onExperienceClick with the entry when a row is clicked", async () => {
    const onExperienceClick = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <SkillExperiencesModal
        skill={javascript}
        onClose={vi.fn()}
        onExperienceClick={onExperienceClick}
      />,
    );
    const [first] = experiencesForSkill(javascript, RESUME.workExperience);
    await user.click(screen.getByTestId(`skill-experience-${first.company}`));
    expect(onExperienceClick).toHaveBeenCalledWith(first);
  });

  it("shows an empty state when the skill matches no experiences", () => {
    const orphan: Skill = { ...javascript, name: "Orphan", aliases: [] };
    renderWithProviders(
      <SkillExperiencesModal
        skill={orphan}
        onClose={vi.fn()}
        onExperienceClick={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/no linked experiences yet/i),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/cv/sections/Skills/__tests__/SkillExperiencesModal.test.tsx`
Expected: FAIL — `Cannot find module "../SkillExperiencesModal"`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/cv/sections/Skills/SkillExperiencesModal.tsx`:

```tsx
"use client";

import { Modal } from "@mantine/core";

import { RESUME } from "@/cv/data";
import type { Skill, WorkExperience } from "@/cv/types";

import { experiencesForSkill } from "./matching";

type Props = {
  skill: Skill | null;
  onClose: () => void;
  onExperienceClick: (entry: WorkExperience) => void;
};

export const SkillExperiencesModal = ({
  skill,
  onClose,
  onExperienceClick,
}: Props) => {
  const matches = skill
    ? experiencesForSkill(skill, RESUME.workExperience)
    : [];

  return (
    <Modal
      opened={skill !== null}
      onClose={onClose}
      centered
      size="auto"
      title={skill ? `Where I used ${skill.name}` : ""}
    >
      {matches.length === 0 ? (
        <p className="text-sm text-neutral-500">No linked experiences yet.</p>
      ) : (
        <ul className="flex flex-col gap-2 min-w-[260px]">
          {matches.map((entry) => (
            <li key={`${entry.company}-${entry.startDate}`}>
              <button
                type="button"
                data-testid={`skill-experience-${entry.company}`}
                onClick={() => onExperienceClick(entry)}
                className="w-full text-left border border-neutral-200 rounded-lg p-3 cursor-pointer hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
              >
                <span className="block text-sm font-semibold">
                  {entry.company}
                </span>
                <span className="block text-xs text-neutral-500">
                  {entry.role} · {entry.startDate} – {entry.endDate}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/cv/sections/Skills/__tests__/SkillExperiencesModal.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Skills/SkillExperiencesModal.tsx src/cv/sections/Skills/__tests__/SkillExperiencesModal.test.tsx
git commit -m "feat(cv): add SkillExperiencesModal listing jobs per skill"
```

---

### Task 9: Wire the Skills section (cards become buttons + modal + scroll + analytics)

**Files:**
- Modify: `src/cv/sections/Skills/Skills.tsx`
- Test: `src/cv/sections/Skills/__tests__/Skills.test.tsx`

- [ ] **Step 1: Write the failing test**

In `src/cv/sections/Skills/__tests__/Skills.test.tsx`, add `userEvent` to the imports and add two tests inside the `describe("Skills", ...)` block.

Add import at the top:

```tsx
import userEvent from "@testing-library/user-event";
```

Add tests:

```tsx
  it("renders a skill that has matches as a button", () => {
    renderWithProviders(<Skills />);
    expect(screen.getByTestId("skill-card-JavaScript").tagName).toBe("BUTTON");
  });

  it("opens the experiences dialog for the clicked skill", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Skills />);

    await user.click(screen.getByTestId("skill-card-JavaScript"));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/where i used javascript/i),
    ).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/cv/sections/Skills/__tests__/Skills.test.tsx`
Expected: FAIL — `skill-card-JavaScript` is a `DIV`, and no dialog opens.

- [ ] **Step 3: Write the implementation**

Replace the entire contents of `src/cv/sections/Skills/Skills.tsx` with:

```tsx
"use client";

import { IconStar, IconStarFilled } from "@tabler/icons-react";
import { useState } from "react";

import {
  trackSkillExperienceClick,
  trackSkillExperiencesOpen,
} from "@/analytics/events";
import { RESUME } from "@/cv/data";
import { scrollToWorkEntry } from "@/cv/sections/Work/anchors";
import type { Skill, SkillCategory, WorkExperience } from "@/cv/types";

import { experiencesForSkill } from "./matching";
import { SkillExperiencesModal } from "./SkillExperiencesModal";

const CATEGORY_ORDER: ReadonlyArray<SkillCategory> = [
  "Language",
  "Framework",
  "Runtime",
  "Database",
  "Infrastructure",
  "CMS",
  "AI",
  "Design",
];

const groupByCategory = (
  skills: ReadonlyArray<Skill>,
): Array<{ category: SkillCategory; items: Skill[] }> => {
  const buckets = new Map<SkillCategory, Skill[]>();
  for (const skill of skills) {
    const existing = buckets.get(skill.category);
    if (existing) existing.push(skill);
    else buckets.set(skill.category, [skill]);
  }
  return CATEGORY_ORDER.filter((c) => buckets.has(c)).map((category) => ({
    category,
    items: buckets.get(category) ?? [],
  }));
};

const STAR_POSITIONS = [1, 2, 3, 4, 5] as const;

const Stars = ({ count }: { count: number }) => (
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

const Dots = ({ filled, total }: { filled: number; total: number }) => {
  const text = "●".repeat(filled) + "○".repeat(total - filled);
  return (
    <span
      data-testid="skill-dots"
      className="font-mono text-neutral-400 text-xs"
    >
      {text}
    </span>
  );
};

/** Card body, built only from phrasing content so it is valid inside a button. */
const SkillCardInner = ({ skill }: { skill: Skill }) => (
  <>
    <span className="flex flex-row justify-between items-baseline gap-2">
      <span className="text-sm font-semibold">{skill.name}</span>
      <span className="flex flex-row items-center gap-1">
        <span className="text-xs text-neutral-500">{skill.level}</span>
        <Stars count={skill.stars} />
      </span>
    </span>
    <span className="block text-xs text-neutral-500">{skill.area}</span>
    <span className="block text-xs text-neutral-500">
      {skill.years} years · {skill.since}
    </span>
    <Dots filled={skill.filledDots} total={skill.totalDots} />
  </>
);

const CARD_CLASS =
  "border border-neutral-200 rounded-lg p-4 flex flex-col gap-1";

const SkillCard = ({
  skill,
  onOpen,
}: {
  skill: Skill;
  onOpen: (skill: Skill) => void;
}) => {
  const interactive =
    experiencesForSkill(skill, RESUME.workExperience).length > 0;

  if (!interactive) {
    return (
      <div data-testid={`skill-card-${skill.name}`} className={CARD_CLASS}>
        <SkillCardInner skill={skill} />
      </div>
    );
  }

  return (
    <button
      type="button"
      data-testid={`skill-card-${skill.name}`}
      aria-haspopup="dialog"
      onClick={() => onOpen(skill)}
      className={`${CARD_CLASS} text-left w-full cursor-pointer hover:border-neutral-400 hover:shadow-sm transition`}
    >
      <SkillCardInner skill={skill} />
    </button>
  );
};

export const Skills = () => {
  const groups = groupByCategory(RESUME.skills);
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);

  const handleOpen = (skill: Skill) => {
    setActiveSkill(skill);
    trackSkillExperiencesOpen({ skill: skill.name });
  };

  const handleExperienceClick = (entry: WorkExperience) => {
    if (activeSkill) {
      trackSkillExperienceClick({
        skill: activeSkill.name,
        company: entry.company,
      });
    }
    setActiveSkill(null);
    scrollToWorkEntry(entry);
  };

  return (
    <section id="skills" className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold tracking-tight">Skills</h2>
      {groups.map((group) => (
        <div key={group.category} className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {group.category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.items.map((skill) => (
              <SkillCard key={skill.name} skill={skill} onOpen={handleOpen} />
            ))}
          </div>
        </div>
      ))}
      <SkillExperiencesModal
        skill={activeSkill}
        onClose={() => setActiveSkill(null)}
        onExperienceClick={handleExperienceClick}
      />
    </section>
  );
};
```

- [ ] **Step 4: Run the Skills test to verify it passes**

Run: `pnpm test:run src/cv/sections/Skills/__tests__/Skills.test.tsx`
Expected: PASS (original card/category/dots tests + the two new tests).

- [ ] **Step 5: Type-check**

Run: `pnpm tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/cv/sections/Skills/Skills.tsx src/cv/sections/Skills/__tests__/Skills.test.tsx
git commit -m "feat(cv): open the experiences dialog from skill cards"
```

---

### Task 10: Document the interaction in the CV README

**Files:**
- Modify: `src/cv/README.md`

- [ ] **Step 1: Add a short section**

Add a subsection to `src/cv/README.md` describing the feature, e.g.:

> ### Skill → experiences
> Each skill declares `aliases` (the exact `technologies[]` strings that represent it). `experiencesForSkill` (`sections/Skills/matching.ts`) maps a skill to the jobs that used it. Clicking a skill card opens `SkillExperiencesModal`; clicking a job there closes it and calls `scrollToWorkEntry` (`sections/Work/anchors.ts`), which smooth-scrolls to the entry's anchor (`workEntryAnchorId`) and flashes it (`.cv-flash`, in `src/app/globals.css`) — both gated behind `prefers-reduced-motion`. To add a skill, include its `aliases` so it links to the right jobs. Analytics: `skill_experiences_opened` and `skill_experience_clicked`.

- [ ] **Step 2: Commit**

```bash
git add src/cv/README.md
git commit -m "docs(cv): document the skill-to-experiences interaction"
```

---

### Task 11: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `pnpm test:run`
Expected: all tests pass (the prior 62 plus the new matching/anchors/modal/skills/events tests).

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: clean (no errors; if Biome auto-fixes formatting, re-stage and amend only if the fix is on already-committed files — otherwise commit the fix as `chore: biome formatting`).

- [ ] **Step 3: Type-check**

Run: `pnpm tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Production build**

Run: `pnpm build`
Expected: `✓ Compiled successfully`; `/cv` listed as a static route.

- [ ] **Step 5: Manual smoke check (human, not automated)**

Run `pnpm dev`, open `http://localhost:3000/cv`, then:
1. Click a skill card (e.g. JavaScript) → dialog opens titled "Where I used JavaScript", listing jobs (company · role · dates).
2. Click a job (e.g. Pinterest) → dialog closes, page scrolls to that work entry, entry briefly flashes.
3. With OS "reduce motion" enabled, repeat step 2 → instant jump, no flash.
4. In the browser network tab, confirm `POST /ingest/...` for `skill_experiences_opened` (on open) and `skill_experience_clicked` (on job click).

---

## Self-review (completed during planning)

**Spec coverage:** aliases model → Task 1; matching → Task 2; anchors → Tasks 3–4; scroll+flash → Tasks 5–6; modal → Task 8; card affordance + wiring → Task 9; analytics → Task 7; docs → Tasks 7 & 10. All spec sections map to a task.

**Placeholder scan:** every code step contains complete code; no TBD/TODO.

**Type consistency:** `experiencesForSkill(skill, entries)`, `workEntryAnchorId(entry)`, `scrollToWorkEntry(entry)`, `SkillExperiencesModal` props `{ skill, onClose, onExperienceClick }`, and event signatures `{ skill }` / `{ skill, company }` are used identically across the tasks that define and consume them. The `Skill.aliases: string[]` field added in Task 1 is what Tasks 2 and 8 read.

**Note on the empty-card branch:** with the current data every skill resolves to ≥1 job (verified by Task 2's coverage test), so the non-interactive `<div>` branch in Task 9 is defensive and not directly asserted via `Skills`; the empty-state UI itself is covered by Task 8's modal test.
