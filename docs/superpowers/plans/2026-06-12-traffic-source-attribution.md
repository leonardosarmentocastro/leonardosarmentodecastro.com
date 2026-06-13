# Traffic source attribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive `pnpm campaign-url` wizard that generates UTM-tagged URLs for inbound traffic-source attribution, plus a GitHub issue template to track each campaign — so a future "I'm looking for new positions" LinkedIn post produces analytics PostHog can attribute.

**Architecture:** PostHog's `posthog-js` already auto-captures `utm_*` query params onto every `$pageview` (verified — `capture_pageview: true` is on in `instrumentation-client.ts`). No runtime code changes are needed. The work is entirely dev tooling: a pure `buildCampaignUrl(params)` function built TDD, an interactive `@clack/prompts` wizard that calls it, a GitHub issue template (`.github/ISSUE_TEMPLATE/campaign.yml`) that becomes the per-campaign log, and a README section in `src/analytics/README.md` documenting the whole convention.

**Tech Stack:** TypeScript strict mode, Vitest (existing test runner), `tsx` (new — TS script runner), `@clack/prompts` (new — interactive CLI prompts), pnpm, Biome (lint/format). Spec lives at `docs/superpowers/specs/2026-06-12-traffic-source-attribution-design.md`.

**Branch:** Work is on `feat/traffic-source-attribution` (already created — the spec commit is the first commit on this branch). Do not commit to `main`.

**Project conventions (read once before starting):**
- TDD non-negotiable. Red → green → refactor.
- Atomic commits — one logical change per commit.
- Domain organisation: every analytics file lives in `src/analytics/`. Tests live in `src/analytics/__tests__/`.
- Path alias: `@/*` → `src/*`.
- pnpm only (never npm/yarn). Biome only (never ESLint/Prettier).
- Vitest config and `vitest` script already exist; tests are run with `pnpm test:run` (one-shot) or `pnpm test` (watch).
- Existing test file `src/analytics/__tests__/events.test.ts` is the style reference for `describe`/`it` and imports from `"vitest"`.

---

## Task 1: Install dev dependencies

**Files:**
- Modify: `package.json` (add to `devDependencies`)
- Modify: `pnpm-lock.yaml` (auto-updated by pnpm)

- [ ] **Step 1: Install `tsx` and `@clack/prompts` as devDependencies**

Run:
```bash
pnpm add -D tsx @clack/prompts
```

Expected: `package.json#devDependencies` now contains `tsx` and `@clack/prompts` at their latest stable versions, and `pnpm-lock.yaml` is updated.

- [ ] **Step 2: Verify versions landed**

Run:
```bash
grep -E '"(tsx|@clack/prompts)"' package.json
```

Expected: two lines, one for each dep, with non-empty version strings.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add tsx and @clack/prompts for campaign-url wizard"
```

---

## Task 2: `buildCampaignUrl` — required UTM params only

**Files:**
- Create: `src/analytics/campaigns.ts`
- Create: `src/analytics/__tests__/campaigns.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/analytics/__tests__/campaigns.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildCampaignUrl } from "@/analytics/campaigns";

describe("buildCampaignUrl", () => {
  it("builds a URL with the required UTM params, default base, and root path", () => {
    expect(
      buildCampaignUrl({
        source: "linkedin",
        medium: "social",
        campaign: "job-search-2026",
      }),
    ).toBe(
      "https://leonardosarmentodecastro.com/?utm_source=linkedin&utm_medium=social&utm_campaign=job-search-2026",
    );
  });

  it("URL-encodes campaign values that contain characters needing encoding", () => {
    // The wizard's slug regex (/^[a-z0-9-]+$/) prevents this in practice,
    // but we depend on URLSearchParams to handle it safely if buildCampaignUrl
    // is ever called directly (e.g. from a test or a future script).
    expect(
      buildCampaignUrl({
        source: "linkedin",
        medium: "social",
        campaign: "needs encoding & stuff",
      }),
    ).toBe(
      "https://leonardosarmentodecastro.com/?utm_source=linkedin&utm_medium=social&utm_campaign=needs+encoding+%26+stuff",
    );
  });
});
```

Both tests pass with the minimal implementation in Step 3 — the encoding test is regression coverage for the URLSearchParams behaviour we depend on, not a TDD increment in its own right. It belongs in the same commit as the canonical test.

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test:run src/analytics/__tests__/campaigns.test.ts
```

Expected: FAIL — `Cannot find module '@/analytics/campaigns'` (or equivalent module-not-found error). This proves the test is wired up correctly and would catch the regression.

