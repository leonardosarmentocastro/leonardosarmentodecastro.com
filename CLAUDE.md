# Project-wide Claude guidance

## Branching & deploys

- **Never commit directly to `main`.** Every push to `main` triggers an automatic Vercel production deploy. Always work on a feature branch (`feat/...`, `fix/...`, `chore/...`) and merge to `main` only after the changes are verified.
- For multi-task implementation work (e.g. executing a plan from `docs/superpowers/plans/`), create the feature branch **before** the first commit and stay on it until the work is reviewed and ready to merge.
- This applies to every kind of change, including docs and config — Vercel rebuilds on any push to `main`.

## Implementation discipline

- TDD is non-negotiable. Red → green → refactor. Never skip running the tests — "I think this passes" is not acceptable. Bug fixes require a regression test that reproduces the bug before the fix.
- Escape hatch: if testing something is genuinely impossible (test runner infra, deployment config, third-party integration), explain why before proceeding without tests.
- **Atomic commits.** One commit does one thing — one feature increment, one refactor, one fix, one doc update, one chore. If the commit message needs multiple sections or several "and"s in the subject line, split it. The TDD plans in `docs/superpowers/plans/` already encode this granularity per task step; follow that cadence when executing them. Each commit should leave the repo buildable and the test suite passing on its own.

## Stack notes

- Next.js 15 App Router, React 19, TypeScript strict mode, Mantine 8, GSAP for animations.
- Package manager: **pnpm** (locked via `package.json` `packageManager` field). Do not use `npm` or `yarn` in this repo.
- Linter/formatter: **Biome** (`pnpm lint`, `pnpm format`). Do not introduce ESLint or Prettier.
- Path alias: `@/*` → `src/*` (configured in `tsconfig.json`).

## Code organization

- **Organize `src/` by feature/domain, not by technical layer.** Each cross-cutting concern lives in its own folder named after the domain (a noun, not a layer): `src/analytics/`, `src/authentication/`, `src/payments/`, `src/notifications/`. Inside, group everything that domain needs — pure functions, types, hooks, server actions, providers, tests — so the whole feature is graspable by reading one folder.
- **Do not create technical-layer folders.** Avoid `src/services/`, `src/controllers/`, `src/repositories/`, `src/helpers/`, `src/utils/`, `src/lib/`. They scatter related code by *what it is* instead of *what it does*, which forces a full-tree grep to understand any single feature. If you find yourself reaching for `src/lib/foo.ts`, the right move is `src/<foo-domain>/foo.ts`.
  - Good: `src/analytics/events.ts` + `src/analytics/__tests__/events.test.ts`
  - Bad: `src/lib/analytics.ts` + `src/services/posthog-service.ts`
- **Colocate tests in a `__tests__/` subfolder next to the source**, not as sibling files. The `__tests__/` lives inside the same domain folder as the file under test, mirroring its structure: `src/analytics/events.ts` is tested by `src/analytics/__tests__/events.test.ts`. This keeps each feature's production-source listing uncluttered while still grouping tests with the code they cover.
- **Feature-specific UI lives inside the feature folder.** Only put a component under `src/components/` if it's a generic primitive reused across multiple features. Page-level UI follows the `src/components/pages/<PageName>/` pattern already in use.
- **Exceptions** — these stay structured by Next.js convention, not by domain:
  - `src/app/` — App Router (file = route).
  - `src/test/` — shared test utilities (render helpers, fixtures, polyfills).
  - `instrumentation-client.ts` / `instrumentation.ts` at the repo root — Next.js convention for client/server bootstrapping.
- When a new feature is introduced, the default move is `mkdir src/<feature>/`. Only deviate if there's a concrete reason and call it out in the PR description.

## Specs and plans

- Brainstorming output lives in `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
- Implementation plans live in `docs/superpowers/plans/YYYY-MM-DD-<topic>.md`.
