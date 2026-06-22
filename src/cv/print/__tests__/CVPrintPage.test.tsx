import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { CVPrintPage } from "../CVPrintPage";

describe("CVPrintPage", () => {
  it("renders the print CV: no hero icons, no Get-in-Touch, Contact present, work expanded", () => {
    renderWithProviders(<CVPrintPage />);
    expect(screen.queryByLabelText(/linkedin/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /get in touch/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^contact$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /work experience/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("work-print-node").length).toBeGreaterThan(0);
    expect(screen.getByTestId("company-logo-static")).toBeInTheDocument();
  });
});
