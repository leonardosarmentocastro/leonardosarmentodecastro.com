# CV Work Experience — Timeline + Accordion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the CV Work Experience section to display entries on a Mantine Timeline with collapsible Accordion panels and company logos, preserving all existing anchor/deep-link behavior.

**Architecture:** Each work entry becomes a `Timeline.Item` whose `bullet` prop contains a `CompanyLogo` circle, and whose body contains a controlled `Accordion` with a single panel. The `Work` component owns `openValue: string | null` state shared across all per-entry Accordions so only one can be open at a time. Auto-expand on deep-link is wired via a `cv:open-work-entry` custom DOM event dispatched by `scrollToWorkEntry` and consumed by a `useEffect` in `Work`.

**Tech Stack:** Next.js 15, React 19, TypeScript strict, Mantine 8 (`Timeline`, `Accordion`), `next/image`, Tailwind CSS, Vitest + Testing Library, pnpm, Biome.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/cv/sections/Work/company-logos.ts` | **Create** | `COMPANY_LOGOS` lookup table mapping company name → logo path |
| `src/cv/sections/Work/CompanyLogo.tsx` | **Create** | Fixed-size logo circle; `next/image` with initials fallback |
| `src/cv/sections/Work/__tests__/CompanyLogo.test.tsx` | **Create** | Unit tests for CompanyLogo (happy path, missing key, error) |
| `src/cv/sections/Work/anchors.ts` | **Modify** | Add `CustomEvent` dispatch to `scrollToWorkEntry` |
| `src/cv/sections/Work/__tests__/anchors.test.ts` | **Modify** | Add test asserting CustomEvent is dispatched |
| `src/cv/sections/Work/Work.tsx` | **Rewrite** | Timeline + Accordion layout, `openValue` state, event listener |
| `src/cv/sections/Work/__tests__/Work.test.tsx` | **Modify** | Update anchor assertion; add auto-expand test |

---

## Anchor ID Note

Mantine 8's `AccordionControl` assigns its own internal `id` via `ctx.getControlId(value)` — any `id` prop passed to `Accordion.Control` is overridden. The DOM anchor (`id={workEntryAnchorId(entry)}`) therefore lives on the **wrapper `<div>`** that contains the Accordion, alongside `data-testid` and `scroll-mt-24`. This keeps the existing anchor test assertion (`expect(card).toHaveAttribute("id", ...)`) passing with **zero changes** to that test.

---

## Task 1: Create the COMPANY_LOGOS lookup table

**Files:**
- Create: `src/cv/sections/Work/company-logos.ts`

This is pure data with no logic — no test needed.

- [ ] **Step 1: Create company-logos.ts**

```ts
export const COMPANY_LOGOS: Record<string, string> = {
  Pinterest: "/cv/companies/pinterest.png",
  "Blue Yonder": "/cv/companies/blue-yonder.png",
  Hrizn: "/cv/companies/hrizn.png",
  PairTree: "/cv/companies/pairtree.png",
  PureCars: "/cv/companies/purecars.png",
  "Radical Imaging": "/cv/companies/radical-imaging.png",
  Écolheita: "/cv/companies/ecolheita.png",
  "Quero Educação": "/cv/companies/quero-educacao.png",
  "Spark Networks": "/cv/companies/spark-networks.png",
  "Daitan Group": "/cv/companies/daitan-group.png",
  Dextra: "/cv/companies/dextra.png",
  Coyô: "/cv/companies/coyo.png",
  "CI&T": "/cv/companies/ciandt.png",
  ACTi: "/cv/companies/acti.png",
  VPSA: "/cv/companies/vpsa.png",
  Dash: "/cv/companies/dash.png",
};
```

- [ ] **Step 2: Commit**

```bash
git add src/cv/sections/Work/company-logos.ts
git commit -m "feat(cv): add COMPANY_LOGOS lookup table"
```

---

## Task 2: TDD CompanyLogo — renders logo for a known company

**Files:**
- Create: `src/cv/sections/Work/__tests__/CompanyLogo.test.tsx`
- Create: `src/cv/sections/Work/CompanyLogo.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/cv/sections/Work/__tests__/CompanyLogo.test.tsx
import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/render";
import { CompanyLogo } from "../CompanyLogo";