- [ ] **Step 3: Write the minimal implementation**

Create `src/analytics/campaigns.ts`:

```ts
export const CAMPAIGN_SOURCES = [
  "linkedin",
  "twitter",
  "github",
  "email",
  "newsletter",
] as const;
export type CampaignSource = (typeof CAMPAIGN_SOURCES)[number];

export const CAMPAIGN_MEDIUMS = ["social", "email", "referral"] as const;
export type CampaignMedium = (typeof CAMPAIGN_MEDIUMS)[number];

export type CampaignParams = {
  source: CampaignSource;
  medium: CampaignMedium;
  campaign: string;
  content?: string;
  path?: string;
  baseUrl?: string;
};

export const buildCampaignUrl = (params: CampaignParams): string => {
  const url = new URL("/", "https://leonardosarmentodecastro.com");
  url.searchParams.set("utm_source", params.source);
  url.searchParams.set("utm_medium", params.medium);
  url.searchParams.set("utm_campaign", params.campaign);
  return url.toString();
};
```

Note: the optional fields (`content`, `path`, `baseUrl`) are in the type signature already so the public API is stable across the next three tasks, but they are not yet used by the implementation. Subsequent tasks add a failing test per option and wire it in.

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test:run src/analytics/__tests__/campaigns.test.ts
```

Expected: PASS — 2 tests, all green.

- [ ] **Step 5: Commit**

```bash
git add src/analytics/campaigns.ts src/analytics/__tests__/campaigns.test.ts
git commit -m "feat(analytics): add buildCampaignUrl with required UTM params"
```

---

## Task 3: `buildCampaignUrl` — optional `utm_content`

**Files:**
- Modify: `src/analytics/campaigns.ts`
- Modify: `src/analytics/__tests__/campaigns.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside the existing `describe("buildCampaignUrl", () => { ... })` block in `src/analytics/__tests__/campaigns.test.ts`:

```ts
  it("appends utm_content when content is provided", () => {
    expect(
      buildCampaignUrl({
        source: "linkedin",
        medium: "social",
        campaign: "job-search-2026",
        content: "hero-cta",
      }),
    ).toBe(
      "https://leonardosarmentodecastro.com/?utm_source=linkedin&utm_medium=social&utm_campaign=job-search-2026&utm_content=hero-cta",
    );
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test:run src/analytics/__tests__/campaigns.test.ts
```

Expected: FAIL — the new test fails because the URL has no `&utm_content=hero-cta`. The first test still passes.

- [ ] **Step 3: Extend the implementation**

In `src/analytics/campaigns.ts`, inside `buildCampaignUrl`, add the `content` line immediately after the `utm_campaign` line:

```ts
  url.searchParams.set("utm_campaign", params.campaign);
  if (params.content !== undefined) {
    url.searchParams.set("utm_content", params.content);
  }
  return url.toString();
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test:run src/analytics/__tests__/campaigns.test.ts
```

Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/analytics/campaigns.ts src/analytics/__tests__/campaigns.test.ts
git commit -m "feat(analytics): support optional utm_content in buildCampaignUrl"
```

---

## Task 4: `buildCampaignUrl` — `path` override

**Files:**
- Modify: `src/analytics/campaigns.ts`
- Modify: `src/analytics/__tests__/campaigns.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside the `describe("buildCampaignUrl", ...)` block:

```ts
  it("honours a custom path override", () => {
    expect(
      buildCampaignUrl({
        source: "linkedin",
        medium: "social",
        campaign: "job-search-2026",
        path: "/about",
      }),
    ).toBe(
      "https://leonardosarmentodecastro.com/about?utm_source=linkedin&utm_medium=social&utm_campaign=job-search-2026",
    );
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test:run src/analytics/__tests__/campaigns.test.ts
```

Expected: FAIL — the path is still `/`, not `/about`.

- [ ] **Step 3: Extend the implementation**

In `src/analytics/campaigns.ts`, change the first line of `buildCampaignUrl`:

From:
```ts
  const url = new URL("/", "https://leonardosarmentodecastro.com");
```
To:
```ts
  const url = new URL(params.path ?? "/", "https://leonardosarmentodecastro.com");
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test:run src/analytics/__tests__/campaigns.test.ts
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/analytics/campaigns.ts src/analytics/__tests__/campaigns.test.ts
git commit -m "feat(analytics): support custom path override in buildCampaignUrl"
```

---

## Task 5: `buildCampaignUrl` — `baseUrl` override

