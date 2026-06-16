# `src/analytics/`

Client-side product analytics for the site, powered by [PostHog](https://posthog.com) (`posthog-js`).

This folder owns:

- The **typed event API** (`events.ts`) — every event captured by the app is a wrapper exported from here.
- The **tests** for that API (`__tests__/events.test.ts`).

It does **not** own:

- `instrumentation-client.ts` (repo root) — Next.js convention requires that file to live there. It calls `posthog.init(...)` once per browser session. See [PostHog initialization](#posthog-initialization).
- `next.config.ts` (repo root) — declares the `/ingest` reverse-proxy rewrites. See [PostHog proxy](#posthog-proxy).

---

## Environment variables

One variable, read at runtime by `instrumentation-client.ts`:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_...    # PostHog Project API Key (write-only, browser-safe)
```

If unset (e.g. local dev without analytics), `posthog.init` is **skipped entirely** — the site still runs, just without event capture. There is no `NEXT_PUBLIC_POSTHOG_HOST`: the ingestion host is hardcoded to the same-origin path `/ingest` (see [PostHog proxy](#posthog-proxy)).

### Is the key safe to expose?

Yes. Any variable with the `NEXT_PUBLIC_` prefix is **inlined into the client bundle at build time** — it ships to every visitor's browser. That's intentional here: `NEXT_PUBLIC_POSTHOG_KEY` is PostHog's **Project API Key** (`phc_...`), which is **write-only** — it can ingest events from the browser but cannot read your project's data. This is the same model every browser analytics SDK uses (Google Analytics, Plausible, Mixpanel, etc.).

**Never** put a PostHog **Personal API Key** (`phx_...`) behind `NEXT_PUBLIC_`. Personal keys grant account-level read/write and must stay server-side.

### About abuse / fake events

Because the project key is public, anyone could grab it and POST fake events. As of this writing, PostHog does **not** offer ingestion-side domain locking. The practical mitigations are:

- The **hostname filter** on PostHog insights (display-side, not ingestion).
- The **Filter Out transformation** in PostHog (drops matching events at ingest).
- Rotating the project key if you see real abuse.

The "Authorized domains" setting in the PostHog dashboard only affects which domains appear in **Web Analytics** — it does not block ingestion from other origins. In practice, fake-event spam against a small site is rare.

---

## PostHog initialization

`instrumentation-client.ts` (at the repo root, per Next.js convention) is the single place where `posthog.init` is called. Current configuration choices:

| Option                          | Value      | Why                                                                              |
| ------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `api_host`                      | `/ingest`  | Same-origin proxy — see [PostHog proxy](#posthog-proxy).                         |
| `ui_host`                       | `https://us.posthog.com` | Dashboard URL PostHog uses when linking back from recordings, etc.   |
| `person_profiles`               | `"never"`  | No identified person profiles — anonymous-only.                                  |
| `persistence`                   | `"memory"` | No cookies, no `localStorage`. Each page load = fresh anonymous session.         |
| `autocapture`                   | `false`    | Only explicit `capture()` calls produce events. No surprise tracking.            |
| `capture_pageview`              | `true`     | Initial page view sent automatically.                                            |
| `capture_pageleave`             | `false`    | Don't send a leave event on unload.                                              |
| `capture_exceptions`            | `true`     | Unhandled errors are reported to PostHog.                                        |
| `debug`                         | `NODE_ENV === "development"` | Verbose console output in dev.                                |

The combination `person_profiles: "never"` + `persistence: "memory"` means there are no persistent identifiers stored in the browser — a privacy-friendly default that also keeps the analytics layer free of cookie-banner concerns.

---

## PostHog proxy

To avoid being blocked by ad blockers and to keep ingestion **same-origin**, `next.config.ts` rewrites the PostHog endpoints under `/ingest`:

```
/ingest/static/*   →  https://us-assets.i.posthog.com/static/*
/ingest/array/*    →  https://us-assets.i.posthog.com/array/*
/ingest/*          →  https://us.i.posthog.com/*
```

That's why `api_host` is set to `"/ingest"` in `instrumentation-client.ts`. Two benefits:

1. Requests are same-origin, so ad blockers that block `*.posthog.com` won't drop events.
2. The PostHog host stays an implementation detail of the deploy, not a runtime concern.

`next.config.ts` also sets `skipTrailingSlashRedirect: true` so PostHog's POST requests aren't 308-redirected (which would drop the request body).

---

## Adding a new event

**Always** add a typed wrapper here rather than calling `posthog.capture` directly from a component. This keeps event names and properties in one place, makes them grep-able, and gives every event a test.

### 1. Add the wrapper in `events.ts`

```ts
export const trackResumePdfClick = (): void => {
  posthog.capture("resume_pdf_clicked", { destination: "google_drive" });
};
```

Conventions:

- Function name: `track<Subject><Action>` in `camelCase`.
- Event name: `<subject>_<action>` in `snake_case` (PostHog's idiom).
- Properties: lowercase `snake_case` keys; keep them small and stable.
- Return type: explicit `void`.
- When the same channel is reachable from multiple surfaces, add a `location` property rather than creating per-surface wrappers. See `trackContactClick` for the canonical example: one event (`contact_clicked`), one wrapper, with `channel` ("whatsapp" | "email" | "linkedin" | "github") and `location` ("landing_modal" | "cv_contact_section" | "cv_dock") as typed properties.

### 2. Add the test in `__tests__/events.test.ts`

Each wrapper should have a test asserting it calls `posthog.capture` with the right name and properties. Mock `posthog-js` and verify the call.

### 3. Call the wrapper from the UI

```tsx
import { trackResumeClick } from "@/analytics/events";

<Button onClick={trackResumeClick}>Resume</Button>;
```

Never import `posthog-js` directly from a component.

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

---

## Events

| Event                         | Props                     | Fired on `/cv` when...                                          |
| ----------------------------- | ------------------------- | --------------------------------------------------------------- |
| `resume_clicked`              | —                         | The resume button is clicked.                                  |
| `contact_modal_opened`        | —                         | The contact modal opens.                                       |
| `contact_modal_dismissed`     | —                         | The contact modal is dismissed.                                |
| `resume_modal_dismissed`      | —                         | The resume modal is dismissed.                                 |
| `resume_pdf_clicked`          | `destination`             | The "Open in Google Drive" link is clicked.                    |
| `resume_web_clicked`          | `destination`             | The "View on CV page" link is clicked.                         |
| `contact_clicked`             | `channel`, `location`     | A contact link (WhatsApp, email, LinkedIn, GitHub) is clicked. |
| `skill_experiences_opened`    | `skill`                   | A skill card opens its "where I used this" dialog.             |
| `skill_experience_clicked`    | `skill`, `company`        | A job is clicked inside the skill-experiences dialog.          |

---

## Files

| File                       | Purpose                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| `events.ts`                | Public event API — one exported wrapper per event captured anywhere. |
| `__tests__/events.test.ts` | Tests for the wrappers (one assertion per event).                    |
