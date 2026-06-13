# Traffic source attribution — design

**Date:** 2026-06-12
**Topic:** Tag inbound links to `leonardosarmentodecastro.com` with a traffic-source identifier so PostHog can attribute pageviews to their origin (LinkedIn post, GitHub profile, newsletter, etc.).

---

## Problem

The PostHog integration (`src/analytics/`) captures pageviews and a small set of explicit click events, but it cannot tell **where** a visitor came from. The motivating scenario is the next "I'm looking for new positions" LinkedIn post: after posting, the author wants to answer *"how many pageviews came from LinkedIn?"* The current setup cannot answer that question.

## Goals

- A repeatable, low-friction way to generate a tagged URL for each campaign (LinkedIn post, conference talk slide, newsletter footer, etc.).
- Tagged pageviews appear in PostHog under a stable, standard property so they can be filtered and grouped.
- The convention is consistent over time — no fragmentation between `linkedin` / `LinkedIn` / `linked-in`.
- A durable per-campaign record (planned channel, draft post, retrospective) that is **not** mixed into the codebase or its deploy history.

## Non-goals

- Building any PostHog dashboards (one-time manual UI step).
- Persistent cross-session attribution — the analytics layer is intentionally anonymous (`person_profiles: "never"`, `persistence: "memory"`). Per-pageview attribution is sufficient for the goal.
- A custom `traffic_source_landed` event on top of UTM auto-capture — adds complexity for no new information.
- Any new runtime code in the client bundle.

## Decision: convention

Use **standard UTM query parameters** (`utm_source`, `utm_medium`, `utm_campaign`, optional `utm_content`).

Rationale: PostHog's `posthog-js` SDK auto-captures `utm_*` query params onto every `$pageview` event as `$utm_source`, `$utm_medium`, etc. With `capture_pageview: true` already set in `instrumentation-client.ts`, **the attribution mechanism already works today with zero runtime code**. A link like
`https://leonardosarmentodecastro.com/?utm_source=linkedin&utm_medium=social&utm_campaign=job-search-2026`
is fully attributed the moment a visitor lands on it.

Alternatives considered:

- **Custom param `?source=linkedin`** — shorter URL, but loses every built-in PostHog UTM report and requires custom capture code. Rejected.
- **Custom param mapped internally to UTM** — gets short URLs but adds a translation layer. Rejected (no real benefit over plain UTM).

## Decision: ergonomics — interactive wizard

The author has to type `utm_source=linkedin&utm_medium=social&utm_campaign=...` correctly every time they post. The mitigation is a small CLI that generates the URL.

