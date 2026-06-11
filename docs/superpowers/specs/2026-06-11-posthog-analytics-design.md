# PostHog Analytics for leonardosarmentodecastro.com

**Date:** 2026-06-11
**Status:** Design approved, pending implementation
**Author:** Leonardo Sarmento de Castro (with Claude)

## Goal

Add lightweight conversion analytics to the personal landing page so the owner can measure traffic and engagement when sharing the site on LinkedIn during a job search. Specifically:

- How many people land on the page.
- How many reach the CV (RESUME link → Google Drive).
- How many attempt contact (open the modal, click WhatsApp, click email).
- Where visitors come from (LinkedIn vs direct vs other), captured automatically.

## Non-goals

- No session recordings, heatmaps, feature flags, or A/B tests.
- No return-visitor tracking, no user identification.
- No scroll-depth or time-on-page tracking.
- No engagement/retention metrics beyond the conversion funnel above.
- No analytics in local dev or Vercel Preview builds (production domain only).

## Tool choice

**PostHog Cloud (US region), free tier.** Free tier ceiling is 1M events/month, far above expected volume. Picked over Vercel Web Analytics / Plausible / Umami because PostHog's built-in funnel and dashboard tools fit the "landed → reached CV / made contact" question without extra work, and the cookieless mode avoids needing a consent banner.

## Privacy posture

**Cookieless, no consent banner.**

PostHog SDK is configured with `person_profiles: "never"` and `persistence: "memory"`. No cookies set, no `localStorage` written, no persistent identifiers. Each page load is a fresh anonymous visitor. No GDPR consent banner required because no personal data is stored on the visitor's device.

Trade-off accepted: return-visitor counts and cross-session funnels are not possible. Acceptable for this site's purpose (aggregate counts of one-shot LinkedIn-driven visits).

## Architecture

Three pieces, plus a Next.js proxy rule:

### 1. `src/lib/analytics.ts`

Thin wrapper around `posthog-js`. Single import point for the rest of the codebase; no UI code imports `posthog-js` directly.

Exports:

- `initAnalytics(): void` — called once at app start by the provider. Short-circuits in dev / non-production hostnames. On production domain, calls `posthog.init(...)` with the config below.
- `trackResumeClick(): void` — `posthog.capture("resume_clicked", { destination: "google_drive" })`
- `trackLinkedinClick(): void` — `posthog.capture("linkedin_clicked", { destination: "linkedin_profile" })`
- `trackContactModalOpen(): void` — `posthog.capture("contact_modal_opened")`
- `trackContactModalDismiss(): void` — `posthog.capture("contact_modal_dismissed")`
- `trackWhatsappClick(): void` — `posthog.capture("whatsapp_clicked", { channel: "whatsapp" })`
- `trackEmailClick(): void` — `posthog.capture("email_clicked", { channel: "email" })`

`initAnalytics()` is idempotent (guard with a module-level `initialized` flag) — safe under React StrictMode double-invoke.

### 2. `src/components/AnalyticsProvider.tsx`

Client component (`"use client"`). On mount, calls `initAnalytics()`. Renders `children` unchanged. Mounted once in `src/app/layout.tsx`, wrapping the existing `<MantineProvider>` tree.

### 3. Event call sites in `src/components/pages/LandingPage/LandingPage.tsx`

Direct calls to the named tracker functions from `src/lib/analytics.ts`. See "Wiring changes" below for the exact edits.

### 4. Reverse proxy in `next.config.ts`

Two `rewrites` rules so PostHog SDK requests go through the site's own domain (`/ingest/*` → `us.i.posthog.com`). Bypasses ad blockers that block `*.posthog.com`. See "Reverse proxy" section.

## PostHog SDK configuration

Inside `initAnalytics()`:

```ts
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!, // "/ingest"
  ui_host: "https://us.posthog.com",
  person_profiles: "never",
  persistence: "memory",
  disable_session_recording: true,
  autocapture: false,
  capture_pageview: true,
  capture_pageleave: false,
});
```

### Environment variables

