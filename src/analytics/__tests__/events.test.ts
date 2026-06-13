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
