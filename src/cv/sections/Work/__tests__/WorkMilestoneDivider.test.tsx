import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/render";

import { WorkMilestoneDivider } from "../WorkMilestoneDivider";

describe("WorkMilestoneDivider", () => {
  it("renders milestone text as a note divider without work-entry test id", () => {
    renderWithProviders(
      <WorkMilestoneDivider text="2026 — Looking for new opportunities." />,
    );
    expect(screen.getByText(/2026 — Looking/)).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveAttribute(
      "aria-label",
      "2026 — Looking for new opportunities.",
    );
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    expect(screen.queryByTestId(/work-entry/)).not.toBeInTheDocument();
  });

  it("uses a white background to mask the spine behind milestone text", () => {
    renderWithProviders(
      <WorkMilestoneDivider text="2026 — Looking for new opportunities." />,
    );
    expect(screen.getByTestId("work-milestone")).toHaveClass("bg-white");
  });
});
