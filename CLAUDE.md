# Project-wide Claude guidance

## Branching & deploys

- **Never commit directly to `main`.** Every push to `main` triggers an automatic Vercel production deploy. Always work on a feature branch (`feat/...`, `fix/...`, `chore/...`) and merge to `main` only after the changes are verified.
- For multi-task implementation work (e.g. executing a plan from `docs/superpowers/plans/`), create the feature branch **before** the first commit and stay on it until the work is reviewed and ready to merge.
- This applies to every kind of change, including docs and config — Vercel rebuilds on any push to `main`.

## Implementation discipline

- TDD is non-negotiable. Red → green → refactor. Never skip running the tests — "I think this passes" is not acceptable. Bug fixes require a regression test that reproduces the bug before the fix.
- Escape hatch: if testing something is genuinely impossible (test runner infra, deployment config, third-party integration), explain why before proceeding without tests.

## Stack notes

- Next.js 15 App Router, React 19, TypeScript strict mode, Mantine 8, GSAP for animations.
- Package manager: **pnpm** (locked via `package.json` `packageManager` field). Do not use `npm` or `yarn` in this repo.
- Linter/formatter: **Biome** (`pnpm lint`, `pnpm format`). Do not introduce ESLint or Prettier.
- Path alias: `@/*` → `src/*` (configured in `tsconfig.json`).

## Specs and plans

- Brainstorming output lives in `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
- Implementation plans live in `docs/superpowers/plans/YYYY-MM-DD-<topic>.md`.
