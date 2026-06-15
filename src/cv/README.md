# `src/cv/`

The CV domain. Owns the data, types, and UI building blocks for the `/cv` route plus the shared `ResumeOptionsModal` mounted on the landing page.

## Files

| File | Purpose |
| --- | --- |
| `types.ts` | `Resume`, `WorkExperience`, `Skill`, `Education`, `Milestone`, `ResumeLinks`. |
| `data.ts` | The single `RESUME` object — source of truth for every CV field on the site. |
| `ResumeOptionsModal.tsx` | The "PDF vs WEB" chooser shown from the landing page's RESUME button. |
| `Dock/Dock.tsx` | Floating bottom dock on `/cv` (Home / LinkedIn / Email / WhatsApp / PDF). |
| `sections/<Section>/<Section>.tsx` | Hero, About, Work, Education, Skills, Contact — each independently testable. |
| `__tests__/data.test.ts` | Guard rails on the shape of `RESUME`. |

## Editing the CV

`data.ts` is the only file you need to touch for content changes. The UI re-renders automatically.

- **New work entry:** prepend an object to `RESUME.workExperience`. Order is most-recent-first. Every entry must have `company`, `role`, `workMode`, `startDate`, `endDate`, `description`, `bullets`, `technologies`, and `lane` (`"left"` | `"right"`). `via`, `location`, and `stickyThrough` are optional. The Work section interleaves milestones chronologically based on `startDate` years, so add a corresponding entry to `RESUME.milestones` if the role marks a career milestone.

## Work timeline lanes

Each `WorkExperience` entry requires `lane: "left" | "right"` for desktop layout. Cards alternate sides of a center spine; mobile collapses to a left-aligned spine with date pills beside each node.

Optional `stickyThrough: "<Company>"` pins a parallel role on its lane while scrolling through overlapping entries until the named company's region ends (desktop only). Example: Écolheita freelancing overlaps PairTree/PureCars/Radical Imaging. Sticky clusters use `pointer-events-none` on row wrappers so pinned cards do not block clicks on parallel entries at the same scroll height.

Milestones render as horizontal dividers, not timeline cards. A **today** origin marker sits at the top of the spine (always active, no ping animation).

Scroll-driven spine fill and card fade-ins use GSAP `ScrollTrigger` (`prefers-reduced-motion: reduce` marks all checkpoints reached immediately). Domain styles for checkpoints and flash animation live in `src/cv/cv.css`.

### Skill → work navigation

Each skill declares `aliases` (the exact `technologies[]` strings that represent it). `experiencesForSkill` (`sections/Skills/matching.ts`) maps a skill to the jobs that used it. Clicking a skill card opens `SkillExperiencesModal`; clicking a job there closes it and calls `scrollToWorkEntry` (`sections/Work/anchors.ts`), which:

1. Smooth-scrolls to the entry's anchor (`workEntryAnchorId`) and flashes it (`.cv-flash`, in `src/cv/cv.css`) — both gated behind `prefers-reduced-motion`.
2. Dispatches `cv:open-work-entry` with the anchor id. `Work.tsx` listens on `document` and adds that id to the multi-open accordion so the job details are visible on arrival (decouples Skills modal from Work state without prop-drilling).

To add a skill, include its `aliases` so it links to the right jobs. Analytics: `skill_experiences_opened` and `skill_experience_clicked`.

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

`Dock/Dock.tsx` is fixed to the bottom of the viewport on `/cv`. Items use `aria-label`s for both accessibility and the Mantine `Tooltip` content. Adding a new item: pick a Tabler icon, decide whether it's a `<Link>` (Next-router-aware), `<a>` (external), or `<button>` (in-page action), and reuse the `ITEM_CLASS` for consistent sizing/hover.

## Avatar

`public/cv/avatar.jpg` is rendered by the Hero section. The repo currently ships a placeholder — replace it with a real headshot at the same path. No code change required.

## Replacing the contact channel set

The CV exposes WhatsApp, Email, and LinkedIn from three surfaces: the landing page's contact modal, the CV Contact section, and the CV Dock. All of them fire `trackContactClick({ channel, location })` from `@/analytics/events`. Adding a fourth channel:

1. Extend the `ContactChannel` union in `src/analytics/events.ts`.
2. Add a CTA in each surface that needs the new channel.

See `src/analytics/README.md` for the conventions.