describe("CompanyLogo", () => {
  it("renders an img with the correct src for a known company", () => {
    renderWithProviders(<CompanyLogo company="Pinterest" />);
    const img = screen.getByRole("img", { name: "Pinterest" });
    expect(img).toHaveAttribute("src", expect.stringContaining("/cv/companies/pinterest.png"));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test src/cv/sections/Work/__tests__/CompanyLogo.test.tsx
```

Expected: FAIL — `CompanyLogo` module not found.

- [ ] **Step 3: Implement CompanyLogo (happy path only)**

```tsx
// src/cv/sections/Work/CompanyLogo.tsx
"use client";

import Image from "next/image";
import { useState } from "react";

import { COMPANY_LOGOS } from "./company-logos";

const getInitials = (company: string): string =>
  company
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

type Props = { company: string };

export const CompanyLogo = ({ company }: Props) => {
  const [hasError, setHasError] = useState(false);
  const src = COMPANY_LOGOS[company];

  if (!src || hasError) {
    return (
      <div
        aria-label={company}
        className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 text-[9px] font-semibold select-none"
      >
        {getInitials(company)}
      </div>
    );
  }

  return (
    <Image
      src={src}
      width={24}
      height={24}
      alt={company}
      className="rounded-full"
      onError={() => setHasError(true)}
    />
  );
};
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm test src/cv/sections/Work/__tests__/CompanyLogo.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/CompanyLogo.tsx src/cv/sections/Work/__tests__/CompanyLogo.test.tsx
git commit -m "feat(cv): add CompanyLogo component (happy path)"
```

---

## Task 3: TDD CompanyLogo — initials fallback for unknown company

**Files:**
- Modify: `src/cv/sections/Work/__tests__/CompanyLogo.test.tsx`

- [ ] **Step 1: Add the failing test**

Add inside the existing `describe("CompanyLogo")` block:

```tsx
it("renders initials when the company has no entry in COMPANY_LOGOS", () => {
  renderWithProviders(<CompanyLogo company="Unknown Corp" />);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByText("UC")).toBeInTheDocument();
});

it("renders a single initial for single-word company names", () => {
  renderWithProviders(<CompanyLogo company="Pinterest" />);
  // Pinterest IS in the lookup — need a company not in the map
  renderWithProviders(<CompanyLogo company="Acme" />);
  expect(screen.getByText("A")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify the new tests fail**

```bash
pnpm test src/cv/sections/Work/__tests__/CompanyLogo.test.tsx
```

Expected: the two new tests FAIL — "Unknown Corp" has no entry so the existing code shows an img pointing to `undefined`.

Wait — looking at the current implementation: `if (!src || hasError)` already handles `src === undefined`. So these tests may already pass. Run to verify:

```bash
pnpm test src/cv/sections/Work/__tests__/CompanyLogo.test.tsx
```

If all pass: the implementation was already correct — proceed to commit. If any fail: debug the `getInitials` logic and the conditional.

- [ ] **Step 3: Commit**

```bash
git add src/cv/sections/Work/__tests__/CompanyLogo.test.tsx
git commit -m "test(cv): add CompanyLogo initials fallback tests"
```

---

## Task 4: TDD CompanyLogo — initials fallback on image load error

**Files:**
- Modify: `src/cv/sections/Work/__tests__/CompanyLogo.test.tsx`

- [ ] **Step 1: Add the failing test**

Add inside the existing `describe("CompanyLogo")` block:

```tsx
it("renders initials when the image fails to load", () => {
  renderWithProviders(<CompanyLogo company="Pinterest" />);
  const img = screen.getByRole("img", { name: "Pinterest" });
  // Simulate image load failure
  fireEvent.error(img);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByText("P")).toBeInTheDocument();
});
```

Add `fireEvent` to the import:

```tsx
import { renderWithProviders, screen, fireEvent } from "@/test/render";
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test src/cv/sections/Work/__tests__/CompanyLogo.test.tsx
```

Expected: FAIL — after `fireEvent.error`, the img is still in the DOM (hasError state not yet implemented for this trigger path).

Actually, the `onError={() => setHasError(true)}` is already in the implementation from Task 2. Run the test — if it already passes, the implementation was complete. If it fails, the `onError` prop on `next/image` may not be firing in jsdom. In that case, add a wrapping handler:

```tsx
// If onError on next/image doesn't fire in jsdom, wrap it
<Image
  src={src}
  width={24}
  height={24}
  alt={company}
  className="rounded-full"
  onError={() => setHasError(true)}
/>
```

`next/image` in jsdom renders as a plain `<img>` and its `onError` prop maps to the img's `onerror` event, so `fireEvent.error(img)` should trigger it.

- [ ] **Step 3: Run to verify all tests pass**

```bash
pnpm test src/cv/sections/Work/__tests__/CompanyLogo.test.tsx
```

Expected: all 4 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/cv/sections/Work/__tests__/CompanyLogo.test.tsx
git commit -m "test(cv): add CompanyLogo image error fallback test"
```

---

## Task 5: TDD anchors — dispatch cv:open-work-entry after scroll

**Files:**
- Modify: `src/cv/sections/Work/__tests__/anchors.test.ts`
- Modify: `src/cv/sections/Work/anchors.ts`

- [ ] **Step 1: Add the failing test**

Add inside the existing `describe("scrollToWorkEntry")` block in `anchors.test.ts`:

```ts
it("dispatches a cv:open-work-entry CustomEvent with the anchor id as detail", () => {
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

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test src/cv/sections/Work/__tests__/anchors.test.ts
```

Expected: FAIL — `received` is `[]` (no event dispatched yet).

- [ ] **Step 3: Add the CustomEvent dispatch to scrollToWorkEntry**

In `src/cv/sections/Work/anchors.ts`, update `scrollToWorkEntry` — add the dispatch call after the existing scroll + flash logic:

```ts
export const scrollToWorkEntry = (entry: WorkExperience): void => {
  const el = document.getElementById(workEntryAnchorId(entry));
  if (!el) return;

  const motionOk = window.matchMedia(
    "(prefers-reduced-motion: no-preference)",
  ).matches;

  el.scrollIntoView({ behavior: motionOk ? "smooth" : "auto", block: "start" });
  if (motionOk) {
    el.classList.add("cv-flash");
    el.addEventListener("animationend", () => el.classList.remove("cv-flash"), {
      once: true,
    });
  }

  document.dispatchEvent(
    new CustomEvent("cv:open-work-entry", { detail: workEntryAnchorId(entry) }),
  );
};
```

- [ ] **Step 4: Run all anchor tests to verify they pass**

```bash
pnpm test src/cv/sections/Work/__tests__/anchors.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/anchors.ts src/cv/sections/Work/__tests__/anchors.test.ts
git commit -m "feat(cv): dispatch cv:open-work-entry event from scrollToWorkEntry"
```

---

## Task 6: TDD Work — rewrite Work.tsx with Timeline + Accordion

**Files:**
- Modify: `src/cv/sections/Work/__tests__/Work.test.tsx`
- Rewrite: `src/cv/sections/Work/Work.tsx`

First update the test that will need structural change (the auto-expand test is added in Task 7). The other existing tests require **no changes** because:

- Company names: still in the DOM (in `Accordion.Control` header)
- Role, dates, description, bullets, tech: Mantine renders the `Accordion.Panel` in the DOM even when collapsed (visibility is CSS-only)
- Milestone text: still in the DOM (inside `Timeline.Item` body)
- Anchor test: wrapper `<div>` still has both `id` and `data-testid` — assertion unchanged

- [ ] **Step 1: Run the existing Work tests to confirm they currently pass**

```bash
pnpm test src/cv/sections/Work/__tests__/Work.test.tsx
```

Expected: all 6 tests PASS (baseline).

- [ ] **Step 2: Rewrite Work.tsx**

Replace the entire contents of `src/cv/sections/Work/Work.tsx`:

```tsx
"use client";

import { Accordion, Badge, Timeline } from "@mantine/core";
import { useEffect, useState } from "react";

import { RESUME } from "@/cv/data";
import { TechIcon } from "@/cv/TechIcon";
import type { Milestone, WorkExperience } from "@/cv/types";

import { workEntryAnchorId } from "./anchors";
import { CompanyLogo } from "./CompanyLogo";

const parseStartYear = (startDate: string): number => {
  const match = startDate.match(/\d{4}/);
  if (!match) throw new Error(`Cannot parse year from startDate: ${startDate}`);
  return Number(match[0]);
};

const interleave = (
  entries: ReadonlyArray<WorkExperience>,
  milestones: ReadonlyArray<Milestone>,
): Array<
  | { kind: "work"; entry: WorkExperience }
  | { kind: "milestone"; milestone: Milestone }
> => {
  const result: Array<
    | { kind: "work"; entry: WorkExperience }
    | { kind: "milestone"; milestone: Milestone }
  > = [];
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

const MilestoneDot = () => (
  <div className="w-2 h-2 rounded-full bg-neutral-300" />
);

type WorkEntryProps = {
  entry: WorkExperience;
  openValue: string | null;
  setOpenValue: (val: string | null) => void;
};

const WorkEntry = ({ entry, openValue, setOpenValue }: WorkEntryProps) => {
  const anchorId = workEntryAnchorId(entry);

  return (
    <div
      id={anchorId}
      data-testid={`work-entry-${entry.company}`}
      className="scroll-mt-24"
    >
      <Accordion
        value={openValue === anchorId ? anchorId : null}
        onChange={(val) => setOpenValue(val)}
      >
        <Accordion.Item value={anchorId}>
          <Accordion.Control>
            <div className="flex flex-row justify-between items-baseline gap-4 flex-wrap">
              <span className="text-base font-semibold">{entry.company}</span>
              <span className="text-xs text-neutral-500 whitespace-nowrap">
                {entry.startDate} — {entry.endDate}
              </span>
            </div>
            <p className="text-sm text-neutral-700 mt-1">
              {entry.role}
              {entry.via ? (
                <span className="text-neutral-500"> · {entry.via}</span>
              ) : null}
              <span className="text-neutral-500"> · {entry.workMode}</span>
              {entry.location ? (
                <span className="text-neutral-500"> · {entry.location}</span>
              ) : null}
            </p>
          </Accordion.Control>
          <Accordion.Panel>
            <p className="text-sm text-neutral-600">{entry.description}</p>
            <ul className="list-disc list-outside ml-5 text-sm text-neutral-700 space-y-1 mt-2">
              {entry.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="text-xs text-neutral-600 mt-3">
              <span className="font-semibold">Technologies: </span>
              <br className="mb-2" />
              <span className="inline-flex flex-wrap gap-2 align-middle">
                {entry.technologies.map((t) => (
                  <Badge
                    key={t}
                    size="md"
                    color="gray"
                    variant="light"
                    className="!p-3"
                  >
                    <span className="inline-flex items-center gap-2">
                      <TechIcon alias={t} size={14} />
                      {t}
                    </span>
                  </Badge>
                ))}
              </span>
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
};

export const Work = () => {
  const [openValue, setOpenValue] = useState<string | null>(null);
  const items = interleave(RESUME.workExperience, RESUME.milestones);

  useEffect(() => {
    const handler = (e: Event) => {
      setOpenValue((e as CustomEvent<string>).detail);
    };
    document.addEventListener("cv:open-work-entry", handler);
    return () => document.removeEventListener("cv:open-work-entry", handler);
  }, []);

  return (
    <section id="work" className="flex flex-col gap-8">
      <h2 className="text-xl font-semibold tracking-tight">Work Experience</h2>
      <Timeline>
        {items.map((item, i) =>
          item.kind === "work" ? (
            <Timeline.Item
              key={`${item.entry.company}-${item.entry.startDate}`}
              bullet={<CompanyLogo company={item.entry.company} />}
            >
              <WorkEntry
                entry={item.entry}
                openValue={openValue}
                setOpenValue={setOpenValue}
              />
            </Timeline.Item>
          ) : (
            <Timeline.Item
              key={`${item.milestone.year}-${i}`}
              bullet={<MilestoneDot />}
            >
              <p className="text-xs italic text-neutral-400">
                {item.milestone.text}
              </p>
            </Timeline.Item>
          ),
        )}
      </Timeline>
    </section>
  );
};
```

- [ ] **Step 3: Run the full Work test suite**

```bash
pnpm test src/cv/sections/Work/__tests__/Work.test.tsx
```

Expected: all 6 existing tests PASS.

If the test `"renders the first work entry's role, date range, description, and at least one bullet/tech"` fails because Accordion panel content is not in the DOM when collapsed — Mantine 8 renders panel content eagerly (not lazy). Confirm this is the case by running the tests. If Mantine lazily renders panels, update the test to open the accordion first:

```tsx
// Only needed if Mantine 8 lazily renders Accordion.Panel
import { act } from "@/test/render";

it("renders the first work entry's role, date range, description, and at least one bullet/tech", () => {
  renderWithProviders(<Work />);
  const first = RESUME.workExperience[0];
  const anchorId = workEntryAnchorId(first);

  // open the accordion panel first
  act(() => {
    document.dispatchEvent(
      new CustomEvent("cv:open-work-entry", { detail: anchorId }),
    );
  });

  const card = screen.getByTestId(`work-entry-${first.company}`);
  expect(within(card).getByText(first.role)).toBeInTheDocument();
  expect(
    within(card).getByText(
      new RegExp(`${first.startDate}.*${first.endDate}`),
    ),
  ).toBeInTheDocument();
  expect(within(card).getByText(first.description)).toBeInTheDocument();
  expect(within(card).getByText(first.bullets[0])).toBeInTheDocument();
  expect(within(card).getByText(first.technologies[0])).toBeInTheDocument();
});
```

Also add these imports at the top of the test file if not already present:

```tsx
import { act, renderWithProviders, screen, within } from "@/test/render";
import { workEntryAnchorId } from "../anchors";
```

- [ ] **Step 4: Run the full test suite to check for regressions**

```bash
pnpm test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/Work.tsx src/cv/sections/Work/__tests__/Work.test.tsx
git commit -m "feat(cv): rewrite Work section with Mantine Timeline and Accordion"
```

---

## Task 7: TDD Work — auto-expand on cv:open-work-entry event

**Files:**
- Modify: `src/cv/sections/Work/__tests__/Work.test.tsx`

- [ ] **Step 1: Add the failing test**

Add inside the existing `describe("Work")` block:

```tsx
it("opens the matching accordion when cv:open-work-entry is dispatched", () => {
  renderWithProviders(<Work />);
  const first = RESUME.workExperience[0];
  const anchorId = workEntryAnchorId(first);
  const card = screen.getByTestId(`work-entry-${first.company}`);
  const button = within(card).getByRole("button");

  expect(button).toHaveAttribute("aria-expanded", "false");

  act(() => {
    document.dispatchEvent(
      new CustomEvent("cv:open-work-entry", { detail: anchorId }),
    );
  });

  expect(button).toHaveAttribute("aria-expanded", "true");
});
```

Ensure these imports are at the top of the file:

```tsx
import { act, renderWithProviders, screen, within } from "@/test/render";
import { workEntryAnchorId } from "../anchors";
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test src/cv/sections/Work/__tests__/Work.test.tsx --reporter=verbose
```

Expected: the new test FAILS — if `Work.tsx` was already implemented with the `useEffect` listener in Task 6, this test should actually PASS immediately (the listener was implemented together with the rewrite). If it passes, the implementation was complete — proceed to commit.

If it fails, the `useEffect` in `Work.tsx` is missing. Verify that `Work.tsx` contains:

```tsx
useEffect(() => {
  const handler = (e: Event) => {
    setOpenValue((e as CustomEvent<string>).detail);
  };
  document.addEventListener("cv:open-work-entry", handler);
  return () => document.removeEventListener("cv:open-work-entry", handler);
}, []);
```

- [ ] **Step 3: Run the full Work test suite**

```bash
pnpm test src/cv/sections/Work/__tests__/Work.test.tsx
```

Expected: all 7 tests PASS.

- [ ] **Step 4: Run the full test suite**

```bash
pnpm test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/__tests__/Work.test.tsx
git commit -m "test(cv): assert accordion auto-expands on cv:open-work-entry event"
```

---

## Self-Review Checklist

**Spec coverage:**

| Spec requirement | Covered by |
|---|---|
| Vertical Mantine Timeline, most-recent-first with milestones interleaved | Task 6 — `Timeline` + unchanged `interleave()` |
| Company logo alongside each entry (Timeline bullet) | Task 6 — `CompanyLogo` in `bullet` prop |
| Logo assets in `/cv/companies/` | Task 1 — paths in `COMPANY_LOGOS` |
| Accordion panel collapsed by default | Task 6 — `openValue` starts as `null` |
| Expanding one entry doesn't hide others | Task 6 — per-entry controlled Accordion |
| Existing anchor IDs preserved | Task 6 — wrapper div keeps `id={anchorId}` |
| Deep-link scroll + flash preserved | Task 5 — `scrollToWorkEntry` unchanged except for event dispatch |
| Auto-expand on deep-link nav | Task 5 (event dispatch) + Task 6 (listener) + Task 7 (test) |
| Test identifiers (`data-testid`) remain discoverable | Task 6 — wrapper div keeps `data-testid` |
| Missing logo → initials fallback | Task 3 — `!src` branch in `CompanyLogo` |
| Image load error → initials fallback | Task 4 — `hasError` state + `onError` handler |
| Milestones remain visible and subordinate | Task 6 — `MilestoneDot` + italic text |
| Keyboard/a11y: Mantine Accordion ships ARIA by default | covered by Mantine — no additional work needed |

**No placeholders:** All steps contain complete code.

**Type consistency:** `workEntryAnchorId` used consistently across `anchors.ts`, `Work.tsx`, and tests. `openValue: string | null` type matches Mantine Accordion's `value` prop type. `CustomEvent<string>` used consistently in dispatch and listener.
