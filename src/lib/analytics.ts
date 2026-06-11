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