**Files:**
- Modify: `src/analytics/campaigns.ts`
- Modify: `src/analytics/__tests__/campaigns.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside the `describe("buildCampaignUrl", ...)` block:

```ts
  it("honours a custom baseUrl override (e.g. the shorter canonical host)", () => {
    expect(
      buildCampaignUrl({
        source: "linkedin",
        medium: "social",
        campaign: "job-search-2026",
        baseUrl: "https://leonardosarmentocastro.com",
      }),
    ).toBe(
      "https://leonardosarmentocastro.com/?utm_source=linkedin&utm_medium=social&utm_campaign=job-search-2026",
    );
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
pnpm test:run src/analytics/__tests__/campaigns.test.ts
```

Expected: FAIL — the host is still the default longer canonical host.

- [ ] **Step 3: Extend the implementation**

In `src/analytics/campaigns.ts`, change the `new URL(...)` line:

From:
```ts
  const url = new URL(params.path ?? "/", "https://leonardosarmentodecastro.com");
```
To:
```ts
  const base = params.baseUrl ?? "https://leonardosarmentodecastro.com";
  const url = new URL(params.path ?? "/", base);
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
pnpm test:run src/analytics/__tests__/campaigns.test.ts
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/analytics/campaigns.ts src/analytics/__tests__/campaigns.test.ts
git commit -m "feat(analytics): support custom baseUrl override in buildCampaignUrl"
```

---

## Task 6: Traffic-source attribution convention — wizard + issue template + README

This task bundles the user-facing convention into a single coherent commit: the GitHub issue template, the CLI wizard, the `package.json` script wiring, and the README section that documents all of it. Per `CLAUDE.md`'s "update the domain README in the same commit that introduces a convention worth following" rule, these belong together.

**Files:**
- Create: `.github/ISSUE_TEMPLATE/campaign.yml`
- Create: `src/analytics/scripts/campaign-url.ts`
- Modify: `package.json` (add `scripts.campaign-url`)
- Modify: `src/analytics/README.md` (add "Traffic source attribution" section before the "Files" section)

- [ ] **Step 1: Create the GitHub issue template**

Create `.github/ISSUE_TEMPLATE/campaign.yml`:

```yaml
name: 📣 Campaign
description: Track a tagged-URL campaign (e.g. a LinkedIn post) so its PostHog attribution has matching context.
title: "[campaign] <source>/<slug>"
labels:
  - campaign
body:
  - type: input
    id: url
    attributes:
      label: Tagged URL
      description: Output of `pnpm campaign-url`.
      placeholder: https://leonardosarmentodecastro.com/?utm_source=linkedin&utm_medium=social&utm_campaign=...
    validations:
      required: true
  - type: textarea
    id: where
    attributes:
      label: Where will this be posted?
      description: Channel, audience, planned post date.
      placeholder: |
        Channel: LinkedIn
        Audience: my professional network
        Planned: 2026-07-01
  - type: textarea
    id: post
    attributes:
      label: Post draft or link to draft
      description: Paste the draft text here or link to wherever it lives.
  - type: input
    id: live
    attributes:
      label: Live post URL
      description: Fill this in after publishing.
      placeholder: https://www.linkedin.com/posts/...
  - type: textarea
    id: retro
    attributes:
      label: Retrospective
      description: Fill in ~30 days after posting. PostHog numbers (pageviews from this $utm_source), what worked, what didn't.
```

- [ ] **Step 2: Create the wizard**

Create `src/analytics/scripts/campaign-url.ts`:

```ts
#!/usr/bin/env -S pnpm tsx
import {
  cancel,
  confirm,
  intro,
  isCancel,
  outro,
  select,
  text,
} from "@clack/prompts";
import {
  buildCampaignUrl,
  CAMPAIGN_MEDIUMS,
  CAMPAIGN_SOURCES,
  type CampaignMedium,
  type CampaignParams,
  type CampaignSource,
} from "@/analytics/campaigns";

const REPO_PATH = "leonardosarmentocastro/leonardosarmentodecastro.com";
const SLUG_RE = /^[a-z0-9-]+$/;

const exitOnCancel = <T>(value: T | symbol): T => {
  if (isCancel(value)) {
    cancel("Cancelled. No URL generated.");
    process.exit(0);
  }
  return value as T;
};

const main = async (): Promise<void> => {
  intro("Generate a campaign URL");

  const source = exitOnCancel(
    await select<CampaignSource>({
      message: "Source?",
      options: CAMPAIGN_SOURCES.map((value) => ({ value, label: value })),
    }),
  );

  const medium = exitOnCancel(
    await select<CampaignMedium>({
      message: "Medium?",
      options: CAMPAIGN_MEDIUMS.map((value) => ({ value, label: value })),
    }),
  );

  const campaign = exitOnCancel(
    await text({
      message: "Campaign slug? (lowercase, [a-z0-9-]+)",
      placeholder: "job-search-2026",
      validate: (raw) => {
        if (raw.length === 0) return "Required.";
        if (!SLUG_RE.test(raw)) return "Use only lowercase letters, digits, and hyphens.";
      },
    }),
  );

  const wantsContent = exitOnCancel(
    await confirm({
      message: "Add utm_content? (rare — only for A/B variants of the same post)",
      initialValue: false,
    }),
  );
  const content = wantsContent
    ? exitOnCancel(
        await text({
          message: "utm_content value",
          placeholder: "hero-cta",
          validate: (raw) => (raw.length === 0 ? "Required." : undefined),
        }),
      )
    : undefined;

  const overridePath = exitOnCancel(
    await confirm({
      message: 'Override path? (default "/")',
      initialValue: false,
    }),
  );
  const path = overridePath
    ? exitOnCancel(
        await text({
          message: "Path",
          placeholder: "/about",
          validate: (raw) => (raw.startsWith("/") ? undefined : 'Must start with "/".'),
        }),
      )
    : undefined;

  const overrideBase = exitOnCancel(
    await confirm({
      message: "Override base URL? (default https://leonardosarmentodecastro.com)",
      initialValue: false,
    }),
  );
  const baseUrl = overrideBase
    ? exitOnCancel(
        await text({
          message: "Base URL",
          placeholder: "https://leonardosarmentocastro.com",
          validate: (raw) => {
            try {
              new URL(raw);
              return undefined;
            } catch {
              return "Must be a valid absolute URL.";
            }
          },
        }),
      )
    : undefined;

  const params: CampaignParams = {
    source,
    medium,
    campaign,
    content,
    path,
    baseUrl,
  };

  const url = buildCampaignUrl(params);

  const issueParams = new URLSearchParams({
    template: "campaign.yml",
    title: `[campaign] ${source}/${campaign}`,
    url,
  });
  const issueUrl = `https://github.com/${REPO_PATH}/issues/new?${issueParams.toString()}`;

  outro(`URL: ${url}\n\n📋 Track this campaign:\n${issueUrl}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: Wire the `pnpm campaign-url` script**

In `package.json`, add a new entry to `scripts` (alphabetical insertion — between `build` and `dev` keeps the existing pattern):

```json
"scripts": {
  "build": "next build --turbopack",
  "campaign-url": "tsx src/analytics/scripts/campaign-url.ts",
  "dev": "next dev --turbopack",
  "format": "biome format --write",
  "lint": "biome check --fix",
  "start": "next start",
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 4: Add the README section**

In `src/analytics/README.md`, insert a new section titled **"Traffic source attribution"** immediately before the existing `## Files` section (so it sits between "Adding a new event" and "Files"):

````markdown
---

## Traffic source attribution

Inbound links to the site can be tagged with standard [UTM query parameters](https://en.wikipedia.org/wiki/UTM_parameters) so PostHog can answer questions like *"how many pageviews came from the LinkedIn post I made last week?"*.

### How attribution works (no code involved)

`posthog-js` auto-captures any `utm_*` query parameter on the URL onto the `$pageview` event as `$utm_source`, `$utm_medium`, `$utm_campaign`, `$utm_content`, etc. Because `capture_pageview: true` is already set in `instrumentation-client.ts`, a link like

```
https://leonardosarmentodecastro.com/?utm_source=linkedin&utm_medium=social&utm_campaign=job-search-2026
```

is fully attributed the moment a visitor lands on it. No SDK changes, no per-page wiring.

### Generating a tagged URL — `pnpm campaign-url`

Run the interactive wizard:

```bash
pnpm campaign-url
```

It walks you through `source`, `medium`, `campaign` (slug), and optional `utm_content` / `path` / base-URL overrides, then prints:

1. The tagged URL — paste into your LinkedIn post, email signature, etc.
2. A prefilled "New campaign issue" deep link — see below.

`source` and `medium` are closed lists defined in `src/analytics/campaigns.ts` as `CAMPAIGN_SOURCES` and `CAMPAIGN_MEDIUMS`. To add a new value (e.g. `bluesky`), edit those arrays and re-run the wizard. This friction is intentional — it prevents `linkedin` / `LinkedIn` / `linked-in` fragmentation across years of campaigns.

### Tracking each campaign as a GitHub issue

Each campaign gets a GitHub issue using the **Campaign** template (`.github/ISSUE_TEMPLATE/campaign.yml`). The wizard's outro prints a deep link that prefills the title and URL — one click and you're on a half-filled "New issue" form.

Convention:

- **Label:** `campaign` (auto-applied by the template).
- **Title:** `[campaign] <source>/<slug>` — mirrors the UTM values so the link between issue and PostHog data is unambiguous.
- **Lifecycle:** open while actively driving traffic → closed once the retrospective is filled in. Closed issues are the campaign history.
- **No per-campaign constants in code.** A typed export per campaign would trigger a Vercel production deploy for every post (see the project's branching note) and capture only the URL — issues capture the URL plus the draft, the live post link, and the retrospective.

### Answering "how many came from LinkedIn?" in PostHog

In PostHog: build a Trends insight on `$pageview` filtered by `$utm_source = "linkedin"` (and optionally `$utm_campaign = "job-search-2026"` for a single campaign). The same property is also available as a breakdown.

````

- [ ] **Step 5: Verify everything compiles and is formatted**

Run:
```bash
pnpm lint
pnpm test:run
```

Expected:
- `pnpm lint` — passes (Biome may auto-format the new files; that's expected and the changes should be staged with the commit).
- `pnpm test:run` — all tests pass (the campaigns suite from Tasks 2–5 still passes; no new tests were added in this task).

- [ ] **Step 6: Manually smoke-test the wizard** *(skip if running this plan as a subagent — interactive prompts can't be driven without a TTY; flag this step as deferred-to-human in the task report)*

Run:
```bash
pnpm campaign-url
```

Walk through the prompts choosing `linkedin` / `social` / `job-search-2026`, decline all optional overrides. Expected output:

```
URL: https://leonardosarmentodecastro.com/?utm_source=linkedin&utm_medium=social&utm_campaign=job-search-2026

📋 Track this campaign:
https://github.com/leonardosarmentocastro/leonardosarmentodecastro.com/issues/new?template=campaign.yml&title=%5Bcampaign%5D+linkedin%2Fjob-search-2026&url=https%3A%2F%2Fleonardosarmentodecastro.com%2F%3Futm_source%3Dlinkedin%26utm_medium%3Dsocial%26utm_campaign%3Djob-search-2026
```

Also verify Ctrl-C at any prompt prints `Cancelled. No URL generated.` and exits cleanly (no partial URL printed, exit code 0).

- [ ] **Step 7: Commit**

```bash
git add .github/ISSUE_TEMPLATE/campaign.yml \
        src/analytics/scripts/campaign-url.ts \
        src/analytics/README.md \
        package.json
git commit -m "feat(analytics): add traffic-source attribution convention (wizard + issue template)"
```

---

## Task 7: Final verification

Not a feature commit — a verification sweep before opening a PR. Only commits if the previous step's lint/format auto-fixes were missed (in which case the auto-fixes should be amended into Task 6's commit per the agent rules, but in practice `pnpm lint` was run in Task 6 Step 5 so there should be nothing to fix here).

**Files:** none modified.

- [ ] **Step 1: Lint**

Run:
```bash
pnpm lint
```

Expected: PASS, no changes (any auto-fix would mean Task 6 Step 5 was skipped).

- [ ] **Step 2: Typecheck + production build**

Run:
```bash
pnpm build
```

Expected: PASS — Next.js production build succeeds, no TypeScript errors. (The wizard script lives under `src/` but is excluded from the runtime bundle because nothing in the app imports it. The path alias resolves at build/test time only.)

- [ ] **Step 3: Full test suite**

Run:
```bash
pnpm test:run
```

Expected: PASS — both `events.test.ts` (6 tests, unchanged) and `campaigns.test.ts` (5 tests, added in Tasks 2–5) green.

- [ ] **Step 4: Review the commit history of the branch**

Run:
```bash
git log --oneline main..HEAD
```

Expected: 7 commits in this order (top is most recent):
```
<hash> feat(analytics): add traffic-source attribution convention (wizard + issue template)
<hash> feat(analytics): support custom baseUrl override in buildCampaignUrl
<hash> feat(analytics): support custom path override in buildCampaignUrl
<hash> feat(analytics): support optional utm_content in buildCampaignUrl
<hash> feat(analytics): add buildCampaignUrl with required UTM params
<hash> chore: add tsx and @clack/prompts for campaign-url wizard
<hash> docs(analytics): brainstorm spec for traffic source attribution
```

If anything is missing or out of order, surface it to the user before pushing. Do not push to `main` (per `CLAUDE.md`).
