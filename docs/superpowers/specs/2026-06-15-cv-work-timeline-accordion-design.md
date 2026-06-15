# CV Work Experience — Timeline + Accordion Design

**Date:** 2026-06-15
**Status:** Approved

## Problem

The Work Experience section renders all entry content (description, bullets, technology badges) as permanently visible flat text blocks. With 16 entries spanning 14 years, the section is dense and hard to scan. It also doesn't communicate career progression visually or show employer identity through logos.

## Goals

- Present work entries on a vertical timeline (Mantine `Timeline`), ordered most-recent-first with milestones interleaved as today
- Show company logos alongside each entry header
- Hide long-form detail behind Mantine `Accordion` panels (collapsed by default)
- Preserve existing deep-link behavior — anchor IDs, scroll-to, flash animation, auto-expand on navigation from Skills section

## Out of Scope

- Editing work experience copy in `data.ts`
- Changes to other CV sections beyond preserving cross-section navigation
- Sourcing or producing company logo artwork (assumed supplied separately)
- Animations or timeline styling beyond Mantine defaults

---

## Architecture

### Approach

Mantine `Timeline` wraps all interleaved items (work entries and milestones). Work entries use `Timeline.Item` with a `CompanyLogo` node in the `bullet` prop and a controlled `Accordion` in the item body. Milestones use `Timeline.Item` with a small neutral dot bullet and italic grey text — no accordion.

