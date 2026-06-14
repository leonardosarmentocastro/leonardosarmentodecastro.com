import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCapture } = vi.hoisted(() => ({
  mockCapture: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  default: { capture: mockCapture },
}));

const loadAnalytics = async () => {
  vi.resetModules();
  return await import("../events");
};

describe("event trackers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trackResumeClick captures resume_clicked with no props (modal-open semantics)", async () => {
    const { trackResumeClick } = await loadAnalytics();
    trackResumeClick();
    expect(mockCapture).toHaveBeenCalledWith("resume_clicked");
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

  it("trackResumeModalDismiss captures resume_modal_dismissed", async () => {
    const { trackResumeModalDismiss } = await loadAnalytics();
    trackResumeModalDismiss();
    expect(mockCapture).toHaveBeenCalledWith("resume_modal_dismissed");
  });

  it("trackResumePdfClick captures resume_pdf_clicked with destination=google_drive", async () => {
    const { trackResumePdfClick } = await loadAnalytics();
    trackResumePdfClick();
    expect(mockCapture).toHaveBeenCalledWith("resume_pdf_clicked", {
      destination: "google_drive",
    });
  });

  it("trackResumeWebClick captures resume_web_clicked with destination=cv_page", async () => {
    const { trackResumeWebClick } = await loadAnalytics();
    trackResumeWebClick();
    expect(mockCapture).toHaveBeenCalledWith("resume_web_clicked", {
      destination: "cv_page",
    });
  });

  it("trackContactClick captures contact_clicked with channel and location", async () => {
    const { trackContactClick } = await loadAnalytics();
    trackContactClick({ channel: "whatsapp", location: "landing_modal" });
    expect(mockCapture).toHaveBeenCalledWith("contact_clicked", {
      channel: "whatsapp",
      location: "landing_modal",
    });
  });

  it("trackContactClick forwards every channel/location combination unchanged", async () => {
    const { trackContactClick } = await loadAnalytics();
    trackContactClick({ channel: "email", location: "cv_contact_section" });
    trackContactClick({ channel: "linkedin", location: "cv_dock" });

    expect(mockCapture).toHaveBeenNthCalledWith(1, "contact_clicked", {
      channel: "email",
      location: "cv_contact_section",
    });
    expect(mockCapture).toHaveBeenNthCalledWith(2, "contact_clicked", {
      channel: "linkedin",
      location: "cv_dock",
    });
  });
});
