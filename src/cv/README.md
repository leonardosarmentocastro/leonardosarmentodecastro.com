# `src/cv/`

The CV domain. Owns the data, types, and UI building blocks for the `/cv` route plus the shared `ResumeOptionsModal` mounted on the landing page.

## Files

| File | Purpose |
| --- | --- |
| `types.ts` | `Resume`, `WorkExperience`, `Skill`, `Education`, `Milestone`, `ResumeLinks`. |
| `data.ts` | The single `RESUME` object — source of truth for every CV field on the site. |
| `ResumeOptionsModal.tsx` | The "PDF vs WEB" chooser shown from the landing page's RESUME button. |
| `Dock/Dock.tsx` | Legacy floating dock (not mounted on `/cv`; Hero icon row covers the same links). |
| `sections/<Section>/<Section>.tsx` | Hero, About, Work, Education, Skills, Contact — each independently testable. |
| `sections/About/CompanyLogoMarquee.tsx` | About-section company logo marquee (Magic UI `Marquee`). |
| `cv-colors.ts` | PDF brand hex tokens and Tailwind class helpers shared across CV sections. |
| `company-logos.ts` | Maps `WorkExperience.company` strings to `/cv/companies/*` assets. |
| `cv.css` | Checkpoint/spine styles, flash animation, blue-derived timeline palette. |
| `__tests__/data.test.ts` | Guard rails on the shape of `RESUME`. |

## Editing the CV

`data.ts` is the only file you need to touch for content changes. The UI re-renders automatically.

- **New work entry:** prepend an object to `RESUME.workExperience`. Order is most-recent-first. Every entry must have `company`, `role`, `workMode`, `startDate`, `endDate`, `description`, `bullets`, `technologies`, and `lane` (`"left"` | `"right"`). `via`, `location`, and `stickyThrough` are optional. The Work section interleaves milestones chronologically based on `startDate` years, so add a corresponding entry to `RESUME.milestones` if the role marks a career milestone.

## Work timeline lanes

Each `WorkExperience` entry requires `lane: "left" | "right"` for desktop layout. Cards alternate sides of a center spine; mobile collapses to a left-aligned spine with date pills beside each node.

Optional `stickyThrough: "<Company>"` pins a parallel role on its lane while scrolling through overlapping entries until the named company's region ends (desktop only). Example: Écolheita freelancing overlaps PairTree/PureCars/Radical Imaging. Sticky clusters use `pointer-events-none` on row wrappers so pinned cards do not block clicks on parallel entries at the same scroll height.

Milestones render as horizontal dividers, not timeline cards. A **today** origin marker sits at the top of the spine (always active, no ping animation).

Scroll-driven spine fill and card fade-ins use GSAP `ScrollTrigger` (`prefers-reduced-motion: reduce` marks all checkpoints reached immediately). Domain styles for checkpoints and flash animation live in `src/cv/cv.css`.

## Colors and typography

Brand palette lives in `src/cv/cv-colors.ts`:

| Token | Hex | Typical use |
| --- | --- | --- |
| `accent` | `#3c78d8` | Hero kicker/role, work titles, links, spine fill, reached nodes |
| `foreground` | `#2d2a24` | Name, section h2s |
| `muted` | `#6c6965` | Work metadata, body copy, milestones |
| `mutedAlt` | `#6d6964` | Hero blurb |
| `spineTrack` | `#c5d9f5` | Timeline spine track |

Import Tailwind helpers (e.g. `cvTextAccent`, `workTitle`) from `@/cv/cv-colors`.

Font utilities (`font-spectral`, `font-domine`, `font-quicksand`) are defined in `src/app/globals.css` and loaded in `src/app/layout.tsx`:

| Element | Font |
| --- | --- |
| Hero kicker / role | Spectral, uppercase, accent blue |
| Hero name, section h2s | Domine, foreground |
| Hero blurb, section body | Quicksand |
| Work card copy | Quicksand |
| Milestones | Spectral, italic |

## Company logos

Logos live in `public/cv/companies/` (kebab-case filenames). `company-logos.ts` maps each `RESUME.workExperience[*].company` to its path via `companyLogoSrc(company)`.

**Adding a logo:**

