import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { renderWithProviders, screen } from "@/test/render";

import { Education } from "../Education";

describe("Education", () => {
  it("renders an Education heading", () => {
    renderWithProviders(<Education />);
    expect(
      screen.getByRole("heading", { level: 2, name: /^education$/i }),
    ).toBeInTheDocument();
  });

  it("renders every education entry's school, degree, and period", () => {
    renderWithProviders(<Education />);
    for (const e of RESUME.education) {
      expect(screen.getByText(e.school)).toBeInTheDocument();
      expect(screen.getByText(e.degree)).toBeInTheDocument();
      expect(screen.getByText(e.period)).toBeInTheDocument();
    }
  });
});