- **Form:** an always-interactive wizard built on [`@clack/prompts`](https://github.com/bombshell-dev/clack). No flag mode, no positional args.
- **Runner:** `tsx`, executed via `pnpm campaign-url`.
- **Selects are strict:** `source` and `medium` are chosen from a closed list. New values require editing `CAMPAIGN_SOURCES` / `CAMPAIGN_MEDIUMS` in `src/analytics/campaigns.ts` and re-running. This friction is intentional — it prevents `linkedin` / `LinkedIn` / `linked-in` fragmentation over years of posts.
- **Campaign slug** is free-form text, validated to `[a-z0-9-]+`.
- **`utm_content`, custom `path`, and base URL overrides** are gated behind explicit "override?" confirms so the happy path stays three prompts.

## Decision: per-campaign record lives in GitHub issues

The original sketch exported a typed constant per campaign (`linkedinJobSearch2026Url`). That was rejected once the consumption pattern was traced:

- No component imports campaign URLs.
- No test imports them.
- The wizard *generates* them.

So a per-campaign code constant solves a problem that does not exist on this site. It also has real costs:

1. **Every campaign would trigger a Vercel production deploy** (per `CLAUDE.md`, every push to `main` rebuilds prod).
2. **`campaigns.ts` accumulates stale exports** that no consumer ever imports.
3. **The constant captures the URL but not the surrounding context** — draft post, live post link, retrospective — which is the more valuable record.

A GitHub issue per campaign captures all of it, plus state (open while active → closed with retro), with no deploys.

Convention:

- Label: `campaign`.
- Title: `[campaign] <source>/<slug>`, mirroring the UTM values so the link between issue and PostHog data is unambiguous.
- Created via a `.github/ISSUE_TEMPLATE/campaign.yml` issue form so each campaign captures the same fields.
- Issue lifecycle: **open** while actively driving traffic → **closed** once the retrospective is filled in. Closed issues are the campaign history.

The wizard's outro prints a prefilled "New issue" deep link (`/issues/new?template=campaign.yml&title=...&url=...`) right under the generated URL — most terminals make it clickable.

---

## Architecture

```
src/
  analytics/
    events.ts                      # unchanged
    campaigns.ts                   # NEW
    scripts/
      campaign-url.ts              # NEW
    __tests__/
      events.test.ts               # unchanged
      campaigns.test.ts            # NEW
    README.md                      # UPDATED — adds "Traffic source attribution" section
.github/
  ISSUE_TEMPLATE/
    campaign.yml                   # NEW
package.json                       # UPDATED — adds tsx + @clack/prompts devDeps, adds "campaign-url" script
```

Everything stays inside the existing `src/analytics/` domain folder per the project's domain-organisation convention. No new top-level folders.

### `src/analytics/campaigns.ts` — public API

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
  campaign: string;          // free-form slug, e.g. "job-search-2026"
  content?: string;          // optional utm_content
  path?: string;             // default "/"
  baseUrl?: string;          // default "https://leonardosarmentodecastro.com"
};

export const buildCampaignUrl = (params: CampaignParams): string;
```

Implementation notes:

- Built with `new URL(path, baseUrl)` + `URLSearchParams`. No string concatenation — no malformed or mis-encoded output.
- Default `baseUrl` is `"https://leonardosarmentodecastro.com"` (matches `robots.ts` and the longer canonical host in `sitemap.ts`).
- The runtime arrays (`CAMPAIGN_SOURCES`, `CAMPAIGN_MEDIUMS`) and the compile-time types are derived from the same constants. Adding `bluesky` is a one-line edit; both the wizard's select and `buildCampaignUrl`'s parameter type update together.
- **No per-campaign exports.** That responsibility is delegated to GitHub issues.

### `src/analytics/scripts/campaign-url.ts` — wizard

A thin (~50 line) orchestrator over `@clack/prompts`:

1. `intro("Generate a campaign URL")`
2. `select` source from `CAMPAIGN_SOURCES`
3. `select` medium from `CAMPAIGN_MEDIUMS`
4. `text` campaign slug, validated `/^[a-z0-9-]+$/`
5. `confirm` "Add utm_content?" → `text` if yes
6. `confirm` "Override path?" → `text` if yes (default `/`)
7. `confirm` "Override base URL?" → `text` if yes
8. Call `buildCampaignUrl(...)`.
9. `outro` prints two lines: the generated URL, then a prefilled `https://github.com/<repo>/issues/new?template=campaign.yml&title=...&url=...` deep link.

Each prompt is followed by an `isCancel(...)` check that calls `cancel()` and exits 0 on Ctrl-C. No partial URLs are ever printed.

The repo path for the deep link is a constant at the top of the file (`leonardosarmentocastro/leonardosarmentodecastro.com`). No platform-specific spawn / `open` calls.

### `.github/ISSUE_TEMPLATE/campaign.yml`

Issue form with the following fields:

| Field | Type | Required | Purpose |
|---|---|---|---|
| `url` | input | yes | The tagged URL produced by `pnpm campaign-url`. |
| `where` | textarea | no | Channel, audience, planned post date. |
| `post` | textarea | no | Draft post text or link to it. |
| `live` | input | no | URL of the live post (filled in after publishing). |
| `retro` | textarea | no | Retrospective filled in ~30 days later (PostHog numbers, what worked). |

