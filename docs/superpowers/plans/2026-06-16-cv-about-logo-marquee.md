# CV About Company Logo Marquee Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Mantine `Marquee` row of all 16 company logos below the About paragraphs; clicking a logo scrolls to and expands the matching work-experience accordion entry.

**Architecture:** Upgrade `@mantine/*` to v9 for `Marquee`. New client component `CompanyLogoMarquee` in `src/cv/sections/About/` maps `RESUME.workExperience` to clickable logo buttons reusing `CompanyLogo` and `scrollToWorkEntry`. Reduced-motion users get a static wrapped row via `useMediaQuery`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Mantine v9 (`Marquee`), Vitest, Tailwind v4, Biome.

**Spec:** [`docs/superpowers/specs/2026-06-16-cv-about-logo-marquee-design.md`](../specs/2026-06-16-cv-about-logo-marquee-design.md)

---

## File map

| File | Responsibility |
| --- | --- |
| `package.json` / `pnpm-lock.yaml` | Bump `@mantine/core`, `@mantine/hooks`, `@mantine/modals`, `@mantine/notifications` to v9 |
| `src/cv/sections/About/CompanyLogoMarquee.tsx` | Marquee + logo buttons + reduced-motion fallback |
| `src/cv/sections/About/About.tsx` | Render `<CompanyLogoMarquee />` after paragraphs |
| `src/cv/sections/About/__tests__/CompanyLogoMarquee.test.tsx` | Unit tests for marquee component |
| `src/cv/sections/About/__tests__/About.test.tsx` | Integration: marquee present in About |
| `src/cv/README.md` | Document marquee behavior and Mantine v9 note |

Reused unchanged: `company-logos.ts`, `CompanyLogo.tsx`, `anchors.ts`.

---

### Task 1: Feature branch

**Files:** (none — git only)

- [ ] **Step 1: Confirm branch**

```bash
git checkout feat/cv-about-logo-marquee
```

Expected: already on `feat/cv-about-logo-marquee` (spec commit from brainstorming). If on `main`, create the branch first:

```bash
git checkout -b feat/cv-about-logo-marquee
```

---

### Task 2: Upgrade Mantine to v9

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

`Marquee` is v9-only. Bump all Mantine packages together to avoid peer mismatch.

- [ ] **Step 1: Upgrade packages**

```bash
pnpm add @mantine/core@^9 @mantine/hooks@^9 @mantine/modals@^9 @mantine/notifications@^9
```

- [ ] **Step 2: Verify `Marquee` export exists**

```bash
node -e "const { Marquee } = require('@mantine/core'); console.log(typeof Marquee)"
```

Expected: `function`

- [ ] **Step 3: Run full suite to catch breaking changes**

```bash
pnpm lint && pnpm test:run
```

Expected: PASS (fix any Mantine v9 API regressions in Modal/Tooltip/Notifications if they appear — inspect compiler/test output).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): upgrade Mantine packages to v9 for Marquee support"
```

---

### Task 3: `CompanyLogoMarquee` component (TDD)

**Files:**
- Create: `src/cv/sections/About/__tests__/CompanyLogoMarquee.test.tsx`
- Create: `src/cv/sections/About/CompanyLogoMarquee.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/cv/sections/About/__tests__/CompanyLogoMarquee.test.tsx`:

```tsx
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RESUME } from "@/cv/data";
import { scrollToWorkEntry } from "@/cv/sections/Work/anchors";
import { renderWithProviders, screen } from "@/test/render";

import { CompanyLogoMarquee } from "../CompanyLogoMarquee";

vi.mock("@/cv/sections/Work/anchors", () => ({
  scrollToWorkEntry: vi.fn(),
}));

const mockUseMediaQuery = vi.fn();

vi.mock("@mantine/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mantine/hooks")>();
  return {
    ...actual,
    useMediaQuery: (...args: unknown[]) => mockUseMediaQuery(...args),
  };
});

