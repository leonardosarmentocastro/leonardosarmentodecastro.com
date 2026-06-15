# CV Technology Icons — Design Spec

**Date:** 2026-06-15
**Status:** Approved

---

## Problem

The CV page's Skills section and Work Experience section render technology names as plain text. Visitors scanning the page cannot quickly identify technologies at a glance. Icons would improve scannability and match the visual density of the Magic UI portfolio reference design.

---

## Scope

**In scope:**
- Technology icons in the Skills section (skill cards)
- Technology icons in the Work Experience section (technology badges)

**Out of scope:**
- Icons in any other CV section
- Animated or interactive icon states (e.g. hover colour changes)
- Fetching icons at runtime from an external CDN
- Changing the layout or information density of cards or badges beyond inserting the icon

---

## Approach: B — Extract needed SVGs, commit, no runtime dependency

`tech-stack-icons` is installed as a `devDependency` only. A one-off extraction script reads the package and emits `src/cv/tech-icon-svgs.ts` — a plain `Record<string, string>` containing only the ~40 SVG strings needed. That file is committed to the repo and updated by re-running the script when new technologies are added.

**Why not approach A (use the package directly at runtime)?**
The package bundles all 694 icon SVGs in one JavaScript object. Tree-shaking cannot eliminate unused entries, so the full ~1 MB gzipped would ship to every CV page visitor even though only ~40 icons are used.

**Why not approach C (SVG files in `public/`)?**
Each icon would require a separate HTTP request. `<img>` inside a `<button>` is valid but less idiomatic than inline SVG, and filenames are not type-safe.

---

## File Structure

```
scripts/
  cv/
    extract-tech-icons.ts      ← one-off script, run manually with pnpm extract-tech-icons

src/cv/
  tech-icon-svgs.ts            ← GENERATED (committed): ~40 SVG strings, light variant
  icons.ts                     ← hand-written: alias → icon key mapping + getTechIconSvg()
  TechIcon.tsx                 ← component: <TechIcon alias="React.js" size={16} />
  README.md                    ← updated: "Adding a new technology" section
  sections/Skills/Skills.tsx   ← updated: SkillCardInner renders icons above skill name
  sections/Work/Work.tsx       ← updated: WorkEntry badges include inline icon
  __tests__/icons.test.ts      ← NEW guard test: fails when an alias is neither mapped nor opted out
  __tests__/TechIcon.test.tsx  ← NEW unit tests for the TechIcon component

package.json                   ← updated: devDep + "extract-tech-icons" script entry
CLAUDE.md                      ← updated: one-line callout pointing to the icon workflow
```

---

## Extraction Script — `scripts/cv/extract-tech-icons.ts`

Driven by a hardcoded `REQUESTED_ICONS` array. When a new technology gains an icon mapping, its key is added here and the script is re-run. The script:

1. Reads the icon data object from `node_modules/tech-stack-icons/dist/index.js`
2. Filters to only the keys in `REQUESTED_ICONS`, taking the `"light"` SVG variant
3. Writes `src/cv/tech-icon-svgs.ts` with a header comment explaining the file and how to regenerate it
4. Prints a warning (does not crash) for any key in `REQUESTED_ICONS` that is missing from the package

Run with:
```
pnpm extract-tech-icons
```

The script opens with a JSDoc block explaining when to re-run and when not to.

---

## Generated File — `src/cv/tech-icon-svgs.ts`

```ts
// AUTO-GENERATED — do not edit by hand.
// Source: tech-stack-icons (devDependency, light variant)
// To regenerate: pnpm extract-tech-icons
// To add an icon: add the key to REQUESTED_ICONS in scripts/cv/extract-tech-icons.ts,
//                 add the alias mapping in src/cv/icons.ts,
//                 then run pnpm extract-tech-icons.

export const TECH_ICON_SVGS: Record<string, string> = {
  claude:      "<svg ...>...</svg>",
  cursor:      "<svg ...>...</svg>",
  // ~38 more entries
};
```

This file is committed. PRs that add technologies will show a diff of only the new SVG strings added.

---

## Mapping Layer — `src/cv/icons.ts`

The only file a human edits when updating `data.ts`. Contains three exports:

### `ALIAS_TO_ICON`

Maps exact alias strings (from `Skill.aliases[]` and `WorkExperience.technologies[]`) to keys in `TECH_ICON_SVGS`.

Initial mapping covers all technologies currently in `data.ts` that have a matching icon in `tech-stack-icons`:

| Alias | Icon key |
|---|---|
| `"Claude Code"` | `claude` |
| `"Cursor"` | `cursor` |
| `"GitHub Copilot"` | `copilotgithub` |
| `"JavaScript"` | `js` |
| `"TypeScript"` | `typescript` |
| `"Python"` | `python` |
| `"Ruby on Rails"` | `rails` |
| `"React.js"` | `react` |
| `"React Native"` | `reactnative` |
| `"Next.js"` | `nextjs` |
| `"Vite"` | `vitejs` |
| `"TanStack"` | `tanstack` |
| `"Figma"` | `figma` |
| `"Node.js"` | `nodejs` |
| `"MongoDB"` | `mongodb` |
| `"Redis"` | `redis` |
| `"PostgreSQL"` | `postgresql` |
| `"MySQL"` | `mysql` |
| `"Sanity"` | `sanity` |
| `"Sanity.io"` | `sanity` |
| `"AWS"` | `aws` |
| `"Docker"` | `docker` |
| `"Git"` | `git` |
| `"GitHub Actions"` | `github` |
| `"Gitlab CI"` | `gitlab` |
| `"SVN"` | `subversion` |
| `"Turborepo"` | `turborepo` |
| `"pnpm"` | `pnpm` |
| `"Tailwind"` | `tailwindcss` |
| `"Tailwind.css"` | `tailwindcss` |
| `"GraphQL"` | `graphql` |
| `"Apollo GraphQL"` | `graphql` |
| `"Vue.js"` | `vuejs` |
| `"PHP"` | `php` |
| `"Kubernetes"` | `kubernetes` |
| `"RabbitMQ"` | `rabbitmq` |
| `"Webpack"` | `webpack` |
| `"Redux"` | `redux` |
| `"Angular.js"` | `angular` |
| `"Angular 2"` | `angular` |
| `"Java"` | `java` |
| `"Scala"` | `scala` |
| `"Oracle Database"` | `oracle` |
| `"Oracle SQL"` | `oracle` |
| `"Android"` | `android` |
| `"HTML5"` | `html5` |
| `"HTML"` | `html5` |
| `"CSS3"` | `css3` |
| `"CSS"` | `css3` |
| `"Google Cloud Platform"` | `gcloud` |
| `"React MUI"` | `materialui` |
| `".NET Framework"` | `net` |
| `"Cassandra"` | `cassandradb` |
| `"Google Analytics"` | `analytics` |

