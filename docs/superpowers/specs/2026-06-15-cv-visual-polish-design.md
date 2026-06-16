# CV Visual Polish — Design Spec

**Date:** 2026-06-15  
**Status:** Approved (brainstorming)  
**Scope:** Work timeline logos, scroll-driven animations, milestone celebrations, PDF-matching typography & colors across `/cv`.

---

## Summary

Four visual improvements to the web CV, validated via visual companion brainstorming:

1. Company logos in work accordion headers (60 px desktop, 48 px mobile, no background square).
2. GSAP card emphasis + Magic UI `TextAnimate` when a timeline checkpoint activates on scroll.
3. GSAP milestone celebration (emoji pop + text reveal) when milestone dividers enter the scroll path.
4. PDF-aligned typography (Spectral, Domine, Quicksand) and brand colors (`#3c78d8`, `#2d2a24`, `#6c6965`, `#6d6964`) applied across all CV sections, with a blue-derived timeline spine.

---

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Logo size | 60 × 60 px (`md+`), 48 × 48 px mobile, 1:1, **no white square** behind logo |
| Checkpoint animation | **B:** GSAP pulse + header TextAnimate always; body TextAnimate only if accordion already open; no auto-expand; **once** per entry |
| Milestone animation | **B:** Leading emoji spring pop, then text fade-in by line; **once**; skip under `prefers-reduced-motion` |
| Animation orchestration | Extend existing `syncCheckpointStates` + `ScrollTrigger` in `Work.tsx` (Approach 1) |
| Text animation library | Magic UI `TextAnimate` (`framer-motion` dependency) |

---

## Typography & colors

Fonts are already loaded in `src/app/layout.tsx` (`--font-spectral`, `--font-domine`, `--font-quicksand`). This work applies them via Tailwind utilities / `cv-colors.ts` tokens across CV sections.

### Color tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `accent` | `#3c78d8` | Kicker, role line, work card titles, links, spine fill, reached nodes/pills, ping ring |
| `foreground` | `#2d2a24` | Name, section h2s, expanded card background |
| `muted` | `#6c6965` | Work card metadata (bold), description, bullets, milestone text |
| `mutedAlt` | `#6d6964` | Hero blurb |
| `spineTrack` | `#c5d9f5` | Timeline spine track (~light tint of accent) |

Define in `src/cv/cv-colors.ts` (migrate/replace neutral values in `work-colors.ts`).

### Font mapping

| Element | Font | Color | Weight / style |
|---------|------|-------|----------------|
| Hero kicker (`AI-assisted · TypeScript · …`) | Spectral | `#3c78d8` | 400, **uppercase** |
| Hero role (`Senior Software Engineer`) | Spectral | `#3c78d8` | 700, **uppercase** |
| Hero name | Domine | `#2d2a24` | 400 |
| Hero blurb | Quicksand | `#6d6964` | **700 (bold)** |
| Section h2 (`Work Experience`, `About`, …) | Domine | `#2d2a24` | 400 (same feel as name) |
| Work card — all text | Quicksand | — | see rows below |
| Work card title (`SENIOR SOFTWARE ENGINEER at "Pinterest" (via nearshore agency)`) | Quicksand | `#3c78d8` | 700, uppercase |
| Work card metadata (`(remote) Aug of 2024 – May of 2026`) | Quicksand | `#6c6965` | 700 |
| Work description + bullets | Quicksand | `#6c6965` | 400 (not bold) |
| Milestones | Spectral | `#6c6965` | 400, italic |

Apply the same token set to About, Education, Skills, and Contact for consistency (section h2s in Domine; body copy in Quicksand or Spectral as appropriate to match PDF hierarchy).

---

## Company logos

### Asset mapping

Logos live in `public/cv/companies/` (kebab-case filenames). Add `src/cv/company-logos.ts`:

```ts
export const companyLogoSrc = (company: string): string | undefined
```

