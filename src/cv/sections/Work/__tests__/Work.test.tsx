import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { renderWithProviders, screen, within } from "@/test/render";

import { Work } from "../Work";

describe("Work", () => {
  it("renders a Work Experience heading", () => {
    renderWithProviders(<Work />);
    expect(
      screen.getByRole("heading", { level: 2, name: /work experience/i }),
    ).toBeInTheDocument();
  });

  it("renders every company name", () => {
    renderWithProviders(<Work />);
    for (const w of RESUME.workExperience) {
      expect(screen.getByText(w.company)).toBeInTheDocument();
    }
  });

  it("renders the first work entry's role, date range, description, and at least one bullet/tech", () => {
    renderWithProviders(<Work />);
    const first = RESUME.workExperience[0];
    const card = screen.getByTestId(`work-entry-${first.company}`);
    expect(within(card).getByText(first.role)).toBeInTheDocument();
    expect(
      within(card).getByText(
        new RegExp(`${first.startDate}.*${first.endDate}`),
      ),
    ).toBeInTheDocument();
    expect(within(card).getByText(first.description)).toBeInTheDocument();
    expect(within(card).getByText(first.bullets[0])).toBeInTheDocument();
    expect(within(card).getByText(first.technologies[0])).toBeInTheDocument();
  });

  it("renders every milestone text somewhere in the section", () => {
    renderWithProviders(<Work />);
    for (const m of RESUME.milestones) {
      expect(screen.getByText(m.text)).toBeInTheDocument();
    }
  });
});