Each work `Timeline.Item` body contains its own `Accordion` instance (Mantine's `Accordion.Item` must be a direct child of `Accordion`, so one per entry is required). The `Work` component owns `openValue: string | null` state. Each entry's `Accordion` receives `value={openValue === anchorId ? anchorId : null}` and `onChange={(val) => setOpenValue(val)}`, ensuring only one panel is ever open at a time across all entries.

### Component Tree

```
Work (owns openValue state + cv:open-work-entry event listener)
└── Timeline (Mantine)
    ├── Timeline.Item [bullet=<CompanyLogo company="Pinterest" />]
    │   └── Accordion (value=openValue, onChange=setOpenValue)
    │       └── Accordion.Item value="work-pinterest-aug-2024"
    │           ├── Accordion.Control  ← id anchor, company name, role, dates, metadata
    │           └── Accordion.Panel   ← description, bullet list, tech badges
    ├── Timeline.Item [bullet=<MilestoneDot />]
    │   └── <p> italic grey text
    └── … (repeated per interleaved item)
```

---

## Components

### `CompanyLogo`

**Location:** `src/cv/sections/Work/CompanyLogo.tsx`

Renders a fixed-size circle (24×24px). Internally tracks `hasError: boolean` state. When a logo path exists in `COMPANY_LOGOS` and `hasError` is false, renders `<Image src={path} width={24} height={24} alt={company} onError={() => setHasError(true)} />` from `next/image`. When the path is absent from the lookup table or `hasError` is true, renders an initials circle instead: first letter of each word in the company name, max 2 characters, neutral grey background (`bg-neutral-200`), dark text.

Props: `{ company: string }`

Uses `next/image` for performance (lazy loading, format optimisation, layout stability). The `onError` callback flips `hasError` to true, causing React to unmount the `<Image>` and mount the initials circle on the next render.

### `CompanyLogos` lookup table

**Location:** `src/cv/sections/Work/company-logos.ts`

```ts
export const COMPANY_LOGOS: Record<string, string> = {
  Pinterest:          "/cv/companies/pinterest.png",
  "Blue Yonder":      "/cv/companies/blue-yonder.png",
  Hrizn:              "/cv/companies/hrizn.png",
  PairTree:           "/cv/companies/pairtree.png",
  PureCars:           "/cv/companies/purecars.png",
  "Radical Imaging":  "/cv/companies/radical-imaging.png",
  "Écolheita":        "/cv/companies/ecolheita.png",
  "Quero Educação":   "/cv/companies/quero-educacao.png",
  "Spark Networks":   "/cv/companies/spark-networks.png",
  "Daitan Group":     "/cv/companies/daitan-group.png",
  Dextra:             "/cv/companies/dextra.png",
  "Coyô":             "/cv/companies/coyo.png",
  "CI&T":             "/cv/companies/ciandt.png",
  ACTi:               "/cv/companies/acti.png",
  VPSA:               "/cv/companies/vpsa.png",
  Dash:               "/cv/companies/dash.png",
};
```

Logo assets live in `public/cv/companies/`. Keys match `WorkExperience.company` exactly. To add a logo: drop the file in `public/cv/companies/` and add the key here. No changes to `data.ts` or `types.ts` required.

### `MilestoneDot`

A small (8×8px) neutral grey circle used as the `bullet` prop on milestone `Timeline.Item` nodes. Inline, no separate file — defined at the top of `Work.tsx`.

---

## Data Model

`WorkExperience` type and `RESUME` data object are **unchanged**. Logos are a presentation concern and are not added to the data layer.

---

## Deep-link & Auto-expand Wiring

### Anchor placement

`id={workEntryAnchorId(entry)}` and `scroll-mt-24` move from the outer `<article>` to the `Accordion.Control` element. This ensures `scrollIntoView` and the `cv-flash` animation target the visible header row.

### `scrollToWorkEntry` (anchors.ts)

After scrolling and triggering the flash, dispatches a custom DOM event:

```ts
document.dispatchEvent(
  new CustomEvent('cv:open-work-entry', { detail: workEntryAnchorId(entry) })
);
```

The function signature is unchanged. No coupling to React state or the Work component.

### `Work` component event listener

```ts
const [openValue, setOpenValue] = useState<string | null>(null);

useEffect(() => {
  const handler = (e: Event) => {
    setOpenValue((e as CustomEvent<string>).detail);
  };
  document.addEventListener('cv:open-work-entry', handler);
  return () => document.removeEventListener('cv:open-work-entry', handler);
}, []);
```

When the Skills modal fires `scrollToWorkEntry`, the entry scrolls into view, flashes yellow, and its accordion panel opens automatically. The accordion value matches the anchor ID directly — no extra translation needed.

---

## Milestone Rendering

Milestones appear as `Timeline.Item` nodes with:
- `bullet` prop: `<MilestoneDot />` — an 8×8px neutral grey circle
- Body: `<p>` in italic grey (`text-xs italic text-neutral-400`) containing the milestone text

Milestones have no accordion. They are visually subordinate to work entries — same vertical line, smaller dot, lighter text. The `interleave()` function in `Work.tsx` is unchanged.

---

## Edge Cases

| Scenario | Behaviour |
|---|---|
| Logo path missing from `COMPANY_LOGOS` | `CompanyLogo` renders initials circle; timeline layout unaffected |
| Logo image fails to load (`onError`) | `CompanyLogo` sets `hasError=true`; React unmounts the `next/image` and renders the initials circle |
| Deep-link with no matching entry | `setOpenValue` called with an ID that matches no `Accordion.Item` value — accordion stays closed, no error |
| Reduced-motion preference | `scrollToWorkEntry` already gates smooth scroll and flash behind `prefers-reduced-motion`; accordion open still fires |
| Narrow viewport | `Accordion.Panel` content wraps naturally; tech badges already use `flex-wrap`; timeline indentation from Mantine is responsive |

---

## Testing

### Updated tests (`Work.test.tsx`)

| Test | Change |
|---|---|
| `"renders every company name"` | Company name is in `Accordion.Control` — assertion unchanged |
| `"renders the first work entry's role, date range, description, and at least one bullet/tech"` | Panel content is in the DOM even when collapsed (Mantine renders it hidden) — `within(card).getByText(...)` unchanged |
| `"anchors each work entry with its workEntryAnchorId"` | `id` attribute now on `Accordion.Control`; assertion target changes but assertion is the same |
| `"renders every milestone text"` | Milestone text now inside a `Timeline.Item` body — `screen.getByText` still finds it |
| `"renders a tech icon inside badges"` | Panel is in DOM when collapsed — unchanged |
| `"still renders badge text for unmapped icons"` | Unchanged |

### New tests

**`Work.test.tsx`:**
- `"opens the correct accordion entry when cv:open-work-entry is dispatched"` — renders `<Work />`, dispatches the custom event with a known anchor ID, asserts the `Accordion.Control` for that entry has `aria-expanded="true"`

**`anchors.test.ts`:**
- `"dispatches cv:open-work-entry after scrolling"` — mocks `getElementById` and `scrollIntoView`, calls `scrollToWorkEntry`, asserts the custom event fires with the correct anchor ID as `detail`

**`CompanyLogo.test.tsx`** (`src/cv/sections/Work/__tests__/CompanyLogo.test.tsx`):
- `"renders an img with the correct src for a known company"` — asserts `<img>` src matches the lookup path
- `"renders initials circle when company is not in COMPANY_LOGOS"` — asserts no `<img>` and initials text is present
- `"renders initials circle on image load error"` — fires `onError` on the `<img>`, asserts fallback appears

---

## File Changelist

| File | Change |
|---|---|
| `src/cv/sections/Work/Work.tsx` | Rewrite: `Timeline` + `Accordion`, `useState`, `useEffect` for event |
| `src/cv/sections/Work/anchors.ts` | Add `CustomEvent` dispatch to `scrollToWorkEntry` |
| `src/cv/sections/Work/company-logos.ts` | **New** — `COMPANY_LOGOS` lookup table |
| `src/cv/sections/Work/CompanyLogo.tsx` | **New** — logo + initials fallback component |
| `src/cv/sections/Work/__tests__/Work.test.tsx` | Update anchor assertions; add auto-expand test |
| `src/cv/sections/Work/__tests__/anchors.test.ts` | Add custom event dispatch assertion |
| `src/cv/sections/Work/__tests__/CompanyLogo.test.tsx` | **New** — logo + fallback tests |
| `public/cv/companies/*.png` | **New** — logo assets (supplied separately) |
| `.gitignore` | Add `.superpowers/` entry |
