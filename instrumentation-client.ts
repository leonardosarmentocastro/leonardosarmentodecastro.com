import posthog from "posthog-js";

// `api_host` is set to "/ingest" so the browser sends events to our own origin.
// `next.config.ts` then rewrites `/ingest/*` to PostHog's US cloud endpoints. Two benefits:
//   1. Requests are same-origin, so ad blockers that block `*.posthog.com` won't drop events.
//   2. The PostHog host stays an implementation detail of the deploy, not a runtime concern.
// `ui_host` is the dashboard URL used when PostHog links back from session recordings, etc.;
// it's separate from ingestion and stays as the real posthog.com host.
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
if (key) {
  posthog.init(key, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    person_profiles: "never",
    persistence: "memory",
    capture_pageview: true,
    capture_pageleave: false,
    capture_exceptions: true,
    autocapture: false,
    debug: process.env.NODE_ENV === "development",
  });
}
