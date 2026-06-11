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

  it("does not call posthog.init on non-production hostnames", async () => {
    const { initAnalytics } = await loadAnalytics();
    vi.stubEnv("NODE_ENV", "production");
    setHostname("preview-abc.vercel.app");

    initAnalytics();

    expect(mockInit).not.toHaveBeenCalled();
  });

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

  it("does not re-initialize posthog when called twice within the same module load", async () => {
    const { initAnalytics } = await loadAnalytics();
    vi.stubEnv("NODE_ENV", "production");
    setHostname("leonardosarmentodecastro.com");

    initAnalytics();
    initAnalytics();

    expect(mockInit).toHaveBeenCalledTimes(1);
  });

  it("does not call posthog.init when NEXT_PUBLIC_POSTHOG_KEY is missing", async () => {
    const { initAnalytics } = await loadAnalytics();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    setHostname("leonardosarmentodecastro.com");

    initAnalytics();

    expect(mockInit).not.toHaveBeenCalled();
  });
});

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
