# PostHog Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cookieless PostHog analytics that tracks pageviews and the 6 CTA-conversion events defined in the spec, wired via TDD with Vitest + React Testing Library.

**Architecture:** A wrapper module (`src/lib/analytics.ts`) hides `posthog-js` from the rest of the app and exposes typed `trackXxx()` functions. A client-only `<AnalyticsProvider>` calls `initAnalytics()` once on mount. Event call sites in `LandingPage.tsx` invoke the typed functions. PostHog traffic is reverse-proxied through `/ingest/*` via `next.config.ts` rewrites to bypass ad blockers.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Mantine 8, `posthog-js`, Vitest, React Testing Library, jsdom.

**Reference spec:** `docs/superpowers/specs/2026-06-11-posthog-analytics-design.md`

---

## File Structure

**Create:**

- `vitest.config.ts` — Vitest config (jsdom env, path alias, setup file).
- `vitest.setup.ts` — Jest-DOM matcher import.
- `src/test/render.tsx` — Mantine-wrapped `render()` helper for component tests.
- `src/lib/analytics.ts` — PostHog wrapper module: `initAnalytics()` + 6 typed `trackXxx()` functions.
- `src/lib/analytics.test.ts` — Unit tests for `analytics.ts`.
- `src/components/AnalyticsProvider.tsx` — Client component that calls `initAnalytics()` once on mount.
- `src/components/AnalyticsProvider.test.tsx` — Unit tests for the provider.
- `src/components/pages/LandingPage/LandingPage.test.tsx` — Event-wiring tests for the landing page.
- `.env.example` — Documents required env var names (no values).

**Modify:**

- `package.json` — Add `posthog-js` dep, dev deps for Vitest stack, `test` / `test:run` scripts.
- `next.config.ts` — Add `rewrites()` for `/ingest/*` proxy + `skipTrailingSlashRedirect: true`.
- `src/app/layout.tsx` — Wrap children with `<AnalyticsProvider>` inside `<MantineProvider>`.
- `src/components/pages/LandingPage/LandingPage.tsx` — Remove TODO comment, wire the 6 event calls + modal dismiss tracking.

**Untouched but referenced:**

- `.gitignore` — Already covers `.env*`; no change needed.
- `tsconfig.json` — Already has `@/*` path alias; no change needed.

---

## Phase 1 — Test infrastructure (escape-hatch: not TDD'd; manually smoke-tested)

### Task 1: Install Vitest + RTL dependencies

**Files:**
- Modify: `package.json` (pnpm will rewrite it + `pnpm-lock.yaml`)

- [ ] **Step 1: Install dev dependencies**

Run:

```bash
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom vite-tsconfig-paths
```

Expected: install succeeds, `package.json` gains the 7 packages under `devDependencies`.

- [ ] **Step 2: Install runtime dependency**

Run:

```bash
pnpm add posthog-js
```

Expected: `posthog-js` appears under `dependencies` in `package.json`.

- [ ] **Step 3: Add test scripts to `package.json`**

In `package.json`, add to the `scripts` block (alongside `dev`, `build`, `start`, `lint`, `format`):

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add vitest + rtl + posthog-js dependencies"
```

---

### Task 2: Create Vitest config + setup files

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
  },
});
```

- [ ] **Step 2: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts vitest.setup.ts
git commit -m "chore: configure vitest with jsdom and rtl matchers"
```

---

### Task 3: Create Mantine-wrapped render helper

**Files:**
- Create: `src/test/render.tsx`

- [ ] **Step 1: Create the helper**

```tsx
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

const Providers = ({ children }: { children: ReactNode }) => (
  <MantineProvider>
    <ModalsProvider>{children}</ModalsProvider>
  </MantineProvider>
);

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: Providers, ...options });

