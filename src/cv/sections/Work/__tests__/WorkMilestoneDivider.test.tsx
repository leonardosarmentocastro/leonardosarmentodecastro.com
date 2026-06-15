import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/render";

import { WorkMilestoneDivider } from "../WorkMilestoneDivider";

describe("WorkMilestoneDivider", () => {
  it("renders milestone text and a separator without work-entry test id", () => {
    renderWithProviders(
      <WorkMilestoneDivider text="2026 — Looking for new opportunities." />,
    );
    expect(screen.getByText(/2026 — Looking/)).toBeInTheDocument();
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(screen.queryByTestId(/work-entry/)).not.toBeInTheDocument();
  });
});
