# CV About company logo marquee — design spec

**Date:** 2026-06-16  
**Route:** `/cv`  
**Status:** Approved (brainstorming)

## Summary

Add a horizontally scrolling marquee of company logos directly below the About section paragraphs. Each logo links to its corresponding work-experience entry on the same page: smooth scroll, accordion auto-expand, and brief highlight flash. Uses Mantine v9 `Marquee` (requires upgrading from Mantine 8).

## Decisions (from brainstorming)

| Topic | Decision |
| --- | --- |
| Logo source | Real brand assets in `public/cv/companies/` via existing `companyLogoSrc()` |
| Companies shown | All 16 `RESUME.workExperience` entries |
| Order | Data order (most recent first: Pinterest → Dash) |
| Placement | Inside About section, below the three paragraphs, above the `<hr>` before Work |
| Click target | In-page work entry (not external company URLs) |
| Click behavior | Scroll + highlight + auto-expand accordion (`scrollToWorkEntry`) |
| Marquee library | Mantine v9 `Marquee` (Approach A — upgrade `@mantine/*` to v9) |
| Reduced motion | Static wrapped row, no animation |

## Problem

The About section is text-only. Visitors have no quick visual scan of career breadth before scrolling to the full Work timeline. A logo marquee adds social proof and a shortcut into specific roles.

## Architecture

```
src/cv/sections/About/
  CompanyLogoMarquee.tsx    # Mantine Marquee + clickable logo buttons
  About.tsx                 # render marquee after paragraph map
  __tests__/CompanyLogoMarquee.test.tsx

package.json                # @mantine/core, @mantine/hooks, @mantine/notifications → v9
src/cv/README.md            # document marquee + Mantine v9 note
```

Reused (unchanged API):

- `src/cv/company-logos.ts` — `companyLogoSrc(company)`
- `src/cv/sections/Work/CompanyLogo.tsx` — `<img>` rendering
- `src/cv/sections/Work/anchors.ts` — `workEntryAnchorId`, `scrollToWorkEntry`

No changes to `data.ts`.

## Layout

```
About
├── h2 "About"
├── paragraph 1
├── paragraph 2
├── paragraph 3
└── CompanyLogoMarquee   ← new, full content width
```

Styling:

- `mt-6` spacing below last paragraph
- Logo height ~40px in marquee (slightly smaller than Work cards' 48/60px so 16 logos don't dominate)
- `object-contain` preserved via `CompanyLogo`

## Marquee configuration

Use [`@mantine/core` `Marquee`](https://mantine.dev/core/marquee/):

| Prop | Value | Rationale |
| --- | --- | --- |
| `gap` | `"lg"` | Comfortable spacing between logos |
| `pauseOnHover` | `true` | Easier to click a specific logo |
| `fadeEdges` | `true` | Smooth edge transition |
| `fadeEdgeColor` | `white` / `var(--mantine-color-body)` | Match CV page background |
| `duration` | `40000` (default) | Slow, readable scroll for 16 items |

`prefers-reduced-motion: reduce`: render logos in a static `flex flex-wrap justify-center gap-4` row instead of `Marquee`.

## Click behavior

Each logo is a `<button type="button">` wrapping `CompanyLogo`:

1. `onClick` → `scrollToWorkEntry(entry)` from `anchors.ts`
2. Smooth scroll to `#work-{slug}` (company + startDate, accents stripped)
3. Dispatches `cv:open-work-entry` → Work accordion expands the entry
4. Applies `cv-flash` animation on the card (skipped when reduced motion)

Accessibility:

- `aria-label`: `View {company} experience`
- Keyboard: focusable, Enter/Space activates
- No `href` — in-page navigation only, not external links

## Mantine v9 upgrade

Current: `@mantine/core` ^8.3.4. `Marquee` is v9-only.

Bump to v9:

- `@mantine/core`
- `@mantine/hooks` (if present)
- `@mantine/notifications` (used by Dock email copy)

Smoke-test after upgrade:

- `MantineProvider` in `src/app/layout.tsx`
- `Modal` — LandingPage, ResumeOptionsModal, SkillExperiencesModal
- `Tooltip` — Dock
- `notifications` — Dock email copy

Run full `pnpm lint && pnpm test:run` after bump.

## Testing

| File | Coverage |
| --- | --- |
| `About/__tests__/CompanyLogoMarquee.test.tsx` | Renders 16 logo buttons; each has correct `aria-label`; click invokes `scrollToWorkEntry` with matching entry; reduced-motion path renders static layout (no `Marquee` animation class or equivalent assertion) |
| `About` (optional integration in existing About test if present) | Marquee row appears after paragraphs |
| Existing `CompanyLogo.test.tsx` | Unchanged — guard still passes |
| Existing Work anchor tests | `scrollToWorkEntry` behavior unchanged |

Mock `scrollToWorkEntry` in unit tests; do not depend on full Work accordion mount.

## Documentation

Update `src/cv/README.md`:

- New `CompanyLogoMarquee` under About section
- Marquee behavior (click → work entry, reduced motion)
- Note Mantine v9 requirement for `Marquee`
- Logo asset workflow unchanged (`company-logos.ts`)

## Out of scope (v1)

- Filtering logos (e.g. recent-only subset)
- External company website links
- Analytics events for logo clicks
- Reordering marquee (e.g. alphabetical vs chronological)
- Removing duplicate `pinterest.png` (keep `pinterest.jpg` as canonical per current mapping)

## References

- [Mantine Marquee](https://mantine.dev/core/marquee/)
- `src/cv/sections/Work/anchors.ts` — `scrollToWorkEntry`
- `src/cv/company-logos.ts` — logo paths
- `src/cv/sections/About/About.tsx` — insertion point
