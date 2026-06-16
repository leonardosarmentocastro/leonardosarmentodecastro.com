import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen, waitFor } from "@/test/render";

import { WorkTechnologyBadge } from "../WorkTechnologyBadge";

const mockScrollToSkill = vi.fn();
const mockTrack = vi.fn();
const mockUseMediaQuery = vi.fn(() => true);

vi.mock("@/cv/sections/Skills/anchors", () => ({
  scrollToSkill: (...args: unknown[]) => mockScrollToSkill(...args),
}));

vi.mock("@/analytics/events", () => ({
  trackWorkTechnologySkillClick: (...args: unknown[]) => mockTrack(...args),
}));

vi.mock("@mantine/hooks", () => ({
  useMediaQuery: () => mockUseMediaQuery(),
}));

describe("WorkTechnologyBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMediaQuery.mockReturnValue(true);
  });

  it("renders an unmapped technology as a static badge (not a button)", () => {
    renderWithProviders(
      <WorkTechnologyBadge technology="Java" company="Daitan Group" />,
    );
    const badge = screen.getByTestId("work-tech-badge-java");
    expect(badge.tagName).not.toBe("BUTTON");
    expect(screen.getByText("Java")).toBeInTheDocument();
  });

  it("renders a mapped technology as a button with the same badge styling as unmapped", () => {
    renderWithProviders(
      <>
        <WorkTechnologyBadge technology="Java" company="Daitan Group" />
        <WorkTechnologyBadge technology="TypeScript" company="Pinterest" />
      </>,
    );
    const unmapped = screen.getByTestId("work-tech-badge-java");
    const mapped = screen.getByRole("button", {
      name: /View TypeScript skill — Advanced, 4 of 5 stars/i,
    });

    for (const badge of [unmapped, mapped]) {
      expect(badge).toHaveClass("font-quicksand");
      expect(badge).toHaveClass("bg-neutral-200");
      expect(badge).toHaveClass("text-neutral-900");
    }
  });

  it("navigates immediately on desktop click", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <WorkTechnologyBadge technology="TypeScript" company="Pinterest" />,
    );
    await user.click(
      screen.getByRole("button", { name: /View TypeScript skill/i }),
    );
    expect(mockScrollToSkill).toHaveBeenCalledTimes(1);
    expect(mockScrollToSkill.mock.calls[0][0].name).toBe("TypeScript");
    expect(mockTrack).toHaveBeenCalledWith({
      technology: "TypeScript",
      skill: "TypeScript",
      company: "Pinterest",
    });
  });

  it("shows hint on first touch tap and navigates on second tap", async () => {
    mockUseMediaQuery.mockReturnValue(false);
    const user = userEvent.setup();
    renderWithProviders(
      <WorkTechnologyBadge technology="TypeScript" company="Pinterest" />,
    );
    const btn = screen.getByRole("button", { name: /View TypeScript skill/i });

    await user.click(btn);
    expect(mockScrollToSkill).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText("Tap again to see skill")).toBeInTheDocument();
    });

    await user.click(btn);
    expect(mockScrollToSkill).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledTimes(1);
  });
});