- `NEXT_PUBLIC_POSTHOG_KEY` — PostHog project key (public, safe to expose in client bundle).
- `NEXT_PUBLIC_POSTHOG_HOST` — `/ingest` (the proxy path on the site's own domain).

Both go in `.env.local` (gitignored via existing `.env*` rule) and Vercel's Production environment variables panel. Add a committed `.env.example` with the variable names and no values, so future-you remembers what's needed.

### Dev/prod gating

`initAnalytics()` early-returns unless **both** are true:

1. `process.env.NODE_ENV === "production"`
2. `window.location.hostname === "leonardosarmentodecastro.com"`

Effect: no events from `pnpm dev` on localhost, no events from Vercel Preview deploys (their hostnames don't match). Only the production domain reports.

Note: the hostname check is exact-match on the apex domain. If `www.leonardosarmentodecastro.com` is ever set as the primary domain in Vercel, the check needs to either accept both hostnames or be relaxed to `.endsWith("leonardosarmentodecastro.com")`. Default assumption: apex-only.

## Reverse proxy (`next.config.ts`)

Replace the current near-empty config with:

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

Both rewrite rules are required because PostHog splits its static asset host (`us-assets.i.posthog.com`) from its ingestion host (`us.i.posthog.com`). `skipTrailingSlashRedirect: true` is required because Next.js's default trailing-slash redirect breaks PostHog's POST requests.

## Event taxonomy

| Event name | Fired when | Properties |
|---|---|---|
| `$pageview` | Initial page load (PostHog automatic) | Auto-captured: `$referrer`, UTM params, `$geoip_country`, `$browser`, `$device_type` |
| `resume_clicked` | RESUME accordion link clicked | `{ destination: "google_drive" }` |
| `linkedin_clicked` | LINKEDIN accordion link clicked | `{ destination: "linkedin_profile" }` |
| `contact_modal_opened` | CONTACT ME accordion button clicked | (none) |
| `contact_modal_dismissed` | Modal closed without CTA click (X, click-outside, or ESC) | (none) |
| `whatsapp_clicked` | WhatsApp link inside modal clicked | `{ channel: "whatsapp" }` |
| `email_clicked` | Email link inside modal clicked | `{ channel: "email" }` |

### Derived funnels (PostHog dashboard)

- **CV funnel:** `$pageview` → `resume_clicked`.
- **Contact funnel:** `$pageview` → `contact_modal_opened` → (`whatsapp_clicked` OR `email_clicked`).

## Wiring changes in `LandingPage.tsx`

The existing component (`src/components/pages/LandingPage/LandingPage.tsx`) needs these edits:

All external links in the modal and accordions use `target="_blank"`, so the current tab never navigates away on click. PostHog's `capture()` enqueues the request and the browser flushes it (via `fetch` keepalive / `sendBeacon`) before tab focus shifts. No `event.preventDefault()` + manual `window.open()` workaround is needed.

1. **Line 39:** Remove the `// TODO: add sort of analytics ...` comment.
2. **Line 346–363 (RESUME `<a>`):** Add `onClick={() => trackResumeClick()}`.
3. **Line 379–396 (LINKEDIN `<a>`):** Add `onClick={() => trackLinkedinClick()}`.
4. **Line 413–429 (CONTACT ME `<button>`):** Change `onClick={open}` to `onClick={() => { trackContactModalOpen(); open(); }}`.
5. **Contact modal dismiss tracking:**

   Mantine's `Modal` calls `onClose` for every close path (X, click-outside, ESC, and our programmatic close). To distinguish "closed without engagement" from "closed because user clicked WhatsApp/email", use a `ctaClickedRef`:

   ```ts
   const ctaClickedRef = useRef(false);

   const handleModalClose = () => {
     if (!ctaClickedRef.current) trackContactModalDismiss();
     ctaClickedRef.current = false; // reset for next open
     close();
   };

   const handleWhatsappClick = () => {
     ctaClickedRef.current = true;
     trackWhatsappClick();
   };

   const handleEmailClick = () => {
     ctaClickedRef.current = true;
     trackEmailClick();
     // existing clipboard write + notifications.show() stay
   };
   ```

   - `<Modal opened={opened} onClose={handleModalClose} ...>` (replace `close` with `handleModalClose`).
   - WhatsApp `<a>` gets `onClick={handleWhatsappClick}`.
   - Email `<a>`'s existing `onClick` gets a call to `handleEmailClick()` added at the top of the handler.

## `layout.tsx` change

Mount `<AnalyticsProvider>` once, wrapping the existing tree:

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

## TDD implementation order

The project has no test setup today. TDD applies to all application code; test infrastructure setup is the documented escape-hatch case (you can't TDD the test runner into existence).

### Step 0 — Test infrastructure (escape-hatch exempt)

Add **Vitest + React Testing Library + jsdom**. Rationale: standard for Next.js 15 / React 19, fast, no Jest/Babel config overhead.

Dependencies:

- `vitest`, `@vitest/ui`
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- `jsdom`
- `vite-tsconfig-paths`

Files to add:

- `vitest.config.ts` — `environment: "jsdom"`, `setupFiles: ["./vitest.setup.ts"]`, `vite-tsconfig-paths` plugin so `@/...` imports resolve.
- `vitest.setup.ts` — imports `@testing-library/jest-dom/vitest` for matchers.
- `src/test/render.tsx` — test-utils helper that wraps `render()` in `<MantineProvider><ModalsProvider>...` (Mantine's `Modal` requires both contexts).

`package.json` scripts: `"test": "vitest"`, `"test:run": "vitest run"`.

### Step 1 — TDD `src/lib/analytics.ts` (mock `posthog-js`)

Each test starts red, then minimum implementation makes it green:

1. `initAnalytics()` does NOT call `posthog.init` when `NODE_ENV === "development"`.
2. `initAnalytics()` does NOT call `posthog.init` when `window.location.hostname !== "leonardosarmentodecastro.com"`.
3. `initAnalytics()` on prod domain calls `posthog.init` with the exact config object above.
4. `initAnalytics()` is idempotent — calling it twice still results in only one `posthog.init` call.
5. `trackResumeClick()` calls `posthog.capture("resume_clicked", { destination: "google_drive" })`.
6. `trackLinkedinClick()` calls `posthog.capture("linkedin_clicked", { destination: "linkedin_profile" })`.
7. `trackContactModalOpen()` calls `posthog.capture("contact_modal_opened")`.
8. `trackContactModalDismiss()` calls `posthog.capture("contact_modal_dismissed")`.
9. `trackWhatsappClick()` calls `posthog.capture("whatsapp_clicked", { channel: "whatsapp" })`.
10. `trackEmailClick()` calls `posthog.capture("email_clicked", { channel: "email" })`.

Refactor pass after green: extract event-name constants if there's duplication; centralize the config object.

### Step 2 — TDD `src/components/AnalyticsProvider.tsx` (mock `src/lib/analytics`)

1. Mount → `initAnalytics` called once.
2. Re-render → `initAnalytics` still called only once (StrictMode-safe via `useRef`-guarded `useEffect`).
3. Renders `children` (assert a probe element appears).

### Step 3 — TDD `LandingPage` event wiring (mock `src/lib/analytics`)

Use `@testing-library/user-event` and the `src/test/render.tsx` helper.

1. Click RESUME link → `trackResumeClick` called once.
2. Click LINKEDIN link → `trackLinkedinClick` called once.
3. Click CONTACT ME button → `trackContactModalOpen` called, modal visible.
4. Open modal → press ESC → `trackContactModalDismiss` called.
5. Open modal → click WhatsApp link → `trackWhatsappClick` called, `trackContactModalDismiss` NOT called.
6. Open modal → click email link → `trackEmailClick` called, clipboard write still happens (assert via `navigator.clipboard.writeText` mock), `trackContactModalDismiss` NOT called.
7. Open → ESC → open → ESC: `trackContactModalDismiss` called twice (`ctaClickedRef` resets correctly between opens).
8. Open → click WhatsApp → reopen modal → ESC: `trackContactModalDismiss` called once (only on the second close, ref reset properly).

Refactor pass after green: see if the click handlers can be co-located more cleanly without losing readability.

### Step 4 — Escape-hatch items (manual verification only)

These can't be unit-tested:

- `next.config.ts` rewrite rules (require running Next.js + hitting proxy URLs).
- Vercel env-var configuration.
- Real PostHog ingestion arriving in the dashboard.
- Ad-blocker bypass via the proxy.

Manual verification flow is in the next section.

## Manual verification

After TDD is green and code is merged to production:

### Local dev (events should NOT fire)

1. `pnpm dev`, open `http://localhost:3000`, DevTools → Network tab, filter for `ingest`.
2. Click every CTA, open/close the modal, click WhatsApp + email.
3. Expected: zero `/ingest/*` requests. Console clean of PostHog warnings.

### Vercel Preview (events should NOT fire under current gate)

1. Push to a branch, get the Preview URL.
2. Click every CTA. Confirm no `/ingest/*` traffic.
3. (Optional: temporarily relax the gate locally to confirm end-to-end ingestion works in a one-off Preview, then revert before merging.)

### Production (events SHOULD fire)

1. Visit the live site in incognito.
2. Click every CTA, open/dismiss the modal.
3. In PostHog → Activity tab, watch all 7 event types appear with the expected properties.
4. DevTools → Application → Cookies: empty for the site origin. `localStorage`: empty for the site origin.
5. Network tab: every PostHog request goes to `leonardosarmentodecastro.com/ingest/...`, never `*.posthog.com`.
6. Re-test with uBlock Origin enabled — events still fire.

### Dashboards to build in PostHog

- **CV funnel:** `$pageview` → `resume_clicked`. Save to dashboard.
- **Contact funnel:** `$pageview` → `contact_modal_opened` → (`whatsapp_clicked` OR `email_clicked`). Save to dashboard.
- Optional: insight breaking down `$pageview` by `$referrer` host, to see how many visitors come from LinkedIn vs other sources.

## Out of scope

- Multi-page pageview tracking (site is single-page; default `capture_pageview: true` is enough).
- Session recordings, heatmaps, feature flags, A/B tests, surveys.
- Identifying return visitors or stitching sessions across visits.
- Scroll-depth, time-on-page, rage-click tracking.
- Self-hosting PostHog.
- E2E tests via Playwright/Cypress (manual verification covers the integration path).

## Open questions

None. All design decisions resolved during brainstorming.
