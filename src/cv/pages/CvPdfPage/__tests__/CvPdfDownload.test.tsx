import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/render";
import { CvPdfDownload } from "../CvPdfDownload";

describe("CvPdfDownload", () => {
  it("renders a visible fallback link to the download route", () => {
    renderWithProviders(<CvPdfDownload />);
    const link = screen.getByRole("link", { name: /download pdf/i });
    expect(link).toHaveAttribute("href", "/cv/pdf/download");
  });

  it("tells the visitor the download starts automatically", () => {
    renderWithProviders(<CvPdfDownload />);
    expect(screen.getByText(/start(s)? automatically/i)).toBeInTheDocument();
  });
});
