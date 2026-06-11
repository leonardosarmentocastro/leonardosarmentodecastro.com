import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics", () => ({
  trackResumeClick: vi.fn(),
  trackLinkedinClick: vi.fn(),
  trackContactModalOpen: vi.fn(),
  trackContactModalDismiss: vi.fn(),
  trackWhatsappClick: vi.fn(),
  trackEmailClick: vi.fn(),
}));

import {
  trackContactModalDismiss,
  trackContactModalOpen,
  trackEmailClick,
  trackLinkedinClick,
  trackResumeClick,
  trackWhatsappClick,
} from "@/lib/analytics";
import { renderWithProviders, screen } from "@/test/render";

import { LandingPage } from "./LandingPage";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LandingPage analytics", () => {
  it("fires resume_clicked when the RESUME link is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    const link = screen.getByRole("link", { name: /resume/i });
    await user.click(link);

    expect(trackResumeClick).toHaveBeenCalledTimes(1);
  });

  it("fires linkedin_clicked when the LINKEDIN link is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    const link = screen.getByRole("link", { name: /linkedin/i });
    await user.click(link);

    expect(trackLinkedinClick).toHaveBeenCalledTimes(1);
  });

  it("fires contact_modal_opened when CONTACT ME is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    const button = screen.getByRole("button", { name: /contact me/i });
    await user.click(button);

    expect(trackContactModalOpen).toHaveBeenCalledTimes(1);
  });

  it("fires contact_modal_dismissed when modal is closed via ESC without a CTA click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(screen.getByRole("button", { name: /contact me/i }));
    await user.keyboard("{Escape}");

    expect(trackContactModalDismiss).toHaveBeenCalledTimes(1);
  });

  it("fires whatsapp_clicked and does not fire dismiss when WhatsApp link is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(screen.getByRole("button", { name: /contact me/i }));
    await user.click(
      screen.getByRole("link", { name: /message me on whatsapp/i }),
    );

    expect(trackWhatsappClick).toHaveBeenCalledTimes(1);
    expect(trackContactModalDismiss).not.toHaveBeenCalled();
  });

  it("fires email_clicked, copies email to clipboard, and does not fire dismiss when email link is clicked", async () => {
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(screen.getByRole("button", { name: /contact me/i }));
    await user.click(screen.getByRole("link", { name: /send me an email/i }));

    expect(trackEmailClick).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(
      "negocios.leonardosarmentocastro@gmail.com",
    );
    expect(trackContactModalDismiss).not.toHaveBeenCalled();
  });
});
