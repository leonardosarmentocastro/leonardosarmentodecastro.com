import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/analytics/events", () => ({
  trackContactClick: vi.fn(),
  trackResumePdfClick: vi.fn(),
}));

import { trackContactClick, trackResumePdfClick } from "@/analytics/events";
import { RESUME } from "@/cv/data";
import { renderWithProviders, screen } from "@/test/render";

import { Dock } from "../Dock";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe("Dock", () => {
  it("renders Home, LinkedIn, Email, WhatsApp, and PDF items with the right hrefs", () => {
    renderWithProviders(<Dock />);

    expect(screen.getByRole("link", { name: /^home$/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: /^linkedin$/i })).toHaveAttribute(
      "href",
      RESUME.hero.links.linkedin,
    );
    expect(screen.getByRole("link", { name: /^whatsapp$/i })).toHaveAttribute(
      "href",
      RESUME.hero.links.whatsapp,
    );
    expect(
      screen.getByRole("link", { name: /^open resume pdf$/i }),
    ).toHaveAttribute("href", RESUME.hero.links.resumePdf);
  });

  it("renders an Email button (button, not link) that copies and tracks", async () => {
    // userEvent.setup() installs the clipboard stub on first call in a file,
    // so spy AFTER setup() or the spy lands on the wrong object.
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);

    renderWithProviders(<Dock />);
    await user.click(screen.getByRole("button", { name: /^email$/i }));

    expect(writeText).toHaveBeenCalledWith(RESUME.hero.links.email);
    expect(trackContactClick).toHaveBeenCalledWith({
      channel: "email",
      location: "cv_dock",
    });
  });

  it("fires trackContactClick with location=cv_dock when LinkedIn or WhatsApp items are clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Dock />);

    await user.click(screen.getByRole("link", { name: /^linkedin$/i }));
    expect(trackContactClick).toHaveBeenCalledWith({
      channel: "linkedin",
      location: "cv_dock",
    });

    await user.click(screen.getByRole("link", { name: /^whatsapp$/i }));
    expect(trackContactClick).toHaveBeenCalledWith({
      channel: "whatsapp",
      location: "cv_dock",
    });
  });

  it("fires trackResumePdfClick when the PDF item is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Dock />);

    await user.click(screen.getByRole("link", { name: /^open resume pdf$/i }));

    expect(trackResumePdfClick).toHaveBeenCalledTimes(1);
  });
});