Auto-applied label: `campaign`. Default title: `[campaign] <source>/<slug>` (the wizard's deep link prefills this).

### `src/analytics/README.md` — updates

A new top-level section, **Traffic source attribution**, covering:

- The UTM convention (which params, why standard UTM and not a custom param).
- That PostHog auto-captures UTM onto `$pageview` — no runtime code involved.
- How to generate a tagged URL (`pnpm campaign-url`).
- The GitHub-issue convention for tracking each campaign (label, title format, template).
- How to filter `$pageview` by `$utm_source` in PostHog to answer "how many came from LinkedIn?".

Placement: after the existing "Adding a new event" section, before "Files".

### `package.json` — updates

- Add devDependencies: `tsx`, `@clack/prompts`.
- Add script: `"campaign-url": "tsx src/analytics/scripts/campaign-url.ts"`.

---

## Data flow

```
        ┌──────────────────────────────────────────────────┐
        │ Author: pnpm campaign-url                        │
        │  → wizard collects {source, medium, campaign,…}  │
        │  → buildCampaignUrl(…) returns a tagged URL      │
        │  → wizard prints URL + new-issue deep link       │
        └──────────────────────────────────────────────────┘
                              │
                ┌─────────────┴──────────────┐
                ▼                            ▼
   Clicks deep link, fills           Pastes URL into the
   GitHub issue, submits             LinkedIn / etc. post
                │                            │
                ▼                            ▼
   Issue tracks the campaign         Visitor clicks → lands on site
   (open while active, closed                 │
    once retrospective is in)                 ▼
                                  posthog-js auto-captures
                                  $utm_source / $utm_medium /
                                  $utm_campaign onto $pageview
                                              │
                                              ▼
                                   PostHog: filter $pageview
                                   by $utm_source = "linkedin"
                                   → "how many came from LinkedIn?"
```

---

## Testing strategy

- **`buildCampaignUrl`** is the only thing with non-trivial logic and is fully unit-tested in `src/analytics/__tests__/campaigns.test.ts`. Cases:
  - Minimum-required params produce the canonical URL.
  - Optional `content` is added as `utm_content` when present, omitted when absent.
  - Custom `path` is honoured; default is `/`.
  - Custom `baseUrl` is honoured; default is `https://leonardosarmentodecastro.com`.
  - Slug values that need URL encoding are encoded correctly.
- **The wizard is not unit-tested.** Testing TTY-prompt sequences brings in PTY mocking for very little return on a hand-driven quarterly tool. All non-trivial logic lives in `buildCampaignUrl`, which is tested; the wizard is a thin orchestrator inspected by running it.
- **The issue template is not tested.** It is static YAML rendered by GitHub.

This matches the project's TDD convention (every wrapper in `events.ts` has a paired test in `__tests__/events.test.ts`) and the explicit `CLAUDE.md` escape hatch for cases where testing is genuinely impractical.

---

## Risks & open questions

- **`tsx` as a devDependency.** Standard choice for TS scripts in a Next codebase; risk is low. Alternative (Node 22+ native `--experimental-strip-types`) was considered and rejected as still flagged experimental.
- **The wizard's `select` lists are strictly the closed set — no "Other…" escape hatch.** Intentional. If a new source is needed, the only path is to edit `CAMPAIGN_SOURCES` in `campaigns.ts` and re-run the wizard. This is the friction that prevents long-term `linkedin` / `LinkedIn` / `linked-in` fragmentation.
- **The wizard prints a `github.com/.../issues/new` link with the repo path hardcoded.** If the repo ever moves, that's a one-line edit. Considered reading from `package.json#repository`; rejected as over-engineering for a single constant.
- **PostHog's auto-capture of UTM is implicit behaviour we depend on.** This is documented PostHog behaviour, in production for years, and verifiable by inspecting any `$pageview` event after the first tagged visit. No code changes needed.

---

## Out of scope (explicit)

- PostHog dashboard creation (manual UI step done once after the first campaign lands).
- Any `traffic_source_landed` custom event — UTM auto-capture is sufficient.
- Clipboard integration in the wizard.
- Auto-creating the GitHub issue from the wizard — printing a deep link is enough; the issue body benefits from manual editing anyway.
- Any change to `instrumentation-client.ts`, `next.config.ts`, or the `/ingest` proxy.
