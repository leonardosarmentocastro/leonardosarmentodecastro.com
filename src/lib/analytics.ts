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
    ui_host: "https://us.posthog.com",
    person_profiles: "never",
    persistence: "memory",
    disable_session_recording: true,
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: false,
  });
  initialized = true;
};

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