Map every `RESUME.workExperience[*].company` to its file (handle `pinterest.jpg` vs `.png`, accents like `Écolheita` → `ecolheita.png`, `Coyô` → `coyo.png`, `CI&T` → `ciandt.png`).

Guard test: `src/cv/sections/Work/__tests__/CompanyLogo.test.tsx` — every company in `data.ts` resolves to an existing public asset.

### Component

`src/cv/sections/Work/CompanyLogo.tsx`:

- Renders `<img>` with `object-fit: contain`, square aspect ratio.
- Sizes: `w-12 h-12 md:w-[60px] md:h-[60px]`.
- No wrapper background/border (per user choice).
- `alt=""` decorative (company name remains in visible title text); accordion trigger keeps `aria-label`.

---

## Work accordion header restructure

Replace company-first header with PDF phrasing in `WorkTimelineItem.tsx`:

**Title (blue, bold, uppercase):**  
`{ROLE} at "{company}"{via ? ` (${via})` : ""}`

**Subtitle (gray, bold):**  
`({workMode}) {startDate} – {endDate}` — use PDF-style month formatting where feasible (e.g. `Aug of 2024 – May of 2026`) or keep existing date strings if formatting helper is out of scope; document in plan.

Layout: `[CompanyLogo] [title block]` in a horizontal flex row inside `AccordionTrigger`.

Expanded card (`#2d2a24` background): same text colors (blue title, gray meta/body) — do not invert to white title.

---

## Timeline spine (blue-derived)

Update `src/cv/cv.css` checkpoint/spine rules and `work-colors.ts` exports:

| Part | Before | After |
|------|--------|-------|
| Spine track | `#d4d4d4` / neutral-300 | `#c5d9f5` |
| Spine fill | `#171717` | `#3c78d8` |
| Reached node inner | `#171717` | `#3c78d8` |
| Date pill (reached) | `#171717` bg | `#3c78d8` bg, white text |
| Ping ring | neutral | `#3c78d8` at ~60% opacity |

Unreached nodes/pills stay light gray until checkpoint reached.

---

## Checkpoint activation animation

### Trigger

When `syncCheckpointStates` toggles **on** `.cv-checkpoint-reached` for a row (transition unreached → reached), fire animations **once** per entry. Track fired IDs in a `Set` on the GSAP timeline context to prevent re-fire on scroll up/down.

### GSAP card pulse

Target: `.cv-work-item` card element inside the checkpoint row.

```ts
gsap.fromTo(el, { scale: 1 }, { scale: 1.03, duration: 0.35, yoyo: true, repeat: 1, ease: "power2.out" })
```

Optional subtle blue border glow during pulse (border-color → accent). Skip entirely in `(prefers-reduced-motion: reduce)` matchMedia branch.

### Magic UI TextAnimate

Install: `pnpm dlx shadcn@latest add @magicui/text-animate` (adds `framer-motion`, registers Magic UI in `components.json`).

| Target | Preset | Split | Condition |
|--------|--------|-------|-----------|
| Header title | `blurInUp` | `word` | Always on first activation |
| Header metadata | `blurInUp` | `word` | Always on first activation |
| Description | `fadeIn` | `line` | Only if accordion `isOpen` |
| Each bullet | `fadeIn` | `line` | Only if accordion `isOpen` |

Props: `once`, `startOnView={false}`.

**Activation wiring:** `Work.tsx` keeps `activatedAnchorIds: Set<string>` in React state. When `syncCheckpointStates` detects a row transitioning to `.cv-checkpoint-reached` for the first time, add that entry's anchor id to the set (batched `setState`). Pass `showHeaderAnimation` / `showBodyAnimation` booleans into `WorkTimelineItem`; TextAnimate mounts when the boolean flips true. Body boolean is additionally gated on `isOpen`.

**Reduced motion:** render static text; no TextAnimate mount.

---

