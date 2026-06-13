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
export const trackResumeClick = (): void => {
  posthog.capture("resume_clicked", { destination: "google_drive" });
};
```

Conventions:

- Function name: `track<Subject><Action>` in `camelCase`.
- Event name: `<subject>_<action>` in `snake_case` (PostHog's idiom).
- Properties: lowercase `snake_case` keys; keep them small and stable.
- Return type: explicit `void`.

### 2. Add the test in `__tests__/events.test.ts`

Each wrapper should have a test asserting it calls `posthog.capture` with the right name and properties. Mock `posthog-js` and verify the call.

### 3. Call the wrapper from the UI

```tsx
import { trackResumeClick } from "@/analytics/events";

<Button onClick={trackResumeClick}>Resume</Button>;
```

Never import `posthog-js` directly from a component.

---

## Files

| File                       | Purpose                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| `events.ts`                | Public event API — one exported wrapper per event captured anywhere. |
| `__tests__/events.test.ts` | Tests for the wrappers (one assertion per event).                    |
