import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/analytics/events", () => ({
  trackResumeClick: vi.fn(),
  trackResumeModalDismiss: vi.fn(),
  trackResumePdfClick: vi.fn(),
  trackResumeAtsClick: vi.fn(),
  trackResumeWebClick: vi.fn(),
  trackContactModalOpen: vi.fn(),
  trackContactModalDismiss: vi.fn(),
  trackContactClick: vi.fn(),
}));

import {
  trackContactClick,
  trackContactModalDismiss,
  trackContactModalOpen,
  trackResumeClick,
  trackResumeModalDismiss,
  trackResumePdfClick,
  trackResumeWebClick,
} from "@/analytics/events";
import { renderWithProviders, screen, waitFor } from "@/test/render";

import { LandingPage } from "../LandingPage";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LandingPage analytics", () => {
  it("fires resume_clicked when the RESUME button is clicked and opens the chooser modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    const button = screen.getByRole("button", { name: /^resume$/i });
    await user.click(button);

    expect(trackResumeClick).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("link", { name: /recruiter pdf/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /web page/i })).toBeInTheDocument();
  });

  it("opens a 3-option resume dialog (recruiter PDF, ATS, web)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(screen.getByRole("button", { name: /^resume$/i }));

    expect(
      screen.getByRole("link", { name: /recruiter pdf/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ats/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /web page/i })).toBeInTheDocument();
  });

  it("fires contact_clicked with channel=linkedin and location=landing_modal when the LINKEDIN link is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    const link = screen.getByRole("link", { name: /linkedin/i });
    await user.click(link);

    expect(trackContactClick).toHaveBeenCalledWith({
      channel: "linkedin",
      location: "landing_modal",
    });
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

  it("fires contact_clicked with channel=whatsapp/location=landing_modal and does not fire dismiss when WhatsApp link is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(screen.getByRole("button", { name: /contact me/i }));
    await user.click(
      screen.getByRole("link", { name: /message me on whatsapp/i }),
    );

    expect(trackContactClick).toHaveBeenCalledWith({
      channel: "whatsapp",
      location: "landing_modal",
    });
    expect(trackContactModalDismiss).not.toHaveBeenCalled();
  });

  it("fires contact_clicked with channel=email/location=landing_modal, copies email, and does not fire dismiss when email link is clicked", async () => {
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(screen.getByRole("button", { name: /contact me/i }));
    await user.click(screen.getByRole("link", { name: /send me an email/i }));

    expect(trackContactClick).toHaveBeenCalledWith({
      channel: "email",
      location: "landing_modal",
    });
    expect(writeText).toHaveBeenCalledWith(
      "negocios.leonardosarmentocastro@gmail.com",
    );
    expect(trackContactModalDismiss).not.toHaveBeenCalled();
  });

  it("fires dismiss again on a second open-and-dismiss cycle after a CTA click in the first cycle", async () => {
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(screen.getByRole("button", { name: /contact me/i }));
    await user.click(
      screen.getByRole("link", { name: /message me on whatsapp/i }),
    );
    await user.keyboard("{Escape}");

    expect(trackContactModalDismiss).not.toHaveBeenCalled();

    // Wait for the modal to actually leave the DOM before reopening it.
    // Mantine's Modal close path involves a state flip plus transition
    // teardown, parts of which schedule work via rAF/timers that the
    // userEvent act() wrap does not fully flush in jsdom. Without this
    // wait, the second "CONTACT ME" click below can land while cycle 1
    // is still mid-close, racing a second onClose against the just-reset
    // ctaClickedRef and causing trackContactModalDismiss to fire from
    // cycle 1 instead of being suppressed by it.
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /contact me/i }));
    await user.keyboard("{Escape}");

    expect(trackContactModalDismiss).toHaveBeenCalledTimes(1);
  });

  it("fires trackResumePdfClick when the PDF choice is clicked from the chooser modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(screen.getByRole("button", { name: /^resume$/i }));
    await user.click(screen.getByRole("link", { name: /recruiter pdf/i }));

    expect(trackResumePdfClick).toHaveBeenCalledTimes(1);
    expect(trackResumeModalDismiss).not.toHaveBeenCalled();
  });

  it("fires trackResumeWebClick when the WEB choice is clicked from the chooser modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(screen.getByRole("button", { name: /^resume$/i }));
    await user.click(screen.getByRole("link", { name: /web page/i }));

    expect(trackResumeWebClick).toHaveBeenCalledTimes(1);
    expect(trackResumeModalDismiss).not.toHaveBeenCalled();
  });

  it("fires trackResumeModalDismiss when the chooser modal is closed via ESC without a choice", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    await user.click(screen.getByRole("button", { name: /^resume$/i }));
    await user.keyboard("{Escape}");

    expect(trackResumeModalDismiss).toHaveBeenCalledTimes(1);
  });
});
