import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RESUME } from "@/cv/data";
import { scrollToWorkEntry } from "@/cv/sections/Work/anchors";
import { renderWithProviders, screen } from "@/test/render";

import { CompanyLogoMarquee } from "../CompanyLogoMarquee";

vi.mock("@/cv/sections/Work/anchors", () => ({
  scrollToWorkEntry: vi.fn(),
}));

const mockUseMediaQuery = vi.fn();

vi.mock("@mantine/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mantine/hooks")>();
  return {
    ...actual,
    useMediaQuery: (...args: unknown[]) => mockUseMediaQuery(...args),
  };
});

describe("CompanyLogoMarquee", () => {
  beforeEach(() => {
    mockUseMediaQuery.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders one button per work experience with accessible labels", () => {
    renderWithProviders(<CompanyLogoMarquee />);

    const buttons = screen.getAllByRole("button", {
      name: /view .+ experience/i,
    });
    const labels = new Set(
      buttons.map((button) => button.getAttribute("aria-label")),
    );
    expect(labels.size).toBe(RESUME.workExperience.length);

    for (const entry of RESUME.workExperience) {
      expect(
        screen.getAllByRole("button", {
          name: `View ${entry.company} experience`,
        }).length,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("renders animated marquee when motion is allowed", () => {
    renderWithProviders(<CompanyLogoMarquee />);
    expect(screen.getByTestId("company-logo-marquee")).toBeInTheDocument();
    expect(screen.queryByTestId("company-logo-static")).not.toBeInTheDocument();
  });

  it("renders static wrapped row when reduced motion is preferred", () => {
    mockUseMediaQuery.mockReturnValue(true);
    renderWithProviders(<CompanyLogoMarquee />);
    expect(screen.getByTestId("company-logo-static")).toBeInTheDocument();
    expect(
      screen.queryByTestId("company-logo-marquee"),
    ).not.toBeInTheDocument();
  });

  it("calls scrollToWorkEntry with the matching entry on logo click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanyLogoMarquee />);

    const target = RESUME.workExperience[0];
    await user.click(
      screen.getAllByRole("button", {
        name: `View ${target.company} experience`,
      })[0],
    );

    expect(scrollToWorkEntry).toHaveBeenCalledTimes(1);
    expect(scrollToWorkEntry).toHaveBeenCalledWith(target);
  });
});
