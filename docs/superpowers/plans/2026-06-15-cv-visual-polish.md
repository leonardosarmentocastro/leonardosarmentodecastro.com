# CV Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add company logos, scroll-driven GSAP/Magic UI animations, milestone celebrations, and PDF-matching typography/colors to the `/cv` Work timeline and sibling sections.

**Architecture:** Introduce shared `cv-colors.ts` and `company-logos.ts` tokens, restructure `WorkTimelineItem` headers to PDF phrasing, extend existing GSAP `ScrollTrigger` checkpoint sync for pulse + React activation state driving Magic UI `TextAnimate`, and apply font/color tokens across CV sections. Milestone dividers split emoji/body for one-shot GSAP reveals.

**Tech Stack:** Next.js 15 App Router, React 19, GSAP + `@gsap/react`, Magic UI `TextAnimate` (`framer-motion`), Tailwind CSS 4, Vitest, Biome, pnpm.

**Spec:** `docs/superpowers/specs/2026-06-15-cv-visual-polish-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `src/cv/cv-colors.ts` | Hex tokens + Tailwind class string exports for CV palette |
| `src/cv/company-logos.ts` | `companyLogoSrc(company)` → `/cv/companies/...` |
| `src/cv/sections/Work/work-copy.ts` | PDF-style title/metadata formatters |
| `src/cv/sections/Work/CompanyLogo.tsx` | Square logo `<img>`, no background wrapper |
| `src/cv/sections/Work/WorkTimelineItem.tsx` | Accordion header layout, typography, TextAnimate |
| `src/cv/sections/Work/Work.tsx` | Checkpoint pulse, `activatedAnchorIds` state, milestone triggers |
| `src/cv/sections/Work/WorkMilestoneDivider.tsx` | Emoji/body split markup + GSAP refs |
| `src/cv/sections/Work/milestone-text.ts` | `splitMilestoneText(text)` pure helper |
| `src/cv/sections/Work/work-colors.ts` | Re-export from `cv-colors.ts` (keep import paths stable) |
| `src/cv/cv.css` | Blue spine/checkpoint CSS overrides |
| `src/app/globals.css` | Tailwind font-family utilities for Spectral/Domine/Quicksand |
| `src/components/ui/text-animate.tsx` | Magic UI component (shadcn add) |
| CV section components | Hero, About, Education, Skills, Contact typography |
| `src/cv/README.md` | Domain docs for colors, logos, animations |

---

## Task 0: Feature branch

**Files:** none (git only)

- [ ] **Step 1: Create and switch to feature branch**

Run from repo root:

```bash
git checkout -b feat/cv-visual-polish
```

Expected: `On branch feat/cv-visual-polish`

---

## Task 1: CV color tokens

**Files:**
- Create: `src/cv/cv-colors.ts`
- Create: `src/cv/__tests__/cv-colors.test.ts`
- Modify: `src/cv/sections/Work/work-colors.ts`
- Modify: `src/cv/cv.css`

- [ ] **Step 1: Write the failing test**

Create `src/cv/__tests__/cv-colors.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { CV_COLORS, workSpineFill, workSpineTrack } from "@/cv/cv-colors";

