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

- **New work entry:** prepend an object to `RESUME.workExperience`. Order is most-recent-first. Every entry must have `company`, `role`, `workMode`, `startDate`, `endDate`, `description`, `bullets`, and `technologies`. `via`, `location` are optional. The Work section interleaves milestones chronologically based on `startDate` years, so add a corresponding entry to `RESUME.milestones` if the role marks a career milestone.

- **New skill:** append to `RESUME.skills`. `category` must be one of the `SkillCategory` enum values in `types.ts` — if you need a new category (e.g. `"Cloud"`), add it to both `SkillCategory` in `types.ts` **and** the `CATEGORY_ORDER` constant in `sections/Skills/Skills.tsx`.

- **New education entry:** append to `RESUME.education`.

- **New milestone:** add to `RESUME.milestones`. Order is most-recent-first by `year`.

- **Updated contact info:** update `RESUME.hero.links`. The landing page and `/cv` page both read from this object — there are no other sources.

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
