# `src/components/ui/`

Shared UI primitives reused across features (shadcn/ui, Magic UI, and project-specific wrappers). Theme tokens and base styles live in `src/vendor/shadcn/styles.css` (imported by `src/app/globals.css`).

## File naming

**Every component file uses PascalCase matching the exported component name.**

| Correct | Wrong (CLI default) |
| --- | --- |
| `Marquee.tsx` | `marquee.tsx` |
| `TextAnimate.tsx` | `text-animate.tsx` |
| `Accordion.tsx` | `accordion.tsx` |

Imports use the same path: `@/components/ui/Marquee`, `@/components/ui/TextAnimate`.

## Adding a shadcn or Magic UI component

The CLI writes kebab-case filenames (`pnpm dlx shadcn@latest add …` or `@magicui/…`). **Rename immediately** before committing:

1. Run the add command (e.g. `pnpm dlx shadcn@latest add @magicui/marquee`).
2. Rename the generated file to **PascalCase** matching the primary export (`marquee.tsx` → `Marquee.tsx`).
3. Update every import in the repo to `@/components/ui/<PascalCase>`.
4. If the registry added CSS keyframes or theme tokens, keep them in `src/vendor/shadcn/styles.css` (see `components.json` `tailwind.css`).
5. Run `pnpm lint && pnpm test:run`.

Do not leave kebab-case files in this folder — Biome and reviewers treat PascalCase here as the project convention (same as `Accordion.tsx`, `Button.tsx`, `Card.tsx`).