## Milestone celebration animation

In `WorkMilestoneDivider.tsx` (or co-located hook used by `Work.tsx`):

1. Register `ScrollTrigger` per `[data-testid="work-milestone"]` row — fire **once** when row crosses ~70% viewport.
2. Split milestone `text` into leading emoji grapheme + remainder (regex: `/^(\p{Extended_Pictographic}+)\s*(.*)/u` or manual slice on first space after emoji).
3. **GSAP emoji:** `scale: 0 → 1`, `rotation: -20 → 0`, spring ease, ~0.7s.
4. **GSAP text:** `opacity: 0 → 1`, `y: 8 → 0`, stagger lines if multi-line, ~0.6s delay 0.15s after emoji.
5. White spine mask (`bg-white`) unchanged.

Reduced motion: static rendered text, no GSAP.

---

## Architecture & file changes

| File | Change |
|------|--------|
| `src/cv/cv-colors.ts` | **New** — shared color + Tailwind class helpers |
| `src/cv/company-logos.ts` | **New** — company → logo path map |
| `src/cv/sections/Work/CompanyLogo.tsx` | **New** |
| `src/cv/sections/Work/WorkTimelineItem.tsx` | Logo, header copy restructure, typography classes, TextAnimate integration |
| `src/cv/sections/Work/Work.tsx` | Checkpoint pulse wiring, milestone ScrollTriggers, migrate color imports |
| `src/cv/sections/Work/WorkMilestoneDivider.tsx` | Emoji/text structure for animation targets |
| `src/cv/sections/Work/work-colors.ts` | Re-export from `cv-colors.ts` or delete after migration |
| `src/cv/cv.css` | Blue spine/checkpoint rules |
| `src/cv/sections/Hero/Hero.tsx` | Uppercase kicker/role, bold blurb, colors |
| `src/cv/sections/About/About.tsx` | Domine h2, body tokens |
| `src/cv/sections/Education/Education.tsx` | Typography tokens |
| `src/cv/sections/Skills/Skills.tsx` | Typography tokens |
| `src/cv/sections/Contact/Contact.tsx` | Typography tokens |
| `src/app/globals.css` | Ensure font utility classes (`font-spectral`, etc.) if missing |
| `src/components/ui/text-animate.tsx` | **New** via shadcn/Magic UI |
| `components.json` | Magic UI registry entry |
| `package.json` | `framer-motion` |
| `src/cv/README.md` | Document logos, colors, animation behavior |
| Tests | `CompanyLogo.test.tsx`, update `Work.test.tsx`, `WorkMilestoneDivider.test.tsx`, Hero tests |

---

## Testing

| Test | Asserts |
|------|---------|
| `CompanyLogo.test.tsx` | Every company maps to logo; img renders at correct size classes; no background wrapper |
| `Work.test.tsx` | PDF-style title/metadata copy; blue/gray/bold classes; logo in trigger; checkpoint class still toggles |
| `WorkMilestoneDivider.test.tsx` | Emoji + text split markup for animation targets |
| `Hero.test.tsx` | Kicker/role uppercase + Spectral blue; blurb Quicksand bold `#6d6964` |
| Reduced motion | Existing `matchMedia` branches skip animations (manual QA + assert no `TextAnimate` when reduced) |

Regression: existing accordion open/close, sticky cluster pointer-events, skill → work navigation unchanged.

---

## Out of scope

- Landing page typography (already separate).
- PDF date string formatter (use existing `startDate`/`endDate` unless a small formatter is trivial).
- Auto-expand accordion on checkpoint (explicitly rejected).
- Confetti milestone variant (explicitly rejected).

---

## Brainstorming artifacts

Visual companion session: `.superpowers/brainstorm/232862-1781569139/`  
Key screens: `accordion-logo-placement.html`, `checkpoint-activation.html`, `milestone-celebration.html`, `cv-typography-colors-v2.html`.
