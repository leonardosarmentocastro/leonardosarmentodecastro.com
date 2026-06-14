import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/render";

import { CVPage } from "../CVPage";

describe("CVPage", () => {
  it("renders all six sections in order", () => {
    renderWithProviders(<CVPage />);

    const sectionIds = [
      "hero",
      "about",
      "work",
      "education",
      "skills",
      "contact",
    ];
    const positions = sectionIds.map((id) => {
      const node = document.getElementById(id);
      expect(node).not.toBeNull();
      return node ? node.compareDocumentPosition(document.body) : 0;
    });

    // Walk pair-wise: each section should appear before the next in DOM order.
    for (let i = 1; i < sectionIds.length; i++) {
      const previous = document.getElementById(sectionIds[i - 1]);
      const current = document.getElementById(sectionIds[i]);
      expect(previous && current).toBeTruthy();
      if (previous && current) {
        const mask = previous.compareDocumentPosition(current);
        // Node.DOCUMENT_POSITION_FOLLOWING === 4
        expect(mask & 4).toBeTruthy();
      }
    }

    // Silence unused-array lint.
    expect(positions.length).toBe(6);
  });

  it("renders the Dock", () => {
    renderWithProviders(<CVPage />);
    expect(
      screen.getByRole("navigation", { name: /cv quick actions/i }),
    ).toBeInTheDocument();
  });
});