### `UNMAPPED_ALIASES`

A `Set<string>` of alias strings for which no icon exists in the library. Aliases here render text-only with no broken placeholder. Initial set:

- `"Pinterest Gestalt"` — proprietary design system
- `"Buildkite"` — not in tech-stack-icons v3.7.1
- `"Webdriver.io"` — not in tech-stack-icons v3.7.1
- `"GeneXus"` — not in tech-stack-icons v3.7.1
- `"SQL Server"` — not in tech-stack-icons v3.7.1
- `"open source software"` — not a technology identifier
- `"Codeship"` — not in tech-stack-icons v3.7.1

### `getTechIconSvg(alias: string): string | null`

Looks up `alias` in `ALIAS_TO_ICON`, then returns the SVG string from `TECH_ICON_SVGS` or `null` if no mapping exists.

---

## Component — `src/cv/TechIcon.tsx`

```tsx
interface TechIconProps {
  alias: string;
  size: number;
}

export const TechIcon = ({ alias, size }: TechIconProps) => {
  const svg = getTechIconSvg(alias);
  if (!svg) return null;
  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-block", width: size, height: size, lineHeight: 0, flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
```

- Returns `null` silently when no icon is found — no placeholder, no layout shift
- `<span>` is phrasing content, valid inside the existing `<button>` in `SkillCard`
- `aria-hidden="true"` — icon is decorative; the skill name or badge text already labels the element
- `flexShrink: 0` — prevents squishing in flex rows when the skill name is long
- Sizing is controlled entirely by the `size` prop (passed as inline `width`/`height`)

---

## Integration — `SkillCardInner`

A new icon row is prepended as the first child of `SkillCardInner`. It maps over `skill.aliases` and renders a `TechIcon` per alias. For single-alias skills this shows one icon; for compound skills like `"Next.js, Vite, TanStack"` it shows three side by side.

If none of the aliases resolve to an icon, all `TechIcon` calls return `null` and the icon row `<span>` is empty — adding no visible height. The implementer should conditionally omit the icon row `<span>` entirely in this case to avoid an empty gap (use `skill.aliases.some(a => getTechIconSvg(a) != null)` as the guard).

**Icon size on skill cards: `18px`**

---

## Integration — `WorkEntry` badges

Each `Badge` wraps an inner `<span className="inline-flex items-center gap-1">` containing `<TechIcon alias={t} size={12} />` and the technology text. When `TechIcon` returns `null` the badge renders text-only with no gap.

**Icon size on badges: `12px`**

---

## Documentation and the Guard

### `src/cv/README.md` — new "Adding a new technology" section

Documents the three-step workflow (icon available / no icon / library gains an icon later) and explicitly names the guard test. This is the source of truth for the process.

### `CLAUDE.md` — one-line callout under "Stack notes"

```
- When adding a technology to `data.ts`, follow the icon workflow in
  `src/cv/README.md` — the guard test in `src/cv/__tests__/icons.test.ts`
  will fail if the alias is not mapped or explicitly opted out.
```

Future Claude Code sessions load `CLAUDE.md` as initial context and will see this.

### `scripts/cv/extract-tech-icons.ts` — JSDoc header

The script itself documents when to re-run and when not to. Reading the script in isolation is sufficient to understand the workflow.

---

## Testing

### `src/cv/__tests__/icons.test.ts` — guard test

Walks every alias in `RESUME.skills[*].aliases` and `RESUME.workExperience[*].technologies`. For each unique alias, asserts it appears in exactly one of `ALIAS_TO_ICON` or `UNMAPPED_ALIASES`.

Two assertions:
1. No alias is missing from both sets (the primary guard — catches a new technology added to `data.ts` without updating `icons.ts`)
2. No alias appears in both sets (catches a stale `UNMAPPED_ALIASES` entry when an icon is later added to `ALIAS_TO_ICON`)

Failure messages name the exact alias strings so the fix is unambiguous.

### `src/cv/__tests__/TechIcon.test.tsx` — unit tests

Three cases:
- Renders a `<span>` with injected SVG when alias is mapped
- Renders nothing when alias has no mapping
- The rendered `<span>` has `aria-hidden="true"`

No snapshot tests — SVG content is generated data, not application logic.

### Existing tests

`Skills.test.tsx` and `Work.test.tsx` assert on text content and interaction. The icon additions are purely additive and do not affect existing assertions — no changes needed.

### What is not tested

- The extraction script — it is developer tooling, not application logic; its output is committed and treated as data
- SVG correctness — trusted to the upstream library
- Visual sizing — not unit-testable; verified manually when the feature ships
