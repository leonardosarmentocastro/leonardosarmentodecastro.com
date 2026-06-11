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
