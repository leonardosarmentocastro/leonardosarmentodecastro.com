# CV Web PDF Export + Format Dialogs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/cv` the canonical CV, exportable as a faithful, de-animated A4 PDF (a committed static asset that replaces the Google Drive recruiter PDF), and upgrade the resume dialogs to offer recruiter-PDF / ATS-PDF / web-version choices.

**Architecture:** A dedicated `/cv/print` route renders a print-mode variant of the existing CV sections (hero icons hidden, single-left-spine expanded Work timeline, static 5-logo marquee, non-interactive Skills, no interactive "Get in Touch", plus a print-only Contact card section). A local `pnpm cv:pdf` script drives headless Chrome over that route to produce `public/cv/Leonardo-Sarmento-de-Castro-Resume.pdf`, guarded by a content-hash freshness test. `ResumeOptionsModal` is generalized to a configurable option list used in two configurations.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript (strict), Mantine 8, GSAP (screen only), Tailwind v4, Vitest + Testing Library, Biome, pnpm, `puppeteer` (new devDependency for PDF generation).

## Global Constraints

- **Package manager: pnpm only.** Never `npm`/`yarn`. (`packageManager: pnpm@8.6.1`.)
- **Linter/formatter: Biome** (`pnpm lint`, `pnpm format`). No ESLint/Prettier.
- **Path alias:** `@/*` → `src/*`.
- **Never commit to `main`.** All work on branch `feat/cv-web-pdf-export` (already created). Merge only after review — every push to `main` triggers a Vercel production deploy.
- **TDD, atomic commits.** Red → green → refactor; one concern per commit; suite green after every task.
- **Domain-first structure.** New code under `src/cv/` (and `src/app/cv/` for routes). Colocate tests in `__tests__/`. No `src/lib`/`utils`/`services` folders.
- **Brand palette:** print layout uses the blue accent `#3c78d8` (`CV_COLORS.accent`); **no red accents in the PDF layout** (the existing red on the landing-page modal buttons is pre-existing UI and stays). Fonts: Domine / Quicksand / Spectral.
- **Commit messages** use Conventional Commit subjects (`feat(cv):`, `refactor(cv):`, etc.) and end with the trailer:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- **Print mode neutralizes animation:** print components must never start at `opacity:0`/GSAP-hidden state (those stay invisible in a static render). Print sections compose **without** the GSAP wrapper that `CVPage` applies.
- **Test runner:** `pnpm vitest run <file>` for a single file; `pnpm test:run` for all.

---

## File Structure

**Create:**
- `src/cv/print/CVPrintPage.tsx` — composes the print-mode sections (no GSAP wrapper).
- `src/cv/print/WorkPrintTimeline.tsx` — static single-left-spine, all-expanded Work timeline.
- `src/cv/print/ContactPrint.tsx` — print-only Contact card section (2×2 grid + site full-width).
- `src/cv/print/pdf-asset.ts` — PDF path constants, `PRINT_LAYOUT_VERSION`, `computeCvPdfContentHash()`.
- `src/app/cv/print/page.tsx` — the `/cv/print` route (noindex) rendering `CVPrintPage`.
- `scripts/cv/generate-pdf.ts` — Puppeteer generation script (writes the PDF + hash).
- Tests under each domain's `__tests__/`.

**Modify:**
- `src/analytics/events.ts` — add `trackResumeAtsClick`.
- `src/cv/ResumeOptionsModal.tsx` — generalize to a configurable option list.
- `src/cv/sections/Hero/Hero.tsx` — `printMode` (hide icons) + `onOpenFormatDialog` (web dialog trigger).
- `src/cv/sections/About/About.tsx` + `src/cv/sections/About/CompanyLogoMarquee.tsx` — print/static + 5-logo limit.
- `src/cv/sections/Skills/Skills.tsx` — `printMode` (non-interactive cards, no modal).
- `src/cv/pages/CVPage/CVPage.tsx` — host the 2-option dialog and wire the Hero trigger.
- `src/components/pages/LandingPage/LandingPage.tsx` — pass the 3-option config.
- `src/cv/data.ts` — `resumePdf` → local asset path.
- `src/app/cv/ats/route.ts` — disambiguate download filename (ATS).
- `package.json` — add `cv:pdf` script + `puppeteer` devDependency.
- `src/cv/README.md` — document the `pnpm cv:pdf` workflow.

---

## Task 1: Analytics — `trackResumeAtsClick`

**Files:**
- Modify: `src/analytics/events.ts`
- Test: `src/analytics/__tests__/events.test.ts` (add a case; create the file only if absent)

**Interfaces:**
- Produces: `trackResumeAtsClick(): void` — captures `resume_ats_clicked` with `{ destination: "ats_pdf" }`.

- [ ] **Step 1: Write the failing test**

Add to `src/analytics/__tests__/events.test.ts` (mirror existing tests in that file; if the file does not exist, create it with this content):

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("posthog-js", () => ({
  default: { capture: vi.fn() },
}));

import posthog from "posthog-js";
import { trackResumeAtsClick } from "@/analytics/events";

afterEach(() => vi.clearAllMocks());