1. Add the image to `public/cv/companies/<kebab-name>.png` (or `.jpg`).
2. Add an entry to `COMPANY_LOGO` in `src/cv/company-logos.ts`.
3. Run `pnpm test:run src/cv/sections/Work/__tests__/CompanyLogo.test.tsx` — it asserts every company resolves to an existing file.

`CompanyLogo.tsx` renders a square `<img>` (48 px mobile, 60 px desktop) with no background wrapper.

## About company logo marquee

`sections/About/CompanyLogoMarquee.tsx` renders all `RESUME.workExperience` company logos in a [Magic UI `Marquee`](https://magicui.design/docs/components/marquee) (`src/components/ui/Marquee.tsx`) directly below the About paragraphs.

- **Assets:** `companyLogoSrc()` → `public/cv/companies/*` (same mapping as Work cards).
- **Click:** each logo is a button calling `scrollToWorkEntry(entry)` — smooth scroll, accordion expand (`cv:open-work-entry`), and `.cv-flash` highlight (gated by `prefers-reduced-motion`).
- **Reduced motion:** static `flex-wrap` row (`data-testid="company-logo-static"`) instead of animated marquee.
- **Animation:** horizontal scroll with edge fade (`pauseOnHover`, 40s duration); no Mantine upgrade required.

## Scroll animations

### Checkpoint activation (Work timeline)

When scroll progress first reaches a timeline node, `Work.tsx`:

1. Adds the entry anchor id to `activatedAnchorIds` React state (once per entry).
2. Fires a GSAP scale pulse on the accordion card (once per entry, tracked in a ref).
3. Passes `showHeaderAnimation` / `showBodyAnimation` to `WorkTimelineItem`.

**TextAnimate** (`@/components/ui/TextAnimate`, Magic UI / `motion/react`):

| Target | Preset | When |
| --- | --- | --- |
| Header title + metadata | `blurInUp` by word | First checkpoint activation |
| Description + bullets | `fadeIn` by line | Checkpoint reached **and** accordion open |

Body text does **not** auto-expand the accordion. Under `prefers-reduced-motion: reduce`, GSAP pulse and TextAnimate are skipped; checkpoints still mark reached via CSS.

### Milestone celebration

`WorkMilestoneDivider` splits leading emoji from body text (`milestone-text.ts`). On first scroll into view (~70% viewport):

1. Emoji springs in (`scale` + `rotation`, `back.out` ease).
2. Body fades up shortly after.

Skipped entirely under `prefers-reduced-motion: reduce` — text renders statically.

### Skill → work navigation

Each skill declares `aliases` (the exact `technologies[]` strings that represent it). `experiencesForSkill` (`sections/Skills/matching.ts`) maps a skill to the jobs that used it. Clicking a skill card opens `SkillExperiencesModal`; clicking a job there closes it and calls `scrollToWorkEntry` (`sections/Work/anchors.ts`), which:

1. Smooth-scrolls to the entry's anchor (`workEntryAnchorId`) and flashes it (`.cv-flash`, in `src/cv/cv.css`) — both gated behind `prefers-reduced-motion`.
2. Dispatches `cv:open-work-entry` with the anchor id. `Work.tsx` listens on `document` and adds that id to the multi-open accordion so the job details are visible on arrival (decouples Skills modal from Work state without prop-drilling).

To add a skill, include its `aliases` so it links to the right jobs. Analytics: `skill_experiences_opened` and `skill_experience_clicked`.

### Work → skill navigation

Work accordion technology badges use `WorkTechnologyBadge` (`sections/Work/WorkTechnologyBadge.tsx`). `skillForTechnology` (`sections/Skills/matching.ts`) resolves a technology string to a skill via exact case-insensitive alias match (same rules as `experiencesForSkill`, inverted).

- **Mapped badges** render as buttons. Desktop hover shows a Mantine tooltip with `{level} · stars`. Click scrolls to the skill card via `scrollToSkill` (`sections/Skills/anchors.ts`) and flashes it (`.cv-flash`, gated by `prefers-reduced-motion`).
- **Touch devices** use a two-tap flow: first tap opens the tooltip (level + stars + *"Tap again to see skill"* hint); second tap navigates.
- **Unmapped badges** (technology strings with no skill alias) stay static — no tooltip, no click.

Skill cards expose `id={skillAnchorId(skill)}` for scroll targets. Analytics: `work_technology_skill_clicked`.

### shadcn/ui in Work

Work timeline cards use shadcn/ui primitives under `src/components/ui/` (`Accordion`, `Card`, `Badge`). Add new components with `pnpm dlx shadcn@latest add <component>` — theme/CSS changes land in `src/vendor/shadcn/styles.css` (see `components.json`). The `cn()` helper is in `src/lib/utils.ts`.

## Adding a new technology

When you add a technology string to `RESUME.workExperience[*].technologies` or
`RESUME.skills[*].aliases` in `data.ts`, you **must** also update the icon
mapping. The test in `src/cv/__tests__/icons.test.ts` will fail if you miss this
step — that failure is the signal to act.

**Three cases:**

1. **An icon exists in `tech-stack-icons`** — add the alias → key entry to
   `ALIAS_TO_ICON` in `src/cv/icons.ts`, add the icon key to `REQUESTED_ICONS`
   in `scripts/cv/extract-tech-icons.ts`, then run:
   ```
   pnpm extract-tech-icons
   ```
   Commit both `src/cv/icons.ts` and the regenerated `src/cv/tech-icon-svgs.ts`.

2. **No icon exists** — add the alias string to `UNMAPPED_ALIASES` in
   `src/cv/icons.ts`. No script run needed; the badge renders text-only.

3. **A previously unmapped alias gains an icon** (e.g., the library adds one) —
   move it from `UNMAPPED_ALIASES` to `ALIAS_TO_ICON`, add the key to
   `REQUESTED_ICONS`, and run `pnpm extract-tech-icons`.

To browse available icon names visit https://tech-stack-icons.com or search the
`IconName` TypeScript type (autocomplete works with the devDep installed).

- **New skill:** append to `RESUME.skills`. `category` must be one of the `SkillCategory` enum values in `types.ts` — if you need a new category (e.g. `"Cloud"`), add it to both `SkillCategory` in `types.ts` **and** the `CATEGORY_ORDER` constant in `sections/Skills/Skills.tsx`.

- **New education entry:** append to `RESUME.education`.

- **New milestone:** add to `RESUME.milestones`. Order is most-recent-first by `year`.

- **Updated contact info:** update `RESUME.hero.links`. The landing page and `/cv` page both read from this object — there are no other sources.

## Skill → experiences

See **Skill → work navigation** under [Work timeline lanes](#work-timeline-lanes) above.

## Resume options dialog

`ResumeOptionsModal.tsx` is a Mantine `Modal` with two stacked CTAs: open the PDF on Google Drive, or navigate to `/cv`. It's mounted in:

- `src/components/pages/LandingPage/LandingPage.tsx` — opened when the RESUME accordion is clicked.

If you want to mount it from a new location, import it directly:

```tsx
import { ResumeOptionsModal } from "@/cv/ResumeOptionsModal";
```

Pass `onChoiceClick` if the consuming page wants to suppress its own dismiss-tracking when a CTA was clicked (see how `LandingPage` uses a `ctaClickedRef` for the canonical pattern).

## The Dock

`Dock/Dock.tsx` is kept in the repo but **not mounted** on `/cv` — the Hero icon row (LinkedIn, GitHub, Email, WhatsApp, PDF, personal site last) covers the same quick actions without a fixed overlay.

## Avatar

`public/leonardo-05.jpg` is rendered by the Hero section (portrait beside text on desktop, centered above on mobile). Update `RESUME.hero.avatar` in `data.ts` to change the image.

## Replacing the contact channel set

The CV exposes WhatsApp, Email, LinkedIn, and GitHub from two surfaces: the landing page's contact modal and the CV Contact section. Hero also links to the resume PDF and personal site. All contact CTAs fire `trackContactClick({ channel, location })` from `@/analytics/events`. Adding a new channel:

1. Extend the `ContactChannel` union in `src/analytics/events.ts`.
2. Add a CTA in each surface that needs the new channel.

See `src/analytics/README.md` for the conventions.
