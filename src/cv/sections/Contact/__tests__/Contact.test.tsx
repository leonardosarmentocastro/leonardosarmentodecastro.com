import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/analytics/events", () => ({
  trackContactClick: vi.fn(),
}));

import { trackContactClick } from "@/analytics/events";
import { RESUME } from "@/cv/data";
import { renderWithProviders, screen } from "@/test/render";

import { Contact } from "../Contact";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe("Contact", () => {
  it("renders a Get in Touch heading", () => {
    renderWithProviders(<Contact />);
    expect(
      screen.getByRole("heading", { level: 2, name: /get in touch/i }),
    ).toBeInTheDocument();
  });

  it("renders WhatsApp, Email, and LinkedIn buttons with the right hrefs", () => {
    renderWithProviders(<Contact />);
    expect(
      screen.getByRole("link", { name: /message me on whatsapp/i }),
    ).toHaveAttribute("href", RESUME.hero.links.whatsappMessage);
    expect(
      screen
        .getByRole("link", { name: /send me an email/i })
        .getAttribute("href"),
    ).toContain(`mailto:${RESUME.hero.links.email}`);
    expect(
      screen.getByRole("link", { name: /message me on linkedin/i }),
    ).toHaveAttribute("href", RESUME.hero.links.linkedin);
  });

  it("fires trackContactClick with location=cv_contact_section for each channel", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Contact />);

    await user.click(
      screen.getByRole("link", { name: /message me on whatsapp/i }),
    );
    expect(trackContactClick).toHaveBeenCalledWith({
      channel: "whatsapp",
      location: "cv_contact_section",
    });

    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    await user.click(screen.getByRole("link", { name: /send me an email/i }));
    expect(trackContactClick).toHaveBeenCalledWith({
      channel: "email",
      location: "cv_contact_section",
    });

    await user.click(
      screen.getByRole("link", { name: /message me on linkedin/i }),
    );
    expect(trackContactClick).toHaveBeenCalledWith({
      channel: "linkedin",
      location: "cv_contact_section",
    });
  });

  it("copies the email to the clipboard on email click", async () => {
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderWithProviders(<Contact />);

    await user.click(screen.getByRole("link", { name: /send me an email/i }));

    expect(writeText).toHaveBeenCalledWith(RESUME.hero.links.email);
  });

  it("renders the current local time line", () => {
    renderWithProviders(<Contact />);
    expect(screen.getByText(/current time for me is/i)).toBeInTheDocument();
    expect(screen.getByText(/GMT-3/)).toBeInTheDocument();
  });
});