export * from "@testing-library/react";
```

- [ ] **Step 2: Commit**

```bash
git add src/test/render.tsx
git commit -m "test: add mantine-wrapped render helper for component tests"
```

---

### Task 4: Smoke-test the test runner

**Files:**
- Create (then delete): `src/test/smoke.test.ts`

- [ ] **Step 1: Write a trivial smoke test**

Create `src/test/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("vitest smoke test", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Run it**

Run:

```bash
pnpm test:run
```

Expected: `1 passed`, runner exits 0. If it fails, fix the config before continuing — do not move to Phase 2.

- [ ] **Step 3: Delete the smoke test**

```bash
rm src/test/smoke.test.ts
```

- [ ] **Step 4: No commit yet** — the smoke file existed only to verify the runner; nothing to commit.

---

## Phase 2 — TDD `src/lib/analytics.ts`

For every test in this phase, `posthog-js` is mocked. All tests use the same mock setup at the top of `analytics.test.ts`.

### Task 5: Init function — dev mode short-circuit

**Files:**
- Create: `src/lib/analytics.test.ts`
- Create: `src/lib/analytics.ts`

**Why `vi.hoisted` + dynamic import?** `analytics.ts` uses a module-level `initialized` flag. To test "init is called exactly once across two `initAnalytics()` calls", we need the flag reset between test cases — that means re-importing `./analytics` via `vi.resetModules()`. But each re-import re-runs `vi.mock("posthog-js", ...)`'s factory, so a top-of-file `import posthog from "posthog-js"` would point at a *stale* mock. `vi.hoisted` lets us declare the mock functions once, share them across every re-import, and assert against stable references.

- [ ] **Step 1: Write the failing test**

Create `src/lib/analytics.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockInit, mockCapture } = vi.hoisted(() => ({
  mockInit: vi.fn(),
  mockCapture: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  default: { init: mockInit, capture: mockCapture },
}));

const setHostname = (hostname: string) => {
  Object.defineProperty(window, "location", {
    value: { ...window.location, hostname },
    writable: true,
  });
};

const loadAnalytics = async () => {
  vi.resetModules();
  return await import("./analytics");
};

describe("initAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "/ingest");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not call posthog.init in development", async () => {
    const { initAnalytics } = await loadAnalytics();
    vi.stubEnv("NODE_ENV", "development");
    setHostname("leonardosarmentodecastro.com");

    initAnalytics();

    expect(mockInit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:run src/lib/analytics.test.ts
```

Expected: FAIL with `Cannot find module './analytics'`.

- [ ] **Step 3: Create minimal `src/lib/analytics.ts`**

```ts
import posthog from "posthog-js";

let initialized = false;

export const initAnalytics = (): void => {
  if (initialized) return;
  if (process.env.NODE_ENV !== "production") return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
  });
  initialized = true;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm test:run src/lib/analytics.test.ts
```

Expected: PASS (1 passed).

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.ts src/lib/analytics.test.ts
git commit -m "feat(analytics): skip init in development"
```

---

### Task 6: Init function — non-production hostname short-circuit

**Files:**
- Modify: `src/lib/analytics.test.ts`
- Modify: `src/lib/analytics.ts`

- [ ] **Step 1: Write the failing test**

Append to the `describe("initAnalytics", ...)` block in `src/lib/analytics.test.ts`:

```ts
  it("does not call posthog.init on non-production hostnames", async () => {
    const { initAnalytics } = await loadAnalytics();
    vi.stubEnv("NODE_ENV", "production");
    setHostname("preview-abc.vercel.app");

    initAnalytics();

    expect(mockInit).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:run src/lib/analytics.test.ts
```

Expected: the new test FAILS — `posthog.init` was called (because the current implementation has no hostname gate).

- [ ] **Step 3: Add hostname gate to `initAnalytics`**

Update `src/lib/analytics.ts`:

```ts
import posthog from "posthog-js";

const PROD_HOSTNAME = "leonardosarmentodecastro.com";

let initialized = false;

export const initAnalytics = (): void => {
  if (initialized) return;
  if (process.env.NODE_ENV !== "production") return;
  if (typeof window === "undefined") return;
  if (window.location.hostname !== PROD_HOSTNAME) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
  });
  initialized = true;
};
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm test:run src/lib/analytics.test.ts
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.ts src/lib/analytics.test.ts
git commit -m "feat(analytics): gate init on production hostname"
```

---

### Task 7: Init function — full cookieless config on prod domain

**Files:**
- Modify: `src/lib/analytics.test.ts`
- Modify: `src/lib/analytics.ts`

- [ ] **Step 1: Write the failing test**

Append to `describe("initAnalytics", ...)`:

```ts
  it("initializes posthog with cookieless config on the production domain", async () => {
    const { initAnalytics } = await loadAnalytics();
    vi.stubEnv("NODE_ENV", "production");
    setHostname("leonardosarmentodecastro.com");

    initAnalytics();

    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockInit).toHaveBeenCalledWith("phc_test", {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      person_profiles: "never",
      persistence: "memory",
      disable_session_recording: true,
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: false,
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:run src/lib/analytics.test.ts
```

Expected: this test FAILS — current implementation only passes `api_host`.

- [ ] **Step 3: Extend the init config**

Update `src/lib/analytics.ts` `initAnalytics` body to:

```ts
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
    ui_host: "https://us.posthog.com",
    person_profiles: "never",
    persistence: "memory",
    disable_session_recording: true,
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: false,
  });
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm test:run src/lib/analytics.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.ts src/lib/analytics.test.ts
git commit -m "feat(analytics): apply full cookieless config on production"
```

---

### Task 8: Init function — idempotency

**Files:**
- Modify: `src/lib/analytics.test.ts`

The `initialized` flag is already in place, so this test should pass against the current implementation. We're locking the behaviour in with a regression test. Because each previous test re-imports via `loadAnalytics()`, the flag is naturally reset per test — no extra plumbing needed.

- [ ] **Step 1: Write the test**

Append to `describe("initAnalytics", ...)`:

```ts
  it("does not re-initialize posthog when called twice within the same module load", async () => {
    const { initAnalytics } = await loadAnalytics();
    vi.stubEnv("NODE_ENV", "production");
    setHostname("leonardosarmentodecastro.com");

    initAnalytics();
    initAnalytics();

    expect(mockInit).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 2: Run tests**

Run:

```bash
pnpm test:run src/lib/analytics.test.ts
```

Expected: 4 passed.

- [ ] **Step 3: Commit**

```bash
git add src/lib/analytics.test.ts
git commit -m "test(analytics): lock in idempotent init behaviour"
```

---

### Task 9: Tracker functions — all 6 events

**Files:**
- Modify: `src/lib/analytics.test.ts`
- Modify: `src/lib/analytics.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/analytics.test.ts` (after the `describe("initAnalytics", ...)` block):

```ts
describe("event trackers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trackResumeClick captures resume_clicked with destination=google_drive", async () => {
    const { trackResumeClick } = await loadAnalytics();
    trackResumeClick();
    expect(mockCapture).toHaveBeenCalledWith("resume_clicked", {
      destination: "google_drive",
    });
  });

  it("trackLinkedinClick captures linkedin_clicked with destination=linkedin_profile", async () => {
    const { trackLinkedinClick } = await loadAnalytics();
    trackLinkedinClick();
    expect(mockCapture).toHaveBeenCalledWith("linkedin_clicked", {
      destination: "linkedin_profile",
    });
  });

  it("trackContactModalOpen captures contact_modal_opened", async () => {
    const { trackContactModalOpen } = await loadAnalytics();
    trackContactModalOpen();
    expect(mockCapture).toHaveBeenCalledWith("contact_modal_opened");
  });

  it("trackContactModalDismiss captures contact_modal_dismissed", async () => {
    const { trackContactModalDismiss } = await loadAnalytics();
    trackContactModalDismiss();
    expect(mockCapture).toHaveBeenCalledWith("contact_modal_dismissed");
  });

  it("trackWhatsappClick captures whatsapp_clicked with channel=whatsapp", async () => {
    const { trackWhatsappClick } = await loadAnalytics();
    trackWhatsappClick();
    expect(mockCapture).toHaveBeenCalledWith("whatsapp_clicked", {
      channel: "whatsapp",
    });
  });

  it("trackEmailClick captures email_clicked with channel=email", async () => {
    const { trackEmailClick } = await loadAnalytics();
    trackEmailClick();
    expect(mockCapture).toHaveBeenCalledWith("email_clicked", {
      channel: "email",
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm test:run src/lib/analytics.test.ts
```

Expected: 6 new tests FAIL with `trackXxx is not a function` (or similar).

- [ ] **Step 3: Add tracker exports to `src/lib/analytics.ts`**

Append to `src/lib/analytics.ts`:

```ts
export const trackResumeClick = (): void => {
  posthog.capture("resume_clicked", { destination: "google_drive" });
};

export const trackLinkedinClick = (): void => {
  posthog.capture("linkedin_clicked", { destination: "linkedin_profile" });
};

export const trackContactModalOpen = (): void => {
  posthog.capture("contact_modal_opened");
};

export const trackContactModalDismiss = (): void => {
  posthog.capture("contact_modal_dismissed");
};

export const trackWhatsappClick = (): void => {
  posthog.capture("whatsapp_clicked", { channel: "whatsapp" });
};

export const trackEmailClick = (): void => {
  posthog.capture("email_clicked", { channel: "email" });
};
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm test:run src/lib/analytics.test.ts
```

Expected: 10 passed (4 init + 6 trackers).

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.ts src/lib/analytics.test.ts
git commit -m "feat(analytics): add typed event trackers"
```

---

## Phase 3 — TDD `AnalyticsProvider`

### Task 10: Provider calls init once on mount and renders children

**Files:**
- Create: `src/components/AnalyticsProvider.test.tsx`
- Create: `src/components/AnalyticsProvider.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/AnalyticsProvider.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics", () => ({
  initAnalytics: vi.fn(),
}));

import { initAnalytics } from "@/lib/analytics";
import { AnalyticsProvider } from "./AnalyticsProvider";

afterEach(() => {
  vi.clearAllMocks();
});

describe("AnalyticsProvider", () => {
  it("calls initAnalytics on mount", () => {
    render(
      <AnalyticsProvider>
        <span>child</span>
      </AnalyticsProvider>,
    );

    expect(initAnalytics).toHaveBeenCalledTimes(1);
  });

  it("renders children", () => {
    render(
      <AnalyticsProvider>
        <span data-testid="probe">child</span>
      </AnalyticsProvider>,
    );

    expect(screen.getByTestId("probe")).toBeInTheDocument();
  });

  it("does not call initAnalytics more than once across re-renders", () => {
    const { rerender } = render(
      <AnalyticsProvider>
        <span>child</span>
      </AnalyticsProvider>,
    );

    rerender(
      <AnalyticsProvider>
        <span>child two</span>
      </AnalyticsProvider>,
    );

    expect(initAnalytics).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm test:run src/components/AnalyticsProvider.test.tsx
```

Expected: FAIL — module `./AnalyticsProvider` not found.

- [ ] **Step 3: Create the provider**

Create `src/components/AnalyticsProvider.tsx`:

```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initAnalytics } from "@/lib/analytics";

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    initAnalytics();
  }, []);

  return <>{children}</>;
};
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm test:run src/components/AnalyticsProvider.test.tsx
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/AnalyticsProvider.tsx src/components/AnalyticsProvider.test.tsx
git commit -m "feat(analytics): add AnalyticsProvider client component"
```

---

## Phase 4 — Reverse proxy + env config (escape-hatch: manual verification)

### Task 11: Configure `next.config.ts` rewrites

**Files:**
- Modify: `next.config.ts`

Manual verification only — no unit test. Verified end-to-end in Phase 7.

- [ ] **Step 1: Replace `next.config.ts`**

Overwrite `next.config.ts` with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
```

- [ ] **Step 2: Smoke-test the dev server still starts**

Run:

```bash
pnpm dev
```

Expected: server starts on port 3000 with no config errors. Stop with Ctrl-C once the "Ready" line appears.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat(analytics): proxy /ingest/* to posthog us cloud"
```

---

### Task 12: Add `.env.example`

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create `.env.example`**

```
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=/ingest
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: document posthog env vars in .env.example"
```

---

## Phase 5 — TDD `LandingPage` event wiring

Tests mock `@/lib/analytics` and use the Mantine-wrapped `renderWithProviders`. Each test renders the full `<LandingPage />` and drives interactions via `userEvent`.

The wiring changes accumulate across the next tasks. By the end of Phase 5, `LandingPage.tsx` will have the `ctaClickedRef` pattern plus all 6 event handlers wired.

### Task 13: RESUME click fires resume_clicked

**Files:**
- Create: `src/components/pages/LandingPage/LandingPage.test.tsx`
- Modify: `src/components/pages/LandingPage/LandingPage.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/pages/LandingPage/LandingPage.test.tsx`:

```tsx
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics", () => ({
  trackResumeClick: vi.fn(),
  trackLinkedinClick: vi.fn(),
  trackContactModalOpen: vi.fn(),
  trackContactModalDismiss: vi.fn(),
  trackWhatsappClick: vi.fn(),
  trackEmailClick: vi.fn(),
}));

import {
  trackContactModalDismiss,
  trackContactModalOpen,
  trackEmailClick,
  trackLinkedinClick,
  trackResumeClick,
  trackWhatsappClick,
} from "@/lib/analytics";
import { renderWithProviders, screen } from "@/test/render";

import { LandingPage } from "./LandingPage";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LandingPage analytics", () => {
  it("fires resume_clicked when the RESUME link is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    const link = screen.getByRole("link", { name: /resume/i });
    await user.click(link);

    expect(trackResumeClick).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:run src/components/pages/LandingPage/LandingPage.test.tsx
```

Expected: FAIL — `trackResumeClick` was not called.

- [ ] **Step 3: Wire the event**

In `src/components/pages/LandingPage/LandingPage.tsx`:

1. Add an import at the top of the file (near the other `@/` imports):

```tsx
import { trackResumeClick } from "@/lib/analytics";
```

2. Find the RESUME `<a>` (currently around lines 346–363) and add the `onClick`:

```tsx
<a
  className="flex flex-row h-[35px] md:h-[80px] cursor-pointer"
  href={RESUME_LINK}
  target="_blank"
  rel="noopener noreferrer"
  onClick={() => trackResumeClick()}
>
```

3. Remove the analytics TODO line (currently line 39):

```tsx
// TODO: add sort of analytics (e.g., track clicks on accordions, time spent on page, etc.)
```

- [ ] **Step 4: Run test**

Run:

```bash
pnpm test:run src/components/pages/LandingPage/LandingPage.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/LandingPage/LandingPage.tsx src/components/pages/LandingPage/LandingPage.test.tsx
git commit -m "feat(analytics): track RESUME clicks on landing page"
```

---

### Task 14: LINKEDIN click fires linkedin_clicked

**Files:**
- Modify: `src/components/pages/LandingPage/LandingPage.test.tsx`
- Modify: `src/components/pages/LandingPage/LandingPage.tsx`

- [ ] **Step 1: Append the failing test**

In `LandingPage.test.tsx`, inside `describe("LandingPage analytics", ...)`:

```tsx
  it("fires linkedin_clicked when the LINKEDIN link is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    const link = screen.getByRole("link", { name: /linkedin/i });
    await user.click(link);

    expect(trackLinkedinClick).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:run src/components/pages/LandingPage/LandingPage.test.tsx
```

Expected: the new test FAILS — `trackLinkedinClick` was not called.

- [ ] **Step 3: Wire the event**

In `LandingPage.tsx`:

1. Extend the analytics import:

```tsx
import { trackLinkedinClick, trackResumeClick } from "@/lib/analytics";
```

2. Find the LINKEDIN `<a>` (currently around lines 379–396) and add the `onClick`:

```tsx
<a
  className="flex flex-row h-[35px] md:h-[80px] cursor-pointer"
  href={LINKEDIN_LINK}
  target="_blank"
  rel="noopener noreferrer"
  onClick={() => trackLinkedinClick()}
>
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm test:run src/components/pages/LandingPage/LandingPage.test.tsx
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/LandingPage/LandingPage.tsx src/components/pages/LandingPage/LandingPage.test.tsx
git commit -m "feat(analytics): track LINKEDIN clicks on landing page"
```

---

### Task 15: CONTACT ME button fires contact_modal_opened

**Files:**
- Modify: `src/components/pages/LandingPage/LandingPage.test.tsx`
- Modify: `src/components/pages/LandingPage/LandingPage.tsx`

- [ ] **Step 1: Append the failing test**

```tsx
  it("fires contact_modal_opened when CONTACT ME is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    const button = screen.getByRole("button", { name: /contact me/i });
    await user.click(button);

    expect(trackContactModalOpen).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:run src/components/pages/LandingPage/LandingPage.test.tsx
```

Expected: the new test FAILS — `trackContactModalOpen` was not called.

- [ ] **Step 3: Wire the event**

In `LandingPage.tsx`:

1. Extend the analytics import:

```tsx
import {
  trackContactModalOpen,
  trackLinkedinClick,
  trackResumeClick,
} from "@/lib/analytics";
```

2. Find the CONTACT ME `<button>` (currently around lines 413–429) and change the `onClick`:

```tsx
<button
  type="button"
  className="flex flex-row h-[35px] md:h-[80px] cursor-pointer"
  onClick={() => {
    trackContactModalOpen();
    open();
  }}
>
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm test:run src/components/pages/LandingPage/LandingPage.test.tsx
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/LandingPage/LandingPage.tsx src/components/pages/LandingPage/LandingPage.test.tsx
git commit -m "feat(analytics): track CONTACT MODAL open on landing page"
```

---

### Task 16: Modal dismiss via ESC fires contact_modal_dismissed

**Files:**
- Modify: `src/components/pages/LandingPage/LandingPage.test.tsx`
- Modify: `src/components/pages/LandingPage/LandingPage.tsx`

This task introduces the `ctaClickedRef` pattern.

- [ ] **Step 1: Append the failing test**

```tsx
  it("fires contact_modal_dismissed when modal is closed via ESC without a CTA click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(screen.getByRole("button", { name: /contact me/i }));
    await user.keyboard("{Escape}");

    expect(trackContactModalDismiss).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:run src/components/pages/LandingPage/LandingPage.test.tsx
```

Expected: the new test FAILS — `trackContactModalDismiss` was not called.

- [ ] **Step 3: Wire the dismiss handler**

In `LandingPage.tsx`:

1. Extend the analytics import:

```tsx
import {
  trackContactModalDismiss,
  trackContactModalOpen,
  trackLinkedinClick,
  trackResumeClick,
} from "@/lib/analytics";
```

2. Add `useRef` to the existing React import:

```tsx
import { useEffect, useRef, useState } from "react";
```

3. Inside `LandingPage`, just after the `useDisclosure` line, add:

```tsx
const ctaClickedRef = useRef(false);

const handleModalClose = () => {
  if (!ctaClickedRef.current) trackContactModalDismiss();
  ctaClickedRef.current = false;
  close();
};
```

4. Update the `<Modal>` opening tag:

```tsx
<Modal opened={opened} onClose={handleModalClose} centered size="auto">
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm test:run src/components/pages/LandingPage/LandingPage.test.tsx
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/LandingPage/LandingPage.tsx src/components/pages/LandingPage/LandingPage.test.tsx
git commit -m "feat(analytics): track CONTACT MODAL dismiss without engagement"
```

---

### Task 17: WhatsApp click fires whatsapp_clicked and suppresses dismiss

**Files:**
- Modify: `src/components/pages/LandingPage/LandingPage.test.tsx`
- Modify: `src/components/pages/LandingPage/LandingPage.tsx`

- [ ] **Step 1: Append the failing tests**

```tsx
  it("fires whatsapp_clicked and does not fire dismiss when WhatsApp link is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(screen.getByRole("button", { name: /contact me/i }));
    await user.click(screen.getByRole("link", { name: /message me on whatsapp/i }));

    expect(trackWhatsappClick).toHaveBeenCalledTimes(1);
    expect(trackContactModalDismiss).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:run src/components/pages/LandingPage/LandingPage.test.tsx
```

Expected: the new test FAILS — `trackWhatsappClick` not called (and dismiss may have been called).

- [ ] **Step 3: Wire the event**

In `LandingPage.tsx`:

1. Extend the analytics import:

```tsx
import {
  trackContactModalDismiss,
  trackContactModalOpen,
  trackLinkedinClick,
  trackResumeClick,
  trackWhatsappClick,
} from "@/lib/analytics";
```

2. Add the WhatsApp handler near `handleModalClose`:

```tsx
const handleWhatsappClick = () => {
  ctaClickedRef.current = true;
  trackWhatsappClick();
};
```

3. Update the WhatsApp `<a>` (currently inside the modal, around lines 237–252):

```tsx
<a
  className="flex flex-col items-center bg-[#128c7e] rounded-[20px] px-[30px] py-[15px] w-full max-w-full cursor-pointer hover:scale-[1.02] transition-transform"
  href="https://wa.me/5512981276618?text=Hello%20Leonardo%2C%20I%27m%20interested%20in%20discussing%20a%20project%20opportunity%20with%20you."
  target="_blank"
  rel="noopener noreferrer"
  onClick={handleWhatsappClick}
>
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm test:run src/components/pages/LandingPage/LandingPage.test.tsx
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/LandingPage/LandingPage.tsx src/components/pages/LandingPage/LandingPage.test.tsx
git commit -m "feat(analytics): track WhatsApp click and suppress dismiss"
```

---

### Task 18: Email click fires email_clicked, suppresses dismiss, preserves clipboard write

**Files:**
- Modify: `src/components/pages/LandingPage/LandingPage.test.tsx`
- Modify: `src/components/pages/LandingPage/LandingPage.tsx`

- [ ] **Step 1: Append the failing tests**

```tsx
  it("fires email_clicked, copies email to clipboard, and does not fire dismiss when email link is clicked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(screen.getByRole("button", { name: /contact me/i }));
    await user.click(screen.getByRole("link", { name: /send me an email/i }));

    expect(trackEmailClick).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(
      "negocios.leonardosarmentocastro@gmail.com",
    );
    expect(trackContactModalDismiss).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:run src/components/pages/LandingPage/LandingPage.test.tsx
```

Expected: the new test FAILS — `trackEmailClick` not called.

- [ ] **Step 3: Wire the event**

In `LandingPage.tsx`:

1. Extend the analytics import:

```tsx
import {
  trackContactModalDismiss,
  trackContactModalOpen,
  trackEmailClick,
  trackLinkedinClick,
  trackResumeClick,
  trackWhatsappClick,
} from "@/lib/analytics";
```

2. Add the email handler near the WhatsApp handler:

```tsx
const handleEmailClick = () => {
  ctaClickedRef.current = true;
  trackEmailClick();
  navigator.clipboard.writeText("negocios.leonardosarmentocastro@gmail.com");
  notifications.show({
    color: "red",
    title: "Email copied",
    message:
      'The email "negocios.leonardosarmentocastro@gmail.com" has been copied to clipboard!',
  });
};
```

3. Update the email `<a>` (currently around lines 253–276): replace the existing inline `onClick` with the handler. The full element becomes:

```tsx
<a
  className="flex flex-col items-center bg-[#BB001B] rounded-[20px] px-[30px] py-[15px] w-full max-w-full cursor-pointer hover:scale-[1.02] transition-transform"
  href="mailto:negocios.leonardosarmentocastro@gmail.com?subject=Project%20Opportunity%20Inquiry&body=Hello%20Leonardo%2C%0A%0AI%27m%20interested%20in%20discussing%20a%20potential%20project%20opportunity%20with%20you.%0A%0ABest%20regards"
  onClick={handleEmailClick}
>
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm test:run src/components/pages/LandingPage/LandingPage.test.tsx
```

Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/LandingPage/LandingPage.tsx src/components/pages/LandingPage/LandingPage.test.tsx
git commit -m "feat(analytics): track email click and suppress dismiss"
```

---

### Task 19: Ref reset across reopens

**Files:**
- Modify: `src/components/pages/LandingPage/LandingPage.test.tsx`

Regression test that the `ctaClickedRef` resets between modal sessions so a second open-then-dismiss still fires the dismiss event. No implementation change expected — this should pass against the code from Task 18.

- [ ] **Step 1: Append the test**

```tsx
  it("fires dismiss again on a second open-and-dismiss cycle after a CTA click in the first cycle", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    // First cycle: open, click WhatsApp (suppresses dismiss).
    await user.click(screen.getByRole("button", { name: /contact me/i }));
    await user.click(screen.getByRole("link", { name: /message me on whatsapp/i }));

    expect(trackContactModalDismiss).not.toHaveBeenCalled();

    // Second cycle: open, ESC (should fire dismiss).
    await user.click(screen.getByRole("button", { name: /contact me/i }));
    await user.keyboard("{Escape}");

    expect(trackContactModalDismiss).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 2: Run tests**

Run:

```bash
pnpm test:run src/components/pages/LandingPage/LandingPage.test.tsx
```

Expected: 7 passed. If the new test fails, the `ctaClickedRef.current = false;` line in `handleModalClose` is missing — restore it.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/LandingPage/LandingPage.test.tsx
git commit -m "test(analytics): lock in CTA ref reset across modal cycles"
```

---

## Phase 6 — Wire provider into layout

### Task 20: Mount `<AnalyticsProvider>` in `app/layout.tsx`

**Files:**
- Modify: `src/app/layout.tsx`

No unit test added here — the provider's behaviour is already covered, and the layout file is a thin wiring point.

- [ ] **Step 1: Add the import**

Near the other `@/` and Mantine imports in `src/app/layout.tsx`:

```tsx
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
```

- [ ] **Step 2: Wrap children**

Replace the existing `MantineProvider`/`ModalsProvider` block:

```tsx
<MantineProvider theme={theme}>
  <ModalsProvider>
    {children}
    <Notifications />
  </ModalsProvider>
</MantineProvider>
```

with:

```tsx
<MantineProvider theme={theme}>
  <AnalyticsProvider>
    <ModalsProvider>
      {children}
      <Notifications />
    </ModalsProvider>
  </AnalyticsProvider>
</MantineProvider>
```

- [ ] **Step 3: Smoke-test the dev server**

Run:

```bash
pnpm dev
```

Then in another terminal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
```

Expected: `200`. Stop the dev server with Ctrl-C.

- [ ] **Step 4: Run the full test suite**

```bash
pnpm test:run
```

Expected: all tests pass (4 init + 6 trackers + 3 provider + 7 landing-page wiring = 20 passed).

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(analytics): mount AnalyticsProvider in root layout"
```

---

## Phase 7 — Manual verification & deploy (escape-hatch: out-of-scope for TDD)

These steps are performed by the developer; they cannot be automated through unit tests because they exercise the network, Vercel config, and PostHog Cloud.

### Task 21: Local dev verification — events should NOT fire

- [ ] **Step 1: Start the dev server**

```bash
pnpm dev
```

- [ ] **Step 2: In the browser**

Open `http://localhost:3000/`. Open DevTools → Network tab. Filter for `ingest`.

- [ ] **Step 3: Click every CTA**

Click RESUME (opens new tab — close it). Click LINKEDIN (close new tab). Click CONTACT ME. Press ESC. Click CONTACT ME again. Click WhatsApp (close new tab). Click CONTACT ME again. Click the email link (close new tab).

- [ ] **Step 4: Assert silence**

In the Network panel: zero requests matching `/ingest/*`. In the Console panel: no PostHog warnings or errors. In DevTools → Application → Cookies (for `localhost:3000`): empty. `localStorage`: empty.

If any of the above is violated, fix the dev-mode gate before moving on.

- [ ] **Step 5: Stop the dev server**

Ctrl-C.

---

### Task 22: Create the PostHog Cloud project

These are clicks in the PostHog UI. Document the resulting key in `.env.local` (gitignored).

- [ ] **Step 1: Sign in to PostHog Cloud (US region)**

Go to `https://us.posthog.com/signup`. Sign in or create an account.

- [ ] **Step 2: Create a new project**

Name: `leonardosarmentodecastro.com`. Region: US. Skip the onboarding wizard's SDK install step (we already wrote the code).

- [ ] **Step 3: Copy the project API key**

Project Settings → "Project API Key" (starts with `phc_`). Copy it.

- [ ] **Step 4: Create `.env.local` in the repo root**

```
NEXT_PUBLIC_POSTHOG_KEY=phc_paste_real_key_here
NEXT_PUBLIC_POSTHOG_HOST=/ingest
```

Confirm `.env.local` is **not** tracked by git (`git status` should not list it).

- [ ] **Step 5: Set the same env vars in Vercel**

Vercel dashboard → Project → Settings → Environment Variables. Add:
- `NEXT_PUBLIC_POSTHOG_KEY` = (the `phc_...` value), Environment: Production only.
- `NEXT_PUBLIC_POSTHOG_HOST` = `/ingest`, Environment: Production only.

Save.

---

### Task 23: Production deploy and verification

- [ ] **Step 1: Push to main**

```bash
git push origin main
```

Vercel auto-deploys. Wait for the production deployment to finish (green checkmark in Vercel dashboard).

- [ ] **Step 2: Visit the live site in incognito**

Open `https://leonardosarmentodecastro.com` in a private window.

- [ ] **Step 3: Open DevTools → Network tab, filter for `ingest`**

You should see at least one POST to `/ingest/decide/` and one to `/ingest/e/` on page load (the `$pageview`). The Host column should be `leonardosarmentodecastro.com`, never `*.posthog.com`.

- [ ] **Step 4: Click every CTA**

RESUME, LINKEDIN, CONTACT ME → ESC, CONTACT ME → WhatsApp, CONTACT ME → email. After each click, check the Network panel for a new POST to `/ingest/e/`.

- [ ] **Step 5: Verify in PostHog**

PostHog Cloud → Activity tab. Confirm all 7 distinct events appear within ~30 seconds: `$pageview`, `resume_clicked`, `linkedin_clicked`, `contact_modal_opened`, `contact_modal_dismissed`, `whatsapp_clicked`, `email_clicked`. Click into each and confirm the property values match the table in the spec.

- [ ] **Step 6: Confirm cookieless**

DevTools → Application → Cookies for the site origin: empty. `localStorage`: empty.

- [ ] **Step 7: Ad-blocker test**

Enable uBlock Origin (or Brave Shields) in another browser. Visit the site again, click a CTA, confirm a new event arrives in PostHog. If events are blocked, the proxy isn't wired up correctly.

---

### Task 24: Build the PostHog dashboards

- [ ] **Step 1: Create the CV funnel**

PostHog → Insights → New insight → Funnel.
- Step 1: `$pageview`
- Step 2: `resume_clicked`
Save as "CV funnel".

- [ ] **Step 2: Create the Contact funnel**

New insight → Funnel.
- Step 1: `$pageview`
- Step 2: `contact_modal_opened`
- Step 3: `whatsapp_clicked OR email_clicked`
Save as "Contact funnel".

- [ ] **Step 3: Create a referrer breakdown**

New insight → Trends.
- Event: `$pageview`
- Breakdown: `$referrer`
Save as "Pageviews by referrer".

- [ ] **Step 4: Pin all three to a dashboard**

New dashboard "Job search funnel". Pin the three insights.

---

## End-of-implementation gate

Before closing this work out, confirm:

- [ ] `pnpm test:run` passes — 20 tests green.
- [ ] `pnpm lint` passes (Biome).
- [ ] `pnpm build` succeeds.
- [ ] Production deploy is live and PostHog Activity tab shows events from your own incognito click-through.
- [ ] The "CV funnel" and "Contact funnel" dashboards have at least 1 event each.

Once green, the LinkedIn post can go live.