describe("trackResumeAtsClick", () => {
  it("captures resume_ats_clicked with the ats destination", () => {
    trackResumeAtsClick();
    expect(posthog.capture).toHaveBeenCalledWith("resume_ats_clicked", {
      destination: "ats_pdf",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/analytics/__tests__/events.test.ts -t "resume_ats_clicked"`
Expected: FAIL — `trackResumeAtsClick is not a function` / import error.

- [ ] **Step 3: Implement**

In `src/analytics/events.ts`, directly after `trackResumeWebClick`:

```ts
export const trackResumeAtsClick = (): void => {
  posthog.capture("resume_ats_clicked", { destination: "ats_pdf" });
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/analytics/__tests__/events.test.ts -t "resume_ats_clicked"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/analytics/events.ts src/analytics/__tests__/events.test.ts
git commit -m "feat(analytics): add trackResumeAtsClick event"
```

---

## Task 2: Generalize `ResumeOptionsModal` to a configurable option list

**Files:**
- Modify: `src/cv/ResumeOptionsModal.tsx`
- Test: `src/cv/__tests__/ResumeOptionsModal.test.tsx` (rewrite)

**Interfaces:**
- Consumes: `RESUME.hero.links.resumePdf`; `trackResumePdfClick`, `trackResumeAtsClick`, `trackResumeWebClick`.
- Produces:
  - `export type ResumeOptionKey = "recruiterPdf" | "ats" | "web";`
  - `ResumeOptionsModal` props: `{ opened: boolean; onClose: () => void; options: ResumeOptionKey[]; onChoiceClick?: () => void }`.
  - Recruiter PDF + ATS render as `<a target="_blank">`; Web renders as a Next `<Link href="/cv">`.

- [ ] **Step 1: Write the failing test**

Replace `src/cv/__tests__/ResumeOptionsModal.test.tsx` with:

```tsx
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/analytics/events", () => ({
  trackResumePdfClick: vi.fn(),
  trackResumeAtsClick: vi.fn(),
  trackResumeWebClick: vi.fn(),
}));

import {
  trackResumeAtsClick,
  trackResumePdfClick,
  trackResumeWebClick,
} from "@/analytics/events";
import { renderWithProviders, screen } from "@/test/render";
import { RESUME } from "../data";
import { ResumeOptionsModal } from "../ResumeOptionsModal";

const noop = () => undefined;

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe("ResumeOptionsModal", () => {
  it("renders nothing when closed", () => {
    renderWithProviders(
      <ResumeOptionsModal opened={false} onClose={noop} options={["recruiterPdf", "ats"]} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the 3-option (landing) configuration with correct destinations", () => {
    renderWithProviders(
      <ResumeOptionsModal opened onClose={noop} options={["recruiterPdf", "ats", "web"]} />,
    );
    const pdf = screen.getByRole("link", { name: /recruiter pdf/i });
    expect(pdf).toHaveAttribute("href", RESUME.hero.links.resumePdf);
    expect(pdf).toHaveAttribute("target", "_blank");

    expect(screen.getByRole("link", { name: /ats/i })).toHaveAttribute("href", "/cv/ats");
    expect(screen.getByRole("link", { name: /web version/i })).toHaveAttribute("href", "/cv");
  });

  it("renders only the requested 2 options for the /cv configuration", () => {
    renderWithProviders(
      <ResumeOptionsModal opened onClose={noop} options={["recruiterPdf", "ats"]} />,
    );
    expect(screen.getByRole("link", { name: /recruiter pdf/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ats/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /web version/i })).not.toBeInTheDocument();
  });

  it("fires the matching analytics event per choice", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ResumeOptionsModal opened onClose={noop} options={["recruiterPdf", "ats", "web"]} />,
    );
    await user.click(screen.getByRole("link", { name: /ats/i }));
    expect(trackResumeAtsClick).toHaveBeenCalledTimes(1);
    expect(trackResumePdfClick).not.toHaveBeenCalled();
    expect(trackResumeWebClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/cv/__tests__/ResumeOptionsModal.test.tsx`
Expected: FAIL — modal does not accept `options`; "recruiter pdf"/"ats" names absent.

- [ ] **Step 3: Implement**

Replace `src/cv/ResumeOptionsModal.tsx` with:

```tsx
"use client";

import { Modal } from "@mantine/core";
import { IconFileText, IconFileTypePdf, IconWorld } from "@tabler/icons-react";
import Link from "next/link";
import type { ComponentType } from "react";

import {
  trackResumeAtsClick,
  trackResumePdfClick,
  trackResumeWebClick,
} from "@/analytics/events";
import { RESUME } from "@/cv/data";

export type ResumeOptionKey = "recruiterPdf" | "ats" | "web";

type Descriptor = {
  href: string;
  internal: boolean;
  Icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  bg: string;
  track: () => void;
};

const DESCRIPTORS: Record<ResumeOptionKey, Descriptor> = {
  recruiterPdf: {
    href: RESUME.hero.links.resumePdf,
    internal: false,
    Icon: IconFileTypePdf,
    title: "RECRUITER PDF",
    subtitle: "Best for download, print, or sharing offline",
    bg: "#BB001B",
    track: trackResumePdfClick,
  },
  ats: {
    href: "/cv/ats",
    internal: false,
    Icon: IconFileText,
    title: "ATS / MACHINE-READABLE PDF",
    subtitle: "Plain text, optimized for applicant tracking systems",
    bg: "#404040",
    track: trackResumeAtsClick,
  },
  web: {
    href: "/cv",
    internal: true,
    Icon: IconWorld,
    title: "VIEW WEB VERSION",
    subtitle: "Interactive, always up to date",
    bg: "#171717",
    track: trackResumeWebClick,
  },
};

type Props = {
  opened: boolean;
  onClose: () => void;
  options: ResumeOptionKey[];
  onChoiceClick?: () => void;
};

export const ResumeOptionsModal = ({
  opened,
  onClose,
  options,
  onChoiceClick,
}: Props) => {
  const cardClass =
    "flex flex-col items-center rounded-[20px] px-[30px] py-[15px] w-full max-w-full cursor-pointer hover:scale-[1.02] transition-transform";

  return (
    <Modal opened={opened} onClose={onClose} centered size="auto">
      <div className="flex flex-col gap-[20px] items-center">
        <h1 className="text-center font-jakarta-sans text-[24px] md:text-[32px] font-black">
          VIEW MY RESUME
        </h1>

        <div className="flex flex-col gap-[10px] items-center w-full">
          {options.map((key) => {
            const d = DESCRIPTORS[key];
            const onClick = () => {
              onChoiceClick?.();
              d.track();
            };
            const inner = (
              <>
                <d.Icon className="w-[32px] h-[32px] text-white mb-[10px]" />
                <span className="text-white font-jakarta-sans font-bold text-[14px] md:text-[20px]">
                  {d.title}
                </span>
                <span className="text-white font-jakarta-sans font-normal text-[12px] md:text-[16px]">
                  {d.subtitle}
                </span>
              </>
            );
            return d.internal ? (
              <Link
                key={key}
                className={cardClass}
                style={{ backgroundColor: d.bg }}
                href={d.href}
                onClick={onClick}
              >
                {inner}
              </Link>
            ) : (
              <a
                key={key}
                className={cardClass}
                style={{ backgroundColor: d.bg }}
                href={d.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClick}
              >
                {inner}
              </a>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
```

> Note: the accessible link name comes from the card's text (e.g. "RECRUITER PDF …"), so `getByRole("link", { name: /recruiter pdf/i })` matches.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/cv/__tests__/ResumeOptionsModal.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/cv/ResumeOptionsModal.tsx src/cv/__tests__/ResumeOptionsModal.test.tsx
git commit -m "refactor(cv): make ResumeOptionsModal accept a configurable option list"
```

---

## Task 3: Hero `printMode` (hide social icons)

**Files:**
- Modify: `src/cv/sections/Hero/Hero.tsx`
- Test: `src/cv/sections/Hero/__tests__/Hero.test.tsx` (add cases)

**Interfaces:**
- Produces: `Hero` props become `{ printMode?: boolean }` (additive; default renders today's behavior). When `printMode`, the social-icon row is not rendered.

- [ ] **Step 1: Write the failing test**

Add to `src/cv/sections/Hero/__tests__/Hero.test.tsx`:

```tsx
import { renderWithProviders, screen } from "@/test/render";
import { Hero } from "../Hero";

describe("Hero printMode", () => {
  it("hides the social/PDF icon row in print mode", () => {
    renderWithProviders(<Hero printMode />);
    expect(screen.queryByLabelText(/linkedin/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/open resume pdf/i)).not.toBeInTheDocument();
    // core identity content still renders
    expect(screen.getByRole("heading", { name: /leonardo sarmento de castro/i })).toBeInTheDocument();
  });

  it("renders the icon row by default (web)", () => {
    renderWithProviders(<Hero />);
    expect(screen.getByLabelText(/linkedin/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/cv/sections/Hero/__tests__/Hero.test.tsx -t "printMode"`
Expected: FAIL — icons still present (prop ignored).

- [ ] **Step 3: Implement**

In `src/cv/sections/Hero/Hero.tsx`:

1. Change the component signature:

```tsx
export const Hero = ({ printMode = false }: { printMode?: boolean }) => {
```

2. Wrap the icon-row `<div className="mt-3 flex flex-row ...">…</div>` so it only renders when not in print mode:

```tsx
{!printMode && (
  <div className="mt-3 flex flex-row justify-center gap-3 md:justify-start">
    {/* …existing icon links unchanged… */}
  </div>
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/cv/sections/Hero/__tests__/Hero.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Hero/Hero.tsx src/cv/sections/Hero/__tests__/Hero.test.tsx
git commit -m "feat(cv): add Hero printMode to hide social icons in PDF"
```

---

## Task 4: Static, limited company-logo marquee for print

**Files:**
- Modify: `src/cv/sections/About/CompanyLogoMarquee.tsx`
- Modify: `src/cv/sections/About/About.tsx`
- Test: `src/cv/sections/About/__tests__/CompanyLogoMarquee.test.tsx` (add cases), `src/cv/sections/About/__tests__/About.test.tsx` (add a case)

**Interfaces:**
- Produces:
  - `CompanyLogoMarquee` props `{ forceStatic?: boolean; limit?: number }`. `forceStatic` renders the static (flex-wrap) layout regardless of reduced-motion; `limit` slices to the first N work entries (array is most-recent-first).
  - `About` props `{ printMode?: boolean }`. When `printMode`, renders `<CompanyLogoMarquee forceStatic limit={5} />`.

- [ ] **Step 1: Write the failing test**

Add to `src/cv/sections/About/__tests__/CompanyLogoMarquee.test.tsx`:

```tsx
import { renderWithProviders, screen } from "@/test/render";
import { CompanyLogoMarquee } from "../CompanyLogoMarquee";

describe("CompanyLogoMarquee print/static", () => {
  it("renders a static container limited to N logos when forceStatic+limit set", () => {
    renderWithProviders(<CompanyLogoMarquee forceStatic limit={5} />);
    expect(screen.getByTestId("company-logo-static")).toBeInTheDocument();
    expect(screen.queryByTestId("company-logo-marquee")).not.toBeInTheDocument();
    // 5 entries, but companies without a logo asset render null; assert at most 5
    expect(screen.getAllByTestId("company-logo").length).toBeLessThanOrEqual(5);
    expect(screen.getAllByTestId("company-logo").length).toBeGreaterThan(0);
  });
});
```

Add to `src/cv/sections/About/__tests__/About.test.tsx`:

```tsx
describe("About printMode", () => {
  it("renders the static logo row (not the animated marquee) in print mode", () => {
    renderWithProviders(<About printMode />);
    expect(screen.getByTestId("company-logo-static")).toBeInTheDocument();
    expect(screen.queryByTestId("company-logo-marquee")).not.toBeInTheDocument();
  });
});
```

(Reuse the existing imports at the top of each test file; add only the `describe` block.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/cv/sections/About/__tests__/CompanyLogoMarquee.test.tsx src/cv/sections/About/__tests__/About.test.tsx`
Expected: FAIL — props ignored; `About` has no `printMode`.

- [ ] **Step 3: Implement**

In `src/cv/sections/About/CompanyLogoMarquee.tsx`, change the component to accept props and honor them:

```tsx
export const CompanyLogoMarquee = ({
  forceStatic = false,
  limit,
}: {
  forceStatic?: boolean;
  limit?: number;
} = {}) => {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const entries =
    typeof limit === "number"
      ? RESUME.workExperience.slice(0, limit)
      : RESUME.workExperience;

  const buttons = entries.map((entry) => (
    <LogoButton key={`${entry.company}-${entry.startDate}`} entry={entry} />
  ));

  if (forceStatic || reduceMotion) {
    return (
      <div
        data-testid="company-logo-static"
        className="mt-6 flex flex-wrap justify-center gap-4"
      >
        {buttons}
      </div>
    );
  }
  // …existing animated <Marquee> branch unchanged…
};
```

In `src/cv/sections/About/About.tsx`:

```tsx
export const About = ({ printMode = false }: { printMode?: boolean }) => (
  <section id="about" className="flex flex-col gap-3">
    <h2 className="text-xl font-domine text-[#2d2a24] tracking-tight">About</h2>
    {RESUME.about.map((paragraph) => (
      <p key={paragraph} className="text-sm font-quicksand text-[#6d6964] leading-relaxed">
        {paragraph}
      </p>
    ))}
    {printMode ? (
      <CompanyLogoMarquee forceStatic limit={5} />
    ) : (
      <CompanyLogoMarquee />
    )}
  </section>
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/cv/sections/About/__tests__/CompanyLogoMarquee.test.tsx src/cv/sections/About/__tests__/About.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/About/CompanyLogoMarquee.tsx src/cv/sections/About/About.tsx src/cv/sections/About/__tests__/
git commit -m "feat(cv): add static 5-logo marquee variant for print"
```

---

## Task 5: Skills `printMode` (non-interactive cards)

**Files:**
- Modify: `src/cv/sections/Skills/Skills.tsx`
- Test: `src/cv/sections/Skills/__tests__/Skills.test.tsx` (add a case)

**Interfaces:**
- Produces: `Skills` props `{ printMode?: boolean }`. When `printMode`, every `SkillCard` renders as a non-interactive `<div>` (never a `<button>`), and the `SkillExperiencesModal` is not rendered.

- [ ] **Step 1: Write the failing test**

Add to `src/cv/sections/Skills/__tests__/Skills.test.tsx`:

```tsx
describe("Skills printMode", () => {
  it("renders no interactive skill buttons in print mode", () => {
    renderWithProviders(<Skills printMode />);
    // category headings still render
    expect(screen.getByRole("heading", { name: /^skills$/i })).toBeInTheDocument();
    // no skill card is a button in print mode
    const buttons = screen.queryAllByRole("button");
    expect(buttons).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/cv/sections/Skills/__tests__/Skills.test.tsx -t "printMode"`
Expected: FAIL — interactive skills render buttons.

- [ ] **Step 3: Implement**

In `src/cv/sections/Skills/Skills.tsx`:

1. Thread `printMode` into `SkillCard`:

```tsx
const SkillCard = ({
  skill,
  onOpen,
  printMode = false,
}: {
  skill: Skill;
  onOpen: (skill: Skill) => void;
  printMode?: boolean;
}) => {
  const interactive =
    !printMode && experiencesForSkill(skill, RESUME.workExperience).length > 0;

  if (!interactive) {
    return (
      <div id={skillAnchorId(skill)} data-testid={`skill-card-${skill.name}`} className={CARD_CLASS}>
        <SkillCardInner skill={skill} />
      </div>
    );
  }
  // …existing interactive <button> branch unchanged…
};
```

2. Update `Skills` to accept and pass the prop, and skip the modal in print:

```tsx
export const Skills = ({ printMode = false }: { printMode?: boolean }) => {
  const groups = groupByCategory(RESUME.skills);
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  // …handlers unchanged…

  return (
    <section id="skills" className="flex flex-col gap-6 font-quicksand">
      <h2 className="text-xl font-domine text-[#2d2a24] tracking-tight">Skills</h2>
      {groups.map((group) => (
        <div key={group.category} className="flex flex-col gap-3">
          <h3 className="text-xs font-quicksand font-bold uppercase tracking-wider text-neutral-500">
            {group.category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.items.map((skill) => (
              <SkillCard key={skill.name} skill={skill} onOpen={handleOpen} printMode={printMode} />
            ))}
          </div>
        </div>
      ))}
      {!printMode && (
        <SkillExperiencesModal
          skill={activeSkill}
          onClose={() => setActiveSkill(null)}
          onExperienceClick={handleExperienceClick}
        />
      )}
    </section>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/cv/sections/Skills/__tests__/Skills.test.tsx`
Expected: PASS (new + existing tests).

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Skills/Skills.tsx src/cv/sections/Skills/__tests__/Skills.test.tsx
git commit -m "feat(cv): add Skills printMode to render non-interactive cards"
```

---

## Task 6: `WorkPrintTimeline` — static single-spine, all-expanded

**Files:**
- Create: `src/cv/print/WorkPrintTimeline.tsx`
- Test: `src/cv/print/__tests__/WorkPrintTimeline.test.tsx`

**Interfaces:**
- Consumes: `RESUME`, `buildTimelineItems`, `workEntryAnchorId`, `WorkTimelineItem`, `WorkTimelineDatePill`, `splitMilestoneText`, `workSpineFill`.
- Produces: `WorkPrintTimeline()` — a static, GSAP-free timeline: a single left spine, one centered node per entry, the date pill above each card, every `WorkTimelineItem` rendered `isOpen` (animations off), milestones as static centered text. All entries wrapped in an `Accordion multiple` with every anchor id open.

- [ ] **Step 1: Write the failing test**

Create `src/cv/print/__tests__/WorkPrintTimeline.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { RESUME } from "@/cv/data";
import { WorkPrintTimeline } from "../WorkPrintTimeline";

describe("WorkPrintTimeline", () => {
  it("renders every work entry expanded (descriptions visible)", () => {
    renderWithProviders(<WorkPrintTimeline />);
    for (const entry of RESUME.workExperience) {
      expect(screen.getByText(entry.description)).toBeInTheDocument();
    }
  });

  it("renders one centered spine node per work entry", () => {
    renderWithProviders(<WorkPrintTimeline />);
    expect(screen.getAllByTestId("work-print-node")).toHaveLength(
      RESUME.workExperience.length,
    );
  });

  it("renders milestone text", () => {
    renderWithProviders(<WorkPrintTimeline />);
    // a known milestone body fragment
    expect(screen.getByText(/Looking for new opportunities/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/cv/print/__tests__/WorkPrintTimeline.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/cv/print/WorkPrintTimeline.tsx`:

```tsx
"use client";

import { Accordion } from "@/components/ui/Accordion";
import { workSpineFill } from "@/cv/cv-colors";
import { RESUME } from "@/cv/data";
import { workEntryAnchorId } from "@/cv/sections/Work/anchors";
import { buildTimelineItems } from "@/cv/sections/Work/timeline-layout";
import { splitMilestoneText } from "@/cv/sections/Work/milestone-text";
import { WorkTimelineDatePill, WorkTimelineItem } from "@/cv/sections/Work/WorkTimelineItem";

/** Static dot centered on the left spine. */
const PrintNode = () => (
  <div
    data-testid="work-print-node"
    className="absolute -left-[1.6875rem] top-0 flex h-7 w-4 items-center justify-center z-10"
  >
    <span className={`block h-3.5 w-3.5 rounded-full border-[3px] border-white ${workSpineFill} ring-1 ring-[#3c78d8]`} />
  </div>
);

const PrintMilestone = ({ text }: { text: string }) => {
  const { emoji, body } = splitMilestoneText(text);
  return (
    <div className="relative z-10 w-full py-8" data-testid="work-print-milestone" role="note" aria-label={text}>
      <p className="text-center text-sm italic font-spectral text-[#6c6965] px-6">
        {emoji ? <span className="inline-block mr-1">{emoji}</span> : null}
        <span>{body}</span>
      </p>
    </div>
  );
};

export const WorkPrintTimeline = () => {
  const items = buildTimelineItems(RESUME.workExperience, RESUME.milestones);
  const allIds = RESUME.workExperience.map(workEntryAnchorId);

  return (
    <section id="work" className="flex flex-col gap-8">
      <h2 className="text-xl font-domine text-[#2d2a24] tracking-tight">Work Experience</h2>

      <div className="relative pl-8">
        {/* solid static spine */}
        <div className={`absolute left-3 top-3.5 bottom-0 w-0.5 z-0 ${workSpineFill}`} />

        <Accordion multiple value={allIds} onValueChange={() => {}} className="relative z-10 flex flex-col gap-10">
          {items.map((item, i) => {
            if (item.kind === "milestone") {
              return <PrintMilestone key={`m-${item.milestone.year}-${i}`} text={item.milestone.text} />;
            }
            const { entry } = item;
            return (
              <div key={`${entry.company}-${entry.startDate}`} className="relative w-full">
                <PrintNode />
                <WorkTimelineDatePill entry={entry} align="start" placement="mobile" className="relative z-20 flex" />
                <WorkTimelineItem
                  entry={entry}
                  isOpen
                  showHeaderAnimation={false}
                  showBodyAnimation={false}
                  suppressMobilePeriod
                />
              </div>
            );
          })}
        </Accordion>
      </div>
    </section>
  );
};
```

> The node uses the exact mobile offsets (`-left-[1.6875rem]` against the `pl-8` row + `left-3` spine) so the dot is centered on the spine — fixing the misalignment seen during design. Each entry appears once, linearly (no desktop sticky clusters).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/cv/print/__tests__/WorkPrintTimeline.test.tsx`
Expected: PASS. If a `description` string also appears elsewhere causing `getByText` to match multiple, switch that assertion to `getAllByText(entry.description).length >= 1`.

- [ ] **Step 5: Commit**

```bash
git add src/cv/print/WorkPrintTimeline.tsx src/cv/print/__tests__/WorkPrintTimeline.test.tsx
git commit -m "feat(cv): add static single-spine expanded work timeline for print"
```

---

## Task 7: `ContactPrint` — print-only Contact card section

**Files:**
- Create: `src/cv/print/ContactPrint.tsx`
- Test: `src/cv/print/__tests__/ContactPrint.test.tsx`

**Interfaces:**
- Consumes: `RESUME.hero.links`.
- Produces: `ContactPrint()` — `<section id="contact">` with a 2-col grid of cards (LinkedIn, GitHub, WhatsApp, Email) plus a full-width Personal Site card. Each card shows an icon chip + bold label and the link/handle in gray. No interactive buttons or live clock.

- [ ] **Step 1: Write the failing test**

Create `src/cv/print/__tests__/ContactPrint.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { ContactPrint } from "../ContactPrint";

describe("ContactPrint", () => {
  it("renders all five channels with their labels", () => {
    renderWithProviders(<ContactPrint />);
    for (const label of ["LinkedIn", "GitHub", "WhatsApp", "Email", "Personal Site"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("shows the email address and whatsapp number as gray text", () => {
    renderWithProviders(<ContactPrint />);
    expect(screen.getByText("negocios.leonardosarmentocastro@gmail.com")).toBeInTheDocument();
    expect(screen.getByText(/\+55 \(12\) 98127-6618/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/cv/print/__tests__/ContactPrint.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/cv/print/ContactPrint.tsx`:

```tsx
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconMail,
  IconWorld,
} from "@tabler/icons-react";
import type { ComponentType } from "react";

import { RESUME } from "@/cv/data";

type Channel = {
  label: string;
  value: string;
  Icon: ComponentType<{ className?: string }>;
  chip: string;
  full?: boolean;
};

const { linkedin, github, whatsappDisplay, email, site } = RESUME.hero.links;

const CHANNELS: Channel[] = [
  { label: "LinkedIn", value: "linkedin.com/in/leonardo-sarmento-de-castro", Icon: IconBrandLinkedin, chip: "#0072b1" },
  { label: "GitHub", value: github.replace(/^https?:\/\//, ""), Icon: IconBrandGithub, chip: "#24292f" },
  { label: "WhatsApp", value: whatsappDisplay, Icon: IconBrandWhatsapp, chip: "#128c7e" },
  { label: "Email", value: email, Icon: IconMail, chip: "#bb001b" },
  { label: "Personal Site", value: site.replace(/^https?:\/\//, ""), Icon: IconWorld, chip: "#2d2a24", full: true },
];

const Card = ({ c }: { c: Channel }) => (
  <div className={`border border-neutral-200 rounded-lg p-4 flex flex-col gap-1 ${c.full ? "sm:col-span-2" : ""}`}>
    <span className="flex flex-row items-center gap-2">
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-md" style={{ backgroundColor: c.chip }}>
        <c.Icon className="w-3.5 h-3.5 text-white" />
      </span>
      <span className="text-sm font-semibold text-[#2d2a24]">{c.label}</span>
    </span>
    <span className="block text-xs text-neutral-500 break-all">{c.value}</span>
  </div>
);

export const ContactPrint = () => (
  <section id="contact" className="flex flex-col gap-4 font-quicksand">
    <h2 className="text-xl font-domine text-[#2d2a24] tracking-tight">Contact</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {CHANNELS.map((c) => (
        <Card key={c.label} c={c} />
      ))}
    </div>
  </section>
);
```

> The LinkedIn `value` is hard-coded display text because the stored URL has a trailing tracking segment; keep it in sync with `RESUME.hero.links.linkedin` if that changes. (Layout changes here require bumping `PRINT_LAYOUT_VERSION` in Task 12.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/cv/print/__tests__/ContactPrint.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cv/print/ContactPrint.tsx src/cv/print/__tests__/ContactPrint.test.tsx
git commit -m "feat(cv): add print-only Contact card section"
```

---

## Task 8: `CVPrintPage` + `/cv/print` route

**Files:**
- Create: `src/cv/print/CVPrintPage.tsx`
- Create: `src/app/cv/print/page.tsx`
- Test: `src/cv/print/__tests__/CVPrintPage.test.tsx`

**Interfaces:**
- Consumes: `Hero`, `About`, `Education`, `Skills`, `WorkPrintTimeline`, `ContactPrint`; `@/cv/cv.css`.
- Produces: `CVPrintPage()` — composes the print-mode CV (no GSAP). Route `/cv/print` renders it and is `noindex`.

- [ ] **Step 1: Write the failing test**

Create `src/cv/print/__tests__/CVPrintPage.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { CVPrintPage } from "../CVPrintPage";

describe("CVPrintPage", () => {
  it("renders the print CV: no hero icons, no Get-in-Touch, Contact present, work expanded", () => {
    renderWithProviders(<CVPrintPage />);
    // hero icons removed
    expect(screen.queryByLabelText(/linkedin/i)).not.toBeInTheDocument();
    // interactive Get-in-Touch heading is gone; print Contact heading present
    expect(screen.queryByRole("heading", { name: /get in touch/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^contact$/i })).toBeInTheDocument();
    // work section present and expanded
    expect(screen.getByRole("heading", { name: /work experience/i })).toBeInTheDocument();
    expect(screen.getAllByTestId("work-print-node").length).toBeGreaterThan(0);
    // static marquee, not animated
    expect(screen.getByTestId("company-logo-static")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/cv/print/__tests__/CVPrintPage.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/cv/print/CVPrintPage.tsx`:

```tsx
"use client";

import "@/cv/cv.css";

import { About } from "@/cv/sections/About/About";
import { Education } from "@/cv/sections/Education/Education";
import { Hero } from "@/cv/sections/Hero/Hero";
import { Skills } from "@/cv/sections/Skills/Skills";
import { ContactPrint } from "./ContactPrint";
import { WorkPrintTimeline } from "./WorkPrintTimeline";

export const CVPrintPage = () => (
  <main className="cv-print bg-white text-neutral-900">
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Hero printMode />
      <hr className="my-12 border-neutral-200" />
      <About printMode />
      <hr className="my-12 border-neutral-200" />
      <WorkPrintTimeline />
      <hr className="my-12 border-neutral-200" />
      <Education />
      <hr className="my-12 border-neutral-200" />
      <Skills printMode />
      <hr className="my-12 border-neutral-200" />
      <ContactPrint />
    </div>
  </main>
);
```

Create `src/app/cv/print/page.tsx`:

```tsx
import type { Metadata } from "next";

import { CVPrintPage } from "@/cv/print/CVPrintPage";

export const metadata: Metadata = {
  title: "Leonardo Sarmento de Castro — CV (print)",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CVPrintPage />;
}
```

Append to `src/cv/cv.css` a print-target rule to hide the accordion expander chevrons (they are meaningless in a static PDF) and force backgrounds:

```css
/* Print CV: hide interactive accordion chevrons, keep colors when printed */
.cv-print [data-slot="accordion-trigger"] svg {
  display: none;
}
.cv-print {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/cv/print/__tests__/CVPrintPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Verify the route renders in a real browser**

Run: `pnpm dev`, open `http://localhost:3000/cv/print`. Confirm: no hero icons, single left spine with all cards expanded and the dot centered on the spine, static 5-logo row, Skills as non-interactive cards, Contact card grid, no "Get in Touch". Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/cv/print/CVPrintPage.tsx src/app/cv/print/page.tsx src/cv/cv.css src/cv/print/__tests__/CVPrintPage.test.tsx
git commit -m "feat(cv): add /cv/print route rendering the faithful print CV"
```

---

## Task 9: Landing page — 3-option resume dialog

**Files:**
- Modify: `src/components/pages/LandingPage/LandingPage.tsx`
- Test: `src/components/pages/LandingPage/__tests__/LandingPage.test.tsx` (add a case)

**Interfaces:**
- Consumes: `ResumeOptionsModal` with `options`.
- Produces: clicking "RESUME" opens the modal showing recruiter PDF + ATS + web.

- [ ] **Step 1: Write the failing test**

Add to `src/components/pages/LandingPage/__tests__/LandingPage.test.tsx` (reuse the file's existing imports/mocks; if analytics is mocked there, add `trackResumeAtsClick: vi.fn()` to the mock factory):

```tsx
it("opens a 3-option resume dialog (recruiter PDF, ATS, web)", async () => {
  const user = userEvent.setup();
  renderWithProviders(<LandingPage />);
  await user.click(screen.getByRole("button", { name: /resume/i }));
  expect(screen.getByRole("link", { name: /recruiter pdf/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /ats/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /web version/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/pages/LandingPage/__tests__/LandingPage.test.tsx -t "3-option"`
Expected: FAIL — modal renders without `options` (TS/runtime) and the ATS/recruiter names are absent.

- [ ] **Step 3: Implement**

In `src/components/pages/LandingPage/LandingPage.tsx`, pass the option list:

```tsx
<ResumeOptionsModal
  opened={resumeModalOpened}
  onClose={handleResumeModalClose}
  onChoiceClick={handleResumeChoiceClick}
  options={["recruiterPdf", "ats", "web"]}
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/pages/LandingPage/__tests__/LandingPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/LandingPage/LandingPage.tsx src/components/pages/LandingPage/__tests__/LandingPage.test.tsx
git commit -m "feat(landing): offer recruiter PDF, ATS, and web in the resume dialog"
```

---

## Task 10: `/cv` — Hero PDF icon opens the 2-option dialog

**Files:**
- Modify: `src/cv/sections/Hero/Hero.tsx`
- Modify: `src/cv/pages/CVPage/CVPage.tsx`
- Test: `src/cv/sections/Hero/__tests__/Hero.test.tsx` (add a case), `src/cv/pages/CVPage/__tests__/CVPage.test.tsx` (add a case)

**Interfaces:**
- Produces:
  - `Hero` gains `onOpenFormatDialog?: () => void`. When provided (and not `printMode`), the PDF icon renders as a `<button aria-label="Open resume PDF">` that calls it instead of linking to `resumePdf`.
  - `CVPage` hosts a `ResumeOptionsModal` with `options={["recruiterPdf", "ats"]}` opened by that callback.

- [ ] **Step 1: Write the failing test**

Add to `src/cv/sections/Hero/__tests__/Hero.test.tsx`:

```tsx
import userEvent from "@testing-library/user-event";

it("renders the PDF control as a button that opens the format dialog when wired", async () => {
  const onOpen = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(<Hero onOpenFormatDialog={onOpen} />);
  await user.click(screen.getByRole("button", { name: /open resume pdf/i }));
  expect(onOpen).toHaveBeenCalledTimes(1);
});
```

Add to `src/cv/pages/CVPage/__tests__/CVPage.test.tsx`:

```tsx
import userEvent from "@testing-library/user-event";

it("opens a 2-option format dialog (recruiter PDF + ATS) from the hero PDF control", async () => {
  const user = userEvent.setup();
  renderWithProviders(<CVPage />);
  await user.click(screen.getByRole("button", { name: /open resume pdf/i }));
  expect(screen.getByRole("link", { name: /recruiter pdf/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /ats/i })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /web version/i })).not.toBeInTheDocument();
});
```

(If `CVPage.test.tsx` mocks `@/analytics/events`, include `trackResumeAtsClick: vi.fn()` and the other resume events in the mock factory.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/cv/sections/Hero/__tests__/Hero.test.tsx src/cv/pages/CVPage/__tests__/CVPage.test.tsx -t "format dialog"`
Expected: FAIL — PDF control is still a link; CVPage has no dialog.

- [ ] **Step 3: Implement**

In `src/cv/sections/Hero/Hero.tsx`:

1. Extend the signature:

```tsx
export const Hero = ({
  printMode = false,
  onOpenFormatDialog,
}: {
  printMode?: boolean;
  onOpenFormatDialog?: () => void;
}) => {
```

2. Replace the existing PDF `<a>` (the one with `aria-label="Open resume PDF"`) with a conditional control:

```tsx
{onOpenFormatDialog ? (
  <button
    type="button"
    aria-label="Open resume PDF"
    className={`${ICON_LINK} hover:border-[#dc2626] hover:text-[#dc2626] cursor-pointer`}
    onClick={onOpenFormatDialog}
  >
    <IconFileTypePdf className="w-5 h-5" />
  </button>
) : (
  <a
    href={links.resumePdf}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Open resume PDF"
    className={`${ICON_LINK} hover:border-[#dc2626] hover:text-[#dc2626]`}
    onClick={() => trackResumePdfClick()}
  >
    <IconFileTypePdf className="w-5 h-5" />
  </a>
)}
```

In `src/cv/pages/CVPage/CVPage.tsx`:

1. Add imports and modal state:

```tsx
import { useDisclosure } from "@mantine/hooks";
import { ResumeOptionsModal } from "@/cv/ResumeOptionsModal";
```

```tsx
const [formatsOpened, { open: openFormats, close: closeFormats }] = useDisclosure(false);
```

2. Pass the trigger to `Hero` and render the modal inside the returned `<main>`:

```tsx
<Hero onOpenFormatDialog={openFormats} />
```

```tsx
<ResumeOptionsModal
  opened={formatsOpened}
  onClose={closeFormats}
  options={["recruiterPdf", "ats"]}
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/cv/sections/Hero/__tests__/Hero.test.tsx src/cv/pages/CVPage/__tests__/CVPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Hero/Hero.tsx src/cv/pages/CVPage/CVPage.tsx src/cv/sections/Hero/__tests__/Hero.test.tsx src/cv/pages/CVPage/__tests__/CVPage.test.tsx
git commit -m "feat(cv): open a 2-option format dialog from the /cv hero PDF control"
```

---

## Task 11: Point recruiter PDF at the local asset; disambiguate ATS filename

**Files:**
- Modify: `src/cv/data.ts`
- Modify: `src/app/cv/ats/route.ts`
- Test: `src/cv/__tests__/data.test.ts` (add a case), `src/app/cv/ats/__tests__/route.test.ts` (update expectation)

**Interfaces:**
- Produces: `RESUME.hero.links.resumePdf === "/cv/Leonardo-Sarmento-de-Castro-Resume.pdf"`; ATS route downloads as `Leonardo-Sarmento-de-Castro-Resume-ATS.pdf`.

- [ ] **Step 1: Write the failing test**

Add to `src/cv/__tests__/data.test.ts`:

```ts
it("links the recruiter PDF to the generated local asset (not Google Drive)", () => {
  expect(RESUME.hero.links.resumePdf).toBe("/cv/Leonardo-Sarmento-de-Castro-Resume.pdf");
});
```

In `src/app/cv/ats/__tests__/route.test.ts`, update the Content-Disposition assertion to expect the ATS-suffixed filename:

```ts
expect(res.headers.get("Content-Disposition")).toContain(
  'filename="Leonardo-Sarmento-de-Castro-Resume-ATS.pdf"',
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/cv/__tests__/data.test.ts src/app/cv/ats/__tests__/route.test.ts`
Expected: FAIL — `resumePdf` is the Drive URL; ATS filename lacks `-ATS`.

- [ ] **Step 3: Implement**

In `src/cv/data.ts`, replace the `resumePdf` value:

```ts
resumePdf: "/cv/Leonardo-Sarmento-de-Castro-Resume.pdf",
```

In `src/app/cv/ats/route.ts`, update the disposition filename:

```ts
"Content-Disposition":
  'attachment; filename="Leonardo-Sarmento-de-Castro-Resume-ATS.pdf"',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/cv/__tests__/data.test.ts src/app/cv/ats/__tests__/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cv/data.ts src/app/cv/ats/route.ts src/cv/__tests__/data.test.ts src/app/cv/ats/__tests__/route.test.ts
git commit -m "feat(cv): point recruiter PDF at generated asset; suffix ATS download filename"
```

---

## Task 12: PDF asset module + content-hash freshness guard

**Files:**
- Create: `src/cv/print/pdf-asset.ts`
- Create: `src/cv/print/__tests__/pdf-asset.test.ts`
- Create (generated, committed): `public/cv/Leonardo-Sarmento-de-Castro-Resume.pdf.hash`

**Interfaces:**
- Produces:
  - `CV_PDF_ROUTE = "/cv/print"`
  - `CV_PDF_PUBLIC_PATH = "/cv/Leonardo-Sarmento-de-Castro-Resume.pdf"`
  - `CV_PDF_OUTPUT_FILE` (absolute repo path to the public PDF) and `CV_PDF_HASH_FILE` (the `.hash` sibling)
  - `PRINT_LAYOUT_VERSION: number` — bump when the print layout changes (data-independent layout edits)
  - `computeCvPdfContentHash(): string` — deterministic sha256 over `PRINT_LAYOUT_VERSION` + `JSON.stringify(RESUME)`

> **Why a content hash, not PDF bytes:** Chromium embeds a creation timestamp in every PDF, so byte comparison is non-deterministic. Hashing the inputs (CV data + a manual layout version) deterministically catches the real drift risk — data changed but the PDF wasn't regenerated — and is testable in CI without headless Chrome (spec escape hatch).

- [ ] **Step 1: Write the failing test**

Create `src/cv/print/__tests__/pdf-asset.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CV_PDF_HASH_FILE,
  CV_PDF_PUBLIC_PATH,
  computeCvPdfContentHash,
} from "../pdf-asset";

describe("cv pdf asset", () => {
  it("exposes the public asset path used by RESUME.resumePdf", () => {
    expect(CV_PDF_PUBLIC_PATH).toBe("/cv/Leonardo-Sarmento-de-Castro-Resume.pdf");
  });

  it("computes a deterministic content hash", () => {
    expect(computeCvPdfContentHash()).toBe(computeCvPdfContentHash());
    expect(computeCvPdfContentHash()).toMatch(/^[a-f0-9]{64}$/);
  });

  it("matches the committed hash (regenerate with `pnpm cv:pdf` if this fails)", () => {
    const committed = readFileSync(CV_PDF_HASH_FILE, "utf8").trim();
    expect(committed).toBe(computeCvPdfContentHash());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/cv/print/__tests__/pdf-asset.test.ts`
Expected: FAIL — module + hash file missing.

- [ ] **Step 3: Implement the module**

Create `src/cv/print/pdf-asset.ts`:

```ts
import { createHash } from "node:crypto";
import { join } from "node:path";

import { RESUME } from "@/cv/data";

/** Bump when the print LAYOUT changes without CV data changing. */
export const PRINT_LAYOUT_VERSION = 1;

export const CV_PDF_ROUTE = "/cv/print";
export const CV_PDF_PUBLIC_PATH = "/cv/Leonardo-Sarmento-de-Castro-Resume.pdf";

const PUBLIC_DIR = join(process.cwd(), "public");
export const CV_PDF_OUTPUT_FILE = join(
  PUBLIC_DIR,
  "cv",
  "Leonardo-Sarmento-de-Castro-Resume.pdf",
);
export const CV_PDF_HASH_FILE = `${CV_PDF_OUTPUT_FILE}.hash`;

export const computeCvPdfContentHash = (): string =>
  createHash("sha256")
    .update(`v${PRINT_LAYOUT_VERSION}\n`)
    .update(JSON.stringify(RESUME))
    .digest("hex");
```

- [ ] **Step 4: Generate and commit the hash file**

Run a one-off to write the committed hash (no Puppeteer needed):

```bash
mkdir -p public/cv
pnpm tsx -e "import {writeFileSync} from 'node:fs'; import {CV_PDF_HASH_FILE, computeCvPdfContentHash} from './src/cv/print/pdf-asset.ts'; writeFileSync(CV_PDF_HASH_FILE, computeCvPdfContentHash() + '\n');"
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/cv/print/__tests__/pdf-asset.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/cv/print/pdf-asset.ts src/cv/print/__tests__/pdf-asset.test.ts public/cv/Leonardo-Sarmento-de-Castro-Resume.pdf.hash
git commit -m "feat(cv): add PDF asset paths and content-hash freshness guard"
```

---

## Task 13: Puppeteer generation script + `pnpm cv:pdf` + docs

**Files:**
- Create: `scripts/cv/generate-pdf.ts`
- Modify: `package.json` (add `puppeteer` devDependency + `cv:pdf` script)
- Modify: `src/cv/README.md`
- Modify (generated, committed): `public/cv/Leonardo-Sarmento-de-Castro-Resume.pdf` (+ refreshed `.hash`)

**Interfaces:**
- Consumes: `CV_PDF_ROUTE`, `CV_PDF_OUTPUT_FILE`, `CV_PDF_HASH_FILE`, `computeCvPdfContentHash`.
- Produces: `pnpm cv:pdf` renders `<base>/cv/print` to A4 and writes the PDF + hash. `base` from `CV_PDF_BASE_URL` (default `http://localhost:3000`).

> The script's orchestration (launching Chromium, navigating, `page.pdf`) cannot be meaningfully unit-tested in the CI runner without a live server and Chromium; its pure inputs are already covered by Task 12. Verification is the manual render step below (spec escape hatch).

- [ ] **Step 1: Add the dependency and script**

```bash
pnpm add -D puppeteer
```

In `package.json` `scripts`, add:

```json
"cv:pdf": "tsx scripts/cv/generate-pdf.ts"
```

- [ ] **Step 2: Write the generation script**

Create `scripts/cv/generate-pdf.ts`:

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import puppeteer from "puppeteer";

import {
  CV_PDF_HASH_FILE,
  CV_PDF_OUTPUT_FILE,
  CV_PDF_ROUTE,
  computeCvPdfContentHash,
} from "@/cv/print/pdf-asset";

const BASE_URL = process.env.CV_PDF_BASE_URL ?? "http://localhost:3000";

async function main() {
  const url = `${BASE_URL}${CV_PDF_ROUTE}`;
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const res = await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });
    if (!res || !res.ok()) {
      throw new Error(`Failed to load ${url} (status ${res?.status()}). Is the server running?`);
    }
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
    });
    mkdirSync(dirname(CV_PDF_OUTPUT_FILE), { recursive: true });
    writeFileSync(CV_PDF_OUTPUT_FILE, pdf);
    writeFileSync(CV_PDF_HASH_FILE, `${computeCvPdfContentHash()}\n`);
    console.log(`Wrote ${CV_PDF_OUTPUT_FILE}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

> Confirm `tsx` resolves the `@/*` alias (the repo already runs `tsx` scripts such as `extract-tech-icons` with `@/*` imports). If a script cannot resolve the alias, import via a relative path (`../../src/cv/print/pdf-asset`) instead.

- [ ] **Step 3: Generate the PDF and verify**

In one terminal: `pnpm build && pnpm start` (production server for deterministic output).
In another: `pnpm cv:pdf`.
Open `public/cv/Leonardo-Sarmento-de-Castro-Resume.pdf` and confirm A4 fidelity: faithful web look, single left spine with centered dots, all roles expanded, static 5-logo row, Skills cards, Contact grid, no "Get in Touch", blue accents, no red in the layout. Stop both servers.

- [ ] **Step 4: Verify the full suite is green**

Run: `pnpm test:run`
Expected: PASS (including the freshness test, whose committed hash the script just rewrote).

- [ ] **Step 5: Document the workflow**

Add a section to `src/cv/README.md`:

```markdown
## Generated recruiter PDF (`/cv/print` → `public/cv/...`)

The human-facing recruiter PDF is generated from the live `/cv/print` route and
committed as `public/cv/Leonardo-Sarmento-de-Castro-Resume.pdf`. It is served as a
static asset and is what `RESUME.hero.links.resumePdf` points to.

**Regenerate after any CV data or print-layout change:**

1. `pnpm build && pnpm start` (or `pnpm dev`) in one terminal.
2. `pnpm cv:pdf` in another (override the target with `CV_PDF_BASE_URL` if needed).
3. Commit the updated PDF and its `.hash` sibling.

A content-hash freshness test (`src/cv/print/__tests__/pdf-asset.test.ts`) fails if
CV data changed without regenerating. For layout-only changes, bump
`PRINT_LAYOUT_VERSION` in `src/cv/print/pdf-asset.ts` and regenerate.
```

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml scripts/cv/generate-pdf.ts src/cv/README.md public/cv/Leonardo-Sarmento-de-Castro-Resume.pdf public/cv/Leonardo-Sarmento-de-Castro-Resume.pdf.hash
git commit -m "feat(cv): generate committed A4 recruiter PDF from /cv/print"
```

---

## Task 14: Final verification

- [ ] **Step 1: Lint + format**

Run: `pnpm lint`
Expected: no errors (auto-fixes applied). Review and `git add -p` any formatting changes; commit if needed:

```bash
git commit -am "chore(cv): biome formatting"
```

- [ ] **Step 2: Full test suite**

Run: `pnpm test:run`
Expected: all green.

- [ ] **Step 3: Production build**

Run: `pnpm build`
Expected: build succeeds; `/cv/print` appears in the route list.

- [ ] **Step 4: Manual smoke (web unchanged + dialogs)**

Run `pnpm dev` and confirm:
- `/` → "RESUME" button opens the 3-option dialog (recruiter PDF / ATS / web). Recruiter PDF opens the committed `/cv/...pdf`; ATS downloads with `-ATS` filename; web goes to `/cv`.
- `/cv` → hero icons still present; the PDF icon opens the 2-option dialog (recruiter PDF / ATS). The interactive "Get in Touch" section is still present on the web page.
- `/cv/print` → the faithful print layout.
Stop the dev server.

---

## Self-Review notes (coverage map)

- **Spec §1 render modes** → Tasks 3 (hero icons), 4 (static marquee), 5 (skills), 6 (work timeline + dot fix), 7 (contact), 8 (compose + remove Get-in-Touch).
- **Spec §2 print route** → Task 8.
- **Spec §3 generation + freshness + replace Drive link** → Tasks 11 (link), 12 (hash guard), 13 (script/PDF/docs).
- **Spec §4 dialogs** → Tasks 2 (generalize), 9 (landing 3-option), 10 (/cv 2-option).
- **Spec §5 Contact (print-only)** → Task 7 (component), 8 (composed into print only; web `Contact` untouched).
- **Spec analytics** → Task 1.
- **Spec filename disambiguation** → Task 11.