describe("cv-colors", () => {
  it("exports PDF brand hex values", () => {
    expect(CV_COLORS.accent).toBe("#3c78d8");
    expect(CV_COLORS.foreground).toBe("#2d2a24");
    expect(CV_COLORS.muted).toBe("#6c6965");
    expect(CV_COLORS.mutedAlt).toBe("#6d6964");
    expect(CV_COLORS.spineTrack).toBe("#c5d9f5");
  });

  it("exports blue-derived spine tailwind classes", () => {
    expect(workSpineTrack).toContain("c5d9f5");
    expect(workSpineFill).toContain("3c78d8");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run src/cv/__tests__/cv-colors.test.ts`

Expected: FAIL — cannot find module `@/cv/cv-colors`

- [ ] **Step 3: Implement `cv-colors.ts` and migrate `work-colors.ts`**

Create `src/cv/cv-colors.ts`:

```ts
/** PDF / web CV brand palette */
export const CV_COLORS = {
  accent: "#3c78d8",
  foreground: "#2d2a24",
  muted: "#6c6965",
  mutedAlt: "#6d6964",
  spineTrack: "#c5d9f5",
} as const;

/** Tailwind arbitrary-value helpers (text) */
export const cvTextAccent = "text-[#3c78d8]";
export const cvTextForeground = "text-[#2d2a24]";
export const cvTextMuted = "text-[#6c6965]";
export const cvTextMutedAlt = "text-[#6d6964]";

/** Tailwind arbitrary-value helpers (background / border) */
export const cvBgForeground = "bg-[#2d2a24]";
export const cvBgAccent = "bg-[#3c78d8]";
export const cvBorderAccent = "border-[#3c78d8]";

/** Work timeline — collapsed card */
export const workCardCollapsed =
  "bg-white border border-neutral-200 shadow-sm";

/** Work timeline — expanded card */
export const workCardExpanded = `${cvBgForeground} border-[#2d2a24] shadow-md`;

export const workMeta = cvTextMuted;
export const workMetaOnDark = cvTextMuted;

export const workTitle = `${cvTextAccent} font-bold uppercase`;
export const workSubtitle = `${cvTextMuted} font-bold`;

export const workBody = `${cvTextMuted} font-normal`;

export const workBadge =
  "bg-neutral-100 text-neutral-800 border-transparent hover:bg-neutral-100";
export const workBadgeOnDark =
  "bg-neutral-100 text-neutral-900 border-transparent hover:bg-neutral-100";

export const workDatePillDefault =
  "cv-date-pill bg-neutral-200 text-neutral-700 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap transition-colors duration-300";

export const workSpineTrack = "bg-[#c5d9f5]";
export const workSpineFill = "bg-[#3c78d8]";
```

Replace `src/cv/sections/Work/work-colors.ts` contents with:

```ts
/** @deprecated Import from `@/cv/cv-colors` for new code. Re-exported for Work section imports. */
export {
  CV_COLORS,
  cvBgAccent,
  cvBgForeground,
  cvBorderAccent,
  cvTextAccent,
  cvTextForeground,
  cvTextMuted,
  cvTextMutedAlt,
  workBadge,
  workBadgeOnDark,
  workBody,
  workCardCollapsed,
  workCardExpanded,
  workDatePillDefault,
  workMeta,
  workMetaOnDark,
  workSpineFill,
  workSpineTrack,
  workSubtitle,
  workTitle,
} from "@/cv/cv-colors";
```

Update `src/cv/cv.css` checkpoint/spine rules — replace hardcoded `#171717` reached states with `#3c78d8`, track neutrals with `#c5d9f5` / `#e5e5e5`:

```css
.cv-work-checkpoint.cv-checkpoint-reached .cv-timeline-node-inner {
  background-color: #3c78d8;
}

.cv-work-checkpoint.cv-checkpoint-reached .cv-date-pill {
  background-color: #3c78d8;
  color: #ffffff;
}

.cv-work-checkpoint .cv-timeline-node-ping {
  background-color: #3c78d8;
}
```

(Keep unreached grays as-is; ensure ping is visible only when reached per existing selectors.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:run src/cv/__tests__/cv-colors.test.ts`

Expected: PASS (2 tests)

- [ ] **Step 5: Run full test suite**

Run: `pnpm test:run`

Expected: all tests PASS (update `Work.test.tsx` expanded-card class assertion if `bg-neutral-900` → `bg-[#2d2a24]` in Task 5)

- [ ] **Step 6: Commit**

```bash
git add src/cv/cv-colors.ts src/cv/__tests__/cv-colors.test.ts src/cv/sections/Work/work-colors.ts src/cv/cv.css
git commit -m "$(cat <<'EOF'
feat(cv): add PDF brand color tokens and blue timeline spine

EOF
)"
```

---

## Task 2: Font utilities in Tailwind

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/cv/__tests__/font-utilities.test.ts` (smoke — optional class presence via rendered Hero in Task 3)

- [ ] **Step 1: Add font-family theme entries**

In `src/app/globals.css` `@theme inline` block, add:

```css
  --font-family-spectral: var(--font-spectral), Georgia, serif;
  --font-family-domine: var(--font-domine), Georgia, serif;
  --font-family-quicksand: var(--font-quicksand), sans-serif;
```

This enables `font-spectral`, `font-domine`, `font-quicksand` utilities in Tailwind v4.

- [ ] **Step 2: Verify build**

Run: `pnpm build`

Expected: compiles without CSS errors

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "$(cat <<'EOF'
chore(cv): expose Spectral, Domine, Quicksand Tailwind font utilities

EOF
)"
```

---

## Task 3: Hero typography

**Files:**
- Modify: `src/cv/sections/Hero/Hero.tsx`
- Modify: `src/cv/sections/Hero/__tests__/Hero.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append to `src/cv/sections/Hero/__tests__/Hero.test.tsx`:

```tsx
  it("styles kicker and role in uppercase Spectral blue", () => {
    renderWithProviders(<Hero />);
    const kicker = screen.getByText(RESUME.hero.kicker);
    const role = screen.getByText(RESUME.hero.role);
    for (const el of [kicker, role]) {
      expect(el).toHaveClass("font-spectral");
      expect(el).toHaveClass("text-[#3c78d8]");
      expect(el).toHaveClass("uppercase");
    }
    expect(role).toHaveClass("font-bold");
  });

  it("styles name in Domine foreground", () => {
    renderWithProviders(<Hero />);
    const name = screen.getByRole("heading", { level: 1 });
    expect(name).toHaveClass("font-domine");
    expect(name).toHaveClass("text-[#2d2a24]");
  });

  it("styles blurb in bold Quicksand mutedAlt", () => {
    renderWithProviders(<Hero />);
    const blurb = screen.getByText(RESUME.hero.blurb);
    expect(blurb).toHaveClass("font-quicksand");
    expect(blurb).toHaveClass("font-bold");
    expect(blurb).toHaveClass("text-[#6d6964]");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:run src/cv/sections/Hero/__tests__/Hero.test.tsx`

Expected: FAIL — missing classes

- [ ] **Step 3: Update Hero component**

In `src/cv/sections/Hero/Hero.tsx`, apply classes:

```tsx
<h1 className="text-3xl md:text-4xl font-domine text-[#2d2a24] tracking-tight">
  {name}
</h1>
<p className="text-base font-spectral font-bold uppercase text-[#3c78d8]">{role}</p>
<p className="text-sm font-spectral uppercase text-[#3c78d8]">{kicker}</p>
<p className="text-sm text-[#6c6965]">{location}</p>
<p className="text-sm font-quicksand font-bold text-[#6d6964] mt-2">{blurb}</p>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test:run src/cv/sections/Hero/__tests__/Hero.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Hero/Hero.tsx src/cv/sections/Hero/__tests__/Hero.test.tsx
git commit -m "$(cat <<'EOF'
feat(cv): match Hero typography to PDF brand fonts and colors

EOF
)"
```

---

## Task 4: Section headings & body tokens (About, Education, Skills, Contact)

**Files:**
- Modify: `src/cv/sections/About/About.tsx`
- Modify: `src/cv/sections/Education/Education.tsx`
- Modify: `src/cv/sections/Skills/Skills.tsx`
- Modify: `src/cv/sections/Contact/Contact.tsx`
- Modify: section `__tests__` files as needed

- [ ] **Step 1: Write failing test for About h2**

In `src/cv/sections/About/__tests__/About.test.tsx`, add:

```tsx
  it("uses Domine foreground for section heading", () => {
    renderWithProviders(<About />);
    expect(screen.getByRole("heading", { level: 2, name: /about/i })).toHaveClass(
      "font-domine",
      "text-[#2d2a24]",
    );
  });
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm test:run src/cv/sections/About/__tests__/About.test.tsx`

- [ ] **Step 3: Apply shared section patterns**

**About** — h2 + paragraphs:

```tsx
<h2 className="text-xl font-domine text-[#2d2a24] tracking-tight">About</h2>
<p className="text-sm font-quicksand text-[#6d6964] leading-relaxed">
```

**Education** — h2 Domine; school `font-quicksand font-bold text-[#2d2a24]`; degree/period muted.

**Skills** — h2 Domine (find existing h2 in `Skills.tsx`); keep card internals unchanged unless they use `neutral-900` headings — use `text-[#2d2a24]` for skill names.

**Contact** — h2 Domine; body `font-quicksand text-[#6d6964]`; links `text-[#3c78d8]`.

**Work** section h2 (in `Work.tsx`):

```tsx
<h2 className="text-xl font-domine text-[#2d2a24] tracking-tight">
  Work Experience
</h2>
```

- [ ] **Step 4: Run affected tests**

Run: `pnpm test:run src/cv/sections/About src/cv/sections/Education src/cv/sections/Skills src/cv/sections/Contact`

Expected: PASS (add minimal assertions to Education/Contact tests mirroring About if missing)

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/About src/cv/sections/Education src/cv/sections/Skills src/cv/sections/Contact src/cv/sections/Work/Work.tsx
git commit -m "$(cat <<'EOF'
feat(cv): apply Domine section headings and Quicksand body tokens

EOF
)"
```

---

## Task 5: Company logo map + component

**Files:**
- Create: `src/cv/company-logos.ts`
- Create: `src/cv/sections/Work/CompanyLogo.tsx`
- Create: `src/cv/sections/Work/__tests__/CompanyLogo.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/cv/sections/Work/__tests__/CompanyLogo.test.tsx`:

```tsx
import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { companyLogoSrc } from "@/cv/company-logos";
import { renderWithProviders, screen } from "@/test/render";

import { CompanyLogo } from "../CompanyLogo";

describe("companyLogoSrc", () => {
  it("maps every work experience company to an existing public asset", () => {
    for (const entry of RESUME.workExperience) {
      const src = companyLogoSrc(entry.company);
      expect(src, entry.company).toBeDefined();
      const file = path.join(process.cwd(), "public", src!.replace(/^\//, ""));
      expect(existsSync(file), `${entry.company} → ${src}`).toBe(true);
    }
  });
});

describe("CompanyLogo", () => {
  it("renders a square logo without a background wrapper", () => {
    renderWithProviders(<CompanyLogo company="Pinterest" />);
    const img = screen.getByRole("presentation");
    expect(img).toHaveAttribute("src", "/cv/companies/pinterest.jpg");
    expect(img).toHaveClass("w-12", "h-12", "md:w-[60px]", "md:h-[60px]", "object-contain");
    expect(img.parentElement).not.toHaveClass("bg-white");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm test:run src/cv/sections/Work/__tests__/CompanyLogo.test.tsx`

- [ ] **Step 3: Implement map + component**

Create `src/cv/company-logos.ts`:

```ts
const COMPANY_LOGO: Record<string, string> = {
  Pinterest: "/cv/companies/pinterest.jpg",
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

export const companyLogoSrc = (company: string): string | undefined =>
  COMPANY_LOGO[company];
```

Create `src/cv/sections/Work/CompanyLogo.tsx`:

```tsx
import { companyLogoSrc } from "@/cv/company-logos";

type Props = { company: string; className?: string };

export const CompanyLogo = ({ company, className = "" }: Props) => {
  const src = companyLogoSrc(company);
  if (!src) return null;

  return (
    // biome-ignore lint/performance/noImgElement: static public logo; next/image overhead unjustified
    <img
      src={src}
      alt=""
      role="presentation"
      className={`w-12 h-12 md:w-[60px] md:h-[60px] object-contain shrink-0 ${className}`}
    />
  );
};
```

- [ ] **Step 4: Run test — expect PASS**

Run: `pnpm test:run src/cv/sections/Work/__tests__/CompanyLogo.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/cv/company-logos.ts src/cv/sections/Work/CompanyLogo.tsx src/cv/sections/Work/__tests__/CompanyLogo.test.tsx
git commit -m "$(cat <<'EOF'
feat(cv): add company logo map and CompanyLogo component

EOF
)"
```

---

## Task 6: Work accordion header restructure

**Files:**
- Create: `src/cv/sections/Work/work-copy.ts`
- Create: `src/cv/sections/Work/__tests__/work-copy.test.ts`
- Modify: `src/cv/sections/Work/WorkTimelineItem.tsx`
- Modify: `src/cv/sections/Work/__tests__/Work.test.tsx`

- [ ] **Step 1: Write failing tests for copy helpers**

Create `src/cv/sections/Work/__tests__/work-copy.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";

import { workEntryMetadata, workEntryTitle } from "../work-copy";

describe("work-copy", () => {
  it("formats PDF-style title with quoted company and optional via", () => {
    const pinterest = RESUME.workExperience[0];
    expect(workEntryTitle(pinterest)).toBe(
      'Senior Software Engineer at "Pinterest" (via nearshore agency)',
    );
  });

  it("formats metadata with workMode and date range", () => {
    const pinterest = RESUME.workExperience[0];
    expect(workEntryMetadata(pinterest)).toBe(
      `(remote) ${pinterest.startDate} – ${pinterest.endDate}`,
    );
  });
});
```

Add to `Work.test.tsx`:

```tsx
  it("renders PDF-style title and metadata in accordion header", () => {
    renderWithProviders(<Work />);
    const first = RESUME.workExperience[0];
    const card = screen.getByTestId(`work-entry-${first.company}`);
    expect(
      within(card).getByText(
        'Senior Software Engineer at "Pinterest" (via nearshore agency)',
      ),
    ).toBeInTheDocument();
    expect(
      within(card).getByText(`(remote) ${first.startDate} – ${first.endDate}`),
    ).toBeInTheDocument();
  });

  it("renders company logo in accordion trigger", () => {
    renderWithProviders(<Work />);
    const card = screen.getByTestId("work-entry-Pinterest");
    const img = within(card).getByRole("presentation");
    expect(img).toHaveAttribute("src", "/cv/companies/pinterest.jpg");
  });

  it("applies Quicksand blue title and gray bold metadata classes", () => {
    renderWithProviders(<Work />);
    const card = screen.getByTestId("work-entry-Pinterest");
    const title = within(card).getByText(/Senior Software Engineer at "Pinterest"/);
    expect(title).toHaveClass("font-quicksand", "text-[#3c78d8]", "font-bold", "uppercase");
  });
```

Update expanded-card test to:

```tsx
    expect(card.querySelector("[data-slot=card]")).toHaveClass("bg-[#2d2a24]");
```

Remove/update test that expects company name alone as primary bold text.

- [ ] **Step 2: Run tests — expect FAIL**

Run: `pnpm test:run src/cv/sections/Work/__tests__/work-copy.test.ts src/cv/sections/Work/__tests__/Work.test.tsx`

- [ ] **Step 3: Implement work-copy + restructure WorkTimelineItem**

Create `src/cv/sections/Work/work-copy.ts`:

```ts
import type { WorkExperience } from "@/cv/types";

export const workEntryTitle = (entry: WorkExperience): string => {
  const viaSuffix = entry.via ? ` (${entry.via})` : "";
  return `${entry.role} at "${entry.company}"${viaSuffix}`;
};

export const workEntryMetadata = (entry: WorkExperience): string =>
  `(${entry.workMode}) ${entry.startDate} – ${entry.endDate}`;
```

In `WorkTimelineItem.tsx`:

- Import `CompanyLogo`, `workEntryTitle`, `workEntryMetadata`, `workTitle`, `workSubtitle`, `workBody` from cv-colors.
- Replace header layout:

```tsx
<AccordionTrigger ... className="... focus-visible:ring-[#3c78d8] ...">
  <div className="flex items-start gap-3 text-left w-full pr-2">
    <CompanyLogo company={entry.company} />
    <div className="flex flex-col gap-1 min-w-0 flex-1">
      <span className={`text-sm ${workTitle}`}>{workEntryTitle(entry)}</span>
      <span className={`text-xs ${workSubtitle}`}>
        {workEntryMetadata(entry)}
      </span>
      {!suppressMobilePeriod && (
        <span className={`text-xs ${workSubtitle} md:hidden`}>
          {workEntryMetadata(entry)}
        </span>
      )}
    </div>
  </div>
</AccordionTrigger>
```

Remove old `metadataLine` for header (keep for nothing — delete unused helper).

Accordion content:

```tsx
<p className={`text-sm mb-3 ${workBody}`}>{entry.description}</p>
<ul className={`list-disc list-outside ml-5 text-sm space-y-1 mb-4 ${workBody}`}>
```

Expanded trigger hover: use `hover:bg-[#2d2a24]/90` instead of neutral-800; chevron `text-[#6c6965]`.

Remove white/dark text color inversion on title when open — always blue title per spec.

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm test:run src/cv/sections/Work/__tests__/`

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/work-copy.ts src/cv/sections/Work/__tests__/work-copy.test.ts src/cv/sections/Work/WorkTimelineItem.tsx src/cv/sections/Work/__tests__/Work.test.tsx
git commit -m "$(cat <<'EOF'
feat(cv): restructure work accordion header to PDF copy with logos

EOF
)"
```

---

## Task 7: Install Magic UI TextAnimate

**Files:**
- Modify: `components.json`
- Create: `src/components/ui/text-animate.tsx` (via CLI)
- Modify: `package.json`

- [ ] **Step 1: Add Magic UI registry**

In `components.json`, set:

```json
  "registries": {
    "@magicui": "https://magicui.design/r/{name}.json"
  }
```

- [ ] **Step 2: Install component**

Run:

```bash
pnpm dlx shadcn@latest add @magicui/text-animate --yes
```

Expected: creates `src/components/ui/text-animate.tsx`, adds `framer-motion` to `package.json`

- [ ] **Step 3: Verify build**

Run: `pnpm build`

Expected: success

- [ ] **Step 4: Commit**

```bash
git add components.json package.json pnpm-lock.yaml src/components/ui/text-animate.tsx src/lib/utils.ts
git commit -m "$(cat <<'EOF'
chore(cv): add Magic UI TextAnimate component and framer-motion

EOF
)"
```

(Include any files the shadcn CLI touches.)

---

## Task 8: Checkpoint activation — GSAP pulse + TextAnimate wiring

**Files:**
- Modify: `src/cv/sections/Work/Work.tsx`
- Modify: `src/cv/sections/Work/WorkTimelineItem.tsx`
- Modify: `src/cv/sections/Work/__tests__/Work.test.tsx`

- [ ] **Step 1: Write failing test for activation props**

Add to `Work.test.tsx`:

```tsx
  it("passes showHeaderAnimation after checkpoint is reached", () => {
    renderWithProviders(<Work />);
    const first = RESUME.workExperience[0];
    const row = screen
      .getByTestId(`work-timeline-node-${workEntryAnchorId(first)}`)
      .closest(".cv-work-checkpoint");
    row?.classList.add("cv-checkpoint-reached");
    // After integration: data-animate-header="true" on work item
    const card = screen.getByTestId(`work-entry-${first.company}`);
    expect(card).toHaveAttribute("data-header-animated", "true");
  });
```

(Implement using `data-header-animated` attribute set from `activatedAnchorIds`.)

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Extend `syncCheckpointStates` in `Work.tsx`**

Add callback parameter:

```ts
const syncCheckpointStates = (
  timeline: HTMLElement,
  progress: number,
  onNewlyReached?: (checkpointId: string) => void,
): void => {
  ...
  for (const row of ...) {
    ...
    const wasReached = row.classList.contains("cv-checkpoint-reached");
    const reached = fillEdge >= nodeCenterY;
    row.classList.toggle("cv-checkpoint-reached", reached);
    if (!wasReached && reached) {
      const id = row.getAttribute("data-checkpoint-id");
      if (id) onNewlyReached?.(id);
    }
  }
};
```

In `Work` component:

```tsx
const [activatedAnchorIds, setActivatedAnchorIds] = useState<ReadonlySet<string>>(
  () => new Set(),
);
const firedPulseRef = useRef<Set<string>>(new Set());

const handleCheckpointReached = useCallback((checkpointId: string) => {
  setActivatedAnchorIds((prev) => {
    if (prev.has(checkpointId)) return prev;
    return new Set(prev).add(checkpointId);
  });
}, []);
```

Inside GSAP `onUpdate`:

```ts
onUpdate: (self) => {
  syncCheckpointStates(timeline, self.progress, (id) => {
    handleCheckpointReached(id);
    if (firedPulseRef.current.has(id)) return;
    firedPulseRef.current.add(id);
    const row = timeline.querySelector<HTMLElement>(
      `[data-checkpoint-id="${id}"]`,
    );
    const card = row?.querySelector<HTMLElement>("[data-slot=card]");
    if (card) {
      gsap.fromTo(
        card,
        { scale: 1 },
        { scale: 1.03, duration: 0.35, yoyo: true, repeat: 1, ease: "power2.out" },
      );
    }
  });
},
```

Pass through `TimelineEntryRow` → `WorkTimelineItem`:

```tsx
showHeaderAnimation={activatedAnchorIds.has(workEntryAnchorId(entry))}
showBodyAnimation={activatedAnchorIds.has(workEntryAnchorId(entry)) && isOpen}
```

On `WorkTimelineItem` root div:

```tsx
data-header-animated={showHeaderAnimation ? "true" : undefined}
```

- [ ] **Step 4: Integrate TextAnimate in `WorkTimelineItem.tsx`**

```tsx
import { TextAnimate } from "@/components/ui/text-animate";

type Props = {
  ...
  showHeaderAnimation?: boolean;
  showBodyAnimation?: boolean;
};

const AnimatedLine = ({
  animate,
  animation,
  by,
  className,
  children,
}: {
  animate: boolean;
  animation: "blurInUp" | "fadeIn";
  by: "word" | "line";
  className?: string;
  children: string;
}) =>
  animate ? (
    <TextAnimate
      animation={animation}
      by={by}
      once
      startOnView={false}
      className={className}
    >
      {children}
    </TextAnimate>
  ) : (
    <span className={className}>{children}</span>
  );
```

Use for title, metadata, description, and each bullet string.

Respect reduced motion: parent `Work.tsx` already gates GSAP in matchMedia; pass `showHeaderAnimation={false}` and `showBodyAnimation={false}` in reduce branch by not adding ids to set (checkpoint still marks reached via CSS).

- [ ] **Step 5: Run tests**

Run: `pnpm test:run src/cv/sections/Work/__tests__/Work.test.tsx`

Fix test: after render, manually dispatch scroll isn't needed — simulate by calling class add AND triggering state. **Easier approach:** export a test hook or simulate by re-rendering Work with mocked callback. **Pragmatic test:** unit-test that `WorkTimelineItem` sets `data-header-animated` when prop true:

Add `WorkTimelineItem.test.tsx`:

```tsx
renderWithProviders(
  <WorkTimelineItem entry={RESUME.workExperience[0]} isOpen={false} showHeaderAnimation />,
);
expect(screen.getByTestId("work-entry-Pinterest")).toHaveAttribute(
  "data-header-animated",
  "true",
);
```

Remove flaky scroll integration test if needed; keep item-level test.

- [ ] **Step 6: Run full suite**

Run: `pnpm test:run`

- [ ] **Step 7: Commit**

```bash
git add src/cv/sections/Work/Work.tsx src/cv/sections/Work/WorkTimelineItem.tsx src/cv/sections/Work/__tests__/
git commit -m "$(cat <<'EOF'
feat(cv): pulse and TextAnimate on timeline checkpoint activation

EOF
)"
```

---

## Task 9: Milestone celebration animation

**Files:**
- Create: `src/cv/sections/Work/milestone-text.ts`
- Create: `src/cv/sections/Work/__tests__/milestone-text.test.ts`
- Modify: `src/cv/sections/Work/WorkMilestoneDivider.tsx`
- Modify: `src/cv/sections/Work/Work.tsx`
- Modify: `src/cv/sections/Work/__tests__/WorkMilestoneDivider.test.tsx`

- [ ] **Step 1: Write failing tests**

`milestone-text.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { splitMilestoneText } from "../milestone-text";

describe("splitMilestoneText", () => {
  it("splits leading emoji from body", () => {
    expect(splitMilestoneText("🎉 2016 — Ascended to senior")).toEqual({
      emoji: "🎉",
      body: "2016 — Ascended to senior",
    });
  });

  it("returns empty emoji when none present", () => {
    expect(splitMilestoneText("2016 — text")).toEqual({
      emoji: "",
      body: "2016 — text",
    });
  });
});
```

`WorkMilestoneDivider.test.tsx` add:

```tsx
  it("renders emoji and body in separate spans for animation targets", () => {
    renderWithProviders(
      <WorkMilestoneDivider text="⭐ 2017 — Career achievement" />,
    );
    expect(screen.getByTestId("milestone-emoji")).toHaveTextContent("⭐");
    expect(screen.getByTestId("milestone-body")).toHaveTextContent(/2017/);
  });
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement split + divider markup**

`milestone-text.ts`:

```ts
export const splitMilestoneText = (
  text: string,
): { emoji: string; body: string } => {
  const match = text.match(/^(\p{Extended_Pictographic}+)\s*(.*)$/u);
  if (!match) return { emoji: "", body: text };
  return { emoji: match[1], body: match[2] };
};
```

`WorkMilestoneDivider.tsx`:

```tsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { splitMilestoneText } from "./milestone-text";

type Props = { text: string };

export const WorkMilestoneDivider = ({ text }: Props) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLSpanElement>(null);
  const { emoji, body } = splitMilestoneText(text);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (!rootRef.current || !emojiRef.current || !bodyRef.current) return;

      gsap.set([emojiRef.current, bodyRef.current], { opacity: 0 });
      if (emoji) gsap.set(emojiRef.current, { scale: 0, rotation: -20 });
      gsap.set(bodyRef.current, { y: 8 });

      gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 70%",
          once: true,
        },
      })
        .to(emojiRef.current, {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.7,
          ease: "back.out(1.7)",
        })
        .to(
          bodyRef.current,
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
          emoji ? "-=0.35" : 0,
        );
    });
    return () => mm.revert();
  }, [emoji, body]);

  return (
    <div
      ref={rootRef}
      className="relative z-10 w-full py-10 md:py-12 bg-white"
      data-testid="work-milestone"
      role="note"
      aria-label={text}
    >
      <p className="text-center text-sm italic font-spectral text-[#6c6965] px-6">
        {emoji ? (
          <span ref={emojiRef} data-testid="milestone-emoji" className="inline-block mr-1">
            {emoji}
          </span>
        ) : null}
        <span ref={bodyRef} data-testid="milestone-body">
          {body}
        </span>
      </p>
    </div>
  );
};
```

Register `ScrollTrigger` in `WorkMilestoneDivider` or ensure `Work.tsx` already registers it (it does).

For reduced motion: skip `useGSAP` animation branch — text visible by default (no initial `opacity: 0` in reduce branch).

- [ ] **Step 4: Run tests**

Run: `pnpm test:run src/cv/sections/Work/__tests__/milestone-text.test.ts src/cv/sections/Work/__tests__/WorkMilestoneDivider.test.tsx`

Note: jsdom may not fully run ScrollTrigger; tests focus on markup split, not animation playback.

- [ ] **Step 5: Commit**

```bash
git add src/cv/sections/Work/milestone-text.ts src/cv/sections/Work/__tests__/milestone-text.test.ts src/cv/sections/Work/WorkMilestoneDivider.tsx src/cv/sections/Work/__tests__/WorkMilestoneDivider.test.tsx
git commit -m "$(cat <<'EOF'
feat(cv): milestone emoji pop and text reveal on scroll

EOF
)"
```

---

## Task 10: Domain README + final verification

**Files:**
- Modify: `src/cv/README.md`

- [ ] **Step 1: Update README**

Add sections documenting:

- `cv-colors.ts` tokens and when to use each font
- `company-logos.ts` / adding a new company logo file
- Checkpoint animation behavior (once, reduced motion)
- Milestone animation behavior
- Magic UI `TextAnimate` dependency

- [ ] **Step 2: Run full verification**

```bash
pnpm lint
pnpm test:run
pnpm build
```

Expected: all pass

- [ ] **Step 3: Manual QA checklist**

- [ ] `/cv` Hero: uppercase blue kicker/role, bold Quicksand blurb
- [ ] Work cards: logo 60px, PDF title/metadata colors, blue spine on scroll
- [ ] Scroll checkpoint: card pulse once, header text animates
- [ ] Open accordion then scroll to entry: body lines animate
- [ ] Milestone scroll: emoji pop + text fade
- [ ] `prefers-reduced-motion`: no pulse/TextAnimate/milestone GSAP

- [ ] **Step 4: Commit**

```bash
git add src/cv/README.md
git commit -m "$(cat <<'EOF'
docs(cv): document visual polish colors, logos, and scroll animations

EOF
)"
```

---

## Plan self-review

| Spec requirement | Task |
|------------------|------|
| Logo 60/48px, no white square | Task 5 |
| PDF header copy | Task 6 |
| Blue timeline spine | Task 1 |
| Checkpoint pulse + TextAnimate B | Task 7, 8 |
| Milestone emoji pop B | Task 9 |
| Hero uppercase/bold tweaks | Task 3 |
| Section typography | Task 4 |
| cv-colors tokens | Task 1 |
| Tests | Each task |
| README | Task 10 |
| framer-motion / Magic UI | Task 7 |
| Reduced motion | Tasks 8, 9 (matchMedia) |
| No auto-expand | Task 8 (body gated on `isOpen`) |

No TBD placeholders remain. Date strings use existing `startDate`/`endDate` from data (out of scope per spec).

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-15-cv-visual-polish.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration  
2. **Inline Execution** — run tasks in this session using executing-plans, batch execution with checkpoints  

Which approach?
