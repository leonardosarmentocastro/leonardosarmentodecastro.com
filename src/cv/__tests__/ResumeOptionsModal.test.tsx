import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/analytics/events", () => ({
  trackResumePdfClick: vi.fn(),
  trackResumeAtsClick: vi.fn(),
  trackResumeWebClick: vi.fn(),
}));

import {
  trackResumeAtsClick,
  trackResumePdfClick,
  trackResumeWebClick,
} from "@/analytics/events";
import { renderWithProviders, screen } from "@/test/render";
import { RESUME } from "../data";
import { ResumeOptionsModal } from "../ResumeOptionsModal";

const noop = () => undefined;

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe("ResumeOptionsModal", () => {
  it("renders nothing when closed", () => {
    renderWithProviders(
      <ResumeOptionsModal
        opened={false}
        onClose={noop}
        options={["recruiterPdf", "ats"]}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the 3-option (landing) configuration with correct destinations", () => {
    renderWithProviders(
      <ResumeOptionsModal
        opened
        onClose={noop}
        options={["recruiterPdf", "ats", "web"]}
      />,
    );
    const pdf = screen.getByRole("link", { name: /recruiter pdf/i });
    expect(pdf).toHaveAttribute("href", RESUME.hero.links.resumePdf);
    expect(pdf).toHaveAttribute("target", "_blank");

    expect(screen.getByRole("link", { name: /ats/i })).toHaveAttribute(
      "href",
      "/cv/ats",
    );
    expect(screen.getByRole("link", { name: /web version/i })).toHaveAttribute(
      "href",
      "/cv",
    );
  });

  it("renders only the requested 2 options for the /cv configuration", () => {
    renderWithProviders(
      <ResumeOptionsModal
        opened
        onClose={noop}
        options={["recruiterPdf", "ats"]}
      />,
    );
    expect(
      screen.getByRole("link", { name: /recruiter pdf/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ats/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /web version/i }),
    ).not.toBeInTheDocument();
  });

  it("fires the matching analytics event per choice", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ResumeOptionsModal
        opened
        onClose={noop}
        options={["recruiterPdf", "ats", "web"]}
      />,
    );
    await user.click(screen.getByRole("link", { name: /ats/i }));
    expect(trackResumeAtsClick).toHaveBeenCalledTimes(1);
    expect(trackResumePdfClick).not.toHaveBeenCalled();
    expect(trackResumeWebClick).not.toHaveBeenCalled();
  });
});
