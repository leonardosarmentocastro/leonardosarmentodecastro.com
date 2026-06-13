import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/analytics/events", () => ({
  trackResumePdfClick: vi.fn(),
  trackResumeWebClick: vi.fn(),
}));

import { trackResumePdfClick, trackResumeWebClick } from "@/analytics/events";
import { renderWithProviders, screen } from "@/test/render";

import { RESUME } from "../data";
import { ResumeOptionsModal } from "../ResumeOptionsModal";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

const noop = () => undefined;

describe("ResumeOptionsModal", () => {
  it("renders nothing when closed", () => {
    renderWithProviders(<ResumeOptionsModal opened={false} onClose={noop} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders both PDF and WEB choices with the expected hrefs when opened", () => {
    renderWithProviders(<ResumeOptionsModal opened onClose={noop} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const pdfLink = screen.getByRole("link", { name: /open pdf/i });
    expect(pdfLink).toHaveAttribute("href", RESUME.hero.links.resumePdf);
    expect(pdfLink).toHaveAttribute("target", "_blank");
    expect(pdfLink).toHaveAttribute("rel", "noopener noreferrer");

    const webLink = screen.getByRole("link", { name: /view web version/i });
    expect(webLink).toHaveAttribute("href", "/cv");
  });

  it("fires trackResumePdfClick when the PDF link is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResumeOptionsModal opened onClose={noop} />);

    await user.click(screen.getByRole("link", { name: /open pdf/i }));

    expect(trackResumePdfClick).toHaveBeenCalledTimes(1);
    expect(trackResumeWebClick).not.toHaveBeenCalled();
  });

  it("fires trackResumeWebClick when the WEB link is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResumeOptionsModal opened onClose={noop} />);

    await user.click(screen.getByRole("link", { name: /view web version/i }));

    expect(trackResumeWebClick).toHaveBeenCalledTimes(1);
    expect(trackResumePdfClick).not.toHaveBeenCalled();
  });
});
