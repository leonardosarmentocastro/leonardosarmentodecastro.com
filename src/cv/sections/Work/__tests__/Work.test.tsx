import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { act, renderWithProviders, screen, within } from "@/test/render";
import { workEntryAnchorId } from "../anchors";
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

  it("anchors each work entry with its workEntryAnchorId", () => {
    renderWithProviders(<Work />);
    for (const w of RESUME.workExperience) {
      const card = screen.getByTestId(`work-entry-${w.company}`);
      expect(card).toHaveAttribute("id", workEntryAnchorId(w));
    }
  });

  it("renders a tech icon inside badges for technologies with mapped aliases", () => {
    renderWithProviders(<Work />);
    // Pinterest entry has "React.js" which maps to the "react" icon
    const entry = screen.getByTestId("work-entry-Pinterest");
    const icons = entry.querySelectorAll('span[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
    expect(icons[0]?.innerHTML).toContain("<svg");
  });

  it("still renders badge text for technologies with no mapped icon", () => {
    renderWithProviders(<Work />);
    // "Pinterest Gestalt" is in UNMAPPED_ALIASES — badge renders text only
    const entry = screen.getByTestId("work-entry-Pinterest");
    expect(within(entry).getByText("Pinterest Gestalt")).toBeInTheDocument();
  });

  it("opens the matching accordion when cv:open-work-entry is dispatched", () => {
    renderWithProviders(<Work />);
    const first = RESUME.workExperience[0];
    const anchorId = workEntryAnchorId(first);
    const card = screen.getByTestId(`work-entry-${first.company}`);
    const button = within(card).getByRole("button");

    expect(button).toHaveAttribute("aria-expanded", "false");

    act(() => {
      document.dispatchEvent(
        new CustomEvent("cv:open-work-entry", { detail: anchorId }),
      );
    });

    expect(button).toHaveAttribute("aria-expanded", "true");
  });
});
