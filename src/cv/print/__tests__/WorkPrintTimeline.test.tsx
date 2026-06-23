import { describe, expect, it } from "vitest";
import { RESUME } from "@/cv/data";
import { renderWithProviders, screen } from "@/test/render";
import { WorkPrintTimeline } from "../WorkPrintTimeline";

describe("WorkPrintTimeline", () => {
  it("renders every work entry expanded (descriptions visible)", () => {
    renderWithProviders(<WorkPrintTimeline />);
    for (const entry of RESUME.workExperience) {
      expect(screen.getByText(entry.description)).toBeInTheDocument();
    }
  });

  it("renders one centered spine node per work entry", () => {
    renderWithProviders(<WorkPrintTimeline />);
    expect(screen.getAllByTestId("work-print-node")).toHaveLength(
      RESUME.workExperience.length,
    );
  });

  it("renders milestone text", () => {
    renderWithProviders(<WorkPrintTimeline />);
    expect(
      screen.getByText(/Looking for new opportunities/i),
    ).toBeInTheDocument();
  });

  it("starts the work section on a fresh print page", () => {
    renderWithProviders(<WorkPrintTimeline />);
    // The first (large) card cannot fit in the leftover space under Contact,
    // so it would otherwise jump to the next page and leave a big gap. Forcing
    // a page break before the section keeps it starting at the top of a page.
    const section = document.getElementById("work");
    expect(section).not.toBeNull();
    expect(section).toHaveClass("cv-print-page-break-before");
  });

  it("marks each work entry as an unbreakable block for print pagination", () => {
    renderWithProviders(<WorkPrintTimeline />);
    const entries = screen.getAllByTestId("work-print-entry");
    expect(entries).toHaveLength(RESUME.workExperience.length);
    // The class is the contract the print stylesheet hangs `break-inside: avoid`
    // off of, so a card never starts near a page bottom and splits across pages.
    for (const entry of entries) {
      expect(entry).toHaveClass("cv-print-work-entry");
    }
  });
});