describe("CompanyLogoMarquee", () => {
  beforeEach(() => {
    mockUseMediaQuery.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders one button per work experience with accessible labels", () => {
    renderWithProviders(<CompanyLogoMarquee />);

    const buttons = screen.getAllByRole("button", {
      name: /view .+ experience/i,
    });
    expect(buttons).toHaveLength(RESUME.workExperience.length);

    for (const entry of RESUME.workExperience) {
      expect(
        screen.getByRole("button", {
          name: `View ${entry.company} experience`,
        }),
      ).toBeInTheDocument();
    }
  });

  it("renders animated marquee when motion is allowed", () => {
    renderWithProviders(<CompanyLogoMarquee />);
    expect(screen.getByTestId("company-logo-marquee")).toBeInTheDocument();
    expect(screen.queryByTestId("company-logo-static")).not.toBeInTheDocument();
  });

  it("renders static wrapped row when reduced motion is preferred", () => {
    mockUseMediaQuery.mockReturnValue(true);
    renderWithProviders(<CompanyLogoMarquee />);
    expect(screen.getByTestId("company-logo-static")).toBeInTheDocument();
    expect(screen.queryByTestId("company-logo-marquee")).not.toBeInTheDocument();
  });

  it("calls scrollToWorkEntry with the matching entry on logo click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanyLogoMarquee />);

    const target = RESUME.workExperience[0];
    await user.click(
      screen.getByRole("button", {
        name: `View ${target.company} experience`,
      }),
    );

    expect(scrollToWorkEntry).toHaveBeenCalledTimes(1);
    expect(scrollToWorkEntry).toHaveBeenCalledWith(target);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test:run src/cv/sections/About/__tests__/CompanyLogoMarquee.test.tsx
```

Expected: FAIL — module `../CompanyLogoMarquee` not found.

- [ ] **Step 3: Implement `CompanyLogoMarquee`**

Create `src/cv/sections/About/CompanyLogoMarquee.tsx`:

```tsx
"use client";

import { Marquee } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

import { RESUME } from "@/cv/data";
import type { WorkExperience } from "@/cv/types";
import { CompanyLogo } from "@/cv/sections/Work/CompanyLogo";
import { scrollToWorkEntry } from "@/cv/sections/Work/anchors";

const MARQUEE_LOGO_CLASS = "w-10 h-10";

const LogoButton = ({ entry }: { entry: WorkExperience }) => (
  <button
    type="button"
    aria-label={`View ${entry.company} experience`}
    onClick={() => scrollToWorkEntry(entry)}
    className="flex shrink-0 items-center justify-center rounded-md p-1 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3c78d8]"
  >
    <CompanyLogo company={entry.company} className={MARQUEE_LOGO_CLASS} />
  </button>
);

export const CompanyLogoMarquee = () => {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const buttons = RESUME.workExperience.map((entry) => (
    <LogoButton
      key={`${entry.company}-${entry.startDate}`}
      entry={entry}
    />
  ));

  if (reduceMotion) {
    return (
      <div
        data-testid="company-logo-static"
        className="mt-6 flex flex-wrap justify-center gap-4"
      >
        {buttons}
      </div>
    );
  }

  return (
    <div className="mt-6" data-testid="company-logo-marquee">
      <Marquee gap="lg" pauseOnHover fadeEdges fadeEdgeColor="white">
        {buttons}
      </Marquee>
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test:run src/cv/sections/About/__tests__/CompanyLogoMarquee.test.tsx
```

Expected: PASS (all 4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/About/CompanyLogoMarquee.tsx src/cv/sections/About/__tests__/CompanyLogoMarquee.test.tsx
git commit -m "feat(cv): add clickable company logo marquee for About section"
```

---

### Task 4: Wire marquee into About section

**Files:**
- Modify: `src/cv/sections/About/About.tsx`
- Modify: `src/cv/sections/About/__tests__/About.test.tsx`

- [ ] **Step 1: Write the failing integration test**

Add to `src/cv/sections/About/__tests__/About.test.tsx`:

```tsx
it("renders company logo marquee below about paragraphs", () => {
  renderWithProviders(<About />);
  expect(
    screen.getByTestId("company-logo-marquee"),
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole("button", { name: /view .+ experience/i }),
  ).toHaveLength(RESUME.workExperience.length);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:run src/cv/sections/About/__tests__/About.test.tsx
```

Expected: FAIL — `company-logo-marquee` not found.

- [ ] **Step 3: Render marquee in About**

Update `src/cv/sections/About/About.tsx`:

```tsx
import { RESUME } from "@/cv/data";

import { CompanyLogoMarquee } from "./CompanyLogoMarquee";

export const About = () => (
  <section id="about" className="flex flex-col gap-3">
    <h2 className="text-xl font-domine text-[#2d2a24] tracking-tight">About</h2>
    {RESUME.about.map((paragraph) => (
      <p
        key={paragraph}
        className="text-sm font-quicksand text-[#6d6964] leading-relaxed"
      >
        {paragraph}
      </p>
    ))}
    <CompanyLogoMarquee />
  </section>
);
```

- [ ] **Step 4: Run About tests**

```bash
pnpm test:run src/cv/sections/About/__tests__/About.test.tsx
```

Expected: PASS (all About tests).

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/About/About.tsx src/cv/sections/About/__tests__/About.test.tsx
git commit -m "feat(cv): render company logo marquee in About section"
```

---

### Task 5: Update CV domain README

**Files:**
- Modify: `src/cv/README.md`

- [ ] **Step 1: Document marquee**

Add a subsection under **Files** (or after **Company logos**) in `src/cv/README.md`:

```markdown
## About company logo marquee

`sections/About/CompanyLogoMarquee.tsx` renders all `RESUME.workExperience` company logos in a Mantine `Marquee` directly below the About paragraphs.

- **Assets:** `companyLogoSrc()` → `public/cv/companies/*` (same mapping as Work cards).
- **Click:** each logo is a button calling `scrollToWorkEntry(entry)` — smooth scroll, accordion expand (`cv:open-work-entry`), and `.cv-flash` highlight (gated by `prefers-reduced-motion`).
- **Reduced motion:** static `flex-wrap` row (`data-testid="company-logo-static"`) instead of animated marquee.
- **Dependency:** requires Mantine v9+ (`Marquee` is not in Mantine 8).
```

Also add `CompanyLogoMarquee.tsx` to the Files table row for About.

- [ ] **Step 2: Commit**

```bash
git add src/cv/README.md
git commit -m "docs(cv): document About company logo marquee"
```

---

### Task 6: Final verification

**Files:** (none — verification only)

- [ ] **Step 1: Run full test suite**

```bash
pnpm lint && pnpm test:run
```

Expected: all tests PASS, no Biome errors.

- [ ] **Step 2: Manual smoke test**

```bash
pnpm dev
```

Open `http://localhost:3000/cv` and verify:

1. Marquee appears below the three About paragraphs, above the Work section divider.
2. Logos scroll horizontally with edge fade; animation pauses on hover.
3. Click Pinterest (or any logo) → page scrolls to Work, accordion expands, card flashes.
4. With `prefers-reduced-motion: reduce` (OS setting or DevTools emulation) → static wrapped logo row, no animation.
5. Dock Modal/Tooltip and landing-page Modal still work after Mantine v9 upgrade.

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Mantine v9 upgrade for `Marquee` | Task 2 |
| All 16 logos from `companyLogoSrc` | Task 3 |
| Data order (most recent first) | Task 3 (`RESUME.workExperience` map) |
| Placement below About paragraphs | Task 4 |
| Click → `scrollToWorkEntry` (scroll + expand + flash) | Task 3 |
| `pauseOnHover`, `fadeEdges`, `gap="lg"` | Task 3 |
| Reduced-motion static row | Task 3 |
| `aria-label` per logo | Task 3 |
| Unit tests for marquee | Task 3 |
| About integration test | Task 4 |
| README update | Task 5 |
| No `data.ts` changes | (omitted intentionally) |
| No analytics / external URLs | (omitted intentionally) |

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-16-cv-about-logo-marquee.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
