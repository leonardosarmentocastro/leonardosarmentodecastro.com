# leonardosarmentodecastro.com

Personal website of **Leonardo Sarmento de Castro** — Senior Software Engineer (TypeScript · Node.js · React · AWS).

Built with the Next.js App Router. Two routes today: the landing page (`/`) and the web version of the CV (`/cv`). Designed to grow into a small portfolio/blog over time.

---

## Stack

| Concern             | Choice                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------- |
| Framework           | [Next.js 15](https://nextjs.org) (App Router, Turbopack)                                |
| UI runtime          | React 19, TypeScript (strict)                                                           |
| Component library   | [Mantine 8](https://mantine.dev) (`@mantine/core`, `hooks`, `modals`, `notifications`) |
| Styling             | Tailwind CSS v4, PostCSS, Mantine theme                                                 |
| Animation           | [GSAP 3](https://gsap.com) via `@gsap/react`                                            |
| Icons               | `@tabler/icons-react`                                                                   |
| Analytics           | [PostHog](https://posthog.com) — see [`src/analytics/README.md`](./src/analytics/README.md) |
| Testing             | [Vitest](https://vitest.dev) + Testing Library + jsdom                                  |
| Lint / Format       | [Biome](https://biomejs.dev) (no ESLint, no Prettier)                                   |
| Package manager     | **pnpm** (pinned via `packageManager` in `package.json`)                                |
| Deploy              | [Vercel](https://vercel.com) — auto-deploy on push to `main`                            |

---

## Getting started

Requirements:

- Node.js 20+
- pnpm 8+ (`corepack enable` is the easiest way to get the pinned version)

Install and run:

```bash
pnpm install
cp .env.example .env.local   # optional — only needed if you want PostHog analytics in dev
pnpm dev
```

Open <http://localhost:3000>.

Environment variables are documented in the domain folder that owns them. Today the only one is `NEXT_PUBLIC_POSTHOG_KEY` — see [`src/analytics/README.md`](./src/analytics/README.md).

---

## Scripts

| Command            | What it does                                       |
| ------------------ | -------------------------------------------------- |
| `pnpm dev`         | Start the dev server with Turbopack                |
| `pnpm build`       | Production build with Turbopack                    |
| `pnpm start`       | Serve the production build                         |
| `pnpm lint`        | `biome check --fix` (lint + safe autofixes)        |
| `pnpm format`      | `biome format --write`                             |
| `pnpm test`        | Vitest in watch mode                               |
| `pnpm test:run`    | Vitest single run (used in CI / pre-merge checks)  |

---

## Project structure

`src/` is organized **by feature/domain**, not by technical layer. Each domain owns its types, hooks, server code, components, and tests under one folder — and, when it has setup, configuration, or conventions worth explaining, **its own `README.md`**. Start there before reading the source.

```
src/
├── app/                          # Next.js App Router (routes, layout, sitemap, robots)
│   ├── layout.tsx                # Mantine + fonts + global providers
│   ├── page.tsx                  # Renders <LandingPage />
│   ├── cv/page.tsx               # Renders <CVPage />
│   ├── sitemap.ts
│   └── robots.ts
├── analytics/                    # PostHog event API — see src/analytics/README.md
│   ├── README.md
│   ├── events.ts
│   └── __tests__/events.test.ts
├── cv/                           # CV domain — see src/cv/README.md
│   ├── README.md
│   ├── data.ts                   # Source of truth for CV content (RESUME)
│   ├── types.ts
│   ├── ResumeOptionsModal.tsx    # Shared "PDF vs WEB" chooser (mounted on /)
│   ├── Dock/
│   ├── sections/{Hero,About,Work,Education,Skills,Contact}/
│   └── pages/CVPage/             # Page-level composition for the /cv route
│       ├── CVPage.tsx
│       └── __tests__/
├── components/
│   └── pages/
│       └── LandingPage/          # Page-level UI lives with the page
│           ├── LandingPage.tsx
│           ├── CoverImagesLoop/
│           └── __tests__/
└── test/                         # Shared test utilities (render helpers, polyfills)
    ├── render.tsx
    └── jest-dom.d.ts

instrumentation-client.ts         # Next.js convention: client bootstrap (PostHog init)
next.config.ts                    # PostHog reverse-proxy rewrites under /ingest
```

Conventions enforced repo-wide (see `CLAUDE.md` for the full version):

- No `src/services/`, `src/lib/`, `src/utils/`, `src/helpers/` — group by domain instead.
- Generic primitives reused across features go under `src/components/`. Anything feature-specific lives in the feature folder.
- Tests sit in a `__tests__/` subfolder next to the code they cover.
- Path alias `@/*` → `src/*` (configured in `tsconfig.json`).
- When a domain has non-trivial setup or external dependencies, add a `README.md` inside its folder rather than bloating this one.

---

## Testing

- Test runner: **Vitest** with the jsdom environment.
- React tests use `@testing-library/react` + `@testing-library/user-event`.
- Shared render helpers live in `src/test/render.tsx`.
- Tests are colocated under `__tests__/` within each domain folder.

Run once:

```bash
pnpm test:run
```

Watch mode while developing:

```bash
pnpm test
```

TDD is the working style (red → green → refactor). Bug fixes start with a failing regression test.

---

## Branching & deploys

- **`main` is auto-deployed to production on every push** via Vercel — including doc and config changes.
- Never commit directly to `main`. Use `feat/...`, `fix/...`, `chore/...` branches and merge via PR after verification.
- Commits are atomic: one feature increment, one refactor, one fix, or one doc update per commit. Each commit should leave the repo buildable and tests green.

See `CLAUDE.md` for the full set of working conventions used by AI assistants in this repo.

---

## License

Personal project — no license granted for reuse. Content and code © Leonardo Sarmento de Castro.
